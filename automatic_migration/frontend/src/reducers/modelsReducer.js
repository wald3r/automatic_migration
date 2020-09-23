import modelsService from '../services/modelsService'


export const getModels = () => {
  return async dispatch => {
    const response = await modelsService.getAllModels()
    let data = response.data
    dispatch({
      type:'ALLMODELS',
      data
    })
  }
}


export const deleteModel = (obj) => {
  return async dispatch => {
    await modelsService.deleteModel(obj)
    let rowid = obj.rowid
    dispatch({
      type:'DELETEMODEL',
      rowid
    })
  }
}

export const newModel = (data) => {
  return async dispatch => {
    dispatch({
      type:'NEWMODEL',
      data
    })
  }
}

const modelsReducer = (state = [], action) => {
  switch (action.type){
  case 'ALLMODELS':
    return action.data
  case 'DELETEMODEL':
    return state.filter(i => i.rowid !== action.rowid)
  case 'NEWMODEL':
    return state.concat(action.data)
  default:
    return state
  }
}

export default modelsReducer