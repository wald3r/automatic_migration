const schedule = require('node-schedule')
const spotPrices = require('./spotPrices')
const databaseHelper = require('./databaseHelper')
let parameters = require('../parameters')

const scheduleCollectSpotPrices = schedule.scheduleJob('23 11 * * *', () => {

  spotPrices.collectSpotPrices()

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


module.exports =  { cancelScheduler, scheduleCollectSpotPrices, setMigrationScheduler }