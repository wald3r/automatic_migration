
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

const modelTableValues = 'rowid, type, product, bidprice, region, simulation, status, createdAt, updatedAt'
const imageTableValues = 'rowid, predictionFile, userId, status, modelId, spotInstanceId, requestId, zone, path, ip, key, createdAt, updatedAt'
const userTableValues = 'rowid, username, password, createdAt, updatedAt'

const mlTrainFile = '/home/walder/workspace/automatic_migration/backend/ml_model/train_ml_model.py'
const mlDeleteFile = '/home/walder/workspace/automatic_migration/backend/ml_model/delete_ml_model.py'
const mlPredictFile = '/home/walder/workspace/automatic_migration/backend/ml_model/predict_ml_model.py'
const mlPredictions = '/home/walder/workspace/automatic_migration/backend/predictions/'

const collectSpotPricesFile = '/home/walder/workspace/automatic_migration/backend/spot_pricing/collect_spot_prices.py'

const keyFileName = 'elmit.pem'
const keyName = 'elmit'
const ec2Username = 'ec2-user'
const securityGroupName = 'elmit-group'
const securityGroupDescription = 'elmit'
const linuxInstallFile = './linux_install.sh'

const workDir = __dirname

const waitForInstanceId = 10

module.exports = { 
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