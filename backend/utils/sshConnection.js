const NodeSSH = require("node-ssh");
const parameters = require('../parameters')

ssh = new NodeSSH()


const setUpServer = (ip, pathToKey, pathToDocker) => {

  const failed = []
  const successful = []   
  
  ssh.connect({
    host: ip,
    username: parameters.ec2Username,
    privateKey: pathToKey
  })
  .then(() => {
    // Local, Remote
    ssh.execCommand(`mkdir image`, { cwd: `/home/${parameters.ec2Username}`})
    .then(()=>{
      console.log(`SSHConnectionHelper: Directory Created at ${ip}`)
    })
    ssh.putFile(`${parameters.linuxInstallFile}`, `home/${parameters.ec2Username}/image`).then(() => {
      console.log(`SSHConnectionHelper: Copied installion script to ${ip}`)
    })
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
    })
  })
}
/*
const startDocker = (ip, pathToKey, pathToDocker) => {
  ssh.connect({
    host: ip,
    username: parameters.ec2Username,
    privateKey: pathToKey
  })
  .then(() => {
    ssh.execCommand().then((result) => {

    })
  })
}*/

module.exports = { setUpServer }