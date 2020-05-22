const AWS = require('aws-sdk')
const utils = require('./utils')
const dataLists = require('./dataLists')

AWS.config.getCredentials((err) => {
  if (err) console.log(err.stack)
  else {
    console.log('Authenticated with AWS')
  }
})
AWS.config.update({region: 'eu-west-3'})


var ec2 = new AWS.EC2({apiVersion: '2016-11-15'})

var startDate = 'March 18, 2020 00:00:00'
var endDate = 'May 18, 2020 23:59:59'


var list = []

const getHistory = async (nextToken, resolve, availabilityZone, instance) => {

    var params = utils.createDescripeSpotPriceHistoryParams(nextToken, 100, new Date(startDate), new Date(endDate), instance, availabilityZone, 'Linux/UNIX (Amazon VPC)')
    await ec2.describeSpotPriceHistory(params, async (err, data)  => {
      if (err) return console.log(err, err.stack)
      else{
        list = list.concat(data.SpotPriceHistory)
        if(data.NextToken !== '') {
          await getHistory(data.NextToken, resolve, availabilityZone, instance)
        }else{
          resolve(list)
        }
       
      }    
    })
}

const printList = async () => {
  AWS.config.update({region: 'us-east-1'})
  ec2 = new AWS.EC2({apiVersion: '2016-11-15'})
  var availabilityZone = 'us-east-1e'
  var instance = 'f1.2xlarge'

  await new Promise(resolve => getHistory('', resolve, availabilityZone, instance))
  console.log(list)
  //const filteredDay = utils.getDayFromHistory(list, 17)
  //const filteredHours = utils.getHoursFromHistoryDay(filteredDay, 0, 12)
  //console.log(filteredDay)
  //console.log(filteredHours)
}

const mostActive = async () => {
  try{
    var regions = await new Promise(resolve => getRegions(resolve))
    for(let b = 0; b < dataLists.instance_list.length; b++){
      var instance = dataLists.instance_list[b]
      regions.Regions.map(async region => {
        AWS.config.update({region: region.RegionName})
        ec2 = new AWS.EC2({apiVersion: '2016-11-15'})
        var availabilityZones = await new Promise(resolve => getAvailabilityZones(resolve))
        availabilityZones.AvailabilityZones.map(async zone => {
          console.log(zone.ZoneName, region.RegionName, instance)
          await new Promise(resolve => getHistory('', resolve, zone.ZoneName, instance))
          counter = 0
          var spotPrice = list[0].SpotPrice
          list.map(data => {
            if(data.SpotPrice !== spotPrice){
              counter = counter + 1
              spotPrice = data.SpotPrice
            }
          })
          console.log(instance, zone, counter, 'Length:', list.length)
      
          list = []
        })
      })   
    }
  }catch(e){
    console.log('test')
  }
}

const getRegions = resolve => {
  ec2.describeRegions({}, (err, data)=> {
    if (err) console.log(err, err.stack); // an error occurred
    else  resolve(data); 
  })
}

const getAvailabilityZones = resolve => {
  ec2.describeAvailabilityZones({}, (err, data) => {
    if (err) console.log(err, err.stack)
    else resolve(data)       
  })
}


//mostActive()
printList()