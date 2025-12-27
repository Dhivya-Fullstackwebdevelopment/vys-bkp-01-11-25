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
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { fetchPersonalNotes, handleBookmark, logProfileVisit, fetchProfileDataCheck } from "../../../CommonApiCall/CommonApiCall";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ProfileNotFound } from "../../ProfileNotFound";
import { SuggestedProfiles } from "../../HomeTab/SuggestedProfiles";
import { TopAlignedImage } from "../../ReuseImageAlign/TopAlignedImage";

export const PersonalNotesCard = ({ sortBy = "datetime" }) => {
  const navigation = useNavigation();
  // const [isBookmarked, setIsBookmarked] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());

  const loadPersonalNotes = async (page = 1, isInitialLoad = false) => {
    if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad))
      return;

    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const perPage = 10;
      const response = await fetchPersonalNotes(perPage, page, sortBy);
      console.log(
        "Api response.data.profiles ==>",
        JSON.stringify(response.data.profiles)
      );
      if (response && response.Status === 0) {
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
          if (profile.notes_profile_wishlist === 1) {
            bookmarkedIds.add(profile.notes_profileid);
          }
        });

        if (isInitialLoad) {
          setProfiles(newProfiles);
          setBookmarkedProfiles(bookmarkedIds);
        } else {
          setProfiles((prevProfiles) => [
            ...prevProfiles,
            ...newProfiles,
          ]);
          setBookmarkedProfiles(prev => new Set([...prev, ...bookmarkedIds]));
        }

        setTotalPages(response.data.total_pages || 1);
        setTotalRecords(response.data.total_records || 0);
        setCurrentPage(page);

        console.log("Bookmarked profiles from notes API:", Array.from(bookmarkedIds));
      } else {
        setError("No profiles found or error in response.");
        setProfiles([]);
        setBookmarkedProfiles(new Set());
      }
    } catch (err) {
      setError("Failed to load personal notes. Please try again later.");
      console.error("Error loading personal notes:", err);
      setProfiles([]);
      setBookmarkedProfiles(new Set());
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };


  const handleEndReached = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      loadPersonalNotes(currentPage + 1, false);
    }
  };

  // useEffect(() => {
  //   loadPersonalNotes(1, true);
  // }, [sortBy]);
  const loadProfilesCallback = useCallback(() => {
    // Reset to page 1 and load initially when the screen is focused
    loadPersonalNotes(1, true);
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
          profile.notes_profileid === profileId
            ? { ...profile, notes_profile_wishlist: newStatus === "1" ? 1 : 0 }
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

  const getImageSource = (image) => {
    if (Array.isArray(image)) {
      return { uri: image[0] };
    }
    return { uri: image };
  };

  // const handleProfileClick = async (viewedProfileId) => {
  //   navigation.navigate("ProfileDetails", { viewedProfileId });
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

  const renderItem = ({ item: profile }) => (
    <TouchableOpacity
      style={styles.profileDiv}
      onPress={() => handleProfileClick(profile.notes_profileid)}
    >
      <View style={styles.cardContainer}>
        <View style={styles.profileContainer}>
          <View style={styles.imageContainer}>
            {/* <Image
              source={getImageSource(profile.notes_Profile_img)}
              style={styles.profileImage}
            /> */}
            <TopAlignedImage
              uri={Array.isArray(profile.notes_Profile_img) ? profile.notes_Profile_img[0] : profile.notes_Profile_img}
              width={120}
              height={130}
            />
            <TouchableOpacity
              style={styles.saveIcon} // This style will be updated below
              onPress={() => handleSavePress(profile.notes_profileid)}
            >
              <MaterialIcons
                name={
                  bookmarkedProfiles.has(profile.notes_profileid)
                    ? "bookmark"         // Correct: Filled icon when bookmarked
                    : "bookmark-border"  // Correct: Outline icon when not
                }
                size={24} // Increased size slightly
                color="red"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.profileContent}>
            <View>
              <Text style={styles.profileName}>
                {profile.notes_profile_name || "N/A"}{" "}
                <Text style={styles.profileId}>
                  ({profile.notes_profileid || "N/A"})
                </Text>
              </Text>
              <Text style={styles.profileAge}>
                {profile.notes_profile_age || "N/A"} Yrs{" "}
                <Text style={styles.line}>|</Text> {profile.notes_height || "N/A"} Cms
              </Text>
              <Text style={styles.zodiac}>{profile.notes_star || "N/A"}</Text>
              <Text style={styles.employed}>{profile.notes_profession || "N/A"}</Text>
              <Text style={styles.lastVisit}>Last visit on {profile.notes_lastvisit || "N/A"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>{profile.notes_details}</Text>
          <Text style={styles.notesDesc}>
            Last updated on {profile.notes_lastvisit}
          </Text>
        </View>
      </View>
    </TouchableOpacity >
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.footerText}>Loading more notes...</Text>
      </View>
    );
  };

  return (
    <View style={styles.profileScrollView}>
      <FlatList
        data={profiles}
        renderItem={renderItem}
        keyExtractor={(item) => item.notes_profileid}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        contentContainerStyle={styles.flatListContent}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    // alignItems: "center",
    // justifyContent: "center",
  },
  profileScrollView: {
    width: "100%",
    paddingBottom: 50,
  },
  profileDiv: {
    width: "100%",
    paddingHorizontal: 10,
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestedWrapper: {
    width: '100%',
    backgroundColor: '#FFDE594D',
    paddingTop: 10,
    marginTop: 20,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  // saveIcon: {
  //   position: "absolute",
  //   left: -25,
  //   top: 5,
  // },

  // profileContent: {
  //   paddingLeft: 10,
  // },

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
  notesContainer: {
    width: "100%",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },

  notesTitle: {
    color: "#535665",
    fontSize: 12,
    fontWeight: "700",
  },

  notesDesc: {
    color: "#535665",
    fontSize: 10,
    fontWeight: "300",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
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
  profileContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  imageContainer: {
    width: 120,
    height: 130,
    overflow: "hidden",
    borderRadius: 4,
  },
  saveIcon: {
    position: "absolute",
    top: 0,
    right: 5, // Positions it 5px from the left, like your image
  },
  profileContent: {
    paddingLeft: 10,
    flex: 1, // Add flex: 1 to allow content to fill remaining space
  },
});
