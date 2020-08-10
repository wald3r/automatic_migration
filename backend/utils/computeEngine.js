const Compute = require('@google-cloud/compute')

const projectId = 'automaticmigration'
const keyFile = '/home/walder/Downloads/automaticMigration-65e56cf0b2a0.json'
const http = require('http')
const compute = new Compute({projectId, keyFile})


const getZones = async () => {

  return await new Promise((resolve) => {
    compute.getZones((err, zones) => {
      if(err) console.log(err)
      resolve(zones)
    }) 
  })
}

const config = {
  os: 'ubuntu',
  http: true,
  metadata: {
    items: [
      {
        key: 'startup-script',
        value: `#! /bin/bash
        sudo apt install -y docker &&
        sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose &&
        sudo chmod +x /usr/local/bin/docker-compose &&
        sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose &&
        sudo usermod -aG docker ec2-user &&
        sudo service docker restart &&
        exit`
      },
    ]
  }
}


const startVM = async(name) => {

  const zones = await getZones()
  const zone = compute.zone(zones[0].metadata.name)
  const vm = zone.vm(name)

  const data = await vm.create(config)
  //const [vm, operation] = await zone.createVM(name, {os: 'ubuntu'})

  await data[1].promise()


  const metadata = await vm.getMetadata()
  const ip = metadata[0].networkInterfaces[0].accessConfigs[0].natIP
  console.log(ip)
  let waiting = true;
    const timer = setInterval(
      ip => {
        http
          .get('http://' + ip, res => {
            const statusCode = res.statusCode;
            if (statusCode === 200 && waiting) {
              waiting = false
              clearTimeout(timer)
              // HTTP server is ready.
              console.log('Ready!')
              console.log(ip)
            }
          })
          .on('error', () => {
            // HTTP server is not ready yet.
            process.stdout.write('.')
          })
      },
      2000,
      ip
    )
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