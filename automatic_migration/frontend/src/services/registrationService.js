import axios from 'axios'

const baseUrl = '/api/registration'


const register = async (user) => {

  const response = await axios.post(baseUrl, user)
  return response
}


export default { register }