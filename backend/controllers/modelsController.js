const modelsRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const mlModel = require('../utils/mlModel')
const authenticationHelper = require('../utils/authenticationHelper')
const migrationHelper = require('../utils/migrationHelper')
const fileHelper = require('../utils/fileHelper')

modelsRouter.get('/', async(request, response, next) => {

  try{

    let responseArray = await databaseHelper.selectAllRows(parameters.modelTableValues, parameters.modelTableName)
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
    let row = await databaseHelper.selectById(parameters.modelTableValues, parameters.modelTableName, rowid)
    if(row === null){
      response.status(500).send(`Could not retrieve rowid ${rowid}`)
    }else{
      response.status(200).json(row)
    }

  }catch(exception){
    next(exception)
  }
})


modelsRouter.put('/:rowid', async(request, response, next) => {

  const rowid = request.params.rowid
  const body = request.body
  const params = [wbody.type, body.product, body.region, Date.now(), body.status, rowid]
  const values = 'type = ?, product = ?, region = ?, updatedAt = ?, status = ?'
  const status = await databaseHelper.updateById(parameters.modelTableName, values, params)
  if(status === 500){
    response.status(500).send('Update did not work')
  }else{
    response.status(200).send('Successfully updated')
  }

})



modelsRouter.post('/', async(request, response, next) => {

  const body = request.body
  try{
    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }

    let outcome = await databaseHelper.selectRowByValues(parameters.modelTableValues, parameters.modelTableName, 'type = ? AND product = ?', [body.type, body.product])
    if(outcome === null){
      const params = [body.type, body.product, body.region, 'training', Date.now(), Date.now()]
      const modelId = await databaseHelper.insertRow(parameters.modelTableName, '(null, ?, ?, ?, ?, ?, ?)', params)
      if(modelId === -1){
        response.status(500).send(`${parameters.modelTableName}: Could not insert row`)
      }
      const model = await databaseHelper.selectById(parameters.modelTableValues, parameters.modelTableName, modelId)
      if(model === null){
        response.status(500).send(`${parameters.modelTableName}: Could not prepare message for sending`)
      }
      response.status(200).json(model)
    
      if(process.env.NODE_ENV !== 'test'){ 
        await mlModel.trainModel(body.type, body.product)
      }
    }else{
      response.status(500).send('Model already exists!')
    }
    

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
  await databaseHelper.deleteRowById(parameters.modelTableName, rowid)
  const responseArray = await databaseHelper.selectByValue(parameters.imageTableValues, parameters.imageTableName, 'modelId', rowid)
  if(responseArray.length !== 0){
    await responseArray.map(async image => {
      migrationHelper.deletePredictions(image)
      await migrationHelper.terminateInstance(image)
      await fileHelper.deleteFolderRecursively(image.path)
      await databaseHelper.deleteRowsByValue(parameters.billingTableName, image.rowid, 'imageId') //on delete cascade alternative
      await databaseHelper.deleteRowsByValue(parameters.migrationTableName, image.rowid, 'imageId') //on delete cascade alternative

    })
  }
  await databaseHelper.deleteRowsByValue(parameters.imageTableName, rowid, 'modelId') //on delete cascade alternative
  if(process.env.NODE_ENV !== 'test'){
    mlModel.deleteModel(request.body.obj.type, request.body.obj.product)
  }
  response.status(200).send('Successfully deleted')
})


module.exports = modelsRouter
