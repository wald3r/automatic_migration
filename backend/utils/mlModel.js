const {spawn} = require('child_process')
const parameters = require('../parameters')
const databaseHelper = require('../utils/databaseHelper')
const timeHelper = require('../utils/timeHelper')
const d3 = require('d3-request')
const fs = require('fs')

const replace_name = (name) => {

    if(name === 'Linux/UNIX')
        return 'Linux-Unix'

    if(name == 'Red Hat Enterprise Linux')
        return 'RedHat'

    if(name == 'SUSE Linux')
        return 'Linux-Suse'

    return name

}


const trainModel = async (instance, product) => {

  console.log(parameters.mlTrainFile)
  const python = spawn('python3', [parameters.mlTrainFile, instance, product])
  console.log(`Start training ml model ${instance} ${product}`)

  //python.stdout.on('data', (data) => {
  //  console.log(data.toString())
  //})

  python.on('close', async () => {
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
    fs.unlinkSync(`${parameters.mlPredictions}${instance}_${replace_name(product)}.csv`)
  })
}


const predictModel = (instance, product) => {
  const python = spawn('python3', [parameters.mlPredictFile, instance, product])
  console.log(`Prediction of ml model ${instance} ${product}`)

  python.stdout.on('data', (data) => {
    console.log(data.toString())
  })

  python.stdout.on('close', async () => {
    const predictionData = require(`${parameters.mlPredictions}${instance}_${replace_name(product)}.csv`)
    d3.csv(predictionData, (err, data) => {
      if (error) throw error
      console.log(data[0])
    })
  })
}


module.exports = { trainModel, deleteModel, predictModel }