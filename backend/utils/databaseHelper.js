const sqlite3 = require('sqlite3').verbose();
const parameters = require('../parameters');


const checkDatabase = async () => {
  db = await openDatabase()
  const valuesInstances = 'rowid INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, product TEXT NOT NULL, bidprice FLOAT NOT NULL, region TEXT, simulation INT NOT NULL, status TEXT, createdAt TEXT, updatedAt Text'
  const valuesImages= `rowid INTEGER PRIMARY KEY AUTOINCREMENT, predictionFile TEXT, userId INTEGER NOT NULL, status TEXT, instanceId INTEGER NOT NULL, spotInstanceId TEXT, requestId TEXT, zone TEXT, path TEXT, ip TEXT, key TEXT, createdAt TEXT, updatedAt TEXT, FOREIGN KEY (instanceId) REFERENCES ${parameters.instanceTableName} (rowid) ON DELETE CASCADE, FOREIGN KEY (userid) REFERENCES ${parameters.userTableName} (rowid) ON DELETE CASCADE`
  const valuesUsers= `rowid INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, createdAt TEXT, updatedAt TEXT`
  db.run('PRAGMA foreign_keys = ON')
  createTable(db, parameters.userTableName, valuesUsers)
  createTable(db, parameters.instanceTableName, valuesInstances)
  createTable(db, parameters.imageTableName, valuesImages)
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

const selectAllRows = async(db, tableValues, tableName) => {
  let responseArray = []

  return await new Promise((resolve) => {
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

}

const insertRow = async(db, tableName, tableValues, params) => {

  return await new Promise((resolve) => {
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

const selectByUserId = async(db, tableValues, tableName, id) => {
  let responseArray = []

  return await new Promise((resolve) => {
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

}


const selectByUsername = async(db, tableValues, tableName, username) => {
  return new Promise((resolve) => {
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
}

const deleteRowById = async (db, tableName, id) => {
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

const deleteRowsByValue = async (db, tableName, param, value) => {
  return new Promise((resolve) => {
    db.run(`DELETE FROM ${tableName} WHERE ${value}=?`, param, (err) => {
      if (err) {
        console.error(`${tableName}: ${err.message}`)
        resolve()
      }else{
        console.log(`${tableName}: Rows with ${value} ${param} deleted`)
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
      resolve()
    })
  })
}


module.exports = { selectByUserId, checkDatabase, selectByUsername, insertRow, updateById, selectAllRows, openDatabase, closeDatabase, createTable, deleteRowById, selectById, deleteRowsByValue }