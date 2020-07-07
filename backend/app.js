const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const instancesRouter = require('./controllers/instancesController')
const imagesRouter = require('./controllers/imagesController')
const cors = require('cors')
const databaseHelper = require('./utils/databaseHelper')
const parameters = require('./parameters')
const scheduler = require('./utils/scheduler')

const checkDatabase = async () => {
    db = await databaseHelper.openDatabase()
    const valuesInstances = 'rowid INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, product TEXT NOT NULL, bidprice FLOAT NOT NULL, region TEXT, simulation INT NOT NULL, status TEXT, createdAt TEXT, updatedAt Text'
    const valuesImages= `rowid INTEGER PRIMARY KEY AUTOINCREMENT, instanceId INTEGER NOT NULL, zone TEXT, path TEXT, ip TEXT, key TEXT, createdAt TEXT, updatedAt TEXT, FOREIGN KEY (instanceId) REFERENCES ${parameters.instanceTableName} (rowid) ON DELETE CASCADE`
    db.run('PRAGMA foreign_keys = ON')
    databaseHelper.createTable(db, parameters.instanceTableName, valuesInstances)
    databaseHelper.createTable(db, parameters.imageTableName, valuesImages)
    await databaseHelper.closeDatabase(db)
}

scheduler.scheduleCollectSpotPrices
checkDatabase()

app.use(express.static('build'))
app.use(cors())
app.use(bodyparser.json())
app.use('/api/instances', instancesRouter)
app.use('/api/images', imagesRouter)



module.exports = app