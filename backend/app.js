const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const instancesRouter = require('./controllers/instances')
const cors = require('cors')
const databaseHelper = require('./utils/databaseHelper')
const fs = require('fs')

const dbName = './sqlite.db'

try{
    db = databaseHelper.openDatabase()
    databaseHelper.createTable(db, 'instance', 'id INT')
    databaseHelper.closeDatabase(db)
}catch(exception){
    console.log('hello')
}

app.use(express.static('build'))
app.use(cors())
app.use(bodyparser.json())
app.use('/api/instances', instancesRouter)




module.exports = app