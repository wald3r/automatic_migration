
const dbFileName = () => {
    if(process.env.NODE_ENV === 'test')
        return './testsqlite.db'
    if (process.env.NODE_ENV === 'dev') {
        return './devsqlite.db'
    } else {
        return './sqlite.db'
    }
}


const engineMachineTypes = ['E2', 'N2D', 'N1', 'C2', 'M2', 'M1', 'N2']
const engine_regions = './engine_regions.csv'

const modelTableName = 'model'
const imageTableName = 'image'
const userTableName = 'user'
const migrationTableName = 'migration'
const billingTableName = 'billing'

const modelTableValues = 'rowid, type, product, region, status, createdAt, updatedAt'

const imageTableValues = 'rowid, provider, manually, schedulerName, bidprice, simulation, port, predictionFile, userId, status, modelId, spotInstanceId, requestId, zone, path, ip, key, createdAt, updatedAt'
const userTableValues = 'rowid, username, password, createdAt, updatedAt'
const billingTableValues = 'rowid, costNoMigration, predictedCost, actualCost, imageId, userid, createdAt, updatedAt'
const migrationTableValues = 'rowid, startZone, oldZone, newZone, count, oldSpotInstanceId, imageId, createdAt, updatedAt'

const mlTrainFile = __dirname+'/ml_model/train_ml_model.py'
const mlDeleteFile = __dirname+'/ml_model/delete_ml_model.py'
const mlPredictFile = __dirname+'/ml_model/predict_ml_model.py'
const mlPredictions = __dirname+'/predictions/'


const collectSpotPricesFile = __dirname+'/spot_pricing/collect_spot_prices.py'
const billingFile = __dirname+'/spot_pricing/calculate_billing.py'


const keyFileName = 'elmit.pem'
const keyName = 'elmit'
const ec2Username = 'ec2-user'
const securityGroupName = 'elmit-group'
const securityGroupDescription = 'elmit'
const linuxInstallFile = './linux_install.sh'
const suseInstallFile = './suse_install.sh'
const redInstallFile = './red_install.sh'

const engineInstallFile = './install_google.sh'
const engineUsername = 'walder'
const sshEnginePassphrase = 'elmit'
//const sshEngineSSHFile = '/home/walder/workspaces/automatic_migration/backend/google_compute_engine'
const sshEngineSSHFile = '/home/walder/.ssh/google'
const googleCloudKeyFile = 'home/walder/workspace/automatic_migration/google.json'
const googleProjecId = 'automaticmigration'

const knownHosts = '/home/walder/.ssh/known_hosts'
const workaroundFile = '/home/walder/workspace/automatic_migration/backend/workaround.sh'

const migrationFile = './migration.sh'
const imageFile = './images.csv'

const checkInstancesNumber = '*/10 * * * *'

const workDir = __dirname

const waitForInstanceId = 10

const migrationHour = 0
const migrationMinutes = 2

module.exports = { 
    googleCloudKeyFile,
    googleProjecId,
    workaroundFile,
    knownHosts,
    sshEnginePassphrase,
    sshEngineSSHFile,
    engine_regions,
    engineMachineTypes,
    engineInstallFile,
    engineUsername,
    checkInstancesNumber,
    billingFile,
    redInstallFile,
    imageFile,
    migrationFile,
    suseInstallFile,
    migrationMinutes,
    migrationHour,
    migrationTableValues,
    billingTableValues,
    keyName,
    waitForInstanceId,
    securityGroupDescription,
    securityGroupName,
    linuxInstallFile,
    workDir,
    userTableName,
    userTableValues,
    keyFileName,
    ec2Username,
    mlPredictions, 
    dbFileName, 
    modelTableName, 
    modelTableValues, 
    imageTableName, 
    imageTableValues, 
    mlTrainFile, 
    mlDeleteFile, 
    mlPredictFile, 
    collectSpotPricesFile,
    migrationTableName,
    billingTableName
}