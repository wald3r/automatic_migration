
const now = new Date
const utc_timestamp = new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() , 
      now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds())).toUTCString()



module.exports = {utc_timestamp}