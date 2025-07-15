<script setup>
import { ref, reactive } from 'vue'
const emit = defineEmits(['add-tooltip-button', 'add-tooltip-content'])
import profileImg from '../assets/youtube-user-preview.png'
import rickImg from '../assets/rick.jpg'
import { convertTimeYTformat, ytFormatToTimestamp } from '../utils.js'

let time = 0
let youtube_time = ref('0:00')

const timer = setInterval(() => {
  time++
  if (time <= ytFormatToTimestamp('3:32') / 1000) youtube_time.value = convertTimeYTformat(time)
  else clearInterval(timer)
}, 1000)

let config = reactive({
  title: true,
  author: true,
  duration: true,
  link: true
})
const saveChanges = () => {
  window.electron.ipcRenderer.send('changeParams', { service: 'youtube', config })
}
window.electron.ipcRenderer.on('setParams', (e, data) => {
  config = data.youtube.parameters
})
</script>

<template>
  <div class="w-full h-full p-4 bg-[#404040] rounded-[20px]">
    <h3 class="mb-4 font-semibold text-blue-100 text-center">Настройки Youtube</h3>
    <!-- #1f1a2b
         #14111c -->
    <div class="flex flex-row lg:flex-row justify-evenly">
      <div class="flex flex-col justify-center content-center items-center py-2">
        <ul
          class="w-48 text-sm font-medium border rounded-lg bg-[#333538] border-gray-600 text-white"
        >
          <li class="w-full border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg">
            <div class="flex items-center ps-3">
              <input
                id="vtitle-checkbox"
                v-model="config.title"
                type="checkbox"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="vtitle-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
              >
                Заголовок видео
              </label>
            </div>
          </li>
          <li
            class="w-full rounded-t-lg border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg"
          >
            <div class="flex items-center ps-3">
              <input
                id="vauthor-checkbox"
                v-model="config.author"
                type="checkbox"
                value="author"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="vauthor-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
                >Автор видео</label
              >
            </div>
          </li>
          <li class="w-full border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg">
            <div class="flex items-center ps-3">
              <input
                id="vduration-checkbox"
                v-model="config.duration"
                type="checkbox"
                value="duration"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="vduration-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
              >
                Длительность просмотра</label
              >
            </div>
          </li>
          <li class="w-full border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg">
            <div class="flex items-center ps-3">
              <input
                id="vlink-checkbox"
                v-model="config.link"
                type="checkbox"
                value="link"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="vlink-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
              >
                Ссылка на видео
              </label>
            </div>
          </li>
        </ul>
      </div>
      <div
        class="bg-[#333538] border-[#414346] border-2 text-[#c0c1d1] rounded-[4px] p-2 gap-2 flex flex-col justify-self-end self-center max-w-[330px] w-full"
      >
        <header class="flex justify-between">
          <h1
            class="flex gap-1 items-center text-[12px] leading-tight font-medium"
            data-text-variant="text-xs/medium"
            style="color: var(--header-primary)"
          >
            Watching YouCord Desktop
          </h1>
          <div class="flex gap-2" />
        </header>
        <div class="flex flex-col gap-2">
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
                      src="../assets/youtube-preview.png"
                      alt="BTMC Reacts to “a long overdue lazer update”"
                      style="max-width: 60px; min-height: 60px; border-radius: inherit"
                    />
                  </foreignObject>
                </svg>
                <div
                  v-show="config.title"
                  :ref="(el) => emit('add-tooltip-content', el)"
                  role="tooltip"
                  class="absolute z-10 invisible text-nowrap transition-all inline-block px-3 py-2 text-sm font-medium text-white bg-[#13131a] rounded-lg shadow-sm opacity-0 tooltip"
                >
                  Rick Astley - Never Gonna Give You Up (Official Music Video)
                  <div class="tooltip-arrow" data-popper-arrow />
                </div>
              </div>
              <div
                aria-label="BTMC Clips"
                class="absolute right-[-4px] bottom-[-4px] flex items-center justify-center rounded-full flex-shrink-0"
              >
                <img
                  :ref="(el) => emit('add-tooltip-button', el)"
                  aria-label="BTMC Clips"
                  type="button"
                  class="contentImage_dc67b6 contentImage_fa854f -indent-[9999px] object-cover"
                  :src="config.author ? rickImg : profileImg"
                  alt="BTMC Clips"
                  style="max-width: 24px; min-height: 24px; border-radius: inherit"
                />
                <div
                  v-show="config.author"
                  :ref="(el) => emit('add-tooltip-content', el)"
                  role="tooltip"
                  class="absolute text-nowrap z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-[#13131a] rounded-lg shadow-sm opacity-0 tooltip"
                >
                  Rick Astley
                  <div class="tooltip-arrow" data-popper-arrow />
                </div>
              </div>
            </div>
            <div class="overflow-hidden flex flex-col self-center gap-1 w-full">
              <div>
                <div
                  class="text-[14px] leading-tight font-semibold"
                  data-text-variant="heading-sm/semibold"
                  style="color: var(--text-normal)"
                >
                  Watching YouTube video
                </div>
                <div
                  v-show="config.title"
                  class="text-[12px] text-[#535464] whitespace-nowrap overflow-ellipsis overflow-hidden relative"
                  data-text-variant="text-xs/normal"
                  style="color: var(--text-normal)"
                >
                  Rick Astley - Never Gonna Give You Up (Official Music Video)
                </div>
              </div>
              <div v-show="config.duration" class="flex items-center gap-2 outline-0 m-0 p-0">
                <div class="text-sm text-gray-300 font-normal line leading-tight font-code">
                  {{ youtube_time }}
                </div>
                <div class="flex-1 h-[2px] rounded-sm bg-[#5f5f70]">
                  <div
                    class="inherit border-inherit min-w-1 bg-[#f1f0ff]"
                    :style="{
                      width:
                        (ytFormatToTimestamp(youtube_time) / ytFormatToTimestamp('3:32')) * 100 +
                        '%',
                      height: 'inherit'
                    }"
                  />
                </div>
                <div class="text-sm text-gray-300 font-normal line leading-tight font-code">
                  3:32
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-wrap content-center flex items-center gap-y-2 m-y-1">
          <a
            v-show="config.link"
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            target="_blank"
            aria-label="Open YouTube video"
            type="button"
            class="flex-auto min-w-fit bg-[#2541a6] hover:bg-[#23388b] transition-all w-full min-h-8 h-8 relative flex justify-center items-center box-border border-none rounded-[3px] text-[14px] font-medium pt-[2px] px-[16px] select-none"
          >
            <div class="m-auto whitespace-nowrap overflow-hidden">Open YouTube video</div>
          </a>
          <a
            href="https://github.com/hikaru-kl"
            target="_blank"
            aria-label="Author`s github"
            type="button"
            class="flex-auto min-w-fit bg-[#2541a6] hover:bg-[#23388b] transition-all w-full min-h-8 h-8 relative flex justify-center items-center box-border border-none rounded-[3px] text-[14px] font-medium pt-[2px] px-[16px] select-none"
          >
            <div class="m-auto whitespace-nowrap overflow-hidden">Author`s github</div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
