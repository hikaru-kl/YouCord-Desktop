import { store } from '../config/store.js'

const activeActivities = {} // { spotify: {...}, yamusic: {...}, etc }
let servicePriorities = {}
let timeouts = {}

function updatePriorities() {
  const profiles = store.get('data').profiles
  for (const service in profiles) {
    if (profiles[service]?.priority != null) {
      servicePriorities[service] = profiles[service].priority
    }
  }
}

/**
 * Устанавливает активность и обновляет Rich Presence в Discord на основе самого приоритетного активного сервиса.
 * @param {import('discord-rpc').Client} discord_client
 */
export function setActivity(serviceName, data, discord_client) {
  clearTimeout(timeouts[serviceName])
  timeouts[serviceName] = setTimeout(() => {
    delete activeActivities[serviceName]
    updateDiscordActivity(discord_client)
  }, 9000)

  activeActivities[serviceName] = data
  updateDiscordActivity(discord_client)
}

/**
 * Удаляет Rich Presence в Discord.
 * @param {import('discord-rpc').Client} discord_client
 */
export function clearActivity(serviceName, discord_client) {
  delete activeActivities[serviceName]
  updateDiscordActivity(discord_client)
}

function getHighestPriorityActivity() {
  updatePriorities()
  const sorted = Object.entries(activeActivities)
    // eslint-disable-next-line no-unused-vars
    .filter(([_, value]) => value?.activity)
    .sort((a, b) => (servicePriorities[a[0]] || 0) - (servicePriorities[b[0]] || 0))

  return sorted.length > 0 ? sorted[0][1].activity : null
}

function updateDiscordActivity(discord_client) {
  if (!discord_client) {
    console.warn('Discord client is not initialized.')
    return
  }

  const activity = getHighestPriorityActivity()
  if (activity) {
    discord_client.request('SET_ACTIVITY', {
      pid: process.pid,
      activity: activity
    })
    // discord_client.setActivity(activity).catch(console.error);
  } else {
    discord_client.clearActivity().catch(console.error)
  }
}

export default {
  setActivity,
  clearActivity,
  updateDiscordActivity
}
