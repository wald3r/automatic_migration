import axios from 'axios'


const baseUrl = '/api/key'

let token = null

// eslint-disable-next-line no-unused-vars
const setToken = newToken => {
  token = `bearer ${newToken}`
}



const downloadKey = async (obj) => {

  const config = {
    headers: { Authorization: token },
  }

  const response = await axios.get(`${baseUrl}/${obj.rowid}`, config)
  return response
}

export default {
  downloadKey,
  setToken
}