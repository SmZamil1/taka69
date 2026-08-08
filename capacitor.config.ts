const config = {
  appId: "com.taka69.app",
  appName: "TAKA69",
  webDir: "out",
  server: {
    // For production APK pointing at your deployed site, set url:
    // url: "https://your-app.vercel.app",
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
