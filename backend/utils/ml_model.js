const {spawn} = require('child_process')
const fs = require('fs');
const trainFile = __dirname + `/ml_model/train_ml_model.py`

const trainModel = (instance, product) => {

  spawn('python', [trainFile, instance, product])
  console.log(`Start training ml model ${instance} ${product}`)
}

module.exports = { trainModel }