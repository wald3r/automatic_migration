const {spawn} = require('child_process')
const fs = require('fs');
const parameters = require('../parameters')

const trainModel = (instance, product) => {

  console.log(parameters.mlTrainFile)
  const python = spawn('python3', [parameters.mlTrainFile, instance, product])
  console.log(`Start training ml model ${instance} ${product}`)

  python.stdout.on('data', (data) => {
    console.log(data.toString())
  })
}


const deleteModel = (instance, product) => {

  console.log(parameters.mlDeleteFile)
  const python = spawn('python3', [parameters.mlDeleteFile, instance, product])
  console.log(`Delete training ml model ${instance} ${product}`)

  python.stdout.on('data', (data) => {
    console.log(data.toString())
  })
}


module.exports = { trainModel, deleteModel }