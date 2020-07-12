const fs = require('fs')
const Path = require('path')

const deleteFolderRecursively = (path) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      const curPath = Path.join(path, file)
      if (fs.lstatSync(curPath).isDirectory()) { 
        deleteFolderRecursive(curPath)
      } else { 
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(path)
  }
}


module.exports = { deleteFolderRecursively }