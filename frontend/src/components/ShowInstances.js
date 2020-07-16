import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Table, Button, Badge } from 'react-bootstrap'
import { deleteInstance, newInstance } from '../reducers/instancesReducer'
import { newImage } from '../reducers/imagesReducer'
import ConfirmationModal from './modals/ConfirmationModal'
import CreateInstanceModal from './modals/CreateInstanceModal'
import RunImageModal from './modals/RunImageModal'
import instancesService from '../services/instancesService'
import imagesService from '../services/imagesService'
import { useToasts } from 'react-toast-notifications'
import '../stylesheets/general.css'


const ShowInstances = ( props ) => {

  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false)
  const [showCreateInstanceModal, setShowCreateInstanceModal] = useState(false)
  const [showRunImageModal, setShowRunImageModal] = useState(false)
  const [instanceToRunWithImage, setInstanceToRunWithimage] = useState(null)
  const [instanceToDelete, setInstanceToDelete] = useState(null)

  const { addToast } = useToasts()


  const deleteInstance = async () => {

    await props.deleteInstance(instanceToDelete)
    addToast(`${instanceToDelete.type} was deleted.`, {
      appearance: 'success',
      autoDismiss: true,
    })
    setInstanceToDelete(null)
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


  const handleInstanceDeletion = (instance) => {
    setInstanceToDelete(instance)
    setShowDeleteConfirmationModal(true)
  }

  const handleCreation = () => {
    setShowCreateInstanceModal(true)
  }

  const createPathName = (path) => path.replaceAll('/', '__')


  const checkFiles = (files) => {

    let key = false
    let docker = false
    for(var x = 0; x<files.length; x++) {
      let parts = files[x].name.split('.')
      if(parts.length > 1){
        if('pem' === parts[1]){
          key = true
        }
        if('yml' === parts[1]){
          docker = true
        }
      }
    }

    if(key && docker) return true
    else return false
  }

  const runImage = async (files, event) => {
    event.preventDefault()
    let data = new FormData()
    if(checkFiles(files)){
      for(let x = 0; x<files.length; x++) {
        data.append('file', files[x], `${instanceToRunWithImage.rowid}___${createPathName(files[x].webkitRelativePath)}___${files[x].name}`)
      }
      const response = await imagesService.newImage(data)
      if(response.status === 200){
        addToast(`New Image added to ${instanceToRunWithImage.type}`, {
          appearance: 'success',
          autoDismiss: true,
        })
        props.newImage(response.data)
      }
    }else{
      addToast('An important file is missing', {
        appearance: 'error',
        autoDismiss: true,
      })
    }
  }

  const handleRunImage = (instance) => {
    setShowRunImageModal(true)
    setInstanceToRunWithimage(instance)
  }

  const simulationConverter = (simulation) => simulation === 0 ? 'No' : 'Yes'

  const badgeStatus = (status) => {
    if(status === 'training'){
      return   <Badge variant="warning">Training</Badge>
    }
    if(status === 'trained'){
      return   <Badge variant="success">Trained</Badge>
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
      <div className='tableContainer'>
        <Table responsive className='table table-hover'>
          <thead className='thead-dark'>
            <tr>
              <th>ID</th>
              <th>InstanceType</th>
              <th>Product</th>
              <th>BidPrice</th>
              <th>Region</th>
              <th>Status</th>
              <th>Simulation</th>
              <th>Created</th>
              <th>Updated</th>
              <th id='idAdd'><Button onClick={handleCreation} className="fa fa-plus"></Button></th>

              <th></th>
            </tr>
          </thead>
          {props.instances.map(instance => (
            <tbody key={instance.rowid}>
              <tr id='idInstanceRow'>
                <td id='idInstanceTyId'>{instance.rowid}</td>
                <td id='idInstanceType'>{instance.type}</td>
                <td id='idInstanceProduct'>{instance.product}</td>
                <td id='idInstanceBidPrice'>{instance.bidprice}</td>
                <td id='idInstanceRegion'>{instance.region}</td>
                <td id='idInstanceStatus'>{badgeStatus(instance.status)}</td>
                <td id='idInstanceSimulation'>{simulationConverter(instance.simulation)}</td>
                <td id='idInstanceCreatedAt'>{instance.createdAt}</td>
                <td id='idInstanceUpdatedAt'>{instance.updatedAt}</td>
                <td>
                  <Button variant='primary' style={{ display: instance.status === 'trained' ? '' : 'none' }} id='idInstancesDelete'  data-toggle='tooltip' data-placement='top' title='Run Image' onClick={() => handleRunImage(instance)}><i className="fa fa-plus" /></Button>
                  <Button variant='primary' id='idInstancesDelete'  data-toggle='tooltip' data-placement='top' title='Remove Instance' onClick={() => handleInstanceDeletion(instance)}><i className="fa fa-trash" /></Button>
                </td>
              </tr>
            </tbody>
          ))}
        </Table>
      </div>
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
  newImage,
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowInstances)