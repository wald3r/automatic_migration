const AWS = require('aws-sdk')
const parameters = require('../parameters')

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

const requestSpotInstance = (instance, zone, image, bidprice, simulation) => {

  AWS.config.getCredentials((err) => {
    if (err) console.log(err.stack)
    else {
      console.log('Authenticated with AWS')
    }
  })

  AWS.config.update({region: 'eu-west-3'})
  const ec2 = new AWS.EC2({apiVersion: '2016-11-15'})


  var params = {
    InstanceCount: 1, 
    DryRun: isSimulation(simulation),
    LaunchSpecification: {
     IamInstanceProfile: {
      Arn: "arn:aws:iam::123456789012:instance-profile/my-iam-role"
     }, 
     ImageId: image, 
     InstanceType: instance, 
     KeyName: "my-key-pair", 
     Placement: {
      AvailabilityZone: zone
     }, 
     SecurityGroupIds: [
        "sg-1a2b3c4d"
     ]
    }, 
    SpotPrice: `${bidprice}`, 
    Type: "one-time"
  }

  ec2.requestSpotInstances(params, function(err, data) {
    console.log(`Requesting instance with following parameters: 
      DryRun: ${params.DryRun} 
      Image: ${params.LaunchSpecification.ImageId} 
      InstanceType: ${params.LaunchSpecification.InstanceType} 
      Zone: ${params.LaunchSpecification.Placement.AvailabilityZone}
      BidPrice: ${params.SpotPrice}  
    `)
    if (err) console.log(err.message)
    else{
      console.log(data)
    }     
  
  })
}


module.exports = { getImageId, requestSpotInstance }