import { app, shell, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { Store } from './store.js'
import appIcon from '../../resources/youcord-logo.ico?asset';

const isDev = !app.isPackaged

const AutoLaunch = require('auto-launch')

const crypto = require('crypto')
const generateRandomString = (length) => {
  return crypto.randomBytes(60).toString('hex').slice(0, length)
}

const PORT = 25740

// BUG: When application is bilded, it doesn't show window.

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
  client_secret: 'aa33cde8cba746b39cb5441c71c4d7a0',
  redirect_uri: `http://localhost:${PORT + 2}/spotify/callback`,
  scopes: 'user-read-currently-playing',
  stateKey: 'spotify_auth_state',
  state: generateRandomString(16),
  access_token: store.get('data').profiles.spotify.parameters.access_token,
  refresh_token: store.get('data').profiles.spotify.parameters.refresh_token,
  expires_at: store.get('data').profiles.spotify.parameters.expires_at
}

APP_SPOTIFY.auth_url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${APP_SPOTIFY.client_id}&scope=${APP_SPOTIFY.scopes}&redirect_uri=${APP_SPOTIFY.redirect_uri}&state=${APP_SPOTIFY.state}`

let spotifyStatus = false

let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: store.get('settings').windowBounds.width,
    height: store.get('settings').windowBounds.height,
    show: false,
    title: 'YouCord',
    icon: isDev
      ? join(__dirname, '../../resources/youcord-logo.ico')
      : join(process.resourcesPath, 'resources/youcord-logo.ico'),
    minWidth: 1050,
    minHeight: 630,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDesc) => {
    console.error('❌ Ошибка загрузки интерфейса:', errorDesc, errorCode)
  })
  // Checking User's spotify account and trying to update token if can
  spotifyStatus =
    APP_SPOTIFY.access_token.length != 0 &&
    APP_SPOTIFY.refresh_token.length != 0 &&
    (APP_SPOTIFY.expires_at > Date.now() || refreshSpotifyToken(APP_SPOTIFY.refresh_token))
  console.log(`Spotify token status: ${spotifyStatus}`)
  mainWindow.webContents.send('spotifyStatus', { authorized: spotifyStatus })

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
    mainWindow.loadFile(join(__dirname, '..', 'renderer', 'index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.whenReady().then(() => {
  let youcordAutoLaunch

  if (!isDev) {
    youcordAutoLaunch = new AutoLaunch({
      name: 'YouCord Pre-Beta1.0',
      path: app.getPath('exe'),
      isHidden: true
    })
    let settings = store.get('settings')
    youcordAutoLaunch
      .isEnabled()
      .then((enabled) => {
        if (!enabled && settings.autoLaunch) {
          youcordAutoLaunch.enable().catch(console.error)
        } else if (enabled && !settings.autoLaunch) {
          youcordAutoLaunch.disable().catch(console.error)
        }
      })
      .catch(console.error)
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.youcord')
  // Setting up context meny and tool bar
  const tray = new Tray(nativeImage.createFromPath(appIcon))
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

    if (youcordAutoLaunch) {
      youcordAutoLaunch
        .isEnabled()
        .then((enabled) => {
          if (!enabled && settings.autoLaunch) {
            youcordAutoLaunch.enable().catch(console.error)
          } else if (enabled && !settings.autoLaunch) {
            youcordAutoLaunch.disable().catch(console.error)
          }
        })
        .catch(console.error)
    }

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
  ipcMain.on('getSpotifyStatus', (e) => {
    e.reply('spotifyStatus', { authorized: spotifyStatus })
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

import { connectToDiscord } from './discordUtils.js'

import { getLyricsBySpotifyId } from './utils.js'
import { initYamusic } from './yamusic.js'
const express = require('express')
const cookieParser = require('cookie-parser')
const axios = require('axios')

let activeActivities = {
  youtube: null,
  spotify: null,
  yamusic: null
}
const serviceTimeouts = {};

const updateDiscordActivity = (discord_client) => {
  const config = store.get('data')
  const services = ['youtube', 'spotify', 'yamusic']

  let bestService = null
  let bestPriority = Infinity

  for (let service of services) {
    const activity = activeActivities[service]
    const priority = config.profiles[service]?.priority ?? Infinity
    if (activity && priority < bestPriority) {
      bestService = service
      bestPriority = priority
    }
  }

  if (bestService && activeActivities[bestService]) {
    discord_client.request('SET_ACTIVITY', activeActivities[bestService])
    console.log(`Set activity from ${bestService} with priority ${bestPriority}`)
  } else {
    console.log('No active service to display');
    
    discord_client.request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {}
    });
  }
}

function setServiceActivity(serviceName, activityData, discord_client, timeout = 9000) {
  if (serviceTimeouts[serviceName]) clearTimeout(serviceTimeouts[serviceName]);

  activeActivities[serviceName] = activityData;

  serviceTimeouts[serviceName] = setTimeout(() => {
    activeActivities[serviceName] = null;
    updateDiscordActivity(discord_client);
  }, timeout);

  updateDiscordActivity(discord_client);
}

const sendSpotifyAuthStatus = (status) => {
  if (mainWindow) {
    if (mainWindow.webContents.isLoading()) {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('spotifyStatus', { authorized: status })
      })
    } else {
      mainWindow.webContents.send('spotifyStatus', { authorized: status })
    }
  }
}

connectToDiscord().then((discord_client) => {
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
    const config = store.get('data');
    const data = req.body;

    const isPaused = data.paused === true;

    activeActivities.yamusic = {
      pid: process.pid,
      activity: {
        type: 3,
        details: config.profiles.yamusic.parameters.title
          ? data.trackTitle
          : 'Listening YandexMusic',
        state: config.profiles.yamusic.parameters.author ? data.artist : undefined,
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
    };

    if (!isPaused && config.profiles.yamusic.parameters.duration) {
      activeActivities.yamusic.activity.timestamps = {
        start: Date.now() - data.currentTime * 1000,
        end: Date.now() + (data.trackDuration * 1000 - data.currentTime * 1000)
      };
    }
    setServiceActivity('yamusic', activeActivities.yamusic, discord_client);
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

      axios
        .post(authOptions.url, authOptions.form, { headers: authOptions.headers })
        .then((resp) => {
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
            sendSpotifyAuthStatus(true)
            askSpotify()
          } else {
            res.send('Unexpected error')
            console.log('Error requesting spotify access token')
          }
        })
        .catch((err) => {
          console.log(err)
        })
    }
  })

  httpApp.listen(PORT + 2, () => {
    console.log(`HTTP server is running on http://127.0.0.1:${PORT + 2}`)
  })

  let currentTabSocket = ''
  wss.on('connection', (ws) => {
    ws.id = generateRandomString(8)
    console.log(`Socket connected, id: ${ws.id}`)
    console.log(`Total sockets: ${wss.clients.size}`)

    ws.on('message', (e) => {
      let data
      try {
        data = JSON.parse(e)
      } catch (exception) {
        console.log('Error parsing JSON')
        console.log(exception)
        console.log(e)
      }
      if (!data) return
      let config = store.get('data')

      if (!ws.id) return
      if (data.service == 'youtube') {
        if (wss.clients.size < 2 || ws.id == currentTabSocket) {
          console.log(`Sending data to Discord from ${ws.id} while ${wss.clients.size} sockets`)
          currentTabSocket = ws.id

          if (data.v != 'idle') {
            activeActivities.youtube = {
              pid: process.pid,
              activity: {
                type: 3,
                details: data.paused
                  ? `Paused YouTube ${data.live == 'live' ? 'stream' : 'video'}`
                  : `Watching YouTube ${data.live == 'live' ? 'stream' : 'video'}`,
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
                buttons: [{ label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord-Desktop' }]
              }
            }

            if (config.profiles.youtube.parameters.link) {
              activeActivities.youtube.activity.buttons.unshift({
                label: 'Open YouTube video',
                url: data.v
              })
            }

            if (
              !data.paused &&
              data.live != 'live' &&
              config.profiles.youtube.parameters.duration
            ) {
              activeActivities.youtube.activity.timestamps = {
                start: Date.now() - data.currentTime * 1000,
                end: Date.now() + (data.videoDuration * 1000 - data.currentTime * 1000)
              }
            }
          } else {
            activeActivities.youtube = {
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
                  { label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord-Desktop' }
                ]
              }
            }
          }
          setServiceActivity('youtube', activeActivities.youtube, discord_client);
        } else {
          console.log(`Send new socket to queue: ${wss.clients.size}`)
          ws.send('queue')
        }
      } else if (data.service == 'yamusic') {
         const isPaused = data.paused === true;
        activeActivities.yamusic = {
          pid: process.pid,
          activity: {
            type: 3,
            details: config.profiles.yamusic.parameters.title
              ? (data.trackTitle.length > 128 || data.trackTitle.length == 0)
                ? data.trackTitle.substring(0, 125) + '...'
                : data.trackTitle
              : 'Listening YandexMusic',
            state: config.profiles.yamusic.parameters.author ? data.artist : undefined,
            assets: {
              large_image: config.profiles.yamusic.parameters.image
                ? data.thumbnail
                : 'youcord-logo',
              large_text: 'YouCord created by hikaru_kl',
              small_image: 'yamusic-icon',
              small_text: isPaused ? 'Yandex Music (Paused)' : 'Yandex Music'
            },
            buttons: [
              { label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord-Desktop' }
            ]
          }
        };

        if (!isPaused && config.profiles.yamusic.parameters.duration) {
          activeActivities.yamusic.activity.timestamps = {
            start: Date.now() - data.currentTime * 1000,
            end: Date.now() + (data.trackDuration * 1000 - data.currentTime * 1000)
          };
        }

        setServiceActivity('yamusic', activeActivities.yamusic, discord_client);
      } else {
        if (data.service == 'youtube') {

          console.log(`Send new socket to queue: ${wss.clients.size}`)
          ws.send('queue')
        }
      }
    })

    ws.on('close', () => {
      console.log(`Socket with id: ${ws.id} closed`)
      if (wss.clients.size > 0) {
        if (!ws.id) return

        const nextSocket = Array.from(wss.clients).find((client) => client.id && client !== ws)
        if (nextSocket) {
          console.log(`Total sockets: ${wss.clients.size}`)
          console.log(`Start accepting next socket's requests: ${nextSocket.id}`)
          currentTabSocket = nextSocket.id
          nextSocket.send('start')
        }
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
        let config = store.get('data')
        let options = {
          url: 'https://api.spotify.com/v1/me/player/currently-playing',
          headers: { Authorization: 'Bearer ' + APP_SPOTIFY.access_token }
        }

        axios
          .get(options.url, { headers: options.headers })
          .then(async (res) => {
            if (res.status == 200 && res.data) {
              if (res.data.item.id !== currentTrack.id) {
                let artists = ''
                res.data.item.artists.forEach((el, i) => {
                  res.data.item.artists.length - 1 == i
                    ? (artists += el.name)
                    : (artists += el.name + ', ')
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
              let expandedTitle = currentTrack.name + ' (' + currentTrack.artists + ')'
              if (expandedTitle.length > 128) {
                expandedTitle = expandedTitle.substring(0, 125) + '...'
              }

              activeActivities.spotify = {
                pid: process.pid,
                activity: {
                  type: 3,
                  details: config.profiles.spotify.parameters.title
                    ? (config.profiles.spotify.parameters.author &&
                      config.profiles.spotify.parameters.lyrics)
                      ? expandedTitle
                      : currentTrack.name
                    : 'Listening Spotify',
                  state:
                    (config.profiles.spotify.parameters.author &&
                    !config.profiles.spotify.parameters.lyrics)
                      ? currentTrack.artists
                      : undefined,
                  assets: {
                    small_image: 'spotify-icon',
                    small_text: res.data.is_playing ? 'Spotify' : 'Spotify (Paused)',
                    large_image: config.profiles.spotify.parameters.image
                      ? currentTrack.image
                      : 'youcord-logo',
                    large_text: currentTrack.albumName || 'YouCord'
                  },
                  buttons: [
                    { label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord-Desktop' }
                  ]
                }
              }
              if (config.profiles.spotify.parameters.link)
                activeActivities.spotify.activity.buttons.push({
                  label: 'Open in Spotify',
                  url: currentTrack.link
                })
              if (config.profiles.spotify.parameters.lyrics && !currentTrack.lyrics) {
                currentTrack.lyrics = true

                const lyrics = await getLyricsBySpotifyId(currentTrack.id)
                console.log('Lyrics:\n', lyrics || 'Not found')
                if (lyrics && lyrics.length > 0) {
                  currentTrack.lyricsLines = lyrics
                  currentTrack.lyricsUnexists = false
                } else {
                  currentTrack.lyricsUnexists = true
                }
              }
              if (config.profiles.spotify.parameters.duration && res.data.is_playing) {
                activeActivities.spotify.activity.timestamps = {
                  start: Date.now() - res.data.progress_ms,
                  end: Date.now() + (res.data.item.duration_ms - res.data.progress_ms)
                }
              }
              if (
                !currentTrack.lyricsUnexists &&
                currentTrack.lyricsLines &&
                config.profiles.spotify.parameters.lyrics
              ) {
                let flag = false
                const items = ['♪ ♩♪', '♫ ♫♪', '♫ ♪♪', '♪♪♪', '♩♬♫', '♫ ♬ ♬']
                const progress = res.data.progress_ms

                for (let i = 0; i < currentTrack.lyricsLines.length - 1; i++) {
                  const curr = currentTrack.lyricsLines[i]
                  const next = currentTrack.lyricsLines[i + 1]

                  const currTime =
                    typeof curr.startTimeMs !== 'undefined'
                      ? parseInt(curr.startTimeMs)
                      : Math.round((curr.time?.total || 0) * 1000)
                  const nextTime =
                    typeof next.startTimeMs !== 'undefined'
                      ? parseInt(next.startTimeMs)
                      : Math.round((next.time?.total || 0) * 1000)

                  if (currTime <= progress && nextTime > progress) {
                    const text = curr.words || curr.text || '';
                    activeActivities.spotify.activity.state =
                      text.length < 2
                        ? text + '~♪♪'
                        : text + ' ' + items[Math.floor(Math.random() * items.length)];
                    flag = true;
                    break;
                  }
                }

                if (!flag) {
                  activeActivities.spotify.activity.state =
                    items[Math.floor(Math.random() * items.length)]
                }
              } else if (
                config.profiles.spotify.parameters.author &&
                config.profiles.spotify.parameters.title &&
                !currentTrack.lyricsLines
              ) {
                activeActivities.spotify.activity.details = currentTrack.name;
                activeActivities.spotify.activity.state = currentTrack.artists;
              } else if (
                config.profiles.spotify.parameters.author &&
                !config.profiles.spotify.parameters.title &&
                !currentTrack.lyricsLines
              ) {
                activeActivities.spotify.activity.state = currentTrack.artists;
              }
              if (activeActivities.spotify.activity.state?.length > 128)
                activeActivities.spotify.activity.state =
                  activeActivities.spotify.activity.state.substring(0, 125) + '...'

              setServiceActivity('spotify', activeActivities.spotify, discord_client);
            }
          })
          .catch((err) => console.log(err))
      }, 3500)
    }
  }
  // NOTE: Needs to be tested
  if (spotifyStatus) askSpotify()
})
const refreshSpotifyToken = (refresh_token) => {
  console.log('Trying to refresh spotify token..')

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
    }
  }
  let status = false

  axios
    .post(options.url, options.form, options)
    .then((res) => {
      if (res.status === 200) {
        APP_SPOTIFY.access_token = res.data.access_token
        APP_SPOTIFY.expires_at = Date.now() + res.data.expires_in * 1000
        let data = store.get('data')
        data.profiles.spotify.parameters.access_token = APP_SPOTIFY.access_token
        data.profiles.spotify.parameters.expires_at = APP_SPOTIFY.expires_at
        store.set('data', data)
        status = true
        sendSpotifyAuthStatus(status)
      } else {
        console.log(res.data)
      }
    })
    .catch((err) => console.error(err))

  return status
}
