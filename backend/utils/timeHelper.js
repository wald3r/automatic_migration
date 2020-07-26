const parameters = require("../parameters")


const date = (time) => new Date(time)

const convertTime = (time) => {
  const date = new Date(Number(time))

  const conv_month = date.getMonth() < 10 ? `0${date.getMonth()}` : date.getMonth()
  const conv_date = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()

  return `${date.getFullYear()}-${conv_month}-${conv_date}`

}

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
  let minutes = newDate.getMinutes() + parameters.migrationMinutes
  if(minutes > 60){
    hours = hours + 1
  }

  return hours

}


const getMigrationMinutes = (time) => {
  let newDate = date(time)

  let minutes = convertMinutes(newDate.getMinutes() + parameters.migrationMinutes)

  return minutes

}

module.exports = {date, convertTime, convertHours, getMigrationMinutes, getMigrationHour}