const loginRouter = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
require('dotenv').config()

loginRouter.post('/', async(request, response) => {

  const body = request.body

  const userRow = await databaseHelper.selectByUsername(parameters.userTableValues, parameters.userTableName, body.username)
  
  if(userRow === null){
    return response.status(401).send('invalid username')
  }
  const passwordCorrect = await bcrypt.compare(body.password, userRow.password)
  if(!passwordCorrect){
    return response.status(401).send('wrong password')
  }
  const userForToken = {
    rowid: userRow.rowid,
    username: userRow.username
  }
  const token = jwt.sign(userForToken, process.env.SECRET)
  return response.status(200).send({ token, username: userRow.username, rowid: userRow.rowid })
})



module.exports = loginRouter
