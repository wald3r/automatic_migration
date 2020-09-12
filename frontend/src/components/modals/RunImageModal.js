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
    }else if(!checkFiles(files)){
      setNotification('YML file is missing!')
    }else{
      handleRun({ simulation, bidprice, port, files }, event)
      setShowRunImageModal(false)
      setFiles([])
      setNotification('')
    }
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
    setNotification('')
  }

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

  return(
    <div>
      <Modal  size="lg" show={showRunImageModal} onHide={noChanges}>
        <Modal.Header closeButton>
          <Modal.Title>Run Image</Modal.Title>
        </Modal.Header>
        <Form method='POST' encType='multipart/form-data' onSubmit={uploadHandler} >
          <Modal.Body>
            <div className='form-group files' >
              <input type='file' autoComplete='off' name='files' directory="" webkitdirectory="" onChange={onChangeHandler}/>
            </div>
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
            <div style={{ color: 'red' }}>{notification}</div>

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
      </Modal>
    </div>
  )
}



export default RunImageModal