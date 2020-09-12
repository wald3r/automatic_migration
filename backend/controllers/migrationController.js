const migrationRouter = require('express').Router()
const authenticationHelper = require('../utils/authenticationHelper')
const parameters = require('../parameters')
const databaseHelper = require('../utils/databaseHelper')

migrationRouter.get('/:rowid', async(request, response, next) => {

  try{

    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }
    const migrationRows = await databaseHelper.selectByValue(parameters.migrationTableValues, parameters.migrationTableName, 'imageId', [request.params.rowid])
    return response.status(200).json(migrationRows)


  }catch(exception){
    next(exception)
  }


})



module.exports = migrationRouter
