// ==UserScript==
// @name         Discord`s Yandex Music activity
// @version      v1.0.0
// @description  Script that allows get data about video and show it in discord account`s game activity
// @author       hikaru_kl
// @connect      127.0.0.1
// @match        https://music.yandex.ru/*
// @icon         https://img.icons8.com/?size=100&id=GcHAhJmJIDHm&format=png&color=000000
// @grant        GM_xmlhttpRequest
// @grant        window.onurlchange
// @grant        unsafeWindow
// ==/UserScript==
;(function () {
  'use strict'
  let data
  console.log(`Starting Yandex music's activity script`)

  // NOTE: Taken from https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
  function waitForElm(selector) {
    return new Promise((resolve) => {
      if (unsafeWindow.document.querySelector(selector)) {
        return resolve(unsafeWindow.document.querySelector(selector))
      }
      const observer = new MutationObserver((mutations) => {
        if (unsafeWindow.document.querySelector(selector)) {
          observer.disconnect()
          resolve(unsafeWindow.document.querySelector(selector))
        }
      })
      observer.observe(unsafeWindow.document.body, {
        childList: true,
        subtree: true
      })
    })
  }

  // NOTE: Taken from https://stackoverflow.com/questions/3522090/event-when-window-location-href-changes
  const yamusicDataSender = () => {
    console.log('Waiting for player')
    waitForElm('div.player-controls__track-container a.track__title').then((player) => {
      unsafeWindow.externalAPI.help()
      console.log('Music player is ready')
      // TODO: Optimize the frequency of sending a request
      document.youcord = setInterval(async () => {
        try {
          if (window.location.host == 'music.yandex.ru') {
            if (unsafeWindow.externalAPI.isPlaying()) {
              let trackData = unsafeWindow.externalAPI.getCurrentTrack()
              let progress = externalAPI.getProgress()
              let artists = ''
              trackData.artists.forEach((el, index) => {
                index != trackData.artists.length - 1
                  ? (artists += el.title + ', ')
                  : (artists += el.title)
              })
              data = {
                service: 'yamusic',
                currentTime: progress.position * 1000,
                tackDuration: progress.duration * 1000,
                trackTitle: trackData.title,
                artist: artists,
                thumbnail:
                  'https://' + trackData.cover.substring(0, trackData.cover.length - 2) + '400x400'
              }
              GM_xmlhttpRequest({
                method: 'POST',
                url: 'http://127.0.0.1:25742/yamusic',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(data),
                timeout: 400
              })
            }
          }
        } catch {
          console.log('Unexcepted error, retrying in 2 seconds...')
          new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }, 1000)
    })
  }
  yamusicDataSender()
  // socket.addEventListener("open", (event) => {
  //   yamusicDataSender();
  // });
  // socket.addEventListener("message", (event) => {
  //   console.log("Message from server:", event.data);
  //   if (event.data == 'queue') {
  //       console.log('Clear interval')
  //       clearInterval(document.youcord);
  //   }
  //   if (event.data == 'start') {
  //       console.log('Starting...')
  //       yamusicDataSender();
  //   }
  // })
})()
