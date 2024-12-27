import 'dotenv/config';

export default {
  expo: {
    name: "Hippo",
    slug: "Hippo",
    description: "Alpha version of HippoAI application.",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp", // Custom scheme for deep linking
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#2F80ED"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hippoai.app" // Unique iOS app identifier
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.hippoai.app" // Unique Android package name
    },
    web: {
      bundler: "metro",
      output: "server",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      // Existing plugin for Expo Router
      [
        "expo-router",
        {
          origin: "https://hippoai.me"
        }
      ],
      // Add Sentry plugin here
      [
        "@sentry/react-native/expo",
        {
          // Organization slug and project name can be hardcoded or pulled from env
          organization: process.env.SENTRY_ORG || "hippo-o0",
          project: process.env.SENTRY_PROJECT || "hippo",
          // If you host Sentry yourself, update this URL accordingly
          url: "https://sentry.io/"
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      newArchEnabled: true // Explicitly enable new architecture
    },
    extra: {
      // Any keys you already have
      openaiApiKey: process.env.OPENAI_API_KEY,
      clerkRedirectUrl: "myapp://oauth-native-callback",
      clerkFrontendApi: "https://clerk.hippoai.me",
      productionUrl: "https://hippoai.me",
      eas: {
        projectId: "67a383cc-2444-43a5-9785-2d6b000200ac"
      },

      // Optionally, include your Sentry DSN here if you want to access it via process.env
      sentryDsn: process.env.SENTRY_DSN
    }
  }
};
