import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
// Assuming Search_By_profileId is imported from CommonApiCall in your actual project
import {
    getAdvanceSearchResults,
    fetchProfileDataCheck,
    logProfileVisit,
    handleBookmark,
    Search_By_profileId, // <-- Include this API call
} from '../../CommonApiCall/CommonApiCall';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";
import ProfileNotFound from "../../Components/ProfileNotFound"; // Adjust path if necessary
import { TopAlignedImage } from "../../Components/ReuseImageAlign/TopAlignedImage";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";

export const FilterScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());

    // Check for the search term passed from the previous screen
    const { searchProfileId, isProfileIdSearch, profileCount } = route.params || {};

    // --- Utility Functions (Copied from Search for consistency) ---
    const getImageSource = (image) => {
        if (!image) return { uri: 'https://vysyamat.blob.core.windows.net/vysyamala/default_bride.png' };
        if (Array.isArray(image)) {
            return { uri: image[0] };
        }
        return { uri: image };
    };

    // ... (handleSavePress and handleProfileClick functions remain the same) ...
    // Note: I am keeping them shortened here for brevity, assuming you have the full functions working.

    const handleSavePress = async (viewedProfileId) => {
        const newStatus = bookmarkedProfiles.has(viewedProfileId) ? "0" : "1";
        const success = await handleBookmark(viewedProfileId, newStatus);
        if (success) {
            const updatedBookmarkedProfiles = new Set(bookmarkedProfiles);
            if (newStatus === "1") {
                updatedBookmarkedProfiles.add(viewedProfileId);
                Toast.show({ type: "success", text1: "Saved", text2: "Profile has been saved to bookmarks.", position: "bottom" });
            } else {
                updatedBookmarkedProfiles.delete(viewedProfileId);
                Toast.show({ type: "info", text1: "Unsaved", text2: "Profile has been removed from bookmarks.", position: "bottom" });
            }
            setBookmarkedProfiles(updatedBookmarkedProfiles);

            setProfiles(prevProfiles =>
                prevProfiles.map(profile =>
                    profile.profile_id === viewedProfileId
                        ? { ...profile, wish_list: newStatus === "1" ? 1 : 0 }
                        : profile
                )
            );
        } else {
            Toast.show({ type: "error", text1: "Error", text2: "Failed to update bookmark status.", position: "bottom" });
        }
    };

    const handleProfileClick = async (viewedProfileId) => {
        const profileCheckResponse = await fetchProfileDataCheck(viewedProfileId);
        if (profileCheckResponse?.status === "failure") {
            Toast.show({ type: "error", text1: profileCheckResponse.message, position: "bottom" });
            return;
        }

        const success = await logProfileVisit(viewedProfileId);

        if (success) {
            //Toast.show({ type: "success", text1: "Profile Viewed", text2: `You have viewed profile ${viewedProfileId}.`, position: "bottom" });
            navigation.navigate("ProfileDetails", { viewedProfileId });
        } else {
            Toast.show({ type: "error", text1: "Error", text2: "Failed to log profile visit.", position: "bottom" });
        }
    };

    // --- Core Search Logic (Updated to handle both types) ---
    const executeSearch = async () => {
        setLoading(true);
        setProfiles([]); // Clear previous results

        try {
            let searchResults;

            if (isProfileIdSearch && searchProfileId) {
                // Case 1: Search by Profile ID/Name
                searchResults = await Search_By_profileId(searchProfileId);

                if (searchResults && searchResults.status === "success") {
                    setProfiles(searchResults.data || []);
                } else {
                    Toast.show({
                        type: 'info',
                        text1: 'Not Found',
                        text2: searchResults?.message || 'Profile ID/Name not found.',
                        position: 'bottom'
                    });
                }
            } else {
                // Case 2: Advanced Filter Search
                const storedParams = await AsyncStorage.getItem('searchParams');
                let params = storedParams ? JSON.parse(storedParams) : {};

                // Call Advanced Search API
                searchResults = await getAdvanceSearchResults(1, 1);

                if (searchResults && searchResults.status === "success") {
                    setProfiles(searchResults.data || []);
                    await AsyncStorage.setItem('totalcount', (searchResults.total_count || 0).toString());
                } else {
                    Toast.show({
                        type: 'info',
                        text1: 'No Matches',
                        text2: 'No profiles matched your filter criteria.',
                        position: 'bottom'
                    });
                }
            }

            // --- Common Post-Search Logic ---
            const dataToProcess = searchResults?.data || [];
            const bookmarkedIds = new Set();
            dataToProcess.forEach(profile => {
                if (profile.wish_list === 1) {
                    bookmarkedIds.add(profile.profile_id);
                }
            });
            setBookmarkedProfiles(bookmarkedIds);

        } catch (error) {
            console.error('Error during search:', error);
            Toast.show({
                type: 'error',
                text1: 'Search Error',
                text2: 'An error occurred while fetching results.',
                position: 'bottom'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        executeSearch();
    }, [searchProfileId, isProfileIdSearch]); // Rerun if params change

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#ED1E24" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {/* {isProfileIdSearch ? 'Profile Search Results' : 'Advanced Search Results'} */}
                    Search Results
                    <Text style={styles.matchNumber}>({profileCount})</Text>
                </Text>
                {/* <TouchableOpacity onPress={executeSearch}>
                    <Text style={styles.clearText}>Re-Run Search</Text>
                </TouchableOpacity> */}
            </View>

            <ScrollView style={styles.scrollView}>
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="red" />
                        {/* <Text style={styles.loadingText}>Fetching Profiles...</Text> */}
                    </View>
                ) : (
                    <View style={styles.profileScrollView}>
                        {profiles.length > 0 ? (
                            profiles.map((profile) => (
                                <TouchableOpacity
                                    key={profile.profile_id}
                                    onPress={() => handleProfileClick(profile.profile_id)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.profileDiv}>
                                        <View style={styles.profileContainer}>
                                            <View style={styles.imageWrapper}>
                                                {/* <Image
                                                    source={getImageSource(profile.profile_img)}
                                                    style={styles.profileImage}
                                                /> */}
                                                <TopAlignedImage
                                                    uri={Array.isArray(profile.profile_img) ? profile.profile_img[0] : profile.profile_img}
                                                    width={100}
                                                    height={100}
                                                />
                                                <TouchableOpacity
                                                    onPress={() => handleSavePress(profile.profile_id)}
                                                    style={styles.saveIconContainer}
                                                >
                                                    <MaterialIcons
                                                        name={bookmarkedProfiles.has(profile.profile_id) ? 'bookmark' : 'bookmark-border'}
                                                        size={24}
                                                        color="#ED1E24"
                                                    />
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.profileContent}>
                                                <Text style={styles.profileName}>
                                                    {profile.profile_name}{" "}
                                                    <Text style={styles.profileId}>({profile.profile_id})</Text>
                                                </Text>
                                                <Text style={styles.profileAge}>
                                                    {profile.profile_age} Yrs{" "}
                                                    <Text style={styles.line}>|</Text> {profile.profile_height}{" "}
                                                </Text>
                                                <Text style={styles.zodiac}>{profile.star}</Text>
                                                <Text style={styles.employed}>{profile.profession}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.centerContainer}>
                                <ProfileNotFound />
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
            <BottomTabBarComponent />
        </SafeAreaView>
    );
};

// --- Styles (Existing Styles) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F4F4",
        paddingBottom: 80,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-left',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#282C3F',
    },
    clearText: {
        color: '#FF6666',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    loadingText: {
        fontSize: 16,
        color: '#85878C',
    },
    profileScrollView: {
        width: "100%",
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
    // saveIconContainer: {
    //     position: 'absolute',
    //     right: 15,
    //     top: 15,
    //     zIndex: 1,
    // },
    saveIcon: {},
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
        position: "relative",   // Important
    },

    saveIconContainer: {
        position: "absolute",
        top: 5,
        right: 5,
        //backgroundColor: "rgba(255,255,255,0.8)",
        padding: 4,
        borderRadius: 50,
        zIndex: 10,
    },

});