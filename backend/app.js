const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const instancesRouter = require('./controllers/instances')
const cors = require('cors')
const databaseHelper = require('./utils/databaseHelper')
const parameter = require('./parameters')


const checkDatabase = async () => {
    db = await databaseHelper.openDatabase()
    const values = 'type TEXT NOT NULL, product TEXT NOT NULL, bidprice FLOAT NOT NULL, region TEXT, simulation INT NOT NULL, createdAt TEXT, updatedAt Text'
    databaseHelper.createTable(db, parameter.instanceTableName, values)
    await databaseHelper.closeDatabase(db)
}

checkDatabase()
app.use(express.static('build'))
app.use(cors())
app.use(bodyparser.json())
app.use('/api/instances', instancesRouter)




module.exports = app