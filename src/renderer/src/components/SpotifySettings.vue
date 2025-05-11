<script setup>
import { ref } from 'vue'
let AUTH_URL = ref('')
let IS_AUTHORIZED = ref(false)

window.electron.ipcRenderer.on('spotifyAuthURL', (e, data) => {
  AUTH_URL.value = data.auth_url
})
window.electron.ipcRenderer.on('spotifyStatus', (e, data) => {
  IS_AUTHORIZED.value = data.authorized
})
</script>

<template>
  <div class="w-full h-full p-4 gap-x-2 bg-[#404040] rounded-[20px]">
    <h3 class="font-semibold text-blue-100 text-center">Настройки Spotify</h3>
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
    <div v-else class="py-4 px-4 flex h-full w-full grow">sssss</div>
  </div>
</template>
