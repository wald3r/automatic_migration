const {spawn} = require('child_process')
const parameters = require('../parameters')
const databaseHelper = require('../utils/databaseHelper')
const timeHelper = require('../utils/timeHelper')
const fs = require('fs')
const spotInstances = require('./spotInstances')

const replace_name = (name) => {

    if(name === 'Linux/UNIX')
        return 'Linux-Unix'

    else if(name === 'Red Hat Enterprise Linux')
        return 'RedHat'

    else if(name === 'SUSE Linux')
        return 'Linux-Suse'

    else
      return name

}


const trainModel = async (instance, product, simulation) => {

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
        product = '${product}' AND
        simulation = '${simulation}'`, (err ,row) => {
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
    const fileToDelete = `${parameters.mlPredictions}${instance}_${replace_name(product)}.csv`
    if (fs.existsSync(fileToDelete)) {
      fs.unlinkSync(fileToDelete)
    }
    
  })
}


const predictModel = (instance, product, simulation, bidprice, imageId) => {
  const python = spawn('python3', [parameters.mlPredictFile, instance, product])
  console.log(`Started prediction of ml model ${instance} ${product}`)

  python.stdout.on('close', async () => {
    const path = `${__dirname}/${instance}_${replace_name(product)}.csv`
    spotInstances.requestSpotInstance(instance, 'eu-west-3c', spotInstances.getImageId(product), bidprice, simulation, imageId)
  })
}


module.exports = { trainModel, deleteModel, predictModel }