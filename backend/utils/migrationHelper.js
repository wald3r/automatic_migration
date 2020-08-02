const spotInstances = require('./spotInstances')
const sshConnection = require('./sshConnection')
const databaseHelper = require('./databaseHelper')
const mlModel = require('../utils/mlModel')
const parameters = require('../parameters')
const scheduler = require('./scheduler')
const spotPrices = require('./spotPrices')
const billingHelper = require('./billingHelper')
const fileHelper = require('./fileHelper')

const getPrediction = async (model, image, user) => {
  
  return await new Promise (async (resolve) => {
    await spotPrices.collectSpecificSpotPrices(model.type)
    const zone = await mlModel.predictModel(model.type, model.product, image, user)
    resolve(zone)
  })
}

const deletePredictions = (image) => mlModel.deletePredictions(image)

const stopInstance = async (image) => image.simulation === 0 ? await spotInstances.stopInstance(image.spotInstanceId, image.zone) : null
const startInstance = async (image) => image.simulation === 0 ? await spotInstances.startInstance(image.spotInstanceId, image.zone) : null

const rebootInstance = async (image) => image.simulation === 0 ? await spotInstances.rebootInstance(image.zone, image.spotInstanceId) : null

const terminateInstance = async (image) => {
  await new Promise(async (resolve) => {
    await spotInstances.deleteKeyPair(image.zone, image.key, image.rowid)
    await spotInstances.cancelSpotInstance(image)
    await spotInstances.deleteTag(image.spotInstanceId, image.zone)
    setTimeout(() => {
      spotInstances.deleteSecurityGroup(image.zone, image.rowid)
    }, 50000)
    resolve()
  })
  
}


const requestAndSetupInstance = async(model, image, zone) => {
  
  const requestId = await spotInstances.requestSpotInstance(model.type, zone, model.product, image.bidprice, image.simulation, image.rowid, image.key, image.port)
  await databaseHelper.updateById(parameters.imageTableName, 'zone = ?', [zone, image.rowid])
  if(image.simulation === 0){
    const instanceIds = await spotInstances.getInstanceIds(requestId, image.rowid)
    if(instanceIds.length === 0){
      return false
    }
    await spotInstances.createTag(instanceIds[0], zone)
    await spotInstances.getPublicIpFromRequest(instanceIds, image.rowid)
    console.log(`InstanceBootHelper: Waiting for instance ${instanceIds} to boot`)
    await spotInstances.waitForInstanceToBoot(instanceIds)
    return true
  }else{
    await databaseHelper.updateById(parameters.imageTableName, 'status = ?', ['simulation', image.rowid])
    return true
  }
 
}

const setScheduler = async (image, model, user, flag) => {

  let newImage = null
  if(flag){
    newImage = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, image.rowid)
    await databaseHelper.insertRow(parameters.migrationTableName, `(null, ?, ?, ?, ?, ?, ?,  ?)`, [newImage.zone, null, 1, newImage.spotInstanceId, newImage.rowid, Date.now(), Date.now()])
  }

  const time = Date.now()+ (parameters.migrationHour * 3600 * 1000) + parameters.migrationMinutes * 60 * 1000
  scheduler.setMigrationScheduler(new Date(time), model, newImage === null ? image : newImage, user)

}

const setSchedulerAgain = async (image, model, user, time) => {

  let hoursToMs = parameters.migrationHour * 3600 * 1000
  let minToMs = parameters.migrationMinutes * 60 * 1000
  if(Date.now() > (time+hoursToMs+minToMs)){
    console.log(`ChangeSchedulerHelper: Set new scheduler time for ${image.rowid}`)
    const newTime = Date.now() + (2 * 60 * 1000)
    scheduler.setMigrationScheduler(new Date(newTime), model, image, user)
  }else{
    console.log(`ChangeSchedulerHelper: Set old scheduler time for ${image.rowid}`)
    scheduler.setMigrationScheduler(new Date(time+hoursToMs+minToMs), model, image, user)
  }

}

const newInstance = async (model, image, user) => {
  const zone = await getPrediction(model, image, user)
  if(zone !== image.zone){
    const flag = await requestAndSetupInstance(model, image, zone)
    const newImage = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, image.rowid)
    if(flag && image.zone !== null){
      await databaseHelper.updateById(parameters.imageTableName, 'status = ?, updatedAt = ?', ['migrating', Date.now(), newImage.rowid])
      await copyKey(image)
      await migrateFiles(image, newImage)
      //if(image.simulation === 0) await terminateInstance(image)
      //await fileHelper.renameFile(image.key.replace('.pem', '_1.pem'), image.key)
      await sshConnection.installSoftware(newImage.ip, newImage.key)
      await startDocker(newImage.ip, newImage.key)
      await setScheduler(newImage, model, user, true)
      const migrationRows = await databaseHelper.selectByValue(parameters.migrationTableValues, parameters.migrationTableName, 'oldSpotInstanceId', newImage.spotInstanceId)
      await migrationRows.map(async row => {
        await databaseHelper.updateById(parameters.migrationTableName, 'newZone = ?, updatedAt = ?', [zone, Date.now(), row.rowid])
      })
    }else{
      await setupServer(newImage.ip, newImage)
      await startDocker(newImage.ip, newImage.key)
      await setScheduler(image, model, user, true)
      await databaseHelper.updateById(parameters.imageTableName, 'status = ?, updatedAt = ?', ['running', Date.now(), image.rowid])
    }
  }else{
    console.log(`MigrationHelper: No migration of ${image.rowid} needed`)
    const imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, image.rowid)
    const migrationRows = await databaseHelper.selectByValue(parameters.migrationTableValues, parameters.migrationTableName, 'oldSpotInstanceId', imageRow.spotInstanceId)
    await migrationRows.map(async row => {
      const modelRow = await databaseHelper.selectById(parameters.modelTableValues, parameters.modelTableName, imageRow.modelId)
      await databaseHelper.updateById(parameters.migrationTableName, 'count = ?, updatedAt = ?', [row.count+1, Date.now(), row.rowid])
      const billingRows = await databaseHelper.selectIsNull(parameters.billingTableValues, parameters.billingTableName, 'actualCost')
      const billingRow = billingRows.filter(b => b.imageId === imageRow.rowid)[0]
      console.log(billingRow.rowid)
      await billingHelper.getCosts(modelRow.type, modelRow.product, imageRow.zone, row.createdAt, billingRow.rowid)
    })
    await setScheduler(image, model, user, false)
  }

}

const setupServer = async (ip, image) => {
  await sshConnection.setUpServer(ip, image.key, image.path)
  await sshConnection.installSoftware(ip, image.key)
}

const startDocker = async (ip, key) => {
  await sshConnection.startDocker(ip, key)
}

const copyKey = async (image) => {

  const key1 = image.key
  const key2 = image.key.replace('.pem', '_1.pem')
  await sshConnection.copyKey(image.ip, key1, key2)
}

const migrateFiles = async (oldImage, newImage) => {

  await new Promise(async (resolve) => {
    const strings = oldImage.key.split('/')
    const key = strings[strings.length-1]
    await sshConnection.executeMigration(oldImage.ip, newImage.ip, oldImage.key, key)
    resolve()
  })
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