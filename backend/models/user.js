
  const userModel = `
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE, 
    password TEXT NOT NULL, 
    createdAt TEXT, 
    updatedAt TEXT
  `

module.exports = { userModel }