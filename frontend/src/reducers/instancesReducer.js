import instancesService from '../services/instancesService'


export const getInstances = () => {
  return async dispatch => {
    const response = await instancesService.getAllInstances()
    let data = response.data
    dispatch({
      type:'ALLINSTANCES',
      data
    })
  }
}


export const deleteInstance = (obj) => {
  return async dispatch => {
    await instancesService.deleteInstance(obj)
    let id = obj.id
    dispatch({
      type:'DELETEINSTANCE',
      id
    })
  }
}

export const newInstance = (obj) => {
  return async dispatch => {
    const response = await instancesService.newInstance(obj)
    console.log(response.body)
    let data = response.body
    dispatch({
      type:'NEWINSTANCE',
      data
    })
  }
}

const instancesReducer = (state = [], action) => {
  switch (action.type){
  case 'ALLINSTANCES':
    return action.data
  case 'DELETEINSTANCE':
    return state.filter(i => i.id !== action.id)
  case 'NEWINSTANCE':
    return state.concat(action.data)
  default:
    return state
  }
}

export default instancesReducer