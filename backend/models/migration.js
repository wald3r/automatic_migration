const parameters = require('../parameters')

const migrationModel = `
  rowid INTEGER PRIMARY KEY AUTOINCREMENT,
  oldZone TEXT NOT NULL, 
  newZone TEXT NOT NULL, 
  imageId INTEGER NOT NULL,
  createdAt TEXT, 
  updatedAt TEXT,
  FOREIGN KEY (imageId) REFERENCES ${parameters.imageTableName} (rowid) ON DELETE CASCADE
`

module.exports = { migrationModel }