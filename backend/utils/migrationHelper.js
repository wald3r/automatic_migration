const spotInstances = require('./spotInstances')
const sshConnection = require('./sshConnection')
const databaseHelper = require('./databaseHelper')
const mlModel = require('../utils/mlModel')
const timeHelper = require('./timeHelper')
const parameters = require('../parameters')
const scheduler = require('./scheduler')
const spotPrices = require('./spotPrices')

const getPrediction = async (model, image, user) => {
  
  await new Promise ((resolve) => {
    spotPrices.collectSpecificSpotPrices(model.type)
    resolve()
  })
  await mlModel.predictModel(model.type, model.product, image, user)
}

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

const setScheduler = async (image, model, user, flag) => {

  let newImage = null
  if(flag){
    const db = await databaseHelper.openDatabase()
    newImage = await databaseHelper.selectById(db, parameters.imageTableValues, parameters.imageTableName, image.rowid)
    await databaseHelper.insertRow(db, parameters.migrationTableName, `(null, ?, ?, ?, ?, ?, ?,  ?)`, [newImage.zone, null, 1, newImage.spotInstanceId, newImage.rowid, Date.now(), Date.now()])
    await databaseHelper.closeDatabase(db)
  }
  let hour = timeHelper.getMigrationHour(Date.now())
  let minutes = timeHelper.getMigrationMinutes(Date.now())
  scheduler.setMigrationScheduler(`${minutes} ${hour} * * *`, model, newImage === null ? image : newImage, user)

}

const setSchedulerAgain = async (image, model, user, time) => {

  let hour = timeHelper.getMigrationHour(time)
  let minutes = timeHelper.getMigrationMinutes(time)

  let hoursToMs = parameters.migrationHour * 3600 * 1000
  let minToMs = parameters.migrationMinutes * 60 * 1000
  console.log(Date.now(), (time+hoursToMs+minToMs))
  if(Date.now() > (time+hoursToMs+minToMs)){
    console.log(`ChangeSchedulerHelper: Set new scheduler time for ${image.rowid}`)
    scheduler.setMigrationScheduler(`${new Date(Date.now()).getMinutes()+2} ${new Date(Date.now()).getHours()} * * *`, model, image, user)
  }else{
    console.log(`ChangeSchedulerHelper: Set old scheduler time for ${image.rowid}`)
    scheduler.setMigrationScheduler(`${minutes} ${hour} * * *`, model, image, user)
  }

}

const newInstance = async (model, image, user) => {
  const tmp = image
  const zone = await getPrediction(model, image, user)
  if(zone !== image.zone){
    const flag = await requestAndSetupInstance(model, image, zone)
    await setScheduler(image, model, user, true)
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
      await databaseHelper.updateById(db, parameters.migrationTableName, 'count = ?, updatedAt = ?', [row.count+1, Date.now(), row.rowid])
    })
    await databaseHelper.closeDatabase(db)
    await setScheduler(image, model, user, false)
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
  terminateInstance,
  setSchedulerAgain 
}