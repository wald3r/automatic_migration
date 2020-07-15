const userRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')
const authenticationHelper = require('../utils/authenticationHelper')


userRouter.post('/:rowid', async(request, response, next) => {

  const rowid = request.params.rowid
  const body = request.body
  try{

    const user = await authenticationHelper.isLoggedIn(request.token)
    if(user == undefined){
      return response.status(401).send('Not Authenticated')
    }

    const db = await databaseHelper.openDatabase()
    let userRow = await databaseHelper.selectById(db, parameters.userTableValues, parameters.userTableName, rowid)
    if(userRow === null){
      await databaseHelper.closeDatabase(db)
      return response.status(500).send('User does not exist')
    }
    const values = 'username = ?, password = ?, updatedAt = ?'
    const params = [body.username, body.password, timeHelper.utc_timestamp, rowid]
    const status = await databaseHelper.updateById(db, parameters.userTableName, values, params)
    await databaseHelper.closeDatabase(db)
    if(status === 500){
      return response.status(500).send('Update did not work')
    }
   
    return response.status(200).send('Update did work')


  }catch(exception){
    next(exception)
  }


})


module.exports = userRouter
