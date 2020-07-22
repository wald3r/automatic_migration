const modelModel = `
  rowid INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, 
  product TEXT NOT NULL, 
  bidprice FLOAT NOT NULL, 
  region TEXT, 
  simulation INT NOT NULL, 
  status TEXT, 
  createdAt INTEGER, 
  updatedAt INTEGER`


  module.exports = { modelModel }