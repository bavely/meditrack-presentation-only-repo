// app.config.js
import 'dotenv/config';

export default {
  expo: {
    name: 'meditrack-app',
    slug: 'meditrack-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/logo.png',
    scheme: 'meditrackapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
      ios: {
        supportsTablet: true,
        // Added iOS bundleIdentifier for native builds
        bundleIdentifier: "com.bavely.meditrackapp", // IMPORTANT: Replace with your actual bundle identifier
        googleServicesFile: './ios/GoogleService-Info.plist',
        // Notification configuration for iOS
        infoPlist: {
          // Background modes for notifications
          UIBackgroundModes: ['audio', 'background-processing'],
          // Custom notification sounds
          UISounds: {
            'med_alarm.wav': 'med_alarm.wav',
            'med_critical.wav': 'med_critical.wav',
            'med_alarm.caf': 'med_alarm.caf'
          },
          // Required for notifications to work properly
          UIUserNotificationSettings: {
            UIUserNotificationTypeBadge: true,
            UIUserNotificationTypeSound: true,
            UIUserNotificationTypeAlert: true
          }
        },
        // Entitlements (Critical Alerts require Apple approval)
        entitlements: {
          // Note: Critical alerts require Apple approval and special entitlement
          // "com.apple.developer.usernotifications.critical-alerts": false
          "aps-environment": "production"
        }
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/images/logo.png',
          backgroundColor: '#ffffff',
        },
        edgeToEdgeEnabled: true,
        // Added Android package name for native builds
        package: "com.bavely.meditrackapp", // IMPORTANT: Replace with your actual package name
        googleServicesFile: './google-services.json',
        // Notification permissions for Android 13+
        permissions: [
          'android.permission.POST_NOTIFICATIONS',
          'android.permission.SCHEDULE_EXACT_ALARM',
          'android.permission.USE_EXACT_ALARM',
          'android.permission.VIBRATE',
          'android.permission.WAKE_LOCK'
        ],
        // Custom notification sounds
        notificationIcon: './assets/images/logo.png',
        // Background processing permissions
        runtimeVersion: {
          policy: 'sdkVersion'
        }
      },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/logo.png',
    },
    plugins: [
      "expo-localization",
      "expo-secure-store",
      'expo-router',
      [
        "expo-notifications",
        {
          "icon": "./assets/images/logo.png",
          "color": "#4F46E5",
          "sounds": [
            "./assets/sounds/med_alarm.wav",
            "./assets/sounds/med_critical.wav",
            "./assets/sounds/med_alarm.caf"
          ],
          "mode": "production"
        }
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/logo.png',
          // imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      'react-native-edge-to-edge',
      ["expo-audio", { "microphonePermission": "Allow meditrack to access your microphone." }],
      [
        "expo-speech-recognition",
        {
          "microphonePermission": "Allow meditrack to use the microphone.",
          "speechRecognitionPermission": "Allow meditrack to use speech recognition.",
          "androidSpeechServicePackages": ["com.google.android.googlequicksearchbox"]
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      GRAPHQL_API_URL: process.env.GRAPHQL_API_URL,
      // Added EAS project ID as required for EAS builds
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID ||
          'ce52b448-f7c7-47be-952e-cd7d61a3d102', // IMPORTANT: This is the project ID from your EAS build output
      },
    },
  },
};
