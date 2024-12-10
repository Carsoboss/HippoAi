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
      [
        "expo-router",
        {
          origin: "https://hippoai.me" // Base production URL for web
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      newArchEnabled: true // Explicitly enable new architecture
    },
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY, // Loaded from .env
      clerkRedirectUrl: "myapp://oauth-native-callback", // Mobile redirect URI for OAuth
      clerkFrontendApi: "https://clerk.hippoai.me", // Clerk Frontend API
      productionUrl: "https://hippoai.me", // Base production URL
      eas: {
        projectId: "67a383cc-2444-43a5-9785-2d6b000200ac" // Expo Application Services Project ID
      }
    }
  }
};
