const fs = require('fs')
const Path = require('path')
const parameters = require('../parameters')

const deleteFolderRecursively = (path) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      const curPath = Path.join(path, file)
      if (fs.lstatSync(curPath).isDirectory()) { 
        deleteFolderRecursively(curPath)
      } else { 
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(path)
  }
}


const createDirectory = async (path, file) => {

  const parts = file.name.split('___')[1]
  let dirParts = parts.split('__').splice(1, parts.length)
  let list = file.name.split('___')
  let totalPath = path

  await new Promise((resolve) => {
    dirParts.map(folder => {
      let length = dirParts.length
      if(folder === dirParts[length-1]){
        console.log(`DirectoryCreaterHelper: ${folder} is not a folder`)
      }else{
        totalPath = `${totalPath}/${folder}`
        if (!fs.existsSync(totalPath)){
          fs.mkdirSync(totalPath, { recursive: true })
          console.log(`DirectoryCreaterHelper: ${folder} folder created`)
        } else{
          console.log(`DirectoryCreaterHelper: ${folder} folder already exists`)
        }
      }
      if(dirParts[dirParts.length -1] === folder){
        resolve()
      }
    })
  })
  
  let answer = true
  await new Promise((resolve) => {
    file.mv(`${totalPath}/${list[list.length-1]}`, err => {
      if (err){
        console.log(`DirectoryCreaterHelper: ${file.name} could not save file`)
        answer = false
        resolve()
      }else{
        console.log(`DirectoryCreaterHelper: ${file.name} file saved`)
      }
      resolve()
    })
  })

  return answer

}

const deleteFile = (path) => {

  fs.unlink(path, (err) => {
    if (err) console.log(`FileDeleteHelper: ${err.message}`)
  })
  
}

const createKeyFile = (key, path) => {
  const fileName = `${path}/${parameters.keyFileName}`

  fs.writeFile(fileName, key.KeyMaterial, (err) => {
    if (err) console.log(`KeyCreatorHelper: ${err.message}`)
    
  })
  
}

module.exports = { deleteFile, createKeyFile, createDirectory, deleteFolderRecursively }