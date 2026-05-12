import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  SafeAreaView,
  Pressable,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getAdvanceSearchResults } from '../CommonApiCall/CommonApiCall';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Search_By_profileId, logProfileVisit, handleBookmark, fetchProfileDataCheck } from "../CommonApiCall/CommonApiCall";
import ProfileNotFound from "../Components/ProfileNotFound/ProfileNotFound";
import Toast from "react-native-toast-message";
import { useForm, Controller } from "react-hook-form";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import config from "../API/Apiurl";
import RNPickerSelect from 'react-native-picker-select';


const staticStates = [
  { id: [2, 7], name: "TamilNadu & Pondhicherry" },
  { id: 4, name: "Karnataka" },
  { id: 1, name: "Andhra Pradesh" },
  { id: 3, name: "Telangana" },
  { id: 5, name: "Kerala" },
  { id: 6, name: "Others" },
];


export const Search = () => {
  const navigation = useNavigation();
  const { control } = useForm();

  // ─── Responsive helpers ───────────────────────────────────────────────────
  const { width } = useWindowDimensions();
  const isSmall = width < 360;              // e.g. iPhone SE, small Android
  const isMedium = width >= 360 && width < 414; // e.g. iPhone standard
  const isLarge = width >= 414;             // e.g. iPhone Pro Max, large Android

  // Returns the value that matches the current screen size bucket
  const rs = (small, medium, large) =>
    isSmall ? small : isMedium ? medium : large;
  // ─────────────────────────────────────────────────────────────────────────

  const [fromAge, setFromAge] = useState(0);
  const [toAge, setToAge] = useState(0);
  const [heightOptions, setHeightOptions] = useState([]);
  const [fromHeight, setFromHeight] = useState("");
  const [toHeight, setToHeight] = useState("");
  const [fromRegDate, setFromRegDate] = useState('');
  const [toRegDate, setToRegDate] = useState('');
  const [maritalStatuses, setMaritalStatuses] = useState([]);
  const [checkedStatuses, setCheckedStatuses] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState('');
  const [professions, setProfessions] = useState([]);
  const [checkedProfessions, setCheckedProfessions] = useState(new Set());
  const [selectedProfessionIds, setSelectedProfessionIds] = useState('');
  const [educationOptions, setEducationOptions] = useState([]);
  const [selectedEducationId, setSelectedEducationId] = useState('');
  const [incomeOptions, setIncomeOptions] = useState([]);
  const [checkedIncomes, setCheckedIncomes] = useState(new Set());
  const [selectedIncomeMinIds, setSelectedIncomeMinIds] = useState('');
  const [selectedIncomeMaxIds, setSelectedIncomeMaxIds] = useState('');
  const [birthStars, setBirthStars] = useState([]);
  const [selectedBirthStarId, setSelectedBirthStarId] = useState('');
  const [states, setStates] = useState([]);
  const [checkedStates, setCheckedStates] = useState(new Set());
  const [selectedStateIds, setSelectedStateIds] = useState('');
  const [searchProfileId, setSearchProfileId] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [fieldOfStudyOptions, setFieldOfStudyOptions] = useState([]);
  const [checkFieldoStudy, setCheckFieldoStudy] = useState(new Set());
  const [selectedFieldofStudyIds, setSelectedFieldofStudyIds] = useState('');
  const [chevvaiDhosam, setChevvaiDhosam] = useState('No');
  const [rahuKetuDhosam, setRahuKetuDhosam] = useState('No');
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [workLocation, setWorkLocation] = useState('');
  const [selectedWorkLocationId, setSelectedWorkLocationId] = useState(0);
  const [selectedIncomeMinLabel, setSelectedIncomeMinLabel] = useState('Select min Annual Income');
  const [selectedIncomeMaxLabel, setSelectedIncomeMaxLabel] = useState('Select Max Annual Income');
  const [btnLoading, setBtnLoading] = useState(false);
  const loginuser_profileId = AsyncStorage.getItem("loginuser_profileId") || AsyncStorage.getItem("profile_id_new");

  const handleSavePress = async (viewedProfileId) => {
    const newStatus = bookmarkedProfiles.has(viewedProfileId) ? "0" : "1";
    const success = await handleBookmark(viewedProfileId, newStatus);
    console.log("bookmark success", success);
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
      setProfiles(prevProfiles =>
        prevProfiles.map(profile =>
          profile.profile_id === viewedProfileId
            ? { ...profile, wish_list: newStatus === "1" ? 1 : 0 }
            : profile
        )
      );
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update bookmark status.",
        position: "bottom",
      });
    }
  };

  useEffect(() => {
    if (profiles && profiles.length > 0) {
      const bookmarkedIds = new Set();
      profiles.forEach(profile => {
        if (profile.wish_list === 1) {
          bookmarkedIds.add(profile.profile_id);
        }
      });
      setBookmarkedProfiles(prev => new Set([...prev, ...bookmarkedIds]));
    }
  }, [profiles]);

  const getImageSource = (image) => {
    if (!image) return { uri: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%2Fimages%3Fk%3Ddefault%2Bimage&psig=AOvVaw28Px6jC5wsx4TWxwOrHJT2&ust=1726388184602000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMCfpqb_wYgDFQAAAAAdAAAAABAE' };
    if (Array.isArray(image)) {
      return { uri: image[0] };
    }
    return { uri: image };
  };

  const fetchMaritalStatuses = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Marital_Status/`);
      const status = Object.values(response.data);
      setMaritalStatuses(status);
    } catch (error) {
      console.error("Error fetching marital statuses", error);
    }
  };

  const fetchProfessions = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Profes_Pref/`);
      const professionList = Object.values(response.data);
      setProfessions(professionList);
    } catch (error) {
      console.error("Error fetching professions", error);
    }
  };

  const fetchEducationOptions = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Highest_Education/`);
      const educationList = Object.values(response.data);
      setEducationOptions(educationList);
    } catch (error) {
      console.error("Error fetching education options", error);
    }
  };

  const fetchIncomeOptions = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Annual_Income/`);
      const annualIncomeArray = Object.keys(response.data).map(key => ({
        label: response.data[key].income_description,
        value: response.data[key].income_id.toString(),
      }));
      setIncomeOptions(annualIncomeArray);
    } catch (error) {
      console.error("Error fetching UG Degree:", error);
    }
  };

  const fetchBirthStars = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Birth_Star/`, { state_id: "" });
      const starList = Object.values(response.data);
      setBirthStars(starList);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching birth stars:", error.response?.data || error.message);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_State_Pref/`);
      const statesArray = Object.values(response.data);
      setStates(statesArray);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };

  useEffect(() => {
    fetchMaritalStatuses();
    fetchProfessions();
    fetchEducationOptions();
    fetchIncomeOptions();
    fetchBirthStars();
    fetchStates();
    fetchFieldOfStudy();
  }, []);

  const fetchFieldOfStudy = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Field_ofstudy/`);
      console.log("Field of study data ===>", response);
      const fieldofstudyList = Object.values(response.data);
      setFieldOfStudyOptions(fieldofstudyList);
    } catch (error) {
      console.error("Error fetching education options", error);
    }
  };

  const handleCheckboxToggle = (statusId) => {
    setCheckedStatuses((prevCheckedStatuses) => {
      const updatedCheckedStatuses = new Set(prevCheckedStatuses);
      if (updatedCheckedStatuses.has(statusId)) {
        updatedCheckedStatuses.delete(statusId);
      } else {
        updatedCheckedStatuses.add(statusId);
      }
      const selectedIdsString = Array.from(updatedCheckedStatuses).join(',');
      setSelectedIds(selectedIdsString);
      console.log(selectedIdsString);
      return updatedCheckedStatuses;
    });
  };

  const handleProfessionToggle = (professionId) => {
    setCheckedProfessions((prevCheckedProfessions) => {
      const updatedCheckedProfessions = new Set(prevCheckedProfessions);
      if (updatedCheckedProfessions.has(professionId)) {
        updatedCheckedProfessions.delete(professionId);
      } else {
        updatedCheckedProfessions.add(professionId);
      }
      const selectedIdsString = Array.from(updatedCheckedProfessions).join(',');
      setSelectedProfessionIds(selectedIdsString);
      console.log("Selected Profession IDs:", selectedIdsString);
      return updatedCheckedProfessions;
    });
  };

  const handleFieldofStudyToggle = (fieldId) => {
    setCheckFieldoStudy((prevCheckedFieldofStudy) => {
      const updatedCheckedFieldofStudy = new Set(prevCheckedFieldofStudy);
      if (updatedCheckedFieldofStudy.has(fieldId)) {
        updatedCheckedFieldofStudy.delete(fieldId);
      } else {
        updatedCheckedFieldofStudy.add(fieldId);
      }
      const selectedIdsString = Array.from(updatedCheckedFieldofStudy).join(',');
      setSelectedFieldofStudyIds(selectedIdsString);
      console.log("Selected Education IDs:", selectedIdsString);
      return updatedCheckedFieldofStudy;
    });
  };

  const fetchHeightOptions = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Height/`);
      const heightArray = Object.keys(response.data).map(key => ({
        label: response.data[key].height_description,
        value: response.data[key].height_id.toString(),
      }));
      setHeightOptions(heightArray);
    } catch (error) {
      console.error("Error fetching height options:", error);
    }
  };

  useEffect(() => {
    fetchHeightOptions();
  }, []);

  const handleStateToggle = (stateId) => {
    setCheckedStates((prevCheckedStates) => {
      const updatedCheckedStates = new Set(prevCheckedStates);
      if (updatedCheckedStates.has(stateId)) {
        updatedCheckedStates.delete(stateId);
      } else {
        updatedCheckedStates.add(stateId);
      }
      const selectedIdsString = Array.from(updatedCheckedStates).join(',');
      setSelectedStateIds(selectedIdsString);
      console.log("Selected State IDs:", selectedIdsString);
      return updatedCheckedStates;
    });
  };

  const handleSubmit = async () => {
    try {
      const myGender = await AsyncStorage.getItem("gender");
      const myAgeValue = await AsyncStorage.getItem("age");
      const myHeightValue = await AsyncStorage.getItem("height");

      console.log("Logged-in Gender:", myGender);
      console.log("Logged-in Age (from Storage):", myAgeValue);

      const myAge = parseInt(myAgeValue || "0", 10);
      const myHeight = parseInt(myHeightValue || "0", 10);
      console.log("myAge", myAge);
      const normalizedGender = myGender?.toLowerCase();
      console.log("genderr", normalizedGender);

      const fromAgeNum = parseInt(fromAge.toString(), 10);
      const toAgeNum = parseInt(toAge.toString(), 10);
      const fromHeightNum = parseInt(fromHeight.toString(), 10);
      const toHeightNum = parseInt(toHeight.toString(), 10);

      console.log("Search From Age:", fromAgeNum);
      console.log("Search To Age:", toAgeNum);

      if (fromAgeNum > 0 && toAgeNum > 0 && fromAgeNum > toAgeNum) {
        Toast.show({
          type: "error",
          text1: "Input Error",
          text2: "From Age cannot be greater than To Age",
          position: "bottom",
        });
        return;
      }

      if (fromHeightNum > 0 && toHeightNum > 0 && fromHeightNum > toHeightNum) {
        return Toast.show({
          type: "error",
          text1: "Height Range Error",
          text2: " 'From Height' cannot be greater than 'To Height' ",
          position: "bottom",
        });
      }

      if (normalizedGender === "male") {
        if (toAgeNum > 0 && toAgeNum > (myAge + 1)) {
          return Toast.show({ type: "error", text1: "Validation Error", text2: "Your age preference does not match this profile.", position: "bottom" });
        }
        if (toHeightNum > 0 && toHeightNum > (myHeight + 2)) {
          return Toast.show({ type: "error", text1: "Validation Error", text2: "Your height preference does not match this profile.", position: "bottom" });
        }
      }

      if (normalizedGender === "female") {
        if (fromAgeNum > 0 && fromAgeNum < (myAge - 1)) {
          return Toast.show({
            type: "error",
            text1: "Validation Error",
            text2: "Your age preference does not match this profile.",
            position: "bottom",
          });
        }
        if (fromHeightNum > 0 && fromHeightNum < (myHeight - 2)) {
          return Toast.show({
            type: "error",
            text1: "Validation Error",
            text2: "Your height preference does not match this profile.",
            position: "bottom",
          });
        }
      }

      const peopleWithPhotoParam = ppChecked ? 1 : 0;
      const params = {
        from_age: fromAge,
        to_age: toAge,
        from_height: fromHeight,
        to_height: toHeight,
        search_marital_status: selectedIds,
        search_profession: selectedProfessionIds,
        search_education: selectedEducationId,
        max_income: selectedIncomeMinIds,
        min_income: selectedIncomeMaxIds,
        field_ofstudy: selectedFieldofStudyIds,
        search_star: selectedBirthStarId,
        search_nativestate: selectedStateIds,
        chevvai_dhosam: chevvaiDhosam,
        ragukethu_dhosam: rahuKetuDhosam,
        people_withphoto: peopleWithPhotoParam,
        search_worklocation: selectedWorkLocationId,
      };

      await AsyncStorage.setItem('searchParams', JSON.stringify(params));
      const searchResults = await getAdvanceSearchResults(1, 1);

      if (searchResults && searchResults.status === "success") {
        navigation.navigate('SearchResults', {
          results: searchResults.data,
          totalCount: searchResults.total_count
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const DEBOUNCE_DELAY = 500;

  const handleSearchPress = async (profileId) => {
    if (profileId) {
      console.log(profileId);
      try {
        const response = await Search_By_profileId(profileId);
        if (response.status === "success") {
          setProfiles(response.data);
        } else {
          setProfiles([]);
          console.log("No record found");
        }
      } catch (error) {
        console.log("Error:", error.message);
      }
    } else {
      console.log("Please enter at least 6 characters to search");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchProfileId && searchProfileId.length >= 6) {
        handleSearchPress(searchProfileId);
      }
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchProfileId]);

  const MIN_SEARCH_LENGTH = 3;

  const handleFilterPress = async () => {
    if (btnLoading) return;
    setBtnLoading(true);

    const searchId = (searchProfileId || '').trim();

    if (searchId.length < MIN_SEARCH_LENGTH) {
      Toast.show({
        type: "error",
        text1: "Input Error",
        text2: `Please enter at least ${MIN_SEARCH_LENGTH} characters to search.`,
        position: "bottom",
      });
      setBtnLoading(false);
      return;
    }

    try {
      const currentUserGender = await AsyncStorage.getItem("gender");
      const normalizedGender = currentUserGender?.toLowerCase();
      const inputUpper = searchId.toUpperCase();

      let isInvalid = false;
      if (normalizedGender === "male" && inputUpper.startsWith("VM")) {
        isInvalid = true;
      }
      if (normalizedGender === "female" && inputUpper.startsWith("VF")) {
        isInvalid = true;
      }

      if (isInvalid) {
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: "This profile does not match your gender preference.",
          position: "bottom",
        });
        setBtnLoading(false);
        return;
      }

      const response = await Search_By_profileId(searchId);

      if (response && response.status === "success" && Array.isArray(response.data) && response.data.length > 0) {
        const profileCount = response.data.length;
        navigation.navigate('FilterScreen', {
          searchProfileId: searchId,
          isProfileIdSearch: true,
          profileCount: profileCount,
        });
      } else {
        const errorMessage = response?.data?.message || "No profiles found matching your search term.";
        Toast.show({
          type: "info",
          text1: "No Matches",
          text2: errorMessage,
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Error during profile search:", error);
      Toast.show({ type: "error", text1: "Search Error", text2: "Failed to fetch profile data.", position: "bottom" });
    } finally {
      setBtnLoading(false);
    }
  };

  const [ppChecked, ppSetChecked] = useState(false);

  const ppHandleCheckboxToggle = () => {
    ppSetChecked(!ppChecked);
  };

  useFocusEffect(
    React.useCallback(() => {
      clearFields();
      return () => { };
    }, [])
  );

  const clearFields = () => {
    setFromAge(0);
    setToAge(0);
    setFromHeight(0);
    setToHeight(0);
    setCheckedStatuses(new Set());
    setCheckedProfessions(new Set());
    setCheckFieldoStudy(new Set());
    setCheckedStates(new Set());
    setSelectedEducationId('');
    setSelectedIncomeMinIds('');
    setSelectedIncomeMaxIds('');
    setSelectedIncomeMinLabel('Select min Annual Income');
    setSelectedIncomeMaxLabel('Select Max Annual Income');
    setRahuKetuDhosam('No');
    setChevvaiDhosam('No');
    setSelectedBirthStarId('');
    setWorkLocation('');
    ppSetChecked(false);
    setWorkLocation('');
    setSelectedWorkLocationId('');
    ppSetChecked(false);
    fetchMaritalStatuses();
    fetchProfessions();
    fetchEducationOptions();
    fetchIncomeOptions();
    fetchBirthStars();
    fetchStates();
    fetchFieldOfStudy();
  };

  const handleProfileClick = async (viewedProfileId) => {
    const profileCheckResponse = await fetchProfileDataCheck(viewedProfileId);
    console.log('profile view msg', profileCheckResponse);

    if (profileCheckResponse?.status === "failure") {
      Toast.show({
        type: "error",
        text1: profileCheckResponse.message,
        position: "bottom",
      });
      return;
    }

    const success = await logProfileVisit(viewedProfileId);

    if (success) {
      navigation.navigate("ProfileDetails", { viewedProfileId });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to log profile visit.",
        position: "bottom",
      });
    }
  };

  const RadioButtonGroup = ({ options, selectedValue, onValueChange }) => (
    <View style={styles.radioGroup}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={styles.radioButtonContainer}
          onPress={() => onValueChange(option.value)}
        >
          <View
            style={[
              styles.radioButton,
              selectedValue === option.value && styles.radioButtonSelected,
            ]}
          />
          <Text style={styles.radioLabel}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── Responsive StyleSheet (reads rs() from component scope) ─────────────
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F4F4F4",
      alignItems: "center",
      justifyContent: "flex-start",
    },
    centerContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    search: {
      fontSize: rs(14, 16, 18),
      fontWeight: "700",
      fontFamily: "inter",
      color: "#282C3F",
      alignSelf: "flex-start",
      paddingHorizontal: rs(8, 10, 14),
      marginVertical: 10,
    },
    searchAdvanced: {
      fontSize: rs(14, 16, 18),
      fontWeight: "700",
      fontFamily: "inter",
      color: "#282C3F",
      left: -5,
      alignSelf: "flex-start",
      paddingHorizontal: rs(8, 10, 14),
      marginVertical: 10,
    },
    searchClear: {
      fontSize: rs(14, 16, 18),
      fontWeight: "700",
      fontFamily: "inter",
      color: "#FF6666",
      marginLeft: rs(60, 130, 180),
      alignSelf: "flex-start",
      paddingHorizontal: rs(8, 10, 14),
      marginVertical: 10,
    },
    formContainer: {
      width: "100%",
      paddingHorizontal: rs(15, 10, 14),
      flexDirection: "row",
      alignItems: "center",
    },
    inputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 4,
      borderColor: "#D4D5D9",
      backgroundColor: "white",
    },
    input: {
      flex: 1,
      color: "#535665",
      padding: rs(8, 10, 12),
      fontFamily: "inter",
      backgroundColor: "white",
      fontSize: rs(13, 14, 15),
    },
    searchIcon: {
      paddingLeft: rs(8, 10, 12),
    },
    filterIcon: {
      position: "absolute",
      right: rs(12, 20, 24),
      bottom: 9,
    },
    searchContainer: {
      marginBottom: rs(12, 15, 18),
      textAlign: "left",
    },
    redText: {
      color: "#282C3F",
      fontSize: rs(12, 14, 15),
      fontWeight: "700",
      fontFamily: "inter",
      alignSelf: "flex-start",
      paddingHorizontal: rs(8, 10, 14),
      marginBottom: rs(8, 10, 12),
    },
    inputFlexContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    inputFlexFirst: {
      flex: 1,
      marginRight: 6,
      borderWidth: 1,
      borderRadius: 4,
      borderColor: "#D4D5D9",
      backgroundColor: "white",
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    inputFlex: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 4,
      borderColor: "#D4D5D9",
      backgroundColor: "white",
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    checkRedText: {
      color: "#282C3F",
      fontSize: rs(12, 14, 15),
      fontWeight: "700",
      fontFamily: "inter",
      alignSelf: "flex-start",
      marginBottom: rs(8, 10, 12),
    },
    checkContainer: {
      alignSelf: "flex-start",
      paddingHorizontal: rs(28, 10, 14),  // ← was rs(8, 10, 14), bump small from 8→14
      width: "100%",
    },
    checkboxDivFlex: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      width: "100%",
    },
    checkBoxFlex: {
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      width: "100%",
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rs(10, 15, 18),
      // On very small screens stack to full width; on medium/large use two columns
      width: rs('100%', '50%', '50%'),
    },
    singleCheckboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rs(14, 20, 22),
      paddingHorizontal: rs(8, 10, 14),
    },
    dhosamFlex: {
      flexDirection: "row",
    },
    checkboxBase: {
      width: rs(16, 18, 20),
      height: rs(16, 18, 20),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 2,
      borderWidth: 2,
      borderColor: "#282C3F",
      backgroundColor: "transparent",
      marginRight: rs(4, 6, 8),
    },
    checkboxChecked: {
      backgroundColor: "#282C3F",
    },
    checkboxLabel: {
      fontSize: rs(11, 13, 14),
      color: "#535665",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      alignSelf: "center",
      width: "100%",
      paddingHorizontal: rs(8, 10, 14),
      marginTop: -20,
    },
    btn: {
      alignSelf: "center",
      borderRadius: 6,
      marginBottom: 10,
    },
    loginContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    cancel: {
      color: "#FF6666",
      fontSize: rs(12, 14, 15),
      fontFamily: "inter",
      alignSelf: "flex-start",
      padding: rs(12, 15, 18),
      marginBottom: 10,
    },
    login: {
      textAlign: "center",
      color: "white",
      fontWeight: "600",
      fontSize: rs(13, 14, 15),
      letterSpacing: 1,
      fontFamily: "inter",
    },
    linearGradient: {
      borderRadius: 5,
      justifyContent: "center",
      paddingVertical: rs(8, 10, 12),
      paddingHorizontal: rs(16, 20, 24),
    },
    searchButton: {
      backgroundColor: '#FF6666',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      alignItems: 'center',
      marginTop: 1,
    },
    searchButtonText: {
      color: '#FFF',
      fontSize: rs(14, 16, 17),
    },
    profileScrollView: {
      width: "100%",
    },
    profileDiv: {
      width: "100%",
      paddingHorizontal: rs(8, 10, 14),
    },
    profileContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      borderRadius: 8,
      padding: rs(6, 8, 10),
      marginVertical: 10,
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    profileImage: {
      width: rs(80, 100, 110),
      height: rs(80, 100, 110),
      borderRadius: 10,
    },
    saveIcon: {
      position: "absolute",
      left: -25,
      top: 5,
    },
    profileContent: {
      paddingLeft: rs(8, 10, 12),
    },
    profileName: {
      fontSize: rs(14, 16, 17),
      fontWeight: "700",
      color: "#FF6666",
      fontFamily: "inter",
      marginBottom: 10,
    },
    profileId: {
      fontSize: rs(12, 14, 15),
      color: "#85878C",
    },
    profileAge: {
      fontSize: rs(12, 14, 15),
      color: "#4F515D",
      marginBottom: 5,
    },
    line: {},
    zodiac: {
      fontSize: rs(12, 14, 15),
      color: "#4F515D",
      marginBottom: 5,
    },
    employed: {
      fontSize: rs(12, 14, 15),
      color: "#4F515D",
    },
    checkboxRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      width: '100%',
    },
    radioGroup: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: rs(6, 10, 12),
      paddingHorizontal: rs(8, 10, 14),
    },
    radioButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioButton: {
      height: rs(18, 20, 22),
      width: rs(18, 20, 22),
      borderRadius: rs(9, 10, 11),
      borderWidth: 2,
      borderColor: '#282C3F',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioButtonSelected: {
      backgroundColor: '#282C3F',
    },
    radioLabel: {
      marginLeft: rs(6, 8, 10),
      fontSize: rs(12, 14, 15),
    },
    dropdown: {
      width: "100%",
      color: "#535665",
      borderWidth: 1,
      borderRadius: 4,
      borderColor: "#D4D5D9",
      paddingHorizontal: rs(8, 10, 12),
      paddingVertical: rs(10, 13, 15),
      fontFamily: "inter",
    },
    placeholderStyle: {
      fontSize: rs(12, 14, 15),
    },
    selectedTextStyle: {
      fontSize: rs(12, 14, 15),
    },
    selectedChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
      paddingHorizontal: rs(8, 10, 14),
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#6b6b6b',
      borderRadius: 15,
      paddingVertical: 5,
      paddingLeft: 10,
      paddingRight: 5,
      marginRight: 8,
      marginBottom: 8,
    },
    chipText: {
      color: 'white',
      fontSize: rs(11, 13, 14),
      marginRight: 5,
    },
    chipClose: {
      backgroundColor: 'transparent',
      padding: 3,
    },
    dropdownContainer: {
      width: '100%',
      borderWidth: 1,
      borderRadius: 4,
      borderColor: "#D4D5D9",
      backgroundColor: "white",
      paddingHorizontal: 0,
    },
  });
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.search}>Search</Text>

      <View style={styles.formContainer}>
        {/* Search Input Field */}
        <View style={styles.inputContainer}>
          <MaterialIcons
            name="search"
            size={rs(16, 18, 20)}
            color="#85878C"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Search profile ID or profile Name"
            value={searchProfileId}
            onChangeText={(text) => {
              setSearchProfileId(text);
              if (text) {
                handleSearchPress(text);
              } else if (profiles.length > 0 && text.length < 1) {
                setSearchProfileId("");
                setProfiles([]);
              }
            }}
          />
        </View>

        {/* Filter / Search Button */}
        <TouchableOpacity
          style={[
            styles.filterIcon,
            {
              backgroundColor: "#FF6666",
              paddingHorizontal: rs(8, 10, 14),
              paddingVertical: rs(3, 3, 5),
              borderRadius: 5,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
          onPress={handleFilterPress}
          disabled={btnLoading}
        >
          {btnLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: rs(14, 16, 17), fontWeight: "600" }}>
              Search
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.searchAdvanced}>Advanced Search</Text>
        <TouchableOpacity onPress={clearFields}>
          <Text style={styles.searchClear}>Clear Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Age */}
        <View style={styles.searchContainer}>
          <Text style={styles.redText}>Age</Text>
          <View style={styles.formContainer}>
            <View style={styles.inputFlexContainer}>
              <View style={styles.inputFlexFirst}>
                <TextInput
                  placeholder="From"
                  keyboardType="numeric"
                  value={fromAge}
                  onChangeText={setFromAge}
                  style={{
                    fontSize: rs(13, 14, 15),
                    width: "100%",
                    paddingVertical: 6,
                  }}
                />
              </View>
              <View style={styles.inputFlex}>
                <TextInput
                  placeholder="To"
                  keyboardType="numeric"
                  value={toAge}
                  onChangeText={setToAge}
                  style={{
                    fontSize: rs(13, 14, 15),
                    width: "100%",
                    paddingVertical: 6,
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Height */}
        <View style={styles.searchContainer}>
          <Text style={styles.redText}>Height</Text>
          <View style={styles.formContainer}>
            {/* <View style={styles.inputFlexContainer}> */}
            <View style={styles.inputFlexFirst}>
              <Dropdown
                style={{ height: 20 }}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={heightOptions}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="From"
                value={fromHeight}
                onChange={(item) => setFromHeight(item.value)}
              />
            </View>
            {/* </View> */}
            <View style={styles.inputFlex}>
              <Dropdown
                style={{ height: 20 }}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={heightOptions}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="To"
                value={toHeight}
                onChange={(item) => setToHeight(item.value)}
              />
            </View>

          </View>
        </View>

        {/* Marital Status */}
        <View style={styles.checkContainer}>
          <Text style={styles.checkRedText}>Marital Status</Text>
          <View style={styles.checkboxDivFlex}>
            <View style={styles.checkboxRow}>
              {maritalStatuses.map((status) => (
                <View key={status.marital_sts_id} style={styles.checkboxContainer}>
                  <Pressable
                    style={[
                      styles.checkboxBase,
                      checkedStatuses.has(status.marital_sts_id) && styles.checkboxChecked,
                    ]}
                    onPress={() => handleCheckboxToggle(status.marital_sts_id)}
                  >
                    {checkedStatuses.has(status.marital_sts_id) && (
                      <Ionicons name="checkmark" size={rs(12, 14, 16)} color="white" />
                    )}
                  </Pressable>
                  <Pressable onPress={() => handleCheckboxToggle(status.marital_sts_id)}>
                    <Text style={styles.checkboxLabel}>{status.marital_sts_name}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Profession */}
        <View style={styles.checkContainer}>
          <Text style={styles.checkRedText}>Profession</Text>
          <View style={styles.checkboxDivFlex}>
            {professions.reduce((acc, profession, index) => {
              if (index % 2 === 0) acc.push([]);
              acc[acc.length - 1].push(profession);
              return acc;
            }, []).map((row, rowIndex) => (
              <View key={rowIndex} style={styles.checkboxRow}>
                {row.map((profession) => (
                  <View key={profession.Profes_Pref_id} style={styles.checkboxContainer}>
                    <Pressable
                      style={[
                        styles.checkboxBase,
                        checkedProfessions.has(profession.Profes_Pref_id) && styles.checkboxChecked,
                      ]}
                      onPress={() => handleProfessionToggle(profession.Profes_Pref_id)}
                    >
                      {checkedProfessions.has(profession.Profes_Pref_id) && (
                        <Ionicons name="checkmark" size={rs(12, 14, 16)} color="white" />
                      )}
                    </Pressable>
                    <Pressable onPress={() => handleProfessionToggle(profession.Profes_Pref_id)}>
                      <Text style={styles.checkboxLabel}>{profession.Profes_name}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Highest Education */}
        <View style={styles.checkContainer}>
          <View style={styles.searchContainer}>
            <Text style={styles.redText}>Highest Education</Text>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Controller
                  control={control}
                  name="highestEducation"
                  defaultValue={selectedEducationId}
                  render={({ field: { onChange, value } }) => (
                    <Dropdown
                      style={styles.dropdown}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      data={educationOptions.map((edu) => ({
                        label: edu.education_description,
                        value: edu.education_id.toString(),
                      }))}
                      maxHeight={180}
                      labelField="label"
                      valueField="value"
                      placeholder="Select Education"
                      value={selectedEducationId}
                      onChange={(item) => {
                        onChange(item.value);
                        setSelectedEducationId(item.value);
                      }}
                    />
                  )}
                />
              </View>
            </View>
          </View>
        </View>
        {/* Field of Study */}
        <View style={styles.checkContainer}>
          <Text style={styles.checkRedText}>Field of Study</Text>
          <View style={styles.checkboxDivFlex}>
            <View style={styles.checkboxRow}>
              {fieldOfStudyOptions.map((fieldofstudy) => (
                <View key={fieldofstudy.study_id} style={styles.checkboxContainer}>
                  <Pressable
                    style={[
                      styles.checkboxBase,
                      checkFieldoStudy.has(fieldofstudy.study_id) && styles.checkboxChecked,
                    ]}
                    onPress={() => handleFieldofStudyToggle(fieldofstudy.study_id)}
                  >
                    {checkFieldoStudy.has(fieldofstudy.study_id) && (
                      <Ionicons name="checkmark" size={rs(12, 14, 16)} color="white" />
                    )}
                  </Pressable>
                  <Pressable onPress={() => handleFieldofStudyToggle(fieldofstudy.study_id)}>
                    <Text style={styles.checkboxLabel}>{fieldofstudy.study_description}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Annual Income */}
        <View style={styles.checkContainer}>
          <View style={styles.searchContainer}>
            <Text style={styles.redText}>Annual Income Min</Text>
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Controller
                  control={control}
                  name="annualIncomeMin"
                  defaultValue={selectedIncomeMinIds}
                  render={({ field: { onChange, value } }) => (
                    <Dropdown
                      style={styles.dropdown}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      data={incomeOptions}
                      maxHeight={180}
                      labelField="label"
                      valueField="value"
                      placeholder={selectedIncomeMinLabel}
                      value={selectedIncomeMinIds}
                      onChange={(item) => {
                        onChange(item.value);
                        setSelectedIncomeMinIds(item.value);
                        setSelectedIncomeMinLabel(item.label);
                      }}
                    />
                  )}
                />
              </View>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Text style={styles.redText}>Annual Income Max</Text>
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Controller
                  control={control}
                  name="annualIncomeMax"
                  defaultValue={selectedIncomeMaxIds}
                  render={({ field: { onChange, value } }) => (
                    <Dropdown
                      style={styles.dropdown}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      data={incomeOptions}
                      maxHeight={180}
                      labelField="label"
                      valueField="value"
                      placeholder={selectedIncomeMaxLabel}
                      value={selectedIncomeMaxIds}
                      onChange={(item) => {
                        onChange(item.value);
                        setSelectedIncomeMaxIds(item.value);
                        setSelectedIncomeMaxLabel(item.label);
                      }}
                    />
                  )}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Chevvai Dosham */}
        <View style={styles.searchContainer}>
          <Text style={styles.redText}>Chevvai Dosham</Text>
          <RadioButtonGroup
            options={[
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
              { label: 'Both', value: 'Both' },
            ]}
            selectedValue={chevvaiDhosam}
            onValueChange={setChevvaiDhosam}
          />
        </View>

        {/* Rahu/Ketu Dosham */}
        <View style={styles.searchContainer}>
          <Text style={styles.redText}>Rahu/Ketu Dosham</Text>
          <RadioButtonGroup
            options={[
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
              { label: 'Both', value: 'Both' },
            ]}
            selectedValue={rahuKetuDhosam}
            onValueChange={setRahuKetuDhosam}
          />
        </View>

        <View style={styles.searchContainer} />

        {/* Birth Star */}
        <View style={styles.searchContainer}>
          <View style={styles.searchContainer}>
            <Text style={styles.redText}>Birth Star</Text>
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={birthStars.map(star => ({
                    label: star.birth_star,
                    value: star.birth_id.toString(),
                  }))}
                  maxHeight={180}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Birth Star"
                  value={selectedBirthStarId}
                  onChange={(item) => setSelectedBirthStarId(item.value)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Native States */}
        <View style={styles.checkContainer}>
          <Text style={styles.checkRedText}>Native States</Text>
          <View style={styles.checkboxDivFlex}>
            <View style={styles.checkboxRow}>
              {staticStates.map((state) => (
                <View key={state.id} style={styles.checkboxContainer}>
                  <Pressable
                    style={[
                      styles.checkboxBase,
                      checkedStates.has(state.id) && styles.checkboxChecked,
                    ]}
                    onPress={() => handleStateToggle(state.id)}
                  >
                    {checkedStates.has(state.id) && (
                      <Ionicons name="checkmark" size={rs(12, 14, 16)} color="white" />
                    )}
                  </Pressable>
                  <Pressable onPress={() => handleStateToggle(state.id)}>
                    <Text style={styles.checkboxLabel}>{state.name}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Work Location */}
        <View style={styles.searchContainer}>
          <Text style={styles.redText}>Work Location</Text>
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={states.map(state => ({
                  label: state.State_name,
                  value: state.State_Pref_id.toString()
                }))}
                maxHeight={180}
                labelField="label"
                valueField="value"
                placeholder="Select Work Location"
                value={selectedWorkLocationId}
                onChange={(item) => setSelectedWorkLocationId(item.value)}
              />
            </View>
          </View>
        </View>

        {/* Profile Photo */}
        <View style={styles.searchContainer}>
          <Text style={styles.redText}>Profile Photo</Text>
          <View>
            <View style={styles.singleCheckboxContainer}>
              <Pressable
                style={[
                  styles.checkboxBase,
                  ppChecked && styles.checkboxChecked,
                ]}
                onPress={ppHandleCheckboxToggle}
              >
                {ppChecked && (
                  <Ionicons name="checkmark" size={rs(12, 14, 16)} color="white" />
                )}
              </Pressable>
              <Pressable onPress={ppHandleCheckboxToggle}>
                <Text style={styles.checkboxLabel}>People only with photo</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => { handleSubmit(); }}
          >
            <LinearGradient
              colors={["#BD1225", "#FF4050"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              useAngle={true}
              angle={92.08}
              angleCenter={{ x: 0.5, y: 0.5 }}
              style={styles.linearGradient}
            >
              <View style={styles.loginContainer}>
                <Text style={styles.login}>Submit</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView >
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
  },
});