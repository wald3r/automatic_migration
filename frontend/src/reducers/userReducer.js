import imagesService from '../services/imagesService'
import instancesService from '../services/instancesService'

export const setUser = (user) => {
  return async dispatch => {
    window.localStorage.setItem('loggedappUser', JSON.stringify(user))
    imagesService.setToken(user.token)
    instancesService.setToken(user.token)
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


const userReducer = (state = null, action) => {
  switch (action.type){
  case 'SETUSER':
    return action.user
  case 'REMOVEUSER':
    return null
  default:
    return state
  }
}

export default userReducer