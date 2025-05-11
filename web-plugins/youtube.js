// ==UserScript==
// @name         Discord`s YouTube activity
// @namespace    http://tampermonkey.net/
// @version      v1.1.0
// @description  Script that allows get data about video and show it in discord account`s game activity
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
  let data
  let socket = new WebSocket('ws://127.0.0.1:25740/')
  console.log(`Youtube's activity script has been loaded`)

  // NOTE: Taken from https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
  function waitForElm(selector) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector))
      }
      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          observer.disconnect()
          resolve(document.querySelector(selector))
        }
      })
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    })
  }

  // NOTE: Taken from https://stackoverflow.com/questions/3522090/event-when-window-location-href-changes
  const observeUrlChange = () => {
    let oldHref = document.location.href
    const body = document.querySelector('body')
    const observer = new MutationObserver((mutations) => {
      if (oldHref !== document.location.href) {
        oldHref = document.location.href
        try {
          clearInterval(document.youcord)
          document.youcord = youtubeDataSender()
        } catch {
          youtubeDataSender()
        }
      }
    })
    observer.observe(body, { childList: true, subtree: true })
  }
  window.onload = observeUrlChange
  const youtubeDataSender = () => {
    waitForElm('#movie_player').then((player) => {
      console.log('YouTube player is ready')
      if (socket.readyState !== 1) {
        console.log('Connection to WebSocket Server could not be made')
      } else {
        console.log('Connection established!')

        // TODO: Optimize the frequency of sending a request
        document.youcord = setInterval(() => {
          try {
            if (window.location.host == 'www.youtube.com') {
              if (window.location.pathname == '/watch') {
                let vdata = player.getVideoData()
                data = {
                  service: 'youtube',
                  v: window.location.href,
                  live: player.getVideoStats().live,
                  currentTime: player.getCurrentTime(),
                  videoDuration: player.getDuration(),
                  videoTitle: vdata.title,
                  channel: vdata.author,
                  thumbnail: document.querySelector('yt-img-shadow.ytd-video-owner-renderer img')
                    .src
                }
              } else {
                data = {
                  service: 'youtube',
                  v: 'idle'
                }
              }
              console.log('send data')
              socket.send(JSON.stringify(data))
            }
          } catch {
            console.log('Unexcepted error, retrying in 2 seconds...')
            new Promise((resolve) => setTimeout(resolve, 2000))
          }
          socket.send(JSON.stringify(data))
        }, 1000)
      }
    })
  }
  socket.addEventListener('open', (event) => {
    youtubeDataSender()
  })
  socket.addEventListener('message', (event) => {
    console.log('Message from server:', event.data)
    if (event.data == 'queue') {
      console.log('Clear interval')
      clearInterval(document.youcord)
    }
    if (event.data == 'start') {
      console.log('Starting...')
      youtubeDataSender()
    }
  })
})()
