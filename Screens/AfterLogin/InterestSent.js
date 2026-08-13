import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { InterestSentCard } from "../../Components/DashBoardTab/InterestSent/InterestSentCard";
import { getInterestsListCount } from "../../CommonApiCall/CommonApiCall";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, rs } from "../../Reusable/Theme";

export const InterestSent = () => {
  const navigation = useNavigation();
  const [count, setCount] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false); // false = datetime, true = profile_id
  const [isLoading, setIsLoading] = useState(false);
  const sortBy = isEnabled ? "profile_id" : "datetime";

  const toggleSwitch = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setIsEnabled((previousState) => !previousState);
    } catch (error) {
      console.error("Error toggling sort:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const fetchedProfiles = await getInterestsListCount();
        setCount(fetchedProfiles?.myint_count || 0);
      } catch (error) {
        console.log("Error fetching interest sent count:", error);
        setCount(0);
      }
    };
    fetchProfiles();
  }, []);

  return (
    <SafeAreaView style={styles.rootContainer} edges={["top"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
        translucent={false}
      />

      {/* Modern Gradient Header */}
      <LinearGradient
        colors={[
          Colors.primaryGradientStart || "#A00014",
          Colors.primaryGradientEnd || "#4A000A",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Interest Sent</Text>
          <Text style={styles.headerSubtitle}>{count} interests sent</Text>
        </View>
      </LinearGradient>

      <View style={styles.bodyContainer}>
        {/* Sort Container Bar */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>
            Sort by: {isEnabled ? "Profile ID" : "Date"}
          </Text>
          <Switch
            trackColor={{ false: "#767577", true: Colors.primary }}
            thumbColor={isEnabled ? Colors.secondaryGold : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isEnabled}
            disabled={isLoading}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>

        {/* Card List Container */}
        <View style={styles.cardContainer}>
          <InterestSentCard sortBy={sortBy} />
        </View>
      </View>

      <BottomTabBarComponent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(12, 16, 20),
    paddingTop: rs(14, 16, 18),
    paddingBottom: rs(14, 16, 18),
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: rs(12, 13, 14),
    color: "rgba(255,255,255,0.80)",
    marginTop: 2,
  },
  filterIconBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    padding: 9,
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: Colors.selectedBg ?? "#FAF6F0",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.cardBackground || "#FFFFFF",
    marginHorizontal: rs(12, 14, 16),
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textDark,
  },
  cardContainer: {
    flex: 1,
    width: "100%",
  },
});