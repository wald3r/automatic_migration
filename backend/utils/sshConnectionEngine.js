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


const installSoftware = async (ip) => {

  let promise = await new Promise((resolve) => {
    ssh.connect({
      host: ip,
      username: parameters.engineUsername,
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


module.exports = { setUpServer, installSoftware }
