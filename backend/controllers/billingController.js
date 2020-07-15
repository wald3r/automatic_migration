const billingRouter = require('express').Router()
const authenticationHelper = require('../utils/authenticationHelper')
const AWS = require('aws-sdk')


billingRouter.get('/', async(request, response, next) => {

  try{

    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }
    /*
    var params = {
      TimePeriod: { 
        End: 'STRING_VALUE', 
        Start: 'STRING_VALUE' 
      },
    }
    costexplorer.getCostAndUsage(params, function(err, data) {
      if (err) console.log(err, err.stack)
      else     console.log(data)
    })
    */

  }catch(exception){
    next(exception)
  }


})



module.exports = billingRouter
