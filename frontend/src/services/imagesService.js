import axios from 'axios'


const baseUrl = '/api/images'

const newImage = async (obj) => {

  const response = await axios.post(baseUrl, obj)
  return response
}


const getAllImages = async () => {

  const response = await axios.get(baseUrl)
  return response
}


const deleteImage = async (obj) => {

  const response = await axios.delete(`${baseUrl}/${obj.id}`)
  return response
}

export default { newImage, getAllImages, deleteImage }