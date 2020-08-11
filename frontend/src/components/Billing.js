import React, { useState } from 'react'
import { connect } from 'react-redux'
import { XYPlot, VerticalGridLines, HorizontalGridLines, LineSeries, XAxis, YAxis } from 'react-vis'
import { Badge } from 'react-bootstrap'
import '../stylesheets/general.css'

const Billing = (props) => {

  const [image, setImage] = useState(null)

  const prepareData = (imageid) => {
    let data = []
    let data1 = []
    let data2 = []
    let day = 0
    let sumActualCost = 0
    let sumPredictedCost = 0
    props.billing.map(object => {
      if(object.imageId === Number(imageid)){
        data1.push({ y: object.actualCost, x: day })
        data2.push({ y: object.predictedCost, x: day })
        sumActualCost = sumActualCost + object.actualCost
        sumPredictedCost = sumPredictedCost + object.predictedCost
        day = day + 1
      }
    })

    data.push(data1)
    data.push(data2)
    data.push(Number((sumActualCost).toFixed(4)))
    data.push(Number((sumPredictedCost).toFixed(4)))
    console.log(imageid, data)
    return data
  }
  if(image === null){
    return(
      <div>
        <div className='tableContainer'>
          Choose an Image: {'  '}
          <select onChange={({ target }) => setImage(target.value)} name='images' id='images'>
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
            <select onChange={({ target }) => setImage(target.value)} name='images' id='images'>
              <option value={null} key='null'>----</option>
              {props.images.map(i =>
                <option value={i.rowid} key={i.rowid}>{i.rowid}</option>
              )}
            </select>
          </div>
          <br/>
          <h3>Image ID: {image}</h3>
          <div className='grid-general display-grid'>
            <div className='graph'>
              <div>
                <Badge variant='primary'>Predicted Costs</Badge>
                <Badge variant='danger'>Actual Costs</Badge>
              </div>
              <XYPlot
                margin={{ left: 70, right: 10 }}
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
                  data={prepareData(image)[0]}
                  color='red'
                />
                <LineSeries
                  data={prepareData(image)[1]}
                  color='blue'
                />
              </XYPlot>
            </div>
            <div style={{ textAlign: 'center' }} className='numbers-grid grid-general'>
              <div style={{ color: 'red' }}>
                <div >Total Actual Costs</div>
                <div style={{ fontSize: '40px' }}>{prepareData(image)[2]}</div>
              </div>
              <div style={{ color: 'blue' }}>
                <div>Total Predicted Costs</div>
                <div style={{ fontSize: '40px' }}>{prepareData(image)[3]}</div>
              </div>
              <div style={{ color: 'green' }}>
                <div>Total Costs without Migration</div>
                <div style={{ fontSize: '40px' }}>0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

}

const mapStateToProps = (state) => {
  return{
    billing: state.billing,
    images: state.images
  }
}


export default connect(mapStateToProps, null)(Billing)