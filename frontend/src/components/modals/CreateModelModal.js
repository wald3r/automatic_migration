import React, { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { connect } from 'react-redux'

const CreateModelModal = ( { showCreateModelModal, setCreateModelModal, handleCreation, ...props } ) => {

  const productList = ['Linux/UNIX', 'Windows', 'Red Hat Enterprise Linux', 'SUSE Linux']
  const [type, setType] = useState('r5.4xlarge')
  const [product, setProduct] = useState(productList[0])
  const [region, setRegion] = useState('worldwide')
  const [filter, setFilter] = useState('')

  const filteredList = filter === '' ? props.instancesList : props.instancesList.filter(i => i.instances.includes(filter))

  if(props.instancesList.length === 0 || props.regionsList.length === 0){
    return null
  }

  const createModel = (event) => {
    setCreateModelModal(false)
    handleCreation({ type, product, region }, event)
  }

  const noChanges = () => {
    setCreateModelModal(false)
  }

  return(
    <div>
      <Modal show={showCreateModelModal} onHide={noChanges}>
        <Modal.Header closeButton>
          <Modal.Title>Create Model</Modal.Title>
        </Modal.Header>
        <Form onSubmit={createModel}>
          <Modal.Body>
            <table className='table .table-striped' width="10">
              <tbody width="10">
                <tr>
                  <td width="10">
                    Type:
                  </td>

                  <td>
                    <select value={type} onChange={({ target }) => setType(target.value)} name='instances' id='instances'>
                      {filteredList.map(i =>
                        <option value={i.instances} key={i.instances}>{i.instances}</option>
                      )}
                    </select>
                  </td>
                </tr>
                <tr>
                  <td width="10">
                    Product:
                  </td>
                  <td>
                    <select value={product} onChange={({ target }) => setProduct(target.value)} name='product'>
                      {productList.map(p =>
                        <option value={p} key={p}>{p}</option>
                      )}
                    </select>
                  </td>
                </tr>
                <tr>
                  <td width="10">
                    Region:
                  </td>
                  <td>
                    <select value={type} onChange={({ target }) => setRegion(target.value)} name='regions' id='regions'>
                      {props.regionsList.map(i =>
                        <option value={i.regions} key={i.regions}>{i.regions}</option>
                      )}
                    </select>
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

const mapStateToProps = (state) => {
  return {
    zonesList: state.zonesList,
    instancesList: state.instancesList,
    regionsList: state.regionsList
  }
}


export default connect(mapStateToProps)(CreateModelModal)