const parameters = require('../parameters')

const migrationModel = `
  rowid INTEGER PRIMARY KEY AUTOINCREMENT,
  startZone TEXT NOT NULL,
  oldZone TEXT NOT NULL, 
  newZone TEXT, 
  count INTEGER,
  oldSpotInstanceId TEXT,
  imageId INTEGER NOT NULL,
  createdAt INTEGER, 
  updatedAt INTEGER,
  FOREIGN KEY (imageId, oldSpotInstanceId) REFERENCES ${parameters.imageTableName} (rowid, spotInstanceId) ON DELETE CASCADE
`

module.exports = { migrationModel }