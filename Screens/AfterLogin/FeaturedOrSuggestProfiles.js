import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { markProfileWishlist, logProfileVisit, fetchProfileDataCheck } from "../../CommonApiCall/CommonApiCall";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";
import { TopAlignedImage } from "../../Components/ReuseImageAlign/TopAlignedImage";
import { Colors, rs } from "../../Reusable/Theme";
import axios from "axios";
import config from "../../API/Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_BRIDE =
  "https://vysyamat.blob.core.windows.net/vysyamala/default_bride.png";
const DEFAULT_GROOM =
  "https://vysyamat.blob.core.windows.net/vysyamala/default_groom.png";

export const FeaturedOrSuggestProfiles = ({ route }) => {
  const navigation = useNavigation();
  const { type, profiles: initialProfiles, page: initialPage = 1 } = route.params;

  // ── State ──
  const [profiles, setProfiles] = useState(initialProfiles || []);
  const [page, setPage] = useState(initialPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(initialProfiles?.length || 0);
  const [allProfileIds, setAllProfileIds] = useState({});

  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());

  // ── Build profile ID map (preserved) ──
  useEffect(() => {
    if (profiles && profiles.length > 0) {
      const profileIds = profiles.reduce((acc, profile, index) => {
        acc[index] = profile.profile_id;
        return acc;
      }, {});
      setAllProfileIds(profileIds);
    }
  }, [profiles]);

  // ── Load more profiles ──
  const loadMoreProfiles = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const profileId =
        (await AsyncStorage.getItem("loginuser_profileId")) ||
        (await AsyncStorage.getItem("profile_id_new"));

      if (!profileId) {
        setLoadingMore(false);
        return;
      }

      const nextPage = page + 1;
      const endpoint =
        type === "featured"
          ? `${config.apiUrl}/auth/Get_Featured_List/`
          : `${config.apiUrl}/auth/Get_Suggested_List/`;

      const response = await axios.post(endpoint, {
        profile_id: profileId,
        per_page: 10,
        page_number: nextPage,
      });

      if (response.data && response.data.status === "success") {
        const newProfiles = response.data.data || [];
        const total = response.data.total_count || 0;

        if (newProfiles.length > 0) {
          setProfiles((prev) => [...prev, ...newProfiles]);
          setPage(nextPage);
          setTotalCount(total);
          // Check if we've loaded all
          setHasMore(profiles.length + newProfiles.length < total);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more profiles:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load more profiles.",
        position: "top",
      });
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Existing functions (unchanged) ──
  const handleSavePress = async (profileId) => {
    console.log("profileId", profileId);
    const updatedBookmarkedProfiles = new Set(bookmarkedProfiles);
    const newStatus = updatedBookmarkedProfiles.has(profileId) ? "0" : "1";

    try {
      await markProfileWishlist(profileId, newStatus);
      if (newStatus === "1") {
        updatedBookmarkedProfiles.add(profileId);
      } else {
        updatedBookmarkedProfiles.delete(profileId);
      }
      setBookmarkedProfiles(updatedBookmarkedProfiles);
    } catch (error) {
      // Error handling is done within the API function
    }
  };

  const getImageSource = (image) => {
    if (!image) return { uri: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%2Fimages%3Fk%3Ddefault%2Bimage&psig=AOvVaw28Px6jC5wsx4TWxwOrHJT2&ust=1726388184602000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMCfpqb_wYgDFQAAAAAdAAAAABAE' };
    if (Array.isArray(image)) {
      return { uri: image[0] };
    }
    return { uri: image };
  };

  const getDefaultImage = () => DEFAULT_BRIDE;

  const getSafeImage = (imageUrl) => {
    if (!imageUrl || String(imageUrl).trim() === "") return getDefaultImage();
    return imageUrl;
  };

  const handleProfileClick = async (viewedProfileId) => {
    const profileCheckResponse = await fetchProfileDataCheck(viewedProfileId);
    console.log('profile view msg', profileCheckResponse)

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

  // ── Render item (unchanged) ──
  const renderProfileItem = ({ item, index }) => {
    const profileId = allProfileIds[index] ?? item.profile_id;
    const isSaved = bookmarkedProfiles.has(profileId) || item.wish_list === 1;

    const rawImage = Array.isArray(item.profile_img)
      ? item.profile_img[0]
      : item.profile_img;
    const imageUri = getSafeImage(rawImage);
    const matchScore = item.matching_score ?? item.matchScore ?? 0;
    const lastActive = formatLastActive(item.viewed_date);
    const showMarriageBadge =
      item.visited_marriage_check && Boolean(item.visited_marriage_badge);

    const ageHeightText = `${item.profile_id || ''} · ${item.profile_age || ''} yrs · ${item.height?.height_desc || item.profile_height?.height_desc || 'N/A'}`;

    const degreeProfession = [item.degree, item.profession]
      .filter((v) => v && v !== "Not mentioned" && v !== "Not working")
      .join(" · ") || item.profession || "N/A";

    return (
      <TouchableOpacity
        onPress={() => handleProfileClick(profileId)}
        activeOpacity={0.92}
        style={styles.card}
      >
        <View style={styles.cardBody}>
          <View style={styles.imageWrapper}>
            <TopAlignedImage
              uri={imageUri}
              width={rs(110, 120, 130)}
              height={rs(120, 130, 140)}
              blurRadius={item.photo_protection === 1 ? 15 : 0}
              fallbackUri={getDefaultImage()}
              style={{ borderRadius: 14 }}
            />

            {item.photo_protection === 1 && (
              <View style={styles.lockOverlay}>
                <MaterialIcons name="lock" size={22} color="#FFFFFF" />
              </View>
            )}

            {showMarriageBadge ? (
              <View style={styles.marriageBadgeOverlay}>
                <View style={styles.marriageBadgeCircle}>
                  <Image
                    source={{ uri: "https://vysyamat.blob.core.windows.net/vysyamala/marriage_settled.jpeg" }}
                    style={styles.marriageBadgeImg}
                    resizeMode="contain"
                  />
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.infoCol}>
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

            <Text style={styles.subtext}>{ageHeightText}</Text>

            <Text style={styles.professionText} numberOfLines={1}>
              {degreeProfession}
            </Text>

            {(item.location || item.city) ? (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={Colors.textMuted}
                />
                <Text style={styles.locationText}>
                  {item.location || item.city}
                </Text>
              </View>
            ) : null}

            <View style={styles.tagsRow}>
              {item.star ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.star}</Text>
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
                handleSavePress(profileId);
              }}
              style={[
                styles.shortlistBtn,
                isSaved && styles.shortlistBtnSaved,
              ]}
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

  // ── Footer loader ──
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.rootContainer} edges={['top']}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Colors.primary}
          translucent={false}
        />

        <LinearGradient
          colors={[Colors.primaryGradientStart || "#A00014", Colors.primaryGradientEnd || "#4A000A"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {type === "featured" ? "Featured Profiles" : "Suggested Profiles"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {totalCount} profiles found
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.bodyContainer}>
          <FlatList
            data={profiles}
            renderItem={renderProfileItem}
            keyExtractor={(item, index) => `${item.profile_id}-${index}`}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => <Text style={styles.errorText}>No profiles found</Text>}
            ListFooterComponent={renderFooter}
            onEndReached={loadMoreProfiles}
            onEndReachedThreshold={0.3}
          />
        </View>
      </SafeAreaView>
      <BottomTabBarComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginBottom: 50,
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
  bodyContainer: {
    flex: 1,
    backgroundColor: Colors.selectedBg || "#FAF6F0",
  },
  scrollContent: {
    paddingVertical: 12,
    paddingHorizontal: rs(12, 14, 16),
    paddingBottom: 100,
  },
  errorText: {
    color: Colors.textMuted || "#71717A",
    textAlign: "center",
    padding: 20,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  card: {
    backgroundColor: Colors.cardBackground,
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
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
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
    alignItems: "center",
  },
  loadingText: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});