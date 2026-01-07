import React, { useState, useEffect } from "react";
import { StyleSheet, FlatList, View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';

import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import {
    getAdvanceSearchResults,
    handleBookmark,
    logProfileVisit,
    getWishlistProfiles,
    fetchProfileDataCheck
} from '../../../CommonApiCall/CommonApiCall';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TopAlignedImage } from "../../ReuseImageAlign/TopAlignedImage";


export const SearchCard = () => {
    const [profiles, setProfiles] = useState([]);
    const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [allProfileIds, setAllProfileIds] = useState({});
    const navigation = useNavigation();

    const handleEndReached = () => {
        if (currentPage < totalPages && !isLoading) {
            setCurrentPage((prevPage) => prevPage + 1);
        }
    };

    useEffect(() => {
        const loadProfiles = async () => {
            if (isLoading || currentPage > totalPages) return; // Prevent multiple concurrent requests or over-fetching

            setIsLoading(true); // Set loading state

            try {
                const count = await AsyncStorage.getItem('totalcount');
                const totalCount = parseInt(count, 10);
                const perPage = 6;
                const pageNumber = currentPage;

                const response = await getAdvanceSearchResults(perPage, pageNumber);
                console.log("response all data search ===>", JSON.stringify(response));
                if (response) {
                    setProfiles((prevProfiles) => [...prevProfiles, ...(response.data || [])]);
                    setTotalPages(Math.ceil(totalCount / perPage));
                    const profileIds = response.data.reduce((acc, profile, index) => {
                        const globalIndex = (pageNumber - 1) * perPage + index;
                        acc[globalIndex] = profile.profile_id;
                        return acc;
                    }, {});
                    setAllProfileIds((prevIds) => ({ ...prevIds, ...profileIds }));
                    setBookmarkedProfiles((prevSet) => {
                        const newSet = new Set(prevSet);
                        response.data.forEach((profile) => {
                            if (profile.wish_list === 1) {
                                newSet.add(profile.profile_id);
                            }
                        });
                        return newSet;
                    });
                } else {
                    console.warn('No profiles found or error in response.');
                }
            } catch (error) {
                console.error('Error loading profiles:', error);
            } finally {
                setIsLoading(false); // Reset loading state
            }
        };

        loadProfiles();
    }, [currentPage]); // Re-run when currentPage changes


    useEffect(() => {
        const loadWishlistProfiles = async () => {
            try {
                const response = await getWishlistProfiles();
                if (response) {
                    // Extract the profile IDs from the response
                    const profileIds = response.map(profile => profile.wishlist_profileid);
                    const profileIdsSet = new Set(profileIds);
                    setBookmarkedProfiles(profileIdsSet);
                } else {
                    console.log('No profiles found in response.');
                }
            } catch (error) {
                console.error('Error loading wishlist profiles:', error);
            }
        };
        loadWishlistProfiles();
    }, []);

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
        } else {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to update bookmark status.",
                position: "bottom",
            });
        }
    };

    // const handleProfileClick = async (viewedProfileId) => {
    //     const success = await logProfileVisit(viewedProfileId);

    //     if (success) {
    //         // Toast.show({
    //         //     type: "success",
    //         //     text1: "Profile Viewed",
    //         //     text2: `You have viewed profile ${viewedProfileId}.`,
    //         //     position: "bottom",
    //         // });
    //         navigation.navigate("ProfileDetails", { viewedProfileId, allProfileIds });
    //     } else {
    //         Toast.show({
    //             type: "error",
    //             text1: "Error",
    //             text2: "Failed to log profile visit.",
    //             position: "bottom",
    //         });
    //     }
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


    const getImageSource = (image) => {
        if (!image) return { uri: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%2Fimages%3Fk%3Ddefault%2Bimage&psig=AOvVaw28Px6jC5wsx4TWxwOrHJT2&ust=1726388184602000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMCfpqb_wYgDFQAAAAAdAAAAABAE' }; // Fallback image
        if (Array.isArray(image)) {
            return { uri: image[0] }; // Use the first image if it's an array
        }
        return { uri: image }; // Direct URL case
    };


    console.log("dddddddddddddd", profiles);


    return (
        <>
            <FlatList
                data={profiles}
                keyExtractor={(item) => item.profile_id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        key={item.profile_id}
                        onPress={() => handleProfileClick(item.profile_id)}
                        style={styles.profileDiv}
                    >
                        <View style={styles.profileContainer}>
                            {/* <Image
                            source={{ uri: item.profile_img }}
                            style={styles.profileImage}
                        /> */}
                            {/* <Image
                                source={getImageSource(item.profile_img)}
                                style={styles.profileImage}
                            /> */}
                            <View style={styles.imageWrapper}>
                                <TopAlignedImage
                                    uri={Array.isArray(item.profile_img) ? item.profile_img[0] : item.profile_img}
                                    width={100}
                                    height={100}
                                    // Apply blur effect if photo_protection is 1
                                    blurRadius={item.photo_protection === 1 ? 15 : 0}
                                />

                                {/* Condition for Lock Symbol */}
                                {item.photo_protection === 1 && (
                                    <View style={styles.lockOverlay}>
                                        <MaterialIcons name="lock" size={24} color="#ee3a3aff" />
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity onPress={() => handleSavePress(item.profile_id)}>
                                <MaterialIcons
                                    name={bookmarkedProfiles.has(item.profile_id) ? 'bookmark' : 'bookmark-border'}
                                    size={20}
                                    color="red"
                                    style={styles.saveIcon}
                                />
                            </TouchableOpacity>
                            <View style={styles.profileContent}>
                                <Text style={styles.profileName}>
                                    {/* {item.profile_name} */}
                                    {item.profile_name
                                        ? (item.profile_name.length > 15
                                            ? item.profile_name.substring(0, 15) + "..."
                                            : item.profile_name)
                                        : "N/A"
                                    }
                                    <Text style={styles.profileId}>({item.profile_id})</Text>
                                </Text>
                                <Text style={styles.profileAge}>
                                    {item.profile_age} Yrs <Text style={styles.line}>|</Text> {item.profile_height} Cms
                                </Text>
                                <Text style={styles.zodiac}>{item.degree}</Text>
                                <Text style={styles.employed}>{item.profession}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5} // Trigger at 50% from the end
                ListFooterComponent={
                    <View style={{ paddingBottom: 20 }}>
                        {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
                    </View>
                }
                contentContainerStyle={styles.profileScrollView}
                showsVerticalScrollIndicator={true}
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                windowSize={5}
            />
        </>
    );
};
const styles = StyleSheet.create({
    profileScrollView: {
        width: "100%",
        paddingBottom: 20,
    },
    profileDiv: {
        width: "100%",
        paddingHorizontal: 10,
        marginBottom: 5
    },
    profileContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        borderRadius: 8,
        padding: 8,
        marginVertical: 10,
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
        borderRadius: 10,
    },
    saveIcon: {
        position: "absolute",
        right: 10,
        top: 10,
        //margin: 5
    },
    profileContent: {
        paddingLeft: 10,
        flex: 1,
    },
    profileName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FF6666",
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
    imageWrapper: {
        width: 100,
        height: 100,
        position: 'relative', // Necessary for absolute children
        borderRadius: 10,
        overflow: 'hidden',   // Ensures blur/overlay stays inside the corners
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject, // Covers the entire imageWrapper
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark semi-transparent tint
        justifyContent: 'center',
        alignItems: 'center',
    },
});
