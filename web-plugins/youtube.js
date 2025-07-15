// ==UserScript==
// @name         Discord`s YouTube activity
// @namespace    http://tampermonkey.net/
// @version      v1.2.0
// @description  Script that sends current YouTube video data to your Discord presence app
// @author       hikaru_kl
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @run-at       document-end
// @connect      127.0.0.1
// @updateURL    https://raw.githubusercontent.com/hikaru-kl/YouCord/main/YouCord_client.js
// @downloadURL  https://raw.githubusercontent.com/hikaru-kl/YouCord/main/YouCord_client.js
// @noframes
// @grant        GM_xmlhttpRequest
// @grant        window.onurlchange
// ==/UserScript==

;(function () {
  'use strict'

  const DEBUG = true
  let data
  let intervalRef = null
  let socket

  const connectWebSocket = () => {
    socket = new WebSocket('ws://127.0.0.1:25740/')

    socket.addEventListener('open', () => {
      DEBUG && console.log('WebSocket connection established.')
      youtubeDataSender()
    })

    socket.addEventListener('message', (event) => {
      DEBUG && console.log('Message from server:', event.data)
      if (event.data === 'queue') {
        DEBUG && console.log('Clearing interval due to queue event.')
        clearInterval(intervalRef)
      }
      if (event.data === 'start') {
        DEBUG && console.log('Starting interval on server request.')
        youtubeDataSender()
      }
    })

    socket.addEventListener('close', () => {
      console.warn('WebSocket closed. Reconnecting in 5 seconds...')
      setTimeout(() => connectWebSocket(), 5000)
    })

    socket.addEventListener('error', (err) => {
      console.error('WebSocket error:', err)
    })
  }

  const waitForElm = (selector) => {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) return resolve(document.querySelector(selector))
      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector)
        if (el) {
          observer.disconnect()
          resolve(el)
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
    })
  }

  const youtubeDataSender = () => {
    waitForElm('#movie_player').then((player) => {
      DEBUG && console.log('YouTube player is ready')

      if (socket.readyState !== WebSocket.OPEN) {
        DEBUG && console.warn('WebSocket not ready yet.')
        return
      }

      if (intervalRef) clearInterval(intervalRef)

      intervalRef = setInterval(() => {
        try {
          if (window.location.host === 'www.youtube.com') {
            if (window.location.pathname === '/watch') {
              const vdata = player.getVideoData()
              const stats = player.getVideoStats?.() || {}
              const thumbnailElement = document.querySelector(
                'yt-img-shadow.ytd-video-owner-renderer img'
              )
              const isPaused = document.querySelector(
                '#movie_player > div.html5-video-container > video'
              ).paused

              data = {
                service: 'youtube',
                v: window.location.href,
                live: stats.live || false,
                paused: isPaused,
                currentTime: player.getCurrentTime(),
                videoDuration: player.getDuration(),
                videoTitle: vdata?.title || '',
                channel: vdata?.author || '',
                thumbnail: thumbnailElement ? thumbnailElement.src : ''
              }
            } else {
              data = {
                service: 'youtube',
                v: 'idle'
              }
            }

            DEBUG && console.log('Sending data:', data)
            socket.send(JSON.stringify(data))
          }
        } catch (err) {
          console.error('Unexpected error while collecting data:', err)
          data = { service: 'youtube', v: 'error' }
          socket.send(JSON.stringify(data))
        }
      }, 2000)
    })
  }

  const observeUrlChange = () => {
    let oldHref = document.location.href
    const body = document.querySelector('body')
    const observer = new MutationObserver(() => {
      if (oldHref !== document.location.href) {
        oldHref = document.location.href
        DEBUG && console.log('URL changed:', oldHref)
        clearInterval(intervalRef)
        youtubeDataSender()
      }
    })
    observer.observe(body, { childList: true, subtree: true })
  }

  // Start observing URL changes
  window.onload = observeUrlChange
  if (typeof window.onurlchange === 'function') {
    window.onurlchange = () => {
      DEBUG && console.log('Detected URL change via onurlchange')
      clearInterval(intervalRef)
      youtubeDataSender()
    }
  }

  DEBUG && console.log("YouTube's Discord activity script loaded.")
  connectWebSocket()
})()
