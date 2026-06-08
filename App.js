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


export default function App() {

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Update to use expo-notifications for permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Push Token:", token);
    return token;
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

    // return () => {
    //   Notifications.removeNotificationSubscription(notificationReceivedListener);
    //   Notifications.removeNotificationSubscription(notificationResponseListener);
    // };

    return () => {
      if (notificationReceivedListener) notificationReceivedListener.remove();
      if (notificationResponseListener) notificationResponseListener.remove();
    };
  }, []);

  const [fontsLoaded] = useFonts({
    kaush: require("./assets/fonts/KaushanScript-Regular.ttf"),
    inter: require("./assets/fonts/Inter-VariableFont_slnt,wght.ttf"),
    // Add these:
    AntDesign: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf"),
    Ionicons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"),
  });

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProfileProvider>
        <NavigationContainer>
          <StatusBar hidden />
          <AppNavigation />
          <Toast />
        </NavigationContainer>
      </ProfileProvider>
    </GestureHandlerRootView>
  );
}
