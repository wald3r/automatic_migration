import billingService from '../services/billingService'


export const getBilling = () => {
  return async dispatch => {
    const response = await billingService.getBilling()
    let data = response.data
    dispatch({
      type:'ALLBILLING',
      data
    })
  }
}

const billingReducer = (state = [], action) => {
  switch (action.type){
  case 'ALLBILLING':
    return action.data
  default:
    return state
  }
}

export default billingReducer