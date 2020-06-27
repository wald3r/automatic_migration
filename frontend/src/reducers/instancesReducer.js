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

const instancesReducer = (state = [], action) => {
  console.log(action.type)
  switch (action.type){
  case 'ALLINSTANCES':
    return action.data
  case 'DELETEINSTANCE':
    let tmp = state.filter(i => i.id !== action.id)
    return tmp
  default:
    return state
  }
}

export default instancesReducer