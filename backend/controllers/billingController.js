const billingRouter = require('express').Router()
const authenticationHelper = require('../utils/authenticationHelper')
const parameters = require('../parameters')
const databaseHelper = require('../utils/databaseHelper')


billingRouter.get('/', async(request, response, next) => {

  try{

    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }
    
    const db = await databaseHelper.openDatabase()
    const billingRows = await databaseHelper.selectByUserId(db, parameters.billingTableValues, parameters.billingTableName, user.rowid)
    await databaseHelper.closeDatabase(db)

    response.status(200).json(billingRows)


  }catch(exception){
    next(exception)
  }


})



module.exports = billingRouter
