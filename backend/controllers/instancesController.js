const instancesRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')
const instancesTableHelper = require('../utils/instancesTableHelper')
const mlModel = require('../utils/mlModel')

instancesRouter.get('/', async(request, response, next) => {

  try{

    const db = await databaseHelper.openDatabase()
    let responseArray = await databaseHelper.selectAllRows(db, parameters.instanceTableValues, parameters.instanceTableName)
    responseArray = responseArray.map(row => instancesTableHelper.createInstanceObject(row.rowid, row.type, row.product, row.bidprice, row.region, row.simulation, row.status, row.createdAt, row.updatedAt))
    await databaseHelper.closeDatabase(db)
    return response.status(200).json(responseArray)


  }catch(exception){
    next(exception)
  }

})

instancesRouter.get('/:id', async(request,response, next) => {

  const id = request.params.id
  try{
    const db = await databaseHelper.openDatabase()
    let row = await databaseHelper.selectById(db, parameters.instanceTableValues, parameters.instanceTableName, id)
    if(row === null){
      response.status(500).send(`Could not retrieve rowid ${id}`)
    }else{
      response.status(200).json(instancesTableHelper.createInstanceObject(row.rowid, row.type, row.product, row.bidprice, row.region, row.simulation, row.status, row.createdAt, row.updatedAt))
    }
    await databaseHelper.closeDatabase(db)

  }catch(exception){
    next(exception)
  }
})


instancesRouter.put('/:id', async(request, response, next) => {

  const id = request.params.id
  const body = request.body
  db = await databaseHelper.openDatabase()
  const params = [body.bidprice, body.type, body.product, body.region, body.simulation, timeHelper.utc_timestamp, body.status, id]
  const values = 'bidprice = ?, type = ?, product = ?, region = ?, simulation = ?, updatedAt = ?, status = ?'
  const status = await databaseHelper.updateById(db, parameters.instanceTableName, values, params)
  if(status === 500){
    response.status(500).send(err.message)
  }else{
    response.status(200).send('Successfully updated')
  }
  await databaseHelper.closeDatabase(db)

})



instancesRouter.post('/', async(request, response, next) => {

  const body = request.body
  console.log(body)
  try{
    let outcome = undefined
    let db = await databaseHelper.openDatabase()
    await new Promise((resolve, reject) => {
      db.get(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName} WHERE 
        type = '${body.type}' AND
        product = '${body.product}' AND
        simulation = '${body.simulation}'`, (err ,row) => {
        if(err){
          console.error(`${parameters.instanceTableName}: ${err.message}`)
          reject()
        }else{
          outcome = row
          resolve()
        }
      })
    })
    if(outcome === undefined){

      let list = []
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          const stmt = db.prepare(`INSERT INTO ${parameters.instanceTableName} VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)`)
          stmt.run(body.type, body.product, body.bidprice, body.region, body.simulation, 'training', timeHelper.utc_timestamp, timeHelper.utc_timestamp)    
          stmt.finalize()
          db.all(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName}`, (err ,rows) => {
              if(err){
                response.status(500).send(`${parameters.instanceTableName}: ${err.message}`)
                reject()
              }else{
                rows.map(row => {
                  let resObj = instancesTableHelper.createInstanceObject(row.rowid, row.type, row.product, row.bidprice, row.region, row.simulation, row.status, row.createdAt, row.updatedAt)
                  list.concat(resObj)
                })
              }
          })
          response.status(200).json(list)
          resolve()
        })
      })
      if(process.env.NODE_ENV !== 'test'){ 
        await mlModel.trainModel(body.type, body.product)
      }
    }else{
      response.status(500).send('Instance already exists!')
    }
    await databaseHelper.closeDatabase(db)
    

  }catch(exception){
    return response.status(500).send(exception.message)
  }
  

})

instancesRouter.delete('/:id', async(request, response, next) => {

  const id = request.params.id
  const db = await databaseHelper.openDatabase()
  await databaseHelper.deleteRowById(db, parameters.instanceTableName, id)
  await databaseHelper.deleteRowsByValue(db, parameters.imageTableName, id, 'instanceId') //on delete cascade alternative
  if(process.env.NODE_ENV !== 'test'){
    mlModel.deleteModel(request.body.obj.type, request.body.obj.product)
  }
  response.status(200).send('Successfully deleted')
  await databaseHelper.closeDatabase(db)

})


module.exports = instancesRouter
