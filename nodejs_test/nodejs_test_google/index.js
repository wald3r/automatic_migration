const Compute = require('@google-cloud/compute')

const compute = new Compute()

const getVMS = async () => {
  
  const zone = compute.zone('use-central1-a')
  const [vm, operation] = await zone.createVM('test', {os: 'ubuntu'})
  
  console.log(vm)
  await operation.promise()

  console.log('done')
}

getVMS()