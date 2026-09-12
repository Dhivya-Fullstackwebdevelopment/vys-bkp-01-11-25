import { StatusBar } from "expo-status-bar";
import { StyleSheet, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ProfileProvider } from "./Components/ProfileContext";
import { AppNavigation } from "./Navigation/AppNavigation";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import TidioChat from "./Components/TidioChat";
import UpdateChecker from "./Components/UpdateChecker";

// Use the shared utility — do NOT duplicate registration logic here
import { registerForPushNotificationsAsync } from "./utils/PushNotification";

export default function App() {

  // ── Push notification setup ──────────────────────────────────────────────
  useEffect(() => {
    // Register once on app mount; token is logged inside the utility
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

    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[App] Notification received:", notification);
      }
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("[App] Notification response:", response);
      }
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  // ── Fonts ────────────────────────────────────────────────────────────────
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
            <UpdateChecker />
          </NavigationContainer>
          <TidioChat />
        </ProfileProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}