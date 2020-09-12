const parameters = require('../parameters');

  const imageModel= `
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
<<<<<<< HEAD
    provider TEXT,
=======
>>>>>>> 6b6d807dccd47a389cab6440846be89cb295d742
    manually INTEGER,
    schedulerName TEXT,
    bidprice FLOAT,
    simulation INTEGER,
    port INTEGER,
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