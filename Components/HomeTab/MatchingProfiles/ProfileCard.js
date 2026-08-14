import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
} from "react-native";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import {
  handleBookmark,
  logProfileVisit,
  getWishlistProfiles,
  fetchProfileDataCheck,
} from "../../../CommonApiCall/CommonApiCall";
import { ProfileNotFound } from "../../ProfileNotFound";
import { SuggestedProfiles } from "../SuggestedProfiles";
import { FeaturedProfiles } from "../FeaturedProfiles";
import { TopAlignedImage } from "../../ReuseImageAlign/TopAlignedImage";
import { Dimensions } from "react-native";
import { PlatinumModalPopup } from "../../ReusePopups/PlatinumModalPopup";
// ← same theme tokens FilterScreen.js uses, so fonts/colors/spacing match exactly
import { Colors, rs } from "../../../Reusable/Theme";

// ─────────────────────────────────────────────────────────────────────────
// ProfileCard is now a PURE display component.
// It does NOT fetch its own data or manage its own pagination anymore.
// All data + pagination state comes from the parent (HomeWithToast).
//
// Props:
//   data            → array to render (matchingProfilesList OR searchResults), or null (no results)
//   isSearchMode    → true when the user has typed a search term
//   isLoadingNew    → true while a brand-new search/list fetch is in flight
//   orderBy         → "1" | "2" sort order (used only for keyExtractor cache-busting)
//   viewMode        → "list" | "grid"
//   onEndReachedMore→ callback to fetch the next page (parent decides which fn)
//   loadingMore     → true while a "load more" page fetch is in flight
//   hasMore         → true if there are more pages to load
// ─────────────────────────────────────────────────────────────────────────
export const ProfileCard = ({
  data,
  isSearchMode = false,
  isLoadingNew,
  orderBy = "1",
  viewMode = "list",
  onEndReachedMore,
  loadingMore,
  hasMore,
}) => {
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const navigation = useNavigation();
  const key = `flatlist-${viewMode}`;
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const [showPlatinumModal, setShowPlatinumModal] = useState(false);

  // ── Load wishlist/bookmark state once on mount ────────────────────────────
  useEffect(() => {
    const loadWishlistProfiles = async () => {
      try {
        const response = await getWishlistProfiles();
        if (response) {
          const profileIdsSet = new Set(
            response.map((profile) => profile.wishlist_profileid)
          );
          setBookmarkedProfiles(profileIdsSet);
        } else {
          console.log("No profiles found in response.");
        }
      } catch (error) {
        console.log("Error loading wishlist profiles:", error);
      }
    };

    loadWishlistProfiles();
  }, []);

  // ── Bookmark toggle ────────────────────────────────────────────────────────
  const handleSavePress = async (viewedProfileId) => {
    const newStatus = bookmarkedProfiles.has(viewedProfileId) ? "0" : "1";
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
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update bookmark status.",
        position: "top",
      });
    }
  };

  // ── Profile click → navigate ────────────────────────────────────────────────
  const handleProfileClick = async (viewedProfileId) => {
    try {
      const dataCheck = await fetchProfileDataCheck(viewedProfileId, "1");

      if (dataCheck?.status === "failure") {
        Toast.show({
          type: "error",
          text1: dataCheck.message,
          position: "top",
        });
        return;
      }

      const success = await logProfileVisit(viewedProfileId);
      console.log("Log visit success:", success);

      if (dataCheck.Status === "failure") {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: dataCheck.data?.Message || "Limit reached to view profile",
          position: "top",
        });
      }

      const currentProfiles = Array.isArray(data) ? data : [];

      const profileIdsForNavigation = currentProfiles.reduce(
        (acc, profile, index) => {
          acc[index + 1] = profile.profile_id;
          return acc;
        },
        {}
      );

      navigation.navigate("ProfileDetails", {
        viewedProfileId,
        allProfileIds: profileIdsForNavigation,
      });
    } catch (error) {
      const serverMessage =
        error?.response?.data?.message || error?.message || "";

      if (serverMessage === "Profile visibility restricted") {
        setShowPlatinumModal(true);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: serverMessage || "Something went wrong.",
          position: "top",
        });
      }
    }
  };

  // ← same "days ago / Active today" logic FilterScreen uses for the footer
  const formatLastActive = (viewed_date) => {
    if (!viewed_date) return null;

    const date = new Date(viewed_date);
    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 0) return null;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Active today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) {
      return diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
    }

    const diffYears = Math.floor(diffDays / 365);
    return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
  };

  // ── Pagination: end reached + footer ─────────────────────────────────────
  const handleEndReached = () => {
    if (!loadingMore && hasMore) {
      onEndReachedMore?.();
    }
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={Colors.primary || "#A00014"} />
          <Text style={styles.footerText}>Loading more profiles…</Text>
        </View>
      );
    }

    if (Array.isArray(data) && data.length > 0 && !hasMore) {
      return (
        <View style={styles.footer}>
          <Text style={styles.noMoreText}>No more profiles</Text>
        </View>
      );
    }

    return null;
  };

  const flatListProps = {
    onEndReached: handleEndReached,
    onEndReachedThreshold: 0.5,
    removeClippedSubviews: true,
    initialNumToRender: 10,
    maxToRenderPerBatch: 5,
    updateCellsBatchingPeriod: 100,
    windowSize: 21,
  };

  // ─── GRID CARD (same palette/typography as list card, larger hero image) ──
  const renderGridItem = ({ item }) => {
    const isSaved = bookmarkedProfiles.has(item.profile_id);
    const matchScore = item.matching_score ?? item.matchScore ?? 0;
    const lastActive = formatLastActive(item.viewed_date);

    return (
      <TouchableOpacity
        key={item.profile_id}
        onPress={() => handleProfileClick(item.profile_id)}
        activeOpacity={0.92}
        style={styles.gridCard}
      >
        <View style={styles.gridImageWrapper}>
          <TopAlignedImage
            uri={Array.isArray(item.profile_img) ? item.profile_img[0] : item.profile_img}
            width={SCREEN_WIDTH - 24}
            height={280}
            blurRadius={item.photo_protection === 1 ? 20 : 0}
          />
          {item.photo_protection === 1 && (
            <View style={styles.lockOverlayLarge}>
              <MaterialIcons name="lock" size={44} color="#FFFFFF" />
              <Text style={styles.lockOverlayText}>
                Click here to request password to view profile photo
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooterTop}>
          <View style={styles.nameRow}>
            <Text style={styles.profileName} numberOfLines={1}>
              {item.profile_name || "N/A"}
            </Text>
            {item.verified === 1 && (
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
            {item.profile_id} · {item.profile_age} yrs ·{" "}
            {item.height?.height_desc || item.profile_height?.height_desc || "N/A"}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.lastActiveText}>{lastActive || ""}</Text>
          <TouchableOpacity
            onPress={(e) => {
              e?.stopPropagation?.();
              handleSavePress(item.profile_id);
            }}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
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
      </TouchableOpacity>
    );
  };

  // ─── LIST CARD — matches FilterScreen.renderProfileCard exactly ──────────
  const renderSearchItem = ({ item: profile }) => {
    const isSaved = bookmarkedProfiles.has(profile.profile_id);
    const rawImage = Array.isArray(profile.profile_img)
      ? profile.profile_img[0]
      : profile.profile_img;
    const matchScore = profile.matching_score ?? profile.matchScore ?? 0;
    const lastActive = formatLastActive(profile.viewed_date);

    const degreeProfession =
      [profile.degree, profile.profession]
        .filter((v) => v && v !== "Not mentioned" && v !== "Not working")
        .join(" · ") || profile.profession || "N/A";

    return (
      <TouchableOpacity
        key={profile.profile_id}
        onPress={() => handleProfileClick(profile.profile_id)}
        activeOpacity={0.92}
        style={styles.card}
      >
        <View style={styles.cardBody}>
          <View style={styles.imageWrapper}>
            <TopAlignedImage
              uri={rawImage}
              width={rs(110, 120, 130)}
              height={rs(120, 130, 140)}
              blurRadius={profile.photo_protection === 1 ? 15 : 0}
              style={{ borderRadius: 14 }}
            />
            {profile.photo_protection === 1 && (
              <View style={styles.lockOverlay}>
                <MaterialIcons name="lock" size={22} color="#FFFFFF" />
              </View>
            )}
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
              {profile.height?.height_desc || profile.profile_height?.height_desc || "N/A"}
            </Text>

            <Text style={styles.professionText} numberOfLines={1}>
              {degreeProfession}
            </Text>

            {(profile.location || profile.city) ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.locationText}>
                  {profile.location || profile.city}
                </Text>
              </View>
            ) : null}

            <View style={styles.tagsRow}>
              {profile.star ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{profile.star}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.lastActiveText}>{lastActive || ""}</Text>
          <View style={styles.btnGroup}>
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
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

  // ── Main content renderer ────────────────────────────────────────────────
  const renderContent = () => {
    if (isLoadingNew) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary || "#BD1225"} />
          <Text style={styles.loadingText}>Searching profiles...</Text>
        </View>
      );
    }

    // Show ProfileNotFound component if data is null or an empty array
    if (data === null || (Array.isArray(data) && data.length === 0)) {
      return (
        <View style={styles.noResultsContainer}>
          <ProfileNotFound />
        </View>
      );
    }

    return (
      <View style={styles.contentWrapper}>
        <FlatList
          key={key}
          {...flatListProps}
          data={data}
          numColumns={1}
          keyExtractor={(item, index) =>
            `${item.profile_id}-${orderBy}-${viewMode}-${index}`
          }
          extraData={[orderBy, data, loadingMore, hasMore]}
          renderItem={viewMode === "grid" ? renderGridItem : renderSearchItem}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={true}
          ListFooterComponent={() => (
            <>
              {renderFooter()}
              {viewMode === "list" && !isSearchMode && (
                <View style={styles.suggestedWrapper}>
                  <SuggestedProfiles />
                  <FeaturedProfiles />
                </View>
              )}
            </>
          )}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      <PlatinumModalPopup
        visible={showPlatinumModal}
        onClose={() => setShowPlatinumModal(false)}
      />
    </View>
  );
};

// ─── Styles — mirrors FilterScreen.js card styling 1:1 ─────────────────────
const styles = StyleSheet.create({
  noMoreText: {
    color: Colors.textMuted || "#888888",
    fontSize: 13,
    fontStyle: "italic",
    paddingVertical: 5,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
  flatListContent: {
    flexGrow: 1,
    paddingHorizontal: rs(12, 14, 16),
    paddingVertical: 12,
    paddingBottom: 100,
  },

  // ── List card (matches FilterScreen.styles.card exactly) ──
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
    color: Colors.textDark || "#2D2D2D",
    flexShrink: 1,
    maxWidth: "50%",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
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
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textDark || "#2D2D2D",
  },
  shortlistBtnTextSaved: {
    color: Colors.chipActiveText || "#D32F2F",
  },

  // ── Grid card (same tokens, larger hero image) ──
  gridCard: {
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
  gridImageWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  cardFooterTop: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  lockOverlayLarge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  lockOverlayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },

  // ── Loading / empty states ──
  footer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 15,
    paddingBottom: 60,
  },
  footerText: {
    color: Colors.textMuted || "#666",
    marginTop: 6,
    fontSize: 13,
  },
  suggestedWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingTop: 10,
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textMuted || '#666',
    fontSize: 14,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 42,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
});