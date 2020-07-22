const parameters = require("../parameters")


const date = (time) => new Date(time)


const convertHours = (hours) => {
  if(hours > 23){
    return hours - 23 
  }
  return hours
}

const convertMinutes = (minutes) => {
  if(minutes > 60){
    return minutes -  60
  }
  return minutes
}

const getMigrationHour = (time) => {
  let newDate = date(time)

  let hours = convertHours(newDate.getHours() + parameters.migrationHour)

  return hours

}


const getMigrationMinutes = (time) => {
  let newDate = date(time)

  let minutes = convertMinutes(newDate.getMinutes() + parameters.migrationMinutes)

  return minutes

}

module.exports = {date, convertHours, getMigrationMinutes, getMigrationHour}