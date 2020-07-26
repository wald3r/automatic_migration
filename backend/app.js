const express = require('express')
const app = express()
const fileUpload = require('express-fileupload')
const bodyparser = require('body-parser')
const modelsRouter = require('./controllers/modelsController')
const billingRouter = require('./controllers/billingController')
const userRouter = require('./controllers/userController')
const loginRouter = require('./controllers/loginController')
const registrationRouter = require('./controllers/registrationController')
const imagesRouter = require('./controllers/imagesController')
const cors = require('cors')
const databaseHelper = require('./utils/databaseHelper')
const scheduler = require('./utils/scheduler')
const auth = require('./middleware/authentication')
const fs = require('fs')
const migrationHelper = require('./utils/migrationHelper')
const parameters = require('./parameters')

const credentialsChecker = async () => {
  
  const path = `${process.env['HOME']}/.aws/credentials`
  if (fs.existsSync(path)){
    console.log('CredentialsHelper: Credentials found!')
  } else{
    console.log('CredentialsHelper: Credentials can not be found. Add credentials to ~/.aws/credentials and try again.')
    process.exit(1)
  }
}


const checkMigrationStatus = async () => {

  const migrationRows = await databaseHelper.selectIsNull(parameters.migrationTableValues, parameters.migrationTableName, 'newZone')
  await migrationRows.map(async migRow => {
    const imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, migRow.imageId)
    const modelRow = await databaseHelper.selectById(parameters.modelTableValues, parameters.modelTableName, imageRow.modelId)
    const userRow = await databaseHelper.selectById(parameters.userTableValues, parameters.userTableName, imageRow.userId)
    await migrationHelper.setSchedulerAgain(imageRow, modelRow, userRow, migRow.updatedAt)
  })
  console.log(`MigrationStatusHelper: Set ${migrationRows.length} open schedulers`)
}


credentialsChecker()
databaseHelper.checkDatabase()
//scheduler.scheduleCollectSpotPrices
app.use(express.static('build'))
app.use(cors())
app.use(bodyparser.json())
app.use(fileUpload())
app.use(auth.getTokenFrom)
app.use('/api/models', modelsRouter)
app.use('/api/images', imagesRouter)
app.use('/api/login', loginRouter)
app.use('/api/registration', registrationRouter)
app.use('/api/billing', billingRouter)
app.use('/api/user', userRouter)
checkMigrationStatus()

module.exports = app