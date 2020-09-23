import React from 'react'
import { Modal, Button } from 'react-bootstrap'



const ConfirmationModal = ( { showConfirmationModal, setConfirmation, handleConfirmation } ) => {

  const saveChanges = () => {
    setConfirmation(false)
    handleConfirmation()
  }

  const noChanges = () => {
    setConfirmation(false)
  }

  return(
    <div>
      <Modal show={showConfirmationModal} onHide={noChanges}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>Do you really want to proceed?</Modal.Body>
        <Modal.Footer>
          <Button id='cancel' variant="secondary" onClick={noChanges}>
            No
          </Button>
          <Button id='save' variant="primary" onClick={saveChanges}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default ConfirmationModal