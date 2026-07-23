# English Workbook - Android APK Builder

Wraps the [English Workbook PWAs](../workbook_app_build) into installable Android APKs using Capacitor and builds them automatically on GitHub Actions.

**Developed by Dr. Ammar Kamoona (PhD, CPEng)**

## What you get

Two APKs, one per year, both built entirely on GitHub's free CI servers:

- `english-workbook-y3-debug-apk/app-debug.apk` — Year 3 English (age 8)
- `english-workbook-y5-debug-apk/app-debug.apk` — Year 5 English (age 10)

## Prerequisites — one-time GitHub setup

1. Create a GitHub account (free) at https://github.com if you don't have one.
2. Create a **new public repository** — call it whatever, e.g. `english-workbook-apk`.

## Setup (in your browser, no local install needed)

1. Copy the entire `workbook_app_build/` folder into this project directory (so the tree looks like `android_apk_build/workbook_app_build/app_y3/...`). This is your source PWA.
2. Push everything to your new GitHub repo:

   Either upload via the browser (drag-and-drop on the repo page), or if you have git:
   ```
   cd android_apk_build
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. The push triggers **`.github/workflows/build-apk.yml`** automatically. It:
   - Installs Node.js and Java 17 on a fresh Linux VM
   - Installs Capacitor via `npm install`
   - Runs `prepare.js y3` (then `y5`) to stage the correct web assets under `www/`
   - Runs `npx cap add android` on first build
   - Runs `./gradlew assembleDebug` to produce `app-debug.apk`
   - Uploads the APK as a downloadable **workflow artifact**

4. Watch it build:
   - Go to your repo → **Actions** tab
   - Click the running workflow → click either matrix job (`build (y3)` or `build (y5)`)
   - When it finishes (usually ~6–10 minutes), scroll down to **"Artifacts"**
   - Download `english-workbook-y3-debug-apk.zip` (contains `app-debug.apk`)

5. Sideload the APK onto an Android phone:
   - Copy the `.apk` to the phone via cable, email, or Drive
   - Open Files → tap the APK → **"Install"** (you may need to allow "Install unknown apps" for that source once)

## Local build (optional, faster iteration)

If you have Node + JDK 17 + Android SDK installed:

```
npm install
node prepare.js y3            # or y5
npx cap add android           # first time only
npx cap sync android
cd android
./gradlew assembleDebug
```

APK ends up at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Making a signed release APK (for Play Store or long-lived distribution)

Debug APKs are fine for personal sideloading but they're signed with a throwaway key that changes every build (meaning users have to uninstall/reinstall to update). For a real release:

1. Generate a signing keystore (only once, ever):
   ```
   keytool -genkey -v -keystore workbook.keystore -alias workbook -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add these secrets to your GitHub repo (**Settings → Secrets and variables → Actions**):
   - `KEYSTORE_BASE64` — the keystore file, base64-encoded (`base64 workbook.keystore`)
   - `KEYSTORE_PASSWORD`
   - `KEY_ALIAS` (typically `workbook`)
   - `KEY_PASSWORD`
3. Extend the workflow to decode the secret, use it to sign, and run `./gradlew assembleRelease` instead of `assembleDebug`. Say the word and I'll write that patch.

## Tips

- The **first workflow run** is slow (~10 min) because Gradle downloads the Android SDK. Later runs are ~4–6 min thanks to caching.
- If a build fails, click the failed step in the Actions log — the error is almost always clear.
- To change the app icon: replace `www/icon-192.png` and `www/icon-512.png` after `prepare.js` runs (Capacitor generates the Android icon set from these on `cap sync`).
