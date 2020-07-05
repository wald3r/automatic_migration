import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Table, Button, Badge } from 'react-bootstrap'
import { deleteInstance, newInstance } from '../reducers/instancesReducer'
import ConfirmationModal from './modals/ConfirmationModal'
import CreateInstanceModal from './modals/CreateInstanceModal'
import RunImageModal from './modals/RunImageModal'
import instancesService from '../services/instancesService'
import imagesService from '../services/imagesService'
import { useToasts } from 'react-toast-notifications'

const ShowInstances = ( props ) => {

  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false)
  const [showCreateInstanceModal, setShowCreateInstanceModal] = useState(false)
  const [showRunImageModal, setShowRunImageModal] = useState(false)
  const [instanceToRunWithImage, setInstanceToRunWithimage] = useState(null)
  const { addToast } = useToasts()

  const [instanceToDelete, setInstanceToDelete] = useState(null)

  const deleteInstance = async () => {
    await props.deleteInstance(instanceToDelete)
    addToast(`${instanceToDelete.type} was deleted.`, {
      appearance: 'success',
      autoDismiss: true,
    })
  }

  const createInstance = async (obj, event) => {
    event.preventDefault()
    const response = await instancesService.newInstance(obj)
    if(response.status === 200){
      await props.newInstance(response.data)
      addToast('test', {
        appearance: 'success',
        autoDismiss: true,
      })
    }
    window.location.reload()
  }

  const handleDeletion = (instance) => {
    setInstanceToDelete(instance)
    setShowDeleteConfirmationModal(true)
  }

  const handleCreation = () => {
    setShowCreateInstanceModal(true)
  }

  const runImage = async (obj, event) => {
    event.preventDefault()
    console.log('test')
    const finalObj = { instanceId: instanceToRunWithImage.id, docker: obj.docker, key: obj.key }
    const response = await imagesService.newImage(finalObj)
    if(response.status === 200){
      addToast(`New Image added to ${instanceToRunWithImage.type}`, {
        appearance: 'success',
        autoDismiss: true,
      })
    }
  }

  const handleRunImage = (instance) => {
    setShowRunImageModal(true)
    setInstanceToRunWithimage(instance)
  }

  const simulationConverter = (simulation) => simulation === 0 ? 'false' : 'true'

  const badgeStatus = (status) => {
    if(status === 'training'){
      return   <Badge variant="warning">Training</Badge>
    }
    if(status === 'trained'){
      return   <Badge variant="info">Trained</Badge>
    }

  }

  return (
    <div>
      <RunImageModal
        showRunImageModal={showRunImageModal}
        setShowRunImageModal={setShowRunImageModal}
        handleRun={runImage}
      />
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
            <th>Status</th>
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
              <td id='idInstanceStatus'>{badgeStatus(instance.status)}</td>
              <td id='idInstanceSimulation'>{simulationConverter(instance.simulation)}</td>
              <td>
                <Button style={{ display: instance.status === 'trained' ? '' : 'none' }} id='idInstancesDelete'  data-toggle='tooltip' data-placement='top' title='Run Image' onClick={() => handleRunImage(instance)}><i className="fa fa-plus" /></Button>
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