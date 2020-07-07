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


module.exports = { collectSpotPrices }
