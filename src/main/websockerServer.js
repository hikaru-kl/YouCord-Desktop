import { generateRandomString } from './utils/utils'
import { store } from './config/store'

import { handleYouTubeActivity } from './activity/youtube'
import { handleYamusicActivity } from './activity/yamusic'

const WebSocket = require('ws')
let currentTabSocket = ''

const handlers = {
  youtube: handleYouTubeActivity,
  yamusic: handleYamusicActivity
}

export function initWebSocketServer(PORT, discord_client) {
  const wss = new WebSocket.Server({ port: PORT })
  wss.on('connection', (ws) => {
    ws.id = generateRandomString(8)
    console.log(`Socket connected, id: ${ws.id}`)
    console.log(`Total sockets: ${wss.clients.size}`)

    ws.on('message', async (e) => {
      let data
      try {
        data = JSON.parse(e)
      } catch (exception) {
        console.log(`Error parsing message from socket ${ws.id}:`, exception)
        return
      }

      if (!data || !ws.id) return
      const config = store.get('data')

      const handler = handlers[data.service]

      if (data.service === 'youtube') {
        if (wss.clients.size < 2 || ws.id === currentTabSocket) {
          await Promise.resolve(handleYouTubeActivity(data, discord_client, config))
        } else {
          ws.send('queue')
        }
      } else if (handler) {
        try {
          await Promise.resolve(handler(data, discord_client, config))
        } catch (err) {
          console.error(`Error in handler for service ${data.service}:`, err)
          ws.send('handler_error')
        }
      } else {
        ws.send('unknown_service')
      }
    })

    ws.on('close', () => {
      console.log(`Socket with id: ${ws.id} closed`)
      if (wss.clients.size > 0) {
        if (!ws.id) return

        const nextSocket = Array.from(wss.clients).find((client) => client.id && client !== ws)
        if (nextSocket) {
          console.log(`Start accepting next socket's requests: ${nextSocket.id}`)
          currentTabSocket = nextSocket.id
          nextSocket.send('start')
        }
      }
    })
  })
}
