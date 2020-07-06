
const dbFileName = () => {
    if(process.env.NODE_ENV === 'test')
        return './testsqlite.db'
    if (process.env.NODE_ENV === 'dev') {
        return './devsqlite.db'
    } else {
        return './sqlite.db'
    }
}

const instanceTableName = 'instance'
const imageTableName = 'image'

const instanceTableValues = 'rowid, type, product, bidprice, region, simulation, status, createdAt, updatedAt'
const imageTableValues = 'rowid, instanceId, zone, path, ip, key, createdAt, updatedAt'

const mlTrainFile = '/home/walder/workspace/automatic_migration/backend/ml_model/train_ml_model.py'
const mlDeleteFile = '/home/walder/workspace/automatic_migration/backend/ml_model/delete_ml_model.py'
const mlPredictFile = '/home/walder/workspace/automatic_migration/backend/ml_model/predict_ml_model.py'
const mlPredictions = '/home/walder/workspace/automatic_migration/backend/predictions/'

module.exports = { mlPredictions, dbFileName, instanceTableName, instanceTableValues, imageTableName, imageTableValues, mlTrainFile, mlDeleteFile, mlPredictFile }