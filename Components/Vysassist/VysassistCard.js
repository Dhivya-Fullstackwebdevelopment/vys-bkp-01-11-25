import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  getVysassistList,
  handleBookmark,
  logProfileVisit,
  fetchProfileDataCheck,
} from "../../CommonApiCall/CommonApiCall";
import { ProfileNotFound } from "../ProfileNotFound";
import { SuggestedProfiles } from "../HomeTab/SuggestedProfiles";
import { TopAlignedImage } from "../ReuseImageAlign/TopAlignedImage";
import { PlatinumModalPopup } from "../ReusePopups/PlatinumModalPopup";
import { Colors, rs } from "../../Reusable/Theme";

const MARRIAGE_BADGE_URI =
  "https://vysyamat.blob.core.windows.net/vysyamala/marriage_settled.jpeg";

// ─── Shimmer / Skeleton Loader Component ──────────────────────────────────
const VysassistCardSkeleton = () => {
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
      <View style={styles.cardBody}>
        {/* Profile Image Skeleton */}
        <Animated.View style={[styles.skeletonImage, { opacity }]} />

        {/* Info Column Skeleton */}
        <View style={styles.infoCol}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Animated.View style={[styles.skeletonText, { width: "55%", height: 16 }, { opacity }]} />
            <Animated.View style={[styles.skeletonText, { width: "25%", height: 16 }, { opacity }]} />
          </View>

          <Animated.View style={[styles.skeletonText, { width: "70%", height: 12, marginTop: 10 }, { opacity }]} />
          <Animated.View style={[styles.skeletonText, { width: "85%", height: 12, marginTop: 8 }, { opacity }]} />
          <Animated.View style={[styles.skeletonText, { width: "40%", height: 12, marginTop: 8 }, { opacity }]} />

          <View style={styles.tagsRow}>
            <Animated.View style={[styles.skeletonText, { width: 60, height: 20, borderRadius: 10 }, { opacity }]} />
          </View>
        </View>
      </View>

      {/* Card Footer Skeleton */}
      <View style={styles.cardFooter}>
        <Animated.View style={[styles.skeletonText, { width: "45%", height: 12 }, { opacity }]} />
        <Animated.View style={[styles.skeletonText, { width: 70, height: 28, borderRadius: 16 }, { opacity }]} />
      </View>
    </View>
  );
};

export const VysassistCard = ({ sortBy = "datetime" }) => {
  const [profiles, setProfiles] = useState([]);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [allProfileIds, setAllProfileIds] = useState({});
  const [isPlatinumModalVisible, setIsPlatinumModalVisible] = useState(false);

  const navigation = useNavigation();

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
      const response = await getVysassistList(perPage, page, sortBy);

      if (response && response.Status === 0) {
        setProfiles([]);
        setTotalPages(1);
        setTotalRecords(0);
        setCurrentPage(1);
        setBookmarkedProfiles(new Set());
      } else if (response && response.data) {
        const newProfiles = response.data.profiles || [];

        const bookmarkedIds = new Set();
        newProfiles.forEach((profile) => {
          if (profile.vys_profile_wishlist === 1) {
            bookmarkedIds.add(profile.vys_profileid);
          }
        });

        if (isInitialLoad) {
          setProfiles(response.data.profiles || []);
          setBookmarkedProfiles(bookmarkedIds);
        } else {
          setProfiles((prevProfiles) => [
            ...prevProfiles,
            ...newProfiles,
          ]);
          setBookmarkedProfiles((prev) => new Set([...prev, ...bookmarkedIds]));
        }

        const profileIds = response.data.profiles.reduce((acc, profile, index) => {
          const globalIndex = (page - 1) * perPage + index;
          acc[globalIndex] = profile.vys_profileid;
          return acc;
        }, {});

        setAllProfileIds((prev) => ({
          ...prev,
          ...profileIds,
        }));
        setTotalPages(response.data.total_pages || 1);
        setTotalRecords(response.data.total_records || 0);
        setCurrentPage(page);
      } else {
        console.warn("No profiles found or error in response.");
        setProfiles([]);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
      setProfiles([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleEndReached = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      loadProfiles(currentPage + 1, false);
    }
  };

  const loadProfilesCallback = useCallback(() => {
    loadProfiles(1, true);
  }, [sortBy]);

  useFocusEffect(loadProfilesCallback);

  const handleSavePress = async (viewedProfileId) => {
    const isCurrentlySaved = bookmarkedProfiles.has(viewedProfileId);
    const newStatus = isCurrentlySaved ? "0" : "1";
    const success = await handleBookmark(viewedProfileId, newStatus);

    if (success) {
      const updatedBookmarkedProfiles = new Set(bookmarkedProfiles);
      if (newStatus === "1") {
        updatedBookmarkedProfiles.add(viewedProfileId);
        Toast.show({
          type: "success",
          text1: "Saved",
          text2: "Profile has been saved to bookmarks.",
          position: "top",
        });
      } else {
        updatedBookmarkedProfiles.delete(viewedProfileId);
        Toast.show({
          type: "info",
          text1: "Unsaved",
          text2: "Profile has been removed from bookmarks.",
          position: "top",
        });
      }
      setBookmarkedProfiles(updatedBookmarkedProfiles);

      setProfiles((prevProfiles) =>
        prevProfiles.map((profile) =>
          profile.vys_profileid === viewedProfileId
            ? { ...profile, vys_profile_wishlist: newStatus === "1" ? 1 : 0 }
            : profile
        )
      );
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update bookmark status.",
        position: "top",
      });
    }
  };

  const handleProfileClick = async (viewedProfileId) => {
    try {
      const profileCheckResponse = await fetchProfileDataCheck(viewedProfileId);

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
    } catch (error) {
      console.error("Profile Click Error:", error);
      const serverMessage =
        error?.response?.data?.message || error?.message || "";
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

  const MarriageBadge = ({ badgeUrl }) => {
    const [badgeLoaded, setBadgeLoaded] = useState(false);

    return (
      <View style={styles.marriageBadgeOverlay}>
        <View style={styles.marriageBadgeCircle}>
          {!badgeLoaded && (
            <ActivityIndicator size="small" color={Colors.secondaryGold} />
          )}
          <Image
            source={{ uri: badgeUrl || MARRIAGE_BADGE_URI }}
            style={[
              styles.marriageBadgeImg,
              !badgeLoaded && { opacity: 0 },
            ]}
            resizeMode="contain"
            onLoad={() => setBadgeLoaded(true)}
            fadeDuration={150}
          />
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary || "#A00014"} />
        <Text style={styles.loadingMoreText}>Loading more profiles…</Text>
      </View>
    );
  };

  return (
    <View style={styles.profileScrollView}>
      <FlatList
        data={profiles}
        keyExtractor={(item) => String(item.vys_profileid)}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => (
          <>
            {renderFooter()}
            <View style={styles.suggestedWrapper}>
              <SuggestedProfiles />
            </View>
          </>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ width: "100%" }}>
              <VysassistCardSkeleton />
              <VysassistCardSkeleton />
              <VysassistCardSkeleton />
            </View>
          ) : (
            <ProfileNotFound />
          )
        }
        renderItem={({ item }) => {
          const isMarried = Boolean(item.visited_marriage_check);
          const isSaved = bookmarkedProfiles.has(item.vys_profileid);
          const rawImage = Array.isArray(item.vys_Profile_img)
            ? item.vys_Profile_img[0]
            : item.vys_Profile_img;

          const matchScore =
            item.vys_match_score ??
            item.matching_score ??
            item.matchScore ??
            0;

          const ageHeightText = `${item.vys_profileid || "N/A"} · ${
            item.vys_profile_age || "N/A"
          } yrs · ${item.vys_height?.height_desc || "N/A"}`;

          // Formatted Profession Text with Degree Fallback
          const professionText =
            [item.vys_degree, item.vys_profession]
              .filter((v) => v && v !== "Not mentioned" && v !== "Not working")
              .join(" · ") ||
            item.vys_profession ||
            "N/A";

          // Location extraction
          const locationText = item.vys_city || item.vys_location;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                !isMarried && handleProfileClick(item.vys_profileid)
              }
              activeOpacity={isMarried ? 1 : 0.92}
            >
              <View style={styles.cardBody}>
                {/* Profile Image Wrapper */}
                <View style={styles.imageWrapper}>
                  <TopAlignedImage
                    uri={rawImage}
                    width={rs(110, 120, 130)}
                    height={rs(120, 130, 140)}
                    blurRadius={item.photo_protection === 1 ? 15 : 0}
                    style={{ borderRadius: 14 }}
                  />

                  {item.photo_protection === 1 && (
                    <View style={styles.lockOverlay}>
                      <MaterialIcons name="lock" size={22} color="#FFFFFF" />
                    </View>
                  )}

                  {isMarried ? (
                    <MarriageBadge badgeUrl={item.visited_marriage_badge} />
                  ) : null}
                </View>

                {/* Profile Information Column */}
                <View style={styles.infoCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {item?.vys_profile_name || "N/A"}
                    </Text>

                    {item.vys_verified === 1 && (
                      <MaterialIcons
                        name="verified"
                        size={16}
                        color={Colors.primary}
                        style={{ marginLeft: 4 }}
                      />
                    )}

                    {Number(matchScore) > 50 && (
                      <View style={styles.matchChip}>
                        <Text style={styles.matchChipText}>
                          {matchScore}% match
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.subtext}>{ageHeightText}</Text>

                  <Text style={styles.professionText} numberOfLines={1}>
                    {professionText}
                  </Text>

                  {locationText ? (
                    <View style={styles.locationRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={Colors.textMuted || "#888888"}
                      />
                      <Text style={styles.locationText}>{locationText}</Text>
                    </View>
                  ) : null}

                  {item.vys_star ? (
                    <View style={styles.tagsRow}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.vys_star}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Card Footer Actions */}
              <View style={styles.cardFooter}>
                <Text style={styles.lastActiveText}>
                  Last Visit on {item.vys_lastvisit || "N/A"}
                </Text>

                <View style={styles.btnGroup}>
                  {!isMarried && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleSavePress(item.vys_profileid);
                      }}
                      style={[
                        styles.shortlistBtn,
                        isSaved && styles.shortlistBtnSaved,
                      ]}
                    >
                      <MaterialIcons
                        name={isSaved ? "bookmark" : "bookmark-border"}
                        size={16}
                        color={
                          isSaved ? Colors.chipActiveText : Colors.textDark
                        }
                      />
                      <Text
                        style={[
                          styles.shortlistBtnText,
                          isSaved && styles.shortlistBtnTextSaved,
                        ]}
                      >
                        {isSaved ? "Saved" : "Shortlist"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
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
  card: {
    backgroundColor: Colors.cardBackground || "#FFFFFF",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  cardBody: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  imageWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    alignSelf: "flex-start",
  },
  marriageBadgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(160,160,160,0.45)",
    borderRadius: 14,
  },
  marriageBadgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F0EFEB",
    borderWidth: 2.5,
    borderColor: "#E2B13C",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  marriageBadgeImg: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoCol: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  profileName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textDark,
    flexShrink: 1,
    maxWidth: "50%",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
  },
  matchChip: {
    marginLeft: "auto",
    backgroundColor: Colors.secondaryGold,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchChipText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
  },
  subtext: {
    fontSize: 13,
    color: Colors.textMuted || "#888888",
    marginTop: 3,
  },
  professionText: {
    fontSize: 13,
    color: Colors.textMuted || "#888888",
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textMuted || "#888888",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 4,
  },
  tag: {
    backgroundColor: Colors.selectedBg ?? "#E8E0D5",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  lastActiveText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  btnGroup: {
    flexDirection: "row",
    gap: 8,
  },
  shortlistBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shortlistBtnSaved: {
    backgroundColor: Colors.chipActiveBg,
    borderColor: "transparent",
  },
  shortlistBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textDark,
  },
  shortlistBtnTextSaved: {
    color: Colors.chipActiveText,
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
  suggestedWrapper: {
    width: "100%",
    backgroundColor: "transparent",
    paddingTop: 10,
    marginTop: 20,
  },
  // ── Skeleton Loader Styles ──
  skeletonImage: {
    width: rs(110, 120, 130),
    height: rs(120, 130, 140),
    borderRadius: 14,
    backgroundColor: "#E1E9EE",
  },
  skeletonText: {
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
  },
});