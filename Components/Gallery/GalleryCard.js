// GalleryCard
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import {
  logProfileVisit,
  getGalleryList,
  fetchProfileDataCheck
} from "../../CommonApiCall/CommonApiCall";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileNotFound } from "../ProfileNotFound";
import { SuggestedProfiles } from "../HomeTab/SuggestedProfiles";

export const GalleryCard = () => {
  const [profiles, setProfiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [allProfileIds, setAllProfileIds] = useState({});
  const [totalRecords, setTotalRecords] = useState(0);

  const navigation = useNavigation();

  const loadProfiles = async (page = 1, isInitialLoad = false) => {
    console.log("Loading profiles:", { page, isInitialLoad });
    if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad))
      return;

    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const perPage = 10;
      const response = await getGalleryList(perPage, page);
      console.log(
        "Api response.data.image_data ==>",
        JSON.stringify(response)
      );
      if (response && response.data && response.data.image_data) {
        if (isInitialLoad) {
          setProfiles(response.data.image_data || []);
        } else {
          setProfiles((prevProfiles) => [
            ...prevProfiles,
            ...(response.data.image_data || []),
          ]);
        }
        // Update profile IDs mapping
        const profileIds = response.data.image_data.reduce((acc, profile, index) => {
          const globalIndex = (page - 1) * 10 + index; // Calculate global index based on page
          acc[globalIndex] = profile.profile_id;
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
        console.log("No profiles found or error in response.", profiles);
        setProfiles([]);
        setError("No profiles found or error in response.");
      }
      console.log(
        "Api response.data.image_data ==>",
        JSON.stringify(response)
      );
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // const loadProfiles = async (page = 1, isInitialLoad = false) => {
  //   if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad)) return;

  //   if (isInitialLoad) {
  //     setIsLoading(true);
  //   } else {
  //     setIsLoadingMore(true);
  //   }

  //   try {
  //     const count = await AsyncStorage.getItem("totalcount");
  //     const totalCount = parseInt(count, 10);
  //     const perPage = 10;

  //     const response = await getGalleryList(perPage, page);
  //     console.log(
  //       "Api response.data.image_data ==>",
  //       JSON.stringify(response)
  //     );
  //     if (response && response.data && response.data.image_data) {
  //       if (isInitialLoad) {
  //         setProfiles(response.data.image_data || []);
  //       } else {
  //         setProfiles((prevProfiles) => [
  //           ...prevProfiles,
  //           ...(response.data.image_data || []),
  //         ]);
  //       }
  //       // Update current page only if the API call was successful
  //       setCurrentPage(page);

  //       // Update profile IDs mapping
  //       const profileIds = response.data.image_data.reduce((acc, profile, index) => {
  //         const globalIndex = (page - 1) * 10 + index; // Calculate global index based on page
  //         acc[globalIndex] = profile.profile_id;
  //         return acc;
  //       }, {});

  //       setAllProfileIds(prev => ({
  //         ...prev,
  //         ...profileIds
  //       }));
  //       setTotalPages(Math.ceil(totalCount / perPage));
  //     } else {
  //       console.log("No profiles found or error in response.", profiles);
  //       setProfiles([]);
  //       setError("No profiles found or error in response.");
  //     }
  //     console.log(
  //       "Api response.data.image_data ==>",
  //       JSON.stringify(response)
  //     );
  //   }
  //   catch (error) {
  //     console.error("Error loading profiles:", error);
  //     setError("Failed to load gallery. Please try again later.");
  //     setProfiles([]);
  //   } finally {
  //     setIsLoading(false);
  //     setIsLoadingMore(false);
  //   }
  // }

  useEffect(() => {
    loadProfiles(1, true);
  }, []);

  const handleEndReached = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      loadProfiles(currentPage + 1, false);
    }
  };

  // const handleProfileClick = async (viewedProfileId) => {
  //   const success = await logProfileVisit(viewedProfileId);

  //   if (success) {
  //     navigation.navigate("ProfileDetails", { viewedProfileId, allProfileIds });
  //   } else {
  //     Toast.show({
  //       type: "error",
  //       text1: "Error",
  //       text2: "Failed to log profile visit.",
  //       position: "bottom",
  //     });
  //   }
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
      Toast.show({
        type: "success",
        text1: "Profile Viewed",
        text2: `You have viewed profile ${viewedProfileId}.`,
        position: "bottom",
      });
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
    if (!image)
      return {
        uri: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%2Fimages%3Fk%3Ddefault%2Bimage&psig=AOvVaw28Px6jC5wsx4TWxwOrHJT2&ust=1726388184602000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMCfpqb_wYgDFQAAAAAdAAAAABAE",
      };
    if (Array.isArray(image)) {
      return { uri: image[0] };
    }
    return { uri: image };
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      key={item.req_profileid}
      onPress={() => handleProfileClick(item.profile_id)}
      style={styles.profileDiv}
    >
      <View style={styles.cardContainer}>

        {/* Profile Image Container (Needs relative positioning for the button overlay) */}
        <View style={styles.imageWrapper}>
          {/* <Image
            source={getImageSource(item.img_url)}
            style={styles.profileImage}
            resizeMode="cover"
          /> */}
          <Image
            source={getImageSource(item.img_url)}
            style={styles.profileImage}
            resizeMode="cover"
            imageStyle={{ alignSelf: 'flex-start' }} // This positions image from top
          />
          {/* VIEW BUTTON OVERLAY (New Element) */}
          {/* <View style={styles.viewButtonOverlay}>
            <Text style={styles.viewButtonText}>View</Text>
          </View> */}
        </View>

        {/* Profile ID centered beneath the image (New Element) */}
        <Text style={styles.profileIdCentered}>
          {item.profile_id}
        </Text>

      </View>
    </TouchableOpacity>
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

  if (isLoading && profiles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    // <View style={styles.listContent}>
    <FlatList
      data={profiles}
      renderItem={renderItem}
      keyExtractor={(item) => item.profile_id}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.2}
      contentContainerStyle={styles.profileScrollView}
      showsVerticalScrollIndicator={true}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
      ListFooterComponent={renderFooter}
      // ListFooterComponent={() => (
      //           <>
      //             {renderFooter()}
      //             {/* <View style={styles.suggestedWrapper}>
      //               <SuggestedProfiles />
      //             </View> */}
      //           </>
      //         )}
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <ProfileNotFound />
        )
      }
    />
    // </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    width: "100%",
    paddingBottom: 80,
  },
  profileScrollView: {
    width: "100%",
    paddingBottom: 50,
  },
  profileDiv: {
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  suggestedWrapper: {
    width: '100%',
    backgroundColor: '#FFDE594D',
    paddingTop: 10,
    marginTop: 20,
  },
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8, // Padding around the image and ID
    marginVertical: 6,
    // Center alignment for the profile ID below the image
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  profileContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 3 / 3,
    borderRadius: 8,
    overflow: "hidden",
    position: 'relative',
    justifyContent: 'flex-start',
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: 'cover',
    overflow: 'hidden',
  },
  saveIcon: {
    position: "absolute",
    right: 10,
    top: 10,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    marginTop: 5,
  },
  viewButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }], // Center it exactly
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 50,
    borderWidth: 1,
    // borderColor: '#ED1E24',
  },

  viewButtonText: {
    // color: '#ED1E24', // Red text color
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileIdCentered: {
    fontSize: 14,
    color: "#4F515D",
    fontWeight: 'bold',
    marginTop: 5, // Small gap between image and ID
    marginBottom: 5, // Gap before the next card
    textAlign: 'center',
  },
});
