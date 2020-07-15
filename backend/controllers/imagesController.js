const imagesRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')
const mlModel = require('../utils/mlModel')
const spotInstances = require('../utils/spotInstances')
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
    let responseArray = await databaseHelper.selectAllRows(db, parameters.imageTableValues, parameters.imageTableName)

    /*
    responseArray = responseArray.map(instance => {
      const ec2 = await spotInstances.getEC2Object()
      let instanceIds = await spotInstances.getInstanceIds(instance.requestId, ec2)
      instanceIds.map(id => {
        let status = await spotInstances.getInstanceStatus(ec2, id)

      })
    })
    */
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

  const path = `${parameters.workDir}/images/all/${uuidv4()}`
  
  const user = await authenticationHelper.isLoggedIn(request.token)
  if(user == undefined){
    return response.status(401).send('Not Authenticated')
  }

  if (!request.files || Object.keys(request.files).length === 0) {
    return response.status(400).send('No files were uploaded.')
  }

  if (!fs.existsSync(path)){
    fs.mkdirSync(path, { recursive: true })
  } 


  let files = []
  if(request.files.file.length === undefined){
    files = files.concat(request.files.file)
  }else{
    files = request.files.file
  }
  console.log(files)
  const instanceId = files[0].name.split('_')[0]
  
  await new Promise((resolve) => {
    files.map(async file => {
      let answer = await fileHelper.createDirectory(path, file)
      if(!answer){
        response.status(500).send(`Could not store ${file.name}`)
      }
    })
  })
  /*
  const keyFile = `${path}/${instanceId}_automatic_migration.pem`
  db = await databaseHelper.openDatabase()
  const params = ['booting', instanceId, null, null, null, path, null, keyFile, timeHelper.utc_timestamp, timeHelper.utc_timestamp]
  const imageId = await databaseHelper.insertRow(db, parameters.imageTableName, '(NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', params)
  if(imageId === -1){
    response.status(500).send(`${parameters.imageTableName}: Could not insert row`)
  }
  const instanceRow = await databaseHelper.selectById(db, parameters.instanceTableValues, parameters.instanceTableName, instanceId)
  mlModel.predictModel(instanceRow.type, instanceRow.product, instanceRow.simulation, instanceRow.bidprice, imageId, path, keyFile)
  const imageRow = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, imageId)
  if(imageRow === null){
    response.status(500).send(`${parameters.imageTableName}: Could not prepare message for sending`)
  }
  response.status(200).json(imageRow)*/
  await databaseHelper.closeDatabase(db)
})


imagesRouter.delete('/:rowid', async(request, response, next) => {

  const rowid = request.params.rowid
  const db = await databaseHelper.openDatabase()
  const imageRow = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, rowid)
  const instanceRow = await databaseHelper.selectById(db, parameters.instanceTableValues, parameters.instanceTableName, imageRow.instanceId)
  await databaseHelper.deleteRowById(db, parameters.imageTableName, rowid)     
  if(instanceRow.simulation === 0){
    spotInstances.cancelSpotInstance(imageRow.requestId)
  }
  fileHelper.deleteFolderRecursively(imageRow.path)
  response.status(200).send('Successfully deleted')
  await databaseHelper.closeDatabase(db)

})


module.exports = imagesRouter
