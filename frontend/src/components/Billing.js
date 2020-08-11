import React, { useState } from 'react'
import { connect } from 'react-redux'
import { XYPlot, VerticalGridLines, HorizontalGridLines, LineSeries, XAxis, YAxis } from 'react-vis'
import { Badge } from 'react-bootstrap'
import '../stylesheets/general.css'
import billingService from '../services/billingService'
import migrationService from '../services/migrationService'
import { Spinner } from 'react-bootstrap'
const Billing = (props) => {

  const [billing, setBilling] = useState(null)
  const [image, setImage] = useState(null)
  const [migrations, setMigrations] = useState(null)
  const [spinner, setSpinner] = useState(false)

  const prepareData = () => {
    let data = []
    let data1 = []
    let data2 = []
    let data3 = []
    let day = 0
    let sumActualCost = 0
    let sumPredictedCost = 0
    let sumCostNoMigration = 0
    billing.map(object => {
      if(object.actualCost !== null) data1.push({ y: object.actualCost, x: day })
      data2.push({ y: object.predictedCost, x: day })
      if(object.costNoMigration !== null) data3.push({ y: object.costNoMigration, x: day })
      sumActualCost = sumActualCost + object.actualCost
      sumPredictedCost = sumPredictedCost + object.predictedCost
      sumCostNoMigration = sumCostNoMigration + object.costNoMigration
      day = day + 1
    })

    let sum = migrations.length === 0 ? 0 : migrations.length -1
    data.push(data1)
    data.push(data2)
    data.push(data3)
    data.push(Number((sumActualCost).toFixed(4)))
    data.push(Number((sumPredictedCost).toFixed(4)))
    data.push(Number((sumCostNoMigration).toFixed(4)))
    data.push(sum)
    return data
  }


  const handleImage = async (imageid) => {
    if(imageid === null){
      setBilling(null)
      setImage(null)
      setMigrations(null)
      setSpinner(false)
    }else{
      setSpinner(true)
      let response = await billingService.getBilling(Number(imageid))
      setBilling(response.data)
      setImage(Number(imageid))
      response = await migrationService.getMigrations(Number(imageid))
      setMigrations(response.data)
      setSpinner(false)
    }
  }

  if(billing === null || migrations === null){
    return(
      <div>
        <div className='tableContainer'>
          Choose an Image: {'  '}
          <select onChange={({ target }) => handleImage(target.value)} name='images' id='images'>
            <option value={null} key='null'>----</option>
            {props.images.map(i =>
              <option value={i.rowid} key={i.rowid}>{i.rowid}</option>
            )}
          </select>
        </div>
      </div>
    )
  }
  else{
    return(
      <div>
        <div className='tableContainer'>
          <div className='tableContainer'>
            Choose an Image: {'  '}
            <select onChange={({ target }) => handleImage(target.value)} name='images' id='images'>
              <option value={null} key='null'>----</option>
              {props.images.map(i =>
                <option value={i.rowid} key={i.rowid}>{i.rowid}</option>
              )}
            </select>
          </div>
          <br/>
          {spinner === true ?
            <Spinner animation="border" size='lg' role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
            :
            <div>
              <h3>Image ID: {image}</h3>
              <div className='grid-general display-grid'>
                <div className='graph'>
                  <div>
                    <Badge variant='primary'>Predicted Costs</Badge>{' '}
                    <Badge variant='danger'>Actual Costs</Badge>{' '}
                    <Badge variant='success'>Costs withouth Migrations</Badge>
                  </div>
                  <XYPlot
                    margin={{ left: 70 }}
                    color='red'
                    height={500}
                    width= {800}
                    xType='ordinal'
                  >
                    <VerticalGridLines />
                    <HorizontalGridLines />
                    <XAxis />
                    <YAxis />
                    <LineSeries
                      data={prepareData()[0]}
                      color='red'
                    />
                    <LineSeries
                      data={prepareData()[1]}
                      color='blue'
                    />
                    <LineSeries
                      data={prepareData()[2]}
                      color='green'
                    />
                  </XYPlot>
                </div>
                <div style={{ textAlign: 'center' }} className='numbers-grid grid-general'>
                  <div style={{ color: 'red' }}>
                    <div >Total Actual Costs</div>
                    <div style={{ fontSize: '40px' }}>{prepareData()[3]}</div>
                  </div>
                  <div style={{ color: 'blue' }}>
                    <div>Total Predicted Costs</div>
                    <div style={{ fontSize: '40px' }}>{prepareData()[4]}</div>
                  </div>
                  <div style={{ color: 'green' }}>
                    <div>Total Costs without Migration</div>
                    <div style={{ fontSize: '40px' }}>{prepareData()[5]}</div>
                  </div>
                  <div style={{ color: 'black' }}>
                    <div>Migrations</div>
                    <div style={{ fontSize: '40px' }}>{prepareData()[6]}</div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    )
  }

}

const mapStateToProps = (state) => {
  return{
    images: state.images,
  }
}


export default connect(mapStateToProps, null)(Billing)