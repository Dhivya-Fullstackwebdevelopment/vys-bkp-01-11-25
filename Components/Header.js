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
import { fetchNotifications, markNotificationsAsRead } from '../CommonApiCall/CommonApiCall';
import { LinearGradient } from 'expo-linear-gradient';


export const Header = (props) => {
  const navigation = useNavigation();
  const [notifyCount, setNotifyCount] = useState(0);
  const [buttonText, setButtonText] = useState("Upgrade");
  const [hidePlanButton, setHidePlanButton] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileId, setProfileId] = useState("");

  const handleLogoClick = () => {
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
        const validityDate = await AsyncStorage.getItem("valid_till_date");

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
              buttonType = "Add-On";
            } else {
              buttonType = "Renew";
            }
          } else {
            buttonType = "Upgrade";
          }
        }

        setButtonText(buttonType);
      } catch (error) {
        console.error("Error determining button type:", error);
        setButtonText("Upgrade");
      }
    };
    determineButtonType();
  }, []);

  const handleNotificationClick = async () => {
    try {
      await markNotificationsAsRead();
      setNotifyCount(0);
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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const img = await AsyncStorage.getItem("profile_image");
        const id = await AsyncStorage.getItem("loginuser_profileId");
        if (img) setProfileImage(img);
        if (id) setProfileId(id);
      } catch (error) {
        console.error("Error loading profile info:", error);
      }
    };
    loadProfile();
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo - left side */}
      <TouchableOpacity onPress={handleLogoClick} activeOpacity={0.7} style={styles.logoWrapper}>
        <Image
          style={styles.logo}
          source={require("../assets/img/VysyamalaLogo.png")}
        />
      </TouchableOpacity>

      {/* Right side group: bell, add-on, profile */}
      <View style={styles.rightGroup}>
        <TouchableOpacity
          onPress={handleNotificationClick}
          style={styles.notificationContainer}
        >
          <MaterialIcons name="notifications" size={24} color="#535665" />
          {notifyCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{notifyCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {!hidePlanButton && (
          <TouchableOpacity onPress={handleUpgradeClick} style={styles.buttonWrapper}>
            <LinearGradient
              colors={['#BD1225', '#FF4050']}
              style={styles.button}
            >
              <Text style={styles.textUpgrade}>{buttonText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate("MyProfile")}
          style={styles.profileContainer}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialIcons name="person" size={20} color="#fff" />
            </View>
          )}
          <Text style={styles.profileIdText} numberOfLines={1}>{profileId}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 70,   
  },

  logoWrapper: {
    flexShrink: 0,
  },
  logo: {
    width: 110,
    height: 60,
    resizeMode: "contain",
  },

  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  notificationContainer: {
    position: "relative",
    padding: 8,
    marginRight: 4,
  },
  notificationBadge: {
    position: "absolute",
    right: 2,
    top: 2,
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  notificationText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  buttonWrapper: {
    marginRight: 8,
  },
  button: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  textUpgrade: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  profileContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop:18
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 2,
  },
  avatarPlaceholder: {
    backgroundColor: "#ED1E24",
    justifyContent: "center",
    alignItems: "center",
  },
  profileIdText: {
    color: "#535665",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "inter",
    maxWidth: 50,
  },
});