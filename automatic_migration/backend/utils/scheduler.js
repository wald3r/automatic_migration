const schedule = require('node-schedule')
const spotPrices = require('./spotPrices')
const databaseHelper = require('./databaseHelper')
let parameters = require('../parameters')
const mlModel = require('./mlModel')
const spotInstances = require('./spotInstances')
const computeEngine = require('./computeEngine')


const scheduleCollectSpotPrices = schedule.scheduleJob('59 23 * * *', () => {

  spotPrices.collectSpotPrices()

})


const checkInstances = schedule.scheduleJob(parameters.checkInstancesNumber, async () => {

  console.log('CheckInstanceHelper: Start checking instances')
  const imageRows = await databaseHelper.selectAllRows(parameters.imageTableValues, parameters.imageTableName)
  imageRows.map(async image => {

    let state = null
    if(image.simulation === 1){
      state = 'simulation'
    }
    else{
      state = image.provider === 'AWS' ?  await spotInstances.getInstanceState(image.zone, [image.spotInstanceId]) : await computeEngine.getStatus(image)
    }
    if(state === 'stopped' && image.status !== 'booting' && image.status !== 'migration' && image.status !== 'simulation' && image.manually === 0){
      console.log(`CheckInstanceHelper: Reboot image ${image.rowid}`)
      const migrationHelper = require('./migrationHelper')
      parameters = require('../parameters')
      if(image.provider === 'AWS'){
        await migrationHelper.startInstance(image)
        await spotInstances.waitForInstanceToBoot([image.spotInstanceId])
        await spotInstances.getPublicIpFromRequest([image.spotInstanceId], image.rowid)
      }
      const newImage = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, image.rowid)
      await migrationHelper.startDocker(newImage.ip, image.key, image.provider)
      await databaseHelper.updateById(parameters.imageTableName, `status = ?, update = ?`, ['running', Date.now(), image.rowid])
    }
  })
  
})


const trainModels = schedule.scheduleJob('59 23 3 * *', async () => {

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
  const j = schedule.scheduleJob(time, async () => {
    const migrationHelper = require('./migrationHelper')
    const databaseHelper = require('./databaseHelper')
    parameters = require('../parameters')
    const spotInstances = require('./spotInstances')
    const computeEngine = require('./computeEngine')

    const imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, image.rowid)

    if(imageRow === null){
      return
    }
    console.log(`MigrationSchedulerHelper: Start with evaluation of image ${imageRow.rowid}`)
    let state = null

    if(image.simulation === 1) {
      state =  'simulation'
    }else{
      state = image.provider === 'AWS' ? await spotInstances.getInstanceState(imageRow.zone, [imageRow.spotInstanceId]) : await computeEngine.getStatus(imageRow)
    }
    if(state === 'running' || state === 'simulation'){
      await migrationHelper.newInstance(model, imageRow, user)
    }else{
      console.log(`MigrationSchedulerHelper: Image ${imageRow.rowid} is currently not active`)
    }
   

  })
  await databaseHelper.updateById(parameters.imageTableName, `schedulerName = ?`, [j.name, image.rowid])
}


module.exports =  { checkInstances, trainModels, cancelScheduler, scheduleCollectSpotPrices, setMigrationScheduler }