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
    let rowid = obj.rowid
    dispatch({
      type:'DELETEINSTANCE',
      rowid
    })
  }
}

export const newInstance = (data) => {
  return async dispatch => {
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
    return state.filter(i => i.rowid !== action.rowid)
  case 'NEWINSTANCE':
    return state.concat(action.data)
  default:
    return state
  }
}

export default instancesReducer