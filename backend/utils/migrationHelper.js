const spotInstances = require('./spotInstances')
const sshConnection = require('./sshConnection')
const databaseHelper = require('./databaseHelper')
const mlModel = require('../utils/mlModel')
const timeHelper = require('./timeHelper')
const parameters = require('../parameters')


const getPrediction = async (instance, image) => await mlModel.predictModel(instance.type, instance.product, image)

const deletePredictions = (image) => mlModel.deletePredictions(image)

const rebootInstance = async (image) => await spotInstances.rebootInstance(image.zone, image.spotInstanceId)

const terminateInstance = async (image) => {
  await spotInstances.deleteKeyPair(image.zone, image.key)
  await spotInstances.cancelSpotInstance(image)
  await spotInstances.deleteSecurityGroup(image.zone)
}

const startInstance = async (instance, image) => {
  const zone = await getPrediction(instance, image)

  const requestId = await spotInstances.requestSpotInstance(instance.type, zone, instance.product, instance.bidprice, instance.simulation, image.rowid, image.path)
  const instanceIds = await spotInstances.getInstanceIds(requestId)

  if(instanceIds.length === 0){
    return false
  }
  const ip = await spotInstances.getPublicIpFromRequest(instanceIds)
  console.log('MigrationHelper: Waiting for instance to boot')
  await spotInstances.waitForInstanceToBoot(instanceIds)

  const db = await databaseHelper.openDatabase()
  const params = ['running', instanceIds[0], ip, timeHelper.utc_timestamp, image.rowid]
  const values = 'status = ?, spotInstanceId = ?, ip = ?, updatedAt = ?'
  await databaseHelper.updateById(db, parameters.imageTableName, values, params)
  await databaseHelper.closeDatabase(db)

  setupServer(ip, image)

  return true
}

const setupServer = (ip, image) => {
  sshConnection.setUpServer(ip, image.key, image.path)
}







module.exports = { 
  rebootInstance, 
  deletePredictions, 
  startInstance, 
  setupServer, 
  getPrediction, 
  terminateInstance 
}