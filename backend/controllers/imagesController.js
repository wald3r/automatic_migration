const imagesRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')
const spotInstances = require('../utils/spotInstances')
const migrationHelper = require('../utils/migrationHelper')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const fileHelper = require('../utils/fileHelper')
const authenticationHelper = require('../utils/authenticationHelper')



imagesRouter.get('/', async(request, response, next) => {

  try{

    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }

    const db = await databaseHelper.openDatabase()
    let responseArray = await databaseHelper.selectByUserId(db, parameters.imageTableValues, parameters.imageTableName, user.rowid)
    
    await new Promise(async (resolve) => {
      for(let a = 0; a < responseArray.length; a++){
        if(responseArray[0].spotInstanceId !== null){
          responseArray[a].state = await spotInstances.getInstanceState(responseArray[a].zone, [responseArray[a].spotInstanceId])
        }
        if(a + 1 === responseArray.length){
          resolve()
        }
      }
    })
    
    await databaseHelper.closeDatabase(db)
    return response.status(200).json(responseArray)


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

    const db = await databaseHelper.openDatabase()
    let outcome = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, rowid)
    if(outcome === null){
      response.status(500).send(`Could not retrieve rowid ${rowid}`)
    }else{
      response.status(200).json(outcome)
    }
    await databaseHelper.closeDatabase(db)

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
    
    const db = await databaseHelper.openDatabase()
    let imageRow = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, rowid)
    await databaseHelper.closeDatabase(db)

    if(imageRow === null){
      return response.status(500).send('Image does not exist')
    }
    await migrationHelper.rebootInstance(imageRow)

    return response.status(200).json(imageRow)


  }catch(exception){
    next(exception)
  }
})

imagesRouter.get('/stop/:rowid', async(request, response, next) => {
  const rowid = request.params.rowid
  try{
    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }
    
    const db = await databaseHelper.openDatabase()
    let imageRow = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, rowid)
    await databaseHelper.closeDatabase(db)

    if(imageRow === null){
      return response.status(500).send('Image does not exist')
    }
    
    await spotInstances.stopInstance(imageRow.spotInstanceId, imageRow.zone)
      
    imageRow.state = 'stopping'
    return response.status(200).json(imageRow)


  }catch(exception){
    return response.status(500).send('Can not stop instance')
  }
})

imagesRouter.get('/start/:rowid', async(request, response, next) => {
  const rowid = request.params.rowid
  try{
    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }
    
    const db = await databaseHelper.openDatabase()
    let imageRow = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, rowid)
    await databaseHelper.closeDatabase(db)

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

imagesRouter.put('/:rowid', async(request, response, next) => {

  const rowid = request.params.rowid
  const body = request.body
  db = await databaseHelper.openDatabase()
  const params = [body.instanceId, body.zone, body.path, body.ip, body.key, timeHelper.utc_timestamp, rowid]
  const values = 'instanceId = ?, zone = ?, path = ?, ip = ?, key = ?, updatedAt = ?'
  const status = await databaseHelper.updateById(db, parameters.imageTableName, values, params)
  if(status === 500){
    response.status(500).send(err.message)
  }else{
    response.status(200).send('Successfully updated')
  }
    
  await databaseHelper.closeDatabase(db)

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

  const instanceId = files[0].name.split('_')[0]
  let keyFile = path+'/'+parameters.keyFileName

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
  
  db = await databaseHelper.openDatabase()
  const params = [null, user.rowid, 'booting', instanceId, null, null, null, path, null, keyFile, timeHelper.utc_timestamp, timeHelper.utc_timestamp]
  const imageId = await databaseHelper.insertRow(db, parameters.imageTableName, '(NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', params)
  if(imageId === -1){
    response.status(500).send(`${parameters.imageTableName}: Could not insert row`)
  }

  const instanceRow = await databaseHelper.selectById(db, parameters.instanceTableValues, parameters.instanceTableName, instanceId)
  const imageRow = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, imageId)

  if(imageRow === null){
    response.status(500).send(`${parameters.imageTableName}: Could not prepare message for sending`)
  }

  migrationHelper.newInstance(instanceRow, imageRow)

  response.status(200).json(imageRow)
  await databaseHelper.closeDatabase(db)
})


imagesRouter.delete('/:rowid', async(request, response, next) => {

  const user = await authenticationHelper.isLoggedIn(request.token)
  if(user == undefined){
    return response.status(401).send('Not Authenticated')
  }

  const rowid = request.params.rowid
  const db = await databaseHelper.openDatabase()
  console.log(rowid)
  const imageRow = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, rowid)
  console.log(imageRow)
  let instanceRow
  if(imageRow.instanceId !== null){
    instanceRow = await databaseHelper.selectById(db, parameters.instanceTableValues, parameters.instanceTableName, imageRow.instanceId)
    if(instanceRow.simulation === 0){
      migrationHelper.terminateInstance(imageRow)
    }
  }
  await databaseHelper.deleteRowById(db, parameters.imageTableName, rowid)     
  migrationHelper.deletePredictions(imageRow)
  await fileHelper.deleteFolderRecursively(imageRow.path)
  response.status(200).send('Successfully deleted')
  await databaseHelper.closeDatabase(db)

})


module.exports = imagesRouter
