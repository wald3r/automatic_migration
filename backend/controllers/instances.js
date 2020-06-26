const instancesRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')

const loadInstances = (db) => {

  
}


instancesRouter.get('/', async(request, response, next) => {

  try{

    const db = databaseHelper.openDatabase()
    let responseArray = []
    await new Promise((resolve, reject) => {
      db.serialize(async (callback) => {
        db.all(`SELECT rowid, type, product, worldwide, region, simulation, createdAt, updatedAt FROM ${parameters.instanceTableName}`, (err, rows) => {
          rows.map(row =>{
            console.log(row.rowid + ": " + row.createdAt + ', ' + row.updatedAt + ', ' + row.type + ', ' + row.product + ', ' + row.worldwide + ', ' + row.region + ', ' + row.simulation)
            let resObj = {
              id: row.rowid,
              type: row.type,
              product: row.product,
              worldwide: row.worldwide,
              region: row.region,
              simulation: row.simulation,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt
            }
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

instancesRouter.post('/', async(request, response, next) => {

  const body = request.body
  console.log(body)

  const db = databaseHelper.openDatabase()
  db.serialize(() => {
    const stmt = db.prepare(`INSERT INTO ${parameters.instanceTableName} VALUES (?, ?, ?, ?, ?, ?, ?)`)
    stmt.run(body.type, body.product, body.worldwide, body.region, body.simulation, timeHelper.utc_timestamp, timeHelper.utc_timestamp)
    stmt.finalize()
  })
  databaseHelper.closeDatabase(db)

})


module.exports = instancesRouter
