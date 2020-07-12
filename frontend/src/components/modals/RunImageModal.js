import React, { useState } from 'react'
import { Modal, Button, Form, Spinner } from 'react-bootstrap'
import '../../stylesheets/upload.css'

const RunImageModal = ( { showRunImageModal, setShowRunImageModal, handleRun } ) => {

  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState([])
  const [notification, setNotification] = useState('')

  const uploadHandler = async(event) => {
    setUploading(true)
    event.preventDefault()
    if(files.length === 0){
      setNotification('No files!')
    }else{
      handleRun(files, event)
      setShowRunImageModal(false)
    }
    setFiles([])
    setNotification('')
    setUploading(false)

  }

  const onChangeHandler = (event) => {
    event.preventDefault()
    setFiles(event.target.files)
  }


  const noChanges = () => {
    setShowRunImageModal(false)
  }
  return(
    <div>
      <Modal show={showRunImageModal} onHide={noChanges}>
        <Modal.Header closeButton>
          <Modal.Title>Run Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className='form-group files' >
            <Form method='POST' encType='multipart/form-data' onSubmit={uploadHandler} >
              <input type='file' autoComplete='off' name='files' multiple onChange={onChangeHandler}/>
              <Button style={{ display: uploading === false ? '' : 'none' }} className='button' type="submit">Upload</Button>
              <Button style={{ display: uploading === true ? '' : 'none' }} className='button' type="submit"><Spinner
                as="span"
                animation="grow"
                size="sm"
                role="status"
                aria-hidden="true"
              /> Uploading...
              </Button>
              {'  '}{notification}

            </Form>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button id='buttonNo' variant="secondary" onClick={noChanges}>
            No
          </Button>
          <Button id='buttonCreate' variant="primary" type='submit'>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}



export default RunImageModal