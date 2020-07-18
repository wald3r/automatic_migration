function customException(message) {
  const error = new Error(message)
  return error
}

customException.prototype = Object.create(Error.prototype)


module.exports = { customException }