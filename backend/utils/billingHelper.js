const parameters = require('../parameters')
const {spawn} = require('child_process')


const getCosts = async (instance, product, zone, start, rowid, startZone) => {
  
  
  const python = spawn('python3', [parameters.billingFile, instance, product, zone, start, rowid, startZone])
  console.log(`BillingHelper: Start calculating costs of ${instance} ${product} ${zone} ${start} ${startZone}`)

  python.stdout.on('data', (data) => {
    console.log(data.toString())    
  }) 

  python.on('close', async () => {
    console.log(`BillingHelper: Finished calculating costs of ${instance} ${product} ${zone} ${start}`)
  
  })


}


module.exports = { getCosts }