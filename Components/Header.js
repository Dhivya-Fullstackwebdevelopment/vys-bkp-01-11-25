import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchNotifications, markNotificationsAsRead } from '../CommonApiCall/CommonApiCall'; // Import the function from commonApi.js
import { LinearGradient } from 'expo-linear-gradient';


export const Header = (props) => {
  const navigation = useNavigation();
  const [notifyCount, setNotifyCount] = useState(0);
  const [buttonText, setButtonText] = useState("Upgrade");
  const [hidePlanButton, setHidePlanButton] = useState(false);

  const handleLogoClick = () => {
    console.log("Logo Clicked"); // Check your terminal/console to see if this triggers
    navigation.navigate("Home");
  };

  useEffect(() => {
    const getNotificationCount = async () => {
      try {
        const responseData = await fetchNotifications();
        if (responseData && typeof responseData.notifiy_count === 'number') {
          setNotifyCount(responseData.notifiy_count);
        } else if (responseData && typeof responseData.total_records === 'number') {
          setNotifyCount(responseData.total_records);
        } else {
          setNotifyCount(0);
        }
      } catch (error) {
        console.error(error.message);
      }
    };

    getNotificationCount();
  }, []);

  useEffect(() => {
    const determineButtonType = async () => {
      try {
        const currentPlanId = await AsyncStorage.getItem("current_plan_id");
        const validityDate = await AsyncStorage.getItem("valid_till_date"); // You need to store this during login

        const allowedPremiumIds = [1, 2, 3, 10, 11, 13, 14, 15, 16, 17];
        const planId = parseInt(currentPlanId || "0");

        let buttonType = "Upgrade";

        if (planId === 16) {
          setHidePlanButton(true);
          return;
        } else {
          setHidePlanButton(false);
        }

        if (allowedPremiumIds.includes(planId)) {
          if (validityDate) {
            const validDate = new Date(validityDate);
            const currentDate = new Date();

            if (validDate.getTime() > currentDate.getTime()) {
              buttonType = "Add-On"; // validity still active
            } else {
              buttonType = "Renew"; // validity expired
            }
          } else {
            // If no validity date, default to Upgrade
            buttonType = "Upgrade";
          }
        }

        setButtonText(buttonType);
      } catch (error) {
        console.error("Error determining button type:", error);
        setButtonText("Upgrade"); // fallback
      }
    };

    determineButtonType();
  }, []);


  const handleNotificationClick = async () => {
    try {
      await markNotificationsAsRead(); // Call the common API function

      // Reset the notification count after marking as read
      setNotifyCount(0);

      // Navigate to the Notifications screen
      navigation.navigate("Notifications");
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleUpgradeClick = () => {
    if (buttonText === "Add-On") {
      navigation.navigate('PayNow', { isAddOnOnly: true });
    } else if (buttonText === "Renew") {
      navigation.navigate('MembershipPlan');
    } else {
      navigation.navigate('MembershipPlan');
    }
  };


  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleLogoClick} activeOpacity={0.7}>
        <Image
          style={styles.logo}
          source={require("../assets/img/VysyamalaLogo.png")}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleNotificationClick}
        style={[
          styles.notificationContainer,
          hidePlanButton && { left: 0 }   // ✅ if plan hidden, remove left
        ]}
      >
        <MaterialIcons name="notifications" size={24} color="#535665" />
        {notifyCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>{notifyCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      {!hidePlanButton && (
        <TouchableOpacity onPress={handleUpgradeClick}>
          <LinearGradient
            colors={['#BD1225', '#FF4050']} // Gradient colors
            style={styles.button}
          >
            <Text style={styles.textUpgrade}>{buttonText}</Text>
            {/* <MaterialCommunityIcons name="arrow-up-circle" size={28} color="#fff" style={{ left: 5 }} /> */}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   flexDirection: "row",
  //   backgroundColor: "#fff",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  //   width: "100%",
  // },
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-between",
    // paddingHorizontal: 10,
    width: "100%",
  },

  button: {
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 7,
    width: '100%',
    marginTop: 1
  },
  textUpgrade: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logo: {
    width: 125,
    height: 100,
    resizeMode: "contain",
    // width: 132,
    // height: 30,
    // resizeMode: "cover",
  },

  bell: {
    width: 15,
    height: 15,
    resizeMode: "contain",
  },
  notificationContainer: {
    position: "relative",
    padding: 10,
    left: 59
  },
  notificationBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});