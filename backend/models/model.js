const modelModel = `
  rowid INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, 
  product TEXT NOT NULL, 
  bidprice FLOAT NOT NULL, 
  region TEXT, 
  simulation INT NOT NULL, 
  status TEXT, 
  createdAt TEXT, 
  updatedAt Text`


  module.exports = { modelModel }