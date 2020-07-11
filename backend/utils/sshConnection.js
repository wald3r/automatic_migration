const NodeSSH = require("node-ssh");
const parameters = require('../parameters')

ssh = new NodeSSH()


const setUpServer = (ip, pathToKey, pathToDocker) => {


  ssh.connect({
    host: ip,
    username: parameters.ec2Username,
    privateKey: pathToKey
  })
  .then(() => {
    // Local, Remote
    ssh.putFile(pathToDocker, `/home/${parameters.ec2Username}/`).then(() => {
      console.log(`Folder export ${pathToDocker} to ${ip} worked!`)
    }, (error) => {
      console.log(`Folder export ${pathToDocker} to ${ip} failed!`)
      console.log(error)
    })
  })
}

module.exports = { setUpServer }