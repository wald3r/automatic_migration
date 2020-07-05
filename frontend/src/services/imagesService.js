import axios from 'axios'


const baseUrl = '/api/images'

const newImage = async (obj) => {

  const response = await axios.post(baseUrl, obj)
  return response
}


export default { newImage }