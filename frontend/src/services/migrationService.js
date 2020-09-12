import axios from 'axios'


const baseUrl = '/api/migration'

let token = null

// eslint-disable-next-line no-unused-vars
const setToken = newToken => {
  token = `bearer ${newToken}`
}

const getMigrations = async (imageid) => {

  const config = {
    headers: { Authorization: token },
  }
  const response = await axios.get(`${baseUrl}/${imageid}`, config)
  return response
}

export default { setToken, getMigrations }