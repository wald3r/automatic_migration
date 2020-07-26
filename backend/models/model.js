const modelModel = `
  rowid INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, 
  product TEXT NOT NULL, 
  region TEXT, 
  status TEXT, 
  createdAt INTEGER, 
  updatedAt INTEGER`


  module.exports = { modelModel }