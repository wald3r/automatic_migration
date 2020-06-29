import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Table, Button } from 'react-bootstrap'
import { deleteInstance, newInstance } from '../reducers/instancesReducer'
import ConfirmationModal from './modals/ConfirmationModal'
import CreateInstanceModal from './modals/CreateInstanceModal'

const ShowInstances = ( props ) => {

  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false)
  const [showCreateInstanceModal, setShowCreateInstanceModal] = useState(false)

  const [instanceToDelete, setInstanceToDelete] = useState(null)

  const deleteInstance = async () => {
    await props.deleteInstance(instanceToDelete)
  }

  const createInstance = async (obj, event) => {
    event.preventDefault()
    await props.newInstance(obj)
    console.log(obj)
  }

  const handleDeletion = (instance) => {
    setInstanceToDelete(instance)
    setShowDeleteConfirmationModal(true)
  }

  const handleCreation = () => {
    setShowCreateInstanceModal(true)
  }

  return (
    <div>
      <CreateInstanceModal
        showCreateInstanceModal={showCreateInstanceModal}
        setCreateInstanceModal={setShowCreateInstanceModal}
        handleCreation={createInstance}
      />
      <ConfirmationModal
        showConfirmationModal={showDeleteConfirmationModal}
        setConfirmation={setShowDeleteConfirmationModal}
        handleConfirmation={deleteInstance}
      />
      <Button onClick={(handleCreation)}>New</Button>
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
                <Button id='idInstancesDelete'  data-toggle='tooltip' data-placement='top' title='Remove Instance' onClick={() => handleDeletion(instance)}><i className="fa fa-trash" /></Button>
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
  newInstance
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowInstances)