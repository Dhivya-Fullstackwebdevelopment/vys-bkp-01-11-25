import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ToastAndroid,
  TouchableWithoutFeedback,
  Linking, ActivityIndicator, Share, Pressable, Animated
} from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import ImageViewer from 'react-native-image-zoom-viewer';
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
// import RNFS from 'react-native-fs';
import * as FileSystem from 'expo-file-system'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileDetailsView } from "../../Components/HomeTab/ProfileDetails/ProfileDetailsView";
import Toast from "react-native-toast-message";
// import {  } from "react-native";
import {
  fetchProfileData,
  handleExpressInterest,
  markProfileWishlist,
  getWishlistProfiles,
  getPhotoByPassword,
  getPersonalNotes,
  savePersonalNotes,
  downloadPdf,
  fetchProfileStatus,
  updateProfileInterest,
  createOrRetrieveChat,
  sendPhotoRequest,
  sendVysassistRequest,
  callRequestDetails,
  logProfileVisit,
  getProfileListMatch,
  downloadMatchingReportPdf,
  downloadPdfPoruthamNew,
  fetchRasiImage,
  fetchAmsamImage
} from '../../CommonApiCall/CommonApiCall';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import MatchingScore from "../../Components/MatchingScore";
import { SelectCountry } from "react-native-element-dropdown";
import RBSheet from "react-native-raw-bottom-sheet";
import { SuggestedProfiles } from "../../Components/HomeTab/SuggestedProfiles";
import { FeaturedProfiles } from "../../Components/HomeTab/FeaturedProfiles";
import ProfileVysAssistPopup from "../../Components/HomeTab/ProfileDetails/ProfileVysAssistPopup";
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import Timeline from "react-native-timeline-flatlist";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";
import { TopAlignedImage } from "../../Components/ReuseImageAlign/TopAlignedImage";
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const ProfileDetailsShimmer = () => {
  const width = Dimensions.get('window').width;

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <ShimmerPlaceholder style={{ width: 24, height: 24, borderRadius: 12 }} />
          <ShimmerPlaceholder style={{ width: 150, height: 24, marginHorizontal: 20 }} />
          <View style={{ width: 24 }} />
        </View>

        {/* Main Image Shimmer */}
        <ShimmerPlaceholder style={{ width: width, height: 400 }} />

        {/* Thumbnails Shimmer */}
        <View style={styles.thumbnailContainer}>
          {[1, 2, 3, 4].map((_, index) => (
            <ShimmerPlaceholder
              key={index}
              style={{
                width: '24%',
                aspectRatio: 1,
                marginHorizontal: 2,
                borderRadius: 5
              }}
            />
          ))}
        </View>

        <View style={styles.contentContainer}>
          {/* Profile Name and Icons */}
          <View style={styles.nameIconFlex}>
            <View style={styles.nameVerifyFlex}>
              <ShimmerPlaceholder style={{ width: 150, height: 28, marginRight: 10 }} />
              <ShimmerPlaceholder style={{ width: 20, height: 20, borderRadius: 10 }} />
            </View>
            <View style={{ flexDirection: 'row' }}>
              <ShimmerPlaceholder style={{ width: 22, height: 22, marginHorizontal: 5 }} />
              <ShimmerPlaceholder style={{ width: 24, height: 24, marginHorizontal: 5 }} />
              <ShimmerPlaceholder style={{ width: 24, height: 24, marginLeft: 5 }} />
            </View>
          </View>

          {/* Profile ID */}
          <ShimmerPlaceholder style={{ width: 100, height: 20, marginVertical: 10 }} />

          {/* Details Section */}
          <View style={styles.detailsMeterFlex}>
            <View style={{ flex: 1 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
                <ShimmerPlaceholder
                  key={index}
                  style={{
                    width: '80%',
                    height: 20,
                    marginBottom: 15,
                    borderRadius: 4
                  }}
                />
              ))}
            </View>
            <ShimmerPlaceholder
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                marginLeft: 20
              }}
            />
          </View>

          {/* Status Tags */}
          <View style={styles.detailsMeterFlex1}>
            <ShimmerPlaceholder style={{ width: '45%', height: 30, borderRadius: 3, marginRight: 10 }} />
            <ShimmerPlaceholder style={{ width: '45%', height: 30, borderRadius: 3 }} />
          </View>

          {/* Action Buttons */}
          <ShimmerPlaceholder style={{ width: '100%', height: 45, borderRadius: 5, marginVertical: 20 }} />
        </View>
      </View>
    </ScrollView>
  );
};

export const ProfileDetails = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = 1010; // Height of the profile image section
  // Navigation
  const navigation = useNavigation();
  const route = useRoute();
  const { viewedProfileId, interestParam, allProfileIds } = route.params;
  console.log("viewedProfileId", viewedProfileId)
  // Add state for profile navigation
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [profileIds, setProfileIds] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [rasiGrid, setRasiGrid] = useState([]);
  const [amsaGrid, setAmsaGrid] = useState([]);
  console.log("rasiGriddddd", rasiGrid)
  const [storedPlanId, setStoredPlanId] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      const id = await AsyncStorage.getItem("current_plan_id");
      setStoredPlanId(id);
    };
    fetchPlan();
  }, []);

  const isPlan16 = storedPlanId === "16";


  const getSafeImage = (imageUrl) => {

    // FEMALE profile ID starts with "VF"
    const isFemaleProfile = basic_details?.profile_id?.startsWith("VF");

    // Set default image based on profile gender prefix
    const defaultImgUrl =
      isFemaleProfile
        ? "https://vysyamat.blob.core.windows.net/vysyamala/default_bride.png"
        : "https://vysyamat.blob.core.windows.net/vysyamala/default_groom.png";

    // Return default image if missing
    if (!imageUrl || imageUrl.trim() === "") {
      return defaultImgUrl;
    }

    return imageUrl;
  };


  // Initialize profile IDs and current index
  useEffect(() => {
    if (allProfileIds) {
      const ids = Object.values(allProfileIds);
      setProfileIds(ids);
      // const ids = allProfileIds;
      // setProfileIds(ids);
      const index = ids.findIndex(id => id === viewedProfileId);
      setCurrentProfileIndex(index !== -1 ? index : 0);
    }
  }, [allProfileIds, viewedProfileId]);

  // Navigation functions
  // const navigateToProfile = (index) => {
  //   if (index >= 0 && index < profileIds.length) {
  //     navigation.replace("ProfileDetails", {
  //       viewedProfileId: profileIds[index],
  //       interestParam,
  //       allProfileIds
  //     });
  //   }
  // };

  // const goToNextProfile = () => {
  //   navigateToProfile(currentProfileIndex + 1);
  // };

  // const goToPreviousProfile = () => {
  //   navigateToProfile(currentProfileIndex - 1);
  // };

  // Navigation functions
  const navigateToProfile = async (index) => {
    if (index >= 0 && index < profileIds.length && !isLoadingProfiles) {
      setIsLoadingProfiles(true);
      try {
        navigation.replace("ProfileDetails", {
          viewedProfileId: profileIds[index],
          interestParam,
          allProfileIds
        });
      } catch (error) {
        console.error("Navigation error:", error);
        setIsLoadingProfiles(false);
      }
    }
  };

  const goToNextProfile = () => {
    if (!isLoadingProfiles) {
      navigateToProfile(currentProfileIndex + 1);
    }
  };

  const goToPreviousProfile = () => {
    if (!isLoadingProfiles) {
      navigateToProfile(currentProfileIndex - 1);
    }
  };

  useEffect(() => {
    const fetchAndSetProfileIds = async () => {
      if (allProfileIds) {
        setIsLoadingProfiles(true);
        try {
          const response = await getProfileListMatch(allProfileIds);

          if (response && response.Status === 1 && response.profile_ids) {
            setProfileIds(response.profile_ids);
            const index = response.profile_ids.findIndex(id => id === viewedProfileId);
            setCurrentProfileIndex(index !== -1 ? index : 0);
          } else {
            // Fallback
            const ids = Object.values(allProfileIds);
            setProfileIds(ids);
            const index = ids.findIndex(id => id === viewedProfileId);
            setCurrentProfileIndex(index !== -1 ? index : 0);
          }
        } catch (error) {
          console.error("Error fetching profile list:", error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load profile list',
            position: "bottom",
          });
          // Fallback
          const ids = Object.values(allProfileIds);
          setProfileIds(ids);
          const index = ids.findIndex(id => id === viewedProfileId);
          setCurrentProfileIndex(index !== -1 ? index : 0);
        } finally {
          setIsLoadingProfiles(false);
        }
      }
    };

    fetchAndSetProfileIds();
  }, [allProfileIds, viewedProfileId]);

  // Carousel State
  const width = Dimensions.get('window').width;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(null);
  const [isZoomVisible, setZoomVisible] = useState(false);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fetchedUserImages, setFetchedUserImages] = useState(null); // State for fetched images
  const [isProfileUnlocked, setIsProfileUnlocked] = useState(false); // State to manage profile unlock status
  const [isModalVisible, setModalVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesData, setNotesData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [photoProtection, setPhotoProtection] = useState(null);
  const [photoRequest, setPhotoRequest] = useState(null);
  const [expressInt, setExpressInt] = useState(false);
  const [status, setStatus] = useState(); // State to hold API status
  const [hideExpressButton, setHideExpressButton] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [showVysassist, setShowVysassist] = useState(false);
  const [selectValue, setSelectValue] = useState('');
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [isPickerVisible, setIsPickerVisible] = useState(true);
  const [expressInterestError, setExpressInterestError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState('');
  console.log("selectedCategory express interest", selectedCategory)
  const custom_message = AsyncStorage.getItem('custom_message')
  console.log("customMessage", custom_message)
  const [mobileNumber, setMobileNumber] = useState('');
  const [VysassistEnable, setVysassistEnable] = useState()
  const [vysassits, setVysassits] = useState()
  const [data, setData] = useState([])
  const [options, setOptions] = useState([])
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isVisible, setIsVisible] = useState(false)
  const bottomSheetRef = useRef();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');
  console.log("responseMsg", responseMsg)
  const [showPersonalDetails, setShowPersonalDetails] = useState(true);
  const [showEducationDetails, setShowEducationDetails] = useState(false);
  const [showFamilyDetails, setShowFamilyDetails] = useState(false);
  const [showHoroscopeDetails, setShowHoroscopeDetails] = useState(false);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [planId, setPlanId] = useState(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [showMatchingReportUpgrade, setShowMatchingReportUpgrade] = useState(false);
  const [matchingReportMessage, setMatchingReportMessage] = useState('');
  const restrictedPlanIds = ["1", "2", "3", "14", "15", "17"];
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePersonalDetails = () => {
    setShowEducationDetails(false)
    setShowFamilyDetails(false)
    setShowHoroscopeDetails(false)
    setShowContactDetails(false)
    setShowPersonalDetails((prev) => !prev);
  };

  const toggleEducationDetails = () => {
    setShowPersonalDetails(false)
    setShowFamilyDetails(false)
    setShowHoroscopeDetails(false)
    setShowContactDetails(false)
    setShowEducationDetails((prev) => !prev);
  };

  const toggleFamilyDetails = () => {
    setShowPersonalDetails(false)
    setShowEducationDetails(false)
    setShowHoroscopeDetails(false)
    setShowContactDetails(false)
    setShowFamilyDetails((prev) => !prev);
  };

  const toggleHoroscopeDetails = () => {
    setShowPersonalDetails(false)
    setShowEducationDetails(false)
    setShowFamilyDetails(false)
    setShowContactDetails(false)
    setShowHoroscopeDetails((prev) => !prev);
  };

  const toggleContactDetails = () => {
    if (!profileData.contact_details) {
      console.log("contact details not found")
      navigation.navigate('MembershipPlan');
    } else {
      console.log("contact details found")
      setShowPersonalDetails(false)
      setShowEducationDetails(false)
      setShowFamilyDetails(false)
      setShowHoroscopeDetails(false)
      setShowContactDetails((prev) => !prev);
    }
  };


  const handleUpdateInterest = async (profileId, status) => {
    const result = await updateProfileInterest(profileId, status);

    if (result) {
      if (status === "2") {
        Alert.alert("Success", "Interest Accepted");
        setHideExpressButton(false);
        if (viewedProfileId) {
          await fetchStatusHandlerNew();
        } else {
          console.error("loginUserProfileId is null or undefined");
        }
      } else if (status === "3") {
        Alert.alert("Declined", "Interest Declined");
        setHideExpressButton(false);
      }
    } else {
      Alert.alert("Error", result.message);
    }
  };

  useEffect(() => {
    const fetchStatusHandler = async () => {
      const status = await fetchProfileStatus(viewedProfileId);
      if (status) {
        setStatus(status); // Update the state with the fetched status
      }
      // else {
      //   console.error("Error fetching status");
      // }
    };
    fetchStatusHandler();
  }, [viewedProfileId]);

  useEffect(() => {
    const fetchPlanId = async () => {
      try {
        const id = await AsyncStorage.getItem("selectedPlanId");
        setPlanId(id);
      } catch (e) {
        setPlanId(null);
      }
    };
    fetchPlanId();
  }, []);

  const fetchStatusHandlerNew = async () => {
    const status = await fetchProfileStatus(viewedProfileId);
    if (status) {
      setStatus(status); // Update the state with the fetched status
    } else {
      console.error("Error fetching status");
    }
  };

  const handlePressMessage = async () => {
    try {
      const result = await createOrRetrieveChat(viewedProfileId);
      await AsyncStorage.setItem('chat_created', JSON.stringify(result.created));
      await AsyncStorage.setItem('chat_room_id_name', result.room_id_name);
      await AsyncStorage.setItem('chat_statue', JSON.stringify(result.statue));
      console.log('API result:', result);
      navigation.navigate("ChatRoom", {
        room_name: result.room_id_name,
        username: profileData.basic_details.profile_name,
        from_profile_id: viewedProfileId,
        profile_image: Object.values(profileData.user_images)[0],
        last_mesaage_visit: profileData.basic_details.last_visit,
      });
    } catch (error) {
      console.error('API call failed:', error);
    }
  };

  const handleSendPhotoRequest = async () => {
    setLoading(true);
    try {
      console.log("Sending photo request...");
      const response = await sendPhotoRequest(viewedProfileId);
      console.log("Photo request sent successfully:", response);
      if (response.Status === 1) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Photo Request send successfully!',
          position: "bottom",
        });
      } else if (response.Status === 0) {
        console.log("Photo request failed:", response);
        setResponseMsg(response.message)
        setShowUpgradeModal(true);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to send photo request!',
          position: "bottom",
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to send photo request!',
          position: "bottom",
        });
      }
      // Handle success notification here
    } catch (error) {
      console.error("Error in photo request:", error);
      // Handle error notification here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadPersonalNotes = async () => {
      try {
        const data = await getPersonalNotes();
        if (data.length > 0) {
          const profileNotes = data.find(profile => profile.notes_profileid === profileData?.basic_details?.profile_id); // Replace with actual profile ID
          // const profileNotes = data.find(profile => profile.notes_profileid === "VY240001"); // Replace with actual profile ID
          if (profileNotes && profileNotes.notes_details) {
            setNotes(profileNotes.notes_details); // Set the initial notes details
            setNotesData(profileNotes);
          }
        }
      } catch (error) {
        console.error('Error loading personal notes:', error);
      }
    };

    loadPersonalNotes();
  }, []);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleSubmit = async () => {
    console.log('Submitted Text:', notes);

    // Example values, replace with actual ones from your context or state
    try {
      // Call the API function with the entered notes
      const response = await savePersonalNotes(profileData?.basic_details?.profile_id, notes);

      if (response && response.Status === 1) {
        console.log('Notes saved successfully:', response);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Notes saved successfully!',
          position: "top",
        });
      }
      else if (response.Status === 0) {
        console.log('Failed to save notes:', response);
        setResponseMsg(response.message)
        setShowUpgradeModal(true);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to save notes.',
          position: "top",
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to save notes.',
        });
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save notes.',
      });
    }

    toggleModal(); // Close the modal after submission
  };

  // Helper to clean HTML tags and get content
  // Add this helper function at the top of your file or inside the component
  const extractGridData = (htmlString) => {
    if (!htmlString) return [];

    const rows = [];
    const rowMatches = htmlString.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];

    rowMatches.forEach(rowHtml => {
      const cells = [];
      const cellMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];

      cellMatches.forEach(cellHtml => {
        // Replace <br> with \n for vertical stacking
        let text = cellHtml.replace(/<br\s*\/?>/gi, '\n');
        text = text.replace(/<\/p>/gi, '\n');
        text = text.replace(/<[^>]+>/g, '').trim();
        text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

        // Remove extra empty newlines to save space
        text = text.replace(/\n\s*\n/g, '\n').trim();

        cells.push(text);
      });

      if (cells.length > 0) rows.push(cells);
    });
    return rows;
  };

  useEffect(() => {
    const loadProfileData = async () => {
      setIsInitialLoading(true);
      try {
        const loginuser_profileId = await AsyncStorage.getItem("loginuser_profileId");
        const formattedMessage = `We have shared the horoscope to ${loginuser_profileId}`;
        const options = [
          formattedMessage,
          "We got ok from our Astrologer",
          "We are satisfied with the basic details",
          "We are yet to see the Astrologer",
          "We want to know the family background details",
          "No response from the opposite side",
        ];
        setOptions(options);
        // const rasiData = await fetchRasiImage(viewedProfileId); // <--- Pass the ID here

        // if (rasiData && rasiData.status === 1) {
        //   console.log("Rasi Image Found:", rasiData.image);
        //   setRasiImage(rasiData.image);
        // } else {
        //   console.log("Rasi Image Not Found");
        //   setRasiImage(null);
        // }

        const rasiData = await fetchRasiImage(viewedProfileId);
        if (rasiData && rasiData.status === 1) {
          const parsedGrid = extractGridData(rasiData.html);
          setRasiGrid(parsedGrid);
        } else {
          setRasiGrid([]);
        }
        const amsaData = await fetchAmsamImage(viewedProfileId);
        if (amsaData && amsaData.status === 1) {
          const parsedGrid = extractGridData(amsaData.html);
          setAmsaGrid(parsedGrid);
        } else {
          setAmsaGrid([]);
        }
        const data = await fetchProfileData(viewedProfileId);
        console.log("Fetched profile data: 1 ", data);
        const response = await logProfileVisit(viewedProfileId);
        console.log("Profile Details fully 2 ==>", data, response)


        // 🧠 Check if profile exists or deleted
        if (
          !data ||
          !data.basic_details ||
          data?.status === "failure" ||
          data?.message === "The Profile is Deleted"
        ) {
          Toast.show({
            type: "info",
            text1: "The profile was deleted",
            visibilityTime: 2000,
            position: "bottom",
          });

          // ✅ Go back to previous screen after showing toast
          setTimeout(() => {
            navigation.goBack();
          }, 1500);

          console.warn("Profile data missing or deleted:", data);
          return; // Stop further execution
        }
        if (typeof data.user_images === 'string') {
          // Convert the single image URL string into an object/map structure
          data.user_images = {
            "0": data.user_images // Assign it to a key (e.g., "0" or "image1")
          };
        }
        // ✅ Continue with valid profile data
        setProfileData(data);
        if (data.hasOwnProperty('photo_protection')) {
          setPhotoProtection(data.photo_protection);
        } else {
          setPhotoProtection(0); // Default to unlocked if missing
        }
        if (data?.basic_details?.personal_notes) {
          setNotes(data.basic_details.personal_notes);
        }
        if (data?.basic_details) {
          const profileId = data.basic_details.profile_id;
          if (data.basic_details.wish_list === 1) {
            // If wish_list is 1, ADD this profile to the Set
            setBookmarkedProfiles(prevSet => {
              const newSet = new Set(prevSet);
              newSet.add(profileId);
              return newSet;
            });
          } else {
            // If wish_list is 0, REMOVE this profile from the Set
            setBookmarkedProfiles(prevSet => {
              const newSet = new Set(prevSet);
              newSet.delete(profileId);
              return newSet;
            });
          }
        }

        if (data?.basic_details?.express_int === "1") {
          setExpressInt(true);
          setPhotoProtection(data?.photo_protection);
        }

        setPhotoRequest(data?.photo_request);
        setMobileNumber(data?.contact_details?.mobile);

        const profileId = data?.basic_details?.profile_id;
        if (profileId) {
          const unlockStatus = await AsyncStorage.getItem(`profileUnlocked_${profileId}`);
          if (unlockStatus === "true") {
            setIsProfileUnlocked(true);
            const storedImages = await AsyncStorage.getItem(`fetchedUserImages_${profileId}`);
            if (storedImages) setFetchedUserImages(JSON.parse(storedImages));
          }
        }

        setVysassistEnable(data?.basic_details?.vysy_assist_enable);
        setVysassits(data?.basic_details?.vys_assits);

        if (Array.isArray(data?.basic_details?.vys_list)) {
          const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
          };
          const formattedTimelineData = data.basic_details.vys_list.map((item) => ({
            time: formatDate(item.update_at),
            description: item.comments,
          }));
          setData(formattedTimelineData);
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
        Toast.show({
          type: "error",
          text1: "Error loading profile data",
          position: "bottom",
        });
      }
      finally {
        // Hide loading state after data is loaded
        setIsInitialLoading(false);
      }
    };

    loadProfileData();
  }, [viewedProfileId]);



  useEffect(() => {
    const loadWishlistProfiles = async () => {
      try {
        const response = await getWishlistProfiles();
        console.log("Wishlist response:", response);

        if (!response || !Array.isArray(response)) {
          // Toast.show({
          //   type: "info",
          //   text1: "Some profiles were deleted",
          //   visibilityTime: 2000,
          //   position: "bottom",
          // });
          console.warn("Invalid wishlist response:", response);
          return;
        }

        const profileIds = response.map((p) => p.wishlist_profileid);
        setBookmarkedProfiles(new Set(profileIds));
      } catch (error) {
        console.error("Error loading wishlist profiles:", error);
        Toast.show({
          type: "error",
          text1: "Error loading wishlist profiles",
          position: "bottom",
        });
      }
    };

    loadWishlistProfiles();
  }, []);


  // Handle slide press
  const handleSlidePress = (index) => {
    setSelectedSlideIndex(index);
    setZoomVisible(true);
  };

  // Render carousel item
  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.imageWrapper}
      onPress={() => handleSlidePress(index)}
    >
      <Image
        source={{ uri: item }}
        style={[styles.image, { width: width }]}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  // Bookmark Wishlist Profile

  // Handle save icon press
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

  // Handle Express Interest
  const handleExpressInterestPress = async () => {
    if (
      (!interestMessage || interestMessage.trim() === "") &&
      (!selectedCategory || selectedCategory.trim() === "")
    ) {
      console.log("if else check ==>", viewedProfileId, expressInt, selectedCategory, interestMessage)
      setExpressInterestError("Please enter a message or select a category before submitting.");
      return;
    } else {
      console.log("interest check ==>", viewedProfileId, expressInt, selectedCategory, interestMessage)
      try {
        const data = await handleExpressInterest(viewedProfileId, expressInt, interestMessage, selectedCategory);
        console.log("express int response 1==>", JSON.stringify(data))
        if (data.Status === 0) {
          setShowInterestModal(false)
          setIsPickerVisible(true);
          setInterestMessage('');
          setSelectedCategory('');
          setExpressInterestError('');
          setExpressInt(true)
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Your express interest has been sent successfully!',
            position: "bottom",
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'error',
            text2: 'Failed to update express interest!',
            position: "bottom",
          });
        }
      } catch (error) {
        console.error("Error updating express interest:", error);
      } finally {
        setExpressInterestError("");
      }
    }
  };

  const handleExpressInterestPress1 = async () => {
    console.log("interest check ==>", viewedProfileId, expressInt, selectedCategory, interestMessage)
    try {
      const data = await handleExpressInterest(viewedProfileId, expressInt, interestMessage, selectedCategory);
      console.log("express int response 2==>", JSON.stringify(data))
      if (data.Status === 0) {
        setExpressInt(false)
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Your express interest has been removed successfully!',
          position: "bottom",
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'error',
          text2: 'Failed to update express interest!',
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Error updating express interest:", error);
      Toast.show({
        type: 'error',
        text1: 'error',
        text2: 'Failed to update express interest!',
        position: "bottom",
      });
    }
  };

  // Check if data is available
  if (isInitialLoading || !profileData) {
    return <ProfileDetailsShimmer />;
  }

  const {
    basic_details,
    user_images,
  } = profileData;

  // Add this helper inside your ProfileDetails component
  const images = (fetchedUserImages ? Object.values(fetchedUserImages) : Object.values(user_images))
    .map(url => ({
      url: getSafeImage(url),
      // If locked and not yet bypassed by password, the UI will handle the overlay
    }));


  const handlePasswordSubmit = async () => {
    try {
      const photoData = await getPhotoByPassword(profileData?.basic_details?.profile_id, password);
      if (photoData) {
        console.log('Photo data received:', photoData);
        setFetchedUserImages(photoData.user_images); // Store fetched images
        setIsProfileUnlocked(true); // Set profile to unlocked state
        // Store unlock status and images in AsyncStorage
        await AsyncStorage.setItem(`profileUnlocked_${profileData?.basic_details?.profile_id}`, 'true');
        await AsyncStorage.setItem(`fetchedUserImages_${profileData?.basic_details?.profile_id}`, JSON.stringify(photoData.user_images));
        Toast.show({
          type: "success",
          text1: "Unlocked",
          text2: "Profile photos unlocked successfully.",
          position: "bottom",
        });
      } else {
        console.log('Incorrect password or no data received');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Incorrect password, please try again.',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error submitting password:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit password.',
        position: 'bottom',
      });
    }
  };

  // console.log('isProfileUnlocked:', isProfileUnlocked);
  // console.log('photoProtection:', photoProtection);
  // console.log('fetchedUserImages:', fetchedUserImages);

  const handleDownloadPdf = async () => {
    console.log("handleDownloadPdf ==>", viewedProfileId)
    bottomSheetRef.current.close();
    setLoading(true)
    // Proceed with the download if permission is granted
    try {
      const filePath = await downloadPdf(viewedProfileId);
      console.log("handleDownloadPdf", filePath)
      setLoading(false)
      // Alert.alert("Download Complete", `File saved to: ${filePath}`);
    } catch (error) {
      Alert.alert("Error", "Failed to download the file.");
    } finally {
      setLoading(false)
    }
  };

  // Inside ProfileDetails functional component (before the return statement)

  // const handleDownloadMatchingReport = async () => {
  //   console.log("handleDownloadMatchingReport called for:", viewedProfileId);
  //   bottomSheetRef.current.close(); // Close the bottom sheet
  //   setLoading(true); // Start loading indicator

  //   try {
  //     // Call the new API function
  //     const filePath = await downloadMatchingReportPdf(viewedProfileId);
  //     console.log("downloadMatchingReportPdf", filePath)
  //     // if (filePath) {
  //     //   // Optional: Show a toast/alert for success if the internal function didn't already
  //     //   Toast.show({
  //     //     type: 'success',
  //     //     text1: 'Success',
  //     //     text2: 'Matching Report Download Complete!',
  //     //     position: "bottom",
  //     //   });
  //     // } else {
  //     //   // Error handling from the API function
  //     //   Alert.alert("Error", "Failed to download the Matching Report file.");
  //     // }
  //   } catch (error) {
  //     console.error("Error initiating Matching Report download:", error);
  //     Alert.alert("Error", "An unexpected error occurred during download.");
  //   } finally {
  //     setLoading(false); // Stop loading indicator
  //   }
  // };
  // const handleDownloadMatchingReport = async () => {
  //   console.log("handleDownloadMatchingReport called for:", viewedProfileId);
  //   bottomSheetRef.current.close();
  //   setLoading(true);

  //   try {
  //     const loginuser_profileId = await AsyncStorage.getItem("loginuser_profileId");
  //     const url = `https://app.vysyamala.com/auth/generate-porutham-pdf-mobile/${loginuser_profileId}/${viewedProfileId}/`;

  //     const response = await fetch(url, {
  //       method: 'GET',
  //       headers: {
  //         'Accept': 'application/pdf, application/json',
  //       },
  //     });

  //     const contentType = response.headers.get('content-type');

  //     // Check if response is JSON (error response)
  //     if (contentType && contentType.includes('application/json')) {
  //       const jsonData = await response.json();

  //       if (jsonData.status === 'failure' && jsonData.message) {
  //         // Show upgrade popup with the API message
  //         setMatchingReportMessage(jsonData.message);
  //         setShowMatchingReportUpgrade(true);
  //         return;
  //       }
  //     }

  //     // Check if response is PDF (success response)
  //     if (response.ok && contentType && contentType.includes('application/pdf')) {
  //       const blob = await response.blob();

  //       // For Android, save and open the PDF
  //       if (Platform.OS === 'android') {
  //         const fileName = `matching_report_${viewedProfileId}.pdf`;
  //         const filePath = `${FileSystem.documentDirectory}${fileName}`;

  //         // Convert blob to base64
  //         const reader = new FileReader();
  //         reader.onloadend = async () => {
  //           const base64data = reader.result.split(',')[1];

  //           try {
  //             // Save the PDF file
  //             await FileSystem.writeAsStringAsync(filePath, base64data, {
  //               encoding: FileSystem.EncodingType.Base64,
  //             });

  //             // Open the PDF
  //             await Linking.openURL(filePath);

  //             Toast.show({
  //               type: 'success',
  //               text1: 'Success',
  //               text2: 'Matching Report downloaded successfully!',
  //               position: "bottom",
  //             });
  //           } catch (error) {
  //             console.error('Error saving/opening PDF:', error);
  //             Toast.show({
  //               type: 'error',
  //               text1: 'Error',
  //               text2: 'Failed to save/open PDF',
  //               position: "bottom",
  //             });
  //           }
  //         };
  //         reader.readAsDataURL(blob);
  //       } else {
  //         // For iOS or other platforms
  //         Toast.show({
  //           type: 'success',
  //           text1: 'Success',
  //           text2: 'Matching Report generated successfully!',
  //           position: "bottom",
  //         });
  //       }
  //     } else {
  //       throw new Error('Unexpected response format');
  //     }

  //   } catch (error) {
  //     console.error("Error downloading matching report:", error);
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Error',
  //       text2: 'Failed to download matching report',
  //       position: "bottom",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleDownloadMatchingReport = async () => {
    console.log("handleDownloadMatchingReport called for:", viewedProfileId);
    bottomSheetRef.current.close();
    setLoading(true);

    try {
      // Call the API function from CommonApiCall
      const result = await downloadPdfPoruthamNew(viewedProfileId);
      console.log("matching pdf result", result);

      // Check if result is null or undefined (permission denied or other error)
      // if (!result) {
      //   Toast.show({
      //     type: 'error',
      //     text1: 'Error',
      //     text2: 'Failed to download matching report',
      //     position: "bottom",
      //   });
      //   return;
      // }

      // Check if result is JSON error response (upgrade required)
      // Must check if it's an object first, then check for status property
      if (typeof result === 'object' && result !== null && result.status === 'failure') {
        setResponseMsg(result.message || 'No access to see the compatibility report');
        setShowUpgradeModal(true);
        return;
      }

      // If result is a file path (success case)
      if (typeof result === 'string' && result.length > 0) {
        console.log('Matching report downloaded successfully:', result);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Matching report downloaded successfully!',
          position: "bottom",
        });
      }

    } catch (error) {
      console.error("Error downloading matching report:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to download matching report. Please try again.',
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleMatchingScoreUpgrade = (message) => {
    setResponseMsg(message);
    setShowUpgradeModal(true);
  };

  const openPopup = () => {
    console.log("open pop up check ==>")
    setShowVysassist(!showVysassist);
  };

  const closeVysassistpopup = () => {
    setShowVysassist(false);
  };

  const closePopup = () => {
    setPopupVisible(false);
    setNotes('');
    setSelectValue('');
  };

  const closePopupnew = () => {
    setShowVysassist(false)
  };

  const handleCheckboxChange = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((item) => item !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  // const handleSubmit = () => {
  //   console.log("Selected Options:", selectedOptions);
  //   closePopup();
  // };

  const formDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const handleNotesChange = (text) => {
    setNotes(text);
    if (text) setSelectValue('');
  };

  const handleSelectChange = (value) => {
    setSelectValue(value);
    if (value) setNotes('');
  };

  const handleSubmitPopup = async () => {
    const message = selectValue || notes;
    if (!message) {
      alert('Please enter notes or select a category.');
      return;
    }
    const response = await sendVysassistRequest(viewedProfileId, message);
    if (response.Status === 1) {
      alert(response.message);
    } else {
      alert(response.message);
    }
    // console.log('Submitted:', message);
    closePopup();
  };

  // Vys-ass api
  const handleSubmitVysassistPopup = async () => {
    if (selectedOptions.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please select at least one option',
        position: "center",
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 30
      });
      setExpressInterestError("Please select at least one option.");
      return;
    }
    // console.log("selectedOptions ==>", selectedOptions)
    try {
      const message = selectedOptions.join(", ");
      const response = await sendVysassistRequest(viewedProfileId, message);
      console.log("response sendVysassistRequest==>", JSON.stringify(response));
      if (response.Status === 0) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.message || 'Request submitted successfully',
          position: "center",
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 30
        });
        setExpressInterestError("");
        setShowVysassist(false);
        setSelectedOptions([]);
        bottomSheetRef.current.close();

        // Reload profile data
        try {
          const data = await fetchProfileData(viewedProfileId);
          console.log("Fetched profile data: 1 ", data);
          const response = await logProfileVisit(viewedProfileId);
          console.log("Profile Details fully 2 ==>", data, response)

          setProfileData(data);
          setVysassistEnable(data.basic_details.vysy_assist_enable);
          setVysassits(data.basic_details.vys_assits);

          if (data.basic_details.vys_list !== null) {
            const formatDate = (dateString) => {
              const date = new Date(dateString);
              return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
            };

            const formattedTimelineData = data.basic_details.vys_list.map((item) => ({
              time: formatDate(item.update_at),
              description: item.comments,
            }));
            setData(formattedTimelineData);
          }
        } catch (error) {
          console.error("Error reloading profile data:", error);
        }
      } else {
        Toast.show({
          type: 'success',
          text1: 'success',
          text2: response.message || 'Failed to submit request',
          position: "center",
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 30
        });
        setExpressInterestError("");
        setShowVysassist(false);
        setSelectedOptions([]);
        bottomSheetRef.current.close();
        try {
          const data = await fetchProfileData(viewedProfileId);
          console.log("Fetched profile data: 1 ", data);
          const response = await logProfileVisit(viewedProfileId);
          console.log("Profile Details fully 2 ==>", data, response)
          setProfileData(data);
          setVysassistEnable(data.basic_details.vysy_assist_enable);
          setVysassits(data.basic_details.vys_assits);

          if (data.basic_details.vys_list !== null) {
            const formatDate = (dateString) => {
              const date = new Date(dateString);
              return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
            };

            const formattedTimelineData = data.basic_details.vys_list.map((item) => ({
              time: formatDate(item.update_at),
              description: item.comments,
            }));
            setData(formattedTimelineData);
          }
        } catch (error) {
          console.error("Error reloading profile data:", error);
        }
      }
    } catch (error) {
      console.error('Error submitting vysassist request:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit request. Please try again.',
        position: "center",
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 30
      });
      setExpressInterestError('Failed to submit request. Please try again.')
    }
  };


  const handlePhoneCall = async () => {
    try {
      setLoading(true); // Start loading indicator

      // 1. Await the values from AsyncStorage first
      const storedLoginId = await AsyncStorage.getItem("loginuser_profileId");
      const storedNewId = await AsyncStorage.getItem("profile_id_new");

      // Use whichever ID is available
      const myProfileId = storedLoginId || storedNewId;

      if (!myProfileId) {
        Alert.alert("Error", "User session expired. Please login again.");
        setLoading(false);
        return;
      }

      // 2. Create and append data properly
      const formdata = new FormData();
      formdata.append("profile_id", myProfileId);
      formdata.append("profile_to", viewedProfileId);

      console.log("Sending Call Request from:", myProfileId, "to:", viewedProfileId);

      // 3. Call the API
      const response = await callRequestDetails(formdata);
      console.log("API Response:", response);

      if (response.Status === 1 && response.toprofile_mobile_no) {
        const phoneNumber = response.toprofile_mobile_no;
        Linking.openURL(`tel:${phoneNumber}`);
      } else {
        // Handle logical errors (e.g., plan expired, limit reached)
        Toast.show({
          type: 'error',
          text1: 'Call Request Failed',
          text2: response.message || 'Mobile number not available',
          position: "bottom",
        });

        // Auto-navigate to membership if the message suggests an upgrade
        if (response.message?.toLowerCase().includes("upgrade")) {
          navigation.navigate('MembershipPlan');
        }
      }
    } catch (error) {
      console.error('Error opening dialer:', error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Please check your internet connection',
        position: "bottom",
      });
    } finally {
      setLoading(false);
      bottomSheetRef.current.close();
    }
  };

  // Add this new function to render thumbnails
  const renderThumbnails = () => {
    // Use fetched images if available (after password unlock), otherwise use default images
    const imagesArray = fetchedUserImages ? Object.values(fetchedUserImages) : Object.values(user_images);

    // Determine if we need to apply the blur/lock effect
    // Logic: photoProtection is 1 (locked) AND it hasn't been bypassed by a password yet
    const isBlurNeeded = !isProfileUnlocked && photoProtection === 1;

    // Logic for the "+X" overlay
    const remainingCount = imagesArray.length - 4;

    return (
      <View style={styles.thumbnailContainer}>
        {/* Slice images to show positions 2, 3, and 4 in the row */}
        {imagesArray.slice(1, 4).map((image, index) => (
          <TouchableOpacity
            key={index}
            // Prevent opening zoom viewer if locked
            onPress={() => !isBlurNeeded && handleSlidePress(index + 1)}
            style={styles.thumbnail}
            disabled={isBlurNeeded}
          >
            {/* <Image
              source={{ uri: getSafeImage(Array.isArray(image) ? image[0] : image) }}
              style={[
                styles.thumbnailImage,
                // Apply blurRadius if locked. 10 is usually sufficient for thumbnails.
                isBlurNeeded && { blurRadius: 10, opacity: 0.8 }
              ]}
            /> */}

            <TopAlignedImage
              uri={getSafeImage(Array.isArray(image) ? image[0] : image)}
              width={100}
              height={100}
              style={{
                borderRadius: 10,
                ...(isBlurNeeded && { opacity: 0.8 })
              }}
            />

            {/* SMALL LOCK OVERLAY: Visual indicator that the image is protected */}
            {isBlurNeeded && (
              <View style={styles.lockOverlaySmall}>
                <Ionicons name="lock-closed" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* RENDER THE "+X MORE" THUMBNAIL */}
        {remainingCount > 0 && (
          <TouchableOpacity
            style={[styles.thumbnail, styles.lastThumbnail]}
            onPress={() => !isBlurNeeded && handleSlidePress(4)}
            disabled={isBlurNeeded}
          >
            {/* <Image
              source={{ uri: getSafeImage(imagesArray[4]) }}
              style={[
                styles.thumbnailImage,
                isBlurNeeded && { blurRadius: 10 }
              ]}
            /> */}

            <TopAlignedImage
              uri={getSafeImage(imagesArray[4])}
              width={100}
              height={100}
              style={{
                borderRadius: 10,
                ...(isBlurNeeded && { opacity: 0.8 })
              }}
            />


            {/* Overlay for count or lock */}
            <View style={isBlurNeeded ? styles.lockOverlaySmall : styles.countOverlay}>
              {isBlurNeeded ? (
                <Ionicons name="lock-closed" size={16} color="#fff" />
              ) : (
                <Text style={styles.countText}>+{remainingCount}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderBottomSheetContent = () => {
    const options = [
      { icon: 'phone', text: 'Call', onPress: handlePhoneCall, type: 'MaterialCommunityIcons' },
      // { icon: 'share', text: 'Share', onPress: handleShare, type: 'MaterialIcons' },
      { icon: 'document-text', text: 'Personal Notes', onPress: toggleModal, type: 'Ionicons' },
      // { icon: 'account-voice', text: 'Vys Assist', onPress: openPopup, type: 'MaterialCommunityIcons' },
      ...(!isPlan16
        ? [{ icon: "account-voice", text: "Vys Assist", onPress: openPopup, type: "MaterialCommunityIcons" }]
        : []),
      { icon: 'print-outline', text: 'Download Profile', onPress: handleDownloadPdf, type: 'Ionicons' },
      { icon: 'star', text: 'Show Matching Report', onPress: handleDownloadMatchingReport, type: 'MaterialIcons' },
      // { icon: 'report-problem', text: 'Report Profile', onPress: () => { }, type: 'MaterialIcons' },
    ];

    return (
      <View style={styles.bottomSheetContent}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.bottomSheetOption}
            onPress={option.onPress}
          >
            {option.type === 'MaterialCommunityIcons' && (
              <MaterialCommunityIcons name={option.icon} size={24} color="#4F515D" />
            )}
            {option.type === 'MaterialIcons' && (
              <MaterialIcons name={option.icon} size={24} color="#4F515D" />
            )}
            {option.type === 'Ionicons' && (
              <Ionicons name={option.icon} size={24} color="#4F515D" />
            )}
            <Text style={styles.bottomSheetText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this profile: ${basic_details.profile_name} (${basic_details.profile_id})`,
      });
    } catch (error) {
      console.error(error.message);
    }
  };


  return (
    <View style={styles.mainContainer}>
      {/* Fixed Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#282C3F" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Profile Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Content */}
      <View style={styles.container}>
        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >

          <View style={styles.contentWrapper}>
            {/* <TouchableOpacity
              onPress={() => !(!isProfileUnlocked && photoProtection === 1) && handleSlidePress(0)}
              disabled={!isProfileUnlocked && photoProtection === 1}
            > */}
            <TouchableOpacity
              onPress={() => {
                // Check if locked and NOT yet unlocked by password
                if (!isProfileUnlocked && photoProtection === 1) {
                  setPassword('');
                  setIsPasswordModalVisible(true);
                } else {
                  handleSlidePress(0);
                }
              }}
              // Keep disabled false so the click always registers to show the popup
              disabled={false}
            >
              {/* <Image
                source={{ uri: getSafeImage((fetchedUserImages ? Object.values(fetchedUserImages) : Object.values(user_images))[0]) }}
                style={[
                  styles.mainImage,
                  (!isProfileUnlocked && photoProtection === 1) && { blurRadius: 15 } // Apply blur if locked
                ]}
                resizeMode="cover"
              /> */}
              <Image
                source={{ uri: getSafeImage((fetchedUserImages ? Object.values(fetchedUserImages) : Object.values(user_images))[0]) }}
                style={[
                  styles.mainImage,
                  (!isProfileUnlocked && photoProtection === 1) && { blurRadius: 20 }
                ]}
                resizeMode="cover"
              />

              {/* Overlay Lock Symbol */}
              {!isProfileUnlocked && photoProtection === 1 && (
                <View style={styles.lockOverlayLarge}>
                  <MaterialCommunityIcons name="lock" size={60} color="#FF6666" />
                  <Text style={styles.lockOverlayText}>
                    Click here to request password to view profile photo
                  </Text>
                </View>
              )}

              {/* LOCK OVERLAY: Add this block */}
              {/* {!isProfileUnlocked && photoProtection === 1 && (
                <View style={styles.passwordContainer}>
                  <Text style={styles.lockedMessage}>
                    * Profile is locked, please enter the password to view the image
                  </Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter the password"
                      secureTextEntry={!passwordVisible}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setPasswordVisible(!passwordVisible)}
                      style={styles.eyeIcon}
                    >
                      <MaterialIcons name={passwordVisible ? 'visibility' : 'visibility-off'} size={24} color="black" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={handlePasswordSubmit} style={styles.submitButton}>
                    <Text style={styles.submitButtonText}>Submit Password</Text>
                  </TouchableOpacity>
                </View>
              )} */}
            </TouchableOpacity>
            {renderThumbnails()}
          </View>

          <Modal
            visible={isPasswordModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsPasswordModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.passwordCard}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="report-problem" size={24} color="#FF6666" />
                  <Text style={styles.cardTitle}>Enter Password to View Photo</Text>
                </View>

                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.cardInputTransparent}
                    placeholder="Enter The Password"
                    placeholderTextColor="#A9ABB0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.eyeIconContainer}
                  >
                    <MaterialCommunityIcons
                      name={isPasswordVisible ? "eye" : "eye-off"}
                      size={20}
                      color="#4F515D"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => setIsPasswordModalVisible(false)}>
                    <Text style={styles.cancelTextBtn}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitBtnRed}
                    onPress={() => {
                      handlePasswordSubmit();
                      setIsPasswordModalVisible(false); // Close after submit
                    }}
                  >
                    <Text style={styles.submitBtnText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {isZoomVisible && (
            <Modal visible={isZoomVisible} transparent={true}>
              <ImageViewer
                imageUrls={images}
                index={selectedSlideIndex}
                onClick={() => setZoomVisible(false)}
              />
            </Modal>
          )}

          {isProfileUnlocked && fetchedUserImages && (
            <FlatList
              data={fetchedUserImages}
              renderItem={renderItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 20 }}
            />
          )}

          {/* <View style={styles.navigationContainer}>
            <TouchableOpacity
              onPress={currentProfileIndex > 0 ? goToPreviousProfile : null}
              style={[styles.navButton, currentProfileIndex === 0 && styles.disabledButton]}
              disabled={currentProfileIndex === 0}
            >
              <Ionicons name="chevron-back-circle" size={40} color={currentProfileIndex === 0 ? "#D3D3D3" : "red"} />
            </TouchableOpacity>

            {currentProfileIndex < profileIds.length - 1 && (
              <TouchableOpacity
                onPress={goToNextProfile}
                style={[styles.navButton]}
              >
                <Ionicons name="chevron-forward-circle" size={40} color="red" />
              </TouchableOpacity>
            )}
          </View> */}

          <View style={styles.navigationContainer}>
            {/* Left/Previous Button - Always show but disable when needed */}
            <TouchableOpacity
              onPress={currentProfileIndex > 0 && !isLoadingProfiles ? goToPreviousProfile : null}
              style={[
                styles.navButton,
                (currentProfileIndex === 0 || isLoadingProfiles) && styles.disabledButton
              ]}
              disabled={currentProfileIndex === 0 || isLoadingProfiles}
              activeOpacity={currentProfileIndex === 0 || isLoadingProfiles ? 1 : 0.7}
            >
              <Ionicons
                name="chevron-back-circle"
                size={40}
                color={currentProfileIndex === 0 || isLoadingProfiles ? "#D3D3D3" : "red"}
              />
            </TouchableOpacity>

            {/* Right/Next Button - Show only if not last profile */}
            {profileIds.length > 0 && currentProfileIndex < profileIds.length - 1 && (
              <TouchableOpacity
                onPress={!isLoadingProfiles ? goToNextProfile : null}
                style={[styles.navButton, isLoadingProfiles && styles.disabledButton]}
                disabled={isLoadingProfiles}
                activeOpacity={isLoadingProfiles ? 1 : 0.7}
              >
                <Ionicons
                  name="chevron-forward-circle"
                  size={40}
                  color={isLoadingProfiles ? "#D3D3D3" : "red"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* {!isProfileUnlocked && photoProtection === 1 && (
            <View style={styles.passwordContainer}>
              <Text style={styles.lockedMessage}>
                * Profile is locked, please enter the password to view the image
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter the password"
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  style={styles.eyeIcon}
                >
                  <MaterialIcons name={passwordVisible ? 'visibility' : 'visibility-off'} size={24} color="black" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handlePasswordSubmit} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )} */}

          <View style={styles.contentContainer}>
            <View style={styles.nameIconFlex}>
              <View style={styles.nameVerifyFlex}>
                <Text style={styles.name}>{basic_details.profile_name}</Text>
                <Ionicons name="shield-checkmark" size={20} color="#53C840" />
              </View>

              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => handleSavePress(profileData?.basic_details?.profile_id)}>
                  <MaterialIcons
                    name={bookmarkedProfiles.has(profileData?.basic_details?.profile_id) ? 'bookmark' : 'bookmark-border'}
                    size={22}
                    color="red"
                    style={styles.saveIcon}
                  />
                </TouchableOpacity>
                {!isPlan16 && photoRequest === 1 && (
                  <MaterialIcons
                    name="insert-photo"
                    size={24}
                    color="#4F515D"
                    style={{ top: 2 }}
                    onPress={handleSendPhotoRequest}
                  />
                )}
                <TouchableOpacity onPress={() => bottomSheetRef.current.open()}>
                  <MaterialIcons name="more-vert" size={24} color="#4F515D" style={{ top: 2 }} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.profileNumber}>{basic_details.profile_id}</Text>



            <View style={styles.detailsMeterFlex}>


              <View style={{ flex: 1, marginRight: 150 }}>
                <Text style={styles.label}>Age: <Text style={styles.value}>{basic_details.age}</Text></Text>
                <Text style={styles.label}>Height: <Text style={styles.value}>{basic_details.height} cms</Text></Text>
                {basic_details.weight !== 0 || basic_details.weight !== null && (
                  <Text style={styles.label}>
                    Weight: <Text style={styles.value}>{basic_details.weight} kg</Text>
                  </Text>
                )}


                <Text style={styles.label}>Star: <Text style={styles.value}>{basic_details.star}</Text></Text>
                <Text style={styles.label}>Profession: <Text style={styles.value}>{basic_details.profession}</Text></Text>
                <Text style={styles.label}>Education: <Text style={styles.value}>{basic_details.education}</Text></Text>
                {/* <Text style={styles.label}>About: <Text style={styles.value}>{basic_details.about}</Text></Text> */}
                <Text style={styles.label}>Degree: <Text style={styles.value}>{basic_details.degeree}</Text></Text>
              </View>
              {basic_details?.matching_score !== undefined &&
                basic_details.matching_score > 50 &&
                basic_details.matching_score !== 100 && (
                  // <View style={{ position: 'absolute', top: 0, right: 10 }}>
                  //   <MatchingScore
                  //     scorePercentage={parseInt(basic_details.matching_score)}
                  //     viewedProfileId={viewedProfileId}
                  //     onUpgradeRequired={handleMatchingScoreUpgrade}
                  //   />
                  // </View>
                  <View style={{ position: 'absolute', top: 0, right: 10 }}>
                    <MatchingScore
                      scorePercentage={parseInt(basic_details.matching_score)}
                      viewedProfileId={viewedProfileId}
                      onUpgradeRequired={handleMatchingScoreUpgrade} // Correctly wired up
                    />
                  </View>

                  // <TouchableOpacity
                  //   onPress={handleDownloadMatchingReport}
                  //   style={{ position: 'absolute', top: 0, right: 10 }}
                  // >
                  //   <MatchingScore
                  //     scorePercentage={parseInt(basic_details.matching_score)}
                  //     viewedProfileId={viewedProfileId}
                  //   />
                  // </TouchableOpacity>
                )}
            </View>
            <View style={styles.detailsMeterFlex1}>
              <View style={styles.filterTag}>
                <Image
                  source={require('../../assets/img/grid.png')}
                  style={styles.gridIcon}
                />
                <Text style={styles.filterTagText}>{basic_details.horoscope_available_text}</Text>
              </View>
              <View style={styles.filterTag}>
                <Image
                  source={require('../../assets/img/person.png')}
                  style={styles.gridIcon}
                />
                <Text style={styles.filterTagText}>{basic_details.user_status}</Text>
              </View>
            </View>

            <View style={styles.detailsMeterFlex1}>
              <View style={styles.filterTag}>
                <Image
                  source={require('../../assets/img/calendar_today.png')}
                  style={styles.gridIcon}
                />
                <Text style={styles.filterTagText}>Last visit on {basic_details.last_visit}</Text>
              </View>
              <View style={styles.filterTag}>
                <Image
                  source={require('../../assets/img/visibility_black.png')}
                  style={styles.gridIcon}
                />
                <Text style={styles.filterTagText}>{basic_details.user_profile_views} views</Text>
              </View>
            </View>

            <View style={styles.buttonContainerExpress}>
              {!isPlan16 && interestParam !== 1 && status !== 2 && status !== 3 && (
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => { expressInt ? handleExpressInterestPress1() : setShowInterestModal(true) }}
                >
                  <LinearGradient
                    colors={expressInt ? ["#28a745", "#4CAF50"] : ["#BD1225", "#FF4050"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    useAngle={true}
                    angle={92.08}
                    angleCenter={{ x: 0.5, y: 0.5 }}
                    style={styles.linearGradient}
                  >
                    <View style={styles.loginContainer}>
                      <Text style={[styles.login, { color: "#fff" }]}>
                        {expressInt ? "Remove Interest" : "Express Interest"}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            <View>
              {status === 2 ? (
                <TouchableOpacity style={styles.messageButton} onPress={handlePressMessage}>
                  <FontAwesome style={styles.icon} />
                  <Text style={styles.messageText}>Message</Text>
                </TouchableOpacity>
              ) : (
                interestParam === 1 &&
                status !== 3 &&
                status !== 2 && (
                  <View style={styles.buttonContainer}>
                    {hideExpressButton && (
                      <>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => handleUpdateInterest(viewedProfileId, "2")}
                        >
                          <FontAwesome style={styles.icon} />
                          <Text style={styles.buttonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.declineButton}
                          onPress={() => handleUpdateInterest(viewedProfileId, "3")}
                        >
                          <FontAwesome style={styles.icon} />
                          <Text style={styles.declineText}>Decline</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )
              )}
              {status === 3 && (
                <Text style={styles.rejectedText}>Your Interest has been rejected</Text>
              )}
            </View>

            {/* <View style={styles.fiveIconFlex}> */}

            <Modal
              visible={isModalVisible}
              transparent={true}
              animationType="slide"
              onRequestClose={toggleModal}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  style={styles.modalOverlay}
                >
                  <View style={styles.modalContent}>
                    <Text style={styles.title}>Personal Notes</Text>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      numberOfLines={4}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Type your text here..."
                    />
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.submitButtonpop]}
                        onPress={handleSubmit}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.buttonText}>Submit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modalButton, styles.closeButton]}
                        onPress={toggleModal}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.buttonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              </TouchableWithoutFeedback>
            </Modal>
            <Modal visible={isPopupVisible} transparent animationType="fade">
              <View style={styles.overlay}>
                <View style={styles.popupContainer}>
                  <View style={styles.header}>
                    <Text style={styles.title}>Notes</Text>
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color="#4F515D"
                      onPress={closePopup}
                    />
                  </View>
                  <View style={styles.body}>
                    {!selectValue && (
                      <TextInput
                        style={styles.textArea}
                        placeholder="Enter your notes here"
                        value={notes}
                        onChangeText={handleNotesChange}
                        multiline
                        numberOfLines={5}
                      />
                    )}
                    {!notes && (
                      <View style={styles.checkboxContainerNew}>
                        {options.map((option, index) => (
                          <Pressable
                            key={index}
                            style={[styles.checkboxContainerNew, selectedOptions.includes(option) && styles.checkboxChecked]}
                            onPress={() => handleCheckboxChange(option)}
                          >
                            <Text style={styles.checkboxText}>
                              <Text style={{ color: selectedOptions.includes(option) ? 'blue' : 'black' }}>
                                {selectedOptions.includes(option) ? "☑" : "☐"} {option}
                              </Text>
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={closePopup}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmitPopup}>
                      <Text style={styles.submitText}>Submit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* --- REPLACE THE ENTIRE MODAL WITH THIS --- */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={showInterestModal}
              onRequestClose={() => {
                // Reset all modal state on close
                setShowInterestModal(false);
                setInterestMessage('');
                setSelectedCategory('');
                setExpressInterestError('');
              }}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Enter your Interest Message</Text>

                  {/* Show TextInput if:
              1. User is on a premium plan (planId is in restrictedPlanIds)
              2. User has NOT selected a category from the picker
            */}
                  {!selectedCategory && custom_message !== "0" && restrictedPlanIds.includes(planId) && (
                    <TextInput
                      style={styles.messageInput}
                      multiline
                      numberOfLines={4}
                      placeholder="Enter your message"
                      value={interestMessage}
                      onChangeText={setInterestMessage} // Directly set the message
                    />
                  )}

                  {/* Show Picker if:
              1. User has NOT typed a custom message
            */}
                  {(!interestMessage || interestMessage.length === 0) && (
                    <Picker
                      selectedValue={selectedCategory}
                      style={styles.categoryPicker}
                      onValueChange={(itemValue) => {
                        setSelectedCategory(itemValue);
                      }}
                    >
                      <Picker.Item label="Select Category" value="" />
                      <Picker.Item
                        label="Horscope matched and I would love to know more about you"
                        value="Horscope matched and I would love to know more about you"
                      />
                      <Picker.Item
                        label="I am interested in knowing more about you"
                        value="I am interested in knowing more about you"
                      />
                      <Picker.Item
                        label="It seems our stars align. I'm eager to get to know you better"
                        value="It seems our stars align. I'm eager to get to know you better"
                      />
                    </Picker>
                  )}

                  {expressInterestError ? (
                    <Text style={styles.errorText}>{expressInterestError}</Text>
                  ) : null}

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.submitButtonpop]}
                      onPress={handleExpressInterestPress} // This function already checks both fields
                    >
                      <Text style={styles.buttonText}>Submit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.closeButton]}
                      onPress={() => {
                        // Reset all modal state on close
                        setShowInterestModal(false);
                        setInterestMessage('');
                        setSelectedCategory('');
                        setExpressInterestError('');
                      }}
                    >
                      <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            {/* </View> */}

            {/* <Text style={styles.details}>Details</Text> */}
          </View>

          {/* <ProfileDetailsView viewedProfileId={viewedProfileId} /> */}
          <View style={styles.scrollViewContentContainer}>
            {/* Icons Row */}
            <View style={styles.iconsRowContainer}>
              <View style={styles.iconContainer}>
                {/* Personal Icon */}

                <TouchableOpacity onPress={togglePersonalDetails}>
                  <FontAwesome5
                    name="user-circle"
                    size={22}
                    color={showPersonalDetails ? '#FFFFFF' : '#85878C'}
                    style={styles.iconStyle}
                  />
                </TouchableOpacity>
                <Text style={[styles.iconText, { color: showPersonalDetails ? '#FFFFFF' : '#85878C' }]}>Personal</Text>
              </View>

              <View style={styles.iconContainer}>
                {/* Work */}

                <TouchableOpacity onPress={toggleEducationDetails}>
                  <MaterialIcons
                    name="work"
                    size={22}
                    color={showEducationDetails ? '#FFFFFF' : '#85878C'}
                    style={styles.iconStyle}
                  />
                </TouchableOpacity>
                <Text style={[styles.iconText, { color: showEducationDetails ? '#FFFFFF' : '#85878C' }]}>Work</Text>
              </View>

              <View style={styles.iconContainer}>
                {/* Family */}

                <TouchableOpacity onPress={toggleFamilyDetails}>
                  <FontAwesome5
                    name="users"
                    size={22}
                    color={showFamilyDetails ? '#FFFFFF' : '#85878C'}
                    style={styles.iconStyle}
                  />
                  <Text style={[styles.iconText, { color: showFamilyDetails ? '#FFFFFF' : '#85878C' }]}>Family</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.iconContainer}>
                {/* Horoscope */}

                <TouchableOpacity onPress={toggleHoroscopeDetails}>
                  <MaterialCommunityIcons
                    name="zodiac-libra"
                    size={22}
                    color={showHoroscopeDetails ? '#FFFFFF' : '#85878C'}
                    style={styles.iconStyle}
                  />
                </TouchableOpacity>
                <Text style={[styles.iconText, { color: showHoroscopeDetails ? '#FFFFFF' : '#85878C' }]}>Horoscope</Text>
              </View>

              <View style={styles.iconContainer}>
                {/* Contact */}

                <TouchableOpacity onPress={toggleContactDetails}>
                  <MaterialIcons
                    name="phone"
                    size={22}
                    color={showContactDetails ? '#FFFFFF' : '#85878C'}
                    style={styles.iconStyle}
                  />
                </TouchableOpacity>
                <Text style={[styles.iconText, { color: showContactDetails ? '#FFFFFF' : '#85878C' }]}>Contact</Text>
              </View>
            </View>

            {/* Details Sections */}
            {/* Personal Details */}
            {showPersonalDetails && (
              <View style={styles.menuChanges}>
                <View style={styles.editOptions}>
                  <Text style={styles.titleNew}>Personal Details</Text>
                  <View style={styles.line} />
                  {profileData.personal_details?.profile_name && profileData.personal_details.profile_name !== "" && profileData.personal_details.profile_name !== null && (
                    <Text style={styles.labelNew}>Name : <Text style={styles.valueNew}>{profileData.personal_details.profile_name}</Text></Text>
                  )}
                  {profileData.personal_details?.gender && profileData.personal_details.gender !== "" && profileData.personal_details.gender !== null && (
                    <Text style={styles.labelNew}>Gender : <Text style={styles.valueNew}>{profileData.personal_details.gender}</Text></Text>
                  )}
                  {profileData.personal_details?.age && profileData.personal_details.age !== "" && profileData.personal_details.age !== null && (
                    <Text style={styles.labelNew}>Age : <Text style={styles.valueNew}>{profileData.personal_details.age} Years</Text></Text>
                  )}
                  {profileData.personal_details?.dob && profileData.personal_details.dob !== "" && profileData.personal_details.dob !== null && (
                    <Text style={styles.labelNew}>DOB : <Text style={styles.valueNew}>{profileData.personal_details.dob}</Text></Text>
                  )}
                  {profileData.personal_details?.place_of_birth && profileData.personal_details.place_of_birth !== "" && profileData.personal_details.place_of_birth !== null && (
                    <Text style={styles.labelNew}>Place of Birth : <Text style={styles.valueNew}>{profileData.personal_details.place_of_birth}</Text></Text>
                  )}
                  {profileData.personal_details?.time_of_birth && profileData.personal_details.time_of_birth !== "" && profileData.personal_details.time_of_birth !== null && (
                    <Text style={styles.labelNew}>Time of Birth : <Text style={styles.valueNew}>{profileData.personal_details.time_of_birth}</Text></Text>
                  )}
                  {profileData.personal_details?.height && profileData.personal_details.height !== "" && profileData.personal_details.height !== null && (
                    <Text style={styles.labelNew}>Height : <Text style={styles.valueNew}>{profileData.personal_details.height}</Text></Text>
                  )}
                  {profileData.personal_details?.weight && profileData.personal_details.weight !== "" && profileData.personal_details.weight !== null && profileData.personal_details.weight !== "0" && (
                    <Text style={styles.labelNew}>Weight : <Text style={styles.valueNew}>{profileData.personal_details.weight}</Text></Text>
                  )}
                  {profileData.personal_details?.body_type && profileData.personal_details.body_type !== "" && profileData.personal_details.body_type !== null && profileData.personal_details.body_type !== "0" && (
                    <Text style={styles.labelNew}>Body Type : <Text style={styles.valueNew}>{profileData.personal_details.body_type}</Text></Text>
                  )}
                  {profileData.personal_details?.eye_wear && profileData.personal_details.eye_wear !== "" && profileData.personal_details.eye_wear !== null && profileData.personal_details.eye_wear !== "0" && (
                    <Text style={styles.labelNew}>Eye Wear : <Text style={styles.valueNew}>{profileData.personal_details.eye_wear}</Text></Text>
                  )}
                  {profileData.personal_details?.marital_status && profileData.personal_details.marital_status !== "" && profileData.personal_details.marital_status !== null && (
                    <Text style={styles.labelNew}>Marital Status : <Text style={styles.valueNew}>{profileData.personal_details.marital_status}</Text></Text>
                  )}
                  {profileData.personal_details?.blood_group && profileData.personal_details.blood_group !== "" && profileData.personal_details.blood_group !== null && (
                    <Text style={styles.labelNew}>Blood Group : <Text style={styles.valueNew}>{profileData.personal_details.blood_group}</Text></Text>
                  )}
                  {profileData.personal_details?.about_self && profileData.personal_details.about_self !== "" && profileData.personal_details.about_self !== null && (
                    <Text style={styles.labelNew}>About Myself : <Text style={styles.valueNew}>{profileData.personal_details.about_self}</Text></Text>
                  )}
                  {profileData.personal_details?.complexion && profileData.personal_details.complexion !== "" && profileData.personal_details.complexion !== null && (
                    <Text style={styles.labelNew}>Complexion : <Text style={styles.valueNew}>{profileData.personal_details.complexion}</Text></Text>
                  )}
                  {profileData.personal_details?.hobbies && profileData.personal_details.hobbies !== "" && profileData.personal_details.hobbies !== null && (
                    <Text style={styles.labelNew}>Hobbies : <Text style={styles.valueNew}>{profileData.personal_details.hobbies}</Text></Text>
                  )}
                  {profileData.personal_details?.physical_status && profileData.personal_details.physical_status !== "" && profileData.personal_details.physical_status !== null && profileData.personal_details.physical_status !== "0" && (
                    <Text style={styles.labelNew}>Physical Status : <Text style={styles.valueNew}>{profileData.personal_details.physical_status}</Text></Text>
                  )}
                  {/* <Text style={styles.labelNew}>Mobile no :<Text style={styles.valueNew}>{profileData.personal_details.Mobile_no}</Text></Text> */}
                  {/* <Text style={styles.labelNew}>Profile Created By : <Text style={styles.valueNew}>{profileData.personal_details.profile_created_by}</Text></Text> */}
                </View>
              </View>
            )}

            {showEducationDetails && (
              <View style={styles.menuChanges}>
                <View style={styles.editOptions}>
                  <Text style={styles.titleNew}>Education & Profession Details</Text>
                  <View style={styles.line} />
                  {profileData.education_details?.education_level && profileData.education_details.education_level !== "" && profileData.education_details.education_level !== null && (
                    <Text style={styles.labelNew}>Education Level : <Text style={styles.valueNew}>{profileData.education_details.education_level}</Text></Text>
                  )}
                  {profileData.education_details?.degeree && profileData.education_details.degeree !== "" && profileData.education_details.degeree !== null && (
                    <Text style={styles.labelNew}>Degree : <Text style={styles.valueNew}>{profileData.education_details.degeree}</Text></Text>
                  )}
                  {/* <Text style={styles.labelNew}>Educational Details : <Text style={styles.valueNew}>{profileData.education_details.education_detail}</Text></Text> */}
                  {profileData.education_details?.about_education && profileData.education_details.about_education !== "" && profileData.education_details.about_education !== null && (
                    <Text style={styles.labelNew}>About Education : <Text style={styles.valueNew}>{profileData.education_details.about_education}</Text></Text>
                  )}
                  <Text style={styles.labelNew}>Profession : <Text style={styles.valueNew}>{profileData.education_details.profession}</Text></Text>
                  {profileData.education_details?.company_name && profileData.education_details.company_name !== "" && profileData.education_details.company_name !== null && (
                    <Text style={styles.labelNew}>Company Name : <Text style={styles.valueNew}>{profileData.education_details.company_name}</Text></Text>
                  )}
                  {profileData.education_details?.designation && profileData.education_details.designation !== "" && profileData.education_details.designation !== null && (
                    <Text style={styles.labelNew}>Designation : <Text style={styles.valueNew}>{profileData.education_details.designation}</Text></Text>
                  )}
                  {profileData.education_details?.business_name && profileData.education_details.business_name !== "" && profileData.education_details.business_name !== null && (
                    <Text style={styles.labelNew}>Business Name : <Text style={styles.valueNew}>{profileData.education_details.business_name}</Text></Text>
                  )}
                  {profileData.education_details?.business_address && profileData.education_details.business_address !== "" && profileData.education_details.business_address !== null && (
                    <Text style={styles.labelNew}>Business Address : <Text style={styles.valueNew}>{profileData.education_details.business_address}</Text></Text>
                  )}
                  {profileData.education_details?.annual_income && profileData.education_details.annual_income !== "" && profileData.education_details.annual_income !== null && (
                    <Text style={styles.labelNew}>Annual Income : <Text style={styles.valueNew}>{profileData.education_details.annual_income}</Text></Text>
                  )}
                  {profileData.education_details?.gross_annual_income && profileData.education_details.gross_annual_income !== "" && profileData.education_details.gross_annual_income !== null && (
                    <Text style={styles.labelNew}>Gross annual Income : <Text style={styles.valueNew}>{profileData.education_details.gross_annual_income}</Text></Text>
                  )}
                  {profileData.education_details?.place_of_stay && profileData.education_details.place_of_stay !== "" && profileData.education_details.place_of_stay !== null && (
                    <Text style={styles.labelNew}>Place of Stay : <Text style={styles.valueNew}>{profileData.education_details.place_of_stay}</Text></Text>
                  )}
                </View>
              </View>
            )}

            {showFamilyDetails && (
              <View style={styles.menuChanges}>
                <View style={styles.editOptions}>
                  <Text style={styles.titleNew}>Family Details</Text>
                  <View style={styles.line} />
                  {profileData.family_details?.about_family && profileData.family_details.about_family !== "" && profileData.family_details.about_family !== null && (
                    <Text style={styles.labelNew}>About Family : <Text style={styles.valueNew}>{profileData.family_details.about_family}</Text></Text>
                  )}
                  {profileData.family_details?.father_name && profileData.family_details.father_name !== "" && profileData.family_details.father_name !== null && (
                    <Text style={styles.labelNew}>Father's Name : <Text style={styles.valueNew}>{profileData.family_details.father_name}</Text></Text>
                  )}
                  {profileData.family_details?.father_occupation && profileData.family_details.father_occupation !== "" && profileData.family_details.father_occupation !== null && (
                    <Text style={styles.labelNew}>Father's occupation : <Text style={styles.valueNew}>{profileData.family_details.father_occupation}</Text></Text>
                  )}
                  {profileData.family_details?.mother_name && profileData.family_details.mother_name !== "" && profileData.family_details.mother_name !== null && (
                    <Text style={styles.labelNew}>Mother's Name : <Text style={styles.valueNew}>{profileData.family_details.mother_name}</Text></Text>
                  )}
                  {profileData.family_details?.mother_occupation && profileData.family_details.mother_occupation !== "" && profileData.family_details.mother_occupation !== null && (
                    <Text style={styles.labelNew}>Mother's occupation : <Text style={styles.valueNew}>{profileData.family_details.mother_occupation}</Text></Text>
                  )}
                  {profileData.family_details?.family_status && profileData.family_details.family_status !== "" && profileData.family_details.family_status !== null && (
                    <Text style={styles.labelNew}>Family Status : <Text style={styles.valueNew}>{profileData.family_details.family_status}</Text></Text>
                  )}
                  {profileData.family_details?.no_of_sisters && profileData.family_details.no_of_sisters !== "" && profileData.family_details.no_of_sisters !== null && (
                    <Text style={styles.labelNew}>Sisters : <Text style={styles.valueNew}>{profileData.family_details.no_of_sisters}</Text></Text>
                  )}
                  {profileData.family_details?.no_of_sis_married && profileData.family_details.no_of_sis_married !== "" && profileData.family_details.no_of_sis_married !== null && (
                    <Text style={styles.labelNew}>Sisters Married : <Text style={styles.valueNew}>{profileData.family_details.no_of_sis_married}</Text></Text>
                  )}
                  {profileData.family_details?.no_of_brothers && profileData.family_details.no_of_brothers !== "" && profileData.family_details.no_of_brothers !== null && (
                    <Text style={styles.labelNew}>Brothers : <Text style={styles.valueNew}>{profileData.family_details.no_of_brothers}</Text></Text>
                  )}
                  {profileData.family_details?.no_of_bro_married && profileData.family_details.no_of_bro_married !== "" && profileData.family_details.no_of_bro_married !== null && (
                    <Text style={styles.labelNew}>Brothers Married : <Text style={styles.valueNew}>{profileData.family_details.no_of_bro_married}</Text></Text>
                  )}
                  {profileData.family_details?.property_details && profileData.family_details.property_details !== "" && profileData.family_details.property_details !== null && (
                    <Text style={styles.labelNew}>Property details : <Text style={styles.valueNew}>{profileData.family_details.property_details}</Text></Text>
                  )}
                  {profileData.family_details?.property_details && profileData.family_details.property_details !== "" && profileData.family_details.property_details !== null && (
                    <Text style={styles.labelNew}>Father Alive : <Text style={styles.valueNew}>{profileData.family_details.father_alive}</Text></Text>
                  )}
                  {profileData.family_details?.property_details && profileData.family_details.property_details !== "" && profileData.family_details.property_details !== null && (
                    <Text style={styles.labelNew}>Mother Alive : <Text style={styles.valueNew}>{profileData.family_details.father_alive}</Text></Text>
                  )}
                </View>
              </View>
            )}

            {showHoroscopeDetails && (
              <View style={styles.menuChanges}>
                <View style={styles.editOptions}>
                  <Text style={styles.titleNew}>Horoscope Details</Text>
                  <View style={styles.line} />
                  {profileData.horoscope_details?.rasi && profileData.horoscope_details.rasi !== "" && profileData.horoscope_details.rasi !== null && (
                    <Text style={styles.labelNew}>Rasi : <Text style={styles.valueNew}>{profileData.horoscope_details.rasi}</Text></Text>
                  )}
                  {profileData.horoscope_details?.padham && profileData.horoscope_details.padham !== "" && profileData.horoscope_details.padham !== null && (
                    <Text style={styles.labelNew}>Padham : <Text style={styles.valueNew}>{profileData.horoscope_details.padham}</Text></Text>
                  )}
                  {profileData.horoscope_details?.star_name && profileData.horoscope_details.star_name !== "" && profileData.horoscope_details.star_name !== null && (
                    <Text style={styles.labelNew}>Star : <Text style={styles.valueNew}>{profileData.horoscope_details.star_name}</Text></Text>
                  )}
                  {profileData.horoscope_details?.lagnam && profileData.horoscope_details.lagnam !== "" && profileData.horoscope_details.lagnam !== null && (
                    <Text style={styles.labelNew}>Lagnam : <Text style={styles.valueNew}>{profileData.horoscope_details.lagnam}</Text></Text>
                  )}
                  {profileData.horoscope_details?.nallikai && profileData.horoscope_details.nallikai !== "" && profileData.horoscope_details.nallikai !== null && (
                    <Text style={styles.labelNew}>Nallikai : <Text style={styles.valueNew}>{profileData.horoscope_details.nallikai}</Text></Text>
                  )}
                  {profileData.horoscope_details?.didi && profileData.horoscope_details.didi !== "" && profileData.horoscope_details.didi !== null && (
                    <Text style={styles.labelNew}>Didi : <Text style={styles.valueNew}>{profileData.horoscope_details.didi}</Text></Text>
                  )}
                  {profileData.horoscope_details?.surya_gothram && profileData.horoscope_details.surya_gothram !== "" && profileData.horoscope_details.surya_gothram !== null && (
                    <Text style={styles.labelNew}>Surya Gothram : <Text style={styles.valueNew}>{profileData.horoscope_details.surya_gothram}</Text></Text>
                  )}
                  {profileData.horoscope_details?.madulamn && profileData.horoscope_details.madulamn !== "" && profileData.horoscope_details.madulamn !== null && (
                    <Text style={styles.labelNew}>Madhulam : <Text style={styles.valueNew}>{profileData.horoscope_details.madulamn}</Text></Text>
                  )}
                  {profileData.horoscope_details?.dasa_name && profileData.horoscope_details.dasa_name !== "" && profileData.horoscope_details.dasa_name !== null && (
                    <Text style={styles.labelNew}>Dasa Name : <Text style={styles.valueNew}>{profileData.horoscope_details.dasa_name}</Text></Text>
                  )}
                  {profileData.horoscope_details?.dasa_balance && profileData.horoscope_details.dasa_balance !== "" && profileData.horoscope_details.dasa_balance !== null && (
                    <Text style={styles.labelNew}>Dasa Balance : <Text style={styles.valueNew}>{profileData.horoscope_details.dasa_balance}</Text></Text>
                  )}
                  {profileData.horoscope_details?.chevvai_dosham && profileData.horoscope_details.chevvai_dosham !== "" && profileData.horoscope_details.chevvai_dosham !== null && (
                    <Text style={styles.labelNew}>Chevvai Dosham : <Text style={styles.valueNew}>{profileData.horoscope_details.chevvai_dosham}</Text></Text>
                  )}
                  {profileData.horoscope_details?.sarpadosham && profileData.horoscope_details.sarpadosham !== "" && profileData.horoscope_details.sarpadosham !== null && (
                    <Text style={styles.labelNew}>Ragu/Kethu Dhosham: : <Text style={styles.valueNew}>{profileData.horoscope_details.sarpadosham}</Text></Text>
                  )}
                  {/* <View style={styles.rasiContainer}> */}
                  {/* RASI CHART - SOUTH INDIAN LAYOUT */}
                  {showHoroscopeDetails && rasiGrid.length >= 4 && (
                    <View style={styles.horoscopeSection}>
                      <Text style={styles.chartTitle}>Rasi & Amsam Grid</Text>
                      <View style={styles.chartBorder}>

                        {/* --- TOP ROW (Pisces, Aries, Taurus, Gemini) --- */}
                        <View style={styles.chartRow}>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][0]}</Text></View>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][1]}</Text></View>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][2]}</Text></View>
                          <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{rasiGrid[0][3]}</Text></View>
                        </View>

                        {/* --- MIDDLE SECTION (Aquarius/Cap & Cancer/Leo) --- */}
                        <View style={[styles.chartRow, { flex: 2, borderBottomWidth: 1 }]}>

                          {/* Left Column (Aquarius, Capricorn) */}
                          <View style={styles.sideColumn}>
                            <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}>
                              <Text style={styles.chartText}>{rasiGrid[1][0]}</Text>
                            </View>
                            <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}>
                              <Text style={styles.chartText}>{rasiGrid[2][0]}</Text>
                            </View>
                          </View>

                          {/* Center Box (Empty / Title) */}
                          <View style={styles.centerBox}>
                            <Text style={styles.centerLabel}>Rasi</Text>
                            <Text style={styles.centerDomain}>vysyamala.com</Text>
                          </View>

                          {/* Right Column (Cancer, Leo) - Note the Index [3] for the last cell */}
                          <View style={[styles.sideColumn, { borderRightWidth: 0 }]}>
                            <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}>
                              <Text style={styles.chartText}>{rasiGrid[1][rasiGrid[1].length - 1]}</Text>
                            </View>
                            <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}>
                              <Text style={styles.chartText}>{rasiGrid[2][rasiGrid[2].length - 1]}</Text>
                            </View>
                          </View>
                        </View>

                        {/* --- BOTTOM ROW (Sagittarius, Scorpio, Libra, Virgo) --- */}
                        <View style={[styles.chartRow, { borderBottomWidth: 0 }]}>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][0]}</Text></View>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][1]}</Text></View>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][2]}</Text></View>
                          <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{rasiGrid[3][3]}</Text></View>
                        </View>

                      </View>
                    </View>
                  )}
                  {showHoroscopeDetails && amsaGrid.length >= 4 && (
                    <View style={styles.horoscopeSection}>
                      <View style={styles.chartBorder}>

                        {/* --- TOP ROW (Pisces, Aries, Taurus, Gemini) --- */}
                        <View style={styles.chartRow}>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][0]}</Text></View>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][1]}</Text></View>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][2]}</Text></View>
                          <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{amsaGrid[0][3]}</Text></View>
                        </View>

                        {/* --- MIDDLE SECTION (Aquarius/Cap & Cancer/Leo) --- */}
                        <View style={[styles.chartRow, { flex: 2, borderBottomWidth: 1 }]}>

                          {/* Left Column (Aquarius, Capricorn) */}
                          <View style={styles.sideColumn}>
                            <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}>
                              <Text style={styles.chartText}>{amsaGrid[1][0]}</Text>
                            </View>
                            <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}>
                              <Text style={styles.chartText}>{amsaGrid[2][0]}</Text>
                            </View>
                          </View>

                          {/* Center Box (Empty / Title) */}
                          <View style={styles.centerBox}>
                            <Text style={styles.centerLabel}>Amsam</Text>
                            <Text style={styles.centerDomain}>vysyamala.com</Text>
                          </View>

                          {/* Right Column (Cancer, Leo) - Note the Index [3] for the last cell */}
                          <View style={[styles.sideColumn, { borderRightWidth: 0 }]}>
                            <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}>
                              <Text style={styles.chartText}>{amsaGrid[1][amsaGrid[1].length - 1]}</Text>
                            </View>
                            <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}>
                              <Text style={styles.chartText}>{amsaGrid[2][amsaGrid[2].length - 1]}</Text>
                            </View>
                          </View>
                        </View>

                        {/* --- BOTTOM ROW (Sagittarius, Scorpio, Libra, Virgo) --- */}
                        <View style={[styles.chartRow, { borderBottomWidth: 0 }]}>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[3][0]}</Text></View>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[3][1]}</Text></View>
                          <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[3][2]}</Text></View>
                          <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{amsaGrid[3][3]}</Text></View>
                        </View>

                      </View>
                    </View>
                  )}
                  {/* </View> */}
                </View>
              </View>
            )}

            {showContactDetails && (
              <View style={styles.menuChanges}>
                <View style={styles.editOptions}>
                  <Text style={styles.titleNew}>Contact Details</Text>
                  <View style={styles.line} />
                  {profileData.contact_details?.address && profileData.contact_details.address !== "" && profileData.contact_details.address !== null && (
                    <Text style={styles.labelNew}>Address : <Text style={styles.valueNew}>{profileData.contact_details.address}</Text></Text>
                  )}
                  {profileData.contact_details?.city && profileData.contact_details.city !== "" && profileData.contact_details.city !== null && (
                    <Text style={styles.labelNew}>City : <Text style={styles.valueNew}>{profileData.contact_details.city}</Text></Text>
                  )}
                  {profileData.contact_details?.state && profileData.contact_details.state !== "" && profileData.contact_details.state !== null && (
                    <Text style={styles.labelNew}>State : <Text style={styles.valueNew}>{profileData.contact_details.state}</Text></Text>
                  )}
                  {profileData.contact_details?.country && profileData.contact_details.country !== "" && profileData.contact_details.country !== null && (
                    <Text style={styles.labelNew}>Country : <Text style={styles.valueNew}>{profileData.contact_details.country}</Text></Text>
                  )}
                  {profileData.contact_details?.phone && profileData.contact_details.phone !== "" && profileData.contact_details.phone !== null && (
                    <Text style={styles.labelNew}>Phone no : <Text style={styles.valueNew}>{profileData.contact_details.phone}</Text></Text>
                  )}
                  {profileData.contact_details?.mobile && profileData.contact_details.mobile !== "" && profileData.contact_details.mobile !== null && (
                    <Text style={styles.labelNew}>Mobile no : <Text style={styles.valueNew}>{profileData.contact_details.mobile}</Text></Text>
                  )}
                  {profileData.contact_details?.whatsapp && profileData.contact_details.whatsapp !== "" && profileData.contact_details.whatsapp !== null && (
                    <Text style={styles.labelNew}>Whatsapp : <Text style={styles.valueNew}>{profileData.contact_details.whatsapps}</Text></Text>
                  )}
                  {profileData.contact_details?.email && profileData.contact_details.email !== "" && profileData.contact_details.email !== null && (
                    <Text style={styles.labelNew}>Email : <Text style={styles.valueNew}>{profileData.contact_details.email}</Text></Text>
                  )}
                </View>
              </View>
            )}
          </View>
          <FeaturedProfiles />
          <SuggestedProfiles />
        </Animated.ScrollView>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ED1E24" />
        </View>
      )}

      <RBSheet
        ref={bottomSheetRef}
        closeOnDragDown={true}
        closeOnPressMask={true}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)"
          },
          draggableIcon: {
            backgroundColor: "#000"
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20
          }
        }}
        height={400}
      >
        {renderBottomSheetContent()}
      </RBSheet>

      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)'
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 10,
            padding: 24,
            width: '80%',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              Upgrade Required
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              {responseMsg}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity
                style={{ flex: 1, marginRight: 8, padding: 10, alignItems: 'center' }}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={{ color: '#333' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#ED1E24',
                  borderRadius: 5,
                  padding: 10,
                  alignItems: 'center'
                }}
                onPress={() => {
                  setShowUpgradeModal(false);
                  navigation.navigate('MembershipPlan');
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showVysassist &&
        VysassistEnable === 1 && vysassits === false && (
          <Modal visible={showVysassist} transparent animationType="fade">
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.overlay}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.popupContainer}>
                  <View style={styles.header}>
                    <Text style={styles.title}>Vysassist Notes</Text>
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color="#4F515D"
                      onPress={closePopupnew}
                    />
                  </View>
                  <ScrollView>
                    <View style={styles.modalBody}>
                      <Text style={styles.subTitle}>
                        Apply for Vysya Assist: ({selectedOptions.length}/{options.length})
                      </Text>
                      <View style={styles.checkboxContainerNew1}>
                        {options.map((option, index) => (
                          <Pressable
                            key={index}
                            style={[styles.checkboxContainerNew2]}
                            onPress={() => handleCheckboxChange(option)}
                          >
                            <MaterialIcons
                              name={selectedOptions.includes(option) ? "check-box" : "check-box-outline-blank"}
                              size={22}
                              color={selectedOptions.includes(option) ? '#007AFF' : '#333'}
                            />
                            <Text style={{ fontSize: 16, marginLeft: 1 }}>
                              {option}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <Text style={styles.label}>Add Your Notes/Instructions</Text>
                      <TextInput
                        style={styles.textInputnew}
                        value={selectedOptions.join(", ")}
                        placeholder="Selected options will appear here"
                      />
                    </View>
                  </ScrollView>
                  {expressInterestError ? (
                    <Text style={styles.errorText}>{expressInterestError}</Text>
                  ) : null}
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.submitButtonpop]}
                      onPress={handleSubmitVysassistPopup}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.buttonText}>Submit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.closeButton]}
                      onPress={closePopupnew}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>

        )}

      {showVysassist &&
        VysassistEnable === 1 && vysassits === true && data === null && (
          <Modal visible={showVysassist} transparent animationType="fade">
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.overlay}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.popupContainer}>
                  <View style={styles.header}>
                    <Text style={styles.title}>Vysassist Notes</Text>
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color="#4F515D"
                      onPress={closePopupnew}
                    />
                  </View>
                  <ScrollView>
                    <View style={styles.modalBody}>
                      <Text style={styles.subTitle}>
                        Apply for Vysya Assist: ({selectedOptions.length}/{options.length})
                      </Text>
                      <View style={styles.checkboxContainerNew1}>
                        {options.map((option, index) => (
                          <Pressable
                            key={index}
                            style={[styles.checkboxContainerNew2]}
                            onPress={() => handleCheckboxChange(option)}
                          >
                            <MaterialIcons
                              name={selectedOptions.includes(option) ? "check-box" : "check-box-outline-blank"}
                              size={22}
                              color={selectedOptions.includes(option) ? '#007AFF' : '#333'}
                            />
                            <Text style={{ fontSize: 16, marginLeft: 1 }}>
                              {option}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <Text style={styles.label}>Add Your Notes/Instructions</Text>
                      <TextInput
                        style={styles.textInputnew}
                        value={selectedOptions.join(", ")}
                        placeholder="Selected options will appear here"
                      />
                    </View>
                  </ScrollView>
                  {expressInterestError ? (
                    <Text style={styles.errorText}>{expressInterestError}</Text>
                  ) : null}
                  <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={closePopupnew}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmitVysassistPopup}>
                      <Text style={styles.submitText}>Submit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>

        )}

      {showVysassist && VysassistEnable === 1 && vysassits === true && data !== null && (
        <Modal visible={showVysassist} transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.popupContainer}>
              <Text style={styles.titleNewnote}>Vysassist applied on 24th Dec 2024</Text>
              <View style={styles.header}>
                <Text style={styles.titleNewnote}>Here is the status of your Vysassist Request :</Text>
              </View>
              <ScrollView style={{ maxHeight: 400 }}>
                <Timeline
                  data={data}
                  circleSize={16}
                  circleColor="#4CAF50"
                  lineColor="#E0E0E0"
                  timeContainerStyle={{ minWidth: 72 }}
                  timeStyle={{
                    textAlign: 'left',
                    backgroundColor: '#ff9797',
                    color: '#fff',
                    padding: 5,
                    fontSize: 12,
                    top: -2,
                    fontWeight: 'bold',
                    borderRadius: 13
                  }}
                  descriptionStyle={{
                    color: '#333',
                    fontSize: 16,
                    paddingTop: 2,
                    top: -47,
                    fontWeight: 'bold',
                    marginBottom: -20
                  }}
                  options={{
                    style: { paddingTop: 5 }
                  }}
                // innerCircle={'dot'}
                />
              </ScrollView>
              <View style={styles.modalButtonsNew}>
                <TouchableOpacity
                  style={[styles.modalButtonNew, styles.submitButtonpop]}
                  onPress={closePopupnew}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      )}

      {showVysassist &&
        VysassistEnable === 0 && (
          // VysassistEnable === 1 &&  vysassits === true && data !== null && (
          <Modal visible={showVysassist} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.popupContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>Apply for VysAssist</Text>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color="#4F515D"
                    onPress={closePopupnew}
                  />
                </View>
                {/* Description */}
                <Text style={styles.description}>
                  You have not activated VysAssist for your plan. You can opt for 3
                  matching profiles for Rs.900/-
                </Text>

                {/* Process List */}
                <Text style={styles.processTitle}>VysAssist Process:</Text>
                <View style={styles.listContainer}>
                  <Text style={styles.listItem}>
                    • Analyze your request and our relationship executive will share
                    the profile with prospective matches.
                  </Text>
                  <Text style={styles.listItem}>
                    • Follow-up (5 attempts) with prospective matches and update the
                    status.
                  </Text>
                  <Text style={styles.listItem}>
                    • Collect necessary family background information/photos (if
                    available) and share it with you.
                  </Text>
                </View>
                {/* Buttons */}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButtonpop]}
                    onPress={() => {
                      // closePopupnew();
                      navigation.navigate("PayNow");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.buttonText}>Pay Now</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.closeButton]}
                    onPress={closePopupnew}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

        )}

      {/* Sticky Icons Navigation */}
      <Animated.View
        style={[
          styles.stickyIconsContainer,
          {
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [headerHeight - 60, headerHeight],
                outputRange: [-60, 0],
                extrapolate: 'clamp',
              })
            }],
            opacity: scrollY.interpolate({
              inputRange: [headerHeight - 60, headerHeight],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            })
          }
        ]}
      >
        <View style={styles.iconsRowContainer}>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={togglePersonalDetails}>
              <FontAwesome5
                name="user-circle"
                size={22}
                color={showPersonalDetails ? '#FFFFFF' : '#85878C'}
                style={styles.iconStyle}
              />
            </TouchableOpacity>
            <Text style={[styles.iconText, { color: showPersonalDetails ? '#FFFFFF' : '#85878C' }]}>Personal</Text>
          </View>

          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={toggleEducationDetails}>
              <MaterialIcons
                name="work"
                size={22}
                color={showEducationDetails ? '#FFFFFF' : '#85878C'}
                style={styles.iconStyle}
              />
            </TouchableOpacity>
            <Text style={[styles.iconText, { color: showEducationDetails ? '#FFFFFF' : '#85878C' }]}>Work</Text>
          </View>

          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={toggleFamilyDetails}>
              <FontAwesome5
                name="users"
                size={22}
                color={showFamilyDetails ? '#FFFFFF' : '#85878C'}
                style={styles.iconStyle}
              />
              <Text style={[styles.iconText, { color: showFamilyDetails ? '#FFFFFF' : '#85878C' }]}>Family</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={toggleHoroscopeDetails}>
              <MaterialCommunityIcons
                name="zodiac-libra"
                size={22}
                color={showHoroscopeDetails ? '#FFFFFF' : '#85878C'}
                style={styles.iconStyle}
              />
            </TouchableOpacity>
            <Text style={[styles.iconText, { color: showHoroscopeDetails ? '#FFFFFF' : '#85878C' }]}>Horoscope</Text>
          </View>

          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={toggleContactDetails}>
              <MaterialIcons
                name="phone"
                size={22}
                color={showContactDetails ? '#FFFFFF' : '#85878C'}
                style={styles.iconStyle}
              />
            </TouchableOpacity>
            <Text style={[styles.iconText, { color: showContactDetails ? '#FFFFFF' : '#85878C' }]}>Contact</Text>
          </View>
        </View>
      </Animated.View>
      <BottomTabBarComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },
  container: {
    flex: 1,
    paddingBottom: 80,
  },
  headerContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    zIndex: 1,
  },
  headerText: {
    color: "#282C3F",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 5,
    minWidth: 50,
    alignItems: 'center',
  },
  leftNavButton: {
    // left: 10,
  },
  rightNavButton: {
    // right: 10,
  },
  contentWrapper: {
    position: 'relative',
  },
  itemContainer: {
    justifyContent: 'center',
  },

  image: {
    width: "100%",
    height: "100%",
  },

  indexText: {
    textAlign: 'center',
    fontSize: 30,
  },

  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: 'transparent',
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },

  contentContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },

  name: {
    color: "#FF6666",
    fontSize: 22,
    fontFamily: "inter",
    fontWeight: "700",
    marginRight: 10,
  },

  nameIconFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
  },

  nameVerifyFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  saveIcon: {
    margin: 5
  },

  profileNumber: {
    fontSize: 17,
    fontWeight: "700",
    color: "#535665",
    marginBottom: 6,
    alignSelf: "flex-start",
  },

  detailsMeterFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    position: "relative",

  },
  detailsMeterFlex1: {
    flexDirection: "row",
    // justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10, top: -20, left: -5,
    marginTop: 20, top: -20, left: -5,
  },

  label: {
    color: "#535665",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "inter",
    marginBottom: 8,
  },

  value: {
    color: "#4F515D",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "inter",
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

  fiveIconFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },

  details: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "inter",
    color: "#282C3F",
    alignSelf: "flex-start",
    marginVertical: 10,
  },

  passwordContainer: {
    margin: 20,
  },
  lockedMessage: {
    marginBottom: 10,
    color: 'red',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
  },
  eyeIcon: {
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: 'red',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'center',
  },
  submitTextNew: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15
  },
  submitButtonNew: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    // borderRadius: 5,
    alignSelf: 'center',
    borderColor: 'black',
    borderWidth: 2,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popupContainer: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F515D',
    marginBottom: 10,
  },
  titleNewnote: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4F515D',
    marginBottom: 10,
  },
  filterTag: {
    backgroundColor: '#E9EAEC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 3,
    marginLeft: 7,
    flexDirection: 'row'
  },
  gridIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    marginTop: 2,
    // marginRight: 2
  },
  filterTagText: {
    color: '#85878C',
    fontSize: 14,
    marginLeft: 2,
    fontWeight: 'bold'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 999,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  categoryPicker: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButtonsNew: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  modalButtonNew: {
    flex: 0.5,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  submitButtonpop: {
    backgroundColor: '#BD1225',
  },
  closeButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },

  imageWrapper: {
    height: 400,
  },

  image: {
    height: 400,
  },

  mainImage: {
    width: '100%',
    height: 400,
  },

  thumbnailContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    padding: 5,
  },

  thumbnail: {
    width: '24%',
    aspectRatio: 1,
    marginHorizontal: 2,
  },

  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },

  lastThumbnail: {
    position: 'relative',
  },

  countOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },

  countText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSheetContent: {
    padding: 20,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bottomSheetText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#4F515D',
  },
  modalBody: {
    marginBottom: 15,
  },
  subTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  checkboxContainerNew: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    // marginBottom: 8,
  },
  checkboxContainerNew1: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    // marginBottom: 8,
  },
  checkboxContainerNew2: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 13,
    marginTop: 5
  },
  checkboxText: {
    fontSize: 16,
    color: "#333",
    marginTop: 5
  },
  // label: {
  //   fontSize: 16,
  //   fontWeight: "bold",
  //   color: "#535665",
  //   marginTop: 15,
  // },
  textInputnew: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "#F5F5F5",
    marginTop: 10
  },
  description: {
    fontSize: 15,
    color: "black",
    marginBottom: 10,
  },
  processTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "black",
    marginBottom: 5,
  },
  listContainer: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  listItem: {
    fontSize: 15,
    color: "#333",
    marginBottom: 15,
    lineHeight: 20,
  },
  buttonContainerpopup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  footerNew: {
    flexDirection: "row",
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  payButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  payText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxItem: {
    flex: 1,
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: "#e0e0e0",
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // position: 'absolute',
    top: '5%',
    transform: [{ translateY: -20 }],
    // left: 10,
    // right: 10,
    // zIndex: 10,
    pointerEvents: 'box-none',
  },
  messageButton: {
    flexDirection: 'row', // Align icon and text horizontally
    alignItems: 'center', // Center items vertically
    justifyContent: 'center', // Center items horizontally
    backgroundColor: '#007AFF', // Blue background
    paddingVertical: 10, // Vertical padding
    paddingHorizontal: 10, // Horizontal padding
    borderRadius: 8, // Rounded corners
    shadowColor: '#000', // Shadow for elevation
    shadowOffset: { width: 0, height: 2 }, // Shadow position
    shadowOpacity: 0.25, // Shadow transparency
    shadowRadius: 4, // Shadow spread
    elevation: 5, // Shadow effect for Android
    marginBottom: 10,
    marginTop: 10
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
  disabledButton: {
    opacity: 0.5,
  },
  buttonContainerExpress: {
    flexDirection: 'row',
    width: '100%',
    marginTop: -10,
    marginBottom: 20
  },
  popupContainernew: {
    backgroundColor: 'white',
    width: '90%',  // Adjust width to match design
    borderRadius: 8,
    padding: 15,
    maxHeight: '80%',
  },
  headernew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    paddingHorizontal: 10, // Add horizontal padding for more space
    width: '100%',
  },
  titlenew: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1, // Allow the title to take available space
    marginRight: 10,
  },
  scrollViewContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // padding: 16,
  },
  iconsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    backgroundColor: '#4F515D',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#fff',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  menuChanges: {
    width: '100%', backgroundColor: '#4F515D',
    justifyContent: 'center', alignItems: 'center'
  },
  editOptions: {
    width: '90%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 2,
    marginTop: 10
  },
  titleNew: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#282C3F',
    // fontFamily : 'Inter'
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',  // Change color as needed
    width: '100%',  // Adjust width as needed
  },
  labelNew: {
    color: '#282C3F',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 7
  },
  valueNew: {
    color: '#282C3F',
    fontSize: 15,
    fontWeight: '500',
  },
  iconStyle: {
    marginHorizontal: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  stickyIconsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  // iconsRowContainer: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   width: '100%',
  //   paddingHorizontal: 16,
  //   backgroundColor: '#4F515D',
  //   paddingVertical: 10,
  //   borderBottomWidth: 0.5,
  //   borderColor: '#fff',
  //   shadowColor: '#000',
  //   shadowOffset: {
  //     width: 0,
  //     height: 2,
  //   },
  //   shadowOpacity: 0.25,
  //   shadowRadius: 3.84,
  //   elevation: 5,
  // },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  lockOverlayText: {
    color: '#fff',
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  thumbnailImageBlurred: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    opacity: 0.3, // Make thumbnails faint if locked
  },
  lockOverlaySmall: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  mainImageWrapper: {
    position: 'relative',
    height: 400,
    width: '100%',
  },
  lockOverlayLarge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockOverlayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 40,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9EAEC',
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  cardInputTransparent: {
    flex: 1,
    height: 45,
    fontSize: 15,
    color: '#282C3F',
  },
  eyeIconContainer: {
    padding: 5,
  },
  passwordCard: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 8,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#282C3F',
  },
  cardInput: {
    backgroundColor: '#E9EAEC',
    borderRadius: 5,
    paddingHorizontal: 15,
    height: 45,
    fontSize: 15,
    marginBottom: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelTextBtn: {
    color: '#FF6666',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 25,
  },
  submitBtnRed: {
    backgroundColor: '#FF6666',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 6,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  rasiImage: {
    width: '100%',
    height: 300,
    marginTop: 10,
    backgroundColor: '#f9f9f9'
  },
  rasiContainer: {
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  horoscopeSection: {
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    width: '100%',
  },
  chartBorder: {
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: '#FFFACD', // Cream/LemonChiffon color match
    width: '100%',
    maxWidth: 350,
    aspectRatio: 1,
    marginVertical: 10,
  },
  chartRow: {
    flexDirection: 'row',
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  chartCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 1, // Reduced padding to maximize space
    overflow: 'hidden', // Prevents content from spilling out
  },
  sideColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: '#000',
  },
  centerBox: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
    backgroundColor: '#FFFACD',
  },
  // --- TEXT STYLES TO MATCH IMAGE ---
  chartText: {
    fontSize: 10, // Reduced font size to fit 6 items (was 13)
    fontWeight: 'bold',
    color: '#008000',
    textAlign: 'center',
    lineHeight: 12, // Tighter line height for stacking
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  centerLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008000', // Green
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  centerDomain: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#008000', // Green
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#282C3F",
    marginBottom: 6,
    alignSelf: "flex-start",
  },

});
