import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { logProfileVisit, fetchProfileDataCheck } from "../../../CommonApiCall/CommonApiCall";
import Toast from 'react-native-toast-message';

export const FeaturedProfileCard = ({ profiles }) => {
    const navigation = useNavigation();

    // Add validation check
    const validProfiles = Array.isArray(profiles) ? profiles.filter(profile => profile && profile.profile_id) : [];

    // const handleProfileClick = async (viewedProfileId) => {
    //     navigation.navigate("ProfileDetails", { viewedProfileId });
    // };

    // const handleProfileClick = async (viewedProfileId) => {
    //     const profileCheckResponse = await fetchProfileDataCheck(viewedProfileId);
    //     console.log('profile view msg', profileCheckResponse)

    //     // 2. Check if the API returned any failure
    //     if (profileCheckResponse?.status === "failure") {
    //         Toast.show({
    //             type: "error",
    //             // text1: "Profile Error", // You can keep this general
    //             text1: profileCheckResponse.message, // <-- This displays the exact API message
    //             position: "top",
    //         });
    //         return; // Stop the function
    //     }

    //     const success = await logProfileVisit(viewedProfileId);

    //     if (success) {
    //         Toast.show({
    //             type: "success",
    //             text1: "Profile Viewed",
    //             text2: `You have viewed profile ${viewedProfileId}.`,
    //             position: "top",
    //         });
    //         // navigation.navigate("ProfileDetails", { id });
    //         navigation.navigate("ProfileDetails", {
    //             viewedProfileId,
    //             // profileId: allProfileIds,
    //         });
    //     } else {
    //         Toast.show({
    //             type: "error",
    //             text1: "Error",
    //             text2: "Failed to log profile visit.",
    //             position: "top",
    //         });
    //     }
    // };

    const handleProfileClick = async (viewedProfileId) => {
        // 1. Check profile data validity
        const profileCheckResponse = await fetchProfileDataCheck(viewedProfileId);
        console.log('profile view msg', profileCheckResponse);

        if (profileCheckResponse?.status === "failure") {
            Toast.show({
                type: "error",
                text1: profileCheckResponse.message,
                position: "top",
            });
            return; // Stop the function
        }

        // 2. Log profile visit and wait for success result
        const success = await logProfileVisit(viewedProfileId);

        if (success) {
            try {

                // Log successful visit with Toast
                // Toast.show({
                //     type: "success",
                //     text1: "Profile Viewed",
                //     text2: `You have viewed profile ${viewedProfileId}.`,
                //     position: "top",
                // });

                // 3. Navigate to the profile details page
                // The navigation should happen immediately after the Toast is queued/shown
                navigation.navigate("ProfileDetails", {
                    viewedProfileId,
                });

            } catch (error) {
                // Catch any potential errors during navigation itself
                console.error("Navigation Error:", error);
                Toast.show({
                    type: "error",
                    text1: "Navigation Failed",
                    text2: "Could not open profile details screen.",
                    position: "top",
                });
            }
        } else {
            // Handle failure in logging the visit
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to log profile visit.",
                position: "top",
            });
        }
    };

    const FeaturedCard = ({ profile }) => {
        const [imageLoaded, setImageLoaded] = useState(false);

        const imageUri = typeof profile.profile_img === 'string'
            ? profile.profile_img
            : Array.isArray(profile.profile_img)
                ? profile.profile_img[0]
                : 'https://your-default-image-url.com/placeholder.jpg';

        return (
            <TouchableOpacity
                style={styles.container}
                activeOpacity={0.9}
                onPress={() => handleProfileClick(profile.profile_id)}
            >
                <View style={styles.featuredProfileDiv}>
                    <View style={styles.featuredProfileContainer}>
                        <View style={styles.imageWrapper}>
                            {!imageLoaded && (
                                <View style={styles.imageLoaderOverlay}>
                                    <ActivityIndicator size="small" color="#FFD700" />
                                </View>
                            )}
                            <Image
                                style={styles.featuredProfileImg}
                                source={{ uri: imageUri }}
                                resizeMode="cover"
                                onLoadEnd={() => setImageLoaded(true)}
                                onError={() => setImageLoaded(true)}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.gradient}
                            />
                        </View>

                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>
                                {profile.profile_name
                                    ? (profile.profile_name.length > 15
                                        ? profile.profile_name.substring(0, 15) + "..."
                                        : profile.profile_name)
                                    : "N/A"
                                }
                                <Text style={styles.profileID}> ({profile.profile_id})</Text>
                            </Text>
                            <View style={styles.profileInfoFlex}>
                                <Text style={styles.profileAge}>{profile.profile_age} years</Text>
                                <Text style={styles.profileHeight}>{profile.profile_height?.height_desc || "N/A"}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderProfile = ({ item: profile }) => <FeaturedCard profile={profile} />;

    // Add error state handling
    if (!validProfiles.length) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No featured profiles available</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={validProfiles}
            renderItem={renderProfile}
            keyExtractor={item => item.profile_id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatListContainer}
            snapToAlignment="center"
            decelerationRate="fast"
            style={styles.flatList}
            initialNumToRender={4}
            maxToRenderPerBatch={6}
            windowSize={5}
            removeClippedSubviews={true}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        marginRight: 10,
        width: Dimensions.get('window').width * 0.4,
    },
    featuredProfileDiv: {
        paddingBottom: 20,
    },
    featuredProfileContainer: {
        position: 'relative',
    },
    imageWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    imageLoaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        zIndex: 1,
    },
    featuredProfileImg: {
        width: 160,
        height: 160,
        borderRadius: 12,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 80,
        zIndex: 0,
    },
    profileInfo: {
        position: 'absolute',
        bottom: 0,
        zIndex: 1,
        padding: 5,
    },
    profileName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    profileID: {
        fontSize: 12,
        color: '#85878C',
    },
    profileAge: {
        color: '#fff',
        fontSize: 12,
    },
    profileHeight: {
        color: '#fff',
        fontSize: 12,
    },
    profileInfoFlex: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        margin: 20,
    },
    flatList: {
        flexGrow: 0,
    },
    flatListContainer: {
        paddingHorizontal: 5,
    },
});