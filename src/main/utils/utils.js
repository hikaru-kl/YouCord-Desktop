const axios = require('axios')
const crypto = require('crypto')
const dayjs = require('dayjs')
const qs = require('querystring')

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

const API_URL = 'https://apic.musixmatch.com/ws/1.1/'
const APP_ID = 'android-player-v1.0'
const SIGNATURE_SECRET = '967Pn4)N3&R_GBg5$b('
const DEFAULT_UA = 'Dalvik/2.1.0 (Linux; U; Android 13; Pixel 6 Build/T3B2.230316.003)'

// Simple in-memory cache
let cachedUserToken = null

function randomGuid() {
  return Math.floor(Math.random() * 1e16)
    .toString(16)
    .padStart(16, '0')
}

function randomUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function signUrlWithDate(url, date) {
  const ymd = dayjs(date).format('YYYYMMDD')
  const hmac = crypto.createHmac('sha1', SIGNATURE_SECRET)
  hmac.update(url)
  hmac.update(ymd)
  const signature = hmac.digest('base64') + '\n'
  return `${url}&signature=${encodeURIComponent(signature)}&signature_protocol=sha1`
}

async function getUserToken(forceRefresh = false) {
  // Use cached value unless forced to refresh
  if (cachedUserToken && !forceRefresh) {
    return cachedUserToken
  }

  const guid = randomGuid()
  const adv_id = randomUuid()
  const timestamp = dayjs().toISOString()

  const params = {
    adv_id,
    root: '0',
    sideloaded: '0',
    app_id: APP_ID,
    build_number: '2022090901',
    guid,
    lang: 'en_US',
    model: 'manufacturer/Google brand/Google model/Pixel 6',
    timestamp,
    format: 'json'
  }

  let url = `${API_URL}token.get?${qs.stringify(params)}`
  url = signUrlWithDate(url, timestamp)

  const response = await axios.get(url, {
    headers: {
      'User-Agent': DEFAULT_UA,
      Cookie: 'AWSELBCORS=0; AWSELB=0'
    }
  })

  let token
  if (response.data.message.body) {
    token = response.data.message.body.user_token
    cachedUserToken = token
    return token
  } else {
    return null
  }
}

async function searchTrackIdByTitle(title, artist) {
  const usertoken = await getUserToken()
  if (!usertoken) return null

  const searchParams = {
    app_id: APP_ID,
    format: 'json',
    usertoken,
    q_track: title,
    q_artist: artist,
    f_has_subtitle: 1,
  }

  let searchUrl = `${API_URL}track.search?${qs.stringify(searchParams)}`
  searchUrl = signUrlWithDate(searchUrl, new Date())

  try {
    const searchResponse = await axios.get(searchUrl, {
      headers: {
        'User-Agent': DEFAULT_UA,
        Cookie: 'AWSELBCORS=0; AWSELB=0',
      },
    })

    const trackList = searchResponse.data?.message?.body?.track_list
    if (!trackList || trackList.length === 0) return null

    return trackList[0].track.track_id
  } catch (err) {
    console.error('Track search error:', err.message)
    return null
  }
}

/**
 * @param { string } trackSpotifyId ID of spotify track to get lyrics
 */
export async function getLyrics(trackSpotifyId, byTitle = null) {
  const usertoken = await getUserToken()
  if (!usertoken) return null

  try {
    let trackId = null

    if (byTitle?.title && byTitle?.artist) {
      trackId = await searchTrackIdByTitle(byTitle.title, byTitle.artist)
      if (!trackId) return null
    }

    const params = {
      app_id: APP_ID,
      format: 'json',
      usertoken,
      subtitle_format: 'mxm',
      ...(trackId ? { track_id: trackId } : { track_spotify_id: trackSpotifyId })
    }

    let url = `${API_URL}track.subtitle.get?${qs.stringify(params)}`
    url = signUrlWithDate(url, new Date())

    const response = await axios.get(url, {
      headers: {
        'User-Agent': DEFAULT_UA,
        Cookie: 'AWSELBCORS=0; AWSELB=0',
      },
    })

    const subtitle = response.data?.message?.body?.subtitle
    if (!subtitle) return null

    const formattedLyrics = JSON.parse(subtitle.subtitle_body)
      .filter((line) => typeof line.text === 'string' && typeof line.time?.total === 'number')
      .map((line) => ({
        startTimeMs: Math.round(line.time.total * 1000).toString(),
        words: line.text.trim(),
      }))
      .filter((line) => line.words.length > 0)

    return formattedLyrics
  } catch (err) {
    if (!cachedUserToken) throw err
    console.warn('Retrying with refreshed user_token due to error:', err.message)
    cachedUserToken = null
    return await getLyrics(trackSpotifyId, byTitle)
  }
}

export const generateRandomString = (length) => {
  return crypto.randomBytes(60).toString('hex').slice(0, length)
}

const rpc = require('discord-rpc')

const discord_client = new rpc.Client({ transport: 'ipc' })

export const connectToDiscord = () =>
  new Promise((resolve) => {
    // let attempts = 0
    console.log('Connecting to discord...')
    let connectionInterval = setInterval(async () => {
      // attempts++

      discord_client
        .login({ clientId: '1273883076702900224' })
        .then(() => {
          clearInterval(connectionInterval)
          resolve(discord_client)
        })
        .catch((error) => {
          console.error(`Connection attempt failed: ${error.message}`)
        })
      // if (attempts >= 1000) {
      //   console.log('Max attempts reached, stopping connection attempts.')
      //   clearInterval(connectionInterval)
      //   resolve(false)
      // }
    }, 5000)
  })

export const repeatTimeout = (callback, delay) => {
  setTimeout(() => {
    callback()
    repeatTimeout(callback, delay)
  }, delay)
}
