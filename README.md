# 🎧 YouCord

**YouCord** is a Windows application that displays your current YouTube video progress, Spotify playback (with real-time lyrics), and Yandex Music activity directly in your Discord status.

## 🚀 Installation

1. Go to the [Releases](https://github.com/hikaru-kl/YouCord-Desktop/releases) page  
2. Download the latest `youcord-desktop-[latest version]-setup.exe`  
3. Run the installer and launch the app

> 📌 YouCord works right out of the box — no extra setup is required for Spotify integration (just log in inside the app).

## 🌐 Web Integration (YouTube & Yandex Music)

To display status from **YouTube** and the **web version of Yandex Music**, you need to install [Tampermonkey](https://www.tampermonkey.net/) in your browser and add custom scripts.

### 🔧 Setup Instructions:

1. Install the Tampermonkey extension for your browser (Chrome, Edge, etc.)
2. Add the following userscripts from this repository:
   - [`web-plugins/youtube.js`](https://github.com/hikaru-kl/YouCord-Desktop/blob/main/web-plugins/youtube.js)
   - [`web-plugins/yamusic.js`](https://github.com/hikaru-kl/YouCord-Desktop/blob/main/web-plugins/yamusic.js)
3. Reload the YouTube or Yandex Music page in your browser

> ✅ These scripts allow YouCord to receive playback data directly from your browser tabs.

## ⚙️ Features

- Shows what you're watching or listening to in real time on Discord
- Supports:
  - YouTube (via Tampermonkey script)
  - Spotify (native integration with lyrics)
  - Yandex Music (via Tampermonkey script with lyrics)
- Clean and user-friendly interface
- Flexible configuration — show only what you want

## 🛠️ Customization

YouCord offers fine-grained control over what gets shared to Discord. Don’t want to show song lyrics or video progress? You can disable individual elements directly in the app settings — no restart needed.

## 💬 Feedback & Support

Have a bug to report or an idea to suggest?  
Open an [issue](https://github.com/hikaru-kl/YouCord-Desktop/issues) or start a conversation in **Discussions**.

## 📄 License

This project is licensed under the [MIT License](LICENSE).