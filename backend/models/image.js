const parameters = require('../parameters');

  const imageModel= `
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    predictionFile TEXT, 
    userId INTEGER NOT NULL, 
    status TEXT, 
    modelId INTEGER NOT NULL, 
    spotInstanceId TEXT, 
    requestId TEXT, 
    zone TEXT, 
    path TEXT, 
    ip TEXT, 
    key TEXT, 
    createdAt INTEGER, 
    updatedAt INTEGER, 
    FOREIGN KEY (modelId) REFERENCES ${parameters.modelTableName} (rowid) ON DELETE CASCADE, 
    FOREIGN KEY (userid) REFERENCES ${parameters.userTableName} (rowid) ON DELETE CASCADE`


module.exports = { imageModel }