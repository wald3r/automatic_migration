const fs = require('fs')
const Path = require('path')

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

module.exports = { createDirectory, deleteFolderRecursively }