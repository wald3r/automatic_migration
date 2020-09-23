export const setZonesList = (zones) => {
  return async dispatch => {
    dispatch({
      type:'SETZONES',
      zones
    })
  }
}




const zonesListReducer = (state = [], action) => {
  switch (action.type){
  case 'SETZONES':
    return action.zones
  default:
    return state
  }
}

export default zonesListReducer