import { StatusBar } from "expo-status-bar";
import { StyleSheet, ActivityIndicator } from "react-native"; // ✅ existing
import { useFonts } from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ProfileProvider } from "./Components/ProfileContext";
import { AppNavigation } from "./Navigation/AppNavigation";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react"; // ✅ added useState, useRef
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import TidioChat from "./Components/TidioChat";
import UpdateChecker from "./Components/UpdateChecker";
import { registerForPushNotificationsAsync } from "./utils/PushNotification";

// ✅ NEW: Popup + navigation ref
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainerRef } from "@react-navigation/native";
import VinayagarChaturthiPopup from "./Components/Popups/VinayagarChaturthiPopup";

// ✅ NEW: Constants
const FESTIVE_KEY = "vvcc2026_popup_dismissed";
const POPUP_EXPIRY = new Date("2026-09-17T23:59:59+05:30");

export default function App() {

  // ── Push notification setup (EXISTING - unchanged) ──────────────────────
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

  // ── Fonts (EXISTING - unchanged) ─────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    kaush: require("./assets/fonts/KaushanScript-Regular.ttf"),
    inter: require("./assets/fonts/Inter-VariableFont_slnt,wght.ttf"),
    AntDesign: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf"),
    Ionicons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"),
  });

  // ✅ NEW: Navigation ref — popup navigate பண்ண
  const navigationRef = useRef(null);
  // ✅ NEW: Popup state
  const [showPopup, setShowPopup] = useState(false);

  // ✅ NEW: Check popup on app open
  useEffect(() => {
    const checkPopup = async () => {
      try {
        if (new Date() > POPUP_EXPIRY) return; // Date expired → don't show
        const dismissed = await AsyncStorage.getItem(FESTIVE_KEY);
        if (!dismissed) setShowPopup(true);
      } catch (e) {
        console.log("[Popup] AsyncStorage error:", e);
      }
    };
    checkPopup();
  }, []);

  // ✅ NEW: Close popup
  const dismissPopup = async () => {
    try {
      await AsyncStorage.setItem(FESTIVE_KEY, "1");
    } catch (e) { }
    setShowPopup(false);
  };

  // ✅ NEW: Continue → navigate to event page
  const handleContinue = async () => {
    await dismissPopup();
    navigationRef.current?.navigate("VVCC2026");
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ProfileProvider>
          {/* ✅ CHANGED: ref prop added to NavigationContainer — only this line changed */}
          <NavigationContainer ref={navigationRef}>
            <StatusBar hidden />
            <AppNavigation />
            <Toast />
            <UpdateChecker />
          </NavigationContainer>
          <TidioChat />

          {/* ✅ NEW: Popup — NavigationContainer வெளியே, navigate ref மூலம் control */}
          <VinayagarChaturthiPopup
            visible={showPopup}
            onContinue={handleContinue}
            onClose={dismissPopup}
          />
        </ProfileProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}