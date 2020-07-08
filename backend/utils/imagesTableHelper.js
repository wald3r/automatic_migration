

const createImageObject = (rowid, instanceId, requestId, zone, path, ip, key, createdAt, updatedAt) => {

  let obj = {
      id: rowid,
      instanceId: instanceId,
      requestId: requestId,
      zone: zone,
      path: path,
      ip: ip,
      key, key,
      createdAt: createdAt,
      updatedAt: updatedAt
  }
  return obj

}


module.exports = {createImageObject}