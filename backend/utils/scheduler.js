const schedule = require('node-schedule')
const spotPrices = require('./spotPrices')
const databaseHelper = require('./databaseHelper')
const parameters = require('../parameters')
const mlModel = require('./mlModel')

const scheduleCollectSpotPrices = schedule.scheduleJob('59 23 * * *', () => {

  spotPrices.collectSpotPrices()

})



const trainModels = schedule.scheduleJob('25 11 * * *', async () => {

  console.log(`TrainModelsHelper: Start with retraining of all existing models`)
  const models = await databaseHelper.selectAllRows(parameters.modelTableValues, parameters.modelTableName)
  await models.map(async row => {
    await databaseHelper.updateById(parameters.modelTableName, 'status = ?, updatedAt = ?', ['training', Date.now(), row.rowid])
    mlModel.trainModel(row.type, row.product)
  })
  
})


const cancelScheduler = async (image) => {
  const toCancel = schedule.scheduledJobs[image.schedulerName]
  toCancel.cancel()
  console.log(`CancelSchedulerHelper: Cancelled scheduler of image ${image.rowid}`)
  await databaseHelper.updateById(parameters.imageTableName, `schedulerName = ?`, [null, image.rowid])


}

const setMigrationScheduler = async (time, model, image, user) => {
  console.log(`MigrationSchedulerHelper: Set scheduler at ${time} for ${image.rowid}`)
  console.log(time)
  const j = schedule.scheduleJob(time, async () => {
    const migrationHelper = require('./migrationHelper')
    const databaseHelper = require('./databaseHelper')
    parameters = require('../parameters')
    const spotInstances = require('./spotInstances')

    const imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, image.rowid)

    if(imageRow === null){
      return
    }
    console.log(`MigrationSchedulerHelper: Start with evaluation of image ${imageRow.rowid}`)

    const state = await spotInstances.getInstanceState(imageRow.zone, [imageRow.spotInstanceId]) 
    if(state === 'running'){
      await migrationHelper.newInstance(model, imageRow, user)
    }else{
      console.log(`MigrationSchedulerHelper: Image ${imageRow.rowid} is currently not active`)
    }
   

  })
  await databaseHelper.updateById(parameters.imageTableName, `schedulerName = ?`, [j.name, image.rowid])
}


module.exports =  { trainModels, cancelScheduler, scheduleCollectSpotPrices, setMigrationScheduler }