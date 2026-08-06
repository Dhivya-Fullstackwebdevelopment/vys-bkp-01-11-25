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
  Pressable,
  Animated,
  StatusBar
} from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import ImageViewer from 'react-native-image-zoom-viewer';
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import RBSheet from "react-native-raw-bottom-sheet";
import { SuggestedProfiles } from "../../Components/HomeTab/SuggestedProfiles";
import { FeaturedProfiles } from "../../Components/HomeTab/FeaturedProfiles";

import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import Timeline from "react-native-timeline-flatlist";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";
import { TopAlignedImage } from "../../Components/ReuseImageAlign/TopAlignedImage";
import { openCachedPdf } from "../../Screens/AfterLogin/PdfViewerModal";
import { Colors, rs } from "../../Reusable/Theme";
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const { width } = Dimensions.get('window');

// ─── TAB DEFINITIONS ──────────────────────────────────────────────────────────
const TABS = ["Personal", "Work & Education", "Family", "Horoscope", "Contact"];

function matchLabel(score) {
  const num = parseInt(score, 10) || 0;
  if (num >= 85) return "Excellent Match";
  if (num >= 70) return "Good Match";
  return "Average Match";
}

// ─── ACTIVE TAB INDICATOR (partial circle arc) ────────────────────────────────
const TabProgressCircle = ({ active }) => {
  const size = 6;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: active ? '#FFFFFF' : 'transparent',
        marginTop: 4,
      }}
    />
  );
};

const ProgressRing = ({ percentage, size = 64, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E0E0E0"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={Colors.primary}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        fill="transparent"
        strokeLinecap="round"
        transform={`rotate(-90, ${size / 2}, ${size / 2})`}
      />
      <Text style={[styles.ringScoreText, { position: 'absolute', top: size / 2 - 10, left: 0, right: 0, textAlign: 'center' }]}>
        {percentage}%
      </Text>
    </Svg>
  );
};

const ProfileDetailsShimmer = () => {
  return (
    <ScrollView style={{ backgroundColor: Colors.selectedBg }}>
      <View style={{ height: 420, backgroundColor: "#EAEAEA" }}>
        <ShimmerPlaceholder style={{ width: '100%', height: 420 }} />
      </View>
      <View style={{ padding: 16 }}>
        <ShimmerPlaceholder style={{ width: '100%', height: 120, borderRadius: 18, marginBottom: 12 }} />
        <ShimmerPlaceholder style={{ width: '100%', height: 90, borderRadius: 18, marginBottom: 12 }} />
        <ShimmerPlaceholder style={{ width: '100%', height: 260, borderRadius: 18 }} />
      </View>
    </ScrollView>
  );
};

export const ProfileDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { viewedProfileId, interestParam, allProfileIds } = route.params;

  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [profileIds, setProfileIds] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [rasiGrid, setRasiGrid] = useState([]);
  const [amsaGrid, setAmsaGrid] = useState([]);
  const [storedPlanId, setStoredPlanId] = useState(null);

  // ─── NEW: refs for scroll-to-section ────────────────────────────────────────
  const mainScrollRef = useRef(null);
  const sectionRefs = {
    Personal: useRef(null),
    "Work & Education": useRef(null),
    Family: useRef(null),
    Horoscope: useRef(null),
    Contact: useRef(null),
  };
  const sectionOffsets = useRef({});
  const tabBarRef = useRef(null);
  const tabBarOffset = useRef(0);
  const [stickyTabTop, setStickyTabTop] = useState(0);
  const [isTabSticky, setIsTabSticky] = useState(false);
  const [activeTab, setActiveTab] = useState("Personal");
  const scrollY = useRef(new Animated.Value(0)).current;
  const isManualScroll = useRef(false);
  const insets = useSafeAreaInsets();
  // ────────────────────────────────────────────────────────────────────────────

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

  const DEFAULT_IMAGE_URLS = [
    "https://vysyamat.blob.core.windows.net/vysyamala/default_bride.png",
    "https://vysyamat.blob.core.windows.net/vysyamala/default_groom.png",
  ];

  const isDefaultImageUrl = (url) => {
    if (!url) return true;
    return DEFAULT_IMAGE_URLS.some((defUrl) => url.trim() === defUrl);
  };

  useEffect(() => {
    setImageLoadError(false);
  }, [viewedProfileId]);



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

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(null);
  const [isZoomVisible, setZoomVisible] = useState(false);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [password, setPassword] = useState('');
  const [fetchedUserImages, setFetchedUserImages] = useState(null);
  const [isProfileUnlocked, setIsProfileUnlocked] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
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
  const [photoRequestSent, setPhotoRequestSent] = useState(false);
  const [photoRequestAlreadySent, setPhotoRequestAlreadySent] = useState(false); // NEW
  const [showAlreadyRequestedModal, setShowAlreadyRequestedModal] = useState(false); // NEW

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
          position: "top",
        });

        setTimeout(() => {
          navigation.goBack();
        }, 1500);

      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message || "Failed to block profile.",
          position: "top",
        });
      }
    } catch (error) {
      console.log("Block Profile Error", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong.",
        position: "top",
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
      setStatus(status);
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
        setPhotoRequestSent(true);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Photo Request send successfully!',
          position: "top",
        });
      } else if (response.Status === 0 && response.message === "Photo interests updated") {
        // NEW: this means request was already sent earlier — not a real error
        setPhotoRequestAlreadySent(true);
         setShowAlreadyRequestedModal(true);
        // Toast.show({
        //   type: 'info',
        //   text1: 'Already Requested',
        //   text2: 'You have already sent a photo request for this profile.',
        //   position: "top",
        // });
      } else if (response.Status === 0) {
        setResponseMsg(response.message);
        setShowUpgradeModal(true);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to send photo request!',
          position: "top",
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to send photo request!',
          position: "top",
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
     bottomSheetRef.current?.close();
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
            position: "top",
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
            setBookmarkedProfiles(prevSet => {
              const newSet = new Set(prevSet);
              newSet.add(profileId);
              return newSet;
            });
          } else {
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
          position: "top",
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
          return;
        }
        const profileIds = response.map((p) => p.wishlist_profileid);
        setBookmarkedProfiles(new Set(profileIds));
      } catch (error) {
        console.error("Error loading wishlist profiles:", error);
      }
    };

    loadWishlistProfiles();
  }, []);

  const handleSlidePress = (index) => {
    setSelectedSlideIndex(index);
    setZoomVisible(true);
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
            position: "top",
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'error',
            text2: 'Failed to update express interest!',
            position: "top",
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
          position: "top",
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'error',
          text2: 'Failed to update express interest!',
          position: "top",
        });
      }
    } catch (error) {
      console.error("Error updating express interest:", error);
    }
  };

  // ─── TAB CLICK → SCROLL TO SECTION ─────────────────────────────────────────
  const handleTabPress = (tab) => {
    setActiveTab(tab);
    isManualScroll.current = true;
    const offset = sectionOffsets.current[tab];
    if (offset !== undefined && mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ y: offset, animated: true });
      // release manual lock after animation
      setTimeout(() => { isManualScroll.current = false; }, 600);
    }
  };

  // ─── SCROLL HANDLER: sticky tab + active section detection ──────────────────
  const handleScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;

    // Sticky detection
    if (tabBarOffset.current > 0) {
      setIsTabSticky(y >= tabBarOffset.current);
    }

    // Active tab detection (only when user scrolls, not on tab click)
    if (!isManualScroll.current) {
      let detected = TABS[0];
      for (const tab of TABS) {
        const off = sectionOffsets.current[tab];
        if (off !== undefined && y >= off - 80) {
          detected = tab;
        }
      }
      setActiveTab(detected);
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  if (isInitialLoading || !profileData) {
    return <ProfileDetailsShimmer />;
  }

  const { basic_details, user_images, personal_details, education_details, family_details, horoscope_details, contact_details } = profileData;

  const images = (
    fetchedUserImages ? Object.values(fetchedUserImages) : Object.values(user_images || {})
  ).map(url => ({
    url: getSafeImage(url),
  }));

  const hasRealPhoto = Object.values(fetchedUserImages || user_images || {})
    .some(url => url && url.trim() !== "" && !isDefaultImageUrl(url));

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
          position: "top",
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
    } finally {
      setLoading(false);
    }
  };

  const openPopup = () => {
    bottomSheetRef.current?.close();
    setShowVysassist(!showVysassist);
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

  const handleNotesChange = (text) => {
    setNotes(text);
    if (text) setSelectValue('');
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

        try {
          const data = await fetchProfileData(viewedProfileId);
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
      }
    }
    catch (error) {
      console.error('Error submitting vysassist request:', error);
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
          position: "top",
        });

        if (response.message?.toLowerCase().includes("upgrade")) {
          navigation.navigate('MembershipPlan');
        }
      }
    } catch (error) {
      console.error('Error opening dialer:', error);
    } finally {
      setLoading(false);
      bottomSheetRef.current.close();
    }
  };

  const renderBottomSheetContent = () => {
    const options = [
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
              <MaterialCommunityIcons name={option.icon} size={22} color="#1E1E1E" />
            )}
            {option.type === 'MaterialIcons' && (
              <MaterialIcons name={option.icon} size={22} color="#1E1E1E" />
            )}
            {option.type === 'Ionicons' && (
              <Ionicons name={option.icon} size={22} color="#1E1E1E" />
            )}
            <Text style={styles.bottomSheetText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSuccessView = () => (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.textDark, marginTop: 10 }}>
        Vysassist sent successfully
      </Text>
      <Text style={{ fontSize: 16, color: Colors.textDark, marginVertical: 10 }}>
        Remaining VysAssist Count:
        <Text style={{ color: Colors.primary, fontWeight: 'bold' }}> {remainCount}</Text>
      </Text>
      <TouchableOpacity
        style={[styles.submitButtonpop, { width: '40%', marginTop: 20, borderRadius: 20, padding: 10 }]}
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
  // const isLocked = !isProfileUnlocked && photoProtection === 1;
  // const isNoPhoto = !isLocked && (!hasRealPhoto || imageLoadError);
  // const isRestricted = !isLocked && photoRequest === 1 && !expressInt && !isProfileUnlocked;

  // const photoState = isLocked
  //   ? "locked"
  //   : isRestricted
  //     ? "restricted"
  //     : isNoPhoto
  //       ? "none"
  //       : "available";

  const isLocked = !isProfileUnlocked && photoProtection === 1;
  const isNoPhoto = !isLocked && (!hasRealPhoto || imageLoadError);

  const photoState = isLocked
    ? "locked"
    : isNoPhoto
      ? "none"
      : "available";


  {
    photoState === "none" && (
      <View style={styles.noPhotosBadge}>
        <Ionicons name="camera-outline" size={13} color={Colors.textDark} style={{ marginRight: 4 }} />
        <Text style={styles.noPhotosBadgeText}>No Photos</Text>
      </View>
    )
  }
  {
    photoState === "locked" && (
      <View style={styles.noPhotosBadge}>
        <MaterialCommunityIcons name="lock" size={13} color={Colors.textDark} style={{ marginRight: 4 }} />
        <Text style={styles.noPhotosBadgeText}>Photos Locked</Text>
      </View>
    )
  }
  // {
  //   photoState === "restricted" && (
  //     <View style={styles.noPhotosBadge}>
  //       <MaterialCommunityIcons name="lock" size={13} color={Colors.textDark} style={{ marginRight: 4 }} />
  //       <Text style={styles.noPhotosBadgeText}>Access Restricted</Text>
  //     </View>
  //   )
  // }

  const renderDetailRow = (label, value) => {
    if (!value || value === "" || value === "0") return null;
    return (
      <View style={styles.rowItem} key={label}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    );
  };

  const renderFactCard = (iconName, IconComponent, label, value) => {
    if (!value || value === "" || value === "0") return null;
    return (
      <View style={styles.factCard}>
        <View style={styles.factIconBg}>
          <IconComponent name={iconName} size={16} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.factLabel}>{label}</Text>
          <Text style={styles.factValue} numberOfLines={1}>{value}</Text>
        </View>
      </View>
    );
  };

  const isBookmarked = bookmarkedProfiles.has(basic_details?.profile_id);

  // ─── TAB BAR (shared between inline and sticky) ──────────────────────────────
  const renderTabBar = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 10, paddingLeft: 2 }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tabPill, isActive && styles.tabPillActive]}
            onPress={() => handleTabPress(tab)}
          >
            <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
              {tab}
            </Text>
            {/* <TabProgressCircle active={isActive} /> */}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.mainContainer}>

      <StatusBar backgroundColor="#FBF5ED" barStyle="dark-content" />
      <View style={styles.safeAreaTopFill(insets.top)} />

      {isTabSticky && (
        <View style={[styles.stickyTabBarWrapper, { top: insets.top }]}>
          {renderTabBar()}
        </View>
      )}

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
              size={50}
              color={Colors.primary}
              style={{ alignSelf: 'center', marginBottom: 10 }}
            />
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
              Block Profile?
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Colors.textMuted,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 20,
              }}
            >
              Are you sure you want to block this profile?{"\n"}You will no longer see or interact with this profile.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: Colors.chipInactiveBg,
                  padding: 12,
                  borderRadius: 20,
                  marginRight: 8,
                  alignItems: "center",
                }}
                onPress={() => setBlockModalVisible(false)}
              >
                <Text style={{ color: Colors.textDark, fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: Colors.primary,
                  padding: 12,
                  borderRadius: 20,
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

      <Modal
        visible={showAlreadyRequestedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlreadyRequestedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alreadyReqCard}>
            <View style={styles.alreadyReqIconRing}>
              <View style={styles.alreadyReqIconCircle}>
                <Ionicons name="heart" size={26} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.alreadyReqTitle}>Already Requested</Text>
            <Text style={styles.alreadyReqBody}>
              You have already sent a photo request for this profile.
            </Text>
            <View style={styles.alreadyReqGoldRule} />

            <TouchableOpacity
              style={styles.alreadyReqBtn}
              onPress={() => setShowAlreadyRequestedModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.alreadyReqBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        ref={mainScrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ===== HERO IMAGE HEADER ===== */}
        <View style={styles.heroContainer}>
          {photoState === "locked" ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setPassword('');
                setIsPasswordModalVisible(true);
              }}
            >
              <Image
                source={{ uri: primaryImageUri }}
                style={styles.heroImage}
                blurRadius={20}
              />
              <View style={styles.stateOverlayWrap}>
                <View style={styles.stateCard}>
                  <View style={styles.stateCardHeaderRow}>
                    <View style={styles.stateGoldIcon}>
                      <MaterialCommunityIcons name="lock" size={14} color="#5c3d00" />
                    </View>
                    <Text style={styles.stateCardTitle}>Photo Locked</Text>
                  </View>
                  <Text style={styles.stateCardBody}>
                    Click here to request password to view profile photo
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            // ) : photoState === "restricted" ? (
            //   <View>
            //     <Image
            //       source={{ uri: primaryImageUri }}
            //       style={styles.heroImage}
            //       blurRadius={20}
            //     />
            //     <View style={[styles.stateOverlayWrap, { paddingTop: 92 }]}>
            //       <View style={styles.stateCard}>
            //         <View style={styles.stateCardHeaderRow}>
            //           <View style={styles.stateGoldIcon}>
            //             <MaterialCommunityIcons name="lock" size={14} color="#5c3d00" />
            //           </View>
            //           <Text style={styles.stateCardTitle}>Photo Access Restricted</Text>
            //         </View>
            //         <Text style={styles.stateCardBody}>
            //           Send an interest request to ask this member for photo access.
            //         </Text>
            //         {photoRequestSent ? (
            //           <View style={styles.stateSuccessPill}>
            //             <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            //             <Text style={styles.stateSuccessPillText}>Request sent successfully</Text>
            //           </View>
            //         ) : (
            //           <TouchableOpacity
            //             style={styles.stateFullPrimaryBtn}
            //             onPress={handleSendPhotoRequest}
            //             disabled={loading}
            //           >
            //             <Ionicons name="heart" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            //             <Text style={styles.statePrimaryBtnText}>Send Interest Request</Text>
            //           </TouchableOpacity>
            //         )}
            //       </View>
            //     </View>
            //   </View>
          ) : photoState === "none" ? (
            <LinearGradient
              colors={['#F6EFE5', '#FBF5ED', '#F0DFC4']}
              style={styles.noPhotoContainer}
            >
              <View style={styles.noPhotoIconCircle}>
                <Ionicons name="camera-outline" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.noPhotoTitle}>Photo Not Available</Text>
              <Text style={styles.noPhotoSubtitle}>
                This member has not uploaded a{"\n"}profile photo yet.
              </Text>
              <View style={styles.noPhotoGoldRule} />
            </LinearGradient>
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
                    activeOpacity={0.95}
                    onPress={() => handleSlidePress(idx)}
                  >
                    <Image
                      source={{ uri: img.url }}
                      style={{ width, height: 420 }}
                      resizeMode="cover"
                      onError={() => setImageLoadError(true)}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {images.length > 1 && (
                <View style={styles.imageCounterBadge}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1}/{images.length}
                  </Text>
                </View>
              )}

              {images.length > 1 && (
                <View style={styles.heroDotsContainer}>
                  {images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.heroDot,
                        currentImageIndex === idx ? styles.heroDotActive : styles.heroDotInactive
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ===== TOP BAR ===== */}
          <View style={styles.headerOverlay}>
            <View style={styles.leftHeaderGroup}>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                ]}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={20} color={Colors.textDark} />
              </Pressable>

              <View style={styles.profileCodeChip}>
                <Text style={styles.profileCodeText}>
                  {basic_details?.profile_id}
                </Text>
              </View>
            </View>

            <View style={styles.rightActionGroup}>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                ]}
                onPress={() => handleSavePress(basic_details?.profile_id)}
                accessibilityLabel={
                  bookmarkedProfiles.has(basic_details?.profile_id)
                    ? "Remove bookmark"
                    : "Bookmark profile"
                }
              >
                <Ionicons
                  name={
                    bookmarkedProfiles.has(basic_details?.profile_id)
                      ? "bookmark"
                      : "bookmark-outline"
                  }
                  size={20}
                  color={
                    bookmarkedProfiles.has(basic_details?.profile_id)
                      ? Colors.primary
                      : Colors.textDark
                  }
                />
              </Pressable>

              {!isPlan16 && photoRequest === 1 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.iconButtonPressed,
                  ]}
                  onPress={handleSendPhotoRequest}
                  accessibilityLabel="Request photo"
                >
                  <MaterialIcons name="insert-photo" size={20} color={Colors.textDark} />
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                ]}
                onPress={() => bottomSheetRef.current?.open()}
                accessibilityLabel="More options"
              >
                <Ionicons name="ellipsis-vertical" size={20} color={Colors.textDark} />
              </Pressable>
            </View>
          </View>


          {/* {isNoPhoto && (
            <View style={styles.noPhotosBadge}>
              <Ionicons name="camera-outline" size={13} color={Colors.textDark} style={{ marginRight: 4 }} />
              <Text style={styles.noPhotosBadgeText}>No Photos</Text>
            </View>
          )} */}
          {/* Identity Overlay on Image */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
            style={styles.identityOverlay}
          >
            <View style={styles.nameBadgeRow}>
              <Text style={styles.heroName}>{basic_details.profile_name}</Text>
              {basic_details.verified === 1 && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.primaryGradientEnd} />
                  <Text style={styles.verifiedText}>Mobile Verified</Text>
                </View>
              )}
            </View>

            <Text style={styles.heroSubText}>
              {basic_details.age} yrs · {basic_details.height?.height_desc || 'N/A'} · {basic_details.profile_id}
            </Text>

            {(contact_details?.city || contact_details?.state) ? (
              <View style={styles.heroLocRow}>
                <Ionicons name="location-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.heroSubText}>
                  {[contact_details.city, contact_details.state].filter(Boolean).join(", ")}
                </Text>
              </View>
            ) : null}

            <Text style={styles.heroSubText}>
              {basic_details.profession}
            </Text>
          </LinearGradient>
        </View>

        {/* Section Cards Container */}
        <View style={styles.cardsContainer}>

          {/* ===== 1. COMPATIBILITY CARD ===== */}
          {basic_details?.matching_score !== undefined &&
            basic_details.matching_score > 50 &&
            basic_details.matching_score !== 100 && (
              <View style={styles.card}>
                <View style={styles.compatHeader}>
                  <View style={styles.ringContainer}>
                    <Svg width={64} height={64} style={{ position: 'absolute' }}>
                      {/* background circle */}
                      <Circle
                        cx={32} cy={32} r={28}
                        stroke="#E0E0E0" strokeWidth={5} fill="transparent"
                      />
                      {/* progress circle */}
                      <Circle
                        cx={32} cy={32} r={28}
                        stroke={Colors.matchingcirclecolor} strokeWidth={5}
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - basic_details.matching_score / 100)}
                        fill="transparent"
                        strokeLinecap="round"
                        transform="rotate(-90, 32, 32)"
                      />
                    </Svg>
                    <Text style={styles.ringScoreText}>{basic_details.matching_score}%</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.compatTitle}>{matchLabel(basic_details.matching_score)}</Text>
                    <Text style={styles.compatSubtitle}>Horoscope & preference compatibility</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={handleDownloadMatchingReport}
                >
                  <Ionicons name="sparkles" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.outlineBtnText}>View Matching Details</Text>
                </TouchableOpacity>
              </View>
            )}

          {/* ===== 2. STATUS CHIPS ===== */}
          <View style={styles.statusChipsGrid}>
            <View style={styles.statusChip}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusChipTitle}>{basic_details.last_visit || "N/A"}</Text>
                <Text style={styles.statusChipSub}>Last visit</Text>
              </View>
            </View>

            <View style={styles.statusChip}>
              <Ionicons name="eye-outline" size={16} color={Colors.textDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusChipTitle}>{basic_details.user_profile_views || 0}</Text>
                <Text style={styles.statusChipSub}>Profile views</Text>
              </View>
            </View>
          </View>

          {/* ===== 3. SNAPSHOT CARD ===== */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="sparkles" size={16} color={Colors.matchingcirclecolor} />
              </View>
              <Text style={styles.cardSectionTitle}>Snapshot</Text>
            </View>

            <View style={styles.factsGrid}>
              {renderFactCard("cake-variant-outline", MaterialCommunityIcons, "Age", basic_details.age ? `${basic_details.age} yrs` : null)}
              {renderFactCard("ruler", MaterialCommunityIcons, "Height", basic_details.height?.height_desc)}
              {renderFactCard("briefcase-outline", MaterialCommunityIcons, "Profession", basic_details.profession)}
              {renderFactCard("school-outline", Ionicons, "Education", basic_details.education || basic_details.degeree)}
              {renderFactCard("star-outline", Ionicons, "Star / Rasi", [basic_details.star, horoscope_details?.rasi].filter(Boolean).join(" · "))}
              {renderFactCard("sparkles-outline", Ionicons, "Gothram", horoscope_details?.surya_gothram || basic_details.gothram)}
              {renderFactCard("home-outline", Ionicons, "Native", personal_details?.place_of_birth || family_details?.about_family)}
              {renderFactCard("location-outline", Ionicons, "Current location", [contact_details?.city, contact_details?.state].filter(Boolean).join(", "))}
            </View>
          </View>


          <View
            ref={tabBarRef}
            onLayout={(e) => {
              // store the layout Y so we know when to go sticky
              tabBarOffset.current = e.nativeEvent.layout.y;
            }}
            style={styles.tabsContainer}
          >
            <View style={{ opacity: isTabSticky ? 0 : 1 }}>
              {renderTabBar()}
            </View>
          </View>

          {/* ===== TAB CONTENT SECTIONS ===== */}

          {/* ── Personal ── */}
          <View
            ref={sectionRefs.Personal}
            onLayout={(e) => {
              sectionOffsets.current['Personal'] = e.nativeEvent.layout.y;
            }}
          >
            {personal_details?.about_self ? (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.sectionIconCircle}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.cardSectionTitle}>About</Text>
                </View>
                <Text style={styles.aboutBodyText}>{personal_details.about_self}</Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="person-outline" size={16} color={Colors.matchingcirclecolor} />
                </View>
                <Text style={styles.cardSectionTitle}>Basic Information</Text>
              </View>

              {renderDetailRow("Profile ID", basic_details.profile_id)}
              {renderDetailRow("Gender", personal_details?.gender)}
              {renderDetailRow("Age", personal_details?.age ? `${personal_details.age} Years` : null)}
              {renderDetailRow("DOB", personal_details?.dob)}
              {renderDetailRow("Height", personal_details?.height?.height_desc)}
              {renderDetailRow("Weight", personal_details?.weight ? `${personal_details.weight} kg` : null)}
              {renderDetailRow("Body Type", personal_details?.body_type)}
              {renderDetailRow("Eye Wear", personal_details?.eye_wear)}
              {renderDetailRow("Marital status", personal_details?.marital_status)}
              {renderDetailRow("Complexion", personal_details?.complexion)}
              {renderDetailRow("Physical status", personal_details?.physical_status)}
              {renderDetailRow("Blood Group", personal_details?.blood_group)}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="heart-outline" size={16} color={Colors.matchingcirclecolor} />
                </View>
                <Text style={styles.cardSectionTitle}>Lifestyle</Text>
              </View>

              {renderDetailRow("Place of Birth", personal_details?.place_of_birth)}
              {renderDetailRow("Time of Birth", personal_details?.time_of_birth)}
              {renderDetailRow("Hobbies", personal_details?.hobbies)}
            </View>
          </View>

          {/* ── Work ── */}
          <View
            ref={sectionRefs['Work & Education']}
            onLayout={(e) => {
              sectionOffsets.current['Work & Education'] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="school-outline" size={16} color={Colors.matchingcirclecolor} />
                </View>
                <Text style={styles.cardSectionTitle}>Education</Text>
              </View>

              {renderDetailRow("Education Level", education_details?.education_level)}
              {renderDetailRow("Degree", education_details?.degeree || education_details?.education_level)}
              {renderDetailRow("About Education", education_details?.about_education)}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="briefcase-outline" size={16} color={Colors.matchingcirclecolor} />
                </View>
                <Text style={styles.cardSectionTitle}>Career</Text>
              </View>

              {renderDetailRow("Occupation", education_details?.profession)}
              {renderDetailRow("Company Name", education_details?.company_name || education_details?.business_name)}
              {renderDetailRow("Designation", education_details?.designation)}
              {renderDetailRow("Business Name", education_details?.business_name)}
              {renderDetailRow("Business Address", education_details?.business_address)}
              {renderDetailRow("Annual Income", education_details?.annual_income || education_details?.gross_annual_income)}
              {renderDetailRow("Gross Annual Income", education_details?.gross_annual_income)}
              {renderDetailRow("Work Location", education_details?.place_of_stay)}
            </View>
          </View>

          {/* ── Family ── */}
          <View
            ref={sectionRefs.Family}
            onLayout={(e) => {
              sectionOffsets.current['Family'] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="people-outline" size={16} color={Colors.matchingcirclecolor} />
                </View>
                <Text style={styles.cardSectionTitle}>Family Details</Text>
              </View>

              {renderDetailRow("Father", family_details?.father_name ? `${family_details.father_name} · ${family_details.father_occupation || ''}` : null)}
              {renderDetailRow("Mother", family_details?.mother_name ? `${family_details.mother_name} · ${family_details.mother_occupation || ''}` : null)}
              {renderDetailRow("Family Status", family_details?.family_status)}
              {renderDetailRow("Sisters", family_details?.no_of_sisters)}
              {renderDetailRow("Sisters Married", family_details?.no_of_sis_married)}
              {renderDetailRow("Brothers", family_details?.no_of_brothers)}
              {renderDetailRow("Brothers Married", family_details?.no_of_bro_married)}
              {renderDetailRow("Property details", family_details?.property_details)}
              {renderDetailRow("Father Alive", family_details?.father_alive)}
              {renderDetailRow("Mother Alive", family_details?.mother_alive)}
              {renderDetailRow("About Family", family_details?.about_family)}
            </View>
          </View>

          {/* ── Horoscope ── */}
          <View
            ref={sectionRefs.Horoscope}
            onLayout={(e) => {
              sectionOffsets.current['Horoscope'] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="star-outline" size={16} color={Colors.matchingcirclecolor} />
                </View>
                <Text style={styles.cardSectionTitle}>Horoscope</Text>
                <View style={styles.availableBadge}>
                  <Text style={styles.availableBadgeText}>Available</Text>
                </View>
              </View>

              {renderDetailRow("Gothram", horoscope_details?.surya_gothram)}
              {renderDetailRow("Star", horoscope_details?.star_name)}
              {renderDetailRow("Rasi", horoscope_details?.rasi)}
              {renderDetailRow("Lagnam", horoscope_details?.lagnam)}
              {renderDetailRow("Padham", horoscope_details?.padham)}
              {renderDetailRow("Nallikai", horoscope_details?.nallikai)}
              {renderDetailRow("Didi", horoscope_details?.didi)}
              {renderDetailRow("Madhulam", horoscope_details?.madulamn)}
              {renderDetailRow("Dasa Name", horoscope_details?.dasa_name)}
              {renderDetailRow("Dasa Balance", horoscope_details?.dasa_balance)}
              {renderDetailRow("Chevvai Dosham", horoscope_details?.chevvai_dosham)}
              {renderDetailRow("Ragu/Kethu Dhosham", horoscope_details?.sarpadosham)}
            </View>

            {/* RASI CHART */}
            {rasiGrid.length >= 4 && (
              <View style={styles.card}>
                <Text style={[styles.cardSectionTitle, { marginBottom: 12 }]}>Rasi Grid</Text>
                <View style={styles.chartBorder}>
                  <View style={styles.chartRow}>
                    <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][0]}</Text></View>
                    <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][1]}</Text></View>
                    <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][2]}</Text></View>
                    <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{rasiGrid[0][3]}</Text></View>
                  </View>
                  <View style={[styles.chartRow, { flex: 2, borderBottomWidth: 1 }]}>
                    <View style={styles.sideColumn}>
                      <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}><Text style={styles.chartText}>{rasiGrid[1][0]}</Text></View>
                      <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}><Text style={styles.chartText}>{rasiGrid[2][0]}</Text></View>
                    </View>
                    <View style={styles.centerBox}>
                      <Text style={styles.centerLabel}>Rasi</Text>
                      <Text style={styles.centerDomain}>vysyamala.com</Text>
                    </View>
                    <View style={[styles.sideColumn, { borderRightWidth: 0 }]}>
                      <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}><Text style={styles.chartText}>{rasiGrid[1][rasiGrid[1].length - 1]}</Text></View>
                      <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}><Text style={styles.chartText}>{rasiGrid[2][rasiGrid[2].length - 1]}</Text></View>
                    </View>
                  </View>
                  <View style={[styles.chartRow, { borderBottomWidth: 0 }]}>
                    <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][0]}</Text></View>
                    <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][1]}</Text></View>
                    <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][2]}</Text></View>
                    <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{rasiGrid[3][3]}</Text></View>
                  </View>
                </View>
              </View>
            )}

            {/* AMSAM CHART */}
            {amsaGrid.length >= 4 && (
              <View style={styles.card}>
                <Text style={[styles.cardSectionTitle, { marginBottom: 12 }]}>Amsam Grid</Text>
                <View style={styles.chartBorder}>
                  <View style={styles.chartRow}>
                    <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][0]}</Text></View>
                    <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][1]}</Text></View>
                    <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][2]}</Text></View>
                    <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{amsaGrid[0][3]}</Text></View>
                  </View>
                  <View style={[styles.chartRow, { flex: 2, borderBottomWidth: 1 }]}>
                    <View style={styles.sideColumn}>
                      <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}><Text style={styles.chartText}>{amsaGrid[1][0]}</Text></View>
                      <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}><Text style={styles.chartText}>{amsaGrid[2][0]}</Text></View>
                    </View>
                    <View style={styles.centerBox}>
                      <Text style={styles.centerLabel}>Amsam</Text>
                      <Text style={styles.centerDomain}>vysyamala.com</Text>
                    </View>
                    <View style={[styles.sideColumn, { borderRightWidth: 0 }]}>
                      <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}><Text style={styles.chartText}>{amsaGrid[1][amsaGrid[1].length - 1]}</Text></View>
                      <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}><Text style={styles.chartText}>{amsaGrid[2][amsaGrid[2].length - 1]}</Text></View>
                    </View>
                  </View>
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

          {/* ── Contact ── */}
          <View
            ref={sectionRefs.Contact}
            onLayout={(e) => {
              sectionOffsets.current['Contact'] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="call-outline" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.cardSectionTitle}>Contact</Text>
              </View>

              {renderDetailRow("Address", contact_details?.address)}
              {renderDetailRow("City", contact_details?.city)}
              {renderDetailRow("State", contact_details?.state)}
              {renderDetailRow("Country", contact_details?.country)}
              {renderDetailRow("Phone", contact_details?.phone)}
              {renderDetailRow("Mobile", contact_details?.mobile)}
              {renderDetailRow("WhatsApp", contact_details?.whatsapp)}
              {renderDetailRow("Email", contact_details?.email)}
            </View>
          </View>

          <FeaturedProfiles />
          <SuggestedProfiles />

        </View>
      </ScrollView>

      <View style={styles.stickyBottomBar}>
        <View style={styles.bottomBarCard}>

          {/* Connected State -> Show Message Button */}
          {status === 2 ? (
            <TouchableOpacity
              style={styles.messageButton}
              activeOpacity={0.8}
              onPress={handlePressMessage}
            >
              <FontAwesome name="comments" size={16} color="#fff" />
              <Text style={styles.messageText}>Message</Text>
            </TouchableOpacity>
          ) : interestParam === 1 && status !== 3 && status !== 2 ? (
            <View style={styles.buttonContainer}>
              {hideExpressButton && (
                <>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    activeOpacity={0.8}
                    onPress={() => handleUpdateInterest(viewedProfileId, "2")}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.declineButton}
                    activeOpacity={0.8}
                    onPress={() => handleUpdateInterest(viewedProfileId, "3")}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#a32d2d" style={{ marginRight: 4 }} />
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <View style={styles.buttonContainerExpress}>
              {(status === 1 || status === "1" || expressInt) && status !== 3 && (
                <TouchableOpacity
                  style={styles.sentBtnPill}
                  activeOpacity={0.8}
                  onPress={handleExpressInterestPress1}
                >
                  <Ionicons name="heart" size={18} color="#70121e" />
                  <Text style={styles.sentBtnText}>Interest sent</Text>
                </TouchableOpacity>
              )}

              {!isPlan16 &&
                interestParam !== 1 &&
                status !== 1 &&
                status !== "1" &&
                status !== 2 &&
                status !== 3 &&
                !expressInt && (
                  <TouchableOpacity
                    style={styles.expressInterestBtn}
                    activeOpacity={0.8}
                    onPress={() => setShowInterestModal(true)}
                  >
                    <LinearGradient
                      colors={[Colors.primary, Colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.linearGradient}
                    >
                      <View style={styles.loginContainer}>
                        <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.expressInterestBtnText}>Express Interest</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

              {status === 3 && (
                <View style={styles.rejectedPill}>
                  <Ionicons name="close-circle" size={18} color="#a32d2d" />
                  <Text style={styles.rejectedPillText}>Interest Declined</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.bottomCircleBtn, isBookmarked && styles.bottomCircleBtnActive]}
            activeOpacity={0.8}
            onPress={() => handleSavePress(basic_details?.profile_id)}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={18}
              color={isBookmarked ? "#5c3d00" : Colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomCircleBtn}
            activeOpacity={0.8}
            onPress={handlePhoneCall}
          >
            <Ionicons name="call-outline" size={18} color="#b82332" />
          </TouchableOpacity>

        </View>
      </View>

      {/* MODALS */}
      <Modal
        visible={isPasswordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="report-problem" size={24} color={Colors.primary} />
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
                  color={Colors.textMuted}
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

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      <RBSheet
        ref={bottomSheetRef}
        closeOnDragDown={true}
        closeOnPressMask={true}
        customStyles={{
          wrapper: { backgroundColor: "rgba(0,0,0,0.5)" },
          draggableIcon: { backgroundColor: Colors.border },
          container: { borderTopLeftRadius: 24, borderTopRightRadius: 24 }
        }}
        height={380}
      >
        {renderBottomSheetContent()}
      </RBSheet>

      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordCard}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center', color: Colors.textDark }}>
              Upgrade Required
            </Text>
            <Text style={{ fontSize: 14, color: Colors.textMuted, marginBottom: 20, textAlign: 'center' }}>
              {responseMsg}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity
                style={{ flex: 1, marginRight: 8, padding: 12, alignItems: 'center' }}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={{ color: Colors.textDark, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: Colors.primary,
                  borderRadius: 20,
                  padding: 12,
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
                          color={Colors.textMuted}   // was "#4F515D"
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
                  circleColor={Colors.primary}        // was '#4CAF50'
                  lineColor={Colors.border}           // was '#E0E0E0'
                  timeContainerStyle={{ minWidth: 72 }}
                  timeStyle={{
                    textAlign: 'left',
                    backgroundColor: Colors.primary,  // was '#ff9797'
                    color: '#fff',
                    padding: 5,
                    fontSize: 12,
                    top: -2,
                    fontWeight: 'bold',
                    borderRadius: 13,
                  }}
                  descriptionStyle={{
                    color: Colors.textDark,           // was '#333'
                    fontSize: 16,
                    paddingTop: 2,
                    top: -47,
                    fontWeight: 'bold',
                    marginBottom: -20,
                  }}
                  options={{
                    style: { paddingTop: 5 },
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
        <View style={styles.modalOverlay}>
          <View style={{
            backgroundColor: Colors.card,
            borderRadius: 12,
            padding: 24,
            width: '80%',
            alignItems: 'center',
            elevation: 10,
          }}>
            <TouchableOpacity
              onPress={() => setShowVysassistErrorModal(false)}
              style={{ position: 'absolute', top: 12, right: 12 }}
            >
              <MaterialIcons name="warning" size={32} color={Colors.destructive} />
            </TouchableOpacity>

            <View style={{
              backgroundColor: Colors.destructive,   // was '#ED1E24'
              borderRadius: 50,
              padding: 14,
              marginBottom: 16,
              marginTop: 10,
            }}>
              <MaterialIcons name="info" size={32} color="white" />
            </View>

            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: Colors.textDark,   // was '#282C3F'
              textAlign: 'center',
              marginBottom: 20,
            }}>
              {vysassistErrorMsg}
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: Colors.destructive,   // was '#ED1E24'
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
              <Ionicons name="close" size={24} color={Colors.textMuted} />
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
                  color={Colors.primary}
                />
                <Text style={{ fontSize: 16, marginLeft: 10, color: Colors.textDark }}>English</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxContainerNew2}
                onPress={() => setSelectedPdfLanguage("tamil")}
              >
                <MaterialIcons
                  name={selectedPdfLanguage === "tamil" ? "radio-button-checked" : "radio-button-unchecked"}
                  size={24}
                  color={Colors.primary}
                />
                <Text style={{ fontSize: 16, marginLeft: 10, color: Colors.textDark }}>Tamil</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButtonpop, { borderRadius: 20, padding: 12 }]}
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
    backgroundColor: Colors.selectedBg,
  },

  // ─── NEW: sticky tab bar wrapper ────────────────────────────────────────────
  stickyTabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: '#FBF5ED',
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 6,
  },
  safeAreaTopFill: (topInset) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: topInset,
    backgroundColor: '#FBF5ED',
    zIndex: 100,
  }),
  // ────────────────────────────────────────────────────────────────────────────

  heroContainer: {
    position: 'relative',
    height: 420,
    width: '100%',
    backgroundColor: '#000000',
  },
  heroImage: {
    width: '100%',
    height: 420,
  },
  identityOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  heroSubText: {
    color: '#E0E0E0',
    fontSize: 13,
    marginTop: 2,
  },
  heroLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  imageCounterBadge: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroDotsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDot: {
    height: 6,
    borderRadius: 3,
  },
  heroDotActive: {
    width: 18,
    backgroundColor: Colors.secondaryGold,
  },
  heroDotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  heroLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 30,
  },
  cardsContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  ringContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: "#F1E8DD",
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  compatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  compatSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 22,
    paddingVertical: 10,
    marginTop: 4,
  },
  outlineBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '400',
  },
  statusChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6EFE5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 10,
  },
  statusChipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
  },
  statusChipSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.iconContainerBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.snapshotbg,
    padding: 10,
    borderRadius: 25,
    gap: 8,
  },
  factIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  factValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: 1,
  },
  // ─── UPDATED tab styles (keep same look, add dot space) ──────────────────
  tabsContainer: {
    marginVertical: 4,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    marginRight: 8,
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  // ────────────────────────────────────────────────────────────────────────────
  aboutBodyText: {
    fontSize: 14,
    color: Colors.textDark,
    lineHeight: 22,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.chipInactiveBg,
  },
  rowLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textDark,
    flex: 1.2,
    textAlign: 'right',
  },
  availableBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.goldContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  availableBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.chipActiveText,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 140 : 120,
    left: 14,
    right: 14,
    zIndex: 99,
  },
  bottomBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 5,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  expressInterestBtn: {
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#d4f0e4",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  expressInterestBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  sentBtnPill: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fde8e8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  sentBtnText: {
    color: "#70121e",
    fontSize: 15,
    fontWeight: "700",
  },
  rejectedPill: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fcebeb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  rejectedPillText: {
    color: "#a32d2d",
    fontSize: 14,
    fontWeight: "700",
  },
  linearGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745",
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 14,
    gap: 6,
  },
  messageText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 6,
  },
  declineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#a32d2d",
    backgroundColor: "#fff0f0",
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 6,
  },
  declineText: {
    color: "#a32d2d",
    fontWeight: "700",
    fontSize: 13,
  },
  bottomCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: "#ffffff",
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCircleBtnActive: {
    borderColor: "transparent",
    backgroundColor: "#fef0d6",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  passwordCard: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chipInactiveBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  cardInputTransparent: {
    flex: 1,
    height: 44,
    color: Colors.textDark,
  },
  eyeIconContainer: {
    padding: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelTextBtn: {
    color: Colors.textMuted,
    fontWeight: '600',
    marginRight: 20,
  },
  submitBtnRed: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  bottomSheetContent: {
    padding: 20,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.chipInactiveBg,
    gap: 12,
  },
  bottomSheetText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  chartBorder: {
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#FFFACD',
    width: '100%',
    aspectRatio: 1,
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
  },
  centerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008000',
  },
  centerDomain: {
    fontSize: 10,
    color: '#008000',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: Colors.textDark,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  categoryPicker: {
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },





  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    textAlignVertical: 'top',
  },

  headerOverlay: {
    position: "absolute",
    top: Platform.OS === "android" ? 40 : 52,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: rs(12, 16, 20),
    zIndex: 10,
  },
  leftHeaderGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: 'rgba(250, 246, 240, 0.75)',
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 2,
    elevation: 2,
  },
  iconButtonPressed: {
    backgroundColor: 'rgba(250, 246, 240, 0.5)',
  },
  profileCodeChip: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 9999,
    backgroundColor: 'rgba(250, 246, 240, 0.75)',
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 2,
    elevation: 2,
  },
  profileCodeChipPressed: {
    backgroundColor: 'rgba(250, 246, 240, 0.5)',
  },
  profileCodeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textDark,
    letterSpacing: 0.3,
  },
  buttonContainerExpress: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  popupContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 20,
    width: '92%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  titleNewnote: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 10,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMuted,
    marginBottom: 10,
  },
  modalBody: {
    marginVertical: 4,
  },
  checkboxContainerNew1: {
    marginBottom: 12,
  },
  checkboxContainerNew2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  textInputnew: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    textAlignVertical: 'top',
    color: Colors.textDark,
    backgroundColor: Colors.surface,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    marginVertical: 12,
  },
  processTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: 8,
    marginBottom: 6,
  },
  listContainer: {
    marginBottom: 12,
  },
  listItem: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalButtonsNew: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalButtonNew: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  // Override for submit buttons that use primary
  submitButtonpop: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    backgroundColor: Colors.border,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    color: Colors.destructive,
    textAlign: 'center',
    marginVertical: 8,
    fontSize: 13,
  },
  noPhotoContainer: {
    width: '100%',
    height: 420,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 24,
  },
  noPhotoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noPhotoTitle: {
    color: Colors.textDark,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  noPhotoSubtitle: {
    color: Colors.textMuted,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  noPhotoGoldRule: {
    marginTop: 10,
    height: 2,
    width: 64,
    borderRadius: 2,
    backgroundColor: '#F0C36D',
  },
  noPhotosBadge: {
    position: 'absolute',
    // top: Platform.OS === 'android' ? 40 : 52,
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 246, 240, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 10,
  },
  noPhotosBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textDark,
  },
  stateOverlayWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateCard: {
    width: '100%',
    maxWidth: 260,
    backgroundColor: 'rgba(251,245,237,0.45)',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,245,237,0.5)',
  },
  stateCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stateGoldIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0C36D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  stateCardBody: {
    fontSize: 12,
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
  },
  stateCardBtnRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  statePrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateFullPrimaryBtn: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  statePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stateSecondaryBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateSecondaryBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  stateSuccessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(40,167,69,0.12)',
    paddingHorizontal: 14,
  },
  stateSuccessPillText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  alreadyReqCard: {
    backgroundColor: '#FFFFFF',
    width: '85%',
    maxWidth: 320,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  alreadyReqIconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(240,195,109,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  alreadyReqIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alreadyReqTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
    textAlign: 'center',
  },
  alreadyReqBody: {
    fontSize: 14,
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  alreadyReqGoldRule: {
    marginTop: 14,
    height: 2,
    width: 48,
    borderRadius: 2,
    backgroundColor: '#F0C36D',
  },
  alreadyReqSubtext: {
    marginTop: 14,
    fontSize: 12.5,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  alreadyReqBtn: {
    marginTop: 22,
    height: 46,
    width: '100%',
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alreadyReqBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});