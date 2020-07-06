const imagesRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')
const imagesTableHelper = require('../utils/imagesTableHelper')
const { mlDeleteFile } = require('../parameters')
const mlModel = require('../utils/mlModel')


imagesRouter.get('/', async(request, response, next) => {

  try{

    const db = await databaseHelper.openDatabase()
    let responseArray = await databaseHelper.selectAllRows(db, parameters.imageTableValues, parameters.imageTableName)
    responseArray = responseArray.map(row => imagesTableHelper.createImageObject(row.rowid, row.instanceId, row.zone, row.path, row.ip, row.key, row.createdAt, row.updatedAt))
    await databaseHelper.closeDatabase(db)
    return response.status(200).json(responseArray)


  }catch(exception){
    next(exception)
  }

})

imagesRouter.get('/:id', async(request,response, next) => {

  const id = request.params.id
  try{
    const db = await databaseHelper.openDatabase()
    let outcome = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, id)
    if(outcome === null){
      response.status(500).send(`Could not retrieve rowid ${id}`)
    }else{
      response.status(200).json(outcome)
    }
    await databaseHelper.closeDatabase(db)

  }catch(exception){
    next(exception)
  }
})


imagesRouter.put('/:id', async(request, response, next) => {

  const id = request.params.id
  const body = request.body
  db = await databaseHelper.openDatabase()
  const params = [body.instanceId, body.zone, body.path, body.ip, body.key, timeHelper.utc_timestamp, id]
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
  const params = [body.instanceId, null, body.path, null, body.key, timeHelper.utc_timestamp, timeHelper.utc_timestamp]
  await databaseHelper.insertRow(db, parameters.imageTableName, '(?, ?, ?, ?, ?, ?, ?)', params)
  const row = await databaseHelper.selectById(db, parameters.instanceTableValues, parameters.instanceTableName, body.instanceId)
  mlModel.predictModel(row.type, row.product)
  let responseArray = await databaseHelper.selectAllRows(db, parameters.imageTableValues, parameters.imageTableName)
  responseArray = responseArray.map(row => imagesTableHelper.createImageObject(row.rowid, row.instanceId, row.zone, row.path, row.ip, row.key, row.createdAt, row.updatedAt))
  response.status(200).json(responseArray)
  await databaseHelper.closeDatabase(db)
})


imagesRouter.delete('/:id', async(request, response, next) => {

  const id = request.params.id
  const db = await databaseHelper.openDatabase()
  await databaseHelper.deleteRow(db, parameters.imageTableName, id)
  response.status(200).send('Successfully deleted')
  await databaseHelper.closeDatabase(db)

})


module.exports = imagesRouter
