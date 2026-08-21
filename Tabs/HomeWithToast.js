import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
  Switch,
  Platform,
  LayoutAnimation,
  UIManager,
  Animated,
  Easing,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import VysyamalaLogo from "../assets/img/VysyamalaLogo.png";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ProfileCard } from "../Components/HomeTab/MatchingProfiles/ProfileCard";
import {
  fetchProfileInterests,
  logProfileVisit,
  createOrRetrieveChat,
  Search_By_profileId_matchingProfile,
  fetchProfiles,
  fetchVysassistRequests,
  getMyProfilePersonal,
} from "../CommonApiCall/CommonApiCall";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";
import { Colors } from "../Reusable/Theme";
import Svg, { Path } from "react-native-svg";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get("window");
const DEBOUNCE_DELAY = 300;
const MIN_SEARCH_LENGTH = 1;
const CARD_WIDTH = width - 90;

// ── Shimmer Animation Component ────────────────────────────────────────────────
const DynamicShimmer = ({ style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return <Animated.View style={[style, { backgroundColor: "#E1E9EE", opacity }]} />;
};

// ── Initial Full Skeleton Screen Component ─────────────────────────────────────
const InitialShimmerLoader = () => {
  return (
    <View style={styles.shimmerScreenContainer}>
      <View style={styles.shimmerHeader}>
        <View style={styles.shimmerHeaderTop}>
          <DynamicShimmer style={{ width: 120, height: 32, borderRadius: 12 }} />
          <DynamicShimmer style={{ width: 40, height: 40, borderRadius: 20 }} />
        </View>
        <DynamicShimmer style={{ width: 180, height: 22, borderRadius: 6, marginTop: 15 }} />
        <DynamicShimmer style={{ width: 100, height: 14, borderRadius: 4, marginTop: 8 }} />
        <DynamicShimmer style={{ width: "100%", height: 42, borderRadius: 21, marginTop: 15 }} />
      </View>

      <View style={styles.shimmerBodyContainer}>
        <View style={styles.shimmerTitleRow}>
          <DynamicShimmer style={{ width: 140, height: 18, borderRadius: 4 }} />
          <DynamicShimmer style={{ width: 70, height: 18, borderRadius: 4 }} />
        </View>

        <View style={styles.shimmerProfileCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <DynamicShimmer style={{ width: 80, height: 80, borderRadius: 8, marginRight: 12 }} />
            <View style={{ flex: 1, gap: 8 }}>
              <DynamicShimmer style={{ width: "70%", height: 16, borderRadius: 4 }} />
              <DynamicShimmer style={{ width: "40%", height: 12, borderRadius: 4 }} />
              <DynamicShimmer style={{ width: "50%", height: 12, borderRadius: 4 }} />
            </View>
          </View>
          <DynamicShimmer style={{ width: "100%", height: 35, borderRadius: 6, marginTop: 12 }} />
        </View>

        <View style={styles.shimmerProfileCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <DynamicShimmer style={{ width: 80, height: 80, borderRadius: 8, marginRight: 12 }} />
            <View style={{ flex: 1, gap: 8 }}>
              <DynamicShimmer style={{ width: "65%", height: 16, borderRadius: 4 }} />
              <DynamicShimmer style={{ width: "45%", height: 12, borderRadius: 4 }} />
              <DynamicShimmer style={{ width: "55%", height: 12, borderRadius: 4 }} />
            </View>
          </View>
          <DynamicShimmer style={{ width: "100%", height: 35, borderRadius: 6, marginTop: 12 }} />
        </View>
      </View>
    </View>
  );
};

const DEFAULT_PROFILE_IMG = 'https://vysyamat.blob.core.windows.net/vysyamala/default_bride.png';

const InterestProfileImage = ({ uri }) => {
  const [imgUri, setImgUri] = useState(uri || DEFAULT_PROFILE_IMG);

  useEffect(() => {
    setImgUri(uri || DEFAULT_PROFILE_IMG);
  }, [uri]);

  return (
    <Image
      style={styles.ProfileImgStyle}
      source={{ uri: imgUri }}
      resizeMode="cover"
      onError={() => {
        if (imgUri !== DEFAULT_PROFILE_IMG) {
          setImgUri(DEFAULT_PROFILE_IMG);
        }
      }}
    />
  );
};

export const HomeWithToast = () => {
  // ── Slider / interest state ──────────────────────────────────────────────
  const [profiles, setProfiles] = useState([]);
  const [vysassistData, setVysassistData] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isBannerExpanded, setIsBannerExpanded] = useState(false);
  const flatListRef = useRef(null);

  // ── Matching profiles list state ─────────────────────────────────────────
  const [matchingProfilesList, setMatchingProfilesList] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);

  // ── User / member info & Button Logic State ──────────────────────────────
  const [userName, setUserName] = useState("");
  const [planName, setPlanName] = useState("");
  const [userProfileId, setUserProfileId] = useState("");
  const [memberLabel, setMemberLabel] = useState("");
  const [memberSub, setMemberSub] = useState("");
  const [buttonText, setButtonText] = useState("Upgrade");
  const [hidePlanButton, setHidePlanButton] = useState(false);

  // ── Search / sort / view ─────────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState([]);
  const [searchProfileId, setSearchProfileId] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isProfilesLoading, setIsProfilesLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  const navigation = useNavigation();
  const getOrderBy = () => (isEnabled ? "2" : "1");
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(true);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [validTillDate, setValidTillDate] = useState("");

  // ── Filter options state ─────────────────────────────────────────────────
  const [filterOptions, setFilterOptions] = useState({
    gender: 'all',
    ageRange: { min: 18, max: 50 },
    gothram: '',
    star: '',
  });

  // ✅ Debounce ref — defined outside render
  const searchTimerRef = useRef(null);

  const handleSearchChange = (text) => {
    const value = text.trimStart();
    setSearchProfileId(value);

    if (value.trim().length === 0) {
      setSearchProfileId("");
      setSearchResults([]);
      setTotalCount(0);
      // ✅ Only refresh the matching profiles list, not the full page
      fetchMatchingProfilesOnly(getOrderBy(), 1);
      return;
    }

    // ✅ Debounce search
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      handleSearchPress(value, getOrderBy());
    }, 300);
  };

  // ✅ New function — only refreshes matching profiles, not interests/vysassist
  const fetchMatchingProfilesOnly = async (orderBy = "1", pageNum = 1) => {
    setIsProfilesLoading(true);
    setPage(1);
    setHasMorePages(true);
    try {
      const response = await fetchProfiles(20, pageNum, orderBy);
      if (response && response.profiles) {
        const newProfiles = response.profiles || [];
        const total = response.total_count || 0;
        setTotalCount(total);
        setMatchingProfilesList(newProfiles);
        setHasMorePages(newProfiles.length < total);
        setPage(pageNum);
      } else {
        setHasMorePages(false);
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to refresh profiles.", position: "top" });
    } finally {
      setIsProfilesLoading(false);
    }
  };

  const CrownOutlineIcon = ({ color = "#A00014", size = 26 }) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <Path d="M3 20h18" />
    </Svg>
  );

  // Relative Time Helper
  const formatRelativeTime = (viewed_date) => {
    if (!viewed_date) return "Recently active";
    const date = new Date(viewed_date);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Active today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 30) return `${diffDays} days ago`;
    return "Recently active";
  };

  // ── Toggle Banner Visibility ─────────────────────────────────────────────
  const toggleBannerExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsBannerExpanded((prev) => !prev);
  };

  // ── Fetch package name from profile personal API ──────────────────────────
  useEffect(() => {
    const loadPackageName = async () => {
      try {
        const res = await getMyProfilePersonal();
        if (res && res.data && res.data.package_name) {
          setPlanName(res.data.package_name);
        }
      } catch (e) {
        console.error("Error fetching package name:", e);
      }
    };
    loadPackageName();
  }, []);

  // ── Load user info & Determine Button Type from AsyncStorage ──────────────
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const name = await AsyncStorage.getItem("login_username");
        // const planName = await AsyncStorage.getItem("plan_name");
        const pid = await AsyncStorage.getItem("loginuser_profileId");
        const currentPlanId = await AsyncStorage.getItem("current_plan_id");
        const validityDate = await AsyncStorage.getItem("valid_till_date");
        const contactViews = await AsyncStorage.getItem("contact_views_left");

        if (name) setUserName(name);
        if (pid) setUserProfileId(pid);
        // if (planName) {
        //   setMemberLabel(planName);
        //   setPlanName(planName);
        // } else {
        //   setMemberLabel("FREE MEMBER");
        // }

        // Set valid till date
        if (validityDate) {
          const d = new Date(validityDate);
          const formatted = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          setValidTillDate(formatted);
        }

        const views = contactViews
          ? `${contactViews} contact views left`
          : "";

        const till = validityDate
          ? `Valid till ${new Date(validityDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}`
          : "";
        setMemberSub([views, till].filter(Boolean).join(" · "));

        const planId = parseInt(currentPlanId || "0");
        const allowedPremiumIds = [1, 2, 3, 10, 11, 13, 14, 15, 16, 17];

        // Determine plan button visibility and text
        if (planId === 16) {
          setHidePlanButton(true);
        } else {
          setHidePlanButton(false);
          let buttonType = "Upgrade";

          if (allowedPremiumIds.includes(planId)) {
            if (validityDate) {
              const validDate = new Date(validityDate);
              const currentDate = new Date();
              if (validDate.getTime() > currentDate.getTime()) {
                buttonType = "Add-On";
              } else {
                buttonType = "Renew";
              }
            } else {
              buttonType = "Upgrade";
            }
          }
          setButtonText(buttonType);
        }
      } catch (e) {
        console.error("Error loading user info/determining button type:", e);
        setButtonText("Upgrade");
      }
    };
    loadUserInfo();
  }, []);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchAllData = async (orderBy = "1", pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setIsInitialLoading(true);
      setIsProfilesLoading(true);
      setPage(1);
      setHasMorePages(true);
    }

    try {
      const [profileInterests, vysassistRes, response] = await Promise.all([
        pageNum === 1 ? fetchProfileInterests() : Promise.resolve(null),
        pageNum === 1 ? fetchVysassistRequests() : Promise.resolve(null),
        fetchProfiles(20, pageNum, orderBy),
      ]);

      if (pageNum === 1) {
        // ✅ Fix: fetchProfileInterests already returns the profiles array from data.profiles
        if (profileInterests && Array.isArray(profileInterests)) {
          setProfiles(profileInterests);
        } else {
          setProfiles([]);
        }

        if (vysassistRes) setVysassistData(vysassistRes);
      }

      // Check if API returned profiles successfully
      if (
        response &&
        (response.Status === 1 || response.status === "1") &&
        Array.isArray(response.profiles) &&
        response.profiles.length > 0
      ) {
        const newProfiles = response.profiles;
        const total = response.total_count || newProfiles.length;
        setTotalCount(total);

        setMatchingProfilesList((prev) => {
          const updated = isLoadMore ? [...prev, ...newProfiles] : newProfiles;
          setHasMorePages(updated.length < total);
          return updated;
        });
        setPage(pageNum);
      } else {
        // API returned Status: 0 / "No matching records"
        if (!isLoadMore) {
          setMatchingProfilesList([]);
          setTotalCount(0);
        }
        setHasMorePages(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (!isLoadMore) {
        setMatchingProfilesList([]);
        setTotalCount(0);
      }
      setHasMorePages(false);
    } finally {
      setIsProfilesLoading(false);
      setIsInitialLoading(false);
      setLoadingMore(false);
    }
  };


  // ✅ Fixed useEffect - fetch only once on mount
  useEffect(() => {
    fetchAllData(getOrderBy(), 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Fixed navigation focus effect
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (searchProfileId.length === 0) {
        fetchAllData(getOrderBy(), 1, false);
      }
    });
    return unsubscribe;
  }, [navigation, searchProfileId, getOrderBy]);

  // Load More Functionality for Matching Profiles
  const handleLoadMoreProfiles = () => {
    if (
      !isProfilesLoading &&
      !loadingMore &&
      hasMorePages &&
      searchProfileId.length === 0
    ) {
      fetchAllData(getOrderBy(), page + 1, true);
    }
  };

  // ── Sort toggle ──────────────────────────────────────────────────────────
  const toggleSwitch = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    const newOrderBy = newState ? "2" : "1";
    if (searchProfileId.length > 0) {
      await handleSearchPress(searchProfileId, newOrderBy);
    } else {
      await fetchAllData(newOrderBy, 1, false);
    }
  };

  // ── Search ───────────────────────────────────────────────────────────────
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearchPress = async (pid, orderBy = null, isLoadMore = false) => {
    if (!pid || pid.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const orderByValue = orderBy || getOrderBy();
    const pageToFetch = isLoadMore ? searchPage + 1 : 1;

    try {
      if (isLoadMore) setSearchLoadingMore(true);
      else setIsSearching(true);

      const response = await Search_By_profileId_matchingProfile(pid, orderByValue, pageToFetch);

      if (
        response &&
        (response.Status === 1 || response.status === "1") &&
        Array.isArray(response.profiles) &&
        response.profiles.length > 0
      ) {
        const total = response.total_count || response.profiles.length;
        setSearchResults((prev) =>
          isLoadMore ? [...(prev || []), ...response.profiles] : response.profiles
        );
        setTotalCount(total);
        setSearchPage(pageToFetch);
        const loadedCount = isLoadMore ? (searchResults?.length || 0) + response.profiles.length : response.profiles.length;
        setSearchHasMore(loadedCount < total);
      } else {
        // Handles Status: 0 / "No matching records"
        if (!isLoadMore) {
          setSearchResults([]);
          setTotalCount(0);
        }
        setSearchHasMore(false);
      }
    } catch (error) {
      if (!isLoadMore) {
        setSearchResults([]);
        setTotalCount(0);
      }
    } finally {
      setIsSearching(false);
      setSearchLoadingMore(false);
    }
  };

  const handleLoadMoreSearch = () => {
    if (!searchLoadingMore && searchHasMore && searchProfileId.length > 0) {
      handleSearchPress(searchProfileId, getOrderBy(), true);
    }
  };

  const debouncedSearch = useCallback(
    debounce((text, orderBy) => handleSearchPress(text, orderBy), DEBOUNCE_DELAY),
    []
  );

  // ── Navigation helpers ───────────────────────────────────────────────────
  const handleViewProfile = async (viewedProfileId) => {
    const success = await logProfileVisit(viewedProfileId);
    if (success) {
      navigation.navigate("ProfileDetails", {
        viewedProfileId,
        interestParam: 1,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to log profile visit.",
        position: "top",
      });
    }
  };

  const handlePress = async (profile_to) => {
    try {
      const result = await createOrRetrieveChat(profile_to);
      await AsyncStorage.setItem("chat_created", JSON.stringify(result.created));
      await AsyncStorage.setItem("chat_room_id_name", result.room_id_name);
      await AsyncStorage.setItem("chat_statue", JSON.stringify(result.statue));
      navigation.navigate("Message");
    } catch (error) {
      console.error("API call failed:", error);
    }
  };

  const handleFilterPress = () => navigation.navigate("MatchingProfileSearch");
  const handleFilterPressMenu = () => navigation.navigate("MyVisitors");
  const handleFilterPressViewedProfiles = () => navigation.navigate("ViewedProfiles");

  // ── Slider helpers ───────────────────────────────────────────────────────
  const combinedData = useMemo(
    () => [
      ...(profiles || []).map((item) => ({ ...item, type: "interest" })),
      ...(vysassistData || []).map((item) => ({ ...item, type: "vysassist" })),
    ],
    [profiles, vysassistData]
  );

  const handleSlideNext = () => {
    if (currentSlideIndex < combinedData.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * (CARD_WIDTH + 16),
        animated: true,
      });
      setCurrentSlideIndex(nextIndex);
    }
  };

  const handleSlidePrev = () => {
    if (currentSlideIndex > 0) {
      const prevIndex = currentSlideIndex - 1;
      flatListRef.current?.scrollToOffset({
        offset: prevIndex * (CARD_WIDTH + 16),
        animated: true,
      });
      setCurrentSlideIndex(prevIndex);
    }
  };

  const handleScrollEnd = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    setCurrentSlideIndex(Math.round(contentOffsetX / CARD_WIDTH));
  };


  // ── Slider card renderers ────────────────────────────────────────────────
  // Update the renderInterestItem function to handle the image URL correctly
  const renderInterestItem = ({ item, index }) => {
    return (
      <View style={styles.cardContainer} key={index}>
        <View style={styles.cardStyle}>
          <View style={styles.ProfileContentFlex}>
            <InterestProfileImage uri={item.int_Profile_img} />
            <View style={styles.profileContent}>
              <Text style={styles.nameStyle} numberOfLines={1}>
                {item.int_profile_name
                  ? item.int_profile_name.length > 12
                    ? item.int_profile_name.substring(0, 12) + "..."
                    : item.int_profile_name
                  : "N/A"}
                {` (${item.int_profileid})`}
              </Text>
              <Text style={styles.ageStyle}>{item.int_profile_age} yrs</Text>
            </View>
          </View>

          <Text style={styles.interestedText}>
            {item.int_profile_notes || "I am interested in your profile. If you are interested in my profile, please contact me."}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() => handleViewProfile(item.int_profileid)}
              activeOpacity={0.85}
            >
              <Text style={styles.viewProfileBtnText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageBtn}
              onPress={() => handlePress(item.int_profileid)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="chat-outline" size={15} color="#A00014" style={{ marginRight: 5 }} />
              <Text style={styles.messageBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Update the renderVysassistItem to match the interest design
  const renderVysassistItem = ({ item, index }) => {

    return (
      <View style={styles.cardContainer} key={`vysassist-${index}`}>
        <View style={styles.cardStyle}>
          <View style={styles.ProfileContentFlex}>
            <View style={styles.profileContent}>
              <Text style={styles.nameStyle} numberOfLines={1}>

                {` (${item.profile_from})`}
              </Text>

            </View>
          </View>

          <Text style={styles.interestedText}>
            {item.to_message || "I am interested in your profile. If you are interested in my profile, please contact me."}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() => handleViewProfile(item.profile_from)}
              activeOpacity={0.85}
            >
              <Text style={styles.viewProfileBtnText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderSliderItem = ({ item, index }) => {
    if (!item) return null;
    return item.type === "vysassist"
      ? renderVysassistItem({ item, index })
      : renderInterestItem({ item, index });
  };

  const currentCardType = combinedData[currentSlideIndex]?.type;
  const sliderHeaderText =
    currentCardType === "vysassist"
      ? "New VysAssist Request"
      : "New Interest Received";

  // ── App header ────────────────────────────────────────────────────────────
  const unreadNotificationCount = combinedData.length;



  const renderAppHeader = () => (
    <LinearGradient
      colors={["#9B061B", "#52000A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.appHeader}
    >
      {/* Top Row: Logo + Notification */}
      <View style={styles.topHeaderRow}>
        <View style={styles.logoBadgeContainer}>
          <Image source={VysyamalaLogo} style={styles.appLogo} resizeMode="contain" />
        </View>
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => navigation.navigate("Notifications")}
          activeOpacity={0.7}
        >
          <MaterialIcons name="notifications-none" size={24} color="#FFFFFF" />
          {unreadNotificationCount > 0 && (
            <View style={styles.notificationBadge} />
          )}
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <Text style={styles.greetingName}>
        Hi, {userName || "User"}
      </Text>

      {/* Search Bar with Filters */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color="rgba(255,255,255,0.7)" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            value={searchProfileId}
            onChangeText={handleSearchChange}
            placeholder="Search by profile ID or Name"
            placeholderTextColor="rgba(255,255,255,0.55)"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchProfileId.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchProfileId("");
                setSearchResults([]);
                setTotalCount(0);
                fetchMatchingProfilesOnly(getOrderBy(), 1);
              }}
            >
              <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Options - Show when searching */}


        {/* Search results count - Show when searching */}
        {searchProfileId.length > 0 && searchResults && searchResults.length > 0 && (
          <View style={styles.searchResultsCount}>
            <Text style={styles.searchResultsCountText}>
              Found {searchResults.length} {searchResults.length === 1 ? 'profile' : 'profiles'}
            </Text>
          </View>
        )}
      </View>

      {/* Interests & Requests Dropdown */}
      {combinedData.length > 0 && (
        <View style={styles.sliderSectionContainer}>
          <TouchableOpacity
            style={styles.bannerHeaderRow}
            onPress={toggleBannerExpand}
            activeOpacity={0.8}
          >
            <View style={styles.bannerHeaderLeft}>
              <View style={styles.heartIconCircle}>
                <MaterialCommunityIcons name="heart" size={14} color="#52000A" />
              </View>
              <Text style={styles.newInterest}>
                {isBannerExpanded ? sliderHeaderText : "Interests & Requests"}
              </Text>
              {!isBannerExpanded && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{combinedData.length} New</Text>
                </View>
              )}
            </View>

            <View style={styles.expandIconButton}>
              <View style={styles.countCircle}>
                <Text style={styles.countCircleText}>{combinedData.length}</Text>
              </View>
              <MaterialIcons
                name={isBannerExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={20}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>

          {isBannerExpanded && (
            <View style={styles.expandedContentContainer}>
              <View style={styles.sliderRow}>
                <TouchableOpacity
                  onPress={handleSlidePrev}
                  disabled={currentSlideIndex === 0}
                  style={[styles.arrowButton, currentSlideIndex === 0 && styles.arrowDisabled]}
                >
                  <MaterialIcons name="chevron-left" size={28}
                    color={currentSlideIndex === 0 ? "rgba(255,255,255,0.3)" : "#fff"} />
                </TouchableOpacity>

                <FlatList
                  ref={flatListRef}
                  horizontal
                  snapToInterval={CARD_WIDTH + 16}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  data={combinedData}
                  renderItem={renderSliderItem}
                  keyExtractor={(item, index) =>
                    item.type === "vysassist" ? `vysassist-${item.id}` : `interest-${index}`
                  }
                  contentContainerStyle={styles.interestList}
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleScrollEnd}
                  scrollEventThrottle={16}
                  style={styles.sliderFlatList}
                  getItemLayout={(data, index) => ({
                    length: CARD_WIDTH + 16,
                    offset: (CARD_WIDTH + 16) * index,
                    index,
                  })}
                />

                <TouchableOpacity
                  onPress={handleSlideNext}
                  disabled={currentSlideIndex === combinedData.length - 1}
                  style={[styles.arrowButton,
                  currentSlideIndex === combinedData.length - 1 && styles.arrowDisabled]}
                >
                  <MaterialIcons name="chevron-right" size={28}
                    color={currentSlideIndex === combinedData.length - 1
                      ? "rgba(255,255,255,0.3)" : "#fff"} />
                </TouchableOpacity>
              </View>

              <View style={styles.dotsContainer}>
                {combinedData.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      flatListRef.current?.scrollToOffset({
                        offset: index * (CARD_WIDTH + 16),
                        animated: true,
                      });
                      setCurrentSlideIndex(index);
                    }}
                    style={[styles.dot, currentSlideIndex === index && styles.activeDot]}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Bottom info bar: ID | Plan | Valid Date */}
      <View style={styles.bottomInfoBar}>
        <Text style={styles.bottomInfoId}>{userProfileId || "N/A"}</Text>
        <Text style={styles.bottomInfoSep}>|</Text>
        <Text style={styles.bottomInfoPlan}>{planName || "N/A"}</Text>
        <Text style={styles.bottomInfoSep}>|</Text>
        <Text style={styles.bottomInfoDate}>{validTillDate || "N/A"}</Text>
      </View>
    </LinearGradient>
  );

  // ── Menu Cards Dynamic Rendering ──────────────────────────────────────────
  const renderQuickActionsMenu = () => {
    const actions = [
      {
        icon: "visibility",
        isSvg: false,
        label: "Viewed Profiles",
        onPress: handleFilterPressViewedProfiles,
        show: true,
      },
      {
        icon: "people-outline",
        isSvg: false,
        label: "My Visitors",
        onPress: handleFilterPressMenu,
        show: true,
      },
      {
        isSvg: true,
        label: `${buttonText}\nPlan`,
        onPress: () => navigation.navigate("MembershipPlan"),
        show: !hidePlanButton,
      },
      {
        icon: "photo-library",
        isSvg: false,
        label: "Gallery",
        onPress: () => navigation.navigate("GalleryResults"),
        show: true,
      },
    ].filter((action) => action.show);

    return (
      <View style={styles.menuCardsContainer}>
        {actions.map((action, i) => (
          <View key={i} style={styles.menuCardItem}>
            <TouchableOpacity
              style={styles.pillButton}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              {action.isSvg ? (
                <CrownOutlineIcon color="#A00014" size={24} />
              ) : (
                <MaterialIcons name={action.icon} size={28} color="#A00014" />
              )}
            </TouchableOpacity>
            <Text style={styles.pillLabel}>{action.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  // ── Sticky matching header ────────────────────────────────────────────────
  const renderMatchingHeader = () => (
    <View style={styles.stickyHeader}>
      <View style={styles.matchingContainer}>
        <Text style={styles.matching}>
          {"Matching Profiles "}
          <Text style={styles.matchNumber}>
            ({searchProfileId.length > 0 ? (searchResults?.length || 0) : totalCount})
          </Text>
        </Text>
        <Text style={styles.sortByText}>Sort by Date:</Text>
        <Switch
          style={styles.toggleSwitchcontainer}
          trackColor={{ false: "#767577", true: "#A00014" }}
          thumbColor={isEnabled ? "#DEB55D" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>

      <View style={styles.viewToggleRow}>
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            onPress={() => setViewMode("list")}
            style={[
              styles.viewToggleButton,
              viewMode === "list" && styles.activeViewButton,
            ]}
          >
            <MaterialIcons
              name="view-list"
              size={24}
              color={
                viewMode === "list"
                  ? "#A00014"
                  : "#888888"
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode("grid")}
            style={[
              styles.viewToggleButton,
              viewMode === "grid" && styles.activeViewButton,
            ]}
          >
            <MaterialIcons
              name="view-module"
              size={24}
              color={
                viewMode === "grid"
                  ? "#A00014"
                  : "#888888"
              }
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFilterPress}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="tune"
            size={23}
            color="#A00014"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderListFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#A00014" />
          <Text style={styles.loadingMoreText}>Loading more profiles…</Text>
        </View>
      );
    }
    if (!hasMorePages && matchingProfilesList?.length > 0 && searchProfileId.length === 0) {
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.endMessage}>No more profiles</Text>
        </View>
      );
    }
    return <View style={{ height: 30 }} />;
  };

  // ── Main FlatList data ────────────────────────────────────────────────────
  const mainData = [
    { type: "appHeader", key: "appHeader" },
    { type: "quickActions", key: "quickActions" },
    { type: "matchingHeader", key: "matchingHeader" },
    { type: "profiles", key: "profiles" },
  ];

  const renderMainItem = ({ item }) => {
    if (item.type === "appHeader") return renderAppHeader();
    if (item.type === "quickActions") return renderQuickActionsMenu();
    if (item.type === "matchingHeader") return renderMatchingHeader();
    if (item.type === "profiles") {
      return (
        <View style={styles.profileCardContainer}>
          <ProfileCard
            data={searchProfileId.length > 0 ? searchResults : matchingProfilesList}
            isSearchMode={searchProfileId.length > 0}
            isLoadingNew={isSearching || (isProfilesLoading && page === 1)}
            orderBy={getOrderBy()}
            viewMode={viewMode}
            onEndReachedMore={
              searchProfileId.length > 0 ? handleLoadMoreSearch : handleLoadMoreProfiles
            }
            loadingMore={searchProfileId.length > 0 ? searchLoadingMore : loadingMore}
            hasMore={searchProfileId.length > 0 ? searchHasMore : hasMorePages}
          />
        </View>
      );
    }
    return null;
  };

  // ── Initial Loading state showing full height Shimmer Skeleton ─────────────
  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <InitialShimmerLoader />
      </SafeAreaView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={mainData}
        renderItem={renderMainItem}
        keyExtractor={(item) => item.key}
        stickyHeaderIndices={[2]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        onEndReached={handleLoadMoreProfiles}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderListFooter}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={false}
        onRequestClose={() => { }}
      />
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6F0",
  },
  flatListContent: {
    flexGrow: 1,
  },

  // ── Shimmer Loading Mock Layout Styles ───────────────────────────────────
  shimmerScreenContainer: {
    flex: 1,
    backgroundColor: "#FAF6F0",
  },
  shimmerHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: "#9B061B",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  shimmerHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shimmerBodyContainer: {
    flex: 1,
    height: height * 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  shimmerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  shimmerProfileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  // ── App header (gradient block) ───────────────────────────────────────────
  appHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  logoBadgeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  appLogo: {
    width: 120,
    height: 32,
  },

  greetingName: {
    fontSize: 21,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 8,
  },

  // ── Search Bar Styles ────────────────────────────────────────────────────
  searchWrapper: {
    width: '100%',
    marginBottom: 16,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 0,
  },

  filterOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
    paddingHorizontal: 2,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    gap: 6,
  },

  filterChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },

  clearFiltersChip: {
    backgroundColor: "rgba(222, 181, 93, 0.3)",
    borderColor: "#DEB55D",
  },

  clearFiltersText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  searchResultsCount: {
    marginTop: 8,
    paddingHorizontal: 4,
  },

  searchResultsCountText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "500",
  },

  // ── Notification Badge ───────────────────────────────────────────────────
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DEB55D",
    borderWidth: 1.5,
    borderColor: "#9B061B",
  },

  // ── Redesigned Menu Cards ──────────────────────────────────────────────────
  menuCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 18,
    backgroundColor: "transparent",
  },
  menuCardItem: {
    alignItems: "center",
    width: (width - 48) / 4,
  },
  pillButton: {
    width: 68,
    height: 42,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.05)",
  },
  pillLabel: {
    marginTop: 8,
    fontWeight: "400",
    textAlign: "center",
    fontSize: 11,
    color: "#888888",
  },

  // ── Integrated Slider Banner ──────────────────────────────────────────────
  sliderSectionContainer: {
    width: "100%",
    paddingVertical: 4,
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  bannerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  heartIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DEB55D",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  newInterest: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  badgeCount: {
    backgroundColor: "#DEB55D",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeCountText: {
    color: "#52000A",
    fontSize: 10,
    fontWeight: "800",
  },
  countCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#DEB55D",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  countCircleText: {
    color: "#52000A",
    fontSize: 11,
    fontWeight: "800",
  },
  expandIconButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandedContentContainer: {
    marginTop: 4,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  arrowButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  sliderFlatList: {
    flex: 1,
    overflow: "visible",
  },
  interestList: {
    paddingVertical: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#FFFFFF",
    width: 20,
    borderRadius: 4,
  },

  // ── Slider cards ──────────────────────────────────────────────────────────
  cardContainer: {
    justifyContent: "center",
    paddingVertical: 4,
  },
  cardStyle: {
    backgroundColor: "#FFFFFF",
    width: CARD_WIDTH,
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 6,
    minHeight: 140,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  ProfileContentFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 8,
  },
  ProfileImgStyle: {
    marginRight: 12,
    width: 56,
    height: 66,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
  },
  profileContent: {
    flex: 1,
    justifyContent: "center",
  },
  nameStyle: {
    color: "#212121",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  ageStyle: {
    color: "#757575",
    fontSize: 12,
  },
  interestedText: {
    color: "#212121",
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
    paddingVertical: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  viewProfileBtn: {
    flex: 1,
    backgroundColor: "#A00014",
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  viewProfileBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  messageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#A00014",
    backgroundColor: "#FFFFFF",
  },
  messageBtnText: {
    color: "#A00014",
    fontSize: 13,
    fontWeight: "700",
  },
  btn: {
    alignSelf: "center",
    borderRadius: 6,
  },
  login: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 1,
  },
  linearGradient: {
    borderRadius: 5,
    justifyContent: "center",
    padding: 10,
    marginRight: 15,
  },
  vysassistRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  vysassistLeft: {
    backgroundColor: "#F2EBE1",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    justifyContent: "center",
    minWidth: 90,
  },
  fromLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#757575",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  fromProfileId: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 6,
  },
  dateText: {
    fontSize: 12,
    color: "#757575",
  },
  vysassistRight: {
    flex: 1,
    justifyContent: "space-between",
    paddingLeft: 4,
  },
  vysassistMessage: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#212121",
    marginBottom: 8,
    lineHeight: 18,
    flexShrink: 1,
  },

  // ── Sticky matching header ─────────────────────────────────────────────────
  stickyHeader: {
    backgroundColor: "#FAF6F0",
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  matchingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 15,
    marginBottom: 6,
  },
  matching: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  matchNumber: {
    color: "#A00014",
  },
  sortByText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A00014",
    marginHorizontal: 6,
  },
  toggleSwitchcontainer: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  viewToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFE7DC",
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    padding: 8,
    borderRadius: 6,
  },
  activeViewButton: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  viewToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#EFE7DC",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  // ── Profile cards container ───────────────────────────────────────────────
  profileCardContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 13,
    color: "#757575",
    fontWeight: "600",
  },
  endMessage: {
    fontSize: 13,
    color: "#757575",
    fontStyle: "italic",
  },

  // ── Bottom info bar ──────────────────────────────────────────────────────
  bottomInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  bottomInfoId: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  bottomInfoSep: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    marginHorizontal: 4,
  },
  bottomInfoPlan: {
    color: "#DEB55D",
    fontSize: 13,
    fontWeight: "600",
  },
  bottomInfoDate: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
});

export default HomeWithToast;