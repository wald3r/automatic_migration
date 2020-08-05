const Compute = require('@google-cloud/compute')


const compute = new Compute()

const getZones = async () => {

  return await new Promise((resolve) => {
    compute.getZones((err, zones) => {
      if(err) console.log(err)
      console.log(zones)
      resolve(zones)
    }) 
  })
}


const startVM = async(name) => {

  const zones = await getZones()
  const zone = compute.zone('us-central1-c')

  const [vm, operation] = await zone.createVM(name, {os: 'ubuntu'})
  console.log(vm)

  await operation.promise()

  console.log('Virtual machine created!')
}




const deleteVM = async (name) => {

    const compute = new Compute()
    const zone = compute.zone('us-central1-c')

    const vm = zone.vm(name)

    const [operation] = await vm.delete()
    await operation.promise()

    console.log('VM deleted!')
  }



module.exports = { startVM, deleteVM, getZones }