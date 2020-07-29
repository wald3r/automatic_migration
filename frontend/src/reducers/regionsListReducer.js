export const setRegionsList = (regions) => {
  return async dispatch => {
    dispatch({
      type:'SETREGIONS',
      regions
    })
  }
}


const regionsListReducer = (state = [], action) => {
  switch (action.type){
  case 'SETREGIONS':
    return action.regions
  default:
    return state
  }
}

export default regionsListReducer