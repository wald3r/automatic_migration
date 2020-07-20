const parameters = require('../parameters')

  const billingModel = `
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    predictedCost FLOAT, 
    actualCost FLOAT , 
    imageId INTEGER NOT NULL,
    userid INTEGER NOT NULL,
    createdAt TEXT, 
    updatedAt TEXT,
    FOREIGN KEY (imageId) REFERENCES ${parameters.imageTableName} (rowid) ON DELETE CASCADE 
`

module.exports = { billingModel }