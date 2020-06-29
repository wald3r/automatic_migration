import React, { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { connect } from 'react-redux'

const CreateInstanceModal = ( { showCreateInstanceModal, setCreateInstanceModal, handleCreation, ...props } ) => {

  const productList = ['Linux/Unix', 'Windows', 'RedHat', 'Linux-Suse']
  const [simulation, setSimulation] = useState(false)
  const [type, setType] = useState('r5.4xlarge')
  const [bidprice, setBidprice] = useState(null)
  const [product, setProduct] = useState(productList[0])
  const [region, setRegion] = useState(null)

  if(props.instancesList.length === 0){
    return null
  }

  const createInstance = (event) => {
    setCreateInstanceModal(false)
    let tmpSim = simulation === false ? 0 : 1
    handleCreation({ simulation: tmpSim, type, bidprice, product, region }, event)
  }

  const noChanges = () => {
    setCreateInstanceModal(false)
  }
  return(
    <div>
      <Modal show={showCreateInstanceModal} onHide={noChanges}>
        <Modal.Header closeButton>
          <Modal.Title>Create Instance</Modal.Title>
        </Modal.Header>
        <Form onSubmit={createInstance}>
          <Modal.Body>
            <table className='table .table-striped' width="10">
              <tbody width="10">
                <tr>
                  <td width="10">
                    Type:
                  </td>

                  <td>
                    <select value={type} onChange={({ target }) => setType(target.value)} name='instances' id='instances'>
                      {props.instancesList.map(i =>
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
                    Bid Price:
                  </td>

                  <td>
                    <input id='instanceBidPrice' autoComplete='off' type='number' step='0.1' required onChange={({ target }) => setBidprice(target.value)}/>
                  </td>
                </tr>
                <tr>
                  <td width="10">
                    Region:
                  </td>
                  <td>
                    <input id='instanceRegion' autoComplete='off' type='text' />
                  </td>
                </tr>
                <tr>
                  <td width="10">
                    Simulation
                  </td>
                  <td>
                    <input id='instanceSimulation' autoComplete='off' type='checkbox' onChange={() => setSimulation(true)} />
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
    instancesList: state.instancesList
  }
}


export default connect(mapStateToProps)(CreateInstanceModal)