const parameters = require('../parameters')
const {spawn} = require('child_process')


const getCosts = async (instance, product, zone, start, rowid) => {
  
  
  const python = spawn('python3', [parameters.billingFile, instance, product, zone, start, rowid])
  console.log(`BillingHelper: Start collection costs of ${instance} ${product} ${zone} ${start}`)

  python.stdout.on('data', (data) => {
    console.log(data.toString())    
  }) 

  python.on('close', async () => {
    console.log(`BillingHelper: Finished collection costs of ${instance} ${product} ${zone} ${start}`)
  
  })


}


module.exports = { getCosts }