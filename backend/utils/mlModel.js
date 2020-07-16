const {spawn} = require('child_process')
const parameters = require('../parameters')
const databaseHelper = require('../utils/databaseHelper')
const timeHelper = require('../utils/timeHelper')
const fs = require('fs')
const csv = require('csv-parse')

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

const deletePredictions = (image) => {

  if (fs.existsSync(image.predictionFile)) {
    fs.unlinkSync(image.predictionFile)
  }
  
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

function sortFunction(a, b) {
  if (a[0] === b[0]) {
      return 0;
  }
  else {
      return (a[0] < b[0]) ? -1 : 1;
  }
}


const predictModel = async (instance, product, image) => {
  const python = spawn('python3', [parameters.mlPredictFile, instance, product, image.rowid])
  console.log(`Started prediction of ml model ${instance} ${product}`)

  return await new Promise((resolve) => {
    python.stdout.on('close', async () => {

      const path = `${parameters.workDir}/predictions/${instance}_${replace_name(product)}_${image.rowid}.csv`
      let results = []

      fs.createReadStream(path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          console.log(results)
          results = results.sort(sortFunction)
          const db = await databaseHelper.openDatabase()
          const params = [path, timeHelper.utc_timestamp, image.rowid]
          const values = 'predictionFile = ?, updatedAt = ?'
          await databaseHelper.updateById(db, parameters.imageTableName, values, params)
          await databaseHelper.closeDatabase(db)

          resolve(results[0])
        })
      })
  })
}


module.exports = { deletePredictions, trainModel, deleteModel, predictModel }