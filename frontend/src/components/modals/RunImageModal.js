import React, { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'

const RunImageModal = ( { showRunImageModal, setShowRunImageModal, handleRun } ) => {

  const [docker, setDocker] = useState(null)
  const [key, setKey] = useState(null)

  const runImage = (event) => {
    setShowRunImageModal(false)
    handleRun({ docker, key }, event)
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
        <Form onSubmit={runImage}>
          <Modal.Body>
            <table className='table .table-striped' >
              <tbody >
                <tr>
                  <td >
                    Path to Docker Compose:
                  </td>

                  <td>
                    <input id='idPathDockerCompose' autoComplete='off' type='text' required onChange={({ target }) => setDocker(target.value)}/>
                  </td>
                </tr>
                <tr>
                  <td >
                    Path to Key:
                  </td>
                  <td>
                    <input id='idPathKeyFile' autoComplete='off' type='text' required onChange={({ target }) => setKey(target.value)} />
                  </td>
                </tr>
              </tbody>
            </table>
          </Modal.Body>
          <Modal.Footer>
            <Button id='buttonNo' variant="secondary" onClick={noChanges}>
              No
            </Button>
            <Button id='buttonCreate' variant="primary" type='submit'>
              Yes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}



export default RunImageModal