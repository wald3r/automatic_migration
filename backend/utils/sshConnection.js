const NodeSSH = require("node-ssh");
const parameters = require('../parameters')

ssh = new NodeSSH()


const setUpServer = async (ip, pathToKey, pathToDocker) => {

  const failed = []
  const successful = []   
  
  return await new Promise((resolve) => {
    ssh.connect({
      host: ip,
      username: parameters.ec2Username,
      privateKey: pathToKey,
      readyTimeout: 99999
    })
    .then(() => {
      ssh.putDirectory(pathToDocker, `/home/${parameters.ec2Username}/image`, {
        recursive: true,
        concurrency: 10,
        tick: (localPath, remotePath, error) => {
          if (error) {
            failed.push(localPath)
          } else {
            successful.push(localPath)
          }
        }
      }).then((status) => {
        console.log(`SSHConnectionHelper: The directory transfer to ${ip} was ${status ? 'successful' : 'unsuccessful'}`)
        console.log(`SSHConnectionHelper: failed transfers to ${ip}: ${failed.join(', ')}`)
        console.log(`SSHConnectionHelper: successful transfers to ${ip}: ${successful.join(', ')}`)
        resolve()
      })
      
      
    })
  })
  
}

const startDocker = async (ip, pathToKey) => {
  let promise = await new Promise((resolve) => {
    ssh.connect({
      host: ip,
      username: parameters.ec2Username,
      privateKey: pathToKey,
      readyTimeout: 99999
    })
    .then(() => {
      ssh.execCommand(`cd /home/${parameters.ec2Username}/image/ && sudo docker-compose up -d && exit`).then((result) => {
        console.log(`STDOUT of ${ip}: ${result.stdout}`)
        console.log(`STDERR of ${ip}: ${result.stderr}`)
        resolve(1)
      })
    }).catch((exception) => {
      console.log(exception)
      resolve(-1)
    })
  })
  if(promise === -1){
    throw new Error('Can not start docker')
  }
}

const installSoftware = async (ip, pathToKey) => {

  let promise = await new Promise((resolve) => {
    ssh.connect({
      host: ip,
      username: parameters.ec2Username,
      privateKey: pathToKey,
      readyTimeout: 99999
    })
    ssh.execCommand(`chmod +xr /home/${parameters.ec2Username}/image/install.sh && cd /home/${parameters.ec2Username}/image/ && ./install.sh && exit`).then((result) => {
      console.log(`STDOUT of ${ip}: ${result.stdout}`)
      console.log(`STDERR of ${ip}: ${result.stderr}`)
      resolve(1)
    }).catch((error) => {
      console.log(error)
      resolve(-1)
    })
  })
  if(promise === -1){
    throw new Error('Can not install software')
  }
}

const endDocker = async (ip, pathToKey) => {
  let promise = await new Promise((resolve) => {
    ssh.connect({
      host: ip,
      username: parameters.ec2Username,
      privateKey: pathToKey,
      readyTimeout: 99999
    })
    .then(() => {
      ssh.execCommand(`cd /home/${parameters.ec2Username}/image && sudo docker-compose down && exit`).then((result) => {
        console.log(`STDOUT of ${ip}: ${result.stdout}`)
        console.log(`STDERR of ${ip}: ${result.stderr}`)
        resolve(1)
      })
    })
    .catch((exception) => {
      resolve(-1)
    })
  })
  if(promise === -1){
    throw new Error('Can not stop docker')
  }
 
}

const executeMigration = async (fromIp, toIp, pathToKey, key) => {

  console.log(fromIp)
  console.log(toIp)
  console.log(pathToKey)
  console.log(key)  
  let promise = await new Promise((resolve) => {
    ssh.connect({
      host: fromIp,
      username: parameters.ec2Username,
      privateKey: pathToKey,
      readyTimeout: 99999
    })
    .then(() => {
      ssh.execCommand(`cd /home/${parameters.ec2Username}/image && sudo chmod +xr *.sh && ./migration.sh ${toIp} ${key}`).then((result) => {
        console.log(`STDOUT of ${fromIp}: ${result.stdout}`)
        console.log(`STDERR of ${fromIp}: ${result.stderr}`)
        resolve(1)
      })
    })
    .catch((exception) => {
      console.log(exception)
      resolve(-1)
    })
  })
  if(promise === -1){
    throw new Error('Can not execute migration')
  }
}

const copyKey = async (ip, pathToKey1, pathToKey2) => {

  let strings = pathToKey1.split('/')
  let keyName = strings[strings.length -1]
  let promise = await new Promise((resolve) => {
    ssh.connect({
      host: ip,
      username: parameters.ec2Username,
      privateKey: pathToKey1,
      readyTimeout: 99999
    }).then(() => {
      ssh.putFile(pathToKey2, `/home/${parameters.ec2Username}/image/${keyName}`)
      .then(() => {
        console.log(`CopyKeyHelper: The key ${pathToKey2} was copied successfully to ${ip}`)
        resolve(1)
      }, (error) => {
        console.log(`CopyKeyHelper: The copying of the key ${pathToKey2} to ${ip} failed`)
        console.log(error)
        resolve(-1)
      })
    })
  })
  if(promise === -1){
    //throw new Error('Can not copy key file')
  }

}


module.exports = { installSoftware, setUpServer, startDocker, endDocker, copyKey, executeMigration }