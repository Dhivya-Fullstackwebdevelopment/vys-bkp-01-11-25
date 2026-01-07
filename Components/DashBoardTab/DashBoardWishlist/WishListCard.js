import React, { useState, useEffect, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    FlatList, TouchableOpacity, ActivityIndicator
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getWishlistProfiles, handleBookmark, logProfileVisit, fetchProfileDataCheck } from "../../../CommonApiCall/CommonApiCall";  // Import the function
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import WishlistNotFound from "../../ProfileNotFound/WishlistNotFound";
import { SuggestedProfiles } from "../../HomeTab/SuggestedProfiles";
import Toast from "react-native-toast-message";
import { TopAlignedImage } from "../../../Components/ReuseImageAlign/TopAlignedImage"

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

    const loadProfiles = async (page = 1, isInitialLoad = false) => {
        console.log('Loading profiles:', page, isInitialLoad);
        if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad)) return;

        if (isInitialLoad) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const response = await getWishlistProfiles(10, page, sortBy);
            console.log('Wishlist profiles response:', response);
            if (response && response.Status === 0) {
                // Handle the "No Vysassist found" case
                setProfiles([]);
                setTotalPages(1);
                setTotalRecords(0);
                setCurrentPage(1);
                setBookmarkedProfiles(new Set());
            } else if (response && response.data) {
                const newProfiles = response.data.profiles || [];

                // Extract bookmarked profiles from API response
                const bookmarkedIds = new Set();
                newProfiles.forEach(profile => {
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
                    setBookmarkedProfiles(prev => new Set([...prev, ...bookmarkedIds]));
                }

                // Update profile IDs mapping
                const profileIds = response.data.profiles.reduce((acc, profile, index) => {
                    const globalIndex = (page - 1) * 10 + index; // Calculate global index based on page
                    acc[globalIndex] = profile.wishlist_profileid;
                    return acc;
                }, {});

                setAllProfileIds(prev => ({
                    ...prev,
                    ...profileIds
                }));
                setTotalPages(response.data.total_pages || 1);
                setTotalRecords(response.data.total_records || 0);
                setCurrentPage(page);
                console.log("Bookmarked profiles:", Array.from(bookmarkedIds));
            } else {
                console.warn("No profiles found or error in response.");
                setProfiles([]);
            }
        } catch (error) {
            console.error('Error loading wishlist profiles:', error);
            setProfiles([]);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
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


    const handleSavePress = async (viewedProfileId) => {
        // Since this is wishlist, we only allow removing bookmarks (setting to "0")
        const newStatus = "0";
        const success = await handleBookmark(viewedProfileId, newStatus);

        if (success) {
            const updatedBookmarkedProfiles = new Set(bookmarkedProfiles);
            updatedBookmarkedProfiles.delete(viewedProfileId);
            setBookmarkedProfiles(updatedBookmarkedProfiles);

            // Remove the profile from the list
            setProfiles(prevProfiles =>
                prevProfiles.filter(profile => profile.wishlist_profileid !== viewedProfileId)
            );

            Toast.show({
                type: "info",
                text1: "Removed",
                text2: "Profile has been removed from wishlist.",
                position: "bottom",
            });

            // Update total records count
            setTotalRecords(prev => prev - 1);
        } else {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to remove profile from wishlist.",
                position: "bottom",
            });
        }
    };


    const handleEndReached = () => {
        if (!isLoadingMore && currentPage < totalPages) {
            console.log("Loading more more more profiles...", { currentPage });
            loadProfiles(currentPage + 1, false);
        }
    };

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.footerText}>Loading more profiles...</Text>
            </View>
        );
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
    //         allProfileIds
    //     });
    // };

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
                allProfileIds
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

    return (
        <View style={styles.profileScrollView}>
            <FlatList
                data={profiles}
                keyExtractor={item => item.wishlist_profileid}
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
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.emptyContainer}>
                            <ActivityIndicator size="large" color="#0000ff" />
                        </View>
                    ) : (
                        <WishlistNotFound />
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.profileDiv}
                        onPress={() => handleProfileClick(item.wishlist_profileid)}>
                        <View style={styles.profileContainer}>
                            {/* <Image
                                source={getImageSource(item.wishlist_Profile_img)}
                                style={styles.profileImage}
                            /> */}
                            <TopAlignedImage
                                uri={Array.isArray(item.wishlist_Profile_img) ? item.wishlist_Profile_img[0] : item.wishlist_Profile_img}
                                width={120}
                                height={120}
                            />
                            <TouchableOpacity
                                onPress={() => handleSavePress(item.wishlist_profileid)}
                                style={styles.saveIconContainer}
                            >
                                <MaterialIcons
                                    name={bookmarkedProfiles.has(item.wishlist_profileid) ? "bookmark" : "bookmark-border"}
                                    size={20}
                                    color="red"
                                    style={styles.saveIcon}
                                />
                            </TouchableOpacity>
                            <View style={styles.profileContent}>
                                <Text style={styles.profileName}>
                                    {/* {item.wishlist_profile_name || "N/A"}  */}
                                    {item.wishlist_profile_name
                                        ? (item.wishlist_profile_name.length > 15
                                            ? item.wishlist_profile_name.substring(0, 15) + "..."
                                            : item.wishlist_profile_name)
                                        : "N/A"
                                    }
                                    <Text style={styles.profileId}>({item.wishlist_profileid || "N/A"})</Text>
                                </Text>
                                <Text style={styles.profileAge}>
                                    {item.wishlist_profile_age || "N/A"} Yrs <Text style={styles.line}>|</Text>
                                    {item.wishlist_height || "N/A"} Cms
                                </Text>
                                <Text style={styles.zodiac}>{item.wishlist_star || "N/A"}</Text>
                                <Text style={styles.employed}>{item.wishlist_profession || "N/A"}</Text>
                                <Text style={styles.lastVisit}>
                                    Bookmarked on {item.wishlist_lastvisit || "N/A"}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};


const styles = StyleSheet.create({
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
        height: 120,
        borderRadius: 0,
        resizeMode: "cover",   // ensures the image starts from the top
        alignSelf: "flex-start"
    },

    profileContent: {
        paddingLeft: 10,
    },

    profileName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FF6666",
        fontFamily: "inter",
        marginBottom: 10,
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

    zodiac: {
        fontSize: 14,
        color: "#4F515D",
    },

    employed: {
        fontSize: 14,
        color: "#4F515D",
        marginTop: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#000000',
        textAlign: 'center',
        fontweight: 'bold',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
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
    profileImageWrapper: {
        width: 100,
        height: 120,
        overflow: "hidden",
    },

});
