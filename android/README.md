# Android wrapper

The GitHub Action `.github/workflows/android-apk.yml` generates a Capacitor Android project and a **debug APK** that loads your deployed web URL.

Local:

```bash
npm i -D @capacitor/cli @capacitor/core @capacitor/android
# configure capacitor.config.ts server.url
npx cap add android
npx cap sync android
npx cap open android
```

Play-money only. No payment SDKs included.
