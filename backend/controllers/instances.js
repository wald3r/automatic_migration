const instancesRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')
const instancesTableHelper = require('../utils/instancesTableHelper')


instancesRouter.get('/', async(request, response, next) => {

  try{

    const db = databaseHelper.openDatabase()
    let responseArray = []
    await new Promise((resolve, reject) => {
      db.serialize(async (callback) => {
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
    databaseHelper.closeDatabase(db)
    return response.status(200).json(responseArray)


  }catch(exception){
    next(exception)
  }

})

instancesRouter.get('/:id', async(request,response, next) => {

  const id = request.params.id
  try{
    const db = databaseHelper.openDatabase()
    db.get(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName} WHERE rowid=${id}`, (err, row) => {
      if(err){
        response.status(500).send(err.message)
      }else if (row === undefined) {
        response.status(500).send(`No entry under rowid ${id}`)
      }else{
        console.log(row.rowid + ": " + row.createdAt + ', ' + row.bidprice + ', ' + row.updatedAt + ', ' + row.type + ', ' + row.product + ', ' + row.worldwide + ', ' + row.region + ', ' + row.simulation)
        resObj = instancesTableHelper.createInstanceObject(row.rowid, row.type, row.product, row.bidprice, row.region, row.simulation, row.createdAt, row.updatedAt)
        response.status(200).json(resObj)
      }
      
    })
    databaseHelper.closeDatabase(db)

  }catch(exception){
    next(exception)
  }
})


instancesRouter.post('/', async(request, response, next) => {

  const body = request.body
  console.log(body)
  try{
    const db = databaseHelper.openDatabase()
    db.serialize(() => {
      const stmt = db.prepare(`INSERT INTO ${parameters.instanceTableName} VALUES (?, ?, ?, ?, ?, ?, ?)`)
      stmt.run(body.type, body.product, body.bidprice, body.region, body.simulation, timeHelper.utc_timestamp, timeHelper.utc_timestamp)    
      stmt.finalize()
    })
    response.status(200).send('Successfully added!')

    databaseHelper.closeDatabase(db)
    
  }catch(exception){
    return response.status(500).send(exception.message)
  }
  

})

instancesRouter.delete('/:id', async(request, response, next) => {

  const id = request.params.id

  const db = databaseHelper.openDatabase()
  db.run(`DELETE FROM ${parameters.instanceTableName} WHERE rowid=?`, id, (err) => {
    if (err) {
      console.error(err.message)
      response.status(500).send(err.message)
    }else{
      console.log(`Row deleted ${id}`)
      response.status(200).send('Successfully deleted')
    }
    
  })

  databaseHelper.closeDatabase(db)


})


module.exports = instancesRouter
