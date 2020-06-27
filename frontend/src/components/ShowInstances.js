import React from 'react'
import { connect } from 'react-redux'
import { Table, Button } from 'react-bootstrap'
import { deleteInstance } from '../reducers/instancesReducer'


const ShowInstances = ( props ) => {

  const handleDeletionInstance = async (instance) => {
    props.deleteInstance(instance)
  }

  return (
    <div>
      <Table responsive className='table table-hover'>
        <thead className='thead-dark'>
          <tr>
            <th>InstanceType</th>
            <th>Product</th>
            <th>BidPrice</th>
            <th>Region</th>
            <th>Simulation</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {props.instances.map(instance =>
            <tr id='idInstanceRow' key={instance.id}>
              <td id='idInstanceType'>{instance.type}</td>
              <td id='idInstanceProduct'>{instance.product}</td>
              <td id='idInstanceBidPrice'>{instance.bidprice}</td>
              <td id='idInstanceRegion'>{instance.region}</td>
              <td id='idInstanceSimulation'>{instance.simulation}</td>
              <td>
                <Button id='idInstancesDelete'  data-toggle='tooltip' data-placement='top' title='Remove Instance' onClick={() => handleDeletionInstance(instance)}><i className="fa fa-trash" /></Button>
              </td>
            </tr>

          )}
        </tbody>
      </Table>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    instances: state.instances,
  }
}

const mapDispatchToProps = {
  deleteInstance,
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowInstances)