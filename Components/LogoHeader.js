import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { fetchNotifications } from "../CommonApiCall/CommonApiCall";
import { Colors, rs } from "../Reusable/Theme";
import { SafeAreaView } from "react-native-safe-area-context";


export const LogoHeader = (props) => {
  const navigation = useNavigation();
  const [notifyCount, setNotifyCount] = useState(0);

  useEffect(() => {
    const getNotificationCount = async () => {
      try {
        const response = await fetchNotifications();
        if (response && response.status === "success") {
          const unreadCount = response.unread_count || response.count || 0;
          setNotifyCount(unreadCount);
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    getNotificationCount();
  }, []);

  const handleNotificationClick = () => {
    navigation.navigate("Notification");
  };

  return (
    <LinearGradient
      colors={[Colors.primary || "#9B061B", Colors.primaryGradientEnd || "#52000A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.headerGradient}
    >
      <View style={styles.container}>
        {/* Brand Logo */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoBadgeContainer}>
            <Image
              style={styles.logo}
              source={require("../assets/img/VysyamalaLogo.png")}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Notification Icon with Badge */}
        <TouchableOpacity
          onPress={handleNotificationClick}
          style={styles.notificationContainer}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          {/* <View style={styles.iconCircle}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textDark || "#212121"} />
          </View>

          {notifyCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>
                {notifyCount > 9 ? "9+" : notifyCount}
              </Text>
            </View>
          )} */}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    marginHorizontal: -16,           // stretches full width
    borderBottomLeftRadius: 4,       // reduced from 0 → subtle curve
    borderBottomRightRadius: 4,      // reduced from 0 → subtle curve
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: rs(12, 16, 20),
    paddingVertical: rs(14, 18, 22), // increased height
    backgroundColor: "transparent",
  },
  logoWrapper: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logoBadgeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  logo: {
    width: rs(110, 125, 140),
    height: rs(32, 36, 40),
    resizeMode: "contain",
  },
  notificationContainer: {
    position: "relative",
    padding: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: "absolute",
    right: -2,
    top: -2,
    backgroundColor: Colors.primary || "#B72024",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});