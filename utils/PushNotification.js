import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ─── PROJECT ID ────────────────────────────────────────────────────────────────
// Keep this in sync with app.json extra.eas.projectId
const EXPO_PROJECT_ID = "ec179e54-62e0-4044-ae3b-11e485cc4d43";

/**
 * Requests notification permissions and returns an Expo push token.
 *
 * Returns the token string on success, or null if permission is denied
 * or token fetch fails.
 *
 * Use this single function everywhere (App.js, LoginPage, OtpVerifyLogin, etc.)
 * Do NOT call getDevicePushTokenAsync — it bypasses Expo's FCM routing and
 * breaks in production AAB builds where Firebase may not be fully initialized
 * before JS runs.
 */
export const registerForPushNotificationsAsync = async () => {
  try {
    // Android requires a notification channel before requesting permissions
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // Check current permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request if not yet granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("[PushNotification] Permission not granted.");
      return null;
    }

    // Get Expo push token — this works in both Expo Go and production builds
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });

    const token = tokenData.data; // e.g. "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
    console.log("[PushNotification] Token:", token);
    return token;

  } catch (error) {
    console.error("[PushNotification] Error:", error.message);
    return null;
  }
};