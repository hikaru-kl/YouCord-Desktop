import { store } from './config/store'
import { handleYamusicCallback } from './activity/yamusic' 
const axios = require('axios')

const cookieParser = require('cookie-parser')
const express = require('express')
const httpApp = express()

httpApp.use(express.json()).use(cookieParser())

/**
 * Инициирует HTTP сервер для работы с Spotify OAuth и получения информации от Яндекс Музыки.
 * @param {number} port - Порт, на котором будет запущен HTTP сервер.
 * @param {import('discord-rpc').Client} discord_client
 * @param {Object} APP_SPOTIFY - Конфигурация приложения Spotify
 * @param {Function} frontend_callback - Функция обратного вызова для обновления внутри приложения
 * @param {Function} askSpotify - Функция для запроса обновления токена
 */
export function initHTTPserver(port, discord_client, APP_SPOTIFY, frontend_callback, askSpotify) {
  httpApp.post('/yamusic', async (req, res) => await handleYamusicCallback(req, res, discord_client))
  httpApp.get(
    '/spotify/callback',
    createSpotifyCallbackHandler(APP_SPOTIFY, frontend_callback, askSpotify, discord_client)
  )
  httpApp.listen(port, () => {
    console.log(`HTTP server is running on http://127.0.0.1:${port}`)
  })
}

function createSpotifyCallbackHandler(APP_SPOTIFY, frontend_callback, askSpotify, discord_client) {
  return function handleSpotifyCallback(req, res) {
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
            Buffer.from(APP_SPOTIFY.client_id + ':' + APP_SPOTIFY.client_secret).toString('base64')
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
            frontend_callback(true)
            askSpotify(discord_client, frontend_callback)
          } else {
            res.send('Unexpected error')
            console.log('Error requesting spotify access token')
          }
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }
}
