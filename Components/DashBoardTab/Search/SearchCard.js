import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions, // ← added for screen height
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import {
  getAdvanceSearchResults,
  handleBookmark,
  logProfileVisit,
  getWishlistProfiles,
  fetchProfileDataCheck,
} from "../../../CommonApiCall/CommonApiCall";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TopAlignedImage } from "../../ReuseImageAlign/TopAlignedImage";
import { PlatinumModalPopup } from "../../ReusePopups/PlatinumModalPopup";
import { Colors } from "../../../Reusable/Theme";

// ─── Constants ────────────────────────────────────────────────────────────
const PER_PAGE = 10;
const MARRIAGE_BADGE_URI =
  "https://vysyamat.blob.core.windows.net/vysyamala/marriage_settled.jpeg";
Image.prefetch(MARRIAGE_BADGE_URI).catch(() => {});

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatLastActive = (viewed_date) => {
  if (!viewed_date) return null;
  const date = new Date(viewed_date);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Active today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return null;
};

// ─── Marriage Badge Component ────────────────────────────────────────────
const MarriageBadge = () => {
  const [badgeLoaded, setBadgeLoaded] = useState(false);
  return (
    <View style={styles.marriageBadgeOverlay}>
      <View style={styles.marriageBadgeCircle}>
        {!badgeLoaded && (
          <ActivityIndicator size="small" color={Colors.secondaryGold} />
        )}
        <Image
          source={{ uri: MARRIAGE_BADGE_URI }}
          style={[styles.marriageBadgeImg, !badgeLoaded && { opacity: 0 }]}
          resizeMode="contain"
          onLoad={() => setBadgeLoaded(true)}
          fadeDuration={150}
        />
      </View>
    </View>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────
export const SearchCard = ({ initialResults = [], initialTotalCount = 0 }) => {
  const [profiles, setProfiles] = useState(initialResults);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(
    Math.ceil(initialTotalCount / PER_PAGE) || 1
  );
  const [isLoading, setIsLoading] = useState(false);
  const [allProfileIds, setAllProfileIds] = useState({});
  const [isPlatinumModalVisible, setIsPlatinumModalVisible] = useState(false);
  const navigation = useNavigation();
  const isFetchingRef = useRef(false);

  // ─── Pagination handler ────────────────────────────────────────────────
  const handleEndReached = () => {
    if (currentPage < totalPages && !isLoading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // ─── Fetch function ────────────────────────────────────────────────────
  const loadProfiles = async (page) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const response = await getAdvanceSearchResults(PER_PAGE, page);

      if (response && response.status !== "failure") {
        const newData = Array.isArray(response.data) ? response.data : [];

        // Update profiles: replace on page 1, append otherwise
        setProfiles((prev) =>
          page === 1 ? newData : [...prev, ...newData]
        );

        // Store all_profile_ids from first page
        if (page === 1 && response.all_profile_ids) {
          setAllProfileIds(response.all_profile_ids);
        }

        // Update total pages
        if (response.total_count !== undefined) {
          setTotalPages(Math.ceil(response.total_count / PER_PAGE));
        }

        // Merge bookmarks from this page
        setBookmarkedProfiles((prevSet) => {
          const newSet = new Set(prevSet);
          newData.forEach((profile) => {
            if (profile.wish_list === 1) {
              newSet.add(profile.profile_id);
            }
          });
          return newSet;
        });
      } else {
        console.warn("No profiles found or API failure.");
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // ─── Effect: load initial data or fetch next pages ──────────────────
  useEffect(() => {
    // If we have initial results and we are on page 1, we already have data.
    // Only set bookmarks and skip API call.
    if (initialResults.length > 0 && currentPage === 1) {
      const initialBookmarks = new Set();
      initialResults.forEach((p) => {
        if (p.wish_list === 1) initialBookmarks.add(p.profile_id);
      });
      setBookmarkedProfiles((prev) => new Set([...prev, ...initialBookmarks]));
      return;
    }

    // For any other page (or if initialResults was empty), fetch from API
    loadProfiles(currentPage);
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load wishlist (for previously bookmarked profiles) ──────────────
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const response = await getWishlistProfiles();
        let wishlistData = [];
        if (Array.isArray(response)) {
          wishlistData = response;
        } else if (response && typeof response === 'object') {
          if (Array.isArray(response.data)) {
            wishlistData = response.data;
          } else if (Array.isArray(response.wishlist)) {
            wishlistData = response.wishlist;
          } else {
            wishlistData = Object.values(response).filter(Array.isArray).flat() || [];
          }
        }
        const ids = wishlistData.map((p) => p.wishlist_profileid);
        setBookmarkedProfiles((prev) => new Set([...prev, ...ids]));
      } catch (error) {
        console.error("Error loading wishlist:", error);
      }
    };
    loadWishlist();
  }, []);

  // ─── Bookmark handler ─────────────────────────────────────────────────
  const handleSavePress = async (viewedProfileId) => {
    const newStatus = bookmarkedProfiles.has(viewedProfileId) ? "0" : "1";
    const success = await handleBookmark(viewedProfileId, newStatus);
    if (success) {
      const updated = new Set(bookmarkedProfiles);
      if (newStatus === "1") {
        updated.add(viewedProfileId);
        Toast.show({
          type: "success",
          text1: "Saved",
          text2: "Profile saved to bookmarks.",
          position: "bottom",
        });
      } else {
        updated.delete(viewedProfileId);
        Toast.show({
          type: "info",
          text1: "Unsaved",
          text2: "Profile removed from bookmarks.",
          position: "bottom",
        });
      }
      setBookmarkedProfiles(updated);
      setProfiles((prev) =>
        prev.map((p) =>
          p.profile_id === viewedProfileId
            ? { ...p, wish_list: newStatus === "1" ? 1 : 0 }
            : p
        )
      );
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update bookmark.",
        position: "bottom",
      });
    }
  };

  // ─── Profile click handler ────────────────────────────────────────────
  const handleProfileClick = async (viewedProfileId) => {
    if (isLoading) return;
    try {
      const profileCheckResponse = await fetchProfileDataCheck(viewedProfileId);
      if (
        profileCheckResponse?.status === "failure" &&
        profileCheckResponse?.message === "Profile visibility restricted"
      ) {
        setIsPlatinumModalVisible(true);
        return;
      }
      if (profileCheckResponse?.status === "failure") {
        Toast.show({
          type: "error",
          text1: profileCheckResponse.message || "Access Denied",
          position: "bottom",
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
        throw new Error("Failed to log profile visit.");
      }
    } catch (error) {
      if (error?.message?.includes("Profile visibility restricted")) {
        setIsPlatinumModalVisible(true);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Unable to open profile. Please check your connection.",
          position: "bottom",
        });
      }
    }
  };

  // ─── Render each profile card ──────────────────────────────────────────
  const renderProfileCard = ({ item: profile }) => {
    const isSaved = bookmarkedProfiles.has(profile.profile_id);
    const rawImage = Array.isArray(profile.profile_img)
      ? profile.profile_img[0]
      : profile.profile_img;
    const matchScore = profile.matching_score ?? profile.matchScore ?? 0;
    const lastActive = formatLastActive(profile.viewed_date);
    const showMarriageBadge =
      profile.visited_marriage_check && !!profile.visited_marriage_badge;

    return (
      <TouchableOpacity
        onPress={() => handleProfileClick(profile.profile_id)}
        activeOpacity={0.92}
        style={styles.card}
      >
        <View style={styles.cardBody}>
          <View style={styles.imageWrapper}>
            <TopAlignedImage
              uri={rawImage}
              width={110}
              height={130}
              blurRadius={profile.photo_protection === 1 ? 15 : 0}
              style={{ borderRadius: 14 }}
            />
            {profile.photo_protection === 1 && (
              <View style={styles.lockOverlay}>
                <MaterialIcons name="lock" size={22} color="#FFFFFF" />
              </View>
            )}
            {showMarriageBadge && <MarriageBadge />}
          </View>

          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile.profile_name || "N/A"}
              </Text>
              {profile.verified === 1 && (
                <MaterialIcons
                  name="verified"
                  size={16}
                  color={Colors.primary}
                  style={{ marginLeft: 4 }}
                />
              )}
              {Number(matchScore) > 50 && (
                <View style={styles.matchChip}>
                  <Text style={styles.matchChipText}>{matchScore}% match</Text>
                </View>
              )}
            </View>

            <Text style={styles.subtext}>
              {profile.profile_id} · {profile.profile_age} yrs ·{" "}
              {profile.height?.height_desc ||
                profile.profile_height?.height_desc ||
                "N/A"}
            </Text>

            <Text style={styles.professionText} numberOfLines={1}>
              {[profile.degree, profile.profession]
                .filter((v) => v && v !== "Not mentioned" && v !== "Not working")
                .join(" · ") ||
                profile.profession ||
                "N/A"}
            </Text>

            {(profile.location || profile.city) && (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={Colors.textMuted}
                />
                <Text style={styles.locationText}>
                  {profile.location || profile.city}
                </Text>
              </View>
            )}

            <View style={styles.tagsRow}>
              {profile.star && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{profile.star}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.lastActiveText}>{lastActive || ""}</Text>
          <View style={styles.btnGroup}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleSavePress(profile.profile_id);
              }}
              style={[styles.shortlistBtn, isSaved && styles.shortlistBtnSaved]}
            >
              <MaterialIcons
                name={isSaved ? "bookmark" : "bookmark-border"}
                size={16}
                color={isSaved ? Colors.chipActiveText : Colors.textDark}
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
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Footer component ──────────────────────────────────────────────────
  const renderFooter = () => {
    if (isLoading && currentPage > 1) {
      // ★ Half‑screen loader while paginating
      return (
        <View style={styles.largeFooterLoader}>
          <ActivityIndicator size="large" color={Colors.primary || "#007AFF"} />
          <Text style={styles.loadingMoreText}>Loading more profiles…</Text>
        </View>
      );
    }
    if (!isLoading && currentPage >= totalPages && profiles.length > 0) {
      // All profiles loaded
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.endMessage}>No more profiles</Text>
        </View>
      );
    }
    // Empty footer (minimal height)
    return <View style={styles.footerLoader} />;
  };

  // ─── Full‑screen loading state (initial load with no data) ────────────
  if (isLoading && profiles.length === 0 && currentPage === 1) {
    return (
      <View style={styles.initialLoaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary || "#007AFF"} />
        <Text style={styles.initialLoaderText}>Loading profiles…</Text>
      </View>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.profile_id}
        renderItem={renderProfileCard}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.profileScrollView}
        showsVerticalScrollIndicator={true}
        initialNumToRender={PER_PAGE}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
        ListEmptyComponent={
          !isLoading && profiles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No profiles found</Text>
            </View>
          ) : null
        }
      />
      <PlatinumModalPopup
        visible={isPlatinumModalVisible}
        onClose={() => setIsPlatinumModalVisible(false)}
      />
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  profileScrollView: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
    minHeight: 60,
  },
  // ★ New style for half‑screen loader
  largeFooterLoader: {
    height: Dimensions.get('window').height * 0.5, // 50% of screen height
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textMuted || '#888',
    fontWeight: '500',
  },
  endMessage: {
    fontSize: 14,
    color: Colors.textMuted || "#888",
    fontStyle: "italic",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted || "#888",
  },
  initialLoaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  initialLoaderText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textMuted || "#888",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 12,
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
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
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
  infoCol: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textDark || "#2D2D2D",
    flexShrink: 1,
    maxWidth: "50%",
  },
  matchChip: {
    marginLeft: "auto",
    backgroundColor: Colors.secondaryGold || "#D4AF37",
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
    fontSize: 12,
    color: Colors.textMuted || "#888888",
    marginTop: 3,
  },
  professionText: {
    fontSize: 13,
    color: Colors.textDark || "#2D2D2D",
    fontWeight: "500",
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
    backgroundColor: Colors.selectedBg || "#E8E0D5",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textMuted || "#888888",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border || "#EEEEEE",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  lastActiveText: {
    fontSize: 12,
    color: Colors.textMuted || "#888888",
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
    borderColor: Colors.border || "#CCCCCC",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shortlistBtnSaved: {
    backgroundColor: Colors.chipActiveBg || "#FFE8E8",
    borderColor: "transparent",
  },
  shortlistBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textDark || "#2D2D2D",
  },
  shortlistBtnTextSaved: {
    color: Colors.chipActiveText || "#D32F2F",
  },
});