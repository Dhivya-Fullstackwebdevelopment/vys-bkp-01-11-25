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

// Pre-fetch badge once at module level — hits device cache on every card render
const MARRIAGE_BADGE_URI =
    "https://vysyamat.blob.core.windows.net/vysyamala/marriage_settled.jpeg";
Image.prefetch(MARRIAGE_BADGE_URI).catch(() => { });

// Android status-bar height helper
const STATUSBAR_HEIGHT =
    Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 0;

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
                    setTotalCount(newData.length);
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
                    const total = searchResults.total_count || 0;
                    setTotalCount(total);

                    if (newData.length === 0) {
                        setHasMorePages(false);
                    } else {
                        setProfiles((prev) =>
                            isLoadMore ? [...prev, ...newData] : newData
                        );
                        setPage(pageNum);
                        // Check if we've loaded everything
                        const loadedCount = isLoadMore
                            ? (profiles.length + newData.length)
                            : newData.length;
                        if (loadedCount >= total) setHasMorePages(false);
                    }

                    await AsyncStorage.setItem("totalcount", total.toString());
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

    // ─── Card renderer ────────────────────────────────────────────────────────
    const renderProfileCard = ({ item: profile }) => {
        const isSaved = bookmarkedProfiles.has(profile.profile_id);
        const rawImage = Array.isArray(profile.profile_img)
            ? profile.profile_img[0]
            : profile.profile_img;
        const imageUri = getSafeImage(rawImage);
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
                    {/* ── Profile Image ── */}
                    <View style={styles.imageWrapper}>
                        <TopAlignedImage
                            uri={imageUri}
                            width={rs(110, 120, 130)}
                            height={rs(120, 130, 140)}
                            blurRadius={profile.photo_protection === 1 ? 15 : 0}
                            fallbackUri={getDefaultImage()}
                            style={{ borderRadius: 14 }}
                        />

                        {/* Lock overlay */}
                        {profile.photo_protection === 1 && (
                            <View style={styles.lockOverlay}>
                                <MaterialIcons name="lock" size={22} color="#FFFFFF" />
                            </View>
                        )}

                        {showMarriageBadge && <MarriageBadge />}
                    </View>

                    {/* ── Info Column ── */}
                    <View style={styles.infoCol}>
                        {/* Name row */}
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
                            {/* Match chip — only when score > 50 */}
                            {Number(matchScore) > 50 && (
                                <View style={styles.matchChip}>
                                    <Text style={styles.matchChipText}>{matchScore}% match</Text>
                                </View>
                            )}
                        </View>

                        {/* ID · Age · Height */}
                        <Text style={styles.subtext}>
                            {profile.profile_id} · {profile.profile_age} yrs ·{" "}
                            {profile.height?.height_desc ||
                                profile.profile_height?.height_desc ||
                                "N/A"}
                        </Text>

                        {/* Degree · Profession */}
                        <Text style={styles.professionText} numberOfLines={1}>
                            {[profile.degree, profile.profession]
                                .filter(
                                    (v) =>
                                        v && v !== "Not mentioned" && v !== "Not working"
                                )
                                .join(" · ") ||
                                profile.profession ||
                                "N/A"}
                        </Text>

                        {/* Location */}
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

                        {/* Tags */}
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

                {/* ── Card Footer ── */}
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
        if (!loadingMore) return null;
        return (
            <View style={styles.paginationLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.paginationText}>Loading more profiles...</Text>
            </View>
        );
    };

    const displayCount = profileCount ?? totalCount ?? profiles.length;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <View style={styles.rootContainer}>
            {/* Force light-content status bar and colour it to match the header */}
            <StatusBar
                barStyle="light-content"
                backgroundColor={Colors.primary}
                translucent={false}
            />

            {/* Header — sits directly below the status bar, no gap */}
            {/* <View style={styles.header}> */}
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

            {/* Body */}
            <View style={styles.bodyContainer}>
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
            </View>

            <BottomTabBarComponent />
            <PlatinumModalPopup
                visible={showPlatinumModal}
                onClose={() => setShowPlatinumModal(false)}
            />
        </View >
    );
};

const styles = StyleSheet.create({
    /* ─── Root — replaces SafeAreaView so we control padding manually ─── */
    rootContainer: {
        flex: 1,
        backgroundColor: Colors.primary, // matches header so status bar blends
    },

    /* ─── Header ─── */
    header: {
        // backgroundColor: Colors.primary,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: rs(12, 16, 20),
        // On Android the status bar is opaque (translucent=false) so no extra top pad needed.
        // On iOS SafeAreaView handles the notch; we add a small top pad for visual breathing room.
        paddingTop: Platform.OS === "ios" ? rs(48, 52, 56) : rs(14, 16, 18),
        paddingBottom: rs(14, 16, 18),
    },
    backBtn: { padding: 4 },
    headerCenter: { flex: 1, marginLeft: 12 },
    headerTitle: {
        fontSize: rs(20, 22, 24),
        fontWeight: "700",
        color: "#FFFFFF",
    },
    headerSubtitle: {
        fontSize: rs(12, 13, 14),
        color: "rgba(255,255,255,0.80)",
        marginTop: 2,
    },
    filterIconBtn: {
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: 10,
        padding: 9,
    },

    /* ─── Body — white background beneath header ─── */
    bodyContainer: {
        flex: 1,
        backgroundColor: Colors.selectedBg ?? "#FAF6F0",
    },

    /* ─── Scroll ─── */
    scrollContent: {
        paddingVertical: 12,
        paddingHorizontal: rs(12, 14, 16),
    },

    /* ─── Card ─── */
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
        alignSelf: "flex-start",
    },

    marriageBadgeOverlay: {
        ...StyleSheet.absoluteFillObject,   // covers the full imageWrapper
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(160,160,160,0.45)", // gray tint like uploaded image bg
        borderRadius: 14,
    },

    marriageBadgeCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#F0EFEB",   // cream/off-white circle (matches badge bg)
        borderWidth: 2.5,
        borderColor: "#E2B13C",       // gold ring
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

    /* ─── Marriage badge — top-right corner, stamp style like uploaded image ─── */
    marriageBadgeCorner: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 46,
        height: 46,
        borderRadius: 23,           // perfect circle container
        // NO overflow:hidden — so the stamp JPEG is never cropped
        backgroundColor: "#F8EFE0", // matches the cream background of the stamp
        borderWidth: 2,
        borderColor: "#E2B13C",     // gold ring that matches the stamp border
        justifyContent: "center",
        alignItems: "center",
        // Drop shadow so it pops off the profile photo
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.28,
        shadowRadius: 4,
        elevation: 6,
    },
    marriageBadgePlaceholder: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F8EFE0",
        borderRadius: 23,
    },

    marriageBadgeImg: {
        width: 66,
        height: 66,
        borderRadius: 33,
    },

    /* ─── Info column ─── */
    infoCol: { flex: 1 },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "nowrap",
    },
    profileName: {
        fontSize: rs(15, 16, 17),   // +1 from before
        fontWeight: "700",
        color: Colors.textDark,
        flexShrink: 1,
        maxWidth: "50%",
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
        fontSize: 11,               // +1
    },
    subtext: {
        fontSize: 12,               // +1
        color: Colors.textMuted,
        marginTop: 3,
    },
    professionText: {
        fontSize: 13,               // +1
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
        fontSize: 12,               // +1
        color: Colors.textMuted,
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
        fontSize: 11,               // +1
        color: Colors.textMuted,
        fontWeight: "500",
    },

    /* ─── Card footer ─── */
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
        fontSize: 12,               // +1
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
        fontSize: 12,               // +1
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
        paddingHorizontal: 13,
        paddingVertical: 6,
    },
    interestBtnText: {
        fontSize: 12,               // +1
        fontWeight: "700",
        color: "#FFFFFF",
    },

    paginationLoader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
    },
    paginationText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: "500",
    },

    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 60,
    },
});