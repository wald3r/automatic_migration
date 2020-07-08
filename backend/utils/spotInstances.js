const AWS = require('aws-sdk')
const parameters = require('../parameters')
const databaseHelper = require('./databaseHelper')
const timeHelper = require('./timeHelper')

const getImageId = (product) => {

  if(product === 'Linux/UNIX')
  return parameters.linuxImage

  else if(product === 'Red Hat Enterprise Linux')
  return parameters.redHatImage

  else if(product === 'SUSE Linux')
  return parameters.suseImage

  else
    return parameters.windowsImage
}

const isSimulation = (number) => {
  if(number === 0)
    return false

  return true
}

const getEC2Object = async () => {

  await new Promise((resolve) => {
    AWS.config.getCredentials((err) => {
      if (err) console.log(err.stack)
      else {
        console.log('Authenticated with AWS')
      }
    })
  })

  AWS.config.update({region: 'eu-west-3'})
  const ec2 = new AWS.EC2({apiVersion: '2016-11-15'})

  return ec2
}

const requestSpotInstance = async (instance, zone, image, bidprice, simulation, id) => {

  const ec2 = await getEC2Object()

  var params = {
    InstanceCount: 1, 
    DryRun: isSimulation(simulation),
    LaunchSpecification: {
     ImageId: image, 
     InstanceType: instance, 
     Placement: {
      AvailabilityZone: zone
     }, 
     SecurityGroupIds: [
        "sg-05bef23ea3a35d239"
     ]
    }, 
    SpotPrice: `${bidprice}`, 
    Type: "one-time"
  }


  ec2.requestSpotInstances(params, async (err, data) => {
    if (err) console.log(err.message)
    else{
      const db = await databaseHelper.openDatabase()
      const ip = '0.0.0.0'
      const params = [data.SpotInstanceRequests[0].SpotInstanceRequestId, zone, ip, timeHelper.utc_timestamp, id]
      const values = 'requestId = ?, zone = ?, ip = ?, updatedAt = ?'
      await databaseHelper.updateById(db, parameters.imageTableName, values, params)
      await databaseHelper.closeDatabase(db)
      console.log(data)
    }     
  
  })
}

const cancelSpotInstance = async (id) => {

  const ec2 = await getEC2Object()

  var params = {
    SpotInstanceRequestIds: [id]
  }

  let instanceIds = []

  await new Promise((resolve) => {
    ec2.describeSpotInstanceRequests(params, async (err, data) =>  {
     if (err) console.log(err, err.stack)
     else{
        data.SpotInstanceRequests.map(instance => {
          instanceIds = instanceIds.concat(instance.InstanceId)
        })
       resolve()
     }
    })
  })

  ec2.terminateInstances({ InstanceIds: instanceIds }, function(err, data) {
    if (err) console.log(err, err.stack)
    else     console.log(data)
  })

  ec2.cancelSpotInstanceRequests(params, function(err, data) {
    if (err) console.log(err, err.stack)
    else     console.log(data)         
      
  })

}



module.exports = { getImageId, requestSpotInstance, cancelSpotInstance }