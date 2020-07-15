const spotInstances = require('./spotInstances')
const sshConnection = require('./sshConnection')
const databaseHelper = require('./databaseHelper')
const mlModel = require('../utils/mlModel')
const timeHelper = require('./timeHelper')
const parameters = require('../parameters')


const getPrediction = async (instance) => await mlModel.predictModel(instance.type, instance.product)

const terminateInstance = async (image) => {
  await spotInstances.cancelSpotInstance(image.requestId)
}


const startInstance = async (instance, image) => {
  const newZone = await getPrediction(instance)
  const requestId = await spotInstances.requestSpotInstance(instance.type, newZone, instance.product, instance.bidprice, instance.simulation, image.rowid)

  const instanceIds = await spotInstances.getInstanceIds(requestId)
  const ip = await spotInstances.getPublicIpFromRequest(instanceIds)
  console.log('MigrationHelper: Waiting for instance to boot')
  await spotInstances.waitForInstanceToBoot(instanceIds)

  const db = await databaseHelper.openDatabase()
  const params = ['running', instanceIds[0], ip, timeHelper.utc_timestamp, image.rowid]
  const values = 'status = ?, spotInstanceId = ?, ip = ?, updatedAt = ?'
  await databaseHelper.updateById(db, parameters.imageTableName, values, params)
  await databaseHelper.closeDatabase(db)

  setupServer(ip, image)
}

const setupServer = (ip, image) => {
  console.log(image)
  sshConnection.setUpServer(ip, image.key, image.path)
}







module.exports = { startInstance, setupServer, getPrediction, terminateInstance }