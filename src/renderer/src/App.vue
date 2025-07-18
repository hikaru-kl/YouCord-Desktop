<script setup>
import { onMounted, shallowRef, ref, watch, nextTick } from 'vue'
import { Tooltip, Dropdown } from 'flowbite'

import YoutubeSettings from './components/YoutubeSettings.vue'
import SpotifySettings from './components/SpotifySettings.vue'
import YamusicSettings from './components/YamusicSettings.vue'
import YamusicWebSettings from './components/YamusicWebSettings.vue'
import MenuSettings from './components/MenuSettings.vue'

// Reactive tooltip element arrays
const tooltipContents = ref([])
const tooltipButtons = ref([])

const yamusicButton = ref(null)
const yamusicContent = ref(null)

let currentComponent = shallowRef('menu:settings')

// Swap content and re-initialize tooltips
const swapContent = (component) => {
  window.electron.ipcRenderer.send('askUpdate')
  currentComponent.value = component
}

// Init tooltips and dropdown once everything is mounted
onMounted(() => {
  initializeDropdown()
})

watch(
  () => tooltipContents.value.length,
  (newVal) => {
    console.log(`Updated tooltipContents to ${newVal}`)
  }
)

const initializedTooltips = new WeakMap()
watch(
  [tooltipContents, tooltipButtons],
  async () => {
    await nextTick()

    for (let i = 0; i < tooltipContents.value.length; i++) {
      const contentEl = tooltipContents.value[i]
      const buttonEl = tooltipButtons.value[i]

      // Если один из элементов отсутствует — пропускаем
      if (!contentEl || !buttonEl) continue

      // Если уже был создан тултип — пропускаем
      if (initializedTooltips.has(contentEl)) continue

      // Инициализируем тултип
      const tooltip = new Tooltip(contentEl, buttonEl, {
        placement: 'bottom',
        triggerType: 'hover'
      })

      // Помечаем как инициализированный
      initializedTooltips.set(contentEl, tooltip)
    }
  },
  { deep: true }
)

// Helper: Initialize Yandex.Music dropdown
const initializeDropdown = () => {
  console.log('init dropdown')

  if (yamusicButton.value && yamusicContent.value) {
    new Dropdown(
      yamusicContent.value,
      yamusicButton.value,
      {
        delay: 0
      },
      {
        id: 'dropdownMenu',
        override: true
      }
    )
  }
}

// Clear arrays before switching to a new component to avoid duplicates
watch(currentComponent, () => {
  tooltipContents.value = []
  tooltipButtons.value = []
})

const sparks = ref([])

function triggerSparks() {
  sparks.value = []
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = 100 + Math.random() * 20
    sparks.value.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    })
  }

  setTimeout(() => {
    sparks.value = []
  }, 500)
}
function handleDelayedRedirect() {
  triggerSparks()
  setTimeout(() => {
    window.open('https://boosty.to/youcord', '_blank')
  }, 1000)
}
</script>
<template>
  <div>
    <div class="w-full flex flex-col h-screen gap-y-5 xl:py-5 sm:py-3 xl:px-5 sm:px-3 bg-[#424549]">
      <div class="flex-row w-full">
        <div class="relative gap-x-2 w-full py-2 px-2 rounded-full flex bg-[#323232]">
          <div class="flex align-middle items-center">
            <img
              :ref="
                (el) =>
                  !tooltipButtons.includes(el)
                    ? !tooltipButtons.includes(el)
                      ? tooltipButtons.push(el)
                      : {}
                    : {}
              "
              class="hover:-translate-y-1 transition-all hover:cursor-pointer self-center"
              src="./assets/spotify-icon.svg"
              alt="Spotify"
              @click="swapContent('spotify')"
            />
            <div
              :ref="(el) => (!tooltipContents.includes(el) ? tooltipContents.push(el) : {})"
              role="tooltip"
              class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-[#575757] rounded-lg shadow-sm opacity-0 tooltip"
            >
              Spotify
              <div class="tooltip-arrow" data-popper-arrow />
            </div>
          </div>
          <div class="align-middle flex">
            <img
              :ref="(el) => (!tooltipButtons.includes(el) ? tooltipButtons.push(el) : {})"
              type="button"
              src="./assets/youtube-new.svg"
              class="hover:-translate-y-1 transition-all w-16 self-center hover:cursor-pointer"
              alt="Youtube"
              @click="swapContent('youtube')"
            />
            <div
              :ref="(el) => (!tooltipContents.includes(el) ? tooltipContents.push(el) : {})"
              role="tooltip"
              class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-[#575757] rounded-lg shadow-sm opacity-0 tooltip"
            >
              Youtube
              <div class="tooltip-arrow" data-popper-arrow />
            </div>
          </div>
          <div class="align-middle flex">
            <img
              id="yamusicDropdown"
              :ref="yamusicButton"
              type="button"
              src="./assets/yandex-music-icon.svg"
              class="hover:-translate-y-1 transition-all w-16 self-center hover:cursor-pointer"
              alt="Yandex music"
              data-dropdown-toggle="yamusicDropdownHover"
              data-dropdown-trigger="hover"
              @click="swapContent('yamusic:desktop')"
            />
            <div
              id="yamusicDropdownHover"
              :ref="yamusicContent"
              class="z-10 hidden divide-y divide-gray-100 rounded-lg shadow w-44 bg-[#575757] text-white"
            >
              <ul class="py-2 text-sm" aria-labelledby="yamusicDropdown">
                <li>
                  <a
                    href="#"
                    class="block px-4 py-2 hover:bg-[#4d4d4d] hover:text-white"
                    @click="swapContent('yamusic:desktop')"
                    >Приложение</a
                  >
                </li>
                <li>
                  <a
                    href="#"
                    class="block px-4 py-2 hover:bg-[#4d4d4d] hover:text-white"
                    @click="swapContent('yamusic:web')"
                    >Браузерная версия</a
                  >
                </li>
                <hr />
                <li>
                  <span class="block px-4 py-2 text-xs">Яндекс музыка</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="relative flex-grow flex mt-5 gap-x-10">
        <div
          class="flex py-5 px-3 h-full gap-y-2 flex-col sm:max-w-60 md:max-w-80 lg:max-w-xs xl:max-w-md w-full bg-[#323232] rounded-[20px]"
        >
          <button
            type="button"
            :class="[
              'bg-[#484848] text-[#BCBCBC] rounded-[20px] py-[10px] tracking-widest hover:translate-x-1 transition-all',
              currentComponent === 'menu:settings' ? 'bg-[#6A6A6A] text-white' : ''
            ]"
            @click="
              () => {
                swapContent('menu:settings')
              }
            "
          >
            Настройки
          </button>
          <a
            type="button"
            href="https://github.com/hikaru-kl"
            target="_blank"
            class="text-center bg-[#484848] text-[#BCBCBC] rounded-[20px] py-[10px] tracking-widest hover:translate-x-1 transition-all"
          >
            GitHub
          </a>
          <button
            type="button"
            class="cursor-not-allowed bg-[#3b3b3b] text-[#BCBCBC] rounded-[20px] py-[10px] tracking-widest hover:translate-x-1 transition-all"
            title="Появится в YouCord 1.0"
          >
            Статистика
          </button>
          <button
            type="button"
            class="cursor-not-allowed bg-[#3b3b3b] text-[#BCBCBC] rounded-[20px] py-[10px] tracking-widest hover:translate-x-1 transition-all"
            title="Появится в YouCord 1.0"
          >
            Помощь
          </button>
          <a
            type="button"
            href="https://boosty.to/youcord"
            target="_blank"
            class="text-center bg-gradient-to-r from-indigo-400 via-teal-500 to-indigo-700 text-[#f7f7f7] rounded-[20px] py-[10px] tracking-widest hover:translate-x-1 transition-all"
            @click.prevent="handleDelayedRedirect"
          >
            Донат
            <span
              v-for="(spark, index) in sparks"
              :key="index"
              class="absolute w-1 h-1 bg-yellow-400 rounded-full animate-sparkle pointer-events-none"
              :style="{
                top: '50%',
                left: '50%',
                '--x': spark.x + 'px',
                '--y': spark.y + 'px'
              }"
            />
          </a>
          <div
            class="flex justify-between flex-row w-full max-h-fit text-center mt-auto self-center text-[#868686]"
          >
            <div class="text-center justify-self-center flex">YouCord v1.0.0-beta.1</div>
            <div class="text-center justify-self-center flex">by hikaru_kl</div>
          </div>
        </div>
        <div class="w-full bg-[#323232] rounded-[20px] p-3">
          <SpotifySettings
            v-show="currentComponent == 'spotify'"
            @add-tooltip-button="
              (el) => (!tooltipButtons.includes(el) ? tooltipButtons.push(el) : {})
            "
            @add-tooltip-content="
              (el) => (!tooltipContents.includes(el) ? tooltipContents.push(el) : {})
            "
          />
          <YoutubeSettings
            v-show="currentComponent == 'youtube'"
            @add-tooltip-button="
              (el) => (!tooltipButtons.includes(el) ? tooltipButtons.push(el) : {})
            "
            @add-tooltip-content="
              (el) => (!tooltipContents.includes(el) ? tooltipContents.push(el) : {})
            "
          />
          <YamusicSettings
            v-show="currentComponent == 'yamusic:desktop'"
            @add-tooltip-button="
              (el) => (!tooltipButtons.includes(el) ? tooltipButtons.push(el) : {})
            "
            @add-tooltip-content="
              (el) => (!tooltipContents.includes(el) ? tooltipContents.push(el) : {})
            "
          />
          <YamusicWebSettings
            v-show="currentComponent == 'yamusic:web'"
            @add-tooltip-button="
              (el) => (!tooltipButtons.includes(el) ? tooltipButtons.push(el) : {})
            "
            @add-tooltip-content="
              (el) => (!tooltipContents.includes(el) ? tooltipContents.push(el) : {})
            "
          />
          <MenuSettings
            v-show="currentComponent == 'menu:settings'"
            @add-tooltip-button="
              (el) => (!tooltipButtons.includes(el) ? tooltipButtons.push(el) : {})
            "
            @add-tooltip-content="
              (el) => (!tooltipContents.includes(el) ? tooltipContents.push(el) : {})
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>
