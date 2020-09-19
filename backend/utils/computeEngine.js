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
          if(gcpu === Number(cpu) && (amemorylow <= gmemory && amemoryhigh >= gmemory)){
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
  return type
}

const setSSHKey = async (vm) => {

  const metadata = {
    customKey: 'AAAAB3NzaC1yc2EAAAADAQABAAACAQDqflp/R2I1THP2dOKhU864ht3gyBtdLyNaTZXmPDi2zbKT7xnrF0IDcf7UbwpWvSPxnubR9qNZ/YhH7U5tDJ4ZbCuneoWsv+8XgcMYDFXq/7aV80d74L7U2vShi3cbfjC0EKtvqqpLHRObscdkrlLa1So1ADK4bP4eNk6k+Q7OifvlBneJ132PA2dFvSpDwwjDz8w4ZqbXYhZkQCTj+C1Zyv8QCmRAE632uzxHKmk0waozIWSvX/W8zZqHYrE6638qWFIIPGegiAfizmoiaIRaHmfdHsUkvNkbTdWgWBNmq/WBN7QHQl7OQLf8KQHlOrKZauT/ft8De6SAQIA1PgBOcp9pLjZJrswonSwqWn5ONfg12o55dCzHpQ/urnZxi6z6+RC3oK4BoVn082ejB58PBoG4c+p+PxC2nFbciapH7YJ88DJm9YoUl16RyIvpZLLAL0YuHfWtrAGfVpRNW7ug1z0tvCSx2w8+SzwYnWFcnGCMyZ2ctNr4sMCJOoElxQG5eEx0OZCHL/yN46tO8mOoPhI1L0Mcctp6Y9WxPPXIJqoPI25SmGcNK9jlhkXN1VP6yv6/ua1fcQJkbnN4rccEuZhYHLZbDE/FDgEpEfsPFTipDwt2nKj2/6p93BCIP8BCsD8NAcKS8KzNNWFvA/jwA0TfwsQJXOte5QdHY+BYew=='
  }

  await new Promise((resolve) => {
    vm.setMetadata({customKey: null}, (error) => {
      if(error) console.log(`SetEngineSSHKeyHelper:  ${error}`)
      else{
        resolve()
      }
    })
  })

  await new Promise((resolve) => {
    vm.setMetadata(metadata, (error) => {
      if(error) console.log(`SetEngineSSHKeyHelper:  ${error}`)
      else{
        console.log(`SetEngineSSHKeyHelper: Key successfully set`)
        resolve()
      }
    })
  })

}




const startVM = async(id, machine, port, chosenRegion) => {

  let regions = []
  await new Promise((resolve) => {
    compute.getZones((err, zones) => {
      if(err) console.log(`EngineHelper: Problems with collecting Zones`)
      else{
        regions = zones.filter(z => z.metadata.name.includes(chosenRegion[0]))
        resolve(regions)
      }
    })
  })

  const zone = await compute.zone(regions[0].metadata.name)
  await databaseHelper.updateById(parameters.imageTableName, 'zone = ?', [regions[0].metadata.name, id])

  await createSecurityConfig(port)
  const vm = zone.vm(`elmit${id}`)
  

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

  //await setSSHKey(vm)

}




const deleteVM = async (name, fromZone) => {

    const zone = compute.zone(fromZone)

    const vm = zone.vm(name)

    const [operation] = await vm.delete()
    await operation.promise()

    console.log(`ComputeEngineHelpler: Instance with the name ${name} has been terminated`)
  }



module.exports = { findMachineType, startVM, deleteVM, getZones }
