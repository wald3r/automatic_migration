import React, { useState } from 'react'
import { Form, Button, Spinner } from 'react-bootstrap'
import { connect } from 'react-redux'
import { useToasts } from 'react-toast-notifications'
import userService from '../services/userService'
import { updateUser } from '../reducers/userReducer'

const Profile = (props) => {

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [updating, setUpdating] = useState(false)
  const { addToast } = useToasts()
  var usernameFlag = false
  var passwordFlag = false

  if(props.user === null){
    return
  }

  const handleUpdate = async (event) => {
    event.preventDefault()
    setUpdating(true)

    if(username !== '') usernameFlag = true
    if(password !== '') passwordFlag = true

    const userDetail = {
      rowid: props.user.rowid,
      username: usernameFlag === true ? username : props.user.username,
      password: passwordFlag === true ? password : props.user.password
    }
    try{
      const response = await userService.updateUser(userDetail)
      if(response.status === 200){
        props.updateUser(userDetail.username)
        addToast(`User ${userDetail.username} updated`, {
          appearance: 'success',
          autoDismiss: true,
        })
      }

      setUpdating(false)
    }catch(exception){
      addToast('Update did not work', {
        appearance: 'error',
        autoDismiss: true,
      })
      setUpdating(false)
    }
  }

  return (
    <div>
      <Form onSubmit={handleUpdate}>
        <table className='table .table-striped' width="10">
          <tbody width="10">
            <tr>
              <td width="10">
                Username:
              </td>

              <td>
                <input id='name' defaultValue={props.user.username} autoComplete='off' type='text' onChange={({ target }) => setUsername(target.value)}/>
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
        <div style={{ display: updating === false ? '' : 'none' }}><Button className='button' id='register' type="submit">Update</Button></div>
        <div style={{ display: updating === true ? '' : 'none' }}><Button className='button' id='registering' type="submit">  <Spinner
          as="span"
          animation="grow"
          size="sm"
          role="status"
          aria-hidden="true"
        /> Updating...</Button>
        </div>
      </Form>
    </div>
  )
}

const mapStateToProps = (state) => {
  return{
    user: state.user
  }
}

const mapDispatchToProps = {
  updateUser,
}

export default connect(mapStateToProps, mapDispatchToProps)(Profile)