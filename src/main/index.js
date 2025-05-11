import { app, shell, BrowserWindow, ipcMain, dialog, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/youcord-logo.ico?asset'
import { Store } from './store.js'

const AutoLaunch = require('auto-launch')

const crypto = require('crypto')
const generateRandomString = (length) => {
  return crypto.randomBytes(60).toString('hex').slice(0, length)
}

const PORT = 25740

// Setting up application storage and user's config
export const store = new Store({
  configName: 'settings',
  defaults: {
    data: {
      profiles: {
        youtube: {
          parameters: {
            title: true,
            author: true,
            duration: true,
            link: true
          },
          priority: 1
        },
        spotify: {
          parameters: {
            title: true,
            author: true,
            lyrics: true,
            duration: true,
            link: true,
            image: true,
            access_token: '',
            refresh_token: '',
            expires_at: -1
          },
          priority: 2
        },
        yamusic: {
          parameters: {
            title: true,
            author: true,
            duration: true,
            link: false,
            image: true,
            app_path: ''
          },
          priority: 3
        }
      }
    },
    settings: {
      windowBounds: { width: 1050, height: 730 },
      autoLaunch: false,
      exitTray: false,
      theme: 'dark',
      language: 'en'
    }
  }
})

// Spotify application config
const APP_SPOTIFY = {
  client_id: 'bf649664b00a4eec82b5fb056f33ac5b',
  client_secret: '',
  redirect_uri: `http://localhost:${PORT + 2}/spotify/callback`,
  scopes: 'user-read-currently-playing',
  stateKey: 'spotify_auth_state',
  state: generateRandomString(16),
  access_token: store.get('data').profiles.spotify.parameters.access_token,
  refresh_token: store.get('data').profiles.spotify.parameters.refresh_token,
  expires_at: store.get('data').profiles.spotify.parameters.expires_at
}

APP_SPOTIFY.auth_url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${APP_SPOTIFY.client_id}&scope=${APP_SPOTIFY.scopes}&redirect_uri=${APP_SPOTIFY.redirect_uri}&state=${APP_SPOTIFY.state}`

let spotifyStatus = false;
let servicePriority = 999


function createWindow() {

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: store.get('settings').windowBounds.width,
    height: store.get('settings').windowBounds.height,
    show: false,
    title: 'YouCord',
    icon: join(__dirname, '../../resources/youcord-logo.ico'),
    minWidth: 1050,
    minHeight: 630,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Checking User's spotify account and trying to update token if can
  spotifyStatus =
    APP_SPOTIFY.access_token.length != 0 &&
    APP_SPOTIFY.refresh_token.length != 0 &&
    (APP_SPOTIFY.expires_at > Date.now() || refreshSpotifyToken(APP_SPOTIFY.refresh_token))
  console.log(`Spotify token status: ${spotifyStatus}`)

  // Updating user window's size config
  // mainWindow.webContents.openDevTools()
  mainWindow.on('resized', () => {
    let settings = store.get('settings')
    settings.windowBounds.width = mainWindow.getSize()[0]
    settings.windowBounds.height = mainWindow.getSize()[1]
    store.set('settings', settings)
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Send user's config parameters to UI
  // Preparing data for spotify authorization
  mainWindow.on('ready-to-show', () => {
    mainWindow.webContents.send('setParams', store.get('data').profiles)
    mainWindow.webContents.send('setSettings', {
      settings: store.get('settings'),
      services: store.get('data').profiles
    })
    mainWindow.webContents.send('spotifyAuthURL', { auth_url: APP_SPOTIFY.auth_url })
    mainWindow.webContents.send('spotifyStatus', { authorized: spotifyStatus })

    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.  
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.whenReady().then(() => {
  const youcordAutoLaunch = new AutoLaunch({ name: 'YouCord Alpha1.0', path: app.getPath('exe') })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.youcord')

  // Setting up context meny and tool bar
  const tray = new Tray(app.getAppPath() + '/resources/youcord-logo.ico')
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Открыть окно',
      type: 'normal',
      click: () =>
        BrowserWindow.getAllWindows().length === 0
          ? createWindow()
          : BrowserWindow.getAllWindows()[0].show()
    },
    {
      label: 'Выход',
      type: 'normal',
      click: () => (process.platform !== 'darwin' ? app.quit() : {})
    }
  ])
  tray.setToolTip('YouCord')
  tray.setContextMenu(contextMenu)
  tray.addListener('click', () =>
    BrowserWindow.getAllWindows().length === 0
      ? createWindow()
      : BrowserWindow.getAllWindows()[0].show()
  )

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Changing priority config 
  ipcMain.on('changePriority', (e, message) => {
    let data = store.get('data')

    message.services.forEach((service) => {
      if (data.profiles[service.service].priority == servicePriority)
        servicePriority = service.priority
      data.profiles[service.service].priority = service.priority
    })
    store.set('data', data)
  })

  // Send config into UI
  ipcMain.on('askUpdate', (e) => {
    e.reply('setParams', store.get('data').profiles)
  })

  // Changing any parameters
  ipcMain.on('changeSettings', (e, message) => {
    let settings = store.get('settings')
    settings[message.name] = message.value
    settings.autoLaunch ? youcordAutoLaunch.enable() : youcordAutoLaunch.disable()
    store.set('settings', settings)
  })
  ipcMain.on('changeParams', (e, message) => {
    let data = store.get('data')

    data.profiles[message.service].parameters = message.config
    store.set('data', data)
    app.emit('setParams', data.profiles)
  })
  ipcMain.on('openYamusic', () => {
    const data = store.get('data')
    initYamusic(PORT + 1, data.profiles.yamusic.parameters.app_path)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (!store.get('settings').exitTray && process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

import { connectToDiscord } from './discordUtils.js';

import { ytFormatToTimestamp } from './utils.js'
import { initYamusic } from './yamusic.js'
const express = require('express')
const cookieParser = require('cookie-parser')
const axios = require('axios');

connectToDiscord().then(
  (discord_client) => {
    if (discord_client == false) {
      dialog.showErrorBox(
        'Не удается подключиться к Discord',
        'Вероятно Discord не запущен, перезапустите YouCord после запуска Discord'
      )
      app.quit()
  }  

  const WebSocket = require('ws')

  const wss = new WebSocket.Server({ port: PORT })

  const httpApp = express()

  httpApp.use(express.json()).use(cookieParser())

  httpApp.post('/yamusic', (req) => {
    let config = store.get('data')
    if (config.profiles.yamusic.priority <= servicePriority) {
      let data = req.body
      servicePriority = config.profiles.yamusic.priority
      let activity = {
        pid: process.pid,
        activity: {
          type: 3,
          details: config.profiles.yamusic.parameters.title ? data.trackTitle : 'youcord',
          state: config.profiles.yamusic.parameters.author ? data.artist : undefined,
          assets: {
            large_image: config.profiles.yamusic.parameters.image ? data.thumbnail : 'youcord-logo',
            large_text: 'YouCord created by hikaru_kl',
            small_image: 'yamusic-icon',
            small_text: 'Yandex Music'
          },
          buttons: [{ label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord' }]
        }
      }
      if (config.profiles.yamusic.parameters.duration)
        activity.activity.timestamps = {
          start: Date.now() - data.currentTime,
          end: Date.now() + (data.tackDuration - data.currentTime)
        }      
      discord_client.request('SET_ACTIVITY', activity)
    }
  })

  httpApp.get('/spotify/callback', (req, res) => {
    const code = req.query.code || null
    const state = req.query.state || null
    const storedState = req.cookies ? req.cookies[APP_SPOTIFY.stateKey] : null

    if (state === null || (state !== storedState) & false) {
      res.redirect('/?error=state_mismatch')
    } else {
      res.clearCookie(APP_SPOTIFY.stateKey)
      let authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: APP_SPOTIFY.redirect_uri,
          grant_type: 'authorization_code'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            new Buffer.from(APP_SPOTIFY.client_id + ':' + APP_SPOTIFY.client_secret).toString(
              'base64'
            )
        },
        json: true
      }

      axios.post(authOptions.url, authOptions.form, { headers: authOptions.headers }).then((resp) => {
        if (resp.status == 200) {
          APP_SPOTIFY.access_token = resp.data.access_token
          APP_SPOTIFY.refresh_token = resp.data.refresh_token
          APP_SPOTIFY.expires_at = Date.now() + resp.data.expires_in * 1000
        
          let data = store.get('data')
          data.profiles.spotify.parameters.access_token = APP_SPOTIFY.access_token
          data.profiles.spotify.parameters.refresh_token = APP_SPOTIFY.refresh_token
          data.profiles.spotify.parameters.expires_at = APP_SPOTIFY.expires_at

          store.set('data', data)          
          res.send('Success!')
          askSpotify()
        } else {
          res.send('Unexpected error')
          console.log('Error requesting spotify access token')
        }
      }).catch((err) => { console.log(err) })
    }
  })

  httpApp.listen(PORT + 2, () => {
    console.log(`HTTP server is running on http://127.0.0.1:${PORT + 2}`)
  })

  let currentTabSocket = ''
  wss.on('connection', (ws) => {
    ws.id = generateRandomString(8)
    console.log(`Socket connected, id: ${ws.id}`)
    console.log(`Total sockets: ${wss.clients.size}`);
    console.log(`Current priority on connection: ${servicePriority}`);

    ws.on('message', function incoming(e) {
      let data = JSON.parse(e)
      let config = store.get('data')

      if (!ws.id) return
      if (data.service == 'youtube' && config.profiles.youtube.priority <= servicePriority) {
        servicePriority = config.profiles.youtube.priority
        if (wss.clients.size < 2 || ws.id == currentTabSocket) {
          console.log(`Sending data to Discord from ${ws.id} while ${wss.clients.size} sockets`)
          currentTabSocket = ws.id

          if (data.v != 'idle') {
            let activity = {
              pid: process.pid,
              activity: {
                type: 3,
                details: `Watching YouTube ${data.live == 'live' ? 'stream' : 'video'}`,
                state: config.profiles.youtube.parameters.title
                  ? data.videoTitle.length > 128 || data.videoTitle.length == 0
                    ? data.videoTitle.substring(0, 125) + '...'
                    : data.videoTitle
                  : undefined,
                assets: {
                  large_image: 'youtube-icon',
                  large_text: config.profiles.youtube.parameters.title
                    ? data.videoTitle.length > 128 || data.videoTitle.length == 0
                      ? data.videoTitle.substring(0, 125) + '...'
                      : data.videoTitle
                    : undefined,
                  small_image:
                    config.profiles.youtube.parameters.author && data.thumbnail
                      ? data.thumbnail
                      : 'user',
                  small_text: config.profiles.youtube.parameters.author ? data.channel : undefined
                },
                buttons: [{ label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord' }]
              }
            }
            if (config.profiles.youtube.parameters.link)
              activity.activity.buttons.unshift({ label: 'Open YouTube video', url: data.v })
            if (data.live != 'live' && config.profiles.youtube.parameters.duration)
              activity.activity.timestamps = {
                start: Date.now() - data.currentTime * 1000,
                end: Date.now() + (data.videoDuration * 1000 - data.currentTime * 1000)
              }
            discord_client.request('SET_ACTIVITY', activity)
          } else {
            discord_client.request('SET_ACTIVITY', {
              pid: process.pid,
              activity: {
                type: 3,
                details: `Exploring YouTube (IDLE)`,
                state: 'Trying to find something suitable',
                assets: {
                  large_image: 'youtube-icon',
                  large_text: 'Created by hikaru_kl',
                  small_image: 'user',
                  small_text: 'YouCord'
                },
                buttons: [
                  { label: 'Open YouTube', url: 'https://www.youtube.com/' },
                  { label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord' }
                ]
              }
            })
          }
        } else {          
          console.log(`Send new socket to queue: ${wss.clients.size}`)
          ws.send('queue')
        }
      } else if (data.service == 'yamusic' && config.profiles.yamusic.priority <= servicePriority) {
        servicePriority = config.profiles.yamusic.priority
        let activity = {
          pid: process.pid,
          activity: {
            type: 3,
            details: config.profiles.yamusic.parameters.title ? data.trackTitle : 'youcord',
            state: config.profiles.yamusic.parameters.author ? data.artist : undefined,
            assets: {
              large_image: config.profiles.yamusic.parameters.image ? data.thumbnail : 'youcord-logo',
              large_text: 'YouCord created by hikaru_kl',
              small_image: 'yamusic-icon',
              small_text: 'Yandex Music'
            },
            buttons: [{ label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord' }]
          }
        }
        if (config.profiles.yamusic.parameters.duration)
          activity.activity.timestamps = {
            start: Date.now() - ytFormatToTimestamp(data.currentTime),
            end:
              Date.now() +
              (ytFormatToTimestamp(data.tackDuration) - ytFormatToTimestamp(data.currentTime))
          }
        discord_client.request('SET_ACTIVITY', activity)
      } else {        
        if (data.service == 'youtube') {
          console.log(`Send new socket to queue: ${wss.clients.size}`)
          ws.send('queue')
        }
      }
    })

    ws.on('close', () => {
      if (wss.clients.size > 0) {
        if (!ws.id) return

        const [ws] = wss.clients
        console.log(`Total sockets: ${wss.clients.size}`)
        console.log(`Start accepting next socket's requests: ${ws.id}`)
        currentTabSocket = ws.id
        ws.send('start')
      }
    })
  })

  const repeatTimeout = (callback, delay) => {
    setTimeout(() => {
      callback()
      repeatTimeout(callback, delay)
    }, delay)
  }

  const askSpotify = () => {
    if (APP_SPOTIFY.access_token && APP_SPOTIFY.refresh_token) {
      if (APP_SPOTIFY.expires_at <= Date.now()) {
        refreshSpotifyToken(APP_SPOTIFY.refresh_token)
      }
      console.log('Start requesting spotify');
      
      // Refreshes spotify token every delay
      repeatTimeout(
        () => {
          refreshSpotifyToken(APP_SPOTIFY.refresh_token)
        },
        APP_SPOTIFY.expires_at - Date.now() - 5 * 60 * 1000
      )

      let currentTrack = {
        lyrics: true,
        id: generateRandomString(16)
      }
      setInterval(() => {  
        console.log(`Current priority on askSpotify: ${servicePriority}`);
            
        let config = store.get('data')
        if (config.profiles.spotify.priority <= servicePriority) {
          servicePriority = config.profiles.spotify.priority
        } else return
        let options = {
          url: 'https://api.spotify.com/v1/me/player/currently-playing',
          headers: { Authorization: 'Bearer ' + APP_SPOTIFY.access_token },
        }

        axios.get(options.url, { headers: options.headers }).then(async (res) => {
          if (res.status == 200 && res.data) {
            if (res.data.item.id !== currentTrack.id) {
              let artists = ''
              res.data.item.artists.forEach((el, i) => {
                res.data.item.artists.length - 1 == i ? (artists += el.name) : (artists += el.name + ', ')
              })
              currentTrack = {
                id: res.data.item.id,
                name: res.data.item.name,
                image: res.data.item.album.images[0].url,
                albumName: res.data.item.album.name,
                artists: artists,
                link: res.data.item.external_urls.spotify,
                lyrics: false
              }
            }
            let activity = {
              pid: process.pid,
              activity: {
                type: 3,
                details: config.profiles.spotify.parameters.title
                  ? config.profiles.spotify.parameters.author &&
                    config.profiles.spotify.parameters.lyrics
                    ? currentTrack.name + ' (' + currentTrack.artists + ')'
                    : currentTrack.name
                  : 'YouCord',
                state:
                  config.profiles.spotify.parameters.author &&
                  !config.profiles.spotify.parameters.lyrics
                    ? currentTrack.artists
                    : undefined,
                assets: {
                  large_image: config.profiles.spotify.parameters.image
                    ? currentTrack.image
                    : 'youcord-logo',
                  large_text: currentTrack.albumName || 'YouCord'
                },
                buttons: [{ label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord' }]
              }
            }
            if (config.profiles.spotify.parameters.link)
              activity.activity.buttons.push({ label: 'Open in Spotify', url: currentTrack.link })
            if (config.profiles.spotify.parameters.lyrics && !currentTrack.lyrics) {
              currentTrack.lyrics = true
              // https://open.spotify.com/get_access_token
              
              let options = {
                url: `https://spclient.wg.spotify.com/color-lyrics/v2/track/${res.data.item.id}?format=json&vocalRemoval=false&market=from_token`,
                options: {
                  headers: {
                    'Authorization': 'Bearer ',
                    'App-Platform': 'WebPlayer'
                  }
                }
              }
              
              axios.get(options.url, options.options).then((resp) => {
                let data = resp.data
                if (data.lyrics.syncType == 'LINE_SYNCED') {
                  currentTrack.lyricsLines = data.lyrics.lines
                  currentTrack.lyricsUnexists = false
                } else currentTrack.lyricsUnexists = true;
              }).catch(() => console.log('lyrics error'))          
            }
            if (config.profiles.spotify.parameters.duration)
              activity.activity.timestamps = {
                start: Date.now() - res.data.progress_ms,
                end: Date.now() + (res.data.item.duration_ms - res.data.progress_ms)
              }
            if (
              config.profiles.spotify.parameters.author &&
              !currentTrack.lyricsUnexists &&
              currentTrack.lyricsLines
            ) {
              let flag = false
              let items = ['♪ ♩♪', '♫ ♫♪', '♫ ♪♪', '♪♪♪', '♩♬♫', '♫ ♬ ♬']
              for (let i = 0; i < currentTrack.lyricsLines.length - 1; i++) {
                if (
                  parseInt(currentTrack.lyricsLines[i].startTimeMs) <= res.data.progress_ms &&
                  parseInt(currentTrack.lyricsLines[i + 1].startTimeMs) > res.data.progress_ms
                ) {
                  activity.activity.state = currentTrack.lyricsLines[i].words
                  if (currentTrack.lyricsLines[i].words.length < 2) activity.activity.state += '~♪♪'
                  else
                    activity.activity.state += ' ' + items[Math.floor(Math.random() * items.length)]
                  flag = true
                  break
                }
              }
              if (!flag) {
                activity.activity.state = items[Math.floor(Math.random() * items.length)]
              }
            }
            discord_client.request('SET_ACTIVITY', activity)
          }
        }).catch((err) => console.log(err))
      }, 3500)
    }
  }
  // NOTE: Needs to be tested 
  if (spotifyStatus)
    askSpotify()
});
const refreshSpotifyToken = (refresh_token) => {
  console.log('Trying to refresh spotify token..');
  
  let options = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
      client_id: APP_SPOTIFY.client_id
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        new Buffer.from(APP_SPOTIFY.client_id + ':' + APP_SPOTIFY.client_secret).toString('base64')
    },
  }
  let status = false
  
  axios.post(options.url, options.form, options).then((res) => {    
    if (res.status === 200) {
      APP_SPOTIFY.access_token = res.data.access_token
      APP_SPOTIFY.expires_at = Date.now() + res.data.expires_in * 1000      
      console.log('Successfully got new token');
      
      let data = store.get('data')
      data.profiles.spotify.parameters.access_token = APP_SPOTIFY.access_token
      data.profiles.spotify.parameters.expires_at = APP_SPOTIFY.expires_at
      store.set('data', data)
      status = true
    } else {       
      console.log(res.data)
    }
  }).catch((err) => console.error(err))
  
  return status
}