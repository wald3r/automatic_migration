const instancesRouter = require('express').Router()
const databaseHelper = require('../utils/databaseHelper')



instancesRouter.get('/', async(request, response, next) => {

  try{

    db = databaseHelper.openDatabase()
    db.serialize(function() {
    
      var stmt = db.prepare("INSERT INTO lorem VALUES (?)")
      for (var i = 0; i < 10; i++) {
          stmt.run("Ipsum " + i)
      }
      stmt.finalize()
    
      db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
          console.log(row.id + ": " + row.info)
      })
    })

    databaseHelper.closeDatabase(db)

  }catch(exception){
    next(exception)
  }

})




module.exports = instancesRouter
