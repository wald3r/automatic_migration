
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
const instanceTableValues = 'rowid, type, product, bidprice, region, simulation, createdAt, updatedAt'


module.exports = { dbFileName, instanceTableName, instanceTableValues }