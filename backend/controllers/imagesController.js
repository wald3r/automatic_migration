const imagesRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')
const imagesTableHelper = require('../utils/imagesTableHelper')
const mlModel = require('../utils/mlModel')
const spotInstances = require('../utils/spotInstances')

imagesRouter.get('/', async(request, response, next) => {

  try{

    const db = await databaseHelper.openDatabase()
    let responseArray = await databaseHelper.selectAllRows(db, parameters.imageTableValues, parameters.imageTableName)
    await databaseHelper.closeDatabase(db)
    return response.status(200).json(responseArray)


  }catch(exception){
    next(exception)
  }

})

imagesRouter.get('/:rowid', async(request,response, next) => {

  const rowid = request.params.rowid
  try{
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

  const body = request.body
  db = await databaseHelper.openDatabase()
  const params = [body.instanceId, null, null, body.path, null, body.key, timeHelper.utc_timestamp, timeHelper.utc_timestamp]
  const imageId = await databaseHelper.insertRow(db, parameters.imageTableName, '(NULL, ?, ?, ?, ?, ?, ?, ?, ?)', params)
  if(imageId === -1){
    response.status(500).send(`${parameters.imageTableName}: Could not insert row`)
  }
  const instanceRow = await databaseHelper.selectById(db, parameters.instanceTableValues, parameters.instanceTableName, body.instanceId)
  mlModel.predictModel(instanceRow.type, instanceRow.product, instanceRow.simulation, instanceRow.bidprice, imageId)
  const imageRow = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, imageId)
  if(imageRow === null){
    response.status(500).send(`${parameters.imageTableName}: Could not prepare message for sending`)
  }
  response.status(200).json(imageRow)
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
  response.status(200).send('Successfully deleted')
  await databaseHelper.closeDatabase(db)

})


module.exports = imagesRouter
