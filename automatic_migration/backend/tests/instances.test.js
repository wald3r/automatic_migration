const supertest = require('supertest')
const app = require('../app')
const databaseHelper = require('../utils/databaseHelper')
const parameters = require('../parameters')
const timeHelper = require('../utils/timeHelper')
const instancesTableHelper = require('../utils/instancesTableHelper')

const api = supertest(app)

beforeEach(async () => {

    db = await databaseHelper.openDatabase()
    db.serialize(() => {
      const values = 'type TEXT NOT NULL, product TEXT NOT NULL, bidprice FLOAT NOT NULL, region TEXT, simulation INT NOT NULL, status TEXT , createdAt TEXT, updatedAt Text'
      databaseHelper.createTable(db, parameters.instanceTableName, values)
      const stmt = db.prepare(`INSERT INTO ${parameters.instanceTableName} VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      stmt.run('t2.micro', 'Windows', 0.25, null, 0, 'training', timeHelper.utc_timestamp, timeHelper.utc_timestamp)    
      stmt.run('t3.micro', 'Windows', 0.35, null, 0, 'training', timeHelper.utc_timestamp, timeHelper.utc_timestamp)    
      stmt.run('t4.micro', 'Windows', 0.45, null, 0, 'training', timeHelper.utc_timestamp, timeHelper.utc_timestamp)    
      stmt.run('t5.micro', 'Windows', 0.55, null, 0, 'training', timeHelper.utc_timestamp, timeHelper.utc_timestamp)    
      stmt.run('t6.micro', 'Windows', 0.65, null, 0, 'training', timeHelper.utc_timestamp, timeHelper.utc_timestamp)    

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

test('update non existing instance', async () => {

  newObj = {
    type: 't44.micro',
    product: 'linux',
    bidprice: 0.99,
    region: null,
    simulation: 1
  }
  const id = 10

  await api
    .put(`/api/instances/${id}`)
    .send(newObj)
    .expect(200)


    let outcome = null
    db = await databaseHelper.openDatabase()
    await new Promise ((resolve) => {
      db.get(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName} WHERE rowid= ?`, id, (err, row) => {
          outcome = row
          resolve()
        })
    })
    db = await databaseHelper.closeDatabase(db)
    expect(outcome).toBe(undefined)
})


test('update one instance', async () => {

  newObj = {
    type: 't44.micro',
    product: 'linux',
    bidprice: 0.99,
    region: null,
    status: 'training',
    simulation: 1
  }
  const id = 1

  await api
    .put(`/api/instances/${id}`)
    .send(newObj)
    .expect(200)


  let outcome = null
  db = await databaseHelper.openDatabase()
  await new Promise ((resolve) => {
    db.get(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName} WHERE rowid= ?`, id, (err, row) => {
      outcome = row
      resolve()
    })
  })
  console.log(outcome)
  db = await databaseHelper.closeDatabase(db)
  expect(outcome.rowid).toBe(1)
  expect(outcome.type).toBe(newObj.type)
  expect(outcome.product).toBe(newObj.product)
  expect(outcome.bidprice).toBe(newObj.bidprice)
  expect(outcome.simulation).toBe(newObj.simulation)
  expect(outcome.status).toBe('training')
})

test('post one instance', async () => {

  newObj = {
    type: 't44.micro',
    product: 'windows',
    bidprice: 0.99,
    region: null,
    simulation: 0
  }

  await api
    .post('/api/instances/')
    .send(newObj)
    .expect(200)

    let outcome = null
    db = await databaseHelper.openDatabase()
    await new Promise ((resolve) => {
      db.all(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName} WHERE 
        type='t44.micro' AND
        product='windows' AND
        bidprice='0.99'` , 
        (err, rows) => {
          outcome = rows
          resolve()
        })
    })
    db = await databaseHelper.closeDatabase(db)

  expect(outcome[0].type).toBe('t44.micro')
  expect(outcome[0].bidprice).toBe(0.99)

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

  expect(response.text).toBe(`Could not retrieve rowid ${id}`)

})

test('Remove one instance', async () => {

  const id = 1
  let outcome = null

  await api
    .delete(`/api/instances/${id}`)
    .expect(200)

  db = await databaseHelper.openDatabase()
  await new Promise ((resolve) => {
      db.get(`SELECT ${parameters.instanceTableValues} FROM ${parameters.instanceTableName} WHERE rowid=${id}`, (err, row) => {
      outcome = row
      resolve()
    })
  })
  await databaseHelper.closeDatabase(db)
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
  