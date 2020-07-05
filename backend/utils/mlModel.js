const {spawn} = require('child_process')
const fs = require('fs');
const parameters = require('../parameters')
const databaseHelper = require('../utils/databaseHelper')
const timeHelper = require('../utils/timeHelper')

const trainModel = async (instance, product) => {

  console.log(parameters.mlTrainFile)
  const python = spawn('python3', [parameters.mlTrainFile, instance, product])
  console.log(`Start training ml model ${instance} ${product}`)

  //python.stdout.on('data', (data) => {
  //  console.log(data.toString())
  //})

  python.on('close', async (code) => {
    console.log(`Finished training model ${instance} ${product}`)
    

    let db = await databaseHelper.openDatabase()
    let outcome = null
    await new Promise((resolve, reject) => {
      db.get(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName} WHERE 
        type = '${instance}' AND
        product = '${product}'`, (err ,row) => {
        if(err){
          console.error(`${parameters.instanceTableName}: ${err.message}`)
          reject()
        }else{
          outcome = row
          resolve()
        }
      })
    })
    const params = ['trained', timeHelper.utc_timestamp, outcome.rowid]
    const values = 'status = ?, updatedAt = ?'
    await databaseHelper.updateById(db, parameters.instanceTableName, values, params)
    await databaseHelper.closeDatabase(db)
  })
}


const deleteModel = (instance, product) => {

  const python = spawn('python3', [parameters.mlDeleteFile, instance, product])
  console.log(`Delete training ml model ${instance} ${product}`)

  python.stdout.on('data', (data) => {
    console.log(data.toString())
  })
}


module.exports = { trainModel, deleteModel }