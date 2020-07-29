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
        ssh.execCommand(`chmod +xr /home/${parameters.ec2Username}/image/install.sh && cd /home/${parameters.ec2Username}/image/ && ./install.sh && exit`).then((result) => {
          console.log(`STDOUT of ${ip}: ${result.stdout}`)
          console.log(`STDERR of ${ip}: ${result.stderr}`)
          resolve()
        })
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

module.exports = { setUpServer, startDocker, endDocker }