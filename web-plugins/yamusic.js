/* eslint-disable no-extra-semi */
/* eslint-disable no-undef */
// ==UserScript==
// @name         Discord's Yandex Music Activity
// @version      v1.2.0
// @description  Script that sends current Yandex Music track to Discord RPC bridge
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

  console.log("Starting Yandex Music's activity script")

  function waitForElm(selector, selector_2 = null) {
    return new Promise((resolve) => {
      if (unsafeWindow.document.querySelector(selector)) {
        return resolve(unsafeWindow.document.querySelector(selector))
      } else if (unsafeWindow.document.querySelector(selector_2)) {
        return resolve(unsafeWindow.document.querySelector(selector_2))
      }
      const observer = new MutationObserver(() => {
        if (unsafeWindow.document.querySelector(selector)) {
          observer.disconnect()
          resolve(unsafeWindow.document.querySelector(selector))
        } else if (unsafeWindow.document.querySelector(selector_2)) {
          observer.disconnect()
          resolve(unsafeWindow.document.querySelector(selector_2))
        }
      })
      observer.observe(unsafeWindow.document.body, {
        childList: true,
        subtree: true
      })
    })
  }

  function parseTrackData() {
    const mobileRoot = document.querySelector('.PlayerBarMobile_root__cdKy_')
    const desktopRoot = document.querySelector(
      '.PlayerBarDesktopWithBackgroundProgressBar_root__bpmwN'
    )

    const player = mobileRoot || desktopRoot
    if (!player) {
      console.log('Player not found')
      return null
    }
    const title =
      player.querySelector('.Meta_title__GGBnH, .Meta_title__qY9_p')?.textContent?.trim() ||
      'Не найден'
    const authorsContainer = player.querySelector('.SeparatedArtists_root_variant_breakAll__34YbW')
    let authorsString = ''

    if (authorsContainer) {
      const authors = Array.from(authorsContainer.querySelectorAll('a span'))
        .map((el) => el.textContent.trim())
        .filter(Boolean)
      authorsString = authors.join(', ')
    } else {
      const singleAuthor = player
        .querySelector('.Meta_artistCaption__JESZi, .Meta_artistCaption__gAAQc')
        ?.textContent?.trim()
      if (singleAuthor) authorsString = singleAuthor
    }
    let cover = desktopRoot
      ? player.querySelector(
          'img.qQ7GQU14EkggPBC6jdeS.fosYvyLDok3Kjj9OWmxG.PlayerBarDesktopWithBackgroundProgressBar_cover__MKmEt'
        )?.src || 'Не найдена'
      : player.querySelector('img.PlayerBarMobile_cover__pnJd1, img.PlayerBarDesktop_cover__u5jvK')
          ?.src || 'Не найдена'
    cover = cover.replace(/\d+x\d+/, '400x400')

    const selector = desktopRoot
      ? 'button.BaseSonataControlsDesktop_sonataButton__GbwFt span > svg > use'
      : 'span.JjlbHZ4FaP9EAcR_1DxF > svg > use'
    const index = desktopRoot ? 2 : 1
    const useElement = (desktopRoot || player).querySelectorAll(selector)[index]
    const isPaused = useElement.getAttribute('xlink:href').includes('play')

    const slider = player.querySelector('input[type="range"]')
    const currentTime = parseFloat(slider?.value || 0)
    const duration = parseFloat(slider?.max || 0)

    const info = {
      title,
      author: authorsString,
      isPaused,
      currentTime,
      duration,
      cover
    }
    console.log(info)

    return info
  }

  const sendToLocalServer = (payload) => {
    console.log('send data')

    GM_xmlhttpRequest({
      method: 'POST',
      url: 'http://127.0.0.1:25742/yamusic',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(payload),
      timeout: 400
    })
  }

  const yamusicDataSender = () => {
    console.log('Waiting for player...')
    waitForElm(
      '.PlayerBarMobile_root__cdKy_',
      '.PlayerBarDesktopWithBackgroundProgressBar_root__bpmwN'
    ).then(() => {
      console.log('Music player is ready')

      document.youcord = setInterval(async () => {
        try {
          if (window.location.host !== 'music.yandex.ru') return

          let trackData = parseTrackData()

          if (!trackData) return

          data = {
            service: 'yamusic',
            paused: trackData.isPaused,
            currentTime: trackData.currentTime,
            trackDuration: trackData.duration,
            trackTitle: trackData.title,
            artist: trackData.author,
            thumbnail: trackData.cover
          }

          sendToLocalServer(data)
        } catch (err) {
          console.log('Unexpected error, retrying in 2 seconds...', err)
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }, 4000)
    })
  }

  yamusicDataSender()
})()
