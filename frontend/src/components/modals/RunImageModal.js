import React, { useState } from 'react'
import { Modal, Button, Form, Spinner } from 'react-bootstrap'
import '../../stylesheets/upload.css'

const RunImageModal = ( { showRunImageModal, setShowRunImageModal, handleRun } ) => {

  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState([])
  const [notification, setNotification] = useState('')
  const [simulation, setSimulation] = useState(false)
  const [bidprice, setBidprice] = useState(null)
  const [port, setPort] = useState(null)


  const uploadHandler = async(event) => {
    setUploading(true)
    event.preventDefault()

    if(files.length === 0){
      setNotification('No files!')
    }else{
      handleRun({ simulation, bidprice, port, files }, event)
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
    setFiles([])
    setSimulation(false)
    setBidprice(null)
    setPort(null)
    setShowRunImageModal(false)
  }
  return(
    <div>
      <Modal  size="lg" show={showRunImageModal} onHide={noChanges}>
        <Modal.Header closeButton>
          <Modal.Title>Run Image</Modal.Title>
        </Modal.Header>
        <div className='form-group files' >
          <Form method='POST' encType='multipart/form-data' onSubmit={uploadHandler} >
            <Modal.Body>
              {notification}
              <input type='file' autoComplete='off' name='files' directory="" webkitdirectory="" onChange={onChangeHandler}/>
              <table className='table .table-striped' width="10">
                <tbody width="10">
                  <tr>
                    <td width="10">
                      Bidbrice:
                    </td>

                    <td>
                      <input id='modelBidPrice' autoComplete='off' type='number' step='0.1' required onChange={({ target }) => setBidprice(target.value)}/>
                    </td>
                  </tr>
                  <tr>
                    <td width="10">
                      Port:
                    </td>

                    <td>
                      <input id='modelPort' autoComplete='off' type='number' step='1' required onChange={({ target }) => setPort(target.value)}/>
                    </td>
                  </tr>
                  <tr>
                    <td width="10">
                      Simulation
                    </td>
                    <td>
                      <input id='modelSimulation' autoComplete='off' type='checkbox' onChange={() => setSimulation(!simulation)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </Modal.Body>
            <Modal.Footer>
              <br/>
              <br/>
              <Button id='buttonNo' variant="secondary" onClick={noChanges}>
                No
              </Button>
              <Button style={{ display: uploading === false ? '' : 'none' }} className='button' type="submit">Upload</Button>
              <Button style={{ display: uploading === true ? '' : 'none' }} className='button' type="submit"><Spinner
                as="span"
                animation="grow"
                size="sm"
                role="status"
                aria-hidden="true"
              /> Uploading...
              </Button>
            </Modal.Footer>
          </Form>
        </div>
      </Modal>
    </div>
  )
}



export default RunImageModal