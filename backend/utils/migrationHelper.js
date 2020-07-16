const spotInstances = require('./spotInstances')
const sshConnection = require('./sshConnection')
const databaseHelper = require('./databaseHelper')
const mlModel = require('../utils/mlModel')
const timeHelper = require('./timeHelper')
const parameters = require('../parameters')


const getPrediction = async (instance, image) => await mlModel.predictModel(instance.type, instance.product, image)

const deletePredictions = (image) => mlModel.deletePredictions(image)

const terminateInstance = async (image) => {
  await spotInstances.cancelSpotInstance(image)
}


const startInstance = async (instance, image) => {
  const prediction = await getPrediction(instance, image)
  const newZone = prediction[0]
  console.log(newZone)
  /*const requestId = await spotInstances.requestSpotInstance(instance.type, newZone, instance.product, instance.bidprice, instance.simulation, image.rowid)

  const instanceIds = await spotInstances.getInstanceIds(requestId)
  const ip = await spotInstances.getPublicIpFromRequest(instanceIds)
  console.log('MigrationHelper: Waiting for instance to boot')
  await spotInstances.waitForInstanceToBoot(instanceIds)

  const db = await databaseHelper.openDatabase()
  const params = ['running', instanceIds[0], ip, timeHelper.utc_timestamp, image.rowid]
  const values = 'status = ?, spotInstanceId = ?, ip = ?, updatedAt = ?'
  await databaseHelper.updateById(db, parameters.imageTableName, values, params)
  await databaseHelper.closeDatabase(db)

  setupServer(ip, image)*/
}

const setupServer = (ip, image) => {
  console.log(image)
  sshConnection.setUpServer(ip, image.key, image.path)
}







module.exports = { deletePredictions, startInstance, setupServer, getPrediction, terminateInstance }