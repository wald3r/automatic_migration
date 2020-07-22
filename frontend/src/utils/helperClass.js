


export const convertTime = (time) => {
  const date = new Date(Number(time))

  return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`

}