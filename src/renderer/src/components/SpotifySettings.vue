<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { convertTimeYTformat, ytFormatToTimestamp } from '../utils.js'
import youcordImg from '../assets/youcord-logo.png'
import albumImg from '../assets/rockstar.jpg'

const emit = defineEmits(['add-tooltip-button', 'add-tooltip-content'])

let AUTH_URL = ref('')
let IS_AUTHORIZED = ref(false)

onMounted(() => {
  window.electron.ipcRenderer.send('getSpotifyStatus')
  window.electron.ipcRenderer.on('spotifyStatus', handleStatus)
  window.electron.ipcRenderer.on('spotifyAuthURL', handleAuthUrl)
})

onUnmounted(() => {
  window.electron.ipcRenderer.removeListener('spotifyStatus', handleStatus)
  window.electron.ipcRenderer.removeListener('spotifyAuthURL', handleAuthUrl)
})

function handleStatus(e, data) {
  console.log(`Current local authorized status: ${IS_AUTHORIZED.value}`)
  IS_AUTHORIZED.value = data.authorized
  console.log(`New status: ${data.authorized}`)
}

function handleAuthUrl(e, data) {
  AUTH_URL.value = data.auth_url
}

let config = reactive({
  title: true,
  author: true,
  lyrics: true,
  duration: true,
  link: true,
  image: true
})

const saveChanges = () => {
  window.electron.ipcRenderer.send('changeParams', { service: 'spotify', config })
}

window.electron.ipcRenderer.on('setParams', (e, data) => {
  config = data.spotify.parameters
})
let time = 0
let spotify_time = ref('0:00')
const timer = setInterval(() => {
  time++
  if (time <= ytFormatToTimestamp('03:14') / 1000) spotify_time.value = convertTimeYTformat(time)
  else clearInterval(timer)
}, 1000)
</script>

<template>
  <div class="w-full h-full p-4 bg-[#404040] rounded-[20px]">
    <h3 class="mb-4 font-semibold text-blue-100 text-center">Настройки Spotify</h3>
    <div v-if="!IS_AUTHORIZED" class="flex grow h-full justify-center items-center">
      <div class="flex-col">
        <h4 class="text-blue-100 mb-2">Для продолжения необходимо авторизоваться в Spotify</h4>
        <div class="flex justify-center">
          <a
            :href="AUTH_URL"
            target="_blank"
            class="w-32 text-center font-semibold rounded-md bg-gradient-to-bl from-green-600 via-green-400 to-emerald-600 text-lg text-gray-100 hover:text-gray-200 hover:bg-gradient-to-tr transition-transform"
          >
            Spotify
          </a>
        </div>
      </div>
    </div>
    <div v-else class="flex flex-row lg:flex-row justify-evenly py-2">
      <div class="flex flex-col justify-center content-center items-center">
        <ul
          class="w-48 text-sm font-medium border rounded-lg bg-[#333538] border-gray-600 text-white"
        >
          <li class="w-full border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg">
            <div class="flex items-center ps-3">
              <input
                id="strtitle-checkbox"
                v-model="config.title"
                type="checkbox"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="strtitle-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
              >
                Название трека
              </label>
            </div>
          </li>
          <li
            class="w-full rounded-t-lg border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg"
          >
            <div class="flex items-center ps-3">
              <input
                id="strartist-checkbox"
                v-model="config.author"
                type="checkbox"
                value="author"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="strartist-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
              >
                Исполнитель
              </label>
            </div>
          </li>
          <li class="w-full border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg">
            <div class="flex items-center ps-3">
              <input
                id="strtime-checkbox"
                v-model="config.duration"
                type="checkbox"
                value="duration"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="strtime-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
              >
                Время прослушивания
              </label>
            </div>
          </li>
          <li class="w-full border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg">
            <div class="flex items-center ps-3">
              <input
                id="strlink-checkbox"
                v-model="config.link"
                type="checkbox"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                @change="saveChanges()"
              />
              <label
                for="strlink-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
              >
                Ссылка на трек
              </label>
            </div>
          </li>
          <li class="w-full border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg">
            <div class="flex items-center ps-3">
              <input
                id="strimage-checkbox"
                v-model="config.image"
                type="checkbox"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="strimage-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
              >
                Обложка трека
              </label>
            </div>
          </li>
          <li class="w-full border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg">
            <div class="flex items-center ps-3">
              <input
                id="strlyrics-checkbox"
                v-model="config.lyrics"
                type="checkbox"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                @change="saveChanges()"
              />
              <label
                for="strlyrics-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
              >
                Стриминг лирики
              </label>
            </div>
          </li>
        </ul>
      </div>
      <div class="flex flex-col">
        <div
          class="bg-[#333538] border-[#414346] border-2 text-[#c0c1d1] rounded-[4px] p-2 gap-2 flex flex-col justify-self-end self-center max-w-[330px] w-[330px]"
        >
          <header class="flex justify-between w-full">
            <h1
              class="flex gap-1 items-center text-[12px] leading-tight font-medium"
              data-text-variant="text-xs/medium"
              style="color: var(--header-primary)"
            >
              Watching YouCord Desktop
            </h1>
            <div class="flex gap-2" />
          </header>
          <div class="flex flex-col gap-2 w-full">
            <div class="flex-auto flex flex-row gap-2">
              <div class="relative overflow-visible flex h-max aspect-square items-center">
                <div :ref="(el) => emit('add-tooltip-button', el)" role="button" tabindex="0">
                  <svg
                    width="60"
                    height="60"
                    class="flex justify-center rounded-[4px] contain-paint"
                    viewBox="0 0 60 60"
                    aria-label="BTMC Reacts to “a long overdue lazer update”"
                  >
                    <foreignObject
                      x="0"
                      y="0"
                      width="60"
                      height="60"
                      overflow="visible"
                      mask="url(#svg-mask-content-image-60)"
                    >
                      <img
                        aria-label="BTMC Reacts to “a long overdue lazer update”"
                        class="object-cover -indent-[9999px]"
                        :src="config.image ? albumImg : youcordImg"
                        alt="BTMC Reacts to “a long overdue lazer update”"
                        style="max-width: 60px; min-height: 60px; border-radius: inherit"
                      />
                    </foreignObject>
                  </svg>
                  <div
                    :ref="(el) => emit('add-tooltip-content', el)"
                    role="tooltip"
                    class="absolute z-10 invisible text-nowrap transition-all inline-block px-3 py-2 text-sm font-medium text-white bg-[#13131a] rounded-lg shadow-sm opacity-0 tooltip"
                  >
                    YouCord created by hikaru_kl
                    <div class="tooltip-arrow" data-popper-arrow />
                  </div>
                </div>
                <div
                  class="absolute right-[-4px] bottom-[-4px] flex items-center justify-center rounded-full flex-shrink-0"
                >
                  <img
                    :ref="(el) => emit('add-tooltip-button', el)"
                    type="button"
                    src="../assets/spotify-icon.svg"
                    class="contentImage_dc67b6 contentImage_fa854f -indent-[9999px] object-cover bg-black"
                    alt="Spotify icon"
                    style="max-width: 24px; min-height: 24px; border-radius: inherit"
                  />
                  <div
                    :ref="(el) => emit('add-tooltip-content', el)"
                    role="tooltip"
                    class="absolute text-nowrap z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-[#13131a] rounded-lg shadow-sm opacity-0 tooltip"
                  >
                    Spotify
                    <div class="tooltip-arrow" data-popper-arrow />
                  </div>
                </div>
              </div>
              <div class="overflow-hidden flex flex-col self-center gap-1 w-full">
                <div>
                  <div
                    v-show="config.title"
                    class="text-[14px] leading-tight font-semibold"
                    data-text-variant="heading-sm/semibold"
                    style="color: var(--text-normal)"
                  >
                    Rockstar
                  </div>
                  <div
                    v-show="config.author"
                    class="text-[12px] leading-tight font-normal text-[#535464] whitespace-nowrap text-ellipsis relative outline-0"
                    data-text-variant="text-xs/normal"
                    style="color: var(--text-normal)"
                  >
                    BoyWithUke
                  </div>
                </div>
                <div v-show="config.duration" class="flex items-center gap-2 outline-0 m-0 p-0">
                  <div class="text-sm text-gray-300 font-normal line leading-tight font-code">
                    {{ spotify_time }}
                  </div>
                  <div class="flex-1 h-[2px] rounded-sm bg-[#5f5f70]">
                    <div
                      class="inherit border-inherit min-w-1 bg-[#f1f0ff]"
                      :style="{
                        width:
                          (ytFormatToTimestamp(spotify_time) / ytFormatToTimestamp('03:14')) * 100 +
                          '%',
                        height: 'inherit'
                      }"
                    />
                  </div>
                  <div class="text-sm text-gray-300 font-normal line leading-tight font-code">
                    03:14
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-wrap content-center flex items-center gap-y-2 m-y-1">
            <a
              v-show="config.link"
              href="https://open.spotify.com/track/4hU2UADYSphaQu2NhRO4IG"
              target="_blank"
              aria-label="Open Spotify track"
              type="button"
              class="flex-auto min-w-fit bg-[#2541a6] hover:bg-[#23388b] transition-all w-full min-h-8 h-8 relative flex justify-center items-center box-border border-none rounded-[3px] text-[14px] font-medium pt-[2px] px-[16px] select-none"
            >
              <div class="m-auto whitespace-nowrap overflow-hidden">Open Spotify track</div>
            </a>
            <a
              href="https://github.com/hikaru-kl"
              target="_blank"
              aria-label="Author`s github"
              type="button"
              class="w-full flex-auto min-w-fit bg-[#2541a6] hover:bg-[#23388b] transition-all min-h-8 h-8 relative flex justify-center items-center box-border border-none rounded-[3px] text-[14px] font-medium pt-[2px] px-[16px] select-none"
            >
              <div class="m-auto whitespace-nowrap overflow-hidden">Author`s github</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
