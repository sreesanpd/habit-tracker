# AuraHabit 🌟

A premium, privacy-first, mobile-first static habit tracking web application designed to help you build and maintain daily routines. 

Live Demo: `https://sreesanpd.github.io/habit-tracker/` (Replace with your link!)

---

## ✨ Features
* **Daily Checklist**: A clean mobile-first today checklist.
* **Weekly Navigation**: Easily travel to past and present weeks via chevron arrows to backfill or view history. Future dates are locked automatically to prevent invalid completions.
* **Streak Badges**: Tracks active consecutive streaks. Reaching a **365-day milestone** upgrades your streak index to a years-based crown badge (`👑 1y 12d`).
* **Interactive Heatmaps**: Each habit displays its own Git-style consistency map showing completions over the last 15 weeks, color-themed to match the habit.
* **Settings & Management**: A separate dashboard to create new habits with custom colors/icons, archive active routines, or delete habits safely.

---

## 🔒 Data Backups & Synchronization

AuraHabit stores all data locally in browser `LocalStorage`. To prevent data loss and keep routines synced across devices, you have two options:

### 1. Cloud Auto-Sync (GitHub) — Recommended
AuraHabit can automatically back up your daily routines and logs to a private GitHub repository, keeping your checklist in sync across your phone, tablet, and computer without needing a third-party backend database.

#### Setup Guide:
1. Go to your GitHub account and create an **empty, private repository** (e.g., `habit-tracker-backup`).
2. Go to **Settings** > **Developer Settings** > **Personal access tokens** > **Fine-grained tokens**.
3. Click **Generate new token**.
4. Under **Repository access**, select **Only select repositories** and pick your backup repository.
5. Under **Permissions** > **Repository permissions**, find **Contents** and grant **Read and write** access.
6. Generate and copy the token.
7. Open AuraHabit, head to the **Settings/Manage** screen, and fill in your **GitHub Username**, **Repository Name**, and **PAT Token** in the Cloud Auto-Sync section.
8. Tap **Save Setup**. Your routines will now automatically sync in the background 3 seconds after any checklist change or routine edit!

### 2. PWA Code Sync (Stateless / Offline)
To sync data between devices offline or without a GitHub account:
1. **Compress**: Tap **Copy Code** on the Settings screen. This encodes your entire checklist history into a base64 string.
2. **WhatsApp / Send**: Share this sync code with your other device.
3. **Local Import**: Paste the code into the **PWA Sync** input box and tap **Import** to merge/restore your history locally.

---

## 📲 Installation & Offline Support (PWA)

AuraHabit implements a Web App Manifest and Service Worker providing full installation support and offline caching:
1. Open the live site in Safari (iOS) or Chrome (Android).
2. Tap the browser's **Share** or **Menu** button.
3. Select **Add to Home Screen**.
4. Launch AuraHabit from your home screen to enjoy the standalone, full-screen UI. 

The service worker caching strategy ensures that next time you launch the app, updates are loaded automatically from the network and stale caches are cleaned up.

---

## 🛠️ Project Structure
* `index.html` - Static application screen layouts and PWA manifest linkages.
* `style.css` - Custom styling variables, glassmorphic layout rules, heatmaps, and responsiveness.
* `app.js` - Dynamic core rendering, stats calculations, PWA service worker registration, and GitHub contents REST integration.
* `sw.js` - Service Worker caching configuration and lifecycle controls.
* `manifest.json` - PWA identity, colors, and standalone startup specifications.

