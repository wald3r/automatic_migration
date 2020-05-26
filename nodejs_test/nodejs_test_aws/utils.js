const createDescripeSpotPriceHistoryParams = (nextToken, maxResults, startTime, endTime, instanceType, availabilityZone, productDescriptions) => {

  var params = {
    EndTime: endTime,
    AvailabilityZone: availabilityZone,
    InstanceTypes: [
       instanceType
    ], 
    ProductDescriptions: [
       productDescriptions
    ], 
    StartTime: startTime,
    MaxResults: maxResults,
    NextToken: nextToken
   }

   return params
}

const getDayFromHistory = (list, day) => {

  const filteredDay = list.filter(data => {
    var stamp = new Date(data.Timestamp)
    if(stamp.getDate() === day){
      return data
    }
  })
  return filteredDay
}

const getHoursFromHistoryDay = (list, start, end) => {

  const hours = list.filter(data => {
    var stamp = new Date(data.Timestamp)
    if(stamp.getHours() > start && stamp.getHours() < end){
      return data
    }
  })
  return hours
}

module.exports = { getDayFromHistory, getHoursFromHistoryDay, createDescripeSpotPriceHistoryParams }