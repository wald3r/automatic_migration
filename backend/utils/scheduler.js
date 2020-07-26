const schedule = require('node-schedule')
const spotPrices = require('./spotPrices')


const scheduleCollectSpotPrices = schedule.scheduleJob('23 11 * * *', () => {

  spotPrices.collectSpotPrices()

})


const setMigrationScheduler = (time, model, image, user) => {
  
  console.log(`MigrationSchedulerHelper: Set scheduler at ${time} for ${image.rowid}`)
  schedule.scheduleJob(time, async () => {
    const migrationHelper = require('./migrationHelper')
    const databaseHelper = require('./databaseHelper')
    const parameters = require('../parameters')

    const imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, image.rowid)
    const migrationRows = await databaseHelper.selectIsNull(parameters.migrationTableValues, parameters.migrationTableName, 'newZone')
    const migrationRow = migrationRows.filter(row => row.imageId === imageRow.rowid)

    if(imageRow !== null && migrationRow.length !== 0){
      console.log(`MigrationSchedulerHelper: Start with evaluation of image ${image.rowid}`)
      await migrationHelper.newInstance(model, image, user)

    }else{
      console.log(`MigrationSchedulerHelper: Evaluation cancelled because ${image.rowid} does not exist anymore`)

    }    

  })
}


module.exports =  { scheduleCollectSpotPrices, setMigrationScheduler }