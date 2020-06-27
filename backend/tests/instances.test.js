const supertest = require('supertest')
const app = require('../app')
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')


const api = supertest(app)

beforeEach(async () => {

    db = await databaseHelper.openDatabase()
    db.serialize(() => {
      const values = 'type TEXT NOT NULL, product TEXT NOT NULL, bidprice FLOAT NOT NULL, region TEXT, simulation INT NOT NULL, createdAt TEXT, updatedAt Text'
      databaseHelper.createTable(db, parameters.instanceTableName, values)
      const stmt = db.prepare(`INSERT INTO ${parameters.instanceTableName} VALUES (?, ?, ?, ?, ?, ?, ?)`)
      stmt.run('t2.micro', 'Windows', 0.25, null, 0, timeHelper.utc_timestamp, timeHelper.utc_timestamp)    
      stmt.run('t3.micro', 'Windows', 0.35, null, 0, timeHelper.utc_timestamp, timeHelper.utc_timestamp)    
      stmt.run('t4.micro', 'Windows', 0.45, null, 0, timeHelper.utc_timestamp, timeHelper.utc_timestamp)    
      stmt.run('t5.micro', 'Windows', 0.55, null, 0, timeHelper.utc_timestamp, timeHelper.utc_timestamp)    
      stmt.run('t6.micro', 'Windows', 0.65, null, 0, timeHelper.utc_timestamp, timeHelper.utc_timestamp)    

      stmt.finalize()
    })
    await databaseHelper.closeDatabase(db)

})

test('Get all instances', async () => {
  const response = await api
    .get('/api/instances')
    .expect(200)
    .expect('Content-Type', /application\/json/)

    expect(response.body).toHaveLength(5)
})


test('Get one instance', async () => {
  const response = await api
    .get('/api/instances/1')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(response.body.id).toBe(1)
  expect(response.body.type).toBe('t2.micro')

})

test('Get one instance that does not exist', async () => {
  const id = 6
  const response = await api
    .get(`/api/instances/${id}`)
    .expect(500)
    .expect('Content-Type', 'text/html; charset=utf-8')

  expect(response.text).toBe(`No entry under rowid ${id}`)

})

test('Remove one instance', async () => {

  const id = 1
  let outcome = null

  const response = await api
    .delete(`/api/instances/${id}`)
    .expect(200)

  db = await databaseHelper.openDatabase()
  await new Promise ((resolve) => {
      db.get(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName} WHERE rowid=${id}`, (err, row) => {
      outcome = row
      resolve()
    })
  })
  expect(outcome).toBe(undefined)

})


afterEach(async () => {

  db = await databaseHelper.openDatabase()
  await new Promise ((resolve) => {
    db.run(`DROP TABLE ${parameters.instanceTableName}`, (err) => {
    if (err) 
      console.error(err.message)
    })
    resolve()
  })
  await databaseHelper.closeDatabase(db)

})
  