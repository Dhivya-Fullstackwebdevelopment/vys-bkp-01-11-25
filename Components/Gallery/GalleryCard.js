import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
} from "react-native";

import Toast from "react-native-toast-message";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  logProfileVisit,
  getGalleryList,
  fetchProfileDataCheck,
} from "../../CommonApiCall/CommonApiCall";
import { ProfileNotFound } from "../ProfileNotFound";
import { TopAlignedImage } from "../ReuseImageAlign/TopAlignedImage";
import { PlatinumModalPopup } from "../ReusePopups/PlatinumModalPopup";
import { Colors, rs } from "../../Reusable/Theme";

// ─── Shimmer / Skeleton Loader Component ──────────────────────────────────
const GalleryCardSkeleton = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.skeletonImage, { opacity }]} />
      <Animated.View
        style={[styles.skeletonText, { width: 120, height: 16, marginTop: 10 }, { opacity }]}
      />
    </View>
  );
};

export const GalleryCard = () => {
  const [profiles, setProfiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [allProfileIds, setAllProfileIds] = useState({});
  const [totalRecords, setTotalRecords] = useState(0);
  const [isPlatinumModalVisible, setIsPlatinumModalVisible] = useState(false);

  const navigation = useNavigation();
  const SCREEN_WIDTH = Dimensions.get("window").width;

  const loadProfiles = async (page = 1, isInitialLoad = false) => {
    if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad))
      return;

    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const perPage = 10;
      const response = await getGalleryList(perPage, page);

      if (response && response.data && response.data.image_data) {
        if (isInitialLoad) {
          setProfiles(response.data.image_data || []);
        } else {
          setProfiles((prevProfiles) => [
            ...prevProfiles,
            ...(response.data.image_data || []),
          ]);
        }

        const profileIds = response.data.image_data.reduce(
          (acc, profile, index) => {
            const globalIndex = (page - 1) * 10 + index;
            acc[globalIndex] = profile.profile_id;
            return acc;
          },
          {}
        );

        setAllProfileIds((prev) => ({
          ...prev,
          ...profileIds,
        }));
        setTotalPages(response.data.total_pages || 1);
        setTotalRecords(response.data.total_records || 0);
        setCurrentPage(page);
      } else {
        console.log("No profiles found or error in response.", profiles);
        setProfiles([]);
        setError("No profiles found or error in response.");
      }
    } catch (err) {
      console.error("Error loading gallery profiles:", err);
      setError("Failed to load gallery profiles.");
      setProfiles([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadProfilesCallback = useCallback(() => {
    loadProfiles(1, true);
  }, []);

  useFocusEffect(loadProfilesCallback);

  const handleEndReached = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      loadProfiles(currentPage + 1, false);
    }
  };

  const handleProfileClick = async (viewedProfileId) => {
    try {
      const profileCheckResponse = await fetchProfileDataCheck(
        viewedProfileId
      );

      if (
        profileCheckResponse?.status === "failure" &&
        profileCheckResponse.message === "Profile visibility restricted"
      ) {
        setIsPlatinumModalVisible(true);
        return;
      }

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
          allProfileIds,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to log profile visit.",
          position: "top",
        });
      }
    } catch (err) {
      console.error("Profile Click Error:", err);
      const serverMessage =
        err?.response?.data?.message || err?.message || "";
      if (serverMessage === "Profile visibility restricted") {
        setIsPlatinumModalVisible(true);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Unable to open profile. Please check your connection.",
          position: "top",
        });
      }
    }
  };

  const renderItem = ({ item }) => {
    const rawImage = Array.isArray(item.img_url)
      ? item.img_url[0]
      : item.img_url;

    return (
      <TouchableOpacity
        key={item.profile_id}
        onPress={() => handleProfileClick(item.profile_id)}
        activeOpacity={0.92}
        style={styles.profileDiv}
      >
        <View style={styles.card}>
          <View style={styles.imageWrapper}>
            <TopAlignedImage
              uri={rawImage}
              width={SCREEN_WIDTH - rs(32, 36, 40)}
              height={380}
              style={{ borderRadius: rs(12, 14, 16) }}
            />
          </View>

          <Text style={styles.profileIdCentered}>{item.profile_id}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary || "#A00014"} />
        <Text style={styles.loadingMoreText}>Loading more photos…</Text>
      </View>
    );
  };

  return (
    <View style={styles.profileScrollView}>
      <FlatList
        data={profiles}
        keyExtractor={(item) => String(item.profile_id)}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ width: "100%" }}>
              <GalleryCardSkeleton />
              <GalleryCardSkeleton />
            </View>
          ) : (
            <ProfileNotFound />
          )
        }
      />

      <PlatinumModalPopup
        visible={isPlatinumModalVisible}
        onClose={() => setIsPlatinumModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  profileScrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingVertical: 12,
    paddingHorizontal: rs(12, 14, 16),
    paddingBottom: 100,
  },
  profileDiv: {
    width: "100%",
  },
  card: {
    backgroundColor: Colors.cardBackground || "#FFFFFF",
    borderRadius: 20,
    marginBottom: 20,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
  },
  profileIdCentered: {
    fontSize: 15,
    color: Colors.textDark || "#2D2D2D",
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  footerLoader: {
    paddingVertical: 20,
    paddingBottom: 40,
    alignItems: "center",
    minHeight: 60,
  },
  loadingMoreText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textMuted || "#71717A",
    fontWeight: "600",
  },
  // ── Skeleton Loader Styles ──
  skeletonImage: {
    width: "100%",
    height: 380,
    borderRadius: 14,
    backgroundColor: "#E1E9EE",
  },
  skeletonText: {
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
  },
});