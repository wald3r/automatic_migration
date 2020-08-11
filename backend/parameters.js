
const dbFileName = () => {
    if(process.env.NODE_ENV === 'test')
        return './testsqlite.db'
    if (process.env.NODE_ENV === 'dev') {
        return './devsqlite.db'
    } else {
        return './sqlite.db'
    }
}

const modelTableName = 'model'
const imageTableName = 'image'
const userTableName = 'user'
const migrationTableName = 'migration'
const billingTableName = 'billing'

const modelTableValues = 'rowid, type, product, region, status, createdAt, updatedAt'
const imageTableValues = 'rowid, manually, schedulerName, bidprice, simulation, port, predictionFile, userId, status, modelId, spotInstanceId, requestId, zone, path, ip, key, createdAt, updatedAt'
const userTableValues = 'rowid, username, password, createdAt, updatedAt'
const billingTableValues = 'rowid, predictedCost, actualCost, imageId, userid, createdAt, updatedAt'
const migrationTableValues = 'rowid, oldZone, newZone, count, oldSpotInstanceId, imageId, createdAt, updatedAt'

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

const migrationFile = './migration.sh'
const imageFile = './images.csv'

const checkInstancesNumber = '*/10 * * * *'

const workDir = __dirname

const waitForInstanceId = 10

const migrationHour = 0
const migrationMinutes = 3

module.exports = { 
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