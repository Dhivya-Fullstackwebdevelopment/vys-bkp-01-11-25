import React, { useEffect, useState } from "react";
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
import {
  getInterestsList,
  markProfileWishlist,
} from "../../../CommonApiCall/CommonApiCall"; // Import the functions
import { useNavigation } from "@react-navigation/native";
import { ProfileNotFound } from "../../ProfileNotFound";
import { SuggestedProfiles } from "../../HomeTab/SuggestedProfiles";
import { FeaturedProfiles } from "../../HomeTab/FeaturedProfiles";
export const InterestSentCard = ({ sortBy = "datetime" }) => {
  const navigation = useNavigation();
  const [profiles, setProfiles] = useState([]);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Add new state variables for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [allProfileIds, setAllProfileIds] = useState({});

  const loadProfiles = async (page = 1, isInitialLoad = false) => {
    if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad))
      return;

    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const perPage = 10;
      const response = await getInterestsList(perPage, page, sortBy);

      if (response && response.Status === 0) {
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

        setTotalPages(response.data.total_pages || 1);
        setTotalRecords(response.data.total_records || 0);
        setCurrentPage(page);
        // Update profile IDs mapping
        const profileIds = response.data.profiles.reduce((acc, profile, index) => {
          const globalIndex = (page - 1) * perPage + index; // Calculate global index based on page
          acc[globalIndex] = profile.myint_profileid;
          return acc;
      }, {});
      
      setAllProfileIds(prev => ({
          ...prev,
          ...profileIds
      }));
      } else {
        setError("No profiles found or error in response.");
        setProfiles([]);
      }
    } catch (error) {
      setError("Failed to fetch profiles. Please try again later.");
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
    if (!image)
      return {
        uri: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%2Fimages%3Fk%3Ddefault%2Bimage&psig=AOvVaw28Px6jC5wsx4TWxwOrHJT2&ust=1726388184602000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMCfpqb_wYgDFQAAAAAdAAAAABAE",
      }; // Fallback image
    if (Array.isArray(image)) {
      return { uri: image[0] }; // Use the first image if it's an array
    }
    return { uri: image }; // Direct URL case
  };

  const handleSavePress = async (profileId) => {
    const updatedBookmarkedProfiles = new Set(bookmarkedProfiles);
    const newStatus = updatedBookmarkedProfiles.has(profileId) ? "0" : "1";

    try {
      await markProfileWishlist(profileId, newStatus);
      if (newStatus === "1") {
        updatedBookmarkedProfiles.add(profileId);
      } else {
        updatedBookmarkedProfiles.delete(profileId);
      }
      setBookmarkedProfiles(updatedBookmarkedProfiles);
    } catch (error) {
      // Error handling is done within the API function, so no need here
    }
  };

  const handleProfileClick = async (viewedProfileId) => {
    navigation.navigate("ProfileDetails", {
      viewedProfileId,
      allProfileIds,
    });
  };

  const renderItem = ({ item: profile }) => (
    <TouchableOpacity
      key={profile.myint_profileid}
      style={styles.profileDiv}
      onPress={() => handleProfileClick(profile.myint_profileid)}
    >
      <View style={styles.profileContainer}>
        <Image
          source={getImageSource(profile.myint_Profile_img)}
          style={styles.profileImage}
        />
        <TouchableOpacity
          onPress={() => handleSavePress(profile.myint_profileid)}
        >
          <MaterialIcons
            name={
              bookmarkedProfiles.has(profile.myint_profileid)
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
            {profile.myint_profile_name}{" "}
            <Text style={styles.profileId}>({profile.myint_profileid})</Text>
          </Text>
          <Text style={styles.profileAge}>
            {profile.myint_profile_age} Yrs <Text style={styles.line}>|</Text>{" "}
            5ft 10in (177 cms)
          </Text>
          <Text style={styles.zodiac}>Uthiram</Text>
          <Text style={styles.employed}>Employed</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={profiles}
      renderItem={renderItem}
      keyExtractor={(item) => item.myint_profileid.toString()}
      style={styles.profileScrollView}
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.2}
      ListFooterComponent={() => (
        <>
          {renderFooter()}
          <View style={styles.suggestedWrapper}>
            <SuggestedProfiles />
            {/* <FeaturedProfiles /> */}
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
  suggestedWrapper: {
    width: "100%",
    backgroundColor: "#FFDE594D",
    paddingTop: 10,
    marginTop: 20,
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
    marginVertical: 7,
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    margin: 20,
    fontSize: 16,
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
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    marginTop: 5,
  },
});
