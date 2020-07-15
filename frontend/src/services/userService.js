import axios from 'axios'


const baseUrl = '/api/user'

let token = null

// eslint-disable-next-line no-unused-vars
const setToken = newToken => {
  token = `bearer ${newToken}`
}

const updateUser = async (obj) => {

  const config = {
    headers: { Authorization: token },
  }

  const response = await axios.post(`${baseUrl}/${obj.rowid}`, obj, config)
  return response
}



export default { setToken, updateUser }