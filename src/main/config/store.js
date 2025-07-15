const electron = require('electron')
const path = require('path')
const fs = require('fs')

class Store {
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData')
    this.path = path.join(userDataPath, opts.configName + '.json')
    this.data = parseDataFile(this.path, opts.defaults)
  }

  get(key) {
    return this.data[key]
  }

  set(key, val) {
    this.data[key] = val
    fs.writeFileSync(this.path, JSON.stringify(this.data))
  }
}

function parseDataFile(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath))
  } catch (error) {
    return defaults
  }
}

const defaultConfig = {
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
            lyrics: true,
            app_path: ''
          },
          priority: 3
        }
      }
    },
    settings: {
      windowBounds: { width: 1050, height: 730 },
      autoLaunch: false,
      launchInTray: false,
      exitTray: false,
      theme: 'dark',
      language: 'en'
    },
    app: {
      yamusicPatched: false
    }
  }
}

export const store = new Store(defaultConfig)
