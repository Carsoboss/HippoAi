import 'dotenv/config';

export default {
  expo: {
    name: "Hippo",
    slug: "Hippo",
    descrption: "Alpha version of HippoAI application.",
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
          origin: "https://uber.dev/"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY // Loaded from .env
    }
  }
};
