const imagesRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const spotInstances = require('../utils/spotInstances')
const migrationHelper = require('../utils/migrationHelper')
const {v4: uuidv4 } = require('uuid')
const authenticationHelper = require('../utils/authenticationHelper')
const sshConnection = require('../utils/sshConnectionEC2')
const scheduler = require('../utils/scheduler')
const fileHelper = require('../utils/fileHelper')

imagesRouter.get('/', async(request, response, next) => {

  try{
    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }

    let responseArray = await databaseHelper.selectByUserId(parameters.imageTableValues, parameters.imageTableName, user.rowid)
    await new Promise(async (resolve) => {
      for(let a = 0; a < responseArray.length; a++){
        if(responseArray[a].spotInstanceId !== null){
          responseArray[a].state = await spotInstances.getInstanceState(responseArray[a].zone, [responseArray[a].spotInstanceId]) 
        }else{
          responseArray[a].state = responseArray[a].simulation === 0 ? 'pending' : 'simulation'
        }
        if(responseArray[a].state === 'stopped' || responseArray[a].state === 'stopping'){
          await databaseHelper.updateById(parameters.imageTableName, 'status = ?, updatedAt = ?', ['stopped', Date.now(), responseArray[a].rowid])
          responseArray[a].status = 'stopped'
        }
        if(a + 1 === responseArray.length){
          resolve()
        }
      }
      if(responseArray.length === 0){
        resolve()
      }
    })
    return response.status(200).json(responseArray)


  }catch(exception){
    next(exception)
  }

})

imagesRouter.post('/startinformation/', async(request, response, next) => {

  try{

    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }

    const body = request.body
    const imageId = body.imageId
    const port = body.port
    const bidprice = body.bidprice
    const simulation = body.simulation === false ? 0 : 1

    const code = await databaseHelper.updateById(parameters.imageTableName, 'status = ?, port = ?, bidprice = ?, simulation = ?, updatedAt = ?', [simulation === 0 ? 'booting' : 'simulation', port, bidprice, simulation, Date.now(), imageId])
    if(code === 500){
      return response.status(500).send(`Could not update ${imageId}`)
    }
    const imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, imageId)
    const modelRow = await databaseHelper.selectById(parameters.modelTableValues, parameters.modelTableName, imageRow.modelId)
    if(migrationHelper.newInstance(modelRow, imageRow, user))
      return response.status(200).json(imageRow)
    else
      return response.status(500)

  }catch(exception){
    next(exception)
  }

})

imagesRouter.get('/:rowid', async(request,response, next) => {

  const rowid = request.params.rowid
  try{

    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }

    let outcome = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, rowid)
    if(outcome === null){
      response.status(500).send(`Could not retrieve rowid ${rowid}`)
    }else{
      response.status(200).json(outcome)
    }

  }catch(exception){
    next(exception)
  }
})

imagesRouter.get('/reboot/:rowid', async(request, response, next) => {
  const rowid = request.params.rowid
  try{
    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }
    
    let imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, rowid)

    if(imageRow === null){
      return response.status(500).send('Image does not exist')
    }
    await migrationHelper.rebootInstance(imageRow)

    return response.status(200).json(imageRow)


  }catch(exception){
    next(exception)
  }
})

imagesRouter.get('/stop/instance/:rowid', async(request, response, next) => {
  const rowid = request.params.rowid
  try{
    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }
    
    let imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, rowid)

    if(imageRow === null){
      return response.status(500).send('Image does not exist')
    }
    
    await spotInstances.stopInstance(imageRow.spotInstanceId, imageRow.zone)
    await databaseHelper.updateById(parameters.imageTableName, 'status = ?, manually = ?, updatedAt = ?', ['stopped', 1, Date.now(), imageRow.rowid])
    let newRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, imageRow.rowid)
    newRow.state = 'stopping'

    scheduler.cancelScheduler(newRow)

    return response.status(200).json(newRow)


  }catch(exception){
    return response.status(500).send('Can not stop instance')
  }
})

imagesRouter.get('/start/instance/:rowid', async(request, response, next) => {
  const rowid = request.params.rowid
  try{
    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }
    
    let imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, rowid)

    if(imageRow === null){
      return response.status(500).send('Image does not exist')
    }

    const modelRow = await databaseHelper.selectById(parameters.modelTableValues, parameters.modelTableName, imageRow.modelId)
    const migrationRows = await databaseHelper.selectIsNull(parameters.migrationTableValues, parameters.migrationTableName, 'newZone')
    const migRow = migrationRows.filter(row => row.imageId === imageRow.rowid)[0]
    await spotInstances.startInstance(imageRow.spotInstanceId, imageRow.zone)
    scheduler.cancelScheduler(imageRow)
    await migrationHelper.setSchedulerAgain(imageRow, modelRow, user, migRow.updatedAt)

    await databaseHelper.updateById(parameters.imageTableName, 'status = ?, manually = ?, updatedAt = ?', ['booting', 0, Date.now(), imageRow.rowid])

    let newImage = await databaseHelper.selectById(parameters.imageTableValues, parameters. imageTableName, imageRow.rowid)
    newImage.state = 'pending'

    await response.status(200).send(newImage)

    await spotInstances.waitForInstanceToBoot([imageRow.spotInstanceId])
    await spotInstances.getPublicIpFromRequest([imageRow.spotInstanceId], imageRow.rowid)
    newImage = await databaseHelper.selectById(parameters.imageTableValues, parameters. imageTableName, imageRow.rowid)

    await migrationHelper.startDocker(newImage.ip, newImage.key)
    await databaseHelper.updateById(parameters.imageTableName, 'status = ?, updatedAt = ?', ['running', Date.now(), imageRow.rowid])


  
  }catch(exception){
    console.log(exception)
    response.status(500).send('Can not start instance')

  }
})

imagesRouter.get('/start/docker/:rowid', async(request, response, next) => {
  const rowid = request.params.rowid
  try{
    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }
    
    let imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, rowid)

    if(imageRow === null){
      return response.status(500).send('Image does not exist')
    }
    
    await sshConnection.startDocker(imageRow.ip, imageRow.key)
    
    const params = ['running', Date.now(), imageRow.rowid]
    const values = 'status = ?, updatedAt = ?'
    await databaseHelper.updateById(parameters.imageTableName, values, params)
    imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, rowid)
    
    imageRow.state = await spotInstances.getInstanceState(imageRow.zone, [imageRow.spotInstanceId])
    return response.status(200).send(imageRow)


  }catch(exception){
    return response.status(500).send('Can not start docker')

  }
})

imagesRouter.get('/stop/docker/:rowid', async(request, response, next) => {
  const rowid = request.params.rowid
  try{
    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }
    
    let imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, rowid)

    if(imageRow === null){
      return response.status(500).send('Image does not exist')
    }
    await sshConnection.endDocker(imageRow.ip, imageRow.key)
    const params = ['stopped', Date.now(), imageRow.rowid]
    const values = 'status = ?, updatedAt = ?'
    await databaseHelper.updateById(parameters.imageTableName, values, params)
    imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, rowid)
    imageRow.state = await spotInstances.getInstanceState(imageRow.zone, [imageRow.spotInstanceId])

    return response.status(200).json(imageRow)


  }catch(exception){
    return response.status(500).send('Can not stop docker')
  }
})

imagesRouter.put('/:rowid', async(request, response, next) => {

  const rowid = request.params.rowid
  const body = request.body

  const status = await databaseHelper.updateById(parameters.imageTableName, 'modelId = ?, zone = ?, path = ?, ip = ?, key = ?, updatedAt = ?', [body.modelId, body.zone, body.path, body.ip, body.key, Date.now(), rowid])
  if(status === 500){
    response.status(500).send(err.message)
  }else{
    response.status(200).send('Successfully updated')
  }
})



imagesRouter.post('/', async(request, response, next) => {

  const user = await authenticationHelper.isLoggedIn(request.token)
  if(user == undefined){
    return response.status(401).send('Not Authenticated')
  }

  if (!request.files || Object.keys(request.files).length === 0) {
    return response.status(400).send('No files were uploaded.')
  }

  let files = []
  if(request.files.file.length === undefined){
    files = files.concat(request.files.file)
  }else{
    files = request.files.file
  }

  const path = `${parameters.workDir}/images/all/${uuidv4()}`

  fileHelper.createPath(path)

  const modelId = files[0].name.split('_')[0]
  
  await new Promise((resolve) => {
    files.map(async file => {
      let answer = await fileHelper.createDirectory(path, file)
      if(!answer){
        response.status(500).send(`Could not store ${file.name}`)
      }
      if(file === files[files.length -1]){
        resolve()
      }
    })
  })
  
  const params = [0, null, null, null, null, null, null, user.rowid, null, modelId, null, null, null, path, null, null, Date.now(), Date.now()]
  const imageId = await databaseHelper.insertRow(parameters.imageTableName, '(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', params)
  if(imageId === -1){
    response.status(500).send(`${parameters.imageTableName}: Could not insert row`)
  }
  let keyFile = `${path}/${parameters.keyName}_${imageId}.pem`
  
  await databaseHelper.updateById(parameters.imageTableName, 'key = ?', [keyFile, imageId])

  const modelRow = await databaseHelper.selectById(parameters.modelTableValues, parameters.modelTableName, modelId)
  const imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, imageId)
  
  let installFile = null
  if(modelRow.product === 'Linux/UNIX'){
    installFile = parameters.linuxInstallFile
  }else if(modelRow.product === 'SUSE Linux'){
    installFile = parameters.suseInstallFile
  }else if(modelRow.product === 'Red Hat Enterprise Linux'){
    installFile = parameters.redInstallFile
  }

  fileHelper.copyFile(installFile, path, '/install.sh')
  fileHelper.copyFile(parameters.migrationFile, path, '/migration.sh')
  fileHelper.copyFile(parameters.engineInstallFile, path, '/engine_install.sh')

  if(imageRow === null){
    response.status(500).send(`${parameters.imageTableName}: Could not prepare message for sending`)
  }

  response.status(200).json(imageRow)
})


imagesRouter.delete('/:rowid', async(request, response, next) => {

  const user = await authenticationHelper.isLoggedIn(request.token)
  if(user == undefined){
    return response.status(401).send('Not Authenticated')
  }

  const rowid = request.params.rowid
  const imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, rowid)  
  if(imageRow.simulation === 0 && imageRow.zone !== null){
    migrationHelper.terminateInstance(imageRow)
  }
  await databaseHelper.deleteRowsByValue(parameters.billingTableName, imageRow.rowid, 'imageId')
  await databaseHelper.deleteRowsByValue(parameters.migrationTableName, imageRow.rowid, 'imageId')   
  await databaseHelper.deleteRowById(parameters.imageTableName, rowid)  
  migrationHelper.deletePredictions(imageRow)
  await fileHelper.deleteFolderRecursively(imageRow.path)
  if(imageRow.schedulerName !== null){
    scheduler.cancelScheduler(imageRow)
  }
  response.status(200).send('Successfully deleted')

})


module.exports = imagesRouter
