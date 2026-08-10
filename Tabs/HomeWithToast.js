import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ImageBackground,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Modal,
  Switch,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
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
} from "../CommonApiCall/CommonApiCall";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";
import { Colors, rs } from "../Reusable/Theme"; // ← theme tokens

const { width } = Dimensions.get("window");
const DEBOUNCE_DELAY = 300;
const MIN_SEARCH_LENGTH = 1;

export const HomeWithToast = () => {
  // ── Slider / interest state ──────────────────────────────────────────────
  const [profiles, setProfiles] = useState([]);
  const [vysassistData, setVysassistData] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef(null);
  const CARD_WIDTH = width - 80;

  // ── User / member info ───────────────────────────────────────────────────
  const [userName, setUserName] = useState("");
  const [userProfileId, setUserProfileId] = useState("");
  const [memberLabel, setMemberLabel] = useState("");
  const [memberSub, setMemberSub] = useState("");

  // ── Search / sort / view ─────────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState([]);
  const [searchProfileId, setSearchProfileId] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isProfilesLoading, setIsProfilesLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false); // false = sort by match, true = sort by date
  const [viewMode, setViewMode] = useState("list");

  const navigation = useNavigation();
  const getOrderBy = () => (isEnabled ? "2" : "1");

  // ── Load user info from AsyncStorage ────────────────────────────────────
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const name = await AsyncStorage.getItem("loginuser_name");
        const pid = await AsyncStorage.getItem("loginuser_profileId");
        const planId = parseInt(
          (await AsyncStorage.getItem("current_plan_id")) || "0"
        );
        const validTill = await AsyncStorage.getItem("valid_till_date");
        const contactViews = await AsyncStorage.getItem("contact_views_left");

        if (name) setUserName(name);
        if (pid) setUserProfileId(pid);

        // Derive member label from plan
        const premiumIds = [1, 2, 3, 10, 11, 13, 14, 15, 16, 17];
        if (premiumIds.includes(planId)) {
          if (planId === 16) {
            setMemberLabel("PLATINUM MEMBER");
          } else if ([13, 14, 15, 17].includes(planId)) {
            setMemberLabel("GOLD MEMBER");
          } else {
            setMemberLabel("PREMIUM MEMBER");
          }
          const views = contactViews ? `${contactViews} contact views left` : "";
          const till = validTill
            ? `till ${new Date(validTill).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`
            : "";
          setMemberSub([views, till].filter(Boolean).join(" · "));
        } else {
          setMemberLabel("FREE MEMBER");
          setMemberSub("Upgrade to connect with more profiles");
        }
      } catch (e) {
        console.error("Error loading user info:", e);
      }
    };
    loadUserInfo();
  }, []);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchAllData = async (orderBy = "1") => {
    setIsInitialLoading(true);
    setIsProfilesLoading(true);
    try {
      const [profileInterests, vysassistRes, response] = await Promise.all([
        fetchProfileInterests(),
        fetchVysassistRequests(),
        fetchProfiles(20, 1, orderBy),
      ]);
      setProfiles(profileInterests || []);
      setVysassistData(vysassistRes || []);
      setTotalCount(response?.total_count || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to fetch data.",
        position: "top",
      });
    } finally {
      setIsProfilesLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(getOrderBy());
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (searchProfileId.length === 0) fetchAllData(getOrderBy());
    });
    return unsubscribe;
  }, [navigation, searchProfileId]);

  // ── Sort toggle ──────────────────────────────────────────────────────────
  const toggleSwitch = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    const newOrderBy = newState ? "2" : "1";
    if (searchProfileId.length > 0) {
      await handleSearchPress(searchProfileId, newOrderBy);
    } else {
      await fetchAllData(newOrderBy);
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

  const handleSearchPress = async (pid, orderBy = null) => {
    if (!pid || pid.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const orderByValue = orderBy || getOrderBy();
    try {
      setIsSearching(true);
      const response = await Search_By_profileId_matchingProfile(
        pid,
        orderByValue
      );
      if (response.Status === 1 && response.profiles) {
        setSearchResults(response.profiles);
        setTotalCount(response.total_count || response.profiles.length);
      } else {
        setSearchResults([]);
        setTotalCount(0);
      }
    } catch (error) {
      setSearchResults([]);
      setTotalCount(0);
      Toast.show({
        type: "error",
        text1: "Search Error",
        text2: "Failed to fetch search results",
        position: "top",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((text, orderBy) => handleSearchPress(text, orderBy), DEBOUNCE_DELAY),
    []
  );

  const handleSearchInput = (text) => {
    setSearchProfileId(text);
    if (text.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    debouncedSearch(text, getOrderBy());
  };

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
  const renderInterestItem = ({ item, index }) => (
    <View style={styles.cardContainer} key={index}>
      <View style={styles.cardStyle}>
        <View style={styles.ProfileContentFlex}>
          <Image
            style={styles.ProfileImgStyle}
            source={{
              uri: item.int_Profile_img
                ? item.int_Profile_img
                : `${config.apiUrl}/media/default_photo_protect.png`,
            }}
          />
          <View style={styles.profileContent}>
            <Text style={styles.nameStyle}>
              {item.int_profile_name
                ? item.int_profile_name.length > 10
                  ? item.int_profile_name.substring(0, 10) + "..."
                  : item.int_profile_name
                : "N/A"}
              {` (${item.int_profileid})`}
            </Text>
            <Text style={styles.ageStyle}>{item.int_profile_age} yrs</Text>
          </View>
        </View>
        <Text style={styles.interestedText}>
          I am interested in your profile. If you are interested in my profile,
          please contact me.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => handleViewProfile(item.int_profileid)}
          >
            <LinearGradient
              colors={["#BD1225", "#FF4050"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.linearGradient}
            >
              <Text style={styles.login}>View Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePress(item.int_profileid)}>
            <View style={styles.loginContainer}>
              <Text style={styles.cancel}>Message</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderVysassistItem = ({ item, index }) => (
    <View style={styles.cardContainer} key={`vysassist-${index}`}>
      <View style={styles.cardStyle}>
        <View style={styles.vysassistRow}>
          <View style={styles.vysassistLeft}>
            <Text style={styles.fromLabel}>FROM</Text>
            <Text style={styles.fromProfileId}>{item.profile_from}</Text>
            <View style={styles.divider} />
            <Text style={styles.dateText}>
              {new Date(item.req_datetime).toISOString().split("T")[0]}
            </Text>
          </View>
          <View style={styles.vysassistRight}>
            <Text style={styles.vysassistMessage}>"{item.to_message}"</Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => handleViewProfile(item.profile_from)}
            >
              <LinearGradient
                colors={["#BD1225", "#FF4050"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.linearGradient}
              >
                <Text style={styles.login}>View Details</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

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

  // ── App header (greeting + search + member banner + quick actions) ────────
  const renderAppHeader = () => (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryGradientEnd || "#4A000A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.appHeader}
    >
      {/* Greeting row */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greetingName}>
            Vanakkam, {userName || ""}
          </Text>
          <Text style={styles.greetingId}>Profile ID {userProfileId}</Text>
        </View>
      </View>

      {/* Search bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={handleFilterPress}
        activeOpacity={0.85}
      >
        <MaterialIcons
          name="search"
          size={18}
          color="rgba(255,255,255,0.6)"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.searchPlaceholder}>
          Search by name, ID, gothram or star
        </Text>
      </TouchableOpacity>

      {/* Member banner */}
      {memberLabel ? (
        <TouchableOpacity
          style={styles.memberBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("MembershipPlan")}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.memberTitle}>⭐ {memberLabel}</Text>
            {memberSub ? (
              <Text style={styles.memberSubText}>{memberSub}</Text>
            ) : null}
          </View>
          <Text style={styles.upgradeArrow}>Upgrade →</Text>
        </TouchableOpacity>
      ) : null}

      {/* Quick action icons */}
      <View style={styles.quickActions}>
        {[
          {
            icon: "tune",
            label: "Advanced\nSearch",
            onPress: handleFilterPress,
          },
          {
            icon: "favorite-border",
            label: "Horoscope\nMatch",
            onPress: () => navigation.navigate("HoroscopeMatch"),
          },
          {
            icon: "workspace-premium",
            label: "Upgrade\nPlan",
            onPress: () => navigation.navigate("MembershipPlan"),
          },
          {
            icon: "dashboard",
            label: "My\nDashboard",
            onPress: () => navigation.navigate("Dashboard"),
          },
        ].map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.actionBtn}
            onPress={action.onPress}
          >
            <View style={styles.actionIconCircle}>
              <MaterialIcons name={action.icon} size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );

  // ── Interest/VysAssist banner ─────────────────────────────────────────────
  const renderBanner = () => (
    <View style={styles.heartinBg}>
      <ImageBackground
        style={styles.heartinBg}
        source={require("../assets/img/HeartinBg.png")}
      >
        <View style={styles.bannerHeaderRow}>
          <Image
            style={styles.MessageImg}
            source={require("../assets/img/MessageImg.png")}
          />
          <Text style={styles.newInterest}>{sliderHeaderText}</Text>
        </View>

        <View style={styles.sliderRow}>
          <TouchableOpacity
            onPress={handleSlidePrev}
            disabled={currentSlideIndex === 0}
            style={[
              styles.arrowButton,
              currentSlideIndex === 0 && styles.arrowDisabled,
            ]}
          >
            <MaterialIcons
              name="chevron-left"
              size={32}
              color={
                currentSlideIndex === 0 ? "rgba(255,255,255,0.3)" : "#fff"
              }
            />
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
              item.type === "vysassist"
                ? `vysassist-${item.id}`
                : `interest-${index}`
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
            style={[
              styles.arrowButton,
              currentSlideIndex === combinedData.length - 1 &&
                styles.arrowDisabled,
            ]}
          >
            <MaterialIcons
              name="chevron-right"
              size={32}
              color={
                currentSlideIndex === combinedData.length - 1
                  ? "rgba(255,255,255,0.3)"
                  : "#fff"
              }
            />
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
      </ImageBackground>
    </View>
  );

  // ── Sticky matching header ────────────────────────────────────────────────
  const renderMatchingHeader = () => (
    <View style={styles.stickyHeader}>
      <View style={styles.matchingContainer}>
        <Text style={styles.matching}>
          {"Matching Profiles "}
          <Text style={styles.matchNumber}>
            ({searchProfileId.length > 0 ? searchResults.length : totalCount})
          </Text>
        </Text>
        <Text style={styles.sortByText}>Sort by Date:</Text>
        <Switch
          style={styles.toggleSwitchcontainer}
          trackColor={{ false: "#767577", true: Colors.primary }}
          thumbColor={isEnabled ? Colors.gold : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <MaterialIcons
            name="search"
            size={18}
            color={Colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Search profile ID"
            value={searchProfileId}
            onChangeText={handleSearchInput}
            placeholderTextColor={Colors.textMuted}
            underlineColorAndroid="transparent"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity style={styles.filterIcon} onPress={handleFilterPress}>
          <MaterialIcons name="filter-list" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

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
            color={viewMode === "list" ? Colors.primary : Colors.textMuted}
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
            color={viewMode === "grid" ? Colors.primary : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Main FlatList data ────────────────────────────────────────────────────
  const mainData = [
    { type: "appHeader", key: "appHeader" },
    { type: "banner", key: "banner" },
    { type: "matchingHeader", key: "matchingHeader" },
    { type: "profiles", key: "profiles" },
  ];

  const renderMainItem = ({ item }) => {
    if (item.type === "appHeader") return renderAppHeader();
    if (item.type === "banner")
      return combinedData.length > 0 ? renderBanner() : null;
    if (item.type === "matchingHeader") return renderMatchingHeader();
    if (item.type === "profiles") {
      return (
        <View style={styles.profileCardContainer}>
          <ProfileCard
            searchProfiles={
              searchProfileId.length > 0 ? searchResults : null
            }
            isLoadingNew={isSearching || isProfilesLoading}
            orderBy={getOrderBy()}
            viewMode={viewMode}
          />
        </View>
      );
    }
    return null;
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your matches...</Text>
        </View>
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
        stickyHeaderIndices={[2]} // matchingHeader sticks (index 2)
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        ListFooterComponent={<View style={{ height: 20 }} />}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={false}
        onRequestClose={() => {}}
      />
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flatListContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textMuted,
  },

  // ── App header (gradient block) ───────────────────────────────────────────
  appHeader: {
    paddingHorizontal: rs(14, 16, 18),
    paddingTop: rs(14, 16, 18),
    paddingBottom: rs(18, 22, 26),
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  greetingName: {
    fontSize: rs(22, 25, 28),
    fontWeight: "800",
    color: Colors.textLight,
    letterSpacing: -0.5,
  },
  greetingId: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  searchPlaceholder: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
  },
  memberBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
  },
  memberTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  memberSubText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
  },
  upgradeArrow: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionBtn: {
    alignItems: "center",
    flex: 1,
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
    fontWeight: "600",
  },

  // ── Banner (interest/vysassist slider) ────────────────────────────────────
  heartinBg: {
    width: "100%",
    backgroundColor: "#ED1E24",
    paddingVertical: 4,
  },
  bannerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 2,
  },
  MessageImg: {
    width: 22,
    height: 22,
    resizeMode: "contain",
    marginRight: 8,
  },
  newInterest: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
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
  },
  interestList: {
    paddingVertical: 6,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 20,
    borderRadius: 4,
  },

  // ── Slider cards ──────────────────────────────────────────────────────────
  cardContainer: {
    justifyContent: "center",
  },
  cardStyle: {
    backgroundColor: Colors.card,
    width: width - 80,
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  ProfileContentFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 8,
  },
  ProfileImgStyle: {
    marginRight: 10,
    width: 70,
    height: 70,
    borderRadius: 0,
  },
  profileContent: { flex: 1 },
  nameStyle: {
    color: Colors.textDark,
    fontSize: 18,
    fontWeight: "600",
  },
  ageStyle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  interestedText: {
    color: Colors.textDark,
    fontSize: 12,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
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
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8.5,
    letterSpacing: 1,
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
    alignItems: "stretch",
  },
  vysassistLeft: {
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    padding: 8,
    marginRight: 10,
    justifyContent: "center",
    minWidth: 80,
  },
  fromLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  fromProfileId: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  vysassistRight: {
    flex: 1,
    justifyContent: "space-between",
  },
  vysassistMessage: {
    fontSize: 13,
    fontStyle: "italic",
    color: Colors.textDark,
    marginBottom: 8,
    lineHeight: 20,
    flexShrink: 1,
  },

  // ── Sticky matching header ─────────────────────────────────────────────────
  stickyHeader: {
    backgroundColor: Colors.background,
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    color: Colors.textDark,
  },
  matchNumber: {
    color: Colors.primary,
  },
  sortByText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    marginHorizontal: 6,
  },
  toggleSwitchcontainer: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 6,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  input: {
    flex: 1,
    color: Colors.textDark,
    padding: 10,
    backgroundColor: "transparent",
  },
  searchIcon: {
    paddingLeft: 10,
  },
  filterIcon: {
    position: "absolute",
    right: 20,
    bottom: 12,
  },
  viewToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface1,
    borderRadius: 8,
    padding: 2,
    marginHorizontal: 10,
    marginTop: 2,
    alignSelf: "flex-start",
  },
  viewToggleButton: {
    padding: 8,
    borderRadius: 6,
  },
  activeViewButton: {
    backgroundColor: Colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },

  // ── Profile cards container ───────────────────────────────────────────────
  profileCardContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 4,
  },
});

export default HomeWithToast;