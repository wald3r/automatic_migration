const parameters = require('../parameters')
const Compute = require('@google-cloud/compute')
const projectId = parameters.googleProjecId
const keyFile = parameters.googleCloudKeyFile
const compute = new Compute({projectId, keyFile})
const databaseHelper = require('./databaseHelper')
const fileHelper = require('./fileHelper')
const { keys } = require('d3')
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
    items: {
      key: 'ssh-keys',
      value: {
        walder: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDcTPxk0lbLTKPQbBUL1au3v08WLXdQPNiCxBT/ui9SIjM9eO1nA4E8iUlnntRmzPmHEUXtBxiwzZF+xfeYKmAR/TEMbFs3v3Du6ymY9OlUYmNLMm2cVGnSv5lQDw8MWNE0zRSVn9uIVAkrhG1t8xNhGdZAo9cUJ66j+xNzAzo2i7bB/0BqdKemfr7nRhy3l8po5yjJeY5d3vbsDw6HS8l6R1KeiZidQZl5h87XAyk1zPu1UpOCN4KFndHo8jwvI6nOtSnZdrjpFpFklB3lkknC8eiLhYvjxZkIkmIZb/cgVPS7OIpFE0ITAXr3Y5zE93G2LormJvvp0DW+VLip9LQUSTlbxTIT3kmnn6PUYVnmu+qSLw2bzIRv4Bh3/0fomnTBnH3OvMkCLxxXd4+eFvKypf4WOwP8rYzMVOOevgGvmHXxXcqXPhti37cFd28vC4WMltWRh8OFHOad/Xznvyi2wXrQIF0Lfi8RWDz5528qGLYfTtS5qsuNoGJkslklB8U= walder'
      }
    }
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


const getZone = async (chosenRegion) => {

  let regions = []
  await new Promise((resolve) => {
    compute.getZones((err, zones) => {
      if(err) console.log(`EngineHelper: Problems with collecting Zones`)
      else{
        regions = zones.filter(z => z.metadata.name.includes(chosenRegion))
        resolve(regions)
      }
    })
  })

  return regions[0].metadata.name
}



const startVM = async(id, machine, port, chosenZone) => {

  return await new Promise(async (resolve) => {
    await fileHelper.deleteFile(parameters.knownHosts)

    const zone = await compute.zone(chosenZone)
  
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
    await setSSHKey(vm)

    resolve(ip)
    
  
  })
 

}

const getStatus = async (image) => {
  const zone = await compute.zone(image.zone)
  const vm = zone.vm(`elmit${image.rowid}`)

  let status = null
  await new Promise((resolve) => {
    vm.get((err, vm) => {
      if(err) console.log(`StatusEngineHelper: ${err}`)
      else{
       status = vm.metadata.status
       resolve()
      }
    })
  })


  if(status === 'RUNNING')
    status = 'running'
  else if(status === 'STOPPING')
    status = 'stopping'
  else if(status === 'TERMINATED')
    status = 'stopped'

  return status
}


const deleteVM = async (name, fromZone) => {

    const zone = compute.zone(fromZone)

    const vm = zone.vm(name)

    const [operation] = await vm.delete()
    await operation.promise()

    console.log(`ComputeEngineHelpler: Instance with the name ${name} has been terminated`)
  }



module.exports = { getZone, getStatus, findMachineType, startVM, deleteVM, getZones }
