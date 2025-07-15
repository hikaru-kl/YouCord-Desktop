;(function () {
  'use strict'

  let data
  let interval = null
  let socket = new WebSocket('ws://127.0.0.1:25740/')
  console.log(`Yandex Music script has been loaded`)

  function waitForElm(selector) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector))
      }
      const observer = new MutationObserver(() => {
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

  const yamusicDataSender = () => {
    waitForElm('a.buOTZq_TKQOVyjMLrXvB.Meta_albumLink__gASh6 span').then(() => {
      if (socket.readyState !== 1) {
        console.log('Connection to WebSocket Server could not be made')
        return
      }

      console.log('Connection established!')

      if (interval) clearInterval(interval)

      interval = setInterval(() => {
        try {
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
          console.log('Send data', data)
          socket.send(JSON.stringify(data))
        } catch (err) {
          console.error('Unexpected error, retrying in 2 seconds...', err)
        }
      }, 3000)
    })
  }

  socket.addEventListener('open', () => {
    yamusicDataSender()
  })

  socket.addEventListener('message', (event) => {
    console.log('Message from server:', event.data)
    if (event.data === 'queue') {
      console.log('Clear interval')
      clearInterval(interval)
      interval = null
    }
    if (event.data === 'start') {
      console.log('Starting...')
      yamusicDataSender()
    }
  })
})()
