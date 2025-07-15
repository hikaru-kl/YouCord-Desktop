import { generateRandomString, repeatTimeout, getLyrics } from '../utils/utils.js'
import { setActivity } from './manager.js'
import { store } from '../config/store'
import { PORT } from '../config/config'

const axios = require('axios')

export const APP_SPOTIFY = {
  client_id: 'bf649664b00a4eec82b5fb056f33ac5b',
  client_secret: 'aa33cde8cba746b39cb5441c71c4d7a0',
  redirect_uri: `http://localhost:${PORT + 2}/spotify/callback`,
  scopes: 'user-read-currently-playing',
  stateKey: 'spotify_auth_state',
  state: generateRandomString(16),
  access_token: store.get('data').profiles.spotify.parameters.access_token,
  refresh_token: store.get('data').profiles.spotify.parameters.refresh_token,
  expires_at: store.get('data').profiles.spotify.parameters.expires_at
}

/**
 * Инициирует взаимодействие приложение с Spotify.
 * @param {import('discord-rpc').Client} discord_client
 */
export async function askSpotify(discord_client, callback) {
  if (APP_SPOTIFY.access_token && APP_SPOTIFY.refresh_token) {
    if (APP_SPOTIFY.expires_at <= Date.now()) {
      await refreshSpotifyToken(APP_SPOTIFY.refresh_token, callback)
    }
    repeatTimeout(
      async () => await refreshSpotifyToken(APP_SPOTIFY.refresh_token, callback),
      APP_SPOTIFY.expires_at - Date.now() - 5 * 60 * 1000
    )

    let currentTrack = {
      lyrics: true,
      id: generateRandomString(16)
    }
    setInterval(() => {
      let config = store.get('data')
      let options = {
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: { Authorization: 'Bearer ' + APP_SPOTIFY.access_token }
      }

      axios
        .get(options.url, { headers: options.headers })
        .then(async (res) => {
          if (res.status == 200 && res.data) {
            currentTrack = await processSpotifyTrack(res.data, currentTrack, config, discord_client)
          }
        })
        .catch((err) => console.log(err))
    }, 3000)
  }
}

// Processes the Spotify track data and updates the Discord activity.
/**
 * @param {Object} data - The Spotify user's player data.
 * @param {Object} currentTrack - The current track information.
 * @param {Object} config - The application configuration.
 * @param {import('discord-rpc').Client} discord_client - The Discord client instance.
 * @returns {Promise<Object>} - The updated current track information.
 */
async function processSpotifyTrack(data, currentTrack, config, discord_client) {
  if (data.item.id !== currentTrack.id) {
    currentTrack = extractTrackInfo(data)
  }
  let expandedTitle = getExpandedTitle(currentTrack)
  let spotifyActivity = buildSpotifyActivity(currentTrack, expandedTitle, config, data)  
  await updateLyricsIfNeeded(currentTrack, config)
  updateTimestampsIfNeeded(spotifyActivity, config, data)
  updateStateWithLyricsIfNeeded(spotifyActivity, currentTrack, config, data)
  setActivity('spotify', spotifyActivity, discord_client)
  return currentTrack
}

function extractTrackInfo(data) {
  let artists = data.item.artists.map((el) => el.name).join(', ')
  return {
    id: data.item.id,
    name: data.item.name,
    image: data.item.album.images[0].url,
    albumName: data.item.album.name,
    artists: artists,
    link: data.item.external_urls.spotify,
    lyrics: false
  }
}

function getExpandedTitle(track) {
  let expandedTitle = track.name + ' (' + track.artists + ')'
  return expandedTitle.length > 128 ? expandedTitle.substring(0, 125) + '...' : expandedTitle
}

function buildSpotifyActivity(currentTrack, expandedTitle, config, data) {
  let spotifyActivity = {
    pid: process.pid,
    activity: {
      type: 3,
      details: config.profiles.spotify.parameters.title
        ? config.profiles.spotify.parameters.author && config.profiles.spotify.parameters.lyrics
          ? expandedTitle
          : currentTrack.name
        : 'Listening Spotify',
      state:
        config.profiles.spotify.parameters.author && !config.profiles.spotify.parameters.lyrics
          ? currentTrack.artists
          : undefined,
      assets: {
        small_image: 'spotify-icon',
        small_text: data.is_playing ? 'Spotify' : 'Spotify (Paused)',
        large_image: config.profiles.spotify.parameters.image ? currentTrack.image : 'youcord-logo',
        large_text: currentTrack.albumName || 'YouCord'
      },
      buttons: [
        {
          label: 'Author`s github',
          url: 'https://github.com/hikaru-kl/YouCord-Desktop'
        }
      ]
    }
  }
  if (config.profiles.spotify.parameters.link)
    spotifyActivity.activity.buttons.push({
      label: 'Open in Spotify',
      url: currentTrack.link
    })
  return spotifyActivity
}

async function updateLyricsIfNeeded(currentTrack, config) {
  if (config.profiles.spotify.parameters.lyrics && !currentTrack.lyrics) {
    currentTrack.lyrics = true
    const lyrics = await getLyrics(currentTrack.id)
    if (lyrics && lyrics.length > 0) {
      currentTrack.lyricsLines = lyrics
      currentTrack.lyricsUnexists = false
    } else {
      currentTrack.lyricsUnexists = true
    }
  }
}

function updateTimestampsIfNeeded(activity, config, data) {
  if (config.profiles.spotify.parameters.duration && data.is_playing) {
    activity.activity.timestamps = {
      start: Date.now() - data.progress_ms,
      end: Date.now() + (data.item.duration_ms - data.progress_ms)
    }
  }
}

function updateStateWithLyricsIfNeeded(spotifyActivity, currentTrack, config, data) {
  if (
    !currentTrack.lyricsUnexists &&
    currentTrack.lyricsLines &&
    config.profiles.spotify.parameters.lyrics
  ) {
    let flag = false
    const items = ['♪ ♩♪', '♫ ♫♪', '♫ ♪♪', '♪♪♪', '♩♬♫', '♫ ♬ ♬']
    const progress = data.progress_ms

    for (let i = 0; i < currentTrack.lyricsLines.length - 1; i++) {
      const curr = currentTrack.lyricsLines[i]
      const next = currentTrack.lyricsLines[i + 1]

      const currTime =
        typeof curr.startTimeMs !== 'undefined'
          ? parseInt(curr.startTimeMs)
          : Math.round((curr.time?.total || 0) * 1000)
      const nextTime =
        typeof next.startTimeMs !== 'undefined'
          ? parseInt(next.startTimeMs)
          : Math.round((next.time?.total || 0) * 1000)

      if (currTime <= progress && nextTime > progress) {
        const text = curr.words || curr.text || ''
        spotifyActivity.activity.state =
          text.length < 2
            ? text + '~♪♪'
            : text + ' ' + items[Math.floor(Math.random() * items.length)]
        flag = true
        break
      }
    }

    if (!flag) {
      spotifyActivity.activity.state = items[Math.floor(Math.random() * items.length)]
    }
  } else if (
    config.profiles.spotify.parameters.author &&
    config.profiles.spotify.parameters.title &&
    !currentTrack.lyricsLines
  ) {
    spotifyActivity.activity.details = currentTrack.name
    spotifyActivity.activity.state = currentTrack.artists
  } else if (
    config.profiles.spotify.parameters.author &&
    !config.profiles.spotify.parameters.title &&
    !currentTrack.lyricsLines
  ) {
    spotifyActivity.activity.state = currentTrack.artists
  }
  if (spotifyActivity.activity.state?.length > 128)
    spotifyActivity.activity.state = spotifyActivity.activity.state.substring(0, 125) + '...'
}
export const refreshSpotifyToken = async (refresh_token, frontend_callback) => {
  console.log('Trying to refresh spotify token...');

  const options = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
      client_id: APP_SPOTIFY.client_id
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(APP_SPOTIFY.client_id + ':' + APP_SPOTIFY.client_secret).toString('base64')
    }
  };

  try {
    const res = await axios.post(options.url, options.form, { headers: options.headers });

    if (res.status === 200) {
      APP_SPOTIFY.access_token = res.data.access_token;
      APP_SPOTIFY.expires_at = Date.now() + res.data.expires_in * 1000;

      const data = store.get('data');
      data.profiles.spotify.parameters.access_token = APP_SPOTIFY.access_token;
      data.profiles.spotify.parameters.expires_at = APP_SPOTIFY.expires_at;
      store.set('data', data);

      console.log('Spotify token refreshed successfully.');

      if (frontend_callback) {
        frontend_callback(true);
      }

      return true;
    } else {
      console.log(res.data);
      return false;
    }
  } catch (err) {
    console.error('Failed to refresh token:', err);
    return false;
  }
};