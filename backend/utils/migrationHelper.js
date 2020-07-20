const spotInstances = require('./spotInstances')
const sshConnection = require('./sshConnection')
const databaseHelper = require('./databaseHelper')
const mlModel = require('../utils/mlModel')
const timeHelper = require('./timeHelper')
const parameters = require('../parameters')


const getPrediction = async (model, image) => await mlModel.predictModel(model.type, model.product, image)

const deletePredictions = (image) => mlModel.deletePredictions(image)

const stopInstance = async (image) => await spotInstances.stopInstance(image.spotInstanceId, image.zone)
const startInstance = async (image) => await spotInstances.startInstance(image.spotInstanceId, image.zone)

const rebootInstance = async (image) => await spotInstances.rebootInstance(image.zone, image.spotInstanceId)

const terminateInstance = async (image) => {
  await spotInstances.deleteKeyPair(image.zone, image.key, image.rowid)
  await spotInstances.cancelSpotInstance(image)
  await spotInstances.deleteSecurityGroup(image.zone)
}

const newInstance = async (model, image) => {
  const zone = await getPrediction(model, image)

  const requestId = await spotInstances.requestSpotInstance(model.type, zone, model.product, model.bidprice, model.simulation, image.rowid, image.path, image.key)
  const instanceIds = await spotInstances.getInstanceIds(requestId, image.rowid)
  if(instanceIds.length === 0){
    return false
  }
  const ip = await spotInstances.getPublicIpFromRequest(instanceIds, image.rowid)
  console.log(`InstanceBootHelper: Waiting for instance ${instanceIds} to boot`)
  await spotInstances.waitForInstanceToBoot(instanceIds)

  await setupServer(ip, image)
  await startDocker(ip, image.key)
  const db = await databaseHelper.openDatabase()
  const params = ['running', timeHelper.utc_timestamp, image.rowid]
  const values = 'status = ?, updatedAt = ?'
  await databaseHelper.updateById(db, parameters.imageTableName, values, params)
  await databaseHelper.closeDatabase(db)
  return true
}

const setupServer = async (ip, image) => {
  await sshConnection.setUpServer(ip, image.key, image.path)
}

const startDocker = async (ip, key) => {
  await sshConnection.startDocker(ip, key)
}






module.exports = { 
  stopInstance,
  newInstance,
  rebootInstance, 
  deletePredictions, 
  startInstance, 
  setupServer, 
  getPrediction, 
  terminateInstance 
}