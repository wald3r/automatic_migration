

const createImageObject = (rowid, instanceId, zone, path, ip, key, createdAt, updatedAt) => {

  let obj = {
      id: rowid,
      instanceId: instanceId,
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