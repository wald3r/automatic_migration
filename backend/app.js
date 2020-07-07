const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const instancesRouter = require('./controllers/instancesController')
const imagesRouter = require('./controllers/imagesController')
const cors = require('cors')
const databaseHelper = require('./utils/databaseHelper')
const parameter = require('./parameters')
const scheduler = require('./utils/scheduler')
const spotInstance = require('./utils/spotInstances')

const checkDatabase = async () => {
    db = await databaseHelper.openDatabase()
    const valuesInstances = 'type TEXT NOT NULL, product TEXT NOT NULL, bidprice FLOAT NOT NULL, region TEXT, simulation INT NOT NULL, status TEXT, createdAt TEXT, updatedAt Text'
    const valuesImages= `instanceId INTEGER NOT NULL, zone TEXT, path TEXT, ip TEXT, key TEXT, createdAt TEXT, updatedAt TEXT, FOREIGN KEY (instanceId) REFERENCES ${parameter.instanceTableName}(rowid) ON DELETE CASCADE`
    databaseHelper.createTable(db, parameter.instanceTableName, valuesInstances)
    databaseHelper.createTable(db, parameter.imageTableName, valuesImages)
    await databaseHelper.closeDatabase(db)
}

spotInstance.requestSpotInstance('t2.micro', 'eu-west-2a', 1)
scheduler.scheduleCollectSpotPrices
checkDatabase()

app.use(express.static('build'))
app.use(cors())
app.use(bodyparser.json())
app.use('/api/instances', instancesRouter)
app.use('/api/images', imagesRouter)



module.exports = app