import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import {
  getWishlistProfiles,
  handleBookmark,
  logProfileVisit,
  fetchProfileDataCheck,
} from "../../../CommonApiCall/CommonApiCall";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import WishlistNotFound from "../../ProfileNotFound/WishlistNotFound";
import { SuggestedProfiles } from "../../HomeTab/SuggestedProfiles";
import Toast from "react-native-toast-message";
import { TopAlignedImage } from "../../../Components/ReuseImageAlign/TopAlignedImage";
import { PlatinumModalPopup } from "../../ReusePopups/PlatinumModalPopup";
import { Colors, rs } from "../../../Reusable/Theme";

const MARRIAGE_BADGE_URI =
  "https://vysyamat.blob.core.windows.net/vysyamala/marriage_settled.jpeg";
Image.prefetch(MARRIAGE_BADGE_URI).catch(() => {});

export const WishlistCard = ({ sortBy = "datetime" }) => {
  const [profiles, setProfiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const navigation = useNavigation();
  const [allProfileIds, setAllProfileIds] = useState({});
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [isPlatinumModalVisible, setIsPlatinumModalVisible] = useState(false);

  const loadProfiles = async (page = 1, isInitialLoad = false) => {
    if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad))
      return;

    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await getWishlistProfiles(10, page, sortBy);
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
          if (profile.wishlist_profile === 1) {
            bookmarkedIds.add(profile.wishlist_profileid);
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
          setBookmarkedProfiles(
            (prev) => new Set([...prev, ...bookmarkedIds])
          );
        }

        const profileIds = response.data.profiles.reduce(
          (acc, profile, index) => {
            const globalIndex = (page - 1) * 10 + index;
            acc[globalIndex] = profile.wishlist_profileid;
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
        setProfiles([]);
      }
    } catch (error) {
      console.error("Error loading wishlist profiles:", error);
      setProfiles([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadProfilesCallback = useCallback(() => {
    loadProfiles(1, true);
  }, [sortBy]);

  useFocusEffect(loadProfilesCallback);

  const handleSavePress = async (viewedProfileId) => {
    const newStatus = "0";
    const success = await handleBookmark(viewedProfileId, newStatus);

    if (success) {
      const updatedBookmarkedProfiles = new Set(bookmarkedProfiles);
      updatedBookmarkedProfiles.delete(viewedProfileId);
      setBookmarkedProfiles(updatedBookmarkedProfiles);

      setProfiles((prevProfiles) =>
        prevProfiles.filter(
          (profile) => profile.wishlist_profileid !== viewedProfileId
        )
      );

      Toast.show({
        type: "info",
        text1: "Removed",
        text2: "Profile has been removed from wishlist.",
        position: "top",
      });

      setTotalRecords((prev) => prev - 1);
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to remove profile from wishlist.",
        position: "top",
      });
    }
  };

  const handleEndReached = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      loadProfiles(currentPage + 1, false);
    }
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

  return (
    <View style={styles.profileScrollView}>
      <FlatList
        data={profiles}
        keyExtractor={(item) => String(item.wishlist_profileid)}
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
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <WishlistNotFound />
          )
        }
        renderItem={({ item }) => {
          const isMarried = Boolean(item.wishlist_marriage_check);
          const rawImage = Array.isArray(item.wishlist_Profile_img)
            ? item.wishlist_Profile_img[0]
            : item.wishlist_Profile_img;
          const matchScore = item.matching_score ?? item.matchScore ?? 0;

          const ageHeightText = `${item.wishlist_profileid || "N/A"} · ${
            item.wishlist_profile_age || "N/A"
          } yrs · ${item.wishlist_height?.height_desc || "N/A"}`;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                !isMarried && handleProfileClick(item.wishlist_profileid)
              }
              activeOpacity={isMarried ? 1 : 0.92}
            >
              <View style={styles.cardBody}>
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
                    <MarriageBadge badgeUrl={item.wishlist_marriage_badge} />
                  ) : null}
                </View>

                <View style={styles.infoCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {item?.wishlist_profile_name ||
                        item?.mutint_profile_name ||
                        "N/A"}
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
                        <Text style={styles.matchChipText}>
                          {matchScore}% match
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.subtext}>{ageHeightText}</Text>

                  <Text style={styles.professionText} numberOfLines={1}>
                    {item.wishlist_profession || "N/A"}
                  </Text>

                  {item.wishlist_star ? (
                    <View style={styles.tagsRow}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.wishlist_star}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.lastActiveText}>
                  Bookmarked on {item.wishlist_lastvisit || "N/A"}
                </Text>

                <View style={styles.btnGroup}>
                  {!isMarried && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleSavePress(item.wishlist_profileid);
                      }}
                      style={[styles.shortlistBtn, styles.shortlistBtnSaved]}
                    >
                      <MaterialIcons
                        name="bookmark"
                        size={16}
                        color={Colors.chipActiveText}
                      />
                      <Text
                        style={[
                          styles.shortlistBtnText,
                          styles.shortlistBtnTextSaved,
                        ]}
                      >
                        Saved
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  suggestedWrapper: {
    width: "100%",
    backgroundColor: "#FFDE594D",
    paddingTop: 10,
    marginTop: 20,
  },
});