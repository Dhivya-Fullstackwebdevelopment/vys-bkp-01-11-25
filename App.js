import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useFonts } from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ProfileProvider } from "./Components/ProfileContext";
import { AppNavigation } from "./Navigation/AppNavigation";
import * as Notifications from 'expo-notifications';
import { Platform, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // ← ADD THIS
import TidioChat from "./Components/TidioChat";

export default function App() {

  const registerForPushNotificationsAsync = async () => {
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndrousidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
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

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const notificationReceivedListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification Received:", notification);
    });

    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification Response Received:", response);
    });

    return () => {
      if (notificationReceivedListener) notificationReceivedListener.remove();
      if (notificationResponseListener) notificationResponseListener.remove();
    };
  }, []);

  const [fontsLoaded] = useFonts({
    kaush: require("./assets/fonts/KaushanScript-Regular.ttf"),
    inter: require("./assets/fonts/Inter-VariableFont_slnt,wght.ttf"),
    AntDesign: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf"),
    Ionicons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"),
  });

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ProfileProvider>
          <NavigationContainer>
            <StatusBar hidden />
            <AppNavigation />
            <Toast />
          </NavigationContainer>
          <TidioChat />
        </ProfileProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}