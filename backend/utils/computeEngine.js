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
        cd /home/walder90/ mkdir test
        sudo apt-get install \
          apt-transport-https \
          ca-certificates \
          curl \
          gnupg-agent \
          software-properties-common &&
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - &&
        sudo apt-key fingerprint 0EBFCD88 &&
        sudo add-apt-repository \
          "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) \
          stable" &&
        sudo apt-get install docker-ce docker-ce-cli containerd.io &&
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


const pricingInfo = async() => {

  const version = require('@google-cloud/billing')
  const billing = version.v1
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
  let waiting = true
    const timer = setInterval(
      ip => { http
        .get('http://' + ip, res => {
          const statusCode = res.statusCode
          console.log(statusCode)
          if (statusCode === 200 && waiting) {
            waiting = false
            clearTimeout(timer)
            console.log('Ready!')
            console.log(ip)
          }
        })
        .on('error', () => {
          process.stdout.write('.')
        })
      },
      2000
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



module.exports = { startVM, deleteVM, getZones, pricingInfo }