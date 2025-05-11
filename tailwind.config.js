/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx,vue}',
    './node_modules/flowbite/**/*.js'
  ],
  theme: {
    extend: {},
    fontFamily: {
      code: [
        'gg mono',
        'Source Code Pro',
        'Consolas',
        'Andale Mono WT',
        'Andale Mono',
        'Lucida Console',
        'Lucida Sans Typewriter',
        'DejaVu Sans Mono',
        'Bitstream Vera Sans Mono',
        'Liberation Mono',
        'Nimbus Mono L',
        'Monaco',
        'Courier New',
        'Courier',
        'monospace'
      ]
    }
  },
  plugins: [require('flowbite/plugin')]
}
