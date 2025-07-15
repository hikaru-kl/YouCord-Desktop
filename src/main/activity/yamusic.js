import { setActivity } from './manager.js'
import { getLyrics } from '../utils/utils.js'
import { store } from '../config/store.js' 

// const wins = require('windows-shortcuts')
// const path_ = require('path')

const WebSocket = require('ws')
const exec = require('child_process').execFile
const axios = require('axios')
const fs = require('node:fs')

let yamusicActivity = {}

let lastTrackKey = ''
let lastLyrics = null

async function updateLyricsIfNeeded(data) {
  const currentKey = `${data.artist} - ${data.trackTitle}`
  if (currentKey === lastTrackKey && lastLyrics) {    
    return lastLyrics
  }
  const lyrics = await getLyrics(null, { artist: data.artist, title: data.trackTitle })
  if (lyrics) {
    lastTrackKey = currentKey
    lastLyrics = lyrics
  }
  return lyrics
}

function getExpandedTitle(track) {
  let expandedTitle = track.trackTitle + ' (' + track.artist + ')'
  return expandedTitle.length > 128 ? expandedTitle.substring(0, 125) + '...' : expandedTitle
}

export async function handleYamusicActivity(data, discord_client, config) {
  const isPaused = data.paused === true
  const lyrics = await updateLyricsIfNeeded(data)
  const expandedTitle = getExpandedTitle(data)

  yamusicActivity = {
    pid: process.pid,
    activity: {
      type: 3,
      details: config.profiles.yamusic.parameters.title
        ? config.profiles.yamusic.parameters.author && config.profiles.yamusic.parameters.lyrics
          ? expandedTitle
          : data.trackTitle
        : 'Listening YandexMusic',
      state:
        config.profiles.yamusic.parameters.author && !config.profiles.yamusic.parameters.lyrics
          ? data.artist
          : undefined,
      assets: {
        large_image: config.profiles.yamusic.parameters.image ? data.thumbnail : 'youcord-logo',
        large_text: 'YouCord created by hikaru_kl',
        small_image: 'yamusic-icon',
        small_text: isPaused ? 'Yandex Music (Paused)' : 'Yandex Music'
      },
      buttons: [{ label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord-Desktop' }]
    }
  }

  if (!isPaused && config.profiles.yamusic.parameters.duration) {
    yamusicActivity.activity.timestamps = {
      start: Date.now() - data.currentTime * 1000,
      end: Date.now() + (data.trackDuration * 1000 - data.currentTime * 1000)
    }
  }

  if (config.profiles.yamusic.parameters.lyrics && data.trackTitle && data.artist) {
    updateStateWithLyricsIfNeeded(yamusicActivity, lyrics, config, data)
  }

  setActivity('yamusic', yamusicActivity, discord_client)
}

class yamusic {
  constructor(port, path) {
    this.port = port
    this.path = path
  }
  startup() {
    return new Promise((resolve) => {
      resolve(exec(this.path, [`--remote-debugging-port=${this.port}`]))
    })
  }
}

export const initYamusic = (port, path, isDev = true) => {
  const DEBUGGER_URL = `http://localhost:${port}`
  function sleep(time, callback) {
    var stop = new Date().getTime()
    while (new Date().getTime() < stop + time) {
      true
    }
    callback()
  }

  // const isPatched = store.get('app').yamusicPatched
  // if (!isPatched) {
  //   const appdata = process.env.APPDATA
  //   const shortcutPath = path_.join(
  //     appdata,
  //     'Microsoft',
  //     'Windows',
  //     'Start Menu',
  //     'Programs',
  //     'Яндекс Музыка.lnk'
  //   );

  //   const targetExe = 'C:\\Users\\maxim\\AppData\\Local\\Programs\\YandexMusic\\Яндекс Музыка.exe'

  //   wins.edit(shortcutPath, {
  //     target: targetExe,
  //     args: `--remote-debugging-port=${port}`,
  //     workingDir: path_.dirname(targetExe),
  //     runStyle: 1,
  //     icon: targetExe
  //   }, err => {
  //     if (err) console.error('Failed to create shortcut:', err)
  //     else console.log('Shortcut created successfully')
  //   })
  // } else 
  //   console.log(store.get('app'))
    

  const app = new yamusic(port, path)
  let script;
  if (isDev)
    script = fs.readFileSync('./resources/yaMusicScript.js', 'utf8')
  else 
    script = fs.readFileSync('./resources/app.asar.unpacked/resources/yaMusicScript.js', 'utf8')
  console.log('User script has loaded')

  app.startup().then(() => {
    sleep(6000, () => {
      axios
        .get(DEBUGGER_URL + '/json/list', { timeout: 2000 })
        .then((response) => {
          const data = response.data
          if (data) {
            const wsDebugger = data[0].webSocketDebuggerUrl
            const ws = new WebSocket(wsDebugger)
            ws.on('open', () => {
              console.log('Connection to Yandex Music debugger has been opened')
              ws.send(
                JSON.stringify({
                  id: Math.floor(Math.random() * (9999 - 1337) + 1337),
                  method: 'Runtime.evaluate',
                  params: {
                    expression: script,
                    objectGroup: 'evalme',
                    returnByValue: false,
                    userGesture: true
                  }
                })
              )
            })
            ws.on('message', (e) => {
              console.log(e)
            })
          }
        })
        .catch((e) => console.error(e.errors))
    })
  })
}

export async function handleYamusicCallback(req, res, discord_client) {
  const config = store.get('data')
  const data = req.body

  const lyrics = await updateLyricsIfNeeded(data)
  const expandedTitle = getExpandedTitle(data)

  const isPaused = data.paused === true
  let yamusicActivity = {
    pid: process.pid,
    activity: {
      type: 3,

      details: config.profiles.yamusic.parameters.title
        ? config.profiles.yamusic.parameters.author && config.profiles.yamusic.parameters.lyrics
          ? expandedTitle
          : data.trackTitle
        : 'Listening YandexMusic',
      state:
        config.profiles.yamusic.parameters.author && !config.profiles.yamusic.parameters.lyrics
          ? data.artist
          : undefined,
      assets: {
        large_image: config.profiles.yamusic.parameters.image ? data.thumbnail : 'youcord-logo',
        large_text: 'YouCord created by hikaru_kl',
        small_image: 'yamusic-icon',
        small_text: isPaused ? 'Yandex Music (Paused)' : 'Yandex Music'
      },
      buttons: [
        {
          label: 'Author`s github',
          url: 'https://github.com/hikaru-kl/YouCord-Desktop'
        }
      ]
    }
  }

  if (!isPaused && config.profiles.yamusic.parameters.duration) {
    yamusicActivity.activity.timestamps = {
      start: Date.now() - data.currentTime * 1000,
      end: Date.now() + (data.trackDuration * 1000 - data.currentTime * 1000)
    }
  }

  if (config.profiles.yamusic.parameters.lyrics && data.trackTitle && data.artist) {
    updateStateWithLyricsIfNeeded(yamusicActivity, lyrics, config, data)
  }

  setActivity('yamusic', yamusicActivity, discord_client)
}

function updateStateWithLyricsIfNeeded(yamusicActivity, lyrics, config, data) {  
  if (lyrics) {
    let flag = false
    const items = ['♪ ♩♪', '♫ ♫♪', '♫ ♪♪', '♪♪♪', '♩♬♫', '♫ ♬ ♬']
    const progress = data.currentTime * 1000

    for (let i = 0; i < lyrics.length - 1; i++) {
      const curr = lyrics[i]
      const next = lyrics[i + 1]
      const currTime =
        typeof curr.startTimeMs !== 'undefined'
          ? parseInt(curr.startTimeMs)
          : Math.round((curr.time?.total || 0) * 1000)
      const nextTime =
        typeof next.startTimeMs !== 'undefined'
          ? parseInt(next.startTimeMs)
          : Math.round((next.time?.total || 0) * 1000)

      if (currTime <= progress && nextTime > progress) {
        const text = curr.words || curr.text || ''
        yamusicActivity.activity.state =
          text.length < 2
            ? text + '~♪♪'
            : text + ' ' + items[Math.floor(Math.random() * items.length)]
        flag = true
        break
      }
    }

    if (!flag) {
      yamusicActivity.activity.state = items[Math.floor(Math.random() * items.length)]
    }
  } else if (
    config.profiles.spotify.parameters.author &&
    config.profiles.spotify.parameters.title &&
    !lyrics
  ) {
    yamusicActivity.activity.details = data.trackTitle
    yamusicActivity.activity.state = data.artist
  } else if (
    config.profiles.spotify.parameters.author &&
    !config.profiles.spotify.parameters.title &&
    !lyrics
  ) {
    yamusicActivity.activity.state = data.artist
  }
  if (yamusicActivity.activity.state?.length > 128)
    yamusicActivity.activity.state = yamusicActivity.activity.state.substring(0, 125) + '...'
}