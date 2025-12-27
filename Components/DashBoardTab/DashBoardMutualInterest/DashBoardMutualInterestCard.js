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
import {
  fetchMutualInterests,
  markProfileWishlist,
  handleBookmark,
  logProfileVisit,
  fetchProfileDataCheck
} from "../../../CommonApiCall/CommonApiCall"; // Update import path
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ProfileNotFound } from "../../ProfileNotFound";
import { SuggestedProfiles } from "../../HomeTab/SuggestedProfiles";
import { TopAlignedImage } from "../../ReuseImageAlign/TopAlignedImage";

export const DashBoardMutualInterestCard = ({ sortBy = "datetime" }) => {
  const navigation = useNavigation();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [allProfileIds, setAllProfileIds] = useState({});

  const loadProfiles = async (page = 1, isInitialLoad = false) => {
    console.log("Loading profiles1:", { page, isInitialLoad });
    if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad))
      return;
    console.log("Loading profiles21:", { page, isInitialLoad });
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const perPage = 10;
      const response = await fetchMutualInterests(perPage, page, sortBy);
      console.log("Loading profiles:", { response });
      if (response && response.Status === 0) {
        // Handle the "No Vysassist found" case
        setProfiles([]);
        setTotalPages(1);
        setTotalRecords(0);
        setCurrentPage(1);
        setBookmarkedProfiles(new Set());
      } else if (response && response.data) {
        const newProfiles = response.data.profiles || [];

        const bookmarkedIds = new Set();
        newProfiles.forEach(profile => {
          if (profile.mutint_profile_wishlist === 1) {
            bookmarkedIds.add(profile.mutint_profileid);
          }
        });

        if (isInitialLoad) {
          setProfiles(newProfiles);
          setBookmarkedProfiles(bookmarkedIds);
        } else {
          setProfiles((prevProfiles) => [...prevProfiles, ...newProfiles]);
          setBookmarkedProfiles(prev => new Set([...prev, ...bookmarkedIds]));
        }

        setTotalPages(response.data.total_pages || 1);
        setTotalRecords(response.data.total_records || 0);
        setCurrentPage(page);
        const profileIds = response.data.profiles.reduce((acc, profile, index) => {
          const globalIndex = (page - 1) * perPage + index;
          acc[globalIndex] = profile.mutint_profileid;
          return acc;
        }, {});

        setAllProfileIds(prev => ({
          ...prev,
          ...profileIds
        }));
      } else {
        console.warn("No profiles found or error in response.");
        setProfiles([]);
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
  //   loadProfiles(1, true);
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

  // Function to get image source, handling both URL and Base64 cases
  const getImageSource = (image) => {
    if (!image)
      return {
        uri: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%2Fimages%3Fk%3Ddefault%2Bimage&psig=AOvVaw28Px6jC5wsx4TWxwOrHJT2&ust=1726388184602000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMCfpqb_wYgDFQAAAAAdAAAAABAE",
      }; // Fallback image
    if (Array.isArray(image)) {
      return { uri: image[0] }; // Use the first image if it's an array
    }
    return { uri: image }; // Direct URL case
  };

  // const handleProfileClick = async (viewedProfileId) => {

  //   navigation.navigate("ProfileDetails", {
  //     viewedProfileId,
  //     profileId: allProfileIds,
  //   });
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
      //   type: "success",
      //   text1: "Profile Viewed",
      //   text2: `You have viewed profile ${viewedProfileId}.`,
      //   position: "bottom",
      // });
      // navigation.navigate("ProfileDetails", { id });
      navigation.navigate("ProfileDetails", {
        viewedProfileId,
        profileId: allProfileIds,
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
      onPress={() => handleProfileClick(profile.mutint_profileid)}
    >
      <View style={styles.profileContainer}>
        {/* <Image
          source={getImageSource(profile.mutint_Profile_img)}
          style={styles.profileImage}
        /> */}
        <TopAlignedImage
          uri={Array.isArray(profile.mutint_Profile_img) ? profile.mutint_Profile_img[0] : profile.mutint_Profile_img}
          width={120}
          height={120}
        />
        <TouchableOpacity
          onPress={() => handleSavePress(profile.mutint_profileid)}
        >
          <MaterialIcons
            name={
              bookmarkedProfiles.has(profile.mutint_profileid)
                ? "bookmark"
                : "bookmark-border"
            }
            size={20}
            color="red"
            style={styles.saveIcon}
          />
        </TouchableOpacity>

        <View style={styles.profileContent}>
          <Text style={styles.profileName}>
            {profile.mutint_profile_name || "N/A"}
            <Text style={styles.profileId}>({profile.mutint_profileid})</Text>
          </Text>
          <Text style={styles.profileAge}>
            {profile.mutint_profile_age || "N/A"} Yrs <Text style={styles.line}>|</Text>
            {profile.mutint_height || "N/A"} Cms
          </Text>
          <Text style={styles.zodiac}>{profile.mutint_star || "N/A"}</Text>
          <Text style={styles.employed}>{profile.mutint_profession || "N/A"}</Text>
          <Text style={styles.lastVisit}>
            Last visit on {profile.mutint_lastvisit || "N/A"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyListComponent = () =>
    isLoading ? (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    ) : (
      <ProfileNotFound />
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
      <FlatList
        data={profiles}
        renderItem={renderItem}
        keyExtractor={(item) => item.mutint_profileid.toString()}
        ListEmptyComponent={EmptyListComponent}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        // ListFooterComponent={renderFooter}
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
  },

  profileScrollView: {
    width: "100%",
    paddingBottom: 50,
  },

  profileDiv: {
    width: "100%",
    paddingHorizontal: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    borderRadius: 10,
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

  messageText: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
    color: "#666",
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
