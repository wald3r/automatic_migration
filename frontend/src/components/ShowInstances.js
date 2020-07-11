import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Table, Button, Badge } from 'react-bootstrap'
import { deleteInstance, newInstance } from '../reducers/instancesReducer'
import { deleteImage, newImage } from '../reducers/imagesReducer'
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
  const [showImages, setShowImages] = useState(false)
  const [instanceToDelete, setInstanceToDelete] = useState(null)
  const [imageToDelete, setImageToDelete] = useState(null)

  const { addToast } = useToasts()


  const deleteObject = async () => {

    if(instanceToDelete !== null){
      await props.deleteInstance(instanceToDelete)
      addToast(`${instanceToDelete.type} was deleted.`, {
        appearance: 'success',
        autoDismiss: true,
      })
      setInstanceToDelete(null)
    }else{
      await props.deleteImage(imageToDelete)
      addToast(`${imageToDelete.path} was deleted.`, {
        appearance: 'success',
        autoDismiss: true,
      })
      setImageToDelete(null)
    }
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

  const handleImageDeletion = (image) => {
    setImageToDelete(image)
    setShowDeleteConfirmationModal(true)
  }

  const handleInstanceDeletion = (instance) => {
    setInstanceToDelete(instance)
    setShowDeleteConfirmationModal(true)
  }

  const handleCreation = () => {
    setShowCreateInstanceModal(true)
  }

  const runImage = async (obj, event) => {
    event.preventDefault()
    const finalObj = { instanceId: instanceToRunWithImage.rowid, path: obj.docker, key: obj.key }
    const response = await imagesService.newImage(finalObj)
    if(response.status === 200){
      addToast(`New Image added to ${instanceToRunWithImage.type}`, {
        appearance: 'success',
        autoDismiss: true,
      })
      props.newImage(response.data)
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
        handleConfirmation={deleteObject}
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
        {props.instances.map(instance => (
          <tbody key={instance.rowid}>
            <tr id='idInstanceRow' onClick={() => setShowImages(!showImages)}>
              <td id='idInstanceType'>{instance.type}</td>
              <td id='idInstanceProduct'>{instance.product}</td>
              <td id='idInstanceBidPrice'>{instance.bidprice}</td>
              <td id='idInstanceRegion'>{instance.region}</td>
              <td id='idInstanceStatus'>{badgeStatus(instance.status)}</td>
              <td id='idInstanceSimulation'>{simulationConverter(instance.simulation)}</td>
              <td>
                <Button style={{ display: instance.status === 'trained' ? '' : 'none' }} id='idInstancesDelete'  data-toggle='tooltip' data-placement='top' title='Run Image' onClick={() => handleRunImage(instance)}><i className="fa fa-plus" /></Button>
                <Button id='idInstancesDelete'  data-toggle='tooltip' data-placement='top' title='Remove Instance' onClick={() => handleInstanceDeletion(instance)}><i className="fa fa-trash" /></Button>
              </td>
            </tr>
            {props.images.filter(image => image.instanceId === instance.rowid).map(image => (
              <tr style={ { display: showImages === false ? 'None' : '' } } key={image.rowid}>
                <td>{image.path}</td>
                <td>{image.key}</td>
                <td>
                  <Button id='idImagesDelete'  data-toggle='tooltip' data-placement='top' title='Remove Images' onClick={() => handleImageDeletion(image)}><i className="fa fa-trash" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </Table>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    instances: state.instances,
    images: state.images,
  }
}

const mapDispatchToProps = {
  deleteInstance,
  newInstance,
  deleteImage,
  newImage,
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowInstances)