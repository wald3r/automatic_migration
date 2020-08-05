const sqlite3 = require('sqlite3').verbose();
const parameters = require('../parameters');
const user = require('../models/user')
const image = require('../models/image')
const model = require('../models/model')
const migration = require('../models/migration')
const billing = require('../models/billing')

const checkDatabase = async () => {
  db = await openDatabase()
  db.exec('PRAGMA foreign_keys = ON', (err)=> {
    if(err){
      console.log(`PragmaHelper: ${err}`)
    }else{
      console.log('PragmaHelper: Activated foreign keys')
    }
  })
  createTable(db, parameters.migrationTableName, migration.migrationModel)
  createTable(db, parameters.billingTableName, billing.billingModel)
  createTable(db, parameters.userTableName, user.userModel)
  createTable(db, parameters.modelTableName, model.modelModel)
  createTable(db, parameters.imageTableName, image.imageModel)

  await closeDatabase(db)
}

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
      resolve()

    })
    
  })
  return db
}

const selectAllRows = async(tableValues, tableName) => {

  let db = await openDatabase()
  let responseArray = []

  responseArray = await new Promise((resolve) => {
    db.serialize(async () => {
      db.all(`SELECT ${tableValues} FROM ${tableName}`, (err, rows) => {
        if(rows === undefined){
          resolve(responseArray)
        }else{
          rows.map(row =>{
            responseArray = responseArray.concat(row)
          })
          resolve(responseArray)
        }
      })
    })
  })
  await closeDatabase(db)
  return responseArray
}

const insertRow = async(tableName, tableValues, params) => {
  let db = await openDatabase()
  let id = await new Promise((resolve) => {
    db.serialize(() => {
      const stmt = db.prepare(`INSERT INTO ${tableName} VALUES ${tableValues}`)
      stmt.run(params, function(err){
        if(err){
          console.log(err)
          stmt.finalize()
          resolve(-1)
        }else{ 
          stmt.finalize()
          resolve(this.lastID)
        }
      })
    })
  })
  await closeDatabase(db)
  return id
}

const updateById = async(tableName, tableValues, params) => {
  let db = await openDatabase()
  let code = await new Promise((resolve) => {
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
  await closeDatabase(db)
  return code
}

const selectById = async(tableValues, tableName, id) => {
  let db = await openDatabase()
  let newRow = null
  await new Promise((resolve) => {
    db.get(`SELECT ${tableValues} FROM ${tableName} WHERE rowid=${id}`, (err, row) => {
      if(err){
        console.error(`${tableName}: ${err.message}`)
        resolve()
      }else if (row === undefined) {
        console.log(`No entry under rowid ${id}`)
        resolve()
      }else{
        newRow = row
        resolve()
      }
    })
  })
  await closeDatabase(db)
  return newRow
}

const selectByUserId = async(tableValues, tableName, id) => {

  let db = await openDatabase()
  let responseArray = []

  responseArray = await new Promise((resolve) => {
    db.serialize(async () => {
      db.all(`SELECT ${tableValues} FROM ${tableName} WHERE userid = ${id}`, (err, rows) => {
        if(rows === undefined){
          resolve(responseArray)
        }else{
          rows.map(row =>{
            responseArray = responseArray.concat(row)
          })
          resolve(responseArray)
        }
      })
    })
  })
  await closeDatabase(db)
  return responseArray

}

const selectIsNull = async(tableValues, tableName, value) => {
  let responseArray = []
  let db = await openDatabase()

  await new Promise((resolve) => {
    db.serialize(async () => {
      db.all(`SELECT ${tableValues} FROM ${tableName} WHERE ${value} IS NULL`, (err, rows) => {
        if(rows === undefined){
          resolve(responseArray)
        }else{
          rows.map(row =>{
            responseArray = responseArray.concat(row)
          })
          resolve(responseArray)
        }
      })
    })
  })
  await closeDatabase(db)
  return responseArray

}

const selectRowsByValues = async(tableValues, tableName, values, params) => {
  let db = await openDatabase()
  let responseArray = []

  await new Promise((resolve) => {
    db.serialize(async () => {
      db.all(`SELECT ${tableValues} FROM ${tableName} WHERE ${values}`, params, (err, rows) => {
        if(rows === undefined){
          resolve(responseArray)
        }else{
          rows.map(row =>{
            responseArray = responseArray.concat(row)
          })
          resolve(responseArray)
        }
      })
    })
  })

  await closeDatabase(db)
  return responseArray
}

const selectByValue = async(tableValues, tableName, value, param) => {
  let db = await openDatabase()
  let responseArray = []

  responseArray = await new Promise((resolve) => {
    db.serialize(async () => {
      db.all(`SELECT ${tableValues} FROM ${tableName} WHERE ${value} = '${param}'`, (err, rows) => {
        if(rows === undefined){
          resolve(responseArray)
        }else{
          rows.map(row =>{
            responseArray = responseArray.concat(row)
          })
          resolve(responseArray)
        }
      })
    })
  })

  await closeDatabase(db)
  return responseArray
}


const selectByUsername = async(tableValues, tableName, username) => {
  
  let db = await openDatabase()
  let row = await new Promise((resolve) => {
    db.get(`SELECT ${tableValues} FROM ${tableName} WHERE username = '${username}'`, (err, row) => {
      if(err){
        console.error(`${tableName}: ${err.message}`)
        resolve(null)
      }else if (row === undefined) {
        console.log(`No entry under username ${username}`)
        resolve(null)
      }else{
        resolve(row)
      }
    })
  })

  await closeDatabase(db)
  return row
}

const deleteRowById = async (tableName, id) => {

  let db = await openDatabase()

  let code = await new Promise((resolve) => {
    db.run(`DELETE FROM ${tableName} WHERE rowid=?`, id, (err) => {
      if (err) {
        console.error(`${tableName}: ${err.message}`)
        resolve(-1)
      }else{
        console.log(`${tableName}: Row deleted ${id}`)
        resolve(1)
      }
    })
  })
  await closeDatabase(db)
  return code
}

const deleteRowsByValue = async (tableName, param, value) => {

  let db = await openDatabase()
  let code = await new Promise((resolve) => {
    db.run(`DELETE FROM ${tableName} WHERE ${value}=?`, param, (err) => {
      if (err) {
        console.error(`${tableName}: ${err.message}`)
        resolve(-1)
      }else{
        console.log(`${tableName}: Rows with ${value} ${param} deleted`)
        resolve(1)
      }
    })
  })
  await closeDatabase(db)
  return code
}

const closeDatabase = async (db) => {
  return await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        return console.error(err.message)
      }
      resolve()
    })
  })
}


module.exports = { 
  selectByValue, 
  selectByUserId, 
  checkDatabase, 
  selectByUsername, 
  insertRow, 
  updateById, 
  selectAllRows, 
  openDatabase, 
  closeDatabase, 
  createTable, 
  deleteRowById, 
  selectById, 
  deleteRowsByValue,
  selectIsNull,
  selectRowsByValues 
}