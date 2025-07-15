import { app, shell, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { store } from './config/store.js'
import { PORT } from './config/config.js'
import { APP_SPOTIFY, refreshSpotifyToken, askSpotify } from './activity/spotify.js'
import appIcon from '../../resources/youcord-logo.ico?asset'

const isDev = !app.isPackaged

const AutoLaunch = require('auto-launch')

APP_SPOTIFY.auth_url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${APP_SPOTIFY.client_id}&scope=${APP_SPOTIFY.scopes}&redirect_uri=${APP_SPOTIFY.redirect_uri}&state=${APP_SPOTIFY.state}`

let spotifyStatus = false

let mainWindow
const isAutoStart = process.argv.includes('--hidden')

async function createWindow() {
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
    (APP_SPOTIFY.expires_at > Date.now() || await refreshSpotifyToken(APP_SPOTIFY.refresh_token, sendSpotifyAuthStatus))
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
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.webContents.send('setParams', store.get('data').profiles)
    mainWindow.webContents.send('setSettings', {
      settings: store.get('settings'),
      services: store.get('data').profiles
    })
    mainWindow.webContents.send('spotifyAuthURL', { auth_url: APP_SPOTIFY.auth_url })
    mainWindow.webContents.send('spotifyStatus', { authorized: spotifyStatus })

    if (!(isAutoStart && store.get('settings').launchInTray)) {
      mainWindow.show()
    }
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
      isHidden: true,
      args: ['--hidden']
    })
    let settings = store.get('settings')
    youcordAutoLaunch
      .isEnabled()
      .then((enabled) => {
        if (!enabled && settings.autoLaunch) youcordAutoLaunch.enable().catch(console.error)
        else if (enabled && !settings.autoLaunch) youcordAutoLaunch.disable().catch(console.error)
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
          if (!enabled && settings.autoLaunch) youcordAutoLaunch.enable().catch(console.error)
          else if (enabled && !settings.autoLaunch) youcordAutoLaunch.disable().catch(console.error)
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
    initYamusic(PORT + 1, data.profiles.yamusic.parameters.app_path, isDev)
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

import { connectToDiscord } from './utils/utils.js'
import { initYamusic } from './activity/yamusic.js'
import { initHTTPserver } from './httpServer.js'
import { initWebSocketServer } from './websockerServer.js'

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

connectToDiscord().then(async (discord_client) => {
  if (discord_client == false) {
    dialog.showErrorBox(
      'Не удается подключиться к Discord',
      'Вероятно Discord не запущен, перезапустите YouCord после запуска Discord'
    )
    app.quit()
  }
  
  if (spotifyStatus) await askSpotify(discord_client, sendSpotifyAuthStatus)
  initHTTPserver(PORT+2, discord_client, APP_SPOTIFY, sendSpotifyAuthStatus, askSpotify)
  initWebSocketServer(PORT, discord_client)
})
