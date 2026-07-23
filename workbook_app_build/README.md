# 52-Week English Workbook Apps
### Developed by Dr. Ammar Kamoona (PhD, CPEng)

Two Progressive Web Apps (PWAs) — one for Year 3 (age 8) and one for Year 5 (age 10) — covering the full 52-week Victorian Curriculum 2.0 English series, mirroring the printed student workbooks section-for-section.

## What's included per app

Each of the 52 weeks has all 8 sections from the printed workbook, now interactive:

1. **Vocabulary** – 15–20 words with meaning, synonym, example, and a 🔊 speak button (uses device text-to-speech)
2. **Grammar** – focus, note, worked examples, editable practice with saved input
3. **Punctuation** – focus, examples, editable practice
4. **Spelling** – word list you can tap to hear, plus typed practice
5. **Reading Comprehension** – full story, "read aloud" button, auto-graded MCQs, short-answer + inference + vocab-in-context textareas
6. **Writing** – prompt, plan area, main writing area with live word counter, auto-saved
7. **Thinking Challenge** – interactive riddle with answer-check, analogies, unscramble puzzles with instant grading, crossword clues, and a real 10×10 word-search grid you can tap to mark
8. **Weekly Review Quiz** – auto-graded vocabulary matching, grammar quiz, TTS dictation, and short writing task

**Plus:**
- Home dashboard showing next week to attempt, star total, and per-term progress
- All 52 weeks browsable with theme illustrations
- Progress tracker with per-term progress bars and a 52-cell heat-map grid
- Reward scheme: 5 stars per section, 20 for a completed week, 15 unlockable stickers (one every 4 weeks finished)
- Confetti + celebration modal when a week is completed
- Progress saved on-device via localStorage — no accounts, no cloud, fully private
- Works offline once loaded (service worker caches app shell + content JSON + illustrations)

## How to run

**Fastest test on desktop** — any modern browser:

```
cd workbook_app_build
python3 -m http.server 8000
# then open http://localhost:8000/app_y3/ or /app_y5/
```

You need a real HTTP server (not `file://`) because service workers and `fetch` won't work from disk.

**Install on Android phone/tablet as an app:**

1. Host the folder on any web server (any static hosting works — GitHub Pages, Netlify, Vercel, a Raspberry Pi, or your own domain)
2. Open the URL in Chrome on Android
3. Tap the ⋮ menu → **"Install app"** or **"Add to Home Screen"**
4. The app installs like a native app: full-screen, its own icon, works offline after first load

**iOS**: same idea — Safari → Share → **"Add to Home Screen"**.

**To turn into a real .apk** (optional):

Install [Capacitor](https://capacitorjs.com/) locally, then:

```
npm i -g @capacitor/cli
npx cap init "Year 3 English" com.ammarkamoona.workbook.y3 --web-dir=app_y3
npx cap add android
npx cap sync
npx cap open android    # opens Android Studio → Build → Generate Signed Bundle → APK
```

Repeat for Year 5.

## Folder structure

```
workbook_app_build/
├── README.md              (this file)
├── content_y3.json        (Year 3 curriculum data, ~400KB)
├── content_y5.json        (Year 5 curriculum data, ~440KB)
├── common/
│   ├── app.js             (shared single-page router + all screens)
│   ├── styles.css         (kid-friendly design system)
│   └── images/            (58 AI-generated illustrations)
├── app_y3/                (Year 3 app - coral pink theme)
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js              (offline service worker)
│   ├── icon-192.png
│   └── icon-512.png
└── app_y5/                (Year 5 app - ocean blue theme)
    ├── index.html
    ├── manifest.webmanifest
    ├── sw.js
    ├── icon-192.png
    └── icon-512.png
```

## Data model

All progress is stored in `localStorage` keyed by year:

```js
{
  stars: 145,
  streak: 7,
  stickers: ["⭐","🌟","🎨"],
  weeks: {
    1: {sections: {vocab: true, grammar: true, ...}, done: true, quizScore: 12},
    2: {sections: {vocab: true, grammar: true}, done: false},
    ...
  }
}
```

Clearing browser data resets everything. To back up progress, export `localStorage` via DevTools or add an export button (I can add that in a follow-up).

## Attribution

**52-Week English Workbook Series**
Aligned to Victorian Curriculum 2.0 English (Levels 3 and 5)
Developed by **Dr. Ammar Kamoona (PhD, CPEng)**
