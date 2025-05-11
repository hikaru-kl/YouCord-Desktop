<script setup>
import { onMounted, shallowRef } from 'vue'
import { Tooltip, Dropdown } from 'flowbite'

import YoutubeSettings from './components/YoutubeSettings.vue'
import SpotifySettings from './components/SpotifySettings.vue'
import YamusicSettings from './components/YamusicSettings.vue'
import YamusicWebSettings from './components/YamusicWebSettings.vue'
import MenuSettings from './components/MenuSettings.vue'

const tooltipContents = []
const tooltipButtons = []
const yamusicButton = null
const yamusicContent = null

let currentComponent = shallowRef('menu:settings')

const swapContent = (component) => {
  window.electron.ipcRenderer.send('askUpdate')
  currentComponent.value = component
}

onMounted(() => {
  tooltipContents.forEach((el, i) => {
    new Tooltip(
      el,
      tooltipButtons[i],
      { placement: 'bottom', triggerType: 'hover' },
      { id: `tooltip-${i}`, override: true }
    )
  })
  new Dropdown(
    yamusicContent,
    yamusicButton,
    {
      delay: 0
    },
    {
      id: 'dropdownMenu',
      override: true
    }
  )
})
</script>
<template>
  <div>
    <div class="w-full flex flex-col h-screen gap-y-5 xl:py-5 sm:py-3 xl:px-5 sm:px-3 bg-[#424549]">
      <div class="flex-row w-full">
        <div class="relative gap-x-2 w-full py-2 px-2 rounded-full flex bg-[#323232]">
          <div class="flex align-middle items-center">
            <img
              :ref="(el) => tooltipButtons.push(el)"
              class="hover:-translate-y-1 transition-all hover:cursor-pointer self-center"
              src="./assets/spotify-icon.svg"
              alt="Spotify"
              @click="swapContent('spotify')"
            />
            <div
              :ref="(el) => tooltipContents.push(el)"
              role="tooltip"
              class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-[#575757] rounded-lg shadow-sm opacity-0 tooltip"
            >
              Spotify
              <div class="tooltip-arrow" data-popper-arrow />
            </div>
          </div>
          <div class="align-middle flex">
            <img
              :ref="(el) => tooltipButtons.push(el)"
              type="button"
              src="./assets/youtube-new.svg"
              class="hover:-translate-y-1 transition-all w-16 self-center hover:cursor-pointer"
              alt="Youtube"
              @click="swapContent('youtube')"
            />
            <div
              :ref="(el) => tooltipContents.push(el)"
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
            class="bg-[#484848] text-[#BCBCBC] rounded-[20px] py-[10px] tracking-widest hover:translate-x-1 transition-all"
            @click="swapContent('menu:settings')"
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
            title="Появится в YouCord Beta1.0"
          >
            Гайды
          </button>
          <button
            type="button"
            class="cursor-not-allowed bg-[#3b3b3b] text-[#BCBCBC] rounded-[20px] py-[10px] tracking-widest hover:translate-x-1 transition-all"
            title="Появится в YouCord Beta1.0"
          >
            Статистика
          </button>
          <button
            type="button"
            class="bg-gradient-to-r from-indigo-400 via-teal-500 to-indigo-700 text-[#f7f7f7] rounded-[20px] py-[10px] tracking-widest hover:translate-x-1 transition-all"
          >
            Донат
          </button>
          <div
            class="flex justify-between flex-row w-full max-h-fit text-center mt-auto self-center text-[#868686]"
          >
            <div class="text-center justify-self-center flex">YouCord Alpha1.0</div>
            <div class="text-center justify-self-center flex">by hikaru_kl</div>
          </div>
        </div>
        <div class="w-full bg-[#323232] rounded-[20px] p-3">
          <YoutubeSettings
            v-show="currentComponent == 'youtube'"
            @add-tooltip-button="(el) => tooltipButtons.push(el)"
            @add-tooltip-content="(el) => tooltipContents.push(el)"
          />
          <SpotifySettings
            v-show="currentComponent == 'spotify'"
            @add-tooltip-button="(el) => tooltipButtons.push(el)"
            @add-tooltip-content="(el) => tooltipContents.push(el)"
          />
          <YamusicSettings
            v-show="currentComponent == 'yamusic:desktop'"
            @add-tooltip-button="(el) => tooltipButtons.push(el)"
            @add-tooltip-content="(el) => tooltipContents.push(el)"
          />
          <YamusicWebSettings
            v-show="currentComponent == 'yamusic:web'"
            @add-tooltip-button="(el) => tooltipButtons.push(el)"
            @add-tooltip-content="(el) => tooltipContents.push(el)"
          />
          <MenuSettings
            v-show="currentComponent == 'menu:settings'"
            @add-tooltip-button="(el) => tooltipButtons.push(el)"
            @add-tooltip-content="(el) => tooltipContents.push(el)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
