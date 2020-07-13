import React, { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import loginService from '../services/loginService'
import { connect } from 'react-redux'
import { setUser } from '../reducers/userReducer'
import { useToasts } from 'react-toast-notifications'

const Login = ( props ) => {

  const [username, setUsername] = useState(null)
  const [password, setPassword] = useState(null)
  const { addToast } = useToasts()


  const handleLogin = async (event) => {
    event.preventDefault()
    try{
      const response = await loginService.login({ username, password })
      if(response.status === 200){
        await props.setUser(response.data)
        addToast(`${response.data.username} logged in`, {
          appearance: 'success',
          autoDismiss: true,
        })
      }
    }catch(error){
      addToast('Login failed', {
        appearance: 'error',
        autoDismiss: true,
      })
    }
  }


  return(
    <div className='container'>
      <Form onSubmit={handleLogin}>
        <table className='table .table-striped' width="10">
          <tbody width="10">
            <tr>
              <td width="10">
                Username:
              </td>

              <td>
                <input id='username' autoComplete='off' required onChange={({ target }) => setUsername(target.value)}/>
              </td>
            </tr>
            <tr>
              <td width="10">
                Password:
              </td>

              <td>
                <input id='password' autoComplete='off' type='password' required onChange={({ target }) => setPassword(target.value)}/>
              </td>
            </tr>
          </tbody>
        </table>
        <Button className='button' id='login' type="submit">Login</Button>
      </Form>
    </div>
  )
}




const mapDispatchToProps = {
  setUser,
}

export default connect(null, mapDispatchToProps)(Login)
