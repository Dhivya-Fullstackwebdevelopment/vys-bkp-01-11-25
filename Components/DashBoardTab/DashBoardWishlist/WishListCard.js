import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    FlatList, TouchableOpacity, ActivityIndicator
} from "react-native";
import { getWishlistProfiles } from "../../../CommonApiCall/CommonApiCall";  // Import the function
import { useNavigation } from "@react-navigation/native";
import { ProfileNotFound } from "../../ProfileNotFound";
import { SuggestedProfiles } from "../../HomeTab/SuggestedProfiles";

export const WishlistCard = ({ sortBy = "datetime" }) => {
    const [profiles, setProfiles] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const navigation = useNavigation();
    const [allProfileIds, setAllProfileIds] = useState({});

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
            } else if (response && response.data) {
                if (isInitialLoad) {
                    setProfiles(response.data.profiles || []);
                } else {
                    setProfiles((prevProfiles) => [
                        ...prevProfiles,
                        ...(response.data.profiles || []),
                    ]);
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

    useEffect(() => {
        loadProfiles(1, true);
    }, [sortBy]);

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

    const handleProfileClick = async (viewedProfileId) => {
        navigation.navigate("ProfileDetails", {
            viewedProfileId,
            allProfileIds
        });
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
                        <ProfileNotFound />
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.profileDiv}
                        onPress={() => handleProfileClick(item.wishlist_profileid)}>
                        <View style={styles.profileContainer}>
                            <Image
                                source={getImageSource(item.wishlist_Profile_img)}
                                style={styles.profileImage}
                            />
                            <View style={styles.profileContent}>
                                <Text style={styles.profileName}>
                                    {item.wishlist_profile_name} <Text style={styles.profileId}>({item.wishlist_profileid})</Text>
                                </Text>
                                <Text style={styles.profileAge}>
                                    {item.wishlist_profile_age} Yrs
                                </Text>
                                <Text style={styles.zodiac}>{item.wishlist_star}</Text>
                                <Text style={styles.employed}>{item.wishlist_profession}</Text>
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
        height: 100,
        borderRadius: 0,
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
});
