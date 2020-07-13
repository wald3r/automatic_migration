import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Table, Button } from 'react-bootstrap'
import { useToasts } from 'react-toast-notifications'
import ConfirmationModal from './modals/ConfirmationModal'
import { deleteImage } from '../reducers/imagesReducer'

const ShowImages = (props) => {

  const [imageToDelete, setImageToDelete] = useState(null)
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false)

  const { addToast } = useToasts()

  const handleImageDeletion = (image) => {
    setImageToDelete(image)
    setShowDeleteConfirmationModal(true)
  }

  const deleteImage = async () => {

    await props.deleteImage(imageToDelete)
    addToast(`${imageToDelete.path} was deleted.`, {
      appearance: 'success',
      autoDismiss: true,
    })
    setImageToDelete(null)
  }

  return(
    <div>
      <ConfirmationModal
        showConfirmationModal={showDeleteConfirmationModal}
        setConfirmation={setShowDeleteConfirmationModal}
        handleConfirmation={deleteImage}
      />
      <Table responsive className='table table-hover'>
        <thead className='thead-dark'>
          <tr>
            <th>Instance Id</th>
            <th>Request Id</th>
            <th>IP</th>
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
              <td id='idImageIp'>{image.ip}</td>
              <td id='idImageCreatedAt'>{image.createdAt}</td>
              <td id='idImageUpdatedAt'>{image.updatedAt}</td>
              <td>
                <Button id='idImagesDelete'  data-toggle='tooltip' data-placement='top' title='Remove Image' onClick={() => handleImageDeletion(image)}><i className="fa fa-trash" /></Button>
              </td>
            </tr>
          </tbody>
        ))}
      </Table>
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
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowImages)