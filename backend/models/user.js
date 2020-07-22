
  const userModel = `
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE, 
    password TEXT NOT NULL, 
    createdAt INTEGER, 
    updatedAt INTEGER
  `

module.exports = { userModel }