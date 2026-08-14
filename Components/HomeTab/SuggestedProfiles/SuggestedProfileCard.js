import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  Platform,
  Dimensions,
  // ❌ Remove LinearGradient from here
} from "react-native";
// ✅ Correct import from expo-linear-gradient
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  logProfileVisit,
  fetchProfileDataCheck,
} from "../../../CommonApiCall/CommonApiCall";
import Toast from "react-native-toast-message";
import { Colors } from "../../../Reusable/Theme";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.4;
const CARD_HEIGHT = 150;

export const SuggestedProfileCard = ({ profiles }) => {
  const navigation = useNavigation();

  const validProfiles = Array.isArray(profiles)
    ? profiles.filter((profile) => profile && profile.profile_id)
    : [];

  const handleProfileClick = async (viewedProfileId) => {
    try {
      const profileCheckResponse = await fetchProfileDataCheck(viewedProfileId);
      if (profileCheckResponse?.status === "failure") {
        Toast.show({
          type: "error",
          text1: profileCheckResponse.message,
          position: "top",
        });
        return;
      }

      const success = await logProfileVisit(viewedProfileId);
      if (success) {
        navigation.navigate("ProfileDetails", {
          viewedProfileId,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to log profile visit.",
          position: "top",
        });
      }
    } catch (error) {
      console.error("Profile Click Error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to open profile. Please check your connection.",
        position: "top",
      });
    }
  };

  const renderProfile = ({ item: profile }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => handleProfileClick(profile.profile_id)}
    >
      <Image
        source={{
          uri:
            typeof profile.profile_img === "string"
              ? profile.profile_img
              : Array.isArray(profile.profile_img)
              ? profile.profile_img[0]
              : "https://via.placeholder.com/300",
        }}
        style={styles.image}
        resizeMode="cover"
        progressiveRendering={true}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientOverlay}
      />
      <View style={styles.overlay}>
        <Text style={styles.profileName} numberOfLines={1}>
          {profile.profile_name
            ? profile.profile_name.length > 14
              ? profile.profile_name.substring(0, 14) + "..."
              : profile.profile_name
            : "N/A"}
          <Text style={styles.profileID}> ({profile.profile_id})</Text>
        </Text>
        <View style={styles.profileInfoFlex}>
          <Text style={styles.profileAge}>{profile.profile_age} Yrs</Text>
          <Text style={styles.profileHeight}>
            {profile.profile_height?.height_desc || "N/A"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!validProfiles.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No suggested profiles</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={validProfiles}
      renderItem={renderProfile}
      keyExtractor={(item) => item.profile_id.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.flatListContainer}
      snapToInterval={CARD_WIDTH + 14}
      snapToAlignment="center"
      decelerationRate="fast"
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={5}
    />
  );
};

const styles = StyleSheet.create({
  flatListContainer: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 6,
    backgroundColor: Colors.card,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: Colors.goldContainer,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: Colors.surface2,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
    borderRadius: 16,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  profileName: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
  },
  profileID: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  profileInfoFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  profileAge: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "500",
  },
  profileHeight: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "500",
  },
  curatedBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.goldContainer,
  },
  curatedText: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
});