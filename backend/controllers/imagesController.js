const imagesRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const spotInstances = require('../utils/spotInstances')
const migrationHelper = require('../utils/migrationHelper')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const fileHelper = require('../utils/fileHelper')
const authenticationHelper = require('../utils/authenticationHelper')
const sshConnection = require('../utils/sshConnection')


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
        if(a + 1 === responseArray.length){
          resolve()
        }
      }
    })
    console.log(responseArray)
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
    migrationHelper.newInstance(modelRow, imageRow, user)



    return response.status(200).json(imageRow)


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
    const params = ['stopped', Date.now(), imageRow.rowid]
    const values = 'status = ?, updatedAt = ?'
    await databaseHelper.updateById(parameters.imageTableName, values, params)
      
    imageRow.state = 'stopping'
    return response.status(200).json(imageRow)


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

    
    await spotInstances.startInstance(imageRow.spotInstanceId, imageRow.zone)
    imageRow.state = 'pending'
    return response.status(200).send(imageRow)

  
  }catch(exception){
    return response.status(500).send('Can not start instance')

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

  if (!fs.existsSync(path)){
    fs.mkdirSync(path, { recursive: true })
  } 

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
  
  const params = [null, null, null, null, user.rowid, null, modelId, null, null, null, path, null, null, Date.now(), Date.now()]
  const imageId = await databaseHelper.insertRow(parameters.imageTableName, '(null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', params)
  if(imageId === -1){
    response.status(500).send(`${parameters.imageTableName}: Could not insert row`)
  }
  let keyFile = `${path}/${parameters.keyName}_${imageId}.pem`
  
  await databaseHelper.updateById(parameters.imageTableName, 'key = ?', [keyFile, imageId])

  const modelRow = await databaseHelper.selectById(parameters.modelTableValues, parameters.modelTableName, modelId)
  const imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, imageId)

  if(modelRow.product === 'Linux/UNIX'){
    fs.copyFile(parameters.linuxInstallFile, path+'/install.sh', (err) => {
      if(err) console.log(`InstallScriptHelper: Could not copy file to ${path+'/install.sh'}`)
      else console.log(`InstallScriptHelper: Copied file to ${path+'/install.sh'}`)
    })
  }


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
  if(imageRow.simulation === 0){
    migrationHelper.terminateInstance(imageRow)
  }
  await databaseHelper.deleteRowsByValue(parameters.billingTableName, imageRow.rowid, 'imageId')
  await databaseHelper.deleteRowsByValue(parameters.migrationTableName, imageRow.rowid, 'imageId')   
  await databaseHelper.deleteRowById(parameters.imageTableName, rowid)  
  migrationHelper.deletePredictions(imageRow)
  await fileHelper.deleteFolderRecursively(imageRow.path)
  response.status(200).send('Successfully deleted')

})


module.exports = imagesRouter
