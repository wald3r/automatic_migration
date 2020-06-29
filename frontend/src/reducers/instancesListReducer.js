export const setInstancesList = (instances) => {
  return async dispatch => {
    dispatch({
      type:'SETINSTANCES',
      instances
    })
  }
}


const instancesListReducer = (state = [], action) => {
  switch (action.type){
  case 'SETINSTANCES':
    return action.instances
  default:
    return state
  }
}

export default instancesListReducer