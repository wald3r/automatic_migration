const spotInstances = require('./spotInstances')
const sshConnection = require('./sshConnection')
const databaseHelper = require('./databaseHelper')
const mlModel = require('../utils/mlModel')
const timeHelper = require('./timeHelper')
const parameters = require('../parameters')
const scheduler = require('./scheduler')

const getPrediction = async (model, image, user) => await mlModel.predictModel(model.type, model.product, image, user)

const deletePredictions = (image) => mlModel.deletePredictions(image)

const stopInstance = async (image) => await spotInstances.stopInstance(image.spotInstanceId, image.zone)
const startInstance = async (image) => await spotInstances.startInstance(image.spotInstanceId, image.zone)

const rebootInstance = async (image) => await spotInstances.rebootInstance(image.zone, image.spotInstanceId)

const terminateInstance = async (image) => {
  await spotInstances.deleteKeyPair(image.zone, image.key, image.rowid)
  await spotInstances.cancelSpotInstance(image)
  await spotInstances.deleteSecurityGroup(image.zone)
  await spotInstances.deleteTag(image.spotInstanceId, image.zone)
}


const requestAndSetupInstance = async(model, image, zone) => {
  
 

  const requestId = await spotInstances.requestSpotInstance(model.type, zone, model.product, model.bidprice, model.simulation, image.rowid, image.path, image.key)
  const instanceIds = await spotInstances.getInstanceIds(requestId, image.rowid)
  if(instanceIds.length === 0){
    return false
  }
  await spotInstances.createTag(instanceIds[0], zone)
  const ip = await spotInstances.getPublicIpFromRequest(instanceIds, image.rowid)
  console.log(`InstanceBootHelper: Waiting for instance ${instanceIds} to boot`)
  await spotInstances.waitForInstanceToBoot(instanceIds)

  await setupServer(ip, image)
  await startDocker(ip, image.key)
  const db = await databaseHelper.openDatabase()
  const params = ['running', Date.now(), image.rowid]
  const values = 'status = ?, updatedAt = ?'
  await databaseHelper.updateById(db, parameters.imageTableName, values, params)
  await databaseHelper.closeDatabase(db)
  return true
}

const setScheduler = async (image, model, user) => {

  const db = await databaseHelper.openDatabase()
  const newImage = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, image.rowid)
  await databaseHelper.insertRow(db, parameters.migrationTableName, `(null, ?, ?, ?, ?, ?, ?)`, [newImage.zone, null, newImage.spotInstanceId, newImage.rowid, Date.now(), Date.now()])
  let hour = timeHelper.getMigrationHour(Date.now())
  let minutes = timeHelper.getMigrationMinutes(Date.now())
  scheduler.setMigrationScheduler(`${minutes} ${hour} * * *`, model, newImage, user)
  await databaseHelper.closeDatabase(db)

}

const newInstance = async (model, image, user) => {
  const tmp = image
  const zone = await getPrediction(model, image, user)
  if(zone !== image.zone){
    const flag = await requestAndSetupInstance(model, image, zone)
    await setScheduler(image, model, user)
    if(flag && tmp.zone){
      const db = await databaseHelper.openDatabase()
      const migrationRows = await databaseHelper.selectByValue(db, parameters.migrationTableValues, parameters.migrationTableName, 'oldSpotInstanceId', tmp.spotInstanceId)
      await migrationRows.map(async row => {
        await databaseHelper.updateById(db, parameters.migrationTableName, 'newZone = ?, updatedAt = ?', [zone, Date.now(), row.rowid])
      })
      await databaseHelper.closeDatabase(db)
      await terminateInstance(tmp)
    }
  }else{
    console.log(`MigrationHelper: No migration of ${image.rowid} needed`)
    const db = await databaseHelper.openDatabase()
    const imageRow = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, image.rowid)
    const migrationRows = await databaseHelper.selectByValue(db, parameters.migrationTableValues, parameters.migrationTableName, 'oldSpotInstanceId', imageRow.spotInstanceId)
    await migrationRows.map(async row => {
      await databaseHelper.updateById(db, parameters.migrationTableName, 'newZone = ?, updatedAt = ?', [zone, Date.now(), row.rowid])
    })
    await databaseHelper.closeDatabase(db)
    await setScheduler(image, model, user)
  }

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