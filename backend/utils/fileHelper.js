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

const deleteFile = async (path) => {

  return await new Promise((resolve) => {
    fs.unlink(path, (err) => {
      if (err) console.log(`FileDeleteHelper: ${err.message}`)
      resolve()
    })
  })
 
}

const renameFile = (oldFile, newFile) => {
  fs.rename(oldFile, newFile, (err) => {
    if (err) console.log(`FileRenameHelper: ${err.message}`)
  })
}

const createPath = (path) => {
  if (!fs.existsSync(path)){
    fs.mkdirSync(path, { recursive: true })
  } 
}

const copyFile = (filepath1, filepath2, filename) => {
  fs.copyFile(filepath1, filepath2+filename, (err) => {
    if(err) console.log(`CopyFileHelper: Could not copy file to ${filepath2+filename}`)
    else console.log(`CopyFileHelper: Copied file to ${filepath2+filename}`)
  })
}

const createKeyFile = async (key, path) => {
  
  let finalPath = path
  await new Promise((resolve) => {
    if (fs.existsSync(finalPath)) {
      finalPath = finalPath.replace('.pem', '_1.pem')
    }
    fs.writeFile(finalPath, key.KeyMaterial, (err) => {
      if (err) console.log(`KeyCreatorHelper: ${err.message}`)
      resolve()  
    })
  })
  
  fs.chmod(finalPath, 0o400, (err) => {
    if (err) console.log(`KeyCreatorHelper: ${err.message}`)
  })
  
}

module.exports = { createPath, copyFile, deleteFile, createKeyFile, createDirectory, deleteFolderRecursively, renameFile }
