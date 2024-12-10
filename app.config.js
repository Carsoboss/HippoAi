import 'dotenv/config';

export default {
  expo: {
    name: "Hippo",
    slug: "Hippo",
    description: "Alpha version of HippoAI application.",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#2F80ED"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
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
          origin: "https://hippoai.me"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY, // Loaded from .env
      eas: {
        projectId: "67a383cc-2444-43a5-9785-2d6b000200ac" // Added Project ID
      }
    }
  }
};