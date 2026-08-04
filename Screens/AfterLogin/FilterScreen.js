import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

import {
  getAdvanceSearchResults,
  fetchProfileDataCheck,
  logProfileVisit,
  handleBookmark,
  Search_By_profileId,
} from "../../CommonApiCall/CommonApiCall";
import ProfileNotFound from "../../Components/ProfileNotFound";
import { TopAlignedImage } from "../../Components/ReuseImageAlign/TopAlignedImage";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";
import { PlatinumModalPopup } from "../../Components/ReusePopups/PlatinumModalPopup";
import { Colors, GlobalStyles, rs } from "../../Reusable/Theme";

const DEFAULT_BRIDE =
  "https://vysyamat.blob.core.windows.net/vysyamala/default_bride.png";
const DEFAULT_GROOM =
  "https://vysyamat.blob.core.windows.net/vysyamala/default_groom.png";

export const FilterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [showPlatinumModal, setShowPlatinumModal] = useState(false);
  const [loggedInIsFemale, setLoggedInIsFemale] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);

  const { searchProfileId, isProfileIdSearch, profileCount } =
    route.params || {};

  useEffect(() => {
    const loadLoginProfile = async () => {
      const storedId = await AsyncStorage.getItem("loginuser_profileId");
      setLoggedInIsFemale(storedId?.startsWith("VF") ?? false);
    };
    loadLoginProfile();
  }, []);

  const getDefaultImage = () =>
    loggedInIsFemale ? DEFAULT_GROOM : DEFAULT_BRIDE;

  const getSafeImage = (imageUrl) => {
    if (!imageUrl || imageUrl.trim() === "") return getDefaultImage();
    return imageUrl;
  };

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
          position: "bottom",
        });
      } else {
        updatedBookmarkedProfiles.delete(viewedProfileId);
        Toast.show({
          type: "info",
          text1: "Unsaved",
          text2: "Profile has been removed from bookmarks.",
          position: "bottom",
        });
      }
      setBookmarkedProfiles(updatedBookmarkedProfiles);
      setProfiles((prevProfiles) =>
        prevProfiles.map((profile) =>
          profile.profile_id === viewedProfileId
            ? { ...profile, wish_list: newStatus === "1" ? 1 : 0 }
            : profile
        )
      );
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update bookmark status.",
        position: "bottom",
      });
    }
  };

  const handleProfileClick = async (viewedProfileId) => {
    try {
      const profileCheckResponse = await fetchProfileDataCheck(
        viewedProfileId
      );

      if (
        profileCheckResponse?.status === "failure" &&
        profileCheckResponse?.message === "Profile visibility restricted"
      ) {
        setShowPlatinumModal(true);
        return;
      }

      if (profileCheckResponse?.status === "failure") {
        Toast.show({
          type: "error",
          text1: profileCheckResponse.message || "Unable to view profile",
          position: "bottom",
        });
        return;
      }

      const success = await logProfileVisit(viewedProfileId);

      if (success) {
        navigation.navigate("ProfileDetails", { viewedProfileId });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to log profile visit.",
          position: "bottom",
        });
      }
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
          position: "bottom",
        });
      }
    }
  };

  const executeSearch = async (pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setProfiles([]);
    }

    try {
      let searchResults;

      if (isProfileIdSearch && searchProfileId) {
        searchResults = await Search_By_profileId(searchProfileId);
        if (searchResults && searchResults.status === "success") {
          const newData = searchResults.data || [];
          setProfiles(newData);
          setHasMorePages(false);
        } else {
          Toast.show({
            type: "info",
            text1: "Not Found",
            text2: searchResults?.message || "Profile ID/Name not found.",
            position: "bottom",
          });
          setHasMorePages(false);
        }
      } else {
        searchResults = await getAdvanceSearchResults(pageNum, 1);
        if (searchResults && searchResults.status === "success") {
          const newData = searchResults.data || [];
          if (newData.length === 0) {
            setHasMorePages(false);
          } else {
            setProfiles((prev) => (isLoadMore ? [...prev, ...newData] : newData));
            setPage(pageNum);
          }

          await AsyncStorage.setItem(
            "totalcount",
            (searchResults.total_count || 0).toString()
          );
        } else {
          setHasMorePages(false);
          if (!isLoadMore) {
            Toast.show({
              type: "info",
              text1: "No Matches",
              text2: "No profiles matched your filter criteria.",
              position: "bottom",
            });
          }
        }
      }

      const dataToProcess = searchResults?.data || [];
      setBookmarkedProfiles((prevBookmarked) => {
        const bookmarkedIds = isLoadMore
          ? new Set(prevBookmarked)
          : new Set();
        dataToProcess.forEach((profile) => {
          if (profile.wish_list === 1) {
            bookmarkedIds.add(profile.profile_id);
          }
        });
        return bookmarkedIds;
      });
    } catch (error) {
      console.error("Error during search:", error);
      Toast.show({
        type: "error",
        text1: "Search Error",
        text2: "An error occurred while fetching results.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMorePages(true);
    executeSearch(1, false);
  }, [searchProfileId, isProfileIdSearch]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMorePages && !isProfileIdSearch) {
      executeSearch(page + 1, true);
    }
  };

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

  const renderProfileCard = ({ item: profile }) => {
    const isSaved = bookmarkedProfiles.has(profile.profile_id);
    const rawImage = Array.isArray(profile.profile_img)
      ? profile.profile_img[0]
      : profile.profile_img;
    const imageUri = getSafeImage(rawImage);
    const matchScore = profile.matching_score ?? profile.matchScore ?? 0;
    const lastActive = formatLastActive(profile.viewed_date);

    return (
      <TouchableOpacity
        onPress={() => handleProfileClick(profile.profile_id)}
        activeOpacity={0.92}
        style={styles.card}
      >
        <View style={styles.cardBody}>
          {/* Profile Image with Marriage Badge Overlay */}
          <View style={styles.imageWrapper}>
            <TopAlignedImage
              uri={imageUri}
              width={rs(78, 90, 100)}
              height={rs(90, 105, 115)}
              blurRadius={profile.photo_protection === 1 ? 15 : 0}
              onError={() => {}}
            />
            {profile.photo_protection === 1 && (
              <View style={styles.lockOverlay}>
                <MaterialIcons name="lock" size={20} color="#FFFFFF" />
              </View>
            )}

            {/* Marriage Badge overlay strictly for the profile image */}
            {profile.visited_marriage_check && profile.visited_marriage_badge && (
              <View style={styles.badgeOverlay} pointerEvents="none">
                <View style={styles.roundBadgeContainer}>
                  <Image
                    source={{ uri: profile.visited_marriage_badge }}
                    style={styles.marriageBadge}
                    resizeMode="contain"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Info Column */}
          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile.profile_name || "N/A"}
              </Text>
              {profile.verified === 1 && (
                <MaterialIcons
                  name="verified"
                  size={15}
                  color={Colors.primary}
                  style={{ marginLeft: 4 }}
                />
              )}
              {/* Show matching score above 50% only */}
              {Number(matchScore) > 50 && (
                <View
                  style={[
                    styles.matchChip,
                    { backgroundColor: Colors.secondaryGold },
                  ]}
                >
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
                .filter(
                  (v) =>
                    v &&
                    v !== "Not mentioned" &&
                    v !== "Not working"
                )
                .join(" · ") ||
                profile.profession ||
                "N/A"}
            </Text>

            {(profile.location || profile.city) && (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={Colors.textMuted}
                />
                <Text style={styles.locationText}>
                  {profile.location || profile.city}
                </Text>
              </View>
            )}

            <View style={styles.tagsRow}>
              {profile.star ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{profile.star}</Text>
                </View>
              ) : null}
              {profile.gothram ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{profile.gothram}</Text>
                </View>
              ) : null}
              {profile.dosham === "No dosham" || profile.dosham === 0 ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>No dosham</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.lastActiveText}>{lastActive || ""}</Text>
          <View style={styles.btnGroup}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleSavePress(profile.profile_id);
              }}
              style={[
                styles.shortlistBtn,
                isSaved && styles.shortlistBtnSaved,
              ]}
            >
              <MaterialIcons
                name={isSaved ? "bookmark" : "bookmark-border"}
                size={15}
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

            <TouchableOpacity
              onPress={() => handleProfileClick(profile.profile_id)}
              style={styles.interestBtn}
            >
              <Ionicons name="heart" size={13} color="#FFFFFF" />
              <Text style={styles.interestBtnText}>Interest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.paginationLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={GlobalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Search</Text>
          <Text style={styles.headerSubtitle}>
            {profileCount ?? profiles.length} profiles found
          </Text>
        </View>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Ionicons name="options-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Lazy Loaded List Optimization */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : profiles.length > 0 ? (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.profile_id}
          renderItem={renderProfileCard}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      ) : (
        <View style={styles.centerContainer}>
          <ProfileNotFound />
        </View>
      )}

      <BottomTabBarComponent />
      <PlatinumModalPopup
        visible={showPlatinumModal}
        onClose={() => setShowPlatinumModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(12, 16, 20),
    paddingTop: rs(14, 16, 18),
    paddingBottom: rs(16, 20, 22),
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: rs(18, 20, 22),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: rs(11, 12, 13),
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  filterIconBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: 8,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingHorizontal: rs(12, 14, 16),
  },
  card: {
    backgroundColor: Colors.cardBackground,
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
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  roundBadgeContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FAF6E9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D4A359",
    elevation: 2,
  },
  marriageBadge: {
    width: 42,
    height: 42,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  profileName: {
    fontSize: rs(14, 15, 16),
    fontWeight: "700",
    color: Colors.textDark,
    flexShrink: 1,
    maxWidth: "50%",
  },
  matchChip: {
    marginLeft: "auto",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchChipText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 10,
  },
  subtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
  professionText: {
    fontSize: 12,
    color: Colors.textDark,
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
    fontSize: 11,
    color: Colors.textMuted,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 4,
  },
  tag: {
    backgroundColor: Colors.chipInactiveBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
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
    paddingVertical: 8,
  },
  lastActiveText: {
    fontSize: 11,
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
    paddingVertical: 5,
  },
  shortlistBtnSaved: {
    backgroundColor: Colors.chipActiveBg,
    borderColor: "transparent",
  },
  shortlistBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textDark,
  },
  shortlistBtnTextSaved: {
    color: Colors.chipActiveText,
  },
  interestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  interestBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  paginationLoader: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});