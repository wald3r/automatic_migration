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
    ssh.putDirectory(pathToDocker, `/home/${parameters.ec2Username}/`, {
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
      console.log('the directory transfer was', status ? 'successful' : 'unsuccessful')
      console.log('failed transfers', failed.join(', '))
      console.log('successful transfers', successful.join(', '))
    })
  })
}

module.exports = { setUpServer }