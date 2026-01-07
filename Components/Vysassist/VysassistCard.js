import React, { useState, useEffect, useCallback } from "react";
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  getVysassistList,
  handleBookmark,
  logProfileVisit,
  fetchProfileDataCheck,
  getWishlistProfiles,
} from "../../CommonApiCall/CommonApiCall";
import { ProfileNotFound } from "../ProfileNotFound";
import { TopAlignedImage } from "../ReuseImageAlign/TopAlignedImage";

export const VysassistCard = ({ sortBy = "datetime" }) => {
  const [profiles, setProfiles] = useState([]);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [allProfileIds, setAllProfileIds] = useState({});

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
      const response = await getVysassistList(perPage, page, sortBy);

      if (response && response.Status === 0) {
        // Handle the "No Vysassist found" case
        setProfiles([]);
        setTotalPages(1);
        setTotalRecords(0);
        setCurrentPage(1);
        setBookmarkedProfiles(new Set());
      } else if (response && response.data) {
        const newProfiles = response.data.profiles || [];

        // START: --- ADD THIS LOGIC ---
        // Extract bookmarked profiles from THIS API response
        const bookmarkedIds = new Set();
        newProfiles.forEach(profile => {
          if (profile.vys_profile_wishlist === 1) {
            bookmarkedIds.add(profile.vys_profileid);
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
          acc[globalIndex] = profile.vys_profileid;
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
      console.error("Error loading profiles:", error);
      setProfiles([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleEndReached = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      console.log("Loading more more more profiles...", { currentPage });
      loadProfiles(currentPage + 1, false);
    }
  };

  // useEffect(() => {
  //   // Initial load
  //   loadProfiles(1, true);
  // }, [sortBy]);

  const loadProfilesCallback = useCallback(() => {
    // Reset to page 1 and load initially when the screen is focused
    loadProfiles(1, true);
  }, [sortBy]); // Dependency array should include sortBy

  // Use useFocusEffect to call loadProfiles every time the screen is focused
  useFocusEffect(loadProfilesCallback);

  // useEffect(() => {
  //   const loadWishlistProfiles = async () => {
  //     try {
  //       const response = await getWishlistProfiles();
  //       if (response) {
  //         const profileIds = response.map(
  //           (profile) => profile.wishlist_profileid
  //         );
  //         const profileIdsSet = new Set(profileIds);
  //         setBookmarkedProfiles(profileIdsSet);
  //       } else {
  //         console.log("No profiles found in response.");
  //       }
  //     } catch (error) {
  //       console.error("Error loading wishlist profiles:", error);
  //     }
  //   };
  //   loadWishlistProfiles();
  // }, []);

  // ... rest of your existing functions (handleSavePress, handleProfileClick, getImageSource) remain the same ...
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
      // Toast.show({
      //   type: "success",
      //   text1: "Profile Viewed",
      //   text2: `You have viewed profile ${viewedProfileId}.`,
      //   position: "bottom",
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
    <FlatList
      data={profiles}
      keyExtractor={(item) => item.vys_profileid}
      renderItem={({ item }) => (
        <TouchableOpacity
          key={item.vys_profileid}
          onPress={() => handleProfileClick(item.vys_profileid)}
          style={styles.profileDiv}
        >
          <View style={styles.profileContainer}>
            {/* <Image
              source={getImageSource(item.vys_Profile_img)}
              style={styles.profileImage}
            /> */}
            <TopAlignedImage
              uri={Array.isArray(item.viwed_Profile_img) ? item.viwed_Profile_img[0] : item.viwed_Profile_img}
              width={120}
              height={120}
            />
            <TouchableOpacity
              onPress={() => handleSavePress(item.vys_profileid)}
            >
              <MaterialIcons
                name={
                  bookmarkedProfiles.has(item.vys_profileid)
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
                {/* {item.vys_profile_name || "N/A"}{" "} */}
                {item.vys_profile_name
                  ? (item.vys_profile_name.length > 15
                    ? item.vys_profile_name.substring(0, 15) + "..."
                    : item.vys_profile_name)
                  : "N/A"
                }
                <Text style={styles.profileId}>({item.vys_profileid || "N/A"})</Text>
              </Text>
              <Text style={styles.profileAge}>
                {item.vys_profile_age || "N/A"} Yrs <Text style={styles.line}>|</Text>{" "}
                {item.vys_height || "N/A"} Cms
              </Text>
              <Text style={styles.zodiac}>{item.vys_degree || "N/A"}</Text>
              <Text style={styles.employed}>{item.vys_profession || "N/A"}</Text>
              <Text style={styles.lastVisit}>
                Last visit on {item.vys_lastvisit || "N/A"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.2}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.profileScrollView}
      showsVerticalScrollIndicator={true}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
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
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    marginTop: 5,
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
  profileContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    borderRadius: 8,
    padding: 8,
    marginVertical: 5,
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
  lastVisit: {
    fontSize: 14,
    color: "#4F515D",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#000000",
    textAlign: "center",
    fontweight: "bold",
  },
});
