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
  TouchableWithoutFeedback,
  Linking,
  ActivityIndicator,
  Share,
  Pressable,
  Animated
} from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import ImageViewer from 'react-native-image-zoom-viewer';
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from 'expo-file-system';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileDetailsView } from "../../Components/HomeTab/ProfileDetails/ProfileDetailsView";

import Toast from "react-native-toast-message";
import axios from "axios";
import config from "../../API/Apiurl";

import {
  fetchProfileData,
  handleExpressInterest,
  markProfileWishlist,
  getWishlistProfiles,
  getPhotoByPassword,
  getPersonalNotes,
  savePersonalNotes,
  fetchProfileStatus,
  updateProfileInterest,
  createOrRetrieveChat,
  sendPhotoRequest,
  sendVysassistRequest,
  callRequestDetails,
  logProfileVisit,
  getProfileListMatch,
  downloadPdfPoruthamNew,
  Printhoroscopepdf,
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
import { openCachedPdf } from "../../Screens/AfterLogin/PdfViewerModal";

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_IMAGE_HEIGHT = 400;
const COMPACT_HEADER_HEIGHT = 64;
const COLLAPSE_DISTANCE = HERO_IMAGE_HEIGHT - COMPACT_HEADER_HEIGHT;

// Dynamic Matching Score Bar Component
const HorizontalMatchingScore = ({ score, onPress }) => {
  const scoreNum = parseInt(score, 10) || 0;

  // Color logic based on match score
  let barColor = "#F44336"; // Default Low Red
  if (scoreNum >= 80) {
    barColor = "#008000"; // Deep Green
  } else if (scoreNum >= 60) {
    barColor = "#4CAF50"; // Standard Green
  } else if (scoreNum >= 40) {
    barColor = "#FF9800"; // Orange
  }

  return (
    <TouchableOpacity style={styles.scoreBarWrapper} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.scoreHeaderRow}>
        <Text style={styles.scoreLabel}>Matching Score</Text>
        <Text style={styles.scorePercentText}>{scoreNum}%</Text>
      </View>
      <View style={styles.scoreTrack}>
        <View style={[styles.scoreFill, { width: `${Math.min(scoreNum, 100)}%`, backgroundColor: barColor }]} />
      </View>
    </TouchableOpacity>
  );
};

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

        <ShimmerPlaceholder style={{ width: width, height: 400 }} />

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
          <View style={styles.nameIconFlex}>
            <View style={styles.nameVerifyFlex}>
              <ShimmerPlaceholder style={{ width: 160, height: 26, borderRadius: 4, marginRight: 8 }} />
              <ShimmerPlaceholder style={{ width: 20, height: 20, borderRadius: 10 }} />
            </View>

            <View style={styles.iconFlex}>
              <ShimmerPlaceholder style={{ width: 22, height: 22, borderRadius: 4, marginHorizontal: 4 }} />
              <ShimmerPlaceholder style={{ width: 22, height: 22, borderRadius: 4, marginHorizontal: 4 }} />
              <ShimmerPlaceholder style={{ width: 22, height: 22, borderRadius: 4, marginLeft: 4 }} />
            </View>
          </View>

          <ShimmerPlaceholder style={{ width: 90, height: 16, borderRadius: 4, marginBottom: 12 }} />

          <View style={styles.detailsMeterFlex}>
            <View style={styles.bulletTextContainer}>
              <ShimmerPlaceholder style={{ width: '90%', height: 16, borderRadius: 4, marginBottom: 8 }} />
              <ShimmerPlaceholder style={{ width: '75%', height: 16, borderRadius: 4 }} />
            </View>
            <ShimmerPlaceholder style={{ width: 100, height: 100, borderRadius: 50 }} />

          </View>

          <View style={styles.tagsRow}>
            <ShimmerPlaceholder style={{ width: 130, height: 28, borderRadius: 14, marginRight: 12 }} />
            <ShimmerPlaceholder style={{ width: 110, height: 28, borderRadius: 14 }} />
          </View>
          <View style={styles.tagsRow}>
            <ShimmerPlaceholder style={{ width: 150, height: 28, borderRadius: 14, marginRight: 12 }} />
            <ShimmerPlaceholder style={{ width: 90, height: 28, borderRadius: 14 }} />
          </View>

          <View style={styles.buttonContainerExpress}>
            <ShimmerPlaceholder style={{ width: 150, height: 42, borderRadius: 6 }} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export const ProfileDetails = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { viewedProfileId, interestParam, allProfileIds } = route.params;

  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [profileIds, setProfileIds] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [rasiGrid, setRasiGrid] = useState([]);
  const [amsaGrid, setAmsaGrid] = useState([]);
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
    const isFemaleProfile = basic_details?.profile_id?.startsWith("VF");
    const defaultImgUrl = isFemaleProfile
      ? "https://vysyamat.blob.core.windows.net/vysyamala/default_bride.png"
      : "https://vysyamat.blob.core.windows.net/vysyamala/default_groom.png";

    if (!imageUrl || imageUrl.trim() === "") {
      return defaultImgUrl;
    }
    return imageUrl;
  };

  useEffect(() => {
    if (allProfileIds) {
      const ids = Object.values(allProfileIds);
      setProfileIds(ids);
      const index = ids.findIndex(id => id === viewedProfileId);
      setCurrentProfileIndex(index !== -1 ? index : 0);
    }
  }, [allProfileIds, viewedProfileId]);

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

  const width = Dimensions.get('window').width;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(null);
  const [isZoomVisible, setZoomVisible] = useState(false);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [password, setPassword] = useState('');
  const [fetchedUserImages, setFetchedUserImages] = useState(null);
  const [isProfileUnlocked, setIsProfileUnlocked] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesData, setNotesData] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const [photoProtection, setPhotoProtection] = useState(null);
  const [photoRequest, setPhotoRequest] = useState(null);
  const [expressInt, setExpressInt] = useState(false);
  const [status, setStatus] = useState();
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
  const custom_message = AsyncStorage.getItem('custom_message');
  const [mobileNumber, setMobileNumber] = useState('');
  const [VysassistEnable, setVysassistEnable] = useState();
  const [vysassits, setVysassits] = useState();
  const [data, setData] = useState([]);
  const [options, setOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const bottomSheetRef = useRef();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');
  const [planId, setPlanId] = useState(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const restrictedPlanIds = ["1", "2", "3", "14", "15", "17"];
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [remainCount, setRemainCount] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showVysassistErrorModal, setShowVysassistErrorModal] = useState(false);
  const [vysassistErrorMsg, setVysassistErrorMsg] = useState('');
  const [selectedPdfLanguage, setSelectedPdfLanguage] = useState("english");
  const [showLanguagePopup, setShowLanguagePopup] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  const sectionOffsetsRef = useRef({
    detailsTop: 0,
    personal: 0,
    education: 0,
    family: 0,
    horoscope: 0,
    contact: 0,
  });

  const scrollToSection = (key) => {
    const offsets = sectionOffsetsRef.current;
    const y = Math.max(0, (offsets.detailsTop || 0) + (offsets[key] || 0) - 10);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y, animated: true });
    }
  };

  const handleBlockProfile = async () => {
    try {
      setBlockLoading(true);

      const myProfileId =
        await AsyncStorage.getItem("loginuser_profileId") ||
        await AsyncStorage.getItem("profile_id_new");

      const response = await axios.post(
        `${config.apiUrl}/auth/block_profile/`,
        {
          from_profile: myProfileId,
          to_profile: viewedProfileId,
        }
      );

      if (
        response.data.Status === 1 ||
        response.data.message === "Profile already blocked"
      ) {
        setBlockModalVisible(false);
        bottomSheetRef.current.close();

        Toast.show({
          type: "success",
          text1:
            response.data.message === "Profile already blocked"
              ? "Already Blocked"
              : "Profile Blocked",
          text2:
            response.data.message || "Profile blocked successfully.",
          position: "bottom",
        });

        setTimeout(() => {
          navigation.goBack();
        }, 1500);

      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message || "Failed to block profile.",
          position: "bottom",
        });
      }
    } catch (error) {
      console.log("Block Profile Error", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong.",
        position: "bottom",
      });
    } finally {
      setBlockLoading(false);
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
        setStatus(status);
      }
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
      const response = await sendPhotoRequest(viewedProfileId);
      if (response.Status === 1) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Photo Request send successfully!',
          position: "bottom",
        });
      } else if (response.Status === 0) {
        setResponseMsg(response.message);
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
    } catch (error) {
      console.error("Error in photo request:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadPersonalNotes = async () => {
      try {
        const data = await getPersonalNotes();
        if (data.length > 0) {
          const profileNotes = data.find(profile => profile.notes_profileid === profileData?.basic_details?.profile_id);
          if (profileNotes && profileNotes.notes_details) {
            setNotes(profileNotes.notes_details);
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
    try {
      const response = await savePersonalNotes(profileData?.basic_details?.profile_id, notes);

      if (response && response.Status === 1) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Notes saved successfully!',
          position: "top",
        });
      } else if (response.Status === 0) {
        setResponseMsg(response.message);
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

    toggleModal();
  };

  const extractGridData = (htmlString) => {
    if (!htmlString) return [];

    const rows = [];
    const rowMatches = htmlString.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];

    rowMatches.forEach(rowHtml => {
      const cells = [];
      const cellMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];

      cellMatches.forEach(cellHtml => {
        let text = cellHtml.replace(/<br\s*\/?>/gi, '\n');
        text = text.replace(/<\/p>/gi, '\n');
        text = text.replace(/<[^>]+>/g, '').trim();
        text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
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
        if (data && data.encrypted_profile_id) {
          setProfileData(data);
          await AsyncStorage.setItem('encryptedId', data.encrypted_profile_id);
          await AsyncStorage.setItem('myId', data.My_profile_id);
        }
        await logProfileVisit(viewedProfileId);
        const response = await logProfileVisit(viewedProfileId);
        console.log("Profile Details fully 2 ==>", data, response)

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

          setTimeout(() => {
            navigation.goBack();
          }, 1500);

          return;
        }

        if (typeof data.user_images === 'string') {
          data.user_images = {
            "0": data.user_images
          };
        }

        setProfileData(data);
        if (data.hasOwnProperty('photo_protection')) {
          setPhotoProtection(data.photo_protection);
        } else {
          setPhotoProtection(0);
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
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadProfileData();
  }, [viewedProfileId]);

  useEffect(() => {
    const loadWishlistProfiles = async () => {
      try {
        const response = await getWishlistProfiles();
        if (!response || !Array.isArray(response)) {
          console.warn("Invalid wishlist response:", response);
          return;
        } const profileIds = response.map((p) => p.wishlist_profileid);
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

  const handleSlidePress = (index) => {
    setSelectedSlideIndex(index);
    setZoomVisible(true);
  };

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
      console.error(error);
    }
  };

  const handleExpressInterestPress = async () => {
    if (
      (!interestMessage || interestMessage.trim() === "") &&
      (!selectedCategory || selectedCategory.trim() === "")
    ) {
      setExpressInterestError("Please enter a message or select a category before submitting.");
      return;
    } else {
      try {
        const data = await handleExpressInterest(viewedProfileId, expressInt, interestMessage, selectedCategory);
        if (data.Status === 0) {
          setShowInterestModal(false);
          setIsPickerVisible(true);
          setInterestMessage('');
          setSelectedCategory('');
          setExpressInterestError('');
          setExpressInt(true);
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
    try {
      const data = await handleExpressInterest(viewedProfileId, expressInt, interestMessage, selectedCategory);
      if (data.Status === 0) {
        setExpressInt(false);
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

  if (isInitialLoading || !profileData) {
    return <ProfileDetailsShimmer />;
  }

  const { basic_details, user_images } = profileData;

  const images = (fetchedUserImages ? Object.values(fetchedUserImages) : Object.values(user_images))
    .map(url => ({
      url: getSafeImage(url),
    }));

  const handlePasswordSubmit = async () => {
    try {
      const photoData = await getPhotoByPassword(profileData?.basic_details?.profile_id, password);
      if (photoData) {
        setFetchedUserImages(photoData.user_images);
        setIsProfileUnlocked(true);
        await AsyncStorage.setItem(`profileUnlocked_${profileData?.basic_details?.profile_id}`, 'true');
        await AsyncStorage.setItem(`fetchedUserImages_${profileData?.basic_details?.profile_id}`, JSON.stringify(photoData.user_images));
        Toast.show({
          type: "success",
          text1: "Unlocked",
          text2: "Profile photos unlocked successfully.",
          position: "bottom",
        });
      } else {
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

  const handleDownloadPdf = async () => {
    bottomSheetRef.current.close();
    setShowLanguagePopup(false);
    setLoading(true);

    try {
      const encryptedId = profileData?.encrypted_profile_id;
      const myId = profileData?.My_profile_id;
      const langParam = selectedPdfLanguage;
      const result = await Printhoroscopepdf(encryptedId, myId, langParam);

      if (result && typeof result === 'object' && result.status === 'failure') {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.message || 'Failed to fetch horoscope',
        });
        return;
      }

      if (typeof result === 'string' && result.length > 0) {
        await openCachedPdf(result);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile Opened successfully!',
        });
      } else {
        throw new Error('Unexpected result');
      }
    } catch (error) {
      console.error('Download error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load horoscope. Please try again.',
      });
    } finally {
      setLoading(false);
      setSelectedPdfLanguage('english');
    }
  };

  const handleDownloadMatchingReport = async () => {
    bottomSheetRef.current.close();
    setLoading(true);

    try {
      const encryptedId = profileData?.encrypted_profile_id;
      const myId = profileData?.My_profile_id;
      const result = await downloadPdfPoruthamNew(encryptedId, myId);

      if (typeof result === 'object' && result !== null && result.status === 'failure') {
        setResponseMsg(result.message || 'No access to see the compatibility report');
        setShowUpgradeModal(true);
        return;
      }

      if (typeof result === 'string' && result.length > 0) {
        await openCachedPdf(result);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Matching report loaded successfully!',
        });
      } else {
        throw new Error('Unexpected result');
      }
    } catch (error) {
      console.error('Error loading matching report:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load matching report.',
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
    setShowVysassist(false);
  };

  const handleCheckboxChange = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((item) => item !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };
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
    closePopup();
  };

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
    try {
      const message = selectedOptions.join(", ");
      const response = await sendVysassistRequest(viewedProfileId, message);
      console.log("response sendVysassistRequest==>", JSON.stringify(response));
      if (response.Status === 1) {
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
        setSelectedOptions([]);
        setRemainCount(response.vys_assist_count);
        setIsSuccess(true);

        // Reload profile data
        try {
          const data = await fetchProfileData(viewedProfileId);
          console.log("Fetched profile data: 1 ", data);
          const response = await logProfileVisit(viewedProfileId);
          console.log("Profile Details fully 2 ==>", data, response)

          setProfileData(data);
          setVysassistEnable(data.basic_details.vysy_assist_enable);

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
      } else if (response.Status === 0) {
        setVysassistErrorMsg(response.message || 'No access to Vysassist request');
        setShowVysassistErrorModal(true);
        setShowVysassist(false);
        setSelectedOptions([]);
        setExpressInterestError("");

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
    }
    catch (error) {
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
      setLoading(true);
      const storedLoginId = await AsyncStorage.getItem("loginuser_profileId");
      const storedNewId = await AsyncStorage.getItem("profile_id_new");
      const myProfileId = storedLoginId || storedNewId;

      if (!myProfileId) {
        Alert.alert("Error", "User session expired. Please login again.");
        setLoading(false);
        return;
      }

      const formdata = new FormData();
      formdata.append("profile_id", myProfileId);
      formdata.append("profile_to", viewedProfileId);

      const response = await callRequestDetails(formdata);

      if (response.Status === 1 && response.toprofile_mobile_no) {
        const phoneNumber = response.toprofile_mobile_no;
        Linking.openURL(`tel:${phoneNumber}`);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Call Request Failed',
          text2: response.message || 'Mobile number not available',
          position: "bottom",
        });

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

  const renderThumbnails = () => {
    const imagesArray = fetchedUserImages ? Object.values(fetchedUserImages) : Object.values(user_images);
    const isBlurNeeded = !isProfileUnlocked && photoProtection === 1;
    const remainingCount = imagesArray.length - 4;

    return (
      <View style={styles.thumbnailContainer}>
        {imagesArray.slice(1, 4).map((image, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => !isBlurNeeded && handleSlidePress(index + 1)}
            style={styles.thumbnail}
            disabled={isBlurNeeded}
          >
            <TopAlignedImage
              uri={getSafeImage(Array.isArray(image) ? image[0] : image)}
              width={100}
              height={100}
              style={{
                borderRadius: 10,
                ...(isBlurNeeded && { opacity: 0.8 })
              }}
            />

            {isBlurNeeded && (
              <View style={styles.lockOverlaySmall}>
                <Ionicons name="lock-closed" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {remainingCount > 0 && (
          <TouchableOpacity
            style={[styles.thumbnail, styles.lastThumbnail]}
            onPress={() => !isBlurNeeded && handleSlidePress(4)}
            disabled={isBlurNeeded}
          >
            <TopAlignedImage
              uri={getSafeImage(imagesArray[4])}
              width={100}
              height={100}
              style={{
                borderRadius: 10,
                ...(isBlurNeeded && { opacity: 0.8 })
              }}
            />

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
      { icon: 'document-text', text: 'Personal Notes', onPress: toggleModal, type: 'Ionicons' },
      ...(!isPlan16
        ? [{ icon: "account-voice", text: "Vys Assist", onPress: openPopup, type: "MaterialCommunityIcons" }]
        : []),
      {
        icon: 'print-outline', text: 'Download Profile',
        onPress: () => {
          bottomSheetRef.current.close();
          setShowLanguagePopup(true);
        },
        type: 'Ionicons'
      },
      {
        icon: 'star', text: 'Show Matching Report',
        onPress: handleDownloadMatchingReport,
        type: 'MaterialIcons'
      },
      {
        icon: 'block', text: 'Block Profile', onPress: () => {
          bottomSheetRef.current.close();
          setBlockModalVisible(true);
        }, type: 'MaterialIcons'
      },
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

  const renderSuccessView = () => (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <Ionicons name="checkmark-circle" size={80} color="#2ecc71" />
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#4F515D', marginTop: 10 }}>
        Vysassist sent successfully
      </Text>
      <Text style={{ fontSize: 16, color: '#4F515D', marginVertical: 10 }}>
        Remaining VysAssist Count:
        <Text style={{ color: 'red', fontWeight: 'bold' }}> {remainCount}</Text>
      </Text>
      <TouchableOpacity
        style={[styles.submitButtonpop, { width: '40%', marginTop: 20, borderRadius: 8, padding: 10 }]}
        onPress={async () => {
          setIsSuccess(false);
          setShowVysassist(false);
          setSelectedOptions([]);
          const refreshed = await fetchProfileData(viewedProfileId);
          setProfileData(refreshed);
          setVysassistEnable(refreshed.basic_details.vysy_assist_enable);
          setVysassits(refreshed.basic_details.vys_assits);
        }}
      >
        <Text style={styles.buttonText}>OK</Text>
      </TouchableOpacity>
    </View>
  );

  const primaryImageUri = getSafeImage((fetchedUserImages ? Object.values(fetchedUserImages) : Object.values(user_images))[0]);
  const isLocked = !isProfileUnlocked && photoProtection === 1;

  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE],
    outputRange: [0, -COLLAPSE_DISTANCE],
    extrapolate: 'clamp',
  });
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE * 0.6, COLLAPSE_DISTANCE],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });
  const compactBarOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_DISTANCE * 0.5, COLLAPSE_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const compactBarTranslateY = scrollY.interpolate({
    inputRange: [COLLAPSE_DISTANCE * 0.5, COLLAPSE_DISTANCE],
    outputRange: [-16, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.mainContainer}>
      <Modal
        transparent={true}
        visible={blockModalVisible}
        animationType="fade"
        onRequestClose={() => setBlockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordCard}>
            <MaterialIcons
              name="block"
              size={55}
              color="#ED1E24"
              style={{ alignSelf: 'center', marginBottom: 10 }}
            />

            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
              Block Profile?
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: "#555",
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 20,
              }}
            >
              Are you sure you want to block this profile?
              {"\n"}You will no longer see or interact with this profile.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justify: 'space-between'
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#E5E5E5",
                  padding: 14,
                  borderRadius: 10,
                  marginRight: 10,
                  alignItems: "center",
                }}
                onPress={() => setBlockModalVisible(false)}
              >
                <Text style={{ color: "#333", fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#ED1E24",
                  padding: 14,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={handleBlockProfile}
                disabled={blockLoading}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {blockLoading ? "Blocking..." : "Block"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== Fixed top bar ===== */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#282C3F" />
        </TouchableOpacity>
        <Text style={styles.headerText} numberOfLines={1}>Profile Details</Text>
      </View>

      {/* ===== Compact sticky profile bar ===== */}
      <Animated.View
        pointerEvents={"box-none"}
        style={[
          styles.compactProfileBar,
          {
            opacity: compactBarOpacity,
            transform: [{ translateY: compactBarTranslateY }],
          },
        ]}
      >
        <Image
          source={{ uri: primaryImageUri }}
          style={[styles.compactAvatar, isLocked && { opacity: 0.5 }]}
          blurRadius={isLocked ? 8 : 0}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.compactName} numberOfLines={1}>{basic_details.profile_name}</Text>
            <Ionicons name="shield-checkmark" size={14} color="#53C840" style={{ marginLeft: 6 }} />
          </View>
          <Text style={styles.compactSub} numberOfLines={1}>
            {basic_details.profile_id} • {basic_details.age} yrs
          </Text>
        </View>
        <TouchableOpacity onPress={handlePhoneCall} style={{ marginRight: 8 }}>
          <MaterialIcons name="phone" size={22} color="#4F515D" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleSavePress(profileData?.basic_details?.profile_id)}>
          <MaterialIcons
            name={bookmarkedProfiles.has(profileData?.basic_details?.profile_id) ? 'bookmark' : 'bookmark-border'}
            size={20}
            color="red"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => bottomSheetRef.current.open()}>
          <MaterialIcons name="more-vert" size={22} color="#282C3F" />
        </TouchableOpacity>
      </Animated.View>

      {/* ===== Sticky prev/next navigation arrows ===== */}
      <View style={styles.navigationContainer} pointerEvents="box-none">
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

      {/* Main Content */}
      <View style={styles.container}>
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: 0 }}
        >

          {/* ===== Collapsing hero image block ===== */}
          <Animated.View
            style={[
              styles.heroWrapper,
              {
                transform: [{ translateY: heroTranslateY }],
              },
            ]}
          >
            <Animated.View style={{ opacity: heroOpacity }}>
              <View style={styles.contentWrapper}>
                {isLocked ? (
                  <TouchableOpacity
                    onPress={() => {
                      setPassword('');
                      setIsPasswordModalVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: primaryImageUri }}
                      style={styles.mainImage}
                      resizeMode="cover"
                      blurRadius={20}
                    />

                    <View style={styles.lockOverlayLarge}>
                      <MaterialCommunityIcons name="lock" size={60} color="#FF6666" />
                      <Text style={styles.lockOverlayText}>
                        Click here to request password to view profile photo
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                        setCurrentImageIndex(idx);
                      }}
                    >
                      {images.map((img, idx) => (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.9}
                          onPress={() => handleSlidePress(idx)}
                        >
                          <Image
                            source={{ uri: img.url }}
                            style={[styles.mainImage, { width: width }]}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {images.length > 1 && (
                      <View style={styles.dotsOverlayContainer} pointerEvents="none">
                        {images.map((_, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.dotIndicator,
                              currentImageIndex === idx && styles.dotIndicatorActive
                            ]}
                          />
                        ))}
                      </View>
                    )}

                    {images.length > 1 && (
                      <View style={styles.imageCounterBadge} pointerEvents="none">
                        <Text style={styles.imageCounterText}>
                          {currentImageIndex + 1}/{images.length}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                {renderThumbnails()}
              </View>
            </Animated.View>
          </Animated.View>

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
                      setIsPasswordModalVisible(false);
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

            {/* Profile Content Details & Progress Bar Row */}
            <View style={styles.detailsMeterFlex}>
              <View style={styles.bulletTextContainer}>
                <Text style={styles.bulletDetailsText}>
                  {[
                    basic_details.age ? `${basic_details.age} yrs` : null,
                    basic_details.height?.height_desc,
                    (basic_details.weight && basic_details.weight !== 0) ? `${basic_details.weight} kg` : null,
                    basic_details.star,
                    basic_details.profession,
                    basic_details.education,
                    basic_details.degeree,
                  ].filter(Boolean).join('  |  ')}
                </Text>
              </View>
            </View>

            {/* Matching Score Horizontal Progress Bar */}
            {basic_details?.matching_score !== undefined &&
              basic_details.matching_score > 0 &&
              basic_details.matching_score !== 100 && (
                <HorizontalMatchingScore
                  score={basic_details.matching_score}
                  onPress={handleDownloadMatchingReport}
                />
              )}

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

            <Modal
              animationType="slide"
              transparent={true}
              visible={showInterestModal}
              onRequestClose={() => {
                setShowInterestModal(false);
                setInterestMessage('');
                setSelectedCategory('');
                setExpressInterestError('');
              }}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Enter your Interest Message</Text>

                  {!selectedCategory && custom_message !== "0" && restrictedPlanIds.includes(planId) && (
                    <TextInput
                      style={styles.messageInput}
                      multiline
                      numberOfLines={4}
                      placeholder="Enter your message"
                      value={interestMessage}
                      onChangeText={setInterestMessage}
                    />
                  )}

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
                      onPress={handleExpressInterestPress}
                    >
                      <Text style={styles.buttonText}>Submit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.closeButton]}
                      onPress={() => {
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
          </View>

          {/* ===== Details Sections ===== */}
          <View
            style={styles.scrollViewContentContainer}
            onLayout={(e) => { sectionOffsetsRef.current.detailsTop = e.nativeEvent.layout.y; }}
          >
            {/* Personal Details */}
            <View
              style={styles.menuChanges}
              onLayout={(e) => { sectionOffsetsRef.current.personal = e.nativeEvent.layout.y; }}
            >
              <View style={styles.editOptions}>
                <View style={styles.sectionTitleRow}>
                  <FontAwesome5
                    name="user-circle"
                    size={22}
                    color="#BD1225"   // Static theme color – matches other section icons
                    style={{ marginRight: 8, paddingBottom: 10 }}
                  />

                  <Text style={styles.titleNew}>Personal Details</Text>
                </View>
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
                  <Text style={styles.labelNew}>Height : <Text style={styles.valueNew}>{profileData.personal_details.height?.height_desc}</Text></Text>
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
              </View>
            </View>

            {/* Education Details */}
            <View
              style={styles.menuChanges}
              onLayout={(e) => { sectionOffsetsRef.current.education = e.nativeEvent.layout.y; }}
            >
              <View style={styles.editOptions}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons  
                    name="work"
                    size={22}
                    color="#BD1225"   // Static theme color – matches other section icons
                    style={{ marginRight: 8, paddingBottom: 10 }}
                  />

                  <Text style={styles.titleNew}>Education & Profession Details</Text>
                </View>
                <View style={styles.line} />
                {profileData.education_details?.education_level && profileData.education_details.education_level !== "" && profileData.education_details.education_level !== null && (
                  <Text style={styles.labelNew}>Education Level : <Text style={styles.valueNew}>{profileData.education_details.education_level}</Text></Text>
                )}
                {profileData.education_details?.degeree && profileData.education_details.degeree !== "" && profileData.education_details.degeree !== null && (
                  <Text style={styles.labelNew}>Degree : <Text style={styles.valueNew}>{profileData.education_details.degeree}</Text></Text>
                )}
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

            {/* Family Details */}
            <View
              style={styles.menuChanges}
              onLayout={(e) => { sectionOffsetsRef.current.family = e.nativeEvent.layout.y; }}
            >
              <View style={styles.editOptions}>
                <View style={styles.sectionTitleRow}>
                  <FontAwesome5
                    name="users"
                    size={22}
                    color="#BD1225"   // Static theme color – matches other section icons
                    style={{ marginRight: 8, paddingBottom: 10 }}
                  />
                  <Text style={styles.titleNew}>Family Details</Text>
                </View>
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

            {/* Horoscope Details */}
            <View
              style={styles.menuChanges}
              onLayout={(e) => { sectionOffsetsRef.current.horoscope = e.nativeEvent.layout.y; }}
            >
              <View style={styles.editOptions}>
                <View style={styles.sectionTitleRow}>
                  <MaterialCommunityIcons
                    name="star"
                    size={22}
                    color="#BD1225"   // Static theme color – matches other section icons
                    style={{ marginRight: 8, paddingBottom: 10 }}
                  />
                  <Text style={styles.titleNew}>Horoscope Details</Text>
                </View>
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

                {/* RASI CHART - SOUTH INDIAN LAYOUT */}
                {rasiGrid.length >= 4 && (
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
                {amsaGrid.length >= 4 && (
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
              </View>
            </View>

            {/* Contact Details */}
            <View
              style={styles.menuChanges}
              onLayout={(e) => { sectionOffsetsRef.current.contact = e.nativeEvent.layout.y; }}
            >
              <View style={styles.editOptions}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons
                    name="phone"
                    size={22}
                    color="#BD1225"   
                    style={{ marginRight: 8, paddingBottom: 10 }}
                  />
                  <Text style={styles.titleNew}>Contact Details</Text>
                </View>
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
                  {isSuccess ? (
                    renderSuccessView()
                  ) : (
                    <>

                      <View style={styles.header}>
                        <Text style={styles.title}>Vysassist Notes </Text>
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
                    </>
                  )}
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
                  You have not activated VysAssist for your plan. You can opt for 5
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
                      navigation.navigate("PayNow", { autoCheckId: "1" });
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

      {/* Vysassist Error Modal */}
      <Modal
        visible={showVysassistErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVysassistErrorModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 24,
            width: '80%',
            alignItems: 'center',
            elevation: 10,
          }}>
            {/* ✅ Close X button */}
            <TouchableOpacity
              onPress={() => setShowVysassistErrorModal(false)}
              style={{ position: 'absolute', top: 12, right: 12 }}
            >
              <MaterialIcons name="warning" size={32} color="white" />
            </TouchableOpacity>

            {/* ✅ Info triangle icon like the image */}
            <View style={{
              backgroundColor: '#ED1E24',
              borderRadius: 50,
              padding: 14,
              marginBottom: 16,
              marginTop: 10,
            }}>
              <MaterialIcons name="info" size={32} color="white" />
            </View>

            {/* ✅ Message */}
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#282C3F',
              textAlign: 'center',
              marginBottom: 20,
            }}>
              {vysassistErrorMsg}
            </Text>

            {/* ✅ OK Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#ED1E24',
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 40,
              }}
              onPress={() => setShowVysassistErrorModal(false)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showLanguagePopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguagePopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordCard}>
            <TouchableOpacity
              style={{ alignSelf: 'flex-end' }}
              onPress={() => setShowLanguagePopup(false)}
            >
              <Ionicons name="close" size={24} color="#535665" />
            </TouchableOpacity>

            <Text style={[styles.title, { textAlign: 'center' }]}>Select Language</Text>

            <View style={{ marginVertical: 20 }}>
              <TouchableOpacity
                style={styles.checkboxContainerNew2}
                onPress={() => setSelectedPdfLanguage("english")}
              >
                <MaterialIcons
                  name={selectedPdfLanguage === "english" ? "radio-button-checked" : "radio-button-unchecked"}
                  size={24}
                  color="#BD1225"
                />
                <Text style={{ fontSize: 16, marginLeft: 10 }}>English</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxContainerNew2}
                onPress={() => setSelectedPdfLanguage("tamil")}
              >
                <MaterialIcons
                  name={selectedPdfLanguage === "tamil" ? "radio-button-checked" : "radio-button-unchecked"}
                  size={24}
                  color="#BD1225"
                />
                <Text style={{ fontSize: 16, marginLeft: 10 }}>Tamil</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButtonpop, { borderRadius: 8, padding: 12 }]}
              onPress={handleDownloadPdf}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    zIndex: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  compactProfileBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    height: COMPACT_HEADER_HEIGHT,
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  compactName: {
    color: '#282C3F',
    fontSize: 15,
    fontWeight: '800',
  },
  compactSub: {
    color: '#85878C',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  heroWrapper: {
    zIndex: 1,
  },
  headerText: {
    color: "#282C3F",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  navButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 5,
    minWidth: 50,
    alignItems: 'center',
  },
  contentWrapper: {
    position: 'relative',
  },
  image: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  name: {
    color: "#282C3F",
    fontSize: 22,
    fontWeight: "800",
    marginRight: 6,
  },
  nameIconFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 2,
  },
  nameVerifyFlex: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconFlex: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveIcon: {
    margin: 5
  },
  profileNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#85878C",
    marginBottom: 8,
  },
  detailsMeterFlex: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletDetailsText: {
    color: "#4F515D",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
  },
  /* Matching Score Bar Styles */
  scoreBarWrapper: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#282C3F',
  },
  scorePercentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#282C3F',
  },
  scoreTrack: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 5,
  },
  detailsMeterFlex1: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
    alignSelf: "flex-start",
    borderRadius: 6,
    overflow: "hidden",
  },
  loginContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  login: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  linearGradient: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
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
  filterTag: {
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  gridIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
    tintColor: "#535665",
  },
  filterTagText: {
    color: "#535665",
    fontSize: 12.5,
    marginLeft: 6,
    fontWeight: "600",
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
  modalButton: {
    flex: 1,
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
  mainImage: {
    width: '100%',
    height: HERO_IMAGE_HEIGHT,
  },
  dotsOverlayContainer: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginHorizontal: 3.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotIndicatorActive: {
    backgroundColor: '#ffffff',
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  imageCounterBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    padding: 5,
  },
  thumbnail: {
    width: '24%',
    aspectRatio: 1,
    marginHorizontal: 2,
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
  checkboxContainerNew: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
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
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  checkboxChecked: {
    backgroundColor: "#e0e0e0",
  },
  navigationContainer: {
    position: 'absolute',
    top: HERO_IMAGE_HEIGHT / 1 - 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    zIndex: 18,
    pointerEvents: 'box-none',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 10,
    marginTop: 10
  },
  icon: {
    color: '#fff',
    fontSize: 20,
    marginRight: 8,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContainerExpress: {
    width: "100%",
    marginTop: 10,
    marginBottom: 20,
  },
  scrollViewContentContainer: {
    width: '100%',
  },
  menuChanges: {
    width: '100%', backgroundColor: '#F4F4F4',
    justifyContent: 'center', alignItems: 'center'
  },
  editOptions: {
    width: '92%',
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  titleNew: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    color: '#BD1225',
    letterSpacing: 0.2,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
    width: '100%',
    marginBottom: 4,
  },
  labelNew: {
    color: '#8A8D95',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 0,
    marginTop: 9,
    lineHeight: 20,
  },
  valueNew: {
    color: '#282C3F',
    fontSize: 14,
    fontWeight: '700',
  },
  lockOverlayText: {
    color: '#fff',
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  lockOverlaySmall: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  lockOverlayLarge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  horoscopeSection: {
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    width: '100%',
  },
  chartBorder: {
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: '#FFFACD',
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
    padding: 1,
    overflow: 'hidden',
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
  chartText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#008000',
    textAlign: 'center',
    lineHeight: 12,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  centerLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008000',
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  centerDomain: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#008000',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#282C3F",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});