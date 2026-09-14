const appConfig = require('./app.json')

module.exports = {
  ...appConfig,
  expo: {
    ...appConfig.expo,
    plugins: [
      ...(appConfig.expo.plugins || []),
      'expo-secure-store',
      '@clerk/expo',
    ],
    extra: {
      ...appConfig.expo.extra,
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST,
    },
  },
}
