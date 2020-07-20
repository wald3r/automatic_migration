import imagesService from '../services/imagesService'
import modelsService from '../services/modelsService'
import billingService from '../services/billingService'
import userService from '../services/userService'

export const setUser = (user) => {
  return async dispatch => {
    window.localStorage.setItem('loggedappUser', JSON.stringify(user))
    imagesService.setToken(user.token)
    modelsService.setToken(user.token)
    billingService.setToken(user.token)
    userService.setToken(user.token)
    dispatch({
      type:'SETUSER',
      user
    })
  }
}


export const removeUser = () => {
  return async dispatch => {
    window.localStorage.removeItem('loggedappUser')
    dispatch({
      type:'REMOVEUSER',
    })
  }
}

export const updateUser = (username) => {
  return async dispatch => {
    dispatch({
      type:'UPDATEUSER',
      username
    })
  }
}


const userReducer = (state = null, action) => {
  switch (action.type){
  case 'SETUSER':
    return action.user
  case 'UPDATEUSER':
    return { token: state.token, username: action.username, rowid: state.rowid }
  case 'REMOVEUSER':
    return null
  default:
    return state
  }
}

export default userReducer