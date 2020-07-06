import imagesServices from '../services/imagesService'


export const getImages = () => {
  return async dispatch => {
    const response = await imagesServices.getAllImages()
    let data = response.data
    dispatch({
      type:'ALLIMAGES',
      data
    })
  }
}

export const deleteImage = (obj) => {
  return async dispatch => {
    await imagesServices.deleteImage(obj)
    dispatch({
      type:'DELETEIMAGE',
      obj
    })
  }
}



export const newImage = (data) => {
  return async dispatch => {
    dispatch({
      type:'NEWIMAGE',
      data
    })
  }
}

const imagesReducer = (state = [], action) => {
  switch (action.type){
  case 'ALLIMAGES':
    return action.data
  case 'NEWIMAGE':
    return action.data
  case 'DELETEIMAGE':
    return state.filter(i => i.id !== action.obj.id)
  default:
    return state
  }
}

export default imagesReducer