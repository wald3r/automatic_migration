const sqlite3 = require('sqlite3').verbose();
const parameters = require('../parameters');

const createTable = (db, name, values) => {
  db.run(`CREATE TABLE if not exists ${name} (${values})`)
}

const openDatabase = async () => {
  let db = null

  await new Promise((resolve, reject) => {
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


module.exports = { openDatabase, closeDatabase, createTable }