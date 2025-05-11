const pad = (num, size) => {
  num = num.toString()
  while (num.length < size) num = '0' + num
  return num
}

export const convertTimeYTformat = (timeSec) => {
  const seconds = pad(Math.floor(timeSec % 60), 2)
  let hours
  let minutes
  if (Math.floor(timeSec / 60) > 60) {
    hours = Math.floor(timeSec / 3600)
    minutes = pad(Math.floor((timeSec / 60) % 60), 2)
  } else {
    minutes = Math.floor(timeSec / 60)
  }
  return hours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`
}

export const ytFormatToTimestamp = (string) => {
  let timestamp = 0
  const time = string.split(':')
  time.reverse().forEach((v, i) => {
    timestamp += v * 60 ** i * 1000
  })
  return timestamp
}
