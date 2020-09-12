const Compute = require('@google-cloud/compute')
const projectId = 'automaticmigration'
const keyFile = '/home/walder/Downloads/automaticMigration-65e56cf0b2a0.json'
const compute = new Compute({projectId, keyFile})
const databaseHelper = require('./databaseHelper')
const parameters = require('../parameters')

const getZones = async () => {

  return await new Promise((resolve) => {
    compute.getZones((err, zones) => {
      if(err) console.log(err)
      resolve(zones)
    }) 
  })
}

const createSecurityConfig = async (port) => {
  const config = {
    protocols: {
      udp: [port, 22],
      tcp: [port, 22],
    },
    priority: 1,
    logs: true,
    ranges: ['0.0.0.0/0']
  }


  const network = compute.network('default')

  list = await new Promise((resolve) => {
    network.getFirewalls((err, firewalls) => {
      resolve(firewalls.filter(firewall => firewall.metadata.name === 'elmit-firewall'))
    })
  })

  if(list.length === 0){
    network.createFirewall('elmit-firewall', config, (err, firewall, operation, apiResponse) => {
      if(err) console.log(err)
        console.log('test')
    })
  }
 
}

const findMachineType = async (cpu, memory) => {
  let amemorylow = memory * 0.6
  let amemoryhigh = memory * 1.4
  
  let list = []
  await new Promise((resolve) => {
    compute.getMachineTypes((err, machineTypes) => {
      if(err) console.log(err)
      else {
        machineTypes.filter(type => {
          let gcpu = type.metadata.guestCpus
          let gmemory = Number(Math.round((type.metadata.memoryMb / 1024)+'e1')+'e-1')
          if(gcpu === cpu && (amemorylow <= gmemory && amemoryhigh >= gmemory)){
            list = list.concat(type)
          }
        })
        resolve()
      }
    })
  })
  
  let type = null
  let max = 0
  list.map(t => {
    if(t.metadata.memoryMb > max){
      max = t.metadata.memoryMb
      type = t
    }
  })

  console.log(type)
  return type
}


const startVM = async(id, machine, port) => {

  const zones = await getZones()
  const zone = compute.zone(zones[0].metadata.name)
  await createSecurityConfig(port)
  const vm = zone.vm(`elmit_${id}`)

  const generalConfig = {
    os: 'ubuntu',
    http: true,
    https: true,
    machineType: machine,
    networkInterfaces: [
      {
        network: 'global/networks/default'
      }
    ],
  }

  const data = await vm.create(generalConfig)

  await data[1].promise()


  const metadata = await vm.getMetadata()
  const ip = metadata[0].networkInterfaces[0].accessConfigs[0].natIP
  await databaseHelper.updateById(parameters.imageTableName, 'ip = ?', [ip, id])

}




const deleteVM = async (name) => {

    const zone = compute.zone(zones[0].metadata.name)

    const vm = zone.vm(name)

    const [operation] = await vm.delete()
    await operation.promise()

    console.log('VM deleted!')
  }



module.exports = { findMachineType, startVM, deleteVM, getZones }
