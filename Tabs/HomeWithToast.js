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
  ScrollView,
} from "react-native";

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ProfileCard } from "../Components/HomeTab/MatchingProfiles/ProfileCard";
import { SuggestedProfiles } from "../Components/HomeTab/SuggestedProfiles";
import { VysyamalaAd } from "../Components/HomeTab/VysyamalaAd";
import {
  fetchProfileInterests,
  logProfileVisit,
  createOrRetrieveChat,
  Search_By_profileId_matchingProfile,
  fetchProfiles,
  fetchVysassistRequests
} from "../CommonApiCall/CommonApiCall";
import { FeaturedProfiles } from "../Components/HomeTab/FeaturedProfiles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProfileNotFound from "../Components/ProfileNotFound/ProfileNotFound";
import OfferHeaderBg from "../assets/img/OfferHeader.png";
import config from "../API/Apiurl";

const { width, height } = Dimensions.get("window");
const DEBOUNCE_DELAY = 300;
const MIN_SEARCH_LENGTH = 1;

export const HomeWithToast = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [profiles, setProfiles] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchProfileId, setSearchProfileId] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isInterestsLoading, setIsInterestsLoading] = useState(false);
  const [isProfilesLoading, setIsProfilesLoading] = useState(false);
  const [vysassistData, setVysassistData] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // State to control visibility of the top red banner based on scroll
  const [showBanner, setShowBanner] = useState(true);

  const flatListRef = useRef(null);
  // Toggle switch - false = "1" (default), true = "2" (sort by date)
  const [isEnabled, setIsEnabled] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const navigation = useNavigation();
  const getOrderBy = () => isEnabled ? "2" : "1";

  const CARD_WIDTH = width - 80;

  const handleScrollVertical = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Hide top red banner when scrolled down beyond 50px
    if (offsetY > 50) {
      if (showBanner) setShowBanner(false);
    } else {
      if (!showBanner) setShowBanner(true);
    }
  };

  const handleSlideNext = () => {
    if (currentSlideIndex < combinedData.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * (CARD_WIDTH + 16),
        animated: true
      });
      setCurrentSlideIndex(nextIndex);
    }
  };

  const handleSlidePrev = () => {
    if (currentSlideIndex > 0) {
      const prevIndex = currentSlideIndex - 1;
      flatListRef.current?.scrollToOffset({
        offset: prevIndex * (CARD_WIDTH + 16),
        animated: true
      });
      setCurrentSlideIndex(prevIndex);
    }
  };

  const handleScrollEnd = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CARD_WIDTH);
    setCurrentSlideIndex(index);
  };

  const fetchAllData = async (orderBy = "1") => {
    setIsInitialLoading(true);
    setIsInterestsLoading(true);
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
        position: "bottom",
      });
    } finally {
      setIsInterestsLoading(false);
      setIsProfilesLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(getOrderBy());
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (searchProfileId.length === 0) {
        fetchAllData(getOrderBy());
      }
    });
    return unsubscribe;
  }, [navigation, fetchAllData, searchProfileId]);

  useEffect(() => {
    setModalVisible(true);
    const timer = setTimeout(() => {
      setModalVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle toggle switch change
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

  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearchPress = async (profileId, orderBy = null) => {
    if (!profileId || profileId.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const orderByValue = orderBy || getOrderBy();

    try {
      setIsSearching(true);
      const response = await Search_By_profileId_matchingProfile(profileId, orderByValue);
      if (response.Status === 1 && response.profiles) {
        setSearchResults(response.profiles);
        setTotalCount(response.total_count || response.profiles.length);
      } else {
        setSearchResults([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Search error:", error.message);
      setSearchResults([]);
      setTotalCount(0);
      Toast.show({
        type: "error",
        text1: "Search Error",
        text2: "Failed to fetch search results",
        position: "bottom",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((text, orderBy) => {
      handleSearchPress(text, orderBy);
    }, DEBOUNCE_DELAY),
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
        position: "bottom",
      });
    }
  };

  const handlePress = async (profile_to) => {
    try {
      const result = await createOrRetrieveChat(profile_to);
      await AsyncStorage.setItem(
        "chat_created",
        JSON.stringify(result.created)
      );
      await AsyncStorage.setItem("chat_room_id_name", result.room_id_name);
      await AsyncStorage.setItem("chat_statue", JSON.stringify(result.statue));
      navigation.navigate("Message");
    } catch (error) {
      console.error("API call failed:", error);
    }
  };

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
                ? (item.int_profile_name.length > 10
                  ? item.int_profile_name.substring(0, 10) + "..."
                  : item.int_profile_name)
                : "N/A"
              }{` (${item.int_profileid})`}
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

  const handleFilterPress = () => {
    navigation.navigate("MatchingProfileSearch");
  };

  const renderVysassistItem = ({ item, index }) => (
    <View style={styles.cardContainer} key={`vysassist-${index}`}>
      <View style={styles.cardStyle}>
        <View style={styles.vysassistLeft}>
          <Text style={styles.fromLabel}>FROM</Text>
          <Text style={styles.fromProfileId}>{item.profile_from}</Text>
          <View style={styles.divider} />
          <Text style={styles.dateText}>
            {new Date(item.req_datetime).toISOString().split("T")[0]}
          </Text>
        </View>

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
  );

  const combinedData = useMemo(() => [
    ...(profiles || []).map(item => ({ ...item, type: 'interest' })),
    ...(vysassistData || []).map(item => ({ ...item, type: 'vysassist' })),
  ], [profiles, vysassistData]);

  const renderSliderItem = ({ item, index }) => {
    if (!item) return null;
    if (item.type === 'vysassist') {
      return renderVysassistItem({ item, index });
    }
    return renderInterestItem({ item, index });
  };

  const currentCardType = combinedData[currentSlideIndex]?.type;
  const sliderHeaderText = currentCardType === 'vysassist'
    ? 'New VysAssist Request'
    : 'New Interest Received';

  return (
    <SafeAreaView style={styles.container}>
      {isInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#BD1225" />
          <Text style={styles.loadingText}>Loading your matches...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.mainContainer}
          onScroll={handleScrollVertical}
          scrollEventThrottle={16}
        >
          {/* Header/Interest Section - Conditionally rendered when scrolling */}
          {showBanner && combinedData.length > 0 ? (
            <View style={styles.heartinBg}>
              <ImageBackground
                style={styles.heartinBg}
                source={require("../assets/img/HeartinBg.png")}
              >
                <Image
                  style={styles.MessageImg}
                  source={require("../assets/img/MessageImg.png")}
                />

                <Text style={styles.newInterest}>
                  {sliderHeaderText}
                </Text>

                {/* Slider Row with Arrows */}
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
                      color={currentSlideIndex === 0 ? "rgba(255,255,255,0.3)" : "#fff"}
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
                      item.type === 'vysassist'
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
                      currentSlideIndex === combinedData.length - 1 && styles.arrowDisabled,
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

                {/* Dot Indicators */}
                <View style={styles.dotsContainer}>
                  {combinedData.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        flatListRef.current?.scrollToOffset({
                          offset: index * (CARD_WIDTH + 16),
                          animated: true
                        });
                        setCurrentSlideIndex(index);
                      }}
                      style={[
                        styles.dot,
                        currentSlideIndex === index && styles.activeDot,
                      ]}
                    />
                  ))}
                </View>
              </ImageBackground>
            </View>
          ) : null}

          {/* Matching Profiles Section */}
          <View style={styles.matchingSection}>
            <View style={styles.matchingContainer}>
              <Text style={styles.matching}>
                {"Matching Profiles"}
                <Text style={styles.matchNumber}>
                  ({searchProfileId.length > 0 ? searchResults.length : totalCount})
                </Text>
              </Text>

              <Text style={{
                fontSize: 15,
                fontWeight: 'bold',
                alignSelf: 'center',
                color: '#b40101ff',
                marginHorizontal: 8
              }}>
                Sort by Date:
              </Text>
              <Switch
                style={styles.toggleSwitchcontainer}
                trackColor={{ false: '#767577', true: '#7f0909ff' }}
                thumbColor={isEnabled ? '#e80909ff' : '#f4f3f4'}
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
                  color="#85878C"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Search profile ID"
                  value={searchProfileId}
                  onChangeText={handleSearchInput}
                  placeholderTextColor="#85878C"
                  underlineColorAndroid="transparent"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity
                style={styles.filterIcon}
                onPress={handleFilterPress}
              >
                <MaterialIcons name="filter-list" size={18} color="#FF6666" />
              </TouchableOpacity>
            </View>
            <View style={styles.viewToggleContainer}>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                style={[
                  styles.viewToggleButton,
                  viewMode === 'list' && styles.activeViewButton
                ]}
              >
                <MaterialIcons
                  name="view-list"
                  size={24}
                  color={viewMode === 'list' ? '#BD1225' : '#85878C'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode('grid')}
                style={[
                  styles.viewToggleButton,
                  viewMode === 'grid' && styles.activeViewButton
                ]}
              >
                <MaterialIcons
                  name="view-module"
                  size={24}
                  color={viewMode === 'grid' ? '#BD1225' : '#85878C'}
                />
              </TouchableOpacity>
            </View>
            {/* Profile Cards Section */}
            <View style={styles.profileCardContainer}>
              <ProfileCard
                searchProfiles={searchProfileId.length > 0 ? searchResults : null}
                isLoadingNew={isSearching || isProfilesLoading}
                orderBy={getOrderBy()}
                viewMode={viewMode}
              />
            </View>
          </View>
        </ScrollView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },
  matchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 15,
  },
  mainContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageBackground: {
    width: width,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  imageStyle: {
    resizeMode: "cover",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    textDecorationLine: "underline",
  },
  heartinBg: {
    width: "100%",
    backgroundColor: "#ED1E24",
    paddingVertical: -20,
  },
  MessageImg: {
    marginHorizontal: 20,
    marginBottom: -5,
  },
  newInterest: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 2,
  },
  cardContainer: {
    justify: 'center'
  },
  cardStyle: {
    backgroundColor: "#FFF",
    width: width - 80,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  ProfileContentFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 15,
  },
  ProfileImgStyle: {
    marginRight: 10,
    width: 100,
    height: 100,
    borderRadius: 0,
  },
  nameStyle: {
    color: "#4F515D",
    fontSize: 18,
    fontWeight: "600",
  },
  ageStyle: {
    color: "#4F515D",
    fontSize: 12,
  },
  interestedText: {
    color: "#282C3F",
    fontSize: 12,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    alignSelf: "center",
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
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: "transparent",
  },
  matchingSection: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  matching: {
    fontSize: 16,
    fontWeight: "700",
    color: "#282C3F",
  },
  matchNumber: {
    color: "#FF6666",
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#D4D5D9",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    color: "#535665",
    padding: 10,
    fontFamily: "inter",
    backgroundColor: "#FFFFFF",
  },
  searchIcon: {
    paddingLeft: 10,
  },
  filterIcon: {
    position: "absolute",
    right: 20,
    bottom: 15,
  },
  profileCardContainer: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    borderRadius: 40,
  },
  modalGradient: {
    borderRadius: 10,
  },
  modalContainer: {
    width: "95%",
    padding: 40,
  },
  modalText: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 20,
    color: "#FFFFFF",
    marginLeft: -20,
  },
  modalButton: {
    width: "50%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginLeft: -20,
  },
  modalButtonText: {
    color: "#ED1E24",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginLeft: 15,
    marginTop: 10,
    marginRight: 15,
    marginBottom: 10,
  },
  loadingSection: {
    height: 243,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ED1E24",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  interestList: {
    paddingVertical: 20,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 8,
    padding: 2,
    marginHorizontal: 10,
  },
  viewToggleButton: {
    padding: 8,
    borderRadius: 6,
  },
  activeViewButton: {
    backgroundColor: '#FFF',
  },
  sortByText: {
    fontSize: 15,
    fontWeight: 'bold',
    alignSelf: 'center',
    color: '#b40101ff',
    marginHorizontal: 8,
  },
  vysassistLeft: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  fromLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#888',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  fromProfileId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  vysassistMessage: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  arrowButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  sliderFlatList: {
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 20,
    borderRadius: 4,
  },
});

export default HomeWithToast;