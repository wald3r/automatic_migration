const spotInstances = require('./spotInstances')
const sshConnectionEC2 = require('./sshConnectionEC2')
const sshConnectionEngine = require('./sshConnectionEngine')
const databaseHelper = require('./databaseHelper')
const mlModel = require('../utils/mlModel')
const parameters = require('../parameters')
const scheduler = require('./scheduler')
const spotPrices = require('./spotPrices')
const billingHelper = require('./billingHelper')
const fileHelper = require('./fileHelper')
const computeEngine = require ('./computeEngine')

const getPrediction = async (model, image, user) => {
  
  return await new Promise (async (resolve) => {
    await spotPrices.collectSpecificSpotPrices(model.type)
    const zone = await mlModel.predictModel(model.type, model.product, image, user, model.region)
    resolve(zone)
  })
}

const deletePredictions = (image) => mlModel.deletePredictions(image)

const stopInstance = async (image) => image.simulation === 0 ? await spotInstances.stopInstance(image.spotInstanceId, image.zone) : null
const startInstance = async (image) => {
  if(image.simulation === 0){
   await spotInstances.startInstance(image.spotInstanceId, image.zone)  
  }
}

const rebootInstance = async (image) => image.simulation === 0 ? await spotInstances.rebootInstance(image.zone, image.spotInstanceId) : null

const terminateInstance = async (image) => {
  await new Promise(async (resolve) => {
    await spotInstances.deleteKeyPair(image.zone, image.key, image.rowid)
    await spotInstances.cancelSpotInstance(image)
    setTimeout(() => {
      spotInstances.deleteSecurityGroup(image.zone, image.rowid)
    }, 50000)
    resolve()
  })
  
}


const requestEC2Instance = async(model, image, zone) => {
  
  const requestId = await spotInstances.requestSpotInstance(model.type, zone, model.product, image.bidprice, image.simulation, image.rowid, image.key, image.port)
  await databaseHelper.updateById(parameters.imageTableName, 'provider = ?, zone = ?', ['AWS', zone, image.rowid])
  if(image.simulation === 0){
    const instanceIds = await spotInstances.getInstanceIds(requestId, image.rowid)
    if(instanceIds[0] === undefined){
      const newImage = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, image.rowid)
      await spotInstances.deleteKeyPair(newImage.zone, newImage.key, newImage.rowid)
      await spotInstances.deleteSecurityGroup(newImage.zone, newImage.rowid)
      await databaseHelper.deleteRowById(parameters.imageTableName, newImage.rowid)
      deletePredictions(newImage)
      await fileHelper.deleteFolderRecursively(newImage.path)
      return false
    }
    await spotInstances.getPublicIpFromRequest(instanceIds, image.rowid)
    console.log(`InstanceBootHelper: Waiting for instance ${instanceIds} to boot`)
    await spotInstances.waitForInstanceToBoot(instanceIds)
    return true
  }else{
    await databaseHelper.updateById(parameters.imageTableName, 'status = ?', ['simulation', image.rowid])
    return true
  }
 
}

const requestEngineInstance = async(image, zone) => {
  
  if(image.simulation !== 1){
    computeEngine.startVM(image.rowid, null, image.port)
    await databaseHelper.updateById(parameters.imageTableName, 'provider = ?, zone = ?', ['Google', zone, image.rowid])

    return true
  }else{
    await databaseHelper.updateById(parameters.imageTableName, 'status = ?, provider = ?, zone = ?', ['simulation', 'Google', zone, image.rowid])
    return true
  }
   
  
}

const setScheduler = async (image, model, user, flag, startZone) => {

  let newImage = null
  if(flag){
    newImage = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, image.rowid)
    await databaseHelper.insertRow(parameters.migrationTableName, `(null, ?, ?, ?, ?, ?, ?, ?,  ?)`, [startZone, newImage.zone, null, 1, newImage.spotInstanceId, newImage.rowid, Date.now(), Date.now()])
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
    const flag = await requestEC2Instance(model, image, zone)
    if(flag === false){
      return false
    }
    const newImage = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, image.rowid)
    if(image.zone !== null){
      await databaseHelper.updateById(parameters.imageTableName, 'status = ?, updatedAt = ?', ['migrating', Date.now(), newImage.rowid])
    
      if(image.simulation === 0){
        await terminateInstance(image)
        await copyKey(image)
        await migrateFiles(image, newImage)
        await fileHelper.renameFile(image.key.replace('.pem', '_1.pem'), image.key)
        await installSoftware(newImage)
        await deleteKey(newImage)
        await startDocker(newImage.ip, newImage.key)
      } 
   
      await databaseHelper.updateById(parameters.imageTableName, 'status = ?, updatedAt = ?', [newImage.simulation === 0 ? 'running' : 'simulation', Date.now(), newImage.rowid])

      const migrationRows = await databaseHelper.selectRowsByValues(parameters.migrationTableValues, parameters.migrationTableName, 'imageId = ?', [newImage.rowid])
      const billingRows = await databaseHelper.selectIsNull(parameters.billingTableValues, parameters.billingTableName, 'actualCost')
      const billingRow = billingRows.filter(b => b.imageId === newImage.rowid)[0]

      const filteredRows = migrationRows.filter(row => row.newZone === null)

   
      await filteredRows.map(async row => {
        await databaseHelper.updateById(parameters.migrationTableName, 'newZone = ?, updatedAt = ?', [zone, Date.now(), row.rowid])
        await billingHelper.getCosts(model.type, model.product, image.zone, row.updatedAt, billingRow.rowid, migrationRows[0].startZone)

      })
      await setScheduler(newImage, model, user, true, migrationRows[0].startZone)

      return true

    }else{
      if(image.zone === 0){
        await setupServer(newImage.ip, newImage)
        await startDocker(newImage.ip, newImage.key)
        await databaseHelper.updateById(parameters.imageTableName, 'status = ?, updatedAt = ?', ['running', Date.now(), image.rowid])
      }
      await setScheduler(image, model, user, true, zone)

      return true
    }
  }else{
    console.log(`MigrationHelper: No migration of ${image.rowid} needed`)
    const imageRow = await databaseHelper.selectById(parameters.imageTableValues, parameters.imageTableName, image.rowid)
    const migrationRows = await databaseHelper.selectRowsByValues(parameters.migrationTableValues, parameters.migrationTableName, 'imageId = ?', [imageRow.rowid])
    const filteredRows = migrationRows.filter(row => row.newZone === null)
    await filteredRows.map(async row => {
      await databaseHelper.updateById(parameters.migrationTableName, 'count = ?, updatedAt = ?', [row.count+1, Date.now(), row.rowid])
      const billingRows = await databaseHelper.selectIsNull(parameters.billingTableValues, parameters.billingTableName, 'actualCost')
      const billingRow = billingRows.filter(b => b.imageId === imageRow.rowid)[0]
      console.log(migrationRows[0].startZone, imageRow.zone)
      await billingHelper.getCosts(model.type, model.product, imageRow.zone, row.updatedAt, billingRow.rowid, migrationRows[0].startZone)
    })
    await setScheduler(image, model, user, false, migrationRows[0].startZone)
  }

}

const setupServer = async (ip, image) => {
  await sshConnectionEC2.setUpServer(ip, image.key, image.path)
  await sshConnectionEC2.installSoftware(ip, image.key)
}

const startDocker = async (ip, key) => {
  await sshConnectionEC2.startDocker(ip, key)
}

const installSoftware = async(image) => {
  await sshConnectionEC2.installSoftware(image.ip, image.key)
}

const deleteKey = async(image) => {
  await sshConnectionEC2.deleteKey(image.ip, image.key)
}

const copyKey = async (image) => {

  const key1 = image.key
  const key2 = image.key.replace('.pem', '_1.pem')
  await sshConnectionEC2.copyKey(image.ip, key1, key2)
}

const migrateFiles = async (oldImage, newImage) => {

  await new Promise(async (resolve) => {
    const strings = oldImage.key.split('/')
    const key = strings[strings.length-1]
    await sshConnectionEC2.executeMigration(oldImage.ip, newImage.ip, oldImage.key, key)
    resolve()
  })
}


module.exports = {
  startDocker, 
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