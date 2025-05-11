/**
 * @param { string } string
 */
export const ytFormatToTimestamp = (string) => {
  let timestamp = 0
  const time = string.split(':')
  time.reverse().forEach((v, i) => {
    timestamp += v * 60 ** i * 1000
  })
  return timestamp
}
