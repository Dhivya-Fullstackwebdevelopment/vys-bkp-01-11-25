import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { GalleryCard } from "../../Components/Gallery/GalleryCard";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, rs } from "../../Reusable/Theme";

export const GalleryResults = () => {
  const navigation = useNavigation();

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
          <Text style={styles.headerTitle}>Gallery</Text>
          <Text style={styles.headerSubtitle}>Explore photo gallery</Text>
        </View>
      </LinearGradient>

      <View style={styles.bodyContainer}>
        <View style={styles.searchResultsContainer}>
          <GalleryCard />
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
  searchResultsContainer: {
    flex: 1,
    width: "100%",
  },
});