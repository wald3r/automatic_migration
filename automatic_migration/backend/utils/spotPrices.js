const {spawn} = require('child_process')
const parameters = require('../parameters')


const collectSpotPrices = async () => {

  const python = spawn('python3', [parameters.collectSpotPricesFile])
  console.log(`Start collecting spot prices`)

  python.stdout.on('data', (data) => {
    console.log(data.toString())
    
  })
   
  python.stdout.on('close', async () => {
    console.log(`Finished collecting spot prices`)
  })
}

const collectSpecificSpotPrices = async (instance) => {

  const python = spawn('python3', [parameters.collectSpotPricesFile, instance])
  console.log(`Start collecting spot prices`)

  python.stdout.on('data', (data) => {
    console.log(data.toString())
    
  })
  await new Promise((resolve) => {
    python.stdout.on('close', async () => {
      console.log(`Finished collecting spot prices`)
      resolve()
    })
  })
  
}





module.exports = { collectSpotPrices, collectSpecificSpotPrices }
