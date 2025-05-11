<script setup>
const services = [
  { service: 'spotify', title: 'Spotify', priority: 1 },
  { service: 'youtube', title: 'Youtube', priority: 2 },
  { service: 'yamusic', title: 'Yandex music', priority: 3 }
]

let settings = {
  autoLaunch: false,
  exitTray: false
}

const saveChanges = () => {
  let priorities = new Set()
  services.forEach((value, index) => {
    services[index].priority = Number(document.querySelector('#counter-input-' + index).value)
    priorities.add(services[index].priority)
  })
  if (priorities.size != services.length) {
    alert('Изменения не сохранены')
    return
  }
  window.electron.ipcRenderer.send('changePriority', { services: services })
}
const changeSettings = (name) => {
  window.electron.ipcRenderer.send('changeSettings', { name: name, value: settings[name] })
}
window.electron.ipcRenderer.on('setSettings', (e, data) => {
  console.log(data)
  services.forEach((el) => {
    el.priority = data.services[el.service].priority
    document.querySelector('#counter-input-' + services.indexOf(el)).value = el.priority
  })
  settings = data.settings
  for (const [key, value] of Object.entries(settings)) {
    let el = document.querySelector(`#${key}`)
    if (el) el.checked = value
  }
})
</script>

<template>
  <div class="w-full h-full p-4 bg-[#404040] rounded-[20px] text-blue-100">
    <h3 class="mb-4 font-semibold text-blue-100 text-center">Настройки YouCord</h3>
    <div class="flex flex-row justify-between">
      <div class="flex flex-col bg-[#333538] rounded-xl max-w-fit p-4">
        <h3>Настройки приоритета</h3>
        <hr class="my-2" />
        <div v-for="(service, index) in services" :key="service.service">
          <div class="grid grid-cols-2 gap-x-3">
            <label class="w-fit">{{ service.title }}</label>
            <div>
              <button
                id="decrement-button"
                type="button"
                :data-input-counter-decrement="'counter-input-' + index"
                class="flex-shrink-0 bg-[#727272] hover:bg-[#8b8b8b] inline-flex items-center justify-center rounded-md h-5 w-5 focus:ring-gray-700 focus:ring-2 focus:outline-none"
              >
                <svg
                  class="w-2.5 h-2.5 text-gray-900"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 18 2"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M1 1h16"
                  />
                </svg>
              </button>
              <input
                :id="'counter-input-' + index"
                v-model="services[index].priority"
                type="text"
                data-input-counter-min="1"
                :data-input-counter-max="services.length"
                data-input-counter
                class="flex-shrink-0 border-0 bg-transparent text-sm font-normal focus:outline-none focus:ring-0 max-w-[2.5rem] text-center cursor-default"
                placeholder=""
                readonly
                required
              />
              <button
                id="increment-button"
                type="button"
                :data-input-counter-increment="'counter-input-' + index"
                class="flex-shrink-0 bg-[#727272] hover:bg-[#8b8b8b] inline-flex items-center justify-center rounded-md h-5 w-5 focus:ring-gray-700 focus:ring-2 focus:outline-none"
              >
                <svg
                  class="w-2.5 h-2.5 text-gray-900 dark:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 18 18"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 1v16M1 9h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <button class="hover:bg-[#44474b] rounded-lg transition-all" @click="saveChanges">
          Сохранить
        </button>
      </div>
      <div class="flex flex-col py-2 gap-y-5">
        <label class="inline-flex items-center cursor-pointer">
          <input
            id="autoLaunch"
            v-model="settings.autoLaunch"
            type="checkbox"
            class="sr-only peer"
            @change="changeSettings('autoLaunch')"
          />
          <div
            class="relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer bg-gray-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:w-5 after:h-5 after:transition-all border-gray-600 peer-checked:bg-blue-600"
          />
          <span class="ms-3 text-sm font-medium text-gray-300">Открывать YouCord при загрузке</span>
        </label>
        <label class="inline-flex items-center cursor-pointer">
          <input
            id="exitTray"
            v-model="settings.exitTray"
            type="checkbox"
            class="sr-only peer"
            @change="changeSettings('exitTray')"
          />
          <div
            class="relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer bg-gray-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:w-5 after:h-5 after:transition-all border-gray-600 peer-checked:bg-blue-600"
          />
          <span class="ms-3 text-sm font-medium text-gray-300">Сворачивать при закрытии</span>
        </label>
        <label class="inline-flex items-center cursor-pointer" title="Появится в YouCord Beta1.0">
          <input type="checkbox" :value="true" class="sr-only peer" checked disabled />
          <div
            class="relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-[#999999] after:rounded-full after:w-5 after:h-5 after:transition-all border-gray-600 peer-checked:bg-[#272c33]"
          />
          <span class="ms-3 text-sm font-medium text-gray-400">Тёмный режим</span>
        </label>
      </div>
    </div>
  </div>
</template>
