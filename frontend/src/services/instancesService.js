import axios from 'axios'


const baseUrl = '/api/instances'


const getAllInstances = async () => {

  const response = await axios.get(baseUrl)
  return response

}


const deleteInstance = async (obj) => {
  const response = await axios.delete(`${baseUrl}/${obj.id}`)
  return response
}

export default { getAllInstances, deleteInstance }