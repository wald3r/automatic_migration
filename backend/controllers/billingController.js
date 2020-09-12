const billingRouter = require('express').Router()
const authenticationHelper = require('../utils/authenticationHelper')
const parameters = require('../parameters')
const databaseHelper = require('../utils/databaseHelper')

billingRouter.get('/:rowid', async(request, response, next) => {

  try{

    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }
    const billingRows = await databaseHelper.selectByValue(parameters.billingTableValues, parameters.billingTableName, 'imageId', [request.params.rowid])
    response.status(200).json(billingRows)


  }catch(exception){
    next(exception)
  }


})



module.exports = billingRouter
