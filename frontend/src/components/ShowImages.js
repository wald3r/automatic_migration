import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Table, Button, Badge } from 'react-bootstrap'
import { useToasts } from 'react-toast-notifications'
import ConfirmationModal from './modals/ConfirmationModal'
import { deleteImage, exchangeImage } from '../reducers/imagesReducer'
import '../stylesheets/general.css'
import imagesService from '../services/imagesService'

const ShowImages = (props) => {

  const [imageToDelete, setImageToDelete] = useState(null)
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false)
  const [imageToReboot, setImageToReboot] = useState(null)
  const [imageToStart, setImageToStart] = useState(null)
  const [imageToStop, setImageToStop] = useState(null)
  const [showStartConfirmationModal, setShowStartConfirmationModal] = useState(false)
  const [showStopConfirmationModal, setShowStopConfirmationModal] = useState(false)
  const [showRebootConfirmationModal, setShowRebootConfirmationModal] = useState(false)

  const { addToast } = useToasts()

  const handleImageDeletion = (image) => {
    setImageToDelete(image)
    setShowDeleteConfirmationModal(true)
  }

  const handleReboot = (image) => {
    setImageToReboot(image)
    setShowRebootConfirmationModal(true)
  }

  const handleStart = (image) => {
    setImageToStart(image)
    setShowStartConfirmationModal(true)
  }

  const handleStop = (image) => {
    setImageToStop(image)
    setShowStopConfirmationModal(true)
  }

  const startImage = async () => {
    try{
      const response = await imagesService.startImage(imageToStart)
      props.exchangeImage(response.data)
      addToast(`${imageToStart.ip} is starting`, {
        appearance: 'success',
        autoDismiss: true,
      })
      setImageToStart(null)
    }
    catch(exception){
      addToast(`${imageToStart.ip} is not starting`, {
        appearance: 'error',
        autoDismiss: true,
      })
      setImageToStart(null)
    }
  }

  const stopImage = async () => {
    try{
      const response = await imagesService.stopImage(imageToStop)
      props.exchangeImage(response.data)
      addToast(`${imageToStop.ip} is stopping`, {
        appearance: 'success',
        autoDismiss: true,
      })
      setImageToStart(null)
    }
    catch(exception){
      addToast(`${imageToStop.ip} is not stopping`, {
        appearance: 'error',
        autoDismiss: true,
      })
      setImageToStart(null)
    }
  }

  const deleteImage = async () => {
    await props.deleteImage(imageToDelete)
    addToast(`${imageToDelete.ip} was deleted`, {
      appearance: 'success',
      autoDismiss: true,
    })
    setImageToDelete(null)
  }

  const rebootImage = async () => {

    await imagesService.rebootImage(imageToReboot)
    addToast(`${imageToReboot.ip} is rebooting`, {
      appearance: 'success',
      autoDismiss: true,
    })
    setImageToReboot(null)
  }

  const badgeStatus = (status) => {
    if(status === 'pending'){
      return   <Badge variant="info">Pending</Badge>
    }
    else if(status === 'running'){
      return   <Badge variant="success">Running</Badge>
    }
    else if(status === 'stopping'){
      return   <Badge variant="warning">Stopping</Badge>
    }
    else if(status === 'installed'){
      return   <Badge variant="success">Software installed</Badge>
    }
    else if(status === 'booting'){
      return   <Badge variant="info">Software not installed</Badge>
    }
    else {
      return   <Badge variant="danger">Stopped</Badge>
    }

  }
  return(
    <div>
      <ConfirmationModal
        showConfirmationModal={showDeleteConfirmationModal}
        setConfirmation={setShowDeleteConfirmationModal}
        handleConfirmation={deleteImage}
      />
      <ConfirmationModal
        showConfirmationModal={showStopConfirmationModal}
        setConfirmation={setShowStopConfirmationModal}
        handleConfirmation={stopImage}
      />
      <ConfirmationModal
        showConfirmationModal={showStartConfirmationModal}
        setConfirmation={setShowStartConfirmationModal}
        handleConfirmation={startImage}
      />
      <ConfirmationModal
        showConfirmationModal={showRebootConfirmationModal}
        setConfirmation={setShowRebootConfirmationModal}
        handleConfirmation={rebootImage}
      />
      <div className='tableContainer'>
        <Table responsive className='table table-hover'>
          <thead className='thead-dark'>
            <tr>
              <th>ID</th>
              <th>Request ID</th>
              <th>Zone</th>
              <th>IP</th>
              <th>Status</th>
              <th>State</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th></th>
            </tr>
          </thead>
          {props.images.map(image => (
            <tbody key={image.rowid}>
              <tr id='idImageRow'>
                <td id='idImageInstanceId'>{image.instanceId}</td>
                <td id='idImageRequestId'>{image.requestId}</td>
                <td id='idImageZone'>{image.zone}</td>
                <td id='idImageIp'>{image.ip}</td>
                <td id='idImageStatus'>{badgeStatus(image.status)}</td>
                <td id='idImageStatus'>{badgeStatus(image.state)}</td>
                <td id='idImageCreatedAt'>{image.createdAt}</td>
                <td id='idImageUpdatedAt'>{image.updatedAt}</td>
                <td>
                  <Button variant='primary' id='idImagesDelete'  data-toggle='tooltip' data-placement='top' title='Remove Image' onClick={() => handleImageDeletion(image)}><i className="fa fa-trash" /></Button>
                  <Button variant='primary' id='idImagesReboot'  data-toggle='tooltip' data-placement='top' title='Reboot Image' onClick={() => handleReboot(image)}><i className="fa fa-sort" /></Button>
                  <Button style={{ display: (image.state === 'stopped' || image.state === 'stopping') ? '' : 'none' }} variant='primary' id='idImagesStart'  data-toggle='tooltip' data-placement='top' title='Start Image' onClick={() => handleStart(image)}><i className="fa fa-plus" /></Button>
                  <Button style={{ display: (image.state === 'stopped' || image.state === 'stopping') ? 'none' : '' }} variant='primary' id='idImagesStop'  data-toggle='tooltip' data-placement='top' title='Stop Image' onClick={() => handleStop(image)}><i className="fa fa-remove" /></Button>
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
    images: state.images,
  }
}

const mapDispatchToProps = {
  deleteImage,
  exchangeImage,
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowImages)