const express = require('express')
const app = express()
const fileUpload = require('express-fileupload')
const bodyparser = require('body-parser')
const instancesRouter = require('./controllers/instancesController')
const billingRouter = require('./controllers/billingController')
const userRouter = require('./controllers/userController')
const loginRouter = require('./controllers/loginController')
const registrationRouter = require('./controllers/registrationController')
const imagesRouter = require('./controllers/imagesController')
const cors = require('cors')
const databaseHelper = require('./utils/databaseHelper')
const parameters = require('./parameters')
const scheduler = require('./utils/scheduler')
const auth = require('./middleware/authentication')
const fs = require('fs')


const checkDatabase = async () => {
    db = await databaseHelper.openDatabase()
    const valuesInstances = 'rowid INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, product TEXT NOT NULL, bidprice FLOAT NOT NULL, region TEXT, simulation INT NOT NULL, status TEXT, createdAt TEXT, updatedAt Text'
    const valuesImages= `rowid INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT, instanceId INTEGER NOT NULL, spotInstanceId TEXT, requestId TEXT, zone TEXT, path TEXT, ip TEXT, key TEXT, createdAt TEXT, updatedAt TEXT, FOREIGN KEY (instanceId) REFERENCES ${parameters.instanceTableName} (rowid) ON DELETE CASCADE`
    const valuesUsers= `rowid INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, createdAt TEXT, updatedAt TEXT`
    db.run('PRAGMA foreign_keys = ON')
    databaseHelper.createTable(db, parameters.userTableName, valuesUsers)
    databaseHelper.createTable(db, parameters.instanceTableName, valuesInstances)
    databaseHelper.createTable(db, parameters.imageTableName, valuesImages)
    await databaseHelper.closeDatabase(db)
}

const credentialsChecker = async () => {
  
  const path = '/home/walder/.aws/credentials'
  if (fs.existsSync(path)){
    console.log(true)
  } else{
    console.log(false)
  }
}

scheduler.scheduleCollectSpotPrices
checkDatabase()
credentialsChecker()
app.use(express.static('build'))
app.use(cors())
app.use(bodyparser.json())
app.use(fileUpload())
app.use(auth.getTokenFrom)
app.use('/api/instances', instancesRouter)
app.use('/api/images', imagesRouter)
app.use('/api/login', loginRouter)
app.use('/api/registration', registrationRouter)
app.use('/api/billing', billingRouter)
app.use('/api/user', userRouter)

module.exports = app