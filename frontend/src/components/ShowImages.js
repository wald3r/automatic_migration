import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Table, Button, Badge } from 'react-bootstrap'
import { useToasts } from 'react-toast-notifications'
import ConfirmationModal from './modals/ConfirmationModal'
import { deleteImage, exchangeImage } from '../reducers/imagesReducer'
import '../stylesheets/general.css'
import imagesService from '../services/imagesService'
import keyService from '../services/keyService'
import {  convertTime } from '../utils/helperClass'
import fileDownload from 'js-file-download'

const ShowImages = (props) => {

  const [imageToDelete, setImageToDelete] = useState(null)
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false)
  const [imageToReboot, setImageToReboot] = useState(null)
  const [imageToStart, setImageToStart] = useState(null)
  const [imageToStop, setImageToStop] = useState(null)
  const [imageToStartDocker, setImageToStartDocker] = useState(null)
  const [imageToStopDocker, setImageToStopDocker] = useState(null)
  const [keyToDownload, setKeyToDownload] =useState(null)
  const [showKeyToDownloadModal, setShowKeyToDownloadModal] =useState(false)
  const [showStartConfirmationModal, setShowStartConfirmationModal] = useState(false)
  const [showStopConfirmationModal, setShowStopConfirmationModal] = useState(false)
  const [showStartDockerConfirmationModal, setShowStartDockerConfirmationModal] = useState(false)
  const [showStopDockerConfirmationModal, setShowStopDockerConfirmationModal] = useState(false)
  const [showRebootConfirmationModal, setShowRebootConfirmationModal] = useState(false)

  const { addToast } = useToasts()

  const handleImageDeletion = (image) => {
    setImageToDelete(image)
    setShowDeleteConfirmationModal(true)
  }

  const handleKeyDownload = (image) => {
    setKeyToDownload(image)
    setShowKeyToDownloadModal(true)
  }

  const handleReboot = (image) => {
    setImageToReboot(image)
    setShowRebootConfirmationModal(true)
  }

  const handleStartDocker = (image) => {
    setImageToStartDocker(image)
    setShowStartDockerConfirmationModal(true)
  }

  const handleStopDocker = (image) => {
    setImageToStopDocker(image)
    setShowStopDockerConfirmationModal(true)
  }

  const handleStart = (image) => {
    setImageToStart(image)
    setShowStartConfirmationModal(true)
  }

  const handleStop = (image) => {
    setImageToStop(image)
    setShowStopConfirmationModal(true)
  }

  const downloadKey = async () => {
    try{
      const response = await keyService.downloadKey(keyToDownload)
      fileDownload(response.data, 'key.pem')
      addToast(`Downloaded key of image ${keyToDownload.rowid}`, {
        appearance: 'success',
        autoDismiss: true,
      })
      setKeyToDownload(null)

    }catch(exception){
      addToast('Downloading of key failed', {
        appearance: 'error',
        autoDismiss: true,
      })
      setKeyToDownload(null)
    }
  }

  const startImage = async () => {
    try{
      const response = await imagesService.startImage(imageToStart)
      props.exchangeImage(response.data)
      addToast(`Image ${imageToStart.rowid} is starting`, {
        appearance: 'success',
        autoDismiss: true,
      })
      setImageToStart(null)
    }
    catch(exception){
      addToast(`Image ${imageToStart.rowid} is not starting`, {
        appearance: 'error',
        autoDismiss: true,
      })
      setImageToStart(null)
    }
  }

  const startDocker = async () => {
    try{
      addToast(`Trying to start docker service of image id ${imageToStartDocker.rowid}`, {
        appearance: 'success',
        autoDismiss: true,
      })
      const response = await imagesService.startDocker(imageToStartDocker)
      props.exchangeImage(response.data)
      addToast(`Docker service of image id ${imageToStartDocker.rowid} is starting`, {
        appearance: 'success',
        autoDismiss: true,
      })
      setImageToStart(null)
    }
    catch(exception){
      addToast(`Docker service of image id ${imageToStartDocker.rowid} is not starting`, {
        appearance: 'error',
        autoDismiss: true,
      })
      setImageToStart(null)
    }
  }

  const stopDocker = async () => {
    try{
      addToast(`Trying to stop docker service of image id ${imageToStopDocker.rowid}`, {
        appearance: 'success',
        autoDismiss: true,
      })
      const response = await imagesService.stopDocker(imageToStopDocker)
      props.exchangeImage(response.data)
      addToast(`Docker service of image id ${imageToStopDocker.rowid} is stopping`, {
        appearance: 'success',
        autoDismiss: true,
      })
      setImageToStart(null)
    }
    catch(exception){
      addToast(`Docker service of image id ${imageToStopDocker.rowid} is not stopping`, {
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
      addToast(`Image ${imageToStop.rowid} is stopping`, {
        appearance: 'success',
        autoDismiss: true,
      })
      setImageToStart(null)
    }
    catch(exception){
      addToast(`Image ${imageToStop.rowid} is not stopping`, {
        appearance: 'error',
        autoDismiss: true,
      })
      setImageToStart(null)
    }
  }

  const deleteImage = async () => {
    await props.deleteImage(imageToDelete)
    addToast(`Image ${imageToDelete.rowid} was deleted`, {
      appearance: 'success',
      autoDismiss: true,
    })
    setImageToDelete(null)
  }

  const rebootImage = async () => {

    await imagesService.rebootImage(imageToReboot)
    addToast(`Image ${imageToReboot.rowid} is rebooting`, {
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
    else if(status === 'simulation'){
      return   <Badge variant="secondary">Simulation</Badge>
    }
    else if(status === 'stopping'){
      return   <Badge variant="warning">Stopping</Badge>
    }
    else if(status === 'migrating'){
      return   <Badge variant="warning">Migrating</Badge>
    }
    else if(status === 'booting'){
      return   <Badge variant="info">Instance is booting</Badge>
    }
    else {
      return   <Badge variant="danger">Stopped</Badge>
    }

  }

  return(
    <div>
      <ConfirmationModal
        showConfirmationModal={showStopDockerConfirmationModal}
        setConfirmation={setShowStopDockerConfirmationModal}
        handleConfirmation={stopDocker}
      />
      <ConfirmationModal
        showConfirmationModal={showKeyToDownloadModal}
        setConfirmation={setShowKeyToDownloadModal}
        handleConfirmation={downloadKey}
      />
      <ConfirmationModal
        showConfirmationModal={showStartDockerConfirmationModal}
        setConfirmation={setShowStartDockerConfirmationModal}
        handleConfirmation={startDocker}
      />
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
              <th>Model ID</th>
              <th>Provider</th>
              <th>Zone</th>
              <th>IP</th>
              <th>Status</th>
              <th>State</th>
              <th>Port</th>
              <th>Bidprice</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Key</th>

              <th id='idRefresh'><Button variant='primary' size="sm" id='idRefreshPage'  data-toggle='tooltip' data-placement='top' title='Refresh' onClick={() => window.location.reload()}><i className="fa fa-refresh" /></Button></th>
            </tr>
          </thead>
          {props.images.map(image => (
            <tbody key={image.rowid}>
              <tr id='idImageRow'>
                <td id='idImageId'>{image.rowid}</td>
                <td id='idImageModelId'>{image.modelId}</td>
                <td id='idImageModelID'>{image.provider}</td>
                <td id='idImageZone'>{image.zone}</td>
                <td id='idImageIp'>{image.ip}</td>
                <td id='idImageStatus'>{badgeStatus(image.status)}</td>
                <td id='idImageState'>{badgeStatus(image.state)}</td>
                <td id='idImagePort'>{image.port}</td>
                <td id='idImageBidprice'>{image.bidprice}</td>
                <td id='idImageCreatedAt'>{convertTime(image.createdAt)}</td>
                <td id='idImageUpdatedAt'>{convertTime(image.updatedAt)}</td>
                <td id='idImageKey'>
                  <Button style={{ display: (image.simulation === 1 || image.status === 'booting' ) ? 'none' : '' }} variant='primary' id='idImagesDownloadKey'  data-toggle='tooltip' data-placement='top' title='Download Key' onClick={() => handleKeyDownload(image)}><i className="fa fa-key" /></Button>
                </td>
                <td>
                  <Button variant='primary' id='idImagesDelete'  data-toggle='tooltip' data-placement='top' title='Remove Image' onClick={() => handleImageDeletion(image)}><i className="fa fa-trash" /></Button>
                  <Button style={{ display: (image.state === 'stopped' || image.state === 'stopping' || image.provider === 'Google' ) ? '' : 'none' }} variant='primary' id='idImagesStart'  data-toggle='tooltip' data-placement='top' title='Start State' onClick={() => handleStart(image)}><i className="fa fa-sort-up" /></Button>
                  <Button style={{ display: ((image.state === 'running' || image.state === 'pending') && image.provider === 'AWS' ) ? '' : 'none' }} variant='primary' id='idImagesStop'  data-toggle='tooltip' data-placement='top' title='Stop State' onClick={() => handleStop(image)}><i className="fa fa-sort-desc" /></Button>
                  <Button style={{ display: (image.status === 'stopped' && image.state === 'running') ? '' : 'none' }} variant='primary' id='idImagesStartDocker'  data-toggle='tooltip' data-placement='top' title='Start Docker' onClick={() => handleStartDocker(image)}><i className="fa fa-toggle-up" /></Button>
                  <Button style={{ display: (image.status === 'running') ? '' : 'none' }} variant='primary' id='idImagesStopDocker'  data-toggle='tooltip' data-placement='top' title='Stop Docker' onClick={() => handleStopDocker(image)}><i className="fa fa-toggle-down" /></Button>
                </td>
              </tr>
            </tbody>
          ))}
        </Table>
      </div>
    </div>
  )
}
//<Button style={{ display: (image.status === 'running') ? '' : 'none' }} variant='primary' id='idImagesReboot'  data-toggle='tooltip' data-placement='top' title='Reboot Image' onClick={() => handleReboot(image)}><i className="fa fa-sort" /></Button>

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