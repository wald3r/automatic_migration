import React, { useState } from 'react'
import registrationService from '../services/registrationService'
import { Button, Form, Spinner } from 'react-bootstrap'
import { connect } from 'react-redux'
import '../stylesheets/general.css'
import { useToasts } from 'react-toast-notifications'

const Registration = ( props ) => {

  const { addToast } = useToasts()


  const [ username, setUsername ] = useState('')
  const [ password, setPassword ] = useState('')
  const [registering, setRegistering] = useState(false)

  const handleRegistration =  async (event) => {
    event.preventDefault()
    try{
      setRegistering(true)
      const response = await registrationService.register({ username, password })
      addToast(`${response.data.username} got Registered!"`, {
        appearance: 'success',
        autoDismiss: true,
      })
      setUsername('')
      setPassword('')
      setRegistering(false)
    }catch(error){
      setRegistering(false)
      addToast('Registration failed!', {
        appearance: 'error',
        autoDismiss: true,
      })
    }
  }

  return(

    <div className='container'>
      <Form onSubmit={handleRegistration}>
        <table className='table .table-striped' width="10">
          <tbody width="10">
            <tr>
              <td width="10">
                Username:
              </td>

              <td>
                <input id='name' autoComplete='off' type='text' onChange={({ target }) => setUsername(target.value)}/>
              </td>
            </tr>
            <tr>
              <td width="10">
                Password:
              </td>
              <td>
                <input id='password1' autoComplete='off' type='password' required onChange={({ target }) => setPassword(target.value)} />
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ display: registering === false ? '' : 'none' }}><Button className='button' id='register' type="submit">Register</Button></div>
        <div style={{ display: registering === true ? '' : 'none' }}><Button className='button' id='registering' type="submit">  <Spinner
          as="span"
          animation="grow"
          size="sm"
          role="status"
          aria-hidden="true"
        /> Registering...</Button>
        </div>
      </Form>
    </div>
  )

}


export default connect(null, null)(Registration)