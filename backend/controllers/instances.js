const instancesRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')
const instancesTableHelper = require('../utils/instancesTableHelper')


instancesRouter.get('/', async(request, response, next) => {

  try{

    const db = await databaseHelper.openDatabase()
    let responseArray = []
    await new Promise((resolve) => {
      db.serialize(async () => {
        db.all(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName}`, (err, rows) => {
          rows.map(row =>{
            console.log(row.rowid + ": " + row.createdAt + ', ' + row.updatedAt + ', ' + row.type + ', ' + row.product + ', ' + row.region + ', ' + row.simulation)
            resObj = instancesTableHelper.createInstanceObject(row.rowid, row.type, row.product, row.bidprice, row.region, row.simulation, row.createdAt, row.updatedAt)
            responseArray = responseArray.concat(resObj)
          })
          resolve(responseArray)
        })
      })
    })
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
    db.get(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName} WHERE rowid=${id}`, (err, row) => {
      if(err){
        response.status(500).send(`${parameters.instanceTableName}: ${err.message}`)
      }else if (row === undefined) {
        response.status(500).send(`No entry under rowid ${id}`)
      }else{
        console.log(row.rowid + ": " + row.createdAt + ', ' + row.bidprice + ', ' + row.updatedAt + ', ' + row.type + ', ' + row.product + ', ' + row.region + ', ' + row.simulation)
        resObj = instancesTableHelper.createInstanceObject(row.rowid, row.type, row.product, row.bidprice, row.region, row.simulation, row.createdAt, row.updatedAt)
        response.status(200).json(resObj)
      }
      
    })
    await databaseHelper.closeDatabase(db)

  }catch(exception){
    next(exception)
  }
})


instancesRouter.put('/:id', async(request, response, next) => {

  const id = request.params.id
  const body = request.body
  db = await databaseHelper.openDatabase()
  const params = [body.bidprice, body.type, body.product, body.region, body.simulation, timeHelper.utc_timestamp, id]
  await new Promise((resolve) => {
    db.run(`UPDATE ${parameters.instanceTableName} 
          SET bidprice = ?, type = ?, product = ?, region = ?, simulation = ?, updatedAt = ?
          WHERE rowid=?`, params,(err) => {
      if (err) {
        console.error(`${parameters.instanceTableName}: ${err.message}`)
        response.status(500).send(err.message)
        resolve()
      }else{
        console.log(`${parameters.instanceTableName}: Row updated ${id}`)
        response.status(200).send('Successfully updated')
        resolve()
      }
    })
  })
    
  await databaseHelper.closeDatabase(db)

})



instancesRouter.post('/', async(request, response, next) => {

  const body = request.body
  console.log(body)
  try{
    let db = await databaseHelper.openDatabase()
    db.serialize(() => {
      const stmt = db.prepare(`INSERT INTO ${parameters.instanceTableName} VALUES (?, ?, ?, ?, ?, ?, ?)`)
      stmt.run(body.type, body.product, body.bidprice, body.region, body.simulation, timeHelper.utc_timestamp, timeHelper.utc_timestamp)    
      stmt.finalize()
    })
    db.all(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName} WHERE 
        type = ${body.type}`, (err ,rows) => {
        if(err){
          response.status(500).send(`${parameters.instanceTableName}: ${err.message}`)
        }else{
          resObj = instancesTableHelper.createInstanceObject(rows.rowid, rows.type, rows.product, rows.bidprice, rows.region, rows.simulation, rows.createdAt, rows.updatedAt)
          console.log(resObj)
          response.status(200).json(resObj)
        }
    })
    await databaseHelper.closeDatabase(db)
    

  }catch(exception){
    return response.status(500).send(exception.message)
  }
  

})

instancesRouter.delete('/:id', async(request, response, next) => {

  const id = request.params.id

  const db = await databaseHelper.openDatabase()
  db.run(`DELETE FROM ${parameters.instanceTableName} WHERE rowid=?`, id, (err) => {
    if (err) {
      console.error(err.message)
      response.status(500).send(`${parameters.instanceTableName}: ${err.message}`)
    }else{
      console.log(`${parameters.instanceTableName}: Row deleted ${id}`)
      response.status(200).send('Successfully deleted')
    }
    
  })

  await databaseHelper.closeDatabase(db)

})


module.exports = instancesRouter
