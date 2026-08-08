# TAKA69 Android APK

## Quick build (Capacitor)

```bash
cd /path/to/taka69
npm install
npx cap add android   # once
# set live URL
# capacitor.config.ts server.url = https://taka69.vercel.app
npx cap sync android
cd android && ./gradlew assembleRelease
```

APK output:
`android/app/build/outputs/apk/release/app-release-unsigned.apk`

Sign with your keystore, or use debug:

```bash
cd android && ./gradlew assembleDebug
```

Debug APK:
`android/app/build/outputs/apk/debug/app-debug.apk`

## PWA install (no APK)

Open https://taka69.vercel.app in Chrome → Add to Home Screen.
