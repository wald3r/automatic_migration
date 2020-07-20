const modelsRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')
const mlModel = require('../utils/mlModel')
const authenticationHelper = require('../utils/authenticationHelper')
const migrationHelper = require('../utils/migrationHelper')
const fileHelper = require('../utils/fileHelper')

modelsRouter.get('/', async(request, response, next) => {

  try{

    const db = await databaseHelper.openDatabase()
    let responseArray = await databaseHelper.selectAllRows(db, parameters.modelTableValues, parameters.modelTableName)
    await databaseHelper.closeDatabase(db)
    return response.status(200).json(responseArray)


  }catch(exception){
    next(exception)
  }

})

modelsRouter.get('/:rowid', async(request,response, next) => {

  const rowid = request.params.rowid
  try{

    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }

    const db = await databaseHelper.openDatabase()
    let row = await databaseHelper.selectById(db, parameters.modelTableValues, parameters.modelTableName, rowid)
    if(row === null){
      response.status(500).send(`Could not retrieve rowid ${rowid}`)
    }else{
      response.status(200).json(row)
    }
    await databaseHelper.closeDatabase(db)

  }catch(exception){
    next(exception)
  }
})


modelsRouter.put('/:rowid', async(request, response, next) => {

  const rowid = request.params.rowid
  const body = request.body
  db = await databaseHelper.openDatabase()
  const params = [body.bidprice, body.type, body.product, body.region, body.simulation, timeHelper.utc_timestamp, body.status, rowid]
  const values = 'bidprice = ?, type = ?, product = ?, region = ?, simulation = ?, updatedAt = ?, status = ?'
  const status = await databaseHelper.updateById(db, parameters.modelTableName, values, params)
  if(status === 500){
    response.status(500).send('Update did not work')
  }else{
    response.status(200).send('Successfully updated')
  }
  await databaseHelper.closeDatabase(db)

})



modelsRouter.post('/', async(request, response, next) => {

  const body = request.body
  try{
    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }

    let outcome = undefined
    let db = await databaseHelper.openDatabase()
    await new Promise((resolve, reject) => {
      db.get(`SELECT ${parameters.modelTableValues} FROM ${parameters.modelTableName} WHERE 
        type = '${body.type}' AND
        product = '${body.product}' AND
        simulation = '${body.simulation}'`, (err ,row) => {
        if(err){
          console.error(`${parameters.modelTableName}: ${err.message}`)
          reject()
        }else{
          outcome = row
          resolve()
        }
      })
    })

    if(outcome === undefined){

      let list = []
      const params = [body.type, body.product, body.bidprice, body.region, body.simulation, 'training', timeHelper.utc_timestamp, timeHelper.utc_timestamp]
      const modelId = await databaseHelper.insertRow(db, parameters.modelTableName, '(null, ?, ?, ?, ?, ?, ?, ?, ?)', params)
      if(modelId === -1){
        response.status(500).send(`${parameters.modelTableName}: Could not insert row`)
      }
      const model = await databaseHelper.selectById(db, parameters.modelTableValues, parameters.modelTableName, modelId)
      if(model === null){
        response.status(500).send(`${parameters.modelTableName}: Could not prepare message for sending`)
      }
      response.status(200).json(model)
    
      if(process.env.NODE_ENV !== 'test'){ 
        await mlModel.trainModel(body.type, body.product, body.simulation)
      }
    }else{
      response.status(500).send('Model already exists!')
    }
    await databaseHelper.closeDatabase(db)
    

  }catch(exception){
    return response.status(500).send(exception.message)
  }
  

})


modelsRouter.delete('/:rowid', async(request, response, next) => {

  const user = await authenticationHelper.isLoggedIn(request.token)
  if(user == undefined){
    return response.status(401).send('Not Authenticated')
  }

  const rowid = request.params.rowid
  const db = await databaseHelper.openDatabase()
  await databaseHelper.deleteRowById(db, parameters.modelTableName, rowid)
  const responseArray = await databaseHelper.selectByValue(db, parameters.imageTableValues, parameters.imageTableName, 'modelId', rowid)
  if(responseArray.length !== 0){
    await responseArray.map(async image => {
      migrationHelper.deletePredictions(image)
      await migrationHelper.terminateInstance(image)
      await fileHelper.deleteFolderRecursively(image.path)
      await databaseHelper.deleteRowsByValue(db, parameters.billingTableName, image.rowid, 'imageId') //on delete cascade alternative
    })
  }
  await databaseHelper.deleteRowsByValue(db, parameters.imageTableName, rowid, 'modelId') //on delete cascade alternative
  if(process.env.NODE_ENV !== 'test'){
    mlModel.deleteModel(request.body.obj.type, request.body.obj.product)
  }
  response.status(200).send('Successfully deleted')
  await databaseHelper.closeDatabase(db)

})


module.exports = modelsRouter
