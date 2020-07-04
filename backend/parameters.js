
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
const vmTableName = 'vm'
const instanceTableValues = 'rowid, type, product, bidprice, region, simulation, status, createdAt, updatedAt'
const vmTableValues = 'rowid, instance, zone, path, ip, createdAt, updatedAt'


module.exports = { dbFileName, instanceTableName, instanceTableValues, vmTableName, vmTableValues }