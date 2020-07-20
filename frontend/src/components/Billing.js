import React from 'react'
import { Table } from 'react-bootstrap'
import { connect } from 'react-redux'

const Billing = (props) => {



  return(
    <div>
      <div className='tableContainer'>
        <Table responsive className='table table-hover'>
          <thead className='thead-dark'>
            <tr>
              <th>ID</th>
              <th>Predicted Costs</th>
              <th>Actual Costs</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th></th>
            </tr>
          </thead>
          {props.billing.map(billing => (
            <tbody key={billing.rowid}>
              <tr id='idBillingRow'>
                <td id='idBillingImageId'>{billing.imageId}</td>
                <td id='idBillingPredicted'>{billing.predictedCost}</td>
                <td id='idBillingActual'>{billing.actualCost}</td>
                <td id='idBillingCreatedAt'>{billing.createdAt}</td>
                <td id='idBillingUpdatedAt'>{billing.updatedAt}</td>
              </tr>
            </tbody>
          ))}
        </Table>
      </div>
    </div>
  )
}

const mapStateToProps = (state) => {
  return{
    billing: state.billing
  }
}


export default connect(mapStateToProps, null)(Billing)