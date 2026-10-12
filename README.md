# Hexa

Columns-style falling triplet puzzle (React Native + **Expo SDK 57**).

## Run

```bash
npm install
npm start
```

Launch shows an **intro** screen (Play / Settings). App icons live in `assets/icon.png` and `assets/adaptive-icon-foreground.png` (1024×1024, Android adaptive foreground).

## Android APK (local)

Native `android/` is generated with Expo prebuild (not checked in until you run prebuild).

```bash
npm run prebuild:android   # first time, or after app.json / native module changes (expo-audio, etc.)
npm run apk:release        # output: android/app/build/outputs/apk/release/app-release.apk
```

Debug APK (faster, for dev): `npm run apk:debug`

## EAS Build (cloud)

Project: [@mike008/hexa-game](https://expo.dev/accounts/mike008/projects/hexa-game) (`app.json` → `extra.eas.projectId`).

1. Initialize git (EAS requires a repo with at least one commit):
   ```bash
   git init
   git add .
   git commit -m "Prepare for EAS Build"
   ```
2. Log in: `npx eas login`
3. Install deps: `npm install`
4. Build:
   - **Preview APK** (install on device): `npm run eas:preview`
   - **Production AAB** (Play Store): `npm run eas:production`
   - **iOS**: `npm run eas:ios` (Apple credentials required)

EAS runs **Prebuild** from `app.json` (local `android/` is ignored on upload via `.easignore`). After changing native plugins or `app.json` Android/iOS settings, cloud builds pick them up automatically; for local Gradle builds run `npm run prebuild:android` again.

First Android build: EAS will prompt to create a **keystore** (or upload your own). Use `eas credentials` to manage signing.

## Settings

- **Level mode** — reach cumulative score targets through level 5 to win.
- **Endless mode** — survive for high score; no stage win.
- **Career mode** — same promotion ladder as Candy Break (level 5 clear = 1 win).

## Controls

On-screen: move left/right, soft drop, rotate (order only, no extra gravity step).

Board: **8×14** playable cells; spawn uses two hidden rows above (`row -2`).
