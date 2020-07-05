const sqlite3 = require('sqlite3').verbose();
const parameters = require('../parameters');

const createTable = (db, name, values) => {
  db.run(`CREATE TABLE if not exists ${name} (${values})`)
}

const openDatabase = async () => {
  let db = null

  await new Promise((resolve) => {
    db = new sqlite3.Database(parameters.dbFileName(), async(err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Connected to the SQlite database.')
      resolve()

    })
    
  })
  return db
}

const selectAllRows = async(db, tableValues, tableName) => {
  let responseArray = []

  return await new Promise((resolve) => {
    db.serialize(async () => {
      db.all(`SELECT ${tableValues} FROM ${tableName}`, (err, rows) => {
        rows.map(row =>{
          responseArray = responseArray.concat(row)
        })
        resolve(responseArray)
      })
    })
  })

}

const updateById = async(db, tableName, tableValues, params) => {
  return await new Promise((resolve) => {
    db.run(`UPDATE ${tableName} 
          SET ${tableValues}
          WHERE rowid=?`, params,(err) => {
      if (err) {
        console.error(`${tableName}: ${err.message}`)
        resolve(500)
      }else{
        console.log(`${tableName}: Row ${params[params.length-1]} updated with ${params}`)
        resolve(200)
      }
    })
  })
}

const selectById = async(db, tableValues, tableName, id) => {
  return new Promise((resolve) => {
    db.get(`SELECT ${tableValues} FROM ${tableName} WHERE rowid=${id}`, (err, row) => {
      if(err){
        console.error(`${tableName}: ${err.message}`)
        resolve(null)
      }else if (row === undefined) {
        console.log(`No entry under rowid ${id}`)
        resolve(null)
      }else{
        resolve(row)
      }
    })
  })
}

const deleteRow = async (db, tableName, id) => {
  return new Promise((resolve) => {
    db.run(`DELETE FROM ${tableName} WHERE rowid=?`, id, (err) => {
      if (err) {
        console.error(`${tableName}: ${err.message}`)
        resolve()
      }else{
        console.log(`${tableName}: Row deleted ${id}`)
        resolve()
      }
    })
  })
}

const closeDatabase = async (db) => {
  return await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        return console.error(err.message)
      }
      console.log('Close the database connection.')
      resolve()
    })
  })
}


module.exports = { updateById, selectAllRows, openDatabase, closeDatabase, createTable, deleteRow, selectById }