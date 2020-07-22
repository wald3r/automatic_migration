const AWS = require('aws-sdk')



const getCosts = async (tag, start, end) => {

  AWS.config.update({region: 'us-east-1', apiVersion: '2017-10-25',})
  const costexplorer = new AWS.CostExplorer()

  const params = {
    TimePeriod: { 
      End: end, 
      Start: start 
    },
    Granularity: 'DAILY',
    Metrics: ['BlendedCost'],
    Filter: { 
      Tags: {
        Key: tag,
        Values: [
          tag,
        ]
      }
    },
  }

  let sum = 0

  await new Promise((resolve) => {

    costexplorer.getCostAndUsage(params, function(err, data) {
      if (err) console.log(`CostHelper: ${err.message}`)
      else {
        data.ResultsByTime.map(result => {
          console.log(result)
          sum += Number(result.Total.BlendedCost.Amount)
        })
        resolve()
      }
    })
  })
  return sum

}


module.exports = { getCosts }