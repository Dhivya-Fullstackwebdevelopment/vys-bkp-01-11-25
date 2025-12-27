import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { markProfileWishlist, logProfileVisit, fetchProfileDataCheck } from "../../CommonApiCall/CommonApiCall";
import {
  Ionicons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";

export const FeaturedOrSuggestProfiles = ({ route }) => {
  const navigation = useNavigation();
  const { type, profiles, page = 1 } = route.params;
  const [allProfileIds, setAllProfileIds] = useState({});

  useEffect(() => {
    if (profiles && profiles.length > 0) {
      const profileIds = profiles.reduce((acc, profile, index) => {
        const globalIndex = (page - 1) * 10 + index;
        acc[globalIndex] = profile.profile_id;
        return acc;
      }, {});

      setAllProfileIds(prev => ({
        ...prev,
        ...profileIds
      }));
    }
  }, [profiles, page]);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  console.log("profiles", profiles);

  const handleSavePress = async (profileId) => {
    console.log("profileId", profileId);
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

  // Function to get image source, handling both URL and Base64 cases
  const getImageSource = (image) => {
    if (!image) return { uri: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%2Fimages%3Fk%3Ddefault%2Bimage&psig=AOvVaw28Px6jC5wsx4TWxwOrHJT2&ust=1726388184602000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMCfpqb_wYgDFQAAAAAdAAAAABAE' }; // Fallback image
    if (Array.isArray(image)) {
      return { uri: image[0] }; // Use the first image if it's an array
    }
    return { uri: image }; // Direct URL case
  };

  // const handleProfileClick = async (viewedProfileId) => {
  //   navigation.navigate("ProfileDetails", { viewedProfileId, allProfileIds });
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

  const renderProfileItem = ({ item, index }) => {
    const profileId = allProfileIds[index];
    return (
      <TouchableOpacity
        style={styles.profileDiv}
        onPress={() => handleProfileClick(profileId)}
      >
        <View style={styles.profileContainer}>
          <Image
            source={getImageSource(item.profile_img)}
            style={styles.profileImage}
          />
          <View style={styles.profileContent}>
            <Text style={styles.profileName}>
              {item.profile_name}{" "}
              <Text style={styles.profileId}>
                ({item.profile_id})
              </Text>
            </Text>
            <Text style={styles.profileAge}>
              {item.profile_age} Yrs{" "}
              <Text style={styles.line}>|</Text>
              {item.profile_height}{" "}
            </Text>
            <Text style={styles.zodiac}>{item.star}</Text>
            <Text style={styles.employed}>
              {item.profession}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.contentConatiner}>
      <Text style={styles.profileName}>
        {/* {type === "featured" ? "Featured Profiles" : "Suggested Profiles"}
        <Text style={styles.profileId}> ({profiles.length})</Text> */}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ED1E24" />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {type === "featured" ? "Featured Profiles" : "Suggested Profiles"}
            <Text style={styles.profileId}> ({profiles.length})</Text>
          </Text>
        </View>
        <FlatList
          data={profiles}
          renderItem={renderProfileItem}
          keyExtractor={(item) => item.profile_id.toString()}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.cardContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => <Text style={styles.errorText}>No profiles found</Text>}
        />
      </SafeAreaView>
      <BottomTabBarComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginBottom: 50,
  },
  headerContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  countText: {
    color: "#85878C",
    fontSize: 16,
  },
  cardContainer: {
    padding: 8,
  },
  errorText: {
    color: "#FF0000",
    textAlign: "center",
    padding: 20,
  },
  contentConatiner: {
    width: "100%",
    paddingHorizontal: 10,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#282C3F",
    fontFamily: "inter",
    paddingTop: 10,
  },
  profileId: {
    fontSize: 14,
    color: "#85878C",
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
});
