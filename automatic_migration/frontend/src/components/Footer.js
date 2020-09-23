import React from 'react'
import { connect } from 'react-redux'
import { removeUser } from '../reducers/userReducer'
import '../stylesheets/general.css'
import { useToasts } from 'react-toast-notifications'



const Footer = (props) => {

  const { addToast } = useToasts()

  const handleLogout = () => {
    props.removeUser()
    addToast(`${props.user.username} logged out.`, {
      appearance: 'success',
      autoDismiss: true,
    })

  }


  return (
    <div className='footer'>
      {props.user.username} is logged in! <a className='logout' href='/' onClick={handleLogout}>Logout</a>
    </div>

  )
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
  }
}

const mapDispatchToProps = {
  removeUser,
}

export default connect(mapStateToProps, mapDispatchToProps)(Footer)