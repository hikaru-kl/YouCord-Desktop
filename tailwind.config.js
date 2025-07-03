/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx,vue}',
    './node_modules/flowbite/**/*.js'
  ],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0) translateY(0)' },
          '20%, 60%': { transform: 'translateX(-2px) translateY(-2px)' },
          '40%, 80%': { transform: 'translateX(2px) translateY(1px)' }
        },
        sparkle: {
          '0%': { opacity: '1', transform: 'translate(0, 0) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(var(--x), var(--y)) scale(0.5)' }
        }
      },
      animation: {
        shake: 'shake 0.5s',
        sparkle: 'sparkle 500ms ease-out forwards'
      }
    },
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
