import axios from 'axios'


const baseUrl = '/api/images'

let token = null

// eslint-disable-next-line no-unused-vars
const setToken = newToken => {
  token = `bearer ${newToken}`
}

const newImage = async (obj) => {

  const config = {
    headers: { Authorization: token },
  }

  const response = await axios.post(baseUrl, obj, config)
  return response
}


const getAllImages = async () => {

  const config = {
    headers: { Authorization: token },
  }

  const response = await axios.get(baseUrl, config)
  return response
}


const deleteImage = async (obj) => {

  const config = {
    headers: { Authorization: token },
  }

  const response = await axios.delete(`${baseUrl}/${obj.rowid}`, config)
  return response
}

export default { newImage, getAllImages, deleteImage, setToken }