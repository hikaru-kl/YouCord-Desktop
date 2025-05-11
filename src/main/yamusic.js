const WebSocket = require('ws')
const exec = require('child_process').execFile
const axios = require('axios')
const fs = require('node:fs')

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

export const initYamusic = (port, path) => {
  const DEBUGGER_URL = `http://localhost:${port}`
  function sleep(time, callback) {
    var stop = new Date().getTime()
    while (new Date().getTime() < stop + time) {
      true
    }
    callback()
  }
  const app = new yamusic(port, path)
  const script = fs.readFileSync('./resources/yaMusicScript.js', 'utf8')
  console.log('User script has loaded')
  app.startup().then(() => {
    sleep(6000, () => {
      axios.get(DEBUGGER_URL + '/json/list', { timeout: 2000 }).then((response) => {
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
      }).catch((e) => console.error(e.errors))
    })
  })
}
