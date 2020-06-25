const sqlite3 = require('sqlite3').verbose();


const createTable = (db, name, values) => {
  db.run(`CREATE TABLE if not exists ${name} (${values})`)
}

const openDatabase = () => {
  const db = new sqlite3.Database('./sqlite.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
      console.log('Connected to the in-memory SQlite database.');
  })

  return db
}

const closeDatabase = (db) => {

  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });
}


module.exports = { openDatabase, closeDatabase, createTable }