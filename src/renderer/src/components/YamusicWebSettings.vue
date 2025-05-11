<script setup>
import { ref } from 'vue'
const emit = defineEmits(['add-tooltip-button', 'add-tooltip-content'])

import { convertTimeYTformat, ytFormatToTimestamp } from '../utils.js'

let config = {
  title: true,
  author: true,
  duration: true,
  link: true,
  image: true
}

const saveChanges = () => {
  window.electron.ipcRenderer.send('changeParams', { service: 'yamusic', config })
}

window.electron.ipcRenderer.on('setParams', (e, data) => {
  config = data.yamusic.parameters
})
let time = 0
let yamusic_time = ref('0:00')
setInterval(() => {
  time++
  if (time <= ytFormatToTimestamp('03:14') / 1000) yamusic_time.value = convertTimeYTformat(time)
}, 1000)
</script>

<template>
  <div class="w-full h-full p-4 bg-[#404040] rounded-[20px]">
    <h3 class="mb-4 font-semibold text-blue-100 text-center">
      Настройки Яндекс Музыка (web версия)
    </h3>
    <!-- #1f1a2b
         #14111c -->
    <div class="flex flex-row lg:flex-row justify-evenly py-2">
      <div class="flex flex-col justify-center content-center items-center">
        <ul
          class="w-48 text-sm font-medium border rounded-lg bg-[#333538] border-gray-600 text-white"
        >
          <li
            class="w-full border-brounded-t-lg border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg"
          >
            <div class="flex items-center ps-3">
              <input
                id="wtrtitle-checkbox"
                v-model="config.title"
                type="checkbox"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="wtrtitle-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
                >Название трека</label
              >
            </div>
          </li>
          <li
            class="w-full rounded-t-lg border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg"
          >
            <div class="flex items-center ps-3">
              <input
                id="wtrartist-checkbox"
                v-model="config.author"
                type="checkbox"
                value="author"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="wtrartist-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
                >Исполнитель</label
              >
            </div>
          </li>
          <li
            class="w-full border-brounded-t-lg border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg"
          >
            <div class="flex items-center ps-3">
              <input
                id="wtrtime-checkbox"
                v-model="config.duration"
                type="checkbox"
                value="duration"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="wtrtime-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
                >Время прослушивания</label
              >
            </div>
          </li>
          <li
            class="w-full border-brounded-t-lg border-gray-600 hover:bg-[#2c2d30] bg-[#303235] transition-all rounded-lg"
          >
            <div class="flex items-center ps-3">
              <input
                id="wtrlink-checkbox"
                v-model="config.link"
                type="checkbox"
                value="link"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                disabled
                @change="saveChanges()"
              />
              <label
                for="wtrlink-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-400"
                >Ссылка на трек</label
              >
            </div>
          </li>
          <li
            class="w-full border-brounded-t-lg border-gray-600 hover:bg-[#2c2d30] transition-all rounded-lg"
          >
            <div class="flex items-center ps-3">
              <input
                id="wtrimage-checkbox"
                v-model="config.image"
                type="checkbox"
                value="link"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2 bg-gray-600 border-gray-500"
                checked
                @change="saveChanges()"
              />
              <label
                for="wtrimage-checkbox"
                class="w-full py-3 ms-2 text-sm font-medium text-gray-300"
                >Обложка трека</label
              >
            </div>
          </li>
        </ul>
        <!-- <button 
          type="button"
          class="bg-[#333538] w-full border-l border-b border-r rounded-b-lg border-gray-600 text-gray-300 font-medium text-sm text-center py-2 hover:bg-[#2c2d30]"
        >
          Сохранить скрипт
        </button> -->
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
                        src="../assets/rockstar.jpg"
                        alt="BTMC Reacts to “a long overdue lazer update”"
                        style="max-width: 60px; min-height: 60px; border-radius: inherit"
                    /></foreignObject>
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
                    src="../assets/yandex-music-icon.svg"
                    class="contentImage_dc67b6 contentImage_fa854f -indent-[9999px] object-cover"
                    alt="Yamusic icon"
                    style="max-width: 24px; min-height: 24px; border-radius: inherit"
                  />
                  <div
                    :ref="(el) => emit('add-tooltip-content', el)"
                    role="tooltip"
                    class="absolute text-nowrap z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-[#13131a] rounded-lg shadow-sm opacity-0 tooltip"
                  >
                    Yandex Music
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
                    Rockstar
                  </div>
                  <div
                    class="text-[12px] leading-tight font-normal text-[#535464] whitespace-nowrap text-ellipsis relative outline-0"
                    data-text-variant="text-xs/normal"
                    style="color: var(--text-normal)"
                  >
                    BoyWithUke
                  </div>
                </div>
                <div class="flex items-center gap-2 outline-0 m-0 p-0">
                  <div class="text-sm text-gray-300 font-normal line leading-tight font-code">
                    {{ yamusic_time }}
                  </div>
                  <div class="flex-1 h-[2px] rounded-sm bg-[#5f5f70]">
                    <div
                      class="inherit border-inherit min-w-1 bg-[#f1f0ff]"
                      :style="{
                        width:
                          (ytFormatToTimestamp(yamusic_time) / ytFormatToTimestamp('03:14')) * 100 +
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
              href="https://github.com/hikaru-kl"
              target="_blank"
              aria-label="Open YouTube video"
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
