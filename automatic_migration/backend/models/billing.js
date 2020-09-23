const parameters = require('../parameters')

  const billingModel = `
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    costNoMigration INTEGER,
    predictedCost FLOAT, 
    actualCost FLOAT , 
    imageId INTEGER NOT NULL,
    userid INTEGER NOT NULL,
    createdAt INTEGER, 
    updatedAt INTEGER,
    FOREIGN KEY (imageId) REFERENCES ${parameters.imageTableName} (rowid) ON DELETE CASCADE 
`

module.exports = { billingModel }