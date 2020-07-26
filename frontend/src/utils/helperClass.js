


export const convertTime = (time) => {
  const date = new Date(Number(time))


  const conv_month = date.getMonth() < 10 ? `0${date.getMonth()}` : date.getMonth()
  const conv_date = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
  const conv_hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
  const conv_minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
  const conv_seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()

  return `${conv_date}-${conv_month}-${date.getFullYear()} ${conv_hours}:${conv_minutes}:${conv_seconds}`

}