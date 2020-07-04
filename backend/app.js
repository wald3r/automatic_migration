const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const instancesRouter = require('./controllers/instancesController')
const vmsRouter = require('./controllers/vms')
const cors = require('cors')
const databaseHelper = require('./utils/databaseHelper')
const parameter = require('./parameters')


const checkDatabase = async () => {
    db = await databaseHelper.openDatabase()
    const valuesInstances = 'type TEXT NOT NULL, product TEXT NOT NULL, bidprice FLOAT NOT NULL, region TEXT, simulation INT NOT NULL, status TEXT, createdAt TEXT, updatedAt Text'
    const valuesVms = `instanceId INTEGER NOT NULL, zone TEXT, path TEXT, ip TEXT, createdAt TEXT, updatedAt TEXT, FOREIGN KEY (instanceId) REFERENCES ${parameter.instanceTableName}(rowid)`
    databaseHelper.createTable(db, parameter.instanceTableName, valuesInstances)
    databaseHelper.createTable(db, parameter.vmTableName, valuesVms)
    await databaseHelper.closeDatabase(db)
}

checkDatabase()
app.use(express.static('build'))
app.use(cors())
app.use(bodyparser.json())
app.use('/api/instances', instancesRouter)
app.use('/api/vms', vmsRouter)



module.exports = app