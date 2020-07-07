const AWS = require('aws-sdk')


const requestSpotInstance = (instance, zone, bidprice) => {

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
    DryRun: true,
    LaunchSpecification: {
     IamInstanceProfile: {
      Arn: "arn:aws:iam::123456789012:instance-profile/my-iam-role"
     }, 
     ImageId: "ami-1a2b3c4d", 
     InstanceType: `${instance}`, 
     KeyName: "my-key-pair", 
     Placement: {
      AvailabilityZone: `${zone}`
     }, 
     SecurityGroupIds: [
        "sg-1a2b3c4d"
     ]
    }, 
    SpotPrice: `${bidprice}`, 
    Type: "one-time"
  }

  ec2.requestSpotInstances(params, function(err, data) {
    if (err) console.log(err.message)
    else{
      console.log(data)
    }     
  
  })
}


module.exports = { requestSpotInstance }