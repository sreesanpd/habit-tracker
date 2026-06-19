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

## 🔒 Privacy-First Syncing (Zero Server Setup)
AuraHabit stores all data locally in browser `LocalStorage`. 

To sync data between multiple phones without storing your private history on public database servers, AuraHabit uses **Link-Based Sync**:
1. **Compress**: The app compresses and encodes your entire checklist history into a compact URL hash segment (`#import=...`).
2. **WhatsApp / Copy Link**: Send this sync link to yourself (e.g., via WhatsApp).
3. **Local Import**: When you click the link on another phone, the browser loads the app files, parses the hash locally, and restores your history. **Your data is never sent to GitHub Pages servers.**

---

## 📲 Installation (PWA)
Add AuraHabit to your mobile device's home screen:
1. Open the live site in Safari (iOS) or Chrome (Android).
2. Tap the **Share** or **Menu** button.
3. Select **Add to Home Screen**.

---

## 🛠️ Project Structure
* `index.html` - Static application screen layouts.
* `style.css` - Custom styling variable definitions, animations, and typography.
* `app.js` - Dynamic core rendering, calculations, and local storage handlers.
