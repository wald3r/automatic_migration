const registrationRouter = require('express').Router()
const bcrypt = require('bcrypt')
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')

registrationRouter.post('/', async(request, response) => {



  const body = request.body
  const salt = 10
  const passwordHash = await bcrypt.hash(body.password, salt)

  const db = await databaseHelper.openDatabase()
  const params = [body.username, passwordHash, timeHelper.utc_timestamp, timeHelper.utc_timestamp]
  const userId = await databaseHelper.insertRow(db, parameters.userTableName, '(NULL, ?, ?, ?, ?)', params)
  const userRow = await databaseHelper.selectById(db, parameters.userTableValues, parameters.userTableName, userId)
  await databaseHelper.closeDatabase(db)

  if(userId === -1 || userRow === null){
    return response.status(401).send('registration failed')
  }
  return response.status(200).json(userRow)
})



module.exports = registrationRouter
