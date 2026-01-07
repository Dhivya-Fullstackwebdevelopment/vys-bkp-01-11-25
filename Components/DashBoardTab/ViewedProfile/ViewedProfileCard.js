import React, { useState, useEffect, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { fetchViewedProfiles, markProfileWishlist, logProfileVisit, fetchProfileDataCheck } from "../../../CommonApiCall/CommonApiCall";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ProfileNotFound } from "../../ProfileNotFound";
import { SuggestedProfiles } from "../../HomeTab/SuggestedProfiles";
import { TopAlignedImage } from "../../ReuseImageAlign/TopAlignedImage";
//import { PlatinumModalPopup } from "../../ReusePopups/PlatinumModalPopup";

export const ViewedProfileCard = ({ sortBy = "datetime" }) => {
    const navigation = useNavigation();
    const [profiles, setProfiles] = useState([]);
    const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [allProfileIds, setAllProfileIds] = useState({});
    //const [isPlatinumVisible, setIsPlatinumVisible] = useState(false); // 👈 ADD THIS

    // const loadProfiles = async (page = 1, isInitialLoad = false) => {
    //     if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad)) return;

    //     if (isInitialLoad) {
    //         setIsLoading(true);
    //     } else {
    //         setIsLoadingMore(true);
    //     }

    //     try {
    //         const perPage = 10;
    //         const response = await fetchViewedProfiles(perPage, page);

    //         if (response && response.Status === 0) {
    //             setProfiles([]);
    //             setTotalPages(1);
    //             setTotalRecords(0);
    //             setCurrentPage(1);
    //         } else if (response && response.data) {
    //             const newProfiles = response.data.profiles || [];
    //             if (isInitialLoad) {
    //                 setProfiles(newProfiles);
    //             } else {
    //                 setProfiles((prevProfiles) => [...prevProfiles, ...newProfiles]);
    //             }

    //             // Update profile IDs mapping
    //             const profileIds = newProfiles.reduce((acc, profile, index) => {
    //                 const globalIndex = (page - 1) * 10 + index; // Calculate global index based on page
    //                 acc[globalIndex] = profile.visited_profileid;
    //                 return acc;
    //             }, {});

    //             setAllProfileIds(prev => ({
    //                 ...prev,
    //                 ...profileIds
    //             }));
    //             setTotalPages(response.data.total_pages || 1);
    //             setTotalRecords(response.data.total_records || 0);
    //             setCurrentPage(page);
    //         }
    //     } catch (error) {
    //         console.error("Error loading profiles:", error);
    //         setProfiles([]);
    //     } finally {
    //         setIsLoading(false);
    //         setIsLoadingMore(false);
    //     }
    // };

    const loadProfiles = async (page = 1, isInitialLoad = false) => {
        if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad)) return;

        if (isInitialLoad) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const perPage = 10;
            const response = await fetchViewedProfiles(perPage, page, sortBy); // Pass sortBy here

            if (response && response.Status === 0) {
                setProfiles([]);
                setTotalPages(1);
                setTotalRecords(0);
                setCurrentPage(1);
                setBookmarkedProfiles(new Set());
            } else if (response && response.data) {
                const newProfiles = response.data.profiles || [];

                const bookmarkedIds = new Set();
                newProfiles.forEach(profile => {
                    if (profile.visited_profile_wishlist === 1) {
                        bookmarkedIds.add(profile.visited_profileid);
                    }
                });

                if (isInitialLoad) {
                    setProfiles(newProfiles);
                    setBookmarkedProfiles(bookmarkedIds);
                } else {
                    setProfiles((prevProfiles) => [...prevProfiles, ...newProfiles]);
                    setBookmarkedProfiles(prev => new Set([...prev, ...bookmarkedIds]));
                }

                const profileIds = newProfiles.reduce((acc, profile, index) => {
                    const globalIndex = (page - 1) * 10 + index;
                    acc[globalIndex] = profile.visited_profileid;
                    return acc;
                }, {});

                setAllProfileIds(prev => ({
                    ...prev,
                    ...profileIds
                }));
                setTotalPages(response.data.total_pages || 1);
                setTotalRecords(response.data.total_records || 0);
                setCurrentPage(page);
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

    // useEffect(() => {
    //     loadProfiles(1, true);
    // }, [sortBy]);
    const loadProfilesCallback = useCallback(() => {
        // Reset to page 1 and load initially when the screen is focused
        loadProfiles(1, true);
    }, [sortBy]); // Dependency array should include sortBy

    // Use useFocusEffect to call loadProfiles every time the screen is focused
    useFocusEffect(loadProfilesCallback);

    const handleSavePress = async (profileId) => {
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
            // Error handling is done within the API function, so no need here
        }
    };

    const getImageSource = (image) => {
        if (!image) return { uri: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%2Fimages%3Fk%3Ddefault%2Bimage&psig=AOvVaw28Px6jC5wsx4TWxwOrHJT2&ust=1726388184602000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMCfpqb_wYgDFQAAAAAdAAAAABAE' }; // Fallback image
        if (Array.isArray(image)) {
            return { uri: image[0] }; // Use the first image if it's an array
        }
        return { uri: image }; // Direct URL case
    };

    // const handleProfileClick = async (viewedProfileId) => {
    //     navigation.navigate("ProfileDetails", {
    //         viewedProfileId,
    //         allProfileIds,
    //     });
    // }

    const handleProfileClick = async (viewedProfileId) => {
        const profileCheckResponse = await fetchProfileDataCheck(viewedProfileId);
        console.log('profile view msg', profileCheckResponse)

        // 2. Check if the API returned any failure
        if (profileCheckResponse?.status === "failure") {
            Toast.show({
                type: "error",
                // text1: "Profile Error", // You can keep this general
                text1: profileCheckResponse.message, // <-- This displays the exact API message
                position: "bottom",
            });
            return; // Stop the function
        }

        const success = await logProfileVisit(viewedProfileId);

        if (success) {
            // Toast.show({
            //     type: "success",
            //     text1: "Profile Viewed",
            //     text2: `You have viewed profile ${viewedProfileId}.`,
            //     position: "bottom",
            // });
            // navigation.navigate("ProfileDetails", { id });
            navigation.navigate("ProfileDetails", {
                viewedProfileId,
                allProfileIds,
            });
        } else {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to log profile visit.",
                position: "bottom",
            });
        }
    };


    const renderItem = ({ item: profile }) => (
        <TouchableOpacity
            style={styles.profileDiv}
            onPress={() => handleProfileClick(profile.visited_profileid)}
        >
            <View style={styles.profileContainer}>
                {/* <Image
                    source={getImageSource(profile.visited_Profile_img)}
                    style={styles.profileImage}
                /> */}
                <TopAlignedImage
                    uri={Array.isArray(profile.visited_Profile_img) ? profile.visited_Profile_img[0] : profile.visited_Profile_img}
                    width={120}
                    height={120}
                />
                <TouchableOpacity onPress={() => handleSavePress(profile.visited_profileid)}>
                    <MaterialIcons
                        name={bookmarkedProfiles.has(profile.visited_profileid) ? "bookmark" : "bookmark-border"}
                        size={20}
                        color="red"
                        style={styles.saveIcon}
                    />
                </TouchableOpacity>

                <View style={styles.profileContent}>
                    <Text style={styles.profileName}>
                        {profile.visited_profile_name || "N/A"}
                        <Text style={styles.profileId}>({profile.visited_profileid || "N/A"})</Text>
                    </Text>
                    <Text style={styles.profileAge}>
                        {profile.visited_profile_age || "N/A"} Yrs <Text style={styles.line}>|</Text>
                        {profile.visited_height || "N/A"} Cms
                    </Text>
                    <Text style={styles.zodiac}>{profile.visited_star || "N/A"}</Text>
                    <Text style={styles.employed}>{profile.visited_profession || "N/A"}</Text>
                    <Text style={styles.lastVisit}>Last viewed on {profile.visited_datetime || "N/A"}</Text>
                    {/* <TouchableOpacity
                        onPress={() => setIsPlatinumVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.lastVisit}>
                            Last viewed on {profile.visited_datetime || "N/A"}
                        </Text>
                    </TouchableOpacity> */}
                </View>
            </View>
        </TouchableOpacity>
    );

    const EmptyListComponent = () => (
        isLoading ? (
            <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        ) : (
            <ProfileNotFound />
        )
    );

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.footerText}>Loading more profiles...</Text>
            </View>
        );
    };

    return (
        <View style={styles.profileScrollView}>
            {/* <PlatinumModalPopup
                visible={isPlatinumVisible}
                onClose={() => setIsPlatinumVisible(false)}
            /> */}
            <FlatList
                data={profiles}
                renderItem={renderItem}
                keyExtractor={(item) => item.visited_profileid.toString()}
                ListEmptyComponent={EmptyListComponent}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={false}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.2}
                ListFooterComponent={() => (
                    <>
                        {renderFooter()}
                        <View style={styles.suggestedWrapper}>
                            <SuggestedProfiles />
                        </View>
                    </>
                )}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingBottom: 80,
    },

    profileScrollView: {
        width: "100%",
        paddingBottom: 80,
    },

    profileDiv: {
        width: "100%",
        paddingHorizontal: 10,
    },

    profileContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        borderRadius: 8,
        padding: 8,
        marginVertical: 6,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },

    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 0,
        marginRight: 10,
    },

    saveIcon: {
        position: "absolute",
        left: -25,
        top: 5,
    },

    profileContent: {
        paddingLeft: 10,
    },

    profileName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FF6666",
        fontFamily: "inter",
        marginBottom: 5,
    },

    profileId: {
        fontSize: 14,
        color: "#85878C",
    },

    profileAge: {
        fontSize: 14,
        color: "#4F515D",
        marginBottom: 5,
    },

    line: {},

    zodiac: {
        fontSize: 14,
        color: "#4F515D",
        marginBottom: 5,
    },

    employed: {
        fontSize: 14,
        color: "#4F515D",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    flatListContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    footer: {
        paddingVertical: 20,
        alignItems: "center",
    },
    footerText: {
        color: "#666",
        marginTop: 5,
    },
    suggestedWrapper: {
        width: '100%',
        backgroundColor: '#FFDE594D',
        paddingTop: 10,
        marginTop: 20,
    },
    lastVisit: {
        fontSize: 14,
        color: "#4F515D",
        marginTop: 5,
    },
});
