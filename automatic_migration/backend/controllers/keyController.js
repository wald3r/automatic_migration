const keyRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const authenticationHelper = require('../utils/authenticationHelper')

keyRouter.get('/:id', async(request, response) => {


  const user = await authenticationHelper.isLoggedIn(request.token)
  if(user == undefined){
    return response.status(401).send('Not Authenticated')
  }

  const imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, request.params.id)
  if(imageRow.userId !== user.rowid){
    return response.status(500)
  }

  await response.sendFile(imageRow.key)


})



module.exports = keyRouter
