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
      if (err) {
        console.log(`SpotInstanceHelper: ${err.message}`)
        resolve()
      }else {
        resolve()
      }
    })
  })

  AWS.config.update({region: 'eu-west-3'})
  const ec2 = new AWS.EC2({apiVersion: '2016-11-15'})

  return ec2
}


const getInstanceIds = async (id) => {
  
  const ec2 = await getEC2Object()

  var params = {
    SpotInstanceRequestIds: [id]
  }
  let instanceIds = []

  console.log(params)
  while(true){
    instanceIds = []

    await new Promise((resolve) => {
      ec2.describeSpotInstanceRequests(params, async (err, data) =>  {
      if (err) {
        console.log(`SpotInstanceHelper: ${err.message}`)
        resolve(undefined)
      }else{
          data.SpotInstanceRequests.map(instance => {
            instanceIds = instanceIds.concat(instance.InstanceId)
          })
        resolve(instanceIds)
      }
      })
    })
    await new Promise((resolve) => {
      setTimeout(() => { 
        console.log('SpotInstanceHelper: Waiting for instance id')
        resolve()
      }, 3000)
    })

    if(instanceIds[0] !== undefined) break
  }
  return instanceIds

}

const waitForInstanceToBoot = async (ids) => {

  const ec2 = await getEC2Object()

  let status = undefined

  while(status !== 'ok'){
    await new Promise((resolve) => {
      ec2.describeInstanceStatus({ InstanceIds: ids, IncludeAllInstances: true }, async (err, data) => {
        if (err) console.log(`SpotInstanceHelper: ${err.message}`) 
        else {
          status = data.InstanceStatuses[0].InstanceStatus.Status
          resolve(status)
        }       
      })
    })
  }
}

const getInstanceStatus = async (ec2, ids) => {

  return await new Promise((resolve) => {
    ec2.describeInstanceStatus({ InstanceIds: ids, IncludeAllInstances: true }, async (err, data) => {
      if (err) console.log(`SpotInstanceHelper: ${err.message}`) 
      else {
        status = data.InstanceStatuses[0].InstanceStatus.Status
        resolve(status)
      }       
    })
  })
  
}

const requestSpotInstance = async (instance, zone, image, bidprice, simulation, id) => {


  const ec2 = await getEC2Object()
  
  let params = {
    InstanceCount: 1, 
    DryRun: isSimulation(simulation),
    LaunchSpecification: {
     ImageId: getImageId(image), 
     InstanceType: instance,
     KeyName: parameters.keyFileName, 
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

  let requestId = null
  return await new Promise((resolve) => {
    ec2.requestSpotInstances(params, async (err, data) => {
      if (err) {
        console.log(`SpotInstanceHelper: ${err.message}`)
        resolve(null)
      }
      else{

        const db = await databaseHelper.openDatabase()
        params = [data.SpotInstanceRequests[0].SpotInstanceRequestId, zone, timeHelper.utc_timestamp, id]
        requestId = data.SpotInstanceRequests[0].SpotInstanceRequestId
        const values = 'requestId = ?, zone = ?, updatedAt = ?'
        await databaseHelper.updateById(db, parameters.imageTableName, values, params)
        await databaseHelper.closeDatabase(db)
        resolve(requestId)
      }
    })
  })
}


const getPublicIpFromRequest = async (instanceIds) => {
  
  const ec2 = await getEC2Object()

  return await new Promise((resolve) => {
    ec2.describeInstances({ InstanceIds: instanceIds }, async (err, data) => {
      if (err) console.log(`SpotInstanceHelper: ${err.message}`) 
      else {
        const ip = data.Reservations[0].Instances[0].PublicIpAddress
        resolve(ip)
      }       
    })
  })
}


const cancelSpotInstance = async (image) => {

  const ec2 = await getEC2Object()
  
  ec2.terminateInstances({ InstanceIds: [image.spotInstanceId] }, (err, data) => {
    if (err) console.log(`SpotInstanceHelper: ${err.message}`)
    else     console.log(data)
  })

  ec2.cancelSpotInstanceRequests({ SpotInstanceRequestIds: [image.requestId] }, (err, data) => {
    if (err) console.log(`SpotInstanceHelper: ${err.message}`)
    else     console.log(data)         
        
  })
  
}



module.exports = { getEC2Object, getInstanceIds, getInstanceStatus, getImageId, requestSpotInstance, cancelSpotInstance, getPublicIpFromRequest, waitForInstanceToBoot }