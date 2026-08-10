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
import { LinearGradient } from "expo-linear-gradient";
import { SearchCard } from "../../Components/DashBoardTab/Search/SearchCard";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";
import { Colors, rs } from "../../Reusable/Theme";
import { SafeAreaView } from "react-native-safe-area-context";

export const SearchResults = ({ route }) => {
  const navigation = useNavigation();
  const { results = [], totalCount = 0 } = route.params || {};

  return (
    <SafeAreaView style={styles.rootContainer} edges={['top']}>
      {/* Configure StatusBar to match header theme */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
        translucent={false}
      />

      {/* Styled Header with LinearGradient */}
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
          <Text style={styles.headerTitle}>Search</Text>
          <Text style={styles.headerSubtitle}>{totalCount} profiles found</Text>
        </View>

        <TouchableOpacity
          style={styles.filterIconBtn}
          onPress={() => navigation.navigate("Search")}
        >
          <Ionicons name="options-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search Cards Body */}
      <View style={styles.searchResultsContainer}>
        <SearchCard initialResults={results} initialTotalCount={totalCount} />
      </View>

      <BottomTabBarComponent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(12, 16, 20),
    paddingTop: Platform.OS === "ios" ? rs(48, 52, 56) : rs(14, 16, 18),
    paddingBottom: rs(14, 16, 18),
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },

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
  searchResultsContainer: {
    flex: 1,
    backgroundColor: Colors.selectedBg ?? "#FAF6F0",
  },
});