import React, { useEffect, useState, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Button,
    Pressable,
    ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import axios from "axios";
import {
    createOrRetrieveChat,
    fetchPhotoRequest,
    updatePhotoRequest,
    updatePhotoRequestReject,
    logProfileVisit,
    fetchProfileDataCheck,
    handleBookmark
} from '../../../CommonApiCall/CommonApiCall';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TopAlignedImage } from "../../ReuseImageAlign/TopAlignedImage";

export const PhotoRequestCard = ({ sortBy = "datetime" }) => {
    const navigation = useNavigation();
    const [profiles, setProfiles] = useState([]);
    const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isModalVisible, setModalVisible] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRejectPress = () => {
        setModalVisible(true); // Show the modal
    };

    const handleCloseModal = () => {
        setModalVisible(false); // Close the modal
        setRejectionReason(''); // Clear the input
    };

    const handleSubmitReason = async (selectedId) => {
        // Handle submission of rejection reason
        console.log('Rejection Reason:', selectedId);
        const success = await updatePhotoRequestReject(selectedId, rejectionReason);

        if (success) {
            // Optional: Perform additional actions on success, like refreshing the list.
            handleCloseModal(); // Close the modal after submission
        }
    };

    // Fetch photo requests and profile details from the API
    // useEffect(() => {
    //     const loadProfiles = async () => {
    //         const { success, profiles } = await fetchPhotoRequest(sortBy);
    //         console.log('Profiles all list data ===?', profiles);
    //         if (success) {
    //             setProfiles(profiles);
    //         }
    //     };

    //     loadProfiles();
    // }, [sortBy]);

    const loadProfiles = async (page = 1, isInitialLoad = false) => {
        if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad)) return;

        if (isInitialLoad) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const perPage = 10;
            const response = await fetchPhotoRequest(perPage, page, sortBy);

            console.log('API Response:', response); // Add this for debugging

            if (response && response.Status === 0) {
                setProfiles([]);
                setBookmarkedProfiles(new Set()); // Reset bookmarks
                // Remove setTotalPages, setTotalRecords, setCurrentPage, setAllProfileIds 
                // if they're not defined in your component
            } else if (response && response.success && response.data) {
                const profilesData = response.data.profiles || [];

                if (isInitialLoad) {
                    setProfiles(profilesData);
                    const initialBookmarks = new Set();
                    profilesData.forEach(profile => {
                        if (profile.req_profile_wishlist === 1) {
                            initialBookmarks.add(profile.req_profileid);
                        }
                    });
                    setBookmarkedProfiles(initialBookmarks);
                } else {
                    setProfiles(prevProfiles => [...prevProfiles, ...profilesData]);
                    setBookmarkedProfiles(prev => {
                        const updated = new Set(prev);
                        profilesData.forEach(profile => {
                            if (profile.req_profile_wishlist === 1) {
                                updated.add(profile.req_profileid);
                            } else {
                                updated.delete(profile.req_profileid);
                            }
                        });
                        return updated;
                    });
                }

                // Only set these if you have the corresponding state variables
                // setTotalPages(response.data.total_pages || 1);
                // setTotalRecords(response.data.total_records || 0);
                // setCurrentPage(page);

                // If you need all_profile_ids, make sure you have the state variable
                // setAllProfileIds(prev => ({
                //     ...prev,
                //     ...response.data.all_profile_ids
                // }));
            } else {
                console.warn("No profiles found or error in response.");
                setProfiles([]);
                setBookmarkedProfiles(new Set());
            }
        } catch (error) {
            console.error("Error loading profiles:", error);
            setProfiles([]);
            setBookmarkedProfiles(new Set());
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

    const handleSavePress = async (profileId) => {
        const newStatus = bookmarkedProfiles.has(profileId) ? "0" : "1";
        const success = await handleBookmark(profileId, newStatus);

        if (success) {
            const updatedBookmarkedProfiles = new Set(bookmarkedProfiles);
            if (newStatus === "1") {
                updatedBookmarkedProfiles.add(profileId);
                Toast.show({
                    type: "success",
                    text1: "Saved",
                    text2: "Profile has been saved to bookmarks.",
                    position: "bottom",
                });
            } else {
                updatedBookmarkedProfiles.delete(profileId);
                Toast.show({
                    type: "info",
                    text1: "Unsaved",
                    text2: "Profile has been removed from bookmarks.",
                    position: "bottom",
                });
            }
            setBookmarkedProfiles(updatedBookmarkedProfiles);

            // Update the profiles state to reflect the bookmark change
            setProfiles(prevProfiles =>
                prevProfiles.map(profile =>
                    profile.viwed_profileid === profileId
                        ? { ...profile, viwed_profile_wishlist: newStatus === "1" ? 1 : 0 }
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

    const handleAcceptClick = async (selectedId) => {
        const success = await updatePhotoRequest(selectedId);
        if (success) {
            // Optional: Perform additional actions on success, like refreshing the list.
        }
    };

    const handlePressMessage = async (viewedProfileId) => {
        try {
            // const result = await createOrRetrieveChat(from_profile_id); // Call API using axios
            const result = await createOrRetrieveChat(viewedProfileId.req_profileid); // Call API using axios
            await AsyncStorage.setItem('chat_created', JSON.stringify(result.created));
            await AsyncStorage.setItem('chat_room_id_name', result.room_id_name);
            await AsyncStorage.setItem('chat_statue', JSON.stringify(result.statue));
            console.log('API result:', result);  // Check result (you can navigate or handle response here)
            navigation.navigate("ChatRoom", {
                // from_profile_id: viewedProfileId  // Pass the profile ID as a parameter
                room_name: result.room_id_name,
                username: viewedProfileId.req_profile_name,
                from_profile_id: viewedProfileId,
                profile_image: viewedProfileId.req_Profile_img,
                last_mesaage_visit: viewedProfileId.req_lastvisit,
            });
        } catch (error) {
            console.error('API call failed:', error);
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
    //     navigation.navigate("ProfileDetails", { viewedProfileId });
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
                // profileId: allProfileIds,
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

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ED1E24" />
                {/* <Text style={styles.loadingText}>Loading Photo Requests...</Text> */}
            </View>
        );
    }

    return (
        <ScrollView style={styles.profileScrollView}>
            {profiles.length === 0 ? (
                <View style={styles.noRequestsContainer}>
                    <Text style={styles.noRequestsText}>No Photo Request List</Text>
                </View>
            ) : (
                profiles.map((profile) => (
                    <TouchableOpacity key={profile.req_profileid} style={styles.profileDiv} onPress={() => handleProfileClick(profile.req_profileid)}>
                        <View style={styles.profileContainer}>
                            {/* <Image
                                source={
                                    profile.req_Profile_img
                                        ? { uri: profile.req_Profile_img }
                                        : require("../../../assets/img/Dp.png")
                                }
                                style={styles.profileImage}
                            /> */}
                            {/* <Image
                                source={getImageSource(profile.req_Profile_img)}
                                style={styles.profileImage}
                            /> */}
                            <TopAlignedImage
                                uri={Array.isArray(profile.req_Profile_img) ? profile.req_Profile_img[0] : profile.req_Profile_img}
                                width={120}
                                height={120}
                            />
                            <TouchableOpacity onPress={() => handleSavePress(profile.req_profileid)}>
                                <MaterialIcons
                                    name={bookmarkedProfiles.has(profile.req_profileid) ? "bookmark" : "bookmark-border"}
                                    size={20}
                                    color="red"
                                    style={styles.saveIcon}
                                />
                            </TouchableOpacity>

                            <View style={styles.profileContent}>
                                <Text style={styles.profileName}>
                                    {profile.req_profile_name || "N/A"}
                                    <Text style={styles.profileId}>
                                        ({profile.req_profileid || "N/A"})
                                    </Text>
                                </Text>
                                <Text style={styles.profileAge}>
                                    {profile.req_profile_age || "N/A"} Yrs
                                    <Text style={styles.line}>|</Text> {profile.req_height || "N/A"} Cms
                                </Text>
                                <Text style={styles.zodiac}>{profile.req_star || "N/A"}</Text>
                                <Text style={styles.employed}>{profile.req_profession || "N/A"}</Text>
                                <Text style={styles.lastVisit}>
                                    Last visit on {profile.req_lastvisit || "N/A"}
                                </Text>
                                {/* Buttons */}
                                <View style={styles.buttonContainer}>
                                    {/* Conditionally render Accept and Reject buttons if req_status is not 2 or 3 */}
                                    {profile.req_status !== 2 && profile.req_status !== 3 && (
                                        <>
                                            {/* Accept Button */}
                                            <TouchableOpacity style={styles.btn} onPress={() => handleAcceptClick(profile.req_profileid)}>
                                                <LinearGradient
                                                    colors={["#BD1225", "#FF4050"]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    useAngle={true}
                                                    angle={92.08}
                                                    angleCenter={{ x: 0.5, y: 0.5 }}
                                                    style={styles.linearGradient}
                                                >
                                                    <View style={styles.loginContainer}>
                                                        <Text style={[styles.login]}>Accept</Text>
                                                    </View>
                                                </LinearGradient>
                                            </TouchableOpacity>

                                            {/* Reject Button */}
                                            <TouchableOpacity style={styles.btn} onPress={handleRejectPress}>
                                                <LinearGradient
                                                    colors={["#BD1225", "#FF4050"]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    useAngle={true}
                                                    angle={92.08}
                                                    angleCenter={{ x: 0.5, y: 0.5 }}
                                                    style={styles.linearGradient}
                                                >
                                                    <View style={styles.loginContainer}>
                                                        <Text style={styles.login}>Reject</Text>
                                                    </View>
                                                </LinearGradient>

                                            </TouchableOpacity>

                                            {/* Modal for Pop-Up */}
                                            <Modal
                                                animationType="slide"
                                                transparent={true}
                                                visible={isModalVisible}
                                                onRequestClose={handleCloseModal}
                                            >
                                                <View style={styles.modalOverlay}>
                                                    <View style={styles.modalContainer}>
                                                        <Text style={styles.modalTitle}>Reason for Rejection</Text>
                                                        <TextInput
                                                            style={styles.textArea}
                                                            placeholder="Enter your reason here..."
                                                            multiline={true}
                                                            value={rejectionReason}
                                                            onChangeText={setRejectionReason}
                                                        />
                                                        <View style={styles.modalButtons}>
                                                            <TouchableOpacity
                                                                style={[styles.modalButton, styles.submitButton]}
                                                                // onPress={handleSubmitReason}
                                                                onPress={() => handleSubmitReason(profile.req_profileid)}                                                        >
                                                                <Text style={styles.buttonText}>Submit</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={[styles.modalButton, styles.cancelButton]}
                                                                onPress={handleCloseModal}
                                                            >
                                                                <Text style={styles.buttonText}>Cancel</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </View>
                                            </Modal>
                                        </>
                                    )}

                                    {/* Conditionally render Message button if req_status is 2 */}
                                    {profile.req_status === 2 && (
                                        <>

                                            <TouchableOpacity style={styles.messageButton} onPress={() => handlePressMessage(profile)}>
                                                <FontAwesome style={styles.icon} />
                                                <Text style={styles.messageText}>Message</Text>
                                            </TouchableOpacity>
                                        </>

                                    )}

                                    {profile.req_status === 3 && (
                                        <View style={styles.responseContainer}>
                                            <Text style={styles.responseText}>
                                                Response Message: {profile.response_message}
                                            </Text>
                                        </View>
                                    )}


                                </View>


                            </View>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </ScrollView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "flex-start",
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

    saveIcon: {
        position: "absolute",
        left: -25,
        top: 5,
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
    lastVisit: {
        fontSize: 14,
        color: "#4F515D",
        marginTop: 5,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        alignSelf: "center",
        width: "100%",
        marginVertical: 10,
    },

    btn: {
        alignSelf: "center",
        borderRadius: 6,
    },

    loginContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    cancel: {
        color: "#ED1E24",
        fontSize: 14,
        fontWeight: "600",
        fontFamily: "inter",
        borderWidth: 2,
        borderColor: "#ED1E24",
        borderRadius: 5,
        paddingHorizontal: 15,
        paddingVertical: 8.5,
        letterSpacing: 1,
    },

    login: {
        textAlign: "center",
        color: "white",
        fontWeight: "600",
        fontSize: 14,
        letterSpacing: 1,
        fontFamily: "inter",
    },

    linearGradient: {
        borderRadius: 5,
        justifyContent: "center",
        padding: 10,
        marginRight: 15,
    },

    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },

    modalContent: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        width: "80%",
        alignItems: "center",
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
    },

    input: {
        width: "100%",
        padding: 10,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20,
    },

    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    messageButton: {
        flexDirection: 'row', // Align icon and text horizontally
        alignItems: 'center', // Center items vertically
        justifyContent: 'center', // Center items horizontally
        backgroundColor: '#007AFF', // Blue background
        paddingVertical: 10, // Vertical padding
        paddingHorizontal: 15, // Horizontal padding
        borderRadius: 8, // Rounded corners
        shadowColor: '#000', // Shadow for elevation
        shadowOffset: { width: 0, height: 2 }, // Shadow position
        shadowOpacity: 0.25, // Shadow transparency
        shadowRadius: 4, // Shadow spread
        elevation: 5, // Shadow effect for Android
    },
    icon: {
        color: '#fff', // White color for icon
        fontSize: 20, // Size of the icon
        marginRight: 8, // Space between icon and text
    },
    messageText: {
        color: '#fff', // White color for text
        fontSize: 16, // Font size
        fontWeight: 'bold', // Bold text
    },
    responseContainer: {
        marginTop: 16, // equivalent to `mt-4`
    },
    responseText: {
        color: '#main-color', // Replace '#main-color' with your actual main color code
        fontWeight: '600', // equivalent to `font-semibold`
        fontSize: 16, // Adjust font size as needed
    },

    cancel: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    textArea: {
        width: '100%',
        height: 100,
        borderColor: '#CCCCCC',
        borderWidth: 1,
        borderRadius: 5,
        textAlignVertical: 'top',
        padding: 10,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        flex: 1,
        padding: 10,
        marginHorizontal: 5,
        alignItems: 'center',
        borderRadius: 5,
    },
    submitButton: {
        backgroundColor: '#BD1225',
    },
    cancelButton: {
        backgroundColor: '#CCCCCC',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    noRequestsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    noRequestsText: {
        fontSize: 18,
        color: '#4F515D',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50, // Give it some vertical height
    },
});
