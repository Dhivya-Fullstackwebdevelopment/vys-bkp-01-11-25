import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const registerForPushNotificationsAsync = async () => {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission not granted");
      return null;
    }

    const token = (
      await Notifications.getExpoPushTokenAsync()
    ).data;

    console.log("Push Notifications Token:", token);

    return token;
  } catch (error) {
    console.error("Push token error:", error);
    return null;
  }
};