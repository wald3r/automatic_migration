const parameters = require('../parameters')
const {spawn} = require('child_process')
const { google } = require('googleapis')
const fs = require('fs')
const csv = require('csv-parse')
const { engine_regions } = require('../parameters')


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

const authorize = async () => {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  })
  return await auth.getClient()
}


const loadFile = async () => {
  const path = `${parameters.workDir}/${parameters.engine_regions}`

  let results = []

  await new Promise((resolve) => {

    fs.createReadStream(path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
         
      resolve(results)
    }) 
  })
  
  return results
}



const getEnginePrice = async (machineName, cores, memory) => {

  const cloudbilling = google.cloudbilling('v1')

  const authClient = await authorize()

  const request = {
    parent:'services/6F81-5844-456A',
    auth: authClient,
  }

  const name = parameters.engineMachineTypes.filter(engine => engine === machineName)[0]
  let cpus = []
  let rams = []
  let response
  do {
    if (response && response.nextPageToken) {
      request.pageToken = response.nextPageToken
    }
    response = (await cloudbilling.services.skus.list(request)).data
    const skusPage = response.skus
    if (skusPage) {
      skusPage.map(item => {
        const description = item.description.split(' ')
        const filteredValue = description.filter(v => v === name)
        if(filteredValue.length > 0){
          if(item.category.usageType === 'Preemptible' && item.category.resourceGroup === 'RAM'){
            rams = rams.concat(item)
          }
          if(item.category.usageType === 'Preemptible' && item.category.resourceGroup === 'CPU'){
            cpus = cpus.concat(item)
          }
        }
       
      })
    }
  } while (response.nextPageToken)

  regions = await loadFile()

  let min = 1000000000
  let chosenRegion = null
  let totalPrice = 0
  regions.map(region => {
    const cpu = cpus.filter(c => c.serviceRegions[0] === region[0])
    const ram = rams.filter(r => r.serviceRegions[0] === region[0])
    if(cpu.length !== 0 && ram.length !== 0){
      const cpuPrice = cpu[0].pricingInfo[0].pricingExpression.tieredRates[0].unitPrice.nanos
      const ramPrice = ram[0].pricingInfo[0].pricingExpression.tieredRates[0].unitPrice.nanos
      totalPrice = (((cpuPrice * cores) + (ramPrice * memory)) / 1000000000) * 24

      if(totalPrice !== 0){
        if(totalPrice < min){
          min = totalPrice
          chosenRegion = region
        }
      }
    }
    
  })
  return {cost: Number((min).toFixed(4)), region: chosenRegion}
}


module.exports = { getCosts, getEnginePrice }






