const schedule = require('node-schedule')
const spotPrices = require('./spotPrices')


const scheduleCollectSpotPrices = schedule.scheduleJob('23 11 * * *', () => {

  spotPrices.collectSpotPrices()

})


const setMigrationScheduler = (time, model, image, user) => {
  
  schedule.scheduleJob(time, async () => {
    const migrationHelper = require('./migrationHelper')

    console.log(`MigrationSchedulerHelper: Start with evaluation of image ${image.rowid}`)
    await migrationHelper.newInstance(model, image, user)
  })
}


module.exports =  { scheduleCollectSpotPrices, setMigrationScheduler }