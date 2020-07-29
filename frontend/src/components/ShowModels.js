import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Table, Button, Badge } from 'react-bootstrap'
import { deleteModel, newModel } from '../reducers/modelsReducer'
import { newImage } from '../reducers/imagesReducer'
import ConfirmationModal from './modals/ConfirmationModal'
import CreateModelModal from './modals/CreateModelModal'
import RunImageModal from './modals/RunImageModal'
import modelsService from '../services/modelsService'
import imagesService from '../services/imagesService'
import { useToasts } from 'react-toast-notifications'
import '../stylesheets/general.css'
import {  convertTime } from '../utils/helperClass'

const ShowModels = ( props ) => {

  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false)
  const [showCreateModelModal, setShowCreateModelModal] = useState(false)
  const [showRunImageModal, setShowRunImageModal] = useState(false)
  const [modelToRunWithImage, setModelToRunWithimage] = useState(null)
  const [modelToDelete, setModelToDelete] = useState(null)

  const { addToast } = useToasts()


  const deleteModel = async () => {

    await props.deleteModel(modelToDelete)
    addToast(`${modelToDelete.type} was deleted.`, {
      appearance: 'success',
      autoDismiss: true,
    })
    setModelToDelete(null)
  }

  const createModel = async (obj, event) => {
    event.preventDefault()
    const response = await modelsService.newModel(obj)
    if(response.status === 200){
      await props.newModel(response.data)
      addToast('test', {
        appearance: 'success',
        autoDismiss: true,
      })
    }
    window.location.reload()
  }


  const handleModelDeletion = (model) => {
    setModelToDelete(model)
    setShowDeleteConfirmationModal(true)
  }

  const handleCreation = () => {
    setShowCreateModelModal(true)
  }

  const createPathName = (path) => path.replaceAll('/', '__')


  const checkFiles = (files) => {

    let docker = false
    for(var x = 0; x<files.length; x++) {
      let parts = files[x].name.split('.')
      if(parts.length > 1){
        if('yml' === parts[1]){
          docker = true
        }
      }
    }

    if(docker) return true
    else return false
  }

  const runImage = async (obj, event) => {
    event.preventDefault()
    let data = new FormData()
    if(checkFiles(obj.files)){
      for(let x = 0; x<obj.files.length; x++) {
        data.append('file', obj.files[x], `${modelToRunWithImage.rowid}___${createPathName(obj.files[x].webkitRelativePath)}___${obj.files[x].name}`)
      }
      let response = await imagesService.newImage(data)
      response = await imagesService.newImageInformation({ simulation: obj.simulation, port: obj.port, bidprice: obj.bidprice, imageId: response.data.rowid })

      if(response.status === 200){
        addToast(`New Image added to ${modelToRunWithImage.type}`, {
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

  const handleRunImage = (model) => {
    setShowRunImageModal(true)
    setModelToRunWithimage(model)
  }

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
      <CreateModelModal
        showCreateModelModal={showCreateModelModal}
        setCreateModelModal={setShowCreateModelModal}
        handleCreation={createModel}
      />
      <ConfirmationModal
        showConfirmationModal={showDeleteConfirmationModal}
        setConfirmation={setShowDeleteConfirmationModal}
        handleConfirmation={deleteModel}
      />
      <div className='tableContainer'>
        <Table responsive className='table table-hover'>
          <thead className='thead-dark'>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Product</th>
              <th>Region</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
              <th id='idAdd'><Button onClick={handleCreation} className="fa fa-plus"></Button></th>

              <th></th>
            </tr>
          </thead>
          {props.models.map(model => (
            <tbody key={model.rowid}>
              <tr id='idModelRow'>
                <td id='idModelId'>{model.rowid}</td>
                <td id='idModelType'>{model.type}</td>
                <td id='idModelProduct'>{model.product}</td>
                <td id='idModelRegion'>{model.region}</td>
                <td id='idModelStatus'>{badgeStatus(model.status)}</td>
                <td id='idModelCreatedAt'>{convertTime(model.createdAt)}</td>
                <td id='idModelUpdatedAt'>{convertTime(model.updatedAt)}</td>
                <td>
                  <Button variant='primary' style={{ display: model.status === 'trained' ? '' : 'none' }} id='idModelsDelete'  data-toggle='tooltip' data-placement='top' title='Run Image' onClick={() => handleRunImage(model)}><i className="fa fa-plus" /></Button>
                  <Button variant='primary' id='idModelsDelete'  data-toggle='tooltip' data-placement='top' title='Remove Model' onClick={() => handleModelDeletion(model)}><i className="fa fa-trash" /></Button>
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
    models: state.models,
    images: state.images,
  }
}

const mapDispatchToProps = {
  deleteModel,
  newModel,
  newImage,
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowModels)