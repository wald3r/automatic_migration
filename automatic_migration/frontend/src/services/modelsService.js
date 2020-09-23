import axios from 'axios'


const baseUrl = '/api/models'

let token = null

// eslint-disable-next-line no-unused-vars
const setToken = newToken => {
  token = `bearer ${newToken}`
}

const getAllModels = async () => {

  const response = await axios.get(baseUrl)
  return response

}

const newModel = async (obj) => {

  const config = {
    headers: { Authorization: token },
  }

  const response = await axios.post(baseUrl, obj, config)
  return response
}

const deleteModel = async (obj) => {

  const config = {
    headers: { Authorization: token },
    data: { obj },
  }

  const response = await axios.delete(`${baseUrl}/${obj.rowid}`, config)
  return response
}

export default { setToken, getAllModels, deleteModel, newModel }