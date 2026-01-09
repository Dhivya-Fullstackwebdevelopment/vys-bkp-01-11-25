import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import {
  fetchProfiles,
  handleBookmark,
  logProfileVisit,
  getWishlistProfiles,
  fetchProfileData,
  fetchProfileDataCheck,
} from "../../../CommonApiCall/CommonApiCall";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileNotFound } from "../../ProfileNotFound";
import { SuggestedProfiles } from "../SuggestedProfiles";
import { FeaturedProfiles } from "../FeaturedProfiles";
import { TopAlignedImage } from "../../ReuseImageAlign/TopAlignedImage";
import { Dimensions } from "react-native";
import { PlatinumModalPopup } from "../../ReusePopups/PlatinumModalPopup";

export const ProfileCard = ({ searchProfiles, isLoadingNew, orderBy = "1", viewMode = "list" }) => {
  const [profiles, setProfiles] = useState([]);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentOrderBy, setCurrentOrderBy] = useState(orderBy);
  const navigation = useNavigation();
  const [allProfileIds, setAllProfileIds] = useState({});
  const numColumns = viewMode === 'grid' ? 1 : 1;
  const key = `flatlist-${viewMode}`;
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const [showPlatinumModal, setShowPlatinumModal] = useState(false);

  console.log("ProfileCard received searchProfiles:", searchProfiles?.length || 'null');
  console.log("ProfileCard received orderBy:", orderBy);

  const loadProfiles = async (page = 1, isInitialLoad = false, sortOrder) => {
    if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad)) return;

    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const perPage = 10;
      console.log(`Loading profiles - Page: ${page}, Order: ${sortOrder}`);

      // Pass the orderBy parameter to fetchProfiles
      const response = await fetchProfiles(perPage, page, sortOrder);

      console.log("Profiles response:", response);
      console.log("All Profile IDs from API:", response?.all_profile_ids);

      if (response?.Status === 0) {
        console.log("Error fetching profiles:", response?.Message || "Unknown error");
        setProfiles(null);
        setTotalPages(1);
        setTotalRecords(0);
        setCurrentPage(1);
        setAllProfileIds({});
      } else if (response?.profiles) {
        const newProfiles = response.profiles || [];

        if (isInitialLoad) {
          setProfiles(newProfiles);
          // Reset profile IDs on initial load
          setAllProfileIds(response.all_profile_ids || {});
        } else {
          setProfiles((prevProfiles) => [...prevProfiles, ...(newProfiles || [])]);
          // Merge profile IDs for pagination
          setAllProfileIds((prevIds) => ({
            ...prevIds,
            ...(response.all_profile_ids || {})
          }));
        }
        const wishlistedIds = newProfiles
          .filter((p) => p.wish_list === 1 || p.wish_list === "1")
          .map((p) => p.profile_id);

        if (wishlistedIds.length > 0) {
          setBookmarkedProfiles((prevSet) => {
            const updated = new Set(prevSet);
            wishlistedIds.forEach((id) => updated.add(id));
            return updated;
          });
        }
        setTotalPages(Math.ceil(response.total_count / perPage));
        setTotalRecords(response.total_count || 0);
        setCurrentPage(page);

        console.log("Updated allProfileIds:", response.all_profile_ids);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleEndReached = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      loadProfiles(currentPage + 1, false, currentOrderBy);
    }
  };

  // Initial load
  useEffect(() => {
    console.log("Initial load with orderBy:", orderBy);
    setCurrentOrderBy(orderBy);
    loadProfiles(1, true, orderBy);
  }, []);

  // Reload when orderBy changes
  useEffect(() => {
    console.log("OrderBy changed to:", orderBy, "Current:", currentOrderBy);
    if (orderBy !== currentOrderBy) {
      console.log("Reloading profiles with new order:", orderBy);
      setCurrentOrderBy(orderBy);
      setProfiles([]); // Clear existing profiles
      setCurrentPage(1); // Reset to first page
      loadProfiles(1, true, orderBy);
    }
  }, [orderBy]);

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

  useEffect(() => {
    const loadWishlistProfiles = async () => {
      try {
        const response = await getWishlistProfiles();

        if (response) {
          const profileIds = response.map(
            (profile) => profile.wishlist_profileid
          );
          const profileIdsSet = new Set(profileIds);
          setBookmarkedProfiles(profileIdsSet);
        } else {
          console.log("No profiles found in response.");
        }
      } catch (error) {
        console.log("Error loading wishlist profiles:", error);
      }
    };

    loadWishlistProfiles();
  }, []);

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

  const handleProfileClick = async (viewedProfileId) => {
    try {
      const data = await fetchProfileDataCheck(viewedProfileId, "1");
      console.log("data 1 ==>", data);

      if (data?.status === "failure") {
        Toast.show({
          type: "error",
          // text1: "Profile Error", // You can keep this general
          text1: data.message, // <-- This displays the exact API message
          position: "bottom",
        });
        return; // Stop the function
      }
      const success = await logProfileVisit(viewedProfileId);
      console.log("Log visit success 2:", success);

      if (data.Status === "failure") {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.data.Message || "Limit reached to view profile",
          position: "bottom",
        });
      }

      // Create allProfileIds from current profiles or search results
      const currentProfiles = Array.isArray(searchProfiles) && searchProfiles.length > 0
        ? searchProfiles
        : profiles;

      const profileIdsForNavigation = currentProfiles.reduce((acc, profile, index) => {
        acc[index + 1] = profile.profile_id;
        return acc;
      }, {});

      console.log("Navigating with profile IDs:", profileIdsForNavigation);

      navigation.navigate("ProfileDetails", {
        viewedProfileId,
        allProfileIds: profileIdsForNavigation,
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.message ||
        "";

      if (serverMessage === "Profile visibility restricted") {
        setShowPlatinumModal(true);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: serverMessage || "Something went wrong.",
          position: "bottom",
        });
        console.error("Profile click error:", error);
      }
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

  const flatListProps = {
    onEndReached: handleEndReached,
    onEndReachedThreshold: 0.5,
    ListFooterComponent: renderFooter,
    removeClippedSubviews: true,
    initialNumToRender: 10,
    maxToRenderPerBatch: 5,
    updateCellsBatchingPeriod: 100,
    windowSize: 21,
  };

  const renderGridItem = ({ item }) => (
    <TouchableOpacity
      key={item.profile_id}
      onPress={() => handleProfileClick(item.profile_id)}
      style={styles.gridItemContainer}
    >
      <View style={styles.gridCard}>
        {/* <Image
          source={getImageSource(item.profile_img)}
          style={styles.gridImage}
        /> */}
        <View style={styles.imageContainer}>
          <TopAlignedImage
            uri={Array.isArray(item.profile_img) ? item.profile_img[0] : item.profile_img}
            width={SCREEN_WIDTH - 30}
            height={300}
            // Apply blurRadius only when protected
            blurRadius={item.photo_protection === 1 ? 20 : 0}
          />

          {/* Render the lock overlay only if photo_protection is 1 */}
          {item.photo_protection === 1 && (
            <View style={styles.lockOverlayLarge}>
              <MaterialIcons name="lock" size={60} color="#FF6666" />
              <Text style={styles.lockOverlayText}>
                Click here to request password to view profile photo
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleSavePress(item.profile_id)}
          style={styles.gridSaveIcon}
        >
          <MaterialIcons
            name={
              bookmarkedProfiles.has(item.profile_id)
                ? "bookmark"
                : "bookmark-border"
            }
            size={20}
            color="red"
          />
        </TouchableOpacity>
        <View style={styles.gridContent}>
          <Text style={styles.gridProfileName} numberOfLines={1}>
            {item.profile_name} <Text style={styles.gridProfileId}>({item.profile_id})</Text>
          </Text>
          <Text style={styles.gridProfileAge}>
            {item.profile_age} Yrs | {item.height} Cms
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity
      key={item.profile_id}
      onPress={() => handleProfileClick(item.profile_id)}
    >
      <View style={styles.profileDiv}>
        <View style={styles.profileContainer}>
          {/* <Image
            source={getImageSource(item.profile_img)}
            style={styles.profileImage}
          /> */}
          <View style={styles.listImageWrapper}>
            <TopAlignedImage
              uri={Array.isArray(item.profile_img) ? item.profile_img[0] : item.profile_img}
              width={100}
              height={100}
              blurRadius={item.photo_protection === 1 ? 12 : 0}
            />
            {item.photo_protection === 1 && (
              <View style={styles.listLockOverlay}>
                <MaterialIcons name="lock" size={24} color="#FF6666" />
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => handleSavePress(item.profile_id)}
          >
            <MaterialIcons
              name={
                bookmarkedProfiles.has(item.profile_id)
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
              {/* {item.profile_name}{" "} */}
              {item.profile_name
                ? (item.profile_name.length > 15
                  ? item.profile_name.substring(0, 15) + "..."
                  : item.profile_name)
                : "N/A"
              }

              <Text style={styles.profileId}>({item.profile_id})</Text>
            </Text>
            <View style={styles.ageHeightContainer}>
              <Text style={styles.profileAge}>{item.profile_age} Yrs</Text>
              <Text style={styles.separator}>|</Text>
              <Text style={styles.profileAge}>{item.height} Cms</Text>
            </View>
            <Text style={styles.zodiac}>{item.star}</Text>
            <Text style={styles.employed}>{item.profession}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );


  // return (
  //   <View style={styles.container}>
  //     {isLoadingNew ? (
  //       <View style={styles.loadingContainer}>
  //         <ActivityIndicator size="large" color="#BD1225" />
  //         <Text style={styles.loadingText}>Searching profiles...</Text>
  //       </View>
  //     ) : profiles === null ? (
  //       <View style={styles.noResultsContainer}>
  //         <ProfileNotFound />
  //       </View>
  //     ) : Array.isArray(profiles) && profiles.length > 0 ? (
  //       Array.isArray(searchProfiles) && searchProfiles.length > 0 ? (
  //         <View style={styles.profileScrollView}>
  //           <FlatList
  //             data={searchProfiles}
  //             renderItem={renderSearchItem}
  //             keyExtractor={(item) => item.profile_id.toString()}
  //             contentContainerStyle={styles.flatListContent}
  //             showsVerticalScrollIndicator={true}
  //             ListFooterComponent={() => (
  //               <>
  //                 <View style={styles.suggestedWrapper}>
  //                   <SuggestedProfiles />
  //                   <FeaturedProfiles />
  //                 </View>
  //               </>
  //             )}
  //           />
  //         </View>
  //       ) : searchProfiles === null ? (
  //         <View style={styles.contentWrapper}>
  //           <View style={styles.flatListContainer}>
  //             <FlatList
  //               {...flatListProps}
  //               data={profiles}
  //               keyExtractor={(item, index) => `${item.profile_id}-${orderBy}-${index}`}
  //               extraData={orderBy}
  //               renderItem={({ item }) => (
  //                 <TouchableOpacity
  //                   onPress={() => handleProfileClick(item.profile_id)}
  //                 >
  //                   <View style={styles.profileDiv}>
  //                     <View style={styles.profileContainer}>
  //                       <Image
  //                         source={getImageSource(item.profile_img)}
  //                         style={styles.profileImage}
  //                       />
  //                       <TouchableOpacity
  //                         onPress={() => handleSavePress(item.profile_id)}
  //                       >
  //                         <MaterialIcons
  //                           name={
  //                             bookmarkedProfiles.has(item.profile_id)
  //                               ? "bookmark"
  //                               : "bookmark-border"
  //                           }
  //                           size={20}
  //                           color="red"
  //                           style={styles.saveIcon}
  //                         />
  //                       </TouchableOpacity>
  //                       <View style={styles.profileContent}>
  //                         <Text style={styles.profileName}>
  //                           {item.profile_name}{" "}
  //                           <Text style={styles.profileId}>
  //                             ({item.profile_id})
  //                           </Text>
  //                         </Text>
  //                         <View style={styles.ageHeightContainer}>
  //                           <Text style={styles.profileAge}>
  //                             {item.profile_age} Yrs
  //                           </Text>
  //                           <Text style={styles.separator}>|</Text>
  //                           <Text style={styles.profileAge}>{item.height} Cms</Text>
  //                         </View>
  //                         <Text style={styles.zodiac}>{item.star}</Text>
  //                         <Text style={styles.employed}>{item.profession}</Text>
  //                       </View>
  //                     </View>
  //                   </View>
  //                 </TouchableOpacity>
  //               )}
  //               contentContainerStyle={styles.flatListContent}
  //               showsVerticalScrollIndicator={true}
  //               ListEmptyComponent={
  //                 isLoading && (
  //                   <View style={styles.emptyContainer}>
  //                     <ActivityIndicator size="large" color="#0000ff" />
  //                   </View>
  //                 )
  //               }
  //             />
  //           </View>
  //         </View>
  //       ) : (
  //         <View style={styles.noResultsContainer}>
  //           <ProfileNotFound />
  //         </View>
  //       )
  //     ) : (
  //       <></>
  //     )}
  //   </View>
  // );
  const renderContent = () => {
    if (isLoadingNew) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#BD1225" />
          <Text style={styles.loadingText}>Searching profiles...</Text>
        </View>
      );
    }

    if (profiles === null) {
      return (
        <View style={styles.noResultsContainer}>
          <ProfileNotFound />
        </View>
      );
    }

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return <></>;
    }

    const dataToRender = Array.isArray(searchProfiles) && searchProfiles.length > 0
      ? searchProfiles
      : profiles;

    return (
      <View style={styles.contentWrapper}>
        <FlatList
          key={key}
          {...flatListProps}
          data={dataToRender}
          numColumns={numColumns}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : null}
          keyExtractor={(item, index) => `${item.profile_id}-${orderBy}-${viewMode}-${index}`}
          extraData={orderBy}
          renderItem={viewMode === 'grid' ? renderGridItem : renderSearchItem}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={true}
          ListFooterComponent={() => (
            <>
              {renderFooter()}
              {viewMode === 'list' && (
                <View style={styles.suggestedWrapper}>
                  <SuggestedProfiles />
                  <FeaturedProfiles />
                </View>
              )}
            </>
          )}
        />
      </View>
    );
  };

  return <View style={styles.container}>{renderContent()}
    <PlatinumModalPopup
      visible={showPlatinumModal}
      onClose={() => setShowPlatinumModal(false)}
    />
  </View>;
};


const styles = StyleSheet.create({
  profileScrollView: {
    width: "100%",
    paddingBottom: 50,
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
  ageHeightContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 10,
  },
  profileAge: {
    fontSize: 14,
    color: "#4F515D",
  },
  separator: {
    fontSize: 14,
    color: "#4F515D",
    paddingHorizontal: 4,
  },
  zodiac: {
    fontSize: 14,
    color: "#4F515D",
    marginBottom: 5,
  },
  employed: {
    fontSize: 14,
    color: "#4F515D",
  },
  matching: {
    fontSize: 16,
    fontWeight: "700",
    color: "#282C3F",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    marginVertical: 20,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    marginTop: 5,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
  flatListContainer: {
    flex: 1,
    width: '100%',
  },
  flatListContent: {
    flexGrow: 1,
  },
  suggestedWrapper: {
    width: '100%',
    backgroundColor: '#FFDE594D',
    paddingTop: 10,
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  noResultsText: {
    color: '#666',
    fontSize: 16,
  },
  gridItemContainer: {
    width: '100%', // Two columns with proper spacing
    marginVertical: 8,
  },
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 350,
    resizeMode: 'cover',
  },
  gridSaveIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
    borderRadius: 15,
    padding: 4,
  },
  gridContent: {
    padding: 12,
    alignItems: 'flex-start', // Align content to the left
  },
  gridProfileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6666',
    textAlign: 'left',
    width: '100%',
  },
  gridProfileId: {
    fontSize: 13,
    color: "#85878C",
    marginTop: 2,
    textAlign: 'left',
  },
  gridProfileAge: {
    fontSize: 14,
    color: '#4F515D',
    marginTop: 4,
    textAlign: 'left',
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lockOverlayLarge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent dark background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  lockOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay like image
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  lockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  listImageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
  },
  listLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
