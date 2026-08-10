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
    StatusBar,
    Platform,
    Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
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

// Pre-fetch badge once at module level
const MARRIAGE_BADGE_URI =
    "https://vysyamat.blob.core.windows.net/vysyamala/marriage_settled.jpeg";
Image.prefetch(MARRIAGE_BADGE_URI).catch(() => { });

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
    const [totalCount, setTotalCount] = useState(0);

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
                position: "top",
            });
        }
    };

    const handleProfileClick = async (viewedProfileId) => {
        try {
            const profileCheckResponse = await fetchProfileDataCheck(viewedProfileId);

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
                    position: "top",
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
                    position: "top",
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
                    position: "top",
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
                    setTotalCount(newData.length);
                    setHasMorePages(false); // no pagination for profile ID search
                } else {
                    Toast.show({
                        type: "info",
                        text1: "Not Found",
                        text2: searchResults?.message || "Profile ID/Name not found.",
                        position: "top",
                    });
                    setHasMorePages(false);
                }
            } else {
                searchResults = await getAdvanceSearchResults(pageNum, 1);
                if (searchResults && searchResults.status === "success") {
                    const newData = searchResults.data || [];
                    const total = searchResults.total_count || 0;
                    setTotalCount(total);

                    if (newData.length === 0) {
                        setHasMorePages(false);
                    } else {
                        // FIX: compute loadedCount from the functional setState
                        // callback instead of the stale `profiles` closure value,
                        // so hasMorePages is calculated from the true current list.
                        setProfiles((prev) => {
                            const updated = isLoadMore ? [...prev, ...newData] : newData;

                            if (total > 0 && updated.length >= total) {
                                setHasMorePages(false);
                            } else {
                                setHasMorePages(true);
                            }

                            return updated;
                        });
                        setPage(pageNum);
                    }

                    await AsyncStorage.setItem("totalcount", total.toString());
                } else {
                    setHasMorePages(false);
                    if (!isLoadMore) {
                        Toast.show({
                            type: "info",
                            text1: "No Matches",
                            text2: "No profiles matched your filter criteria.",
                            position: "top",
                        });
                    }
                }
            }

            const dataToProcess = searchResults?.data || [];
            setBookmarkedProfiles((prevBookmarked) => {
                const bookmarkedIds = isLoadMore ? new Set(prevBookmarked) : new Set();
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
                position: "top",
            });
            // On error, prevent further load attempts
            setHasMorePages(false);
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

    const renderProfileCard = ({ item: profile }) => {
        const isSaved = bookmarkedProfiles.has(profile.profile_id);
        const rawImage = Array.isArray(profile.profile_img)
            ? profile.profile_img[0]
            : profile.profile_img;
        const imageUri = getSafeImage(rawImage);
        const matchScore = profile.matching_score ?? profile.matchScore ?? 0;
        const lastActive = formatLastActive(profile.viewed_date);
        const showMarriageBadge =
            profile.visited_marriage_check && Boolean(profile.visited_marriage_badge);

        const ageHeightText = `${profile.profile_id || ''} · ${profile.profile_age || ''} yrs · ${profile.height?.height_desc || profile.profile_height?.height_desc || 'N/A'}`;

        const degreeProfession = [profile.degree, profile.profession]
            .filter((v) => v && v !== "Not mentioned" && v !== "Not working")
            .join(" · ") || profile.profession || "N/A";

        return (
            <TouchableOpacity
                onPress={() => handleProfileClick(profile.profile_id)}
                activeOpacity={0.92}
                style={styles.card}
            >
                <View style={styles.cardBody}>
                    <View style={styles.imageWrapper}>
                        <TopAlignedImage
                            uri={imageUri}
                            width={rs(110, 120, 130)}
                            height={rs(120, 130, 140)}
                            blurRadius={profile.photo_protection === 1 ? 15 : 0}
                            fallbackUri={getDefaultImage()}
                            style={{ borderRadius: 14 }}
                        />

                        {profile.photo_protection === 1 && (
                            <View style={styles.lockOverlay}>
                                <MaterialIcons name="lock" size={22} color="#FFFFFF" />
                            </View>
                        )}

                        {showMarriageBadge ? <MarriageBadge /> : null}
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

                        <Text style={styles.subtext}>{ageHeightText}</Text>

                        <Text style={styles.professionText} numberOfLines={1}>
                            {degreeProfession}
                        </Text>

                        {(profile.location || profile.city) ? (
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
                        ) : null}

                        <View style={styles.tagsRow}>
                            {profile.star ? (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{profile.star}</Text>
                                </View>
                            ) : null}
                            {/* {profile.gothram ? (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{profile.gothram}</Text>
                                </View>
                            ) : null}
                            {profile.dosham === "No dosham" || profile.dosham === 0 ? (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>No dosham</Text>
                                </View>
                            ) : null} */}
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
                        {/* <TouchableOpacity
                            onPress={() => handleProfileClick(profile.profile_id)}
                            style={styles.interestBtn}
                        >
                            <Ionicons name="heart" size={14} color="#FFFFFF" />
                            <Text style={styles.interestBtnText}>Interest</Text>
                        </TouchableOpacity> */}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderFooter = () => {
        if (loadingMore) {
            return (
                <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={Colors.primary || "#A00014"} />
                    <Text style={styles.loadingMoreText}>Loading more profiles…</Text>
                </View>
            );
        }
        if (!hasMorePages && profiles.length > 0 && !isProfileIdSearch) {
            return (
                <View style={styles.footerLoader}>
                    <Text style={styles.endMessage}>No more profiles</Text>
                </View>
            );
        }
        return <View style={styles.footerLoader} />;
    };

    const displayCount = profileCount ?? totalCount ?? profiles.length;

    return (
        <View style={styles.rootContainer}>
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
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Search</Text>
                    <Text style={styles.headerSubtitle}>
                        {displayCount} profiles found
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.filterIconBtn}
                    onPress={() => navigation.navigate("Search")}
                >
                    <Ionicons name="options-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.bodyContainer}>
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : profiles.length > 0 ? (
                    <FlatList
                        data={profiles}
                        keyExtractor={(item) => String(item.profile_id)}
                        renderItem={renderProfileCard}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={6}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={true}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.2} // Trigger earlier
                        ListFooterComponent={renderFooter}
                    />
                ) : (
                    <View style={styles.centerContainer}>
                        <ProfileNotFound />
                    </View>
                )}
            </View>

            <BottomTabBarComponent />
            <PlatinumModalPopup
                visible={showPlatinumModal}
                onClose={() => setShowPlatinumModal(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: Colors.primary,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: rs(12, 16, 20),
        paddingTop: Platform.OS === "ios" ? rs(48, 52, 56) : rs(14, 16, 18),
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
    scrollContent: {
        paddingVertical: 12,
        paddingHorizontal: rs(12, 14, 16),
        paddingBottom: 100,
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
        fontSize: 13,          // ← was 12, now matches heroSubText/rowLabel
        color: Colors.textMuted || "#888888",
        marginTop: 3,
    },
    professionText: {
        fontSize: 13,           // ← was 13 already, kept
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
        fontSize: 12,           // ← matches factValue size
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
        fontSize: 13,           // ← was 12
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
    endMessage: {
        fontSize: 13,
        color: Colors.textMuted,
        fontStyle: "italic",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 60,
    },
});