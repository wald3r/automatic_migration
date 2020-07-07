const schedule = require('node-schedule')
const spotPrices = require('./spotPrices')



const scheduleCollectSpotPrices = schedule.scheduleJob('23 11 * * *', () => {

  spotPrices.collectSpotPrices()

})


module.exports =  { scheduleCollectSpotPrices }