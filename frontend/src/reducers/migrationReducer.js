import migrationService from '../services/migrationService'


export const getMigrations = () => {
  return async dispatch => {
    const response = await migrationService.getMigrations()
    let data = response.data
    dispatch({
      type:'ALLMIGRATIONS',
      data
    })
  }
}

const migrationReducer = (state = [], action) => {
  switch (action.type){
  case 'ALLMIGRATIONS':
    return action.data
  default:
    return state
  }
}

export default migrationReducer