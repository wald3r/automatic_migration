const AWS = require('aws-sdk')
const parameters = require('../parameters')
const databaseHelper = require('./databaseHelper')
const timeHelper = require('./timeHelper')
const { request } = require('express')
const fileHelper = require('./fileHelper')


let AWSRegion = 'eu-west-3'

const setRegion = (zone) => {
  AWSRegion = zone.slice(0, -1)
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

  AWS.config.update({region: AWSRegion})
  const ec2 = new AWS.EC2({apiVersion: '2016-11-15'})

  return ec2
}

const describeImages = async (product) => {
  const params = {
    Filters: [
      {
        Name: 'state',
        Values: [
          'available'
        ]
      },
      {
        Name: 'architecture',
        Values: [
          'x86_64'
        ]
      },
      {
        Name: 'image-type',
        Values: [
          'machine'
        ]
      },
      {
        Name: 'virtualization-type',
        Values: [
          'hvm'
        ]
      },
      {
        Name: 'platform-details',
        Values: [
          product
        ]
      },
    ],
    Owners: [
      'amazon',
    ]  
   }

   const ec2 = await getEC2Object()

   return await new Promise((resolve) => {
    ec2.describeImages(params, (err, data) => {
      if (err) console.log(`DescribeImagesHelper: ${err.message}`)
      else resolve(data)
    })
   })
}

const stopInstance = async (id, zone) => {

  setRegion(zone)
  const ec2 = await getEC2Object()

   ec2.stopInstances({InstanceIds: [id]}, (err, data) => {
     if (err) console.log(`StopInstanceHelper: ${err.message}`)
     else     console.log(`StopInstanceHelper: ${id} is stopping`)
   })
}

const startInstance = async (id, zone) => {

  setRegion(zone)
  const ec2 = await getEC2Object()

   ec2.startInstances({InstanceIds: [id]}, (err, data) => {
     if (err) console.log(`StartInstanceHelper: ${err.message}`)
     else     console.log(`StartInstanceHelper: ${id} is starting`)
   })
}


const describeSecurityGroups = async () => {
 
  const params = {
    Filters: [
      {
        Name: 'description',
        Values: [parameters.securityGroupDescription]
      }
    ],
    GroupNames: [
      parameters.securityGroupName
    ]
  }

  const ec2 = await getEC2Object()

 return await new Promise((resolve) => {
  ec2.describeSecurityGroups(params, (err, data) => {
    if (err) {
      console.log(`DescribeSecurityGroupHelper: ${err.message}`)
      resolve(undefined)
    }else resolve(data)
  })
 })
}

const authorizeSecurityGroupIngress = async (securityGroupId) => {

  const ec2 = await getEC2Object()

  const paramsIngress = {
    GroupId: securityGroupId,
    IpPermissions:[
      {
        IpProtocol: "tcp",
        FromPort: 8000,
        ToPort: 8000,
        IpRanges: [{"CidrIp":"0.0.0.0/0"}]
      },
      {
        IpProtocol: "tcp",
        FromPort: 22,
        ToPort: 22,
        IpRanges: [{"CidrIp":"0.0.0.0/0"}]
      }
    ]
  }

  ec2.authorizeSecurityGroupIngress(paramsIngress, (err, data) => {
    if (err) {
      console.log(`AuthorizeSecurityGroupIngressHelper: ${err.message}`)
    }
  })
}

const createSecurityGroup = async (zone) => {
  
  const ec2 = await getEC2Object()
  let vpc = null
  
  const securityGroup = await describeSecurityGroups()
  if(securityGroup === undefined){
    console.log(`SecurityGroupHelper: Create security group for ${zone}`)
    return await new Promise((resolve) => {
      ec2.describeVpcs((err, data) => {
        if (err) {
          console.log(`SecurityGroupHelper: ${err.message}`)
        }else {
          vpc = data.Vpcs[0].VpcId
          const paramsSecurityGroup = {
            Description: parameters.securityGroupDescription,
            GroupName: parameters.securityGroupName,
            VpcId: vpc
          }
          ec2.createSecurityGroup(paramsSecurityGroup, async (err, data) => {
            if (err) {
              console.log(`SecurityGroupHelper: ${err.message}`)
            } else {
                const SecurityGroupId = data.GroupId
                await authorizeSecurityGroupIngress(SecurityGroupId)
                resolve(SecurityGroupId)
            }
          })
        }
      })
    })
  }
  else{
    console.log(`SecurityGroupHelper: Security group for ${zone} already exists`)
    return securityGroup.SecurityGroups[0].GroupId
  }
}


const deleteSecurityGroup = async (zone) => {

  setRegion(zone)
  const ec2 = await getEC2Object()

  const params = {
    DryRun: false,
    GroupName: parameters.securityGroupName
  }

  ec2.deleteSecurityGroup(params, (err, data) => {
    if (err) console.log(`DeleteSecurityGroupHelper: ${err.message}`)
    else     console.log(`DeleteSecurityGroupHelper: Security group in ${zone} deleted`)
  })
}

const describeKeyPair = async() => {
 
  const ec2 = await getEC2Object()
  ec2.describeKeyPairs({ KeyNames: [parameters.keyName]}, (err, data) => {
    if (err) console.log(`DescribeKeyPairHelper: ${err.message}`)
    else     console.log(data)
  })
}

const createKeyPair = async (path) => {
  
  const ec2 = await getEC2Object()

  await describeKeyPair

  const params = {
    KeyName: parameters.keyName
  }

  ec2.createKeyPair(params, (err, data) => {
    if (err) console.log(`CreateKeyPairHelper: ${err.message}`)
    else {
      fileHelper.createKeyFile(data, path)         
    }
  })

}

const deleteKeyPair = async (zone, path) => {

  setRegion(zone)
  const ec2 = await getEC2Object()

  const params = {
    KeyName: parameters.keyName
  }
  ec2.deleteKeyPair(params, function(err, data) {
    if (err) console.log(`DeleteKeyPairHelper: ${err.message}`)
    else { 
      fileHelper.deleteFile(path)
    }           
  })

}


const getInstanceIds = async (id) => {
  
  const ec2 = await getEC2Object()

  var params = {
    SpotInstanceRequestIds: [id]
  }
  let instanceIds = []

  let counter = parameters.waitForInstanceId

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
    counter = counter - 1 

    if(instanceIds[0] !== undefined) break
    if(counter === 0) break
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

const rebootInstance = async (zone, id) => {

  setRegion(zone)
  const ec2 = await getEC2Object()

  const params = {
    InstanceIds: [
       id
    ]
   }
   ec2.rebootInstances(params, (err, data) => {
     if (err) console.log(`RebootInstanceHelper: ${err.message}`)
     else     console.log(`RebootInstanceHelper: ${id} is rebooting`)
   })
}

const getInstanceStatus = async (zone, ids) => {

  setRegion(zone)
  const ec2 = await getEC2Object()

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

const getInstanceState = async (zone, ids) => {

  setRegion(zone)
  const ec2 = await getEC2Object()

  return await new Promise((resolve) => {
    ec2.describeInstanceStatus({ InstanceIds: ids, IncludeAllInstances: true }, async (err, data) => {
      if (err) console.log(`SpotInstanceHelper: ${err.message}`) 
      else {
        status = data.InstanceStatuses[0].InstanceState.Name
        resolve(status)
      }       
    })
  })
  
}

const requestSpotInstance = async (instance, zone, serverImage, bidprice, simulation, id, path) => {

  setRegion(zone)
  const ec2 = await getEC2Object()
  const imageId = await describeImages(serverImage)
  const securityGroupId = await createSecurityGroup(zone)
  await createKeyPair(path)
  console.log(`ImageDescribeHelper: For ${zone} the following image was chosen: ${imageId.Images[0].Name}`) 
  
  let params = {
    InstanceCount: 1, 
    DryRun: isSimulation(simulation),
    LaunchSpecification: {
     ImageId: imageId.Images[0].ImageId, 
     InstanceType: instance,
     KeyName: 'elmit', 
     Placement: {
      AvailabilityZone: zone
     }, 
     SecurityGroupIds: [
      securityGroupId
     ]
    }, 
    SpotPrice: `${bidprice}`, 
    Type: 'persistent'
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



module.exports = { 
  startInstance,
  stopInstance,
  rebootInstance, 
  deleteSecurityGroup, 
  deleteKeyPair, 
  getEC2Object, 
  getInstanceIds, 
  getInstanceStatus, 
  getInstanceState,
  requestSpotInstance, 
  cancelSpotInstance, 
  getPublicIpFromRequest, 
  waitForInstanceToBoot 
}