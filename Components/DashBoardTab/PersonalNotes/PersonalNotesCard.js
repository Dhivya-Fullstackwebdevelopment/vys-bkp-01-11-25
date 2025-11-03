import React, { useState, useEffect } from "react";
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
import { fetchPersonalNotes } from "../../../CommonApiCall/CommonApiCall";
import { useNavigation } from "@react-navigation/native";
import { ProfileNotFound } from "../../ProfileNotFound";
import { SuggestedProfiles } from "../../HomeTab/SuggestedProfiles";

export const PersonalNotesCard = ({ sortBy = "datetime" }) => {
  const navigation = useNavigation();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

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
      } else {
        setError("No profiles found or error in response.");
        setProfiles([]);
      }
    } catch (err) {
      setError("Failed to load personal notes. Please try again later.");
      console.error("Error loading personal notes:", err);
      setProfiles([]);
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

  useEffect(() => {
    loadPersonalNotes(1, true);
  }, [sortBy]);

  const handleSavePress = () => {
    setIsBookmarked(!isBookmarked);
    Toast.show({
      type: isBookmarked ? "info" : "success",
      text1: isBookmarked ? "Unsaved" : "Saved",
      text2: isBookmarked
        ? "Profile has been removed from bookmarks."
        : "Profile has been saved to bookmarks.",
      position: "bottom",
    });
  };

  const getImageSource = (image) => {
    if (Array.isArray(image)) {
      return { uri: image[0] };
    }
    return { uri: image };
  };

  const handleProfileClick = async (viewedProfileId) => {
    navigation.navigate("ProfileDetails", { viewedProfileId });
  };

  const renderItem = ({ item: profile }) => (
    <TouchableOpacity
      style={styles.profileDiv}
      onPress={() => handleProfileClick(profile.notes_profileid)}
    >
      <View style={styles.cardContainer}>
        <View style={styles.profileContainer}>
          <Image
            source={getImageSource(profile.notes_Profile_img)}
            style={styles.profileImage}
          />
          <TouchableOpacity
            onPress={() => handleSavePress(profile.notes_profileid)}
          >
            <MaterialIcons
              name={isBookmarked ? "bookmark" : "bookmark-border"}
              size={20}
              color="#fff"
              style={styles.saveIcon}
            />
          </TouchableOpacity>

          <View style={styles.profileContent}>
            <View>
              <Text style={styles.profileName}>
                {profile.notes_profile_name}{" "}
                <Text style={styles.profileId}>
                  ({profile.notes_profileid})
                </Text>
              </Text>
              <Text style={styles.profileAge}>
                {profile.notes_profile_age} Yrs{" "}
                <Text style={styles.line}>|</Text> {profile.notes_height} cms
              </Text>
              <Text style={styles.zodiac}>{profile.notes_star}</Text>
              <Text style={styles.employed}>{profile.notes_profession}</Text>
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
    </TouchableOpacity>
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
});
