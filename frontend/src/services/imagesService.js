import axios from 'axios'


const baseUrl = '/api/images'

let token = null

// eslint-disable-next-line no-unused-vars
const setToken = newToken => {
  token = `bearer ${newToken}`
}

const rebootImage = async (image) => {

  const config = {
    headers: { Authorization: token },
  }

  const response = await axios.get(`${baseUrl}/reboot/${image.rowid}`, config)
  return response
}

const startImage = async (image) => {

  const config = {
    headers: { Authorization: token },
  }

  const response = await axios.get(`${baseUrl}/start/${image.rowid}`, config)
  return response
}

const stopImage = async (image) => {

  const config = {
    headers: { Authorization: token },
  }

  const response = await axios.get(`${baseUrl}/stop/${image.rowid}`, config)
  return response
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

export default { startImage, stopImage, rebootImage, newImage, getAllImages, deleteImage, setToken }