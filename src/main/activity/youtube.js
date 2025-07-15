import { setActivity } from './manager.js'

let youtubeActivity = {}

export function handleYouTubeActivity(data, discord_client, config) {
  if (data.v != 'idle') {
    youtubeActivity = {
      pid: process.pid,
      activity: {
        type: 3,
        details: data.paused
          ? `Paused YouTube ${data.live == 'live' ? 'stream' : 'video'}`
          : `Watching YouTube ${data.live == 'live' ? 'stream' : 'video'}`,
        state: config.profiles.youtube.parameters.title
          ? data.videoTitle.length > 128 || data.videoTitle.length == 0
            ? data.videoTitle.substring(0, 125) + '...'
            : data.videoTitle
          : undefined,
        assets: {
          large_image: 'youtube-icon',
          large_text: config.profiles.youtube.parameters.title
            ? data.videoTitle.length > 128 || data.videoTitle.length == 0
              ? data.videoTitle.substring(0, 125) + '...'
              : data.videoTitle
            : undefined,
          small_image:
            config.profiles.youtube.parameters.author && data.thumbnail ? data.thumbnail : 'user',
          small_text: config.profiles.youtube.parameters.author ? data.channel : undefined
        },
        buttons: [{ label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord-Desktop' }]
      }
    }

    if (config.profiles.youtube.parameters.link) {
      youtubeActivity.activity.buttons.unshift({
        label: 'Open YouTube video',
        url: data.v
      })
    }

    if (!data.paused && data.live != 'live' && config.profiles.youtube.parameters.duration) {
      youtubeActivity.activity.timestamps = {
        start: Date.now() - data.currentTime * 1000,
        end: Date.now() + (data.videoDuration * 1000 - data.currentTime * 1000)
      }
    }
  } else {
    youtubeActivity = {
      pid: process.pid,
      activity: {
        type: 3,
        details: `Exploring YouTube (IDLE)`,
        state: 'Trying to find something suitable',
        assets: {
          large_image: 'youtube-icon',
          large_text: 'Created by hikaru_kl',
          small_image: 'user',
          small_text: 'YouCord'
        },
        buttons: [
          { label: 'Open YouTube', url: 'https://www.youtube.com/' },
          { label: 'Author`s github', url: 'https://github.com/hikaru-kl/YouCord-Desktop' }
        ]
      }
    }
  }
  setActivity('youtube', youtubeActivity, discord_client)
}
