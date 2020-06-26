const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const instancesRouter = require('./controllers/instances')
const cors = require('cors')
const databaseHelper = require('./utils/databaseHelper')


//Create Table
db = databaseHelper.openDatabase()
const values = 'type TEXT NOT NULL, product TEXT NOT NULL, worldwide INT, region TEXT, simulation INT'
databaseHelper.createTable(db, 'instance', values)
databaseHelper.closeDatabase(db)


app.use(express.static('build'))
app.use(cors())
app.use(bodyparser.json())
app.use('/api/instances', instancesRouter)




module.exports = app