(function () {
  'use strict'
  let data
  let socket = new WebSocket('ws://127.0.0.1:25740/')
  console.log(`Yandex music script has been loaded`)

  // NOTE: Taken from https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
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

  const yamusicDataSender = () => {
    waitForElm('a.buOTZq_TKQOVyjMLrXvB.Meta_albumLink__gASh6 span').then(() => {
      if (socket.readyState !== 1) {
        console.log('Connection to WebSocket Server could not be made')
      } else {
        console.log('Connection established!')

        // TODO: Optimize the frequency of sending a request
        document.youcord = setInterval(() => {
          let player_container = document.querySelectorAll('div.Meta_metaContainer__7i2dp')
          player_container = player_container[player_container.length - 1]

          try {
            data = {
              service: 'yamusic',
              currentTime: document.querySelector('span[data-test-id="TIMECODE_TIME_START"]')
                .innerHTML,
              tackDuration: document.querySelector('span[data-test-id="TIMECODE_TIME_END"]')
                .innerHTML,
              trackTitle: document.querySelector(
                'section.PlayerBarDesktop_root__d2Hwi a.buOTZq_TKQOVyjMLrXvB.Meta_albumLink__gASh6 span'
              ).innerHTML,
              artist: Array.from(
                player_container.querySelector('div.SeparatedArtists_root_variant_breakAll__34YbW')
                  .children,
                ({ textContent }) => textContent.trim()
              )
                .filter(Boolean)
                .join(' '),
              thumbnail: document.querySelector('img.PlayerBarDesktop_cover__IYLwR').src
            }
            console.log('send data')
            socket.send(JSON.stringify(data))
          } catch {
            console.log('Unexcepted error, retrying in 2 seconds...')
            new Promise((resolve) => setTimeout(resolve, 2000))
          }
          socket.send(JSON.stringify(data))
        }, 1000)
      }
    })
  }
  socket.addEventListener('open', () => {
    yamusicDataSender()
  })
  socket.addEventListener('message', (event) => {
    console.log('Message from server:', event.data)
    if (event.data == 'queue') {
      console.log('Clear interval')
      clearInterval(document.youcord)
    }
    if (event.data == 'start') {
      console.log('Starting...')
      yamusicDataSender()
    }
  })
})()
