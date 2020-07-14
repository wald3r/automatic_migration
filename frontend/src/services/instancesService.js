import axios from 'axios'


const baseUrl = '/api/instances'

let token = null

// eslint-disable-next-line no-unused-vars
const setToken = newToken => {
  token = `bearer ${newToken}`
}

const getAllInstances = async () => {

  const response = await axios.get(baseUrl)
  return response

}

const newInstance = async (obj) => {

  const config = {
    headers: { Authorization: token },
  }

  const response = await axios.post(baseUrl, obj, config)
  return response
}

const deleteInstance = async (obj) => {

  const config = {
    headers: { Authorization: token },
  }

  const response = await axios.delete(`${baseUrl}/${obj.rowid}`, { config, data: { obj } })
  return response
}

export default { setToken, getAllInstances, deleteInstance, newInstance }