const registrationRouter = require('express').Router()
const bcrypt = require('bcrypt')
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')

registrationRouter.post('/', async(request, response) => {



  const body = request.body
  const salt = 10
  const passwordHash = await bcrypt.hash(body.password, salt)

  const db = await databaseHelper.openDatabase()
  const params = [body.username, passwordHash, Date.now(), Date.now()]
  const userId = await databaseHelper.insertRow(db, parameters.userTableName, '(null, ?, ?, ?, ?)', params)
  const userRow = await databaseHelper.selectById(db, parameters.userTableValues, parameters.userTableName, userId)
  await databaseHelper.closeDatabase(db)

  if(userId === -1 || userRow === null){
    return response.status(401).send('registration failed')
  }
  console.log(`RegistrationHelper: New user registered with username ${body.username}`)
  return response.status(200).json(userRow)
})



module.exports = registrationRouter
