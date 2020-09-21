const NodeSSH = require("node-ssh");
const parameters = require('../parameters')

ssh = new NodeSSH()


const setUpServer = async (ip, pathToDocker) => {

  const failed = []
  const successful = []   
  
  return await new Promise((resolve) => {
    ssh.connect({
      host: ip,
      username: parameters.engineUsername,
      //passphrase: parameters.sshEnginePassphrase,
      privateKey: parameters.sshEngineSSHFile

    })
    .then(() => {
      ssh.putDirectory(pathToDocker, `/home/${parameters.engineUsername}/image`, {
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

const copyKey = async (ip, key) => {

  let strings = key.split('/')
  let keyName = strings[strings.length -1]
  let promise = await new Promise((resolve) => {
    ssh.connect({
      host: ip,
      username: parameters.engineUsername,
      passphrase: parameters.sshEnginePassphrase,
      privateKey: parameters.sshEngineSSHFile
    }).then(() => {
      ssh.putFile(key, `/home/${parameters.engineUsername}/image/${keyName}`)
      .then(() => {
        console.log(`CopyKeyHelper: The key ${key} was copied successfully to ${ip}`)
        resolve(1)
      }, (error) => {
        console.log(`CopyKeyHelper: The copying of the key ${key} to ${ip} failed`)
        console.log(error)
        resolve(-1)
      })
    })
  })
  if(promise === -1){
    //throw new Error('Can not copy key file')
  }

}

const executeMigration = async (fromIp, toIp, key, provider) => {
 
  let promise = await new Promise((resolve) => {
    ssh.connect({
      host: fromIp,
      username: parameters.engineUsername,
      passphrase: parameters.sshEnginePassphrase,
      privateKey: parameters.sshEngineSSHFile
    })
    .then(() => {
      ssh.execCommand(`cd /home/${parameters.engineUsername}/image && sudo chmod +xr *.sh && ./migration.sh ${toIp} ${key} ${provider}`).then((result) => {
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


const installSoftware = async (ip) => {

  let promise = await new Promise((resolve) => {
    ssh.connect({
      host: ip,
      username: parameters.engineUsername,
      passphrase: parameters.sshEnginePassphrase,
      privateKey: parameters.sshEngineSSHFile
    
    }).then(() => {
      ssh.execCommand(`chmod +xr /home/${parameters.engineUsername}/image/engine_install.sh && cd /home/${parameters.engineUsername}/image/ && ./engine_install.sh && exit`).then((result) => {
        console.log(`STDOUT of ${ip}: ${result.stdout}`)
        console.log(`STDERR of ${ip}: ${result.stderr}`)
        resolve(1)
      }).catch((error) => {
        console.log(error)
        resolve(-1)
      })
    })
  })
  if(promise === -1){
    throw new Error('Can not install software')
  }
}


const startDocker = async (ip) => {
  let promise = await new Promise((resolve) => {
    ssh.connect({
      host: ip,
      username: parameters.engineUsername,
      //passphrase: parameters.sshEnginePassphrase,
      privateKey: parameters.sshEngineSSHFile
    })
    .then(() => {
      ssh.execCommand(`sudo service docker restart && cd /home/${parameters.engineUsername}/image/ && sudo docker-compose up -d && exit`).then((result) => {
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

const endDocker = async (ip) => {
  let promise = await new Promise((resolve) => {
    ssh.connect({
      host: ip,
      username: parameters.engineUsername,
      passphrase: parameters.sshEnginePassphrase,
      privateKey: parameters.sshEngineSSHFile

    })
    .then(() => {
      ssh.execCommand(`cd /home/${parameters.engineUsername}/image && sudo docker-compose down && exit`).then((result) => {
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



module.exports = { setUpServer, installSoftware, startDocker, endDocker, copyKey, executeMigration }
