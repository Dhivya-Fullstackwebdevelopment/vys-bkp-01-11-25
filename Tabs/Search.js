import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";

import {
  getAdvanceSearchResults,
  Search_By_profileId,
} from "../CommonApiCall/CommonApiCall";
import config from "../API/Apiurl";
import { Colors, GlobalStyles, rs } from "../Reusable/Theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const staticStates = [
  { id: [2, 7], name: "TamilNadu & Pondhicherry" },
  { id: 4, name: "Karnataka" },
  { id: 1, name: "Andhra Pradesh" },
  { id: 3, name: "Telangana" },
  { id: 5, name: "Kerala" },
  { id: 6, name: "Others" },
];

/* Custom Dropdown Component to replace external package */
const CustomSelectDropdown = ({
  placeholder,
  data = [],
  selectedValue,
  onSelect,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = data.find((item) => String(item.value) === String(selectedValue));
  const displayLabel = selectedItem ? selectedItem.label : placeholder;

  return (
    <>
      <TouchableOpacity
        style={[styles.dropdownStyle, style]}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={
            selectedItem
              ? styles.dropdownSelectedText
              : styles.dropdownPlaceholder
          }
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#71717A" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color="#18181B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={data}
              keyExtractor={(item, index) => item.value ? item.value.toString() : index.toString()}
              renderItem={({ item }) => {
                const isSelected = String(item.value) === String(selectedValue);
                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownOptionItem,
                      isSelected && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      onSelect(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isSelected && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#BD1225" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export const Search = () => {
  const navigation = useNavigation();
  const { control } = useForm();

  const [fromAge, setFromAge] = useState(0);
  const [toAge, setToAge] = useState(0);
  const [heightOptions, setHeightOptions] = useState([]);
  const [fromHeight, setFromHeight] = useState("");
  const [toHeight, setToHeight] = useState("");
  const [maritalStatuses, setMaritalStatuses] = useState([]);
  const [checkedStatuses, setCheckedStatuses] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState("");
  const [professions, setProfessions] = useState([]);
  const [checkedProfessions, setCheckedProfessions] = useState(new Set());
  const [selectedProfessionIds, setSelectedProfessionIds] = useState("");
  const [educationOptions, setEducationOptions] = useState([]);
  const [selectedEducationId, setSelectedEducationId] = useState("");
  const [incomeOptions, setIncomeOptions] = useState([]);
  const [selectedIncomeMinIds, setSelectedIncomeMinIds] = useState("");
  const [selectedIncomeMaxIds, setSelectedIncomeMaxIds] = useState("");
  const [birthStars, setBirthStars] = useState([]);
  const [selectedBirthStarId, setSelectedBirthStarId] = useState("");
  const [states, setStates] = useState([]);
  const [checkedStates, setCheckedStates] = useState(new Set());
  const [selectedStateIds, setSelectedStateIds] = useState("");
  const [searchProfileId, setSearchProfileId] = useState("");
  const [fieldOfStudyOptions, setFieldOfStudyOptions] = useState([]);
  const [checkFieldoStudy, setCheckFieldoStudy] = useState(new Set());
  const [selectedFieldofStudyIds, setSelectedFieldofStudyIds] = useState("");
  const [chevvaiDhosam, setChevvaiDhosam] = useState("No");
  const [rahuKetuDhosam, setRahuKetuDhosam] = useState("No");
  const [selectedWorkLocationId, setSelectedWorkLocationId] = useState(0);
  const [selectedIncomeMinLabel, setSelectedIncomeMinLabel] = useState("Select min Annual Income");
  const [selectedIncomeMaxLabel, setSelectedIncomeMaxLabel] = useState("Select Max Annual Income");
  const [btnLoading, setBtnLoading] = useState(false);
  const [ppChecked, ppSetChecked] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    basics: true,
    marital: false,
    profession: false,
    education: false,
    astrology: false,
    location: false,
    photo: false,
  });

  const toggleSection = (sectionKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const fetchMaritalStatuses = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Marital_Status/`);
      setMaritalStatuses(Object.values(response.data));
    } catch (error) {
      console.error("Error fetching marital statuses", error);
    }
  };

  const fetchProfessions = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Profes_Pref/`);
      setProfessions(Object.values(response.data));
    } catch (error) {
      console.error("Error fetching professions", error);
    }
  };

  const fetchEducationOptions = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Highest_Education/`);
      setEducationOptions(Object.values(response.data));
    } catch (error) {
      console.error("Error fetching education options", error);
    }
  };

  const fetchIncomeOptions = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Annual_Income/`);
      const annualIncomeArray = Object.keys(response.data).map((key) => ({
        label: response.data[key].income_description,
        value: response.data[key].income_id.toString(),
      }));
      setIncomeOptions(annualIncomeArray);
    } catch (error) {
      console.error("Error fetching annual income:", error);
    }
  };

  const fetchBirthStars = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Birth_Star/`, { state_id: "" });
      setBirthStars(Object.values(response.data));
    } catch (error) {
      console.error("Error fetching birth stars:", error);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_State_Pref/`);
      setStates(Object.values(response.data));
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  const fetchHeightOptions = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Height/`);
      const heightArray = Object.keys(response.data).map((key) => ({
        label: response.data[key].height_description,
        value: response.data[key].height_id.toString(),
      }));
      setHeightOptions(heightArray);
    } catch (error) {
      console.error("Error fetching height options:", error);
    }
  };

  const fetchFieldOfStudy = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Field_ofstudy/`);
      setFieldOfStudyOptions(Object.values(response.data));
    } catch (error) {
      console.error("Error fetching field of study", error);
    }
  };

  useEffect(() => {
    fetchMaritalStatuses();
    fetchProfessions();
    fetchEducationOptions();
    fetchIncomeOptions();
    fetchBirthStars();
    fetchStates();
    fetchHeightOptions();
    fetchFieldOfStudy();
  }, []);

  const handleCheckboxToggle = (statusId) => {
    setCheckedStatuses((prev) => {
      const updated = new Set(prev);
      updated.has(statusId) ? updated.delete(statusId) : updated.add(statusId);
      setSelectedIds(Array.from(updated).join(","));
      return updated;
    });
  };

  const handleProfessionToggle = (professionId) => {
    setCheckedProfessions((prev) => {
      const updated = new Set(prev);
      updated.has(professionId) ? updated.delete(professionId) : updated.add(professionId);
      setSelectedProfessionIds(Array.from(updated).join(","));
      return updated;
    });
  };

  const handleFieldofStudyToggle = (fieldId) => {
    setCheckFieldoStudy((prev) => {
      const updated = new Set(prev);
      updated.has(fieldId) ? updated.delete(fieldId) : updated.add(fieldId);
      setSelectedFieldofStudyIds(Array.from(updated).join(","));
      return updated;
    });
  };

  const handleStateToggle = (stateId) => {
    setCheckedStates((prev) => {
      const updated = new Set(prev);
      updated.has(stateId) ? updated.delete(stateId) : updated.add(stateId);
      setSelectedStateIds(Array.from(updated).join(","));
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (btnLoading) return;
    setBtnLoading(true);

    try {
      const myGender = await AsyncStorage.getItem("gender");
      const myAgeValue = await AsyncStorage.getItem("age");
      const myHeightValue = await AsyncStorage.getItem("height");

      const myAge = parseInt(myAgeValue || "0", 10);
      const myHeight = parseInt(myHeightValue || "0", 10);
      const normalizedGender = myGender?.toLowerCase();

      const fromAgeNum = parseInt(fromAge.toString(), 10);
      const toAgeNum = parseInt(toAge.toString(), 10);
      const fromHeightNum = parseInt(fromHeight.toString(), 10);
      const toHeightNum = parseInt(toHeight.toString(), 10);

      if (fromAgeNum > 0 && toAgeNum > 0 && fromAgeNum > toAgeNum) {
        setBtnLoading(false);
        return Toast.show({
          type: "error",
          text1: "Input Error",
          text2: "From Age cannot be greater than To Age",
          position: "top",
        });
      }

      if (fromHeightNum > 0 && toHeightNum > 0 && fromHeightNum > toHeightNum) {
        setBtnLoading(false);
        return Toast.show({
          type: "error",
          text1: "Height Range Error",
          text2: "'From Height' cannot be greater than 'To Height'",
          position: "top",
        });
      }

      if (normalizedGender === "male") {
        if (toAgeNum > 0 && toAgeNum > myAge + 1) {
          setBtnLoading(false);
          return Toast.show({
            type: "error",
            text1: "Validation Error",
            text2: "Your age preference does not match this profile.",
            position: "top",
          });
        }
        if (toHeightNum > 0 && toHeightNum > myHeight + 2) {
          setBtnLoading(false);
          return Toast.show({
            type: "error",
            text1: "Validation Error",
            text2: "Your height preference does not match this profile.",
            position: "top",
          });
        }
      }

      if (normalizedGender === "female") {
        if (fromAgeNum > 0 && fromAgeNum < myAge - 1) {
          setBtnLoading(false);
          return Toast.show({
            type: "error",
            text1: "Validation Error",
            text2: "Your age preference does not match this profile.",
            position: "top",
          });
        }
        if (fromHeightNum > 0 && fromHeightNum < myHeight - 2) {
          setBtnLoading(false);
          return Toast.show({
            type: "error",
            text1: "Validation Error",
            text2: "Your height preference does not match this profile.",
            position: "top",
          });
        }
      }

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
        people_withphoto: ppChecked ? 1 : 0,
        search_worklocation: selectedWorkLocationId,
      };

      await AsyncStorage.setItem("searchParams", JSON.stringify(params));

      const searchResults = await getAdvanceSearchResults(10, 1);

      if (searchResults && searchResults.status === "success" && Array.isArray(searchResults.data)) {
        navigation.navigate("SearchResults", {
          results: searchResults.data,
          totalCount: searchResults.total_count,
        });
      }
    } catch (error) {
      console.error("Search submit error:", error);
      Toast.show({
        type: "error",
        text1: "Search Error",
        text2: "Something went wrong while processing your request.",
        position: "top",
      });
    } finally {
      setBtnLoading(false);
    }
  };

  const MIN_SEARCH_LENGTH = 3;

  const handleFilterPress = async () => {
    if (btnLoading) return;
    setBtnLoading(true);

    const searchId = (searchProfileId || "").trim();

    if (searchId.length < MIN_SEARCH_LENGTH) {
      Toast.show({
        type: "error",
        text1: "Input Error",
        text2: `Please enter at least ${MIN_SEARCH_LENGTH} characters to search.`,
        position: "top",
      });
      setBtnLoading(false);
      return;
    }

    try {
      const currentUserGender = await AsyncStorage.getItem("gender");
      const normalizedGender = currentUserGender?.toLowerCase();
      const inputUpper = searchId.toUpperCase();

      let isInvalid = false;
      if (normalizedGender === "male" && inputUpper.startsWith("VM")) isInvalid = true;
      if (normalizedGender === "female" && inputUpper.startsWith("VF")) isInvalid = true;

      if (isInvalid) {
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: "This profile does not match your gender preference.",
          position: "top",
        });
        setBtnLoading(false);
        return;
      }

      const response = await Search_By_profileId(searchId);

      if (
        response &&
        response.status === "success" &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        navigation.navigate("FilterScreen", {
          searchProfileId: searchId,
          isProfileIdSearch: true,
          profileCount: response.data.length,
        });
      } else {
        const errorMessage = response?.data?.message || "No profiles found matching your search term.";
        Toast.show({
          type: "info",
          text1: "No Matches",
          text2: errorMessage,
          position: "top",
        });
      }
    } catch (error) {
      console.error("Error during profile search:", error);
      Toast.show({
        type: "error",
        text1: "Search Error",
        text2: "Failed to fetch profile data.",
        position: "top",
      });
    } finally {
      setBtnLoading(false);
    }
  };

  const clearFields = () => {
    setFromAge(0);
    setToAge(0);
    setFromHeight(0);
    setToHeight(0);
    setCheckedStatuses(new Set());
    setCheckedProfessions(new Set());
    setCheckFieldoStudy(new Set());
    setCheckedStates(new Set());
    setSelectedEducationId("");
    setSelectedIncomeMinIds("");
    setSelectedIncomeMaxIds("");
    setSelectedIncomeMinLabel("Select min Annual Income");
    setSelectedIncomeMaxLabel("Select Max Annual Income");
    setRahuKetuDhosam("No");
    setChevvaiDhosam("No");
    setSelectedBirthStarId("");
    setSelectedWorkLocationId("");
    setSearchProfileId("");
    ppSetChecked(false);

    fetchMaritalStatuses();
    fetchProfessions();
    fetchEducationOptions();
    fetchIncomeOptions();
    fetchBirthStars();
    fetchStates();
    fetchFieldOfStudy();
  };

  useFocusEffect(
    React.useCallback(() => {
      clearFields();
      return () => { };
    }, [])
  );

  const SegmentedRadio = ({ options, selectedValue, onValueChange }) => (
    <View style={styles.segmentedContainer}>
      {options.map((opt) => {
        const active = selectedValue === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segmentedBtn, active && styles.segmentedBtnActive]}
            onPress={() => onValueChange(opt.value)}
          >
            <Text style={[styles.segmentedText, active && styles.segmentedTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const getBasicsSubtitle = () => {
    const ageText = fromAge && toAge ? `${fromAge}-${toAge} yrs` : "Any age";
    const heightText = fromHeight && toHeight ? ` · selected height` : "";
    return `${ageText}${heightText}`;
  };

  const getMaritalSubtitle = () => {
    const count = checkedStatuses.size;
    return count > 0 ? `${count} selected` : "Any status";
  };

  const getProfessionSubtitle = () => {
    const count = checkedProfessions.size;
    return count > 0 ? `${count} selected` : "Any profession";
  };

  return (
    <SafeAreaView style={GlobalStyles.container}>
      {/* Red Gradient Header Banner */}
      <LinearGradient
        colors={[Colors.primaryGradientStart || "#A00014", Colors.primaryGradientEnd || "#4A000A"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBanner}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Advanced search</Text>
          <Text style={styles.headerSubtitle}>Refine every detail</Text>
        </View>
        <TouchableOpacity onPress={clearFields} style={styles.clearBtnRow}>
          <Ionicons name="reload-outline" size={16} color="#FFFFFF" />
          <Text style={styles.clearBtnText}>Clear all</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} nestedScrollEnabled={true}>
        {/* Rounded Full Pill Search Bar (Matching image and React UI) */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBarPill}>
            <Ionicons name="search-outline" size={18} color="#71717A" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search profile ID or name"
              placeholderTextColor="#71717A"
              value={searchProfileId}
              onChangeText={(text) => setSearchProfileId(text)}
              onSubmitEditing={handleFilterPress}
              returnKeyType="search"
            />
            {searchProfileId ? (
              <TouchableOpacity onPress={() => setSearchProfileId("")} style={{ padding: 2 }}>
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Section 1: Basics */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.8}
            onPress={() => toggleSection("basics")}
          >
            <View style={styles.accordionIconCircle}>
              <Feather name="user" size={18} color={Colors.matchingcirclecolor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accordionTitle}>Basics</Text>
              <Text style={styles.accordionSubtitle}>{getBasicsSubtitle()}</Text>
            </View>
            <View style={styles.chevronCircle}>
              <Ionicons
                name={expandedSections.basics ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.primary ? "#8B0000" : "#8B0000"}
              />
            </View>
          </TouchableOpacity>

          {expandedSections.basics && (
            <View style={styles.accordionContent}>
              <Text style={styles.fieldLabel}>Age Range</Text>
              <View style={styles.inputFlexContainer}>
                <TextInput
                  placeholder="From Age"
                  keyboardType="numeric"
                  value={fromAge ? String(fromAge) : ""}
                  onChangeText={setFromAge}
                  style={styles.roundedInput}
                />
                <TextInput
                  placeholder="To Age"
                  keyboardType="numeric"
                  value={toAge ? String(toAge) : ""}
                  onChangeText={setToAge}
                  style={styles.roundedInput}
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Height Range</Text>
              <View style={styles.inputFlexContainer}>
                <CustomSelectDropdown
                  placeholder="From Height"
                  data={heightOptions}
                  selectedValue={fromHeight}
                  onSelect={(item) => setFromHeight(item.value)}
                />
                <CustomSelectDropdown
                  placeholder="To Height"
                  data={heightOptions}
                  selectedValue={toHeight}
                  onSelect={(item) => setToHeight(item.value)}
                />
              </View>
            </View>
          )}
        </View>

        {/* Section 2: Marital Status */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.8}
            onPress={() => toggleSection("marital")}
          >
            <View style={styles.accordionIconCircle}>
              <Ionicons name="heart-outline" size={18} color={Colors.matchingcirclecolor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accordionTitle}>Marital status</Text>
              <Text style={styles.accordionSubtitle}>{getMaritalSubtitle()}</Text>
            </View>
            <View style={styles.chevronCircle}>
              <Ionicons
                name={expandedSections.marital ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.primary ? "#8B0000" : "#8B0000"}
              />
            </View>
          </TouchableOpacity>

          {expandedSections.marital && (
            <View style={styles.accordionContent}>
              <View style={styles.chipRowWrap}>
                {maritalStatuses.map((status) => {
                  const active = checkedStatuses.has(status.marital_sts_id);
                  return (
                    <TouchableOpacity
                      key={status.marital_sts_id}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => handleCheckboxToggle(status.marital_sts_id)}
                    >
                      {active && <Ionicons name="checkmark" size={14} color="#881337" />}
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {status.marital_sts_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Section 3: Profession & Income */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.8}
            onPress={() => toggleSection("profession")}
          >
            <View style={styles.accordionIconCircle}>
              <Feather name="briefcase" size={18} color={Colors.matchingcirclecolor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accordionTitle}>Profession & income</Text>
              <Text style={styles.accordionSubtitle}>{getProfessionSubtitle()}</Text>
            </View>
            <View style={styles.chevronCircle}>
              <Ionicons
                name={expandedSections.profession ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.primary ? "#8B0000" : "#8B0000"}
              />
            </View>
          </TouchableOpacity>

          {expandedSections.profession && (
            <View style={styles.accordionContent}>
              <Text style={styles.fieldLabel}>Profession</Text>
              <View style={styles.chipRowWrap}>
                {professions.map((prof) => {
                  const active = checkedProfessions.has(prof.Profes_Pref_id);
                  return (
                    <TouchableOpacity
                      key={prof.Profes_Pref_id}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => handleProfessionToggle(prof.Profes_Pref_id)}
                    >
                      {active && <Ionicons name="checkmark" size={14} color="#881337" />}
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {prof.Profes_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Annual Income Min</Text>
              <Controller
                control={control}
                name="annualIncomeMin"
                defaultValue={selectedIncomeMinIds}
                render={({ field: { onChange } }) => (
                  <CustomSelectDropdown
                    placeholder={selectedIncomeMinLabel}
                    data={incomeOptions}
                    selectedValue={selectedIncomeMinIds}
                    onSelect={(item) => {
                      onChange(item.value);
                      setSelectedIncomeMinIds(item.value);
                      setSelectedIncomeMinLabel(item.label);
                    }}
                  />
                )}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Annual Income Max</Text>
              <Controller
                control={control}
                name="annualIncomeMax"
                defaultValue={selectedIncomeMaxIds}
                render={({ field: { onChange } }) => (
                  <CustomSelectDropdown
                    placeholder={selectedIncomeMaxLabel}
                    data={incomeOptions}
                    selectedValue={selectedIncomeMaxIds}
                    onSelect={(item) => {
                      onChange(item.value);
                      setSelectedIncomeMaxIds(item.value);
                      setSelectedIncomeMaxLabel(item.label);
                    }}
                  />
                )}
              />
            </View>
          )}
        </View>

        {/* Section 4: Education */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.8}
            onPress={() => toggleSection("education")}
          >
            <View style={styles.accordionIconCircle}>
              <Feather name="book-open" size={18} color={Colors.matchingcirclecolor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accordionTitle}>Education</Text>
              <Text style={styles.accordionSubtitle}>
                {selectedEducationId ? "1 selected" : "Any education"}
              </Text>
            </View>
            <View style={styles.chevronCircle}>
              <Ionicons
                name={expandedSections.education ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.primary ? "#8B0000" : "#8B0000"}
              />
            </View>
          </TouchableOpacity>

          {expandedSections.education && (
            <View style={styles.accordionContent}>
              <Text style={styles.fieldLabel}>Highest Education</Text>
              <Controller
                control={control}
                name="highestEducation"
                defaultValue={selectedEducationId}
                render={({ field: { onChange } }) => (
                  <CustomSelectDropdown
                    placeholder="Select Education"
                    data={educationOptions.map((edu) => ({
                      label: edu.education_description,
                      value: edu.education_id.toString(),
                    }))}
                    selectedValue={selectedEducationId}
                    onSelect={(item) => {
                      onChange(item.value);
                      setSelectedEducationId(item.value);
                    }}
                  />
                )}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Field of Study</Text>
              <View style={styles.chipRowWrap}>
                {fieldOfStudyOptions.map((field) => {
                  const active = checkFieldoStudy.has(field.study_id);
                  return (
                    <TouchableOpacity
                      key={field.study_id}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => handleFieldofStudyToggle(field.study_id)}
                    >
                      {active && <Ionicons name="checkmark" size={14} color="#881337" />}
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {field.study_description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Section 5: Dosham & Astrology */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.8}
            onPress={() => toggleSection("astrology")}
          >
            <View style={styles.accordionIconCircle}>
              <Ionicons name="sparkles-outline" size={18} color={Colors.matchingcirclecolor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accordionTitle}>Dosham & Astrology</Text>
              <Text style={styles.accordionSubtitle}>Preferences</Text>
            </View>
            <View style={styles.chevronCircle}>
              <Ionicons
                name={expandedSections.astrology ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.primary ? "#8B0000" : "#8B0000"}
              />
            </View>
          </TouchableOpacity>

          {expandedSections.astrology && (
            <View style={styles.accordionContent}>
              <Text style={styles.fieldLabel}>Chevvai Dosham</Text>
              <SegmentedRadio
                options={[
                  { label: "Yes", value: "Yes" },
                  { label: "No", value: "No" },
                  { label: "Both", value: "Both" },
                ]}
                selectedValue={chevvaiDhosam}
                onValueChange={setChevvaiDhosam}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Rahu/Ketu Dosham</Text>
              <SegmentedRadio
                options={[
                  { label: "Yes", value: "Yes" },
                  { label: "No", value: "No" },
                  { label: "Both", value: "Both" },
                ]}
                selectedValue={rahuKetuDhosam}
                onValueChange={setRahuKetuDhosam}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Birth Star</Text>
              <CustomSelectDropdown
                placeholder="Select Birth Star"
                data={birthStars.map((star) => ({
                  label: star.birth_star,
                  value: star.birth_id.toString(),
                }))}
                selectedValue={selectedBirthStarId}
                onSelect={(item) => setSelectedBirthStarId(item.value)}
              />
            </View>
          )}
        </View>

        {/* Section 6: Location */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.8}
            onPress={() => toggleSection("location")}
          >
            <View style={styles.accordionIconCircle}>
              <Ionicons name="location-outline" size={18} color={Colors.matchingcirclecolor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accordionTitle}>Location</Text>
              <Text style={styles.accordionSubtitle}>Native & Work Location</Text>
            </View>
            <View style={styles.chevronCircle}>
              <Ionicons
                name={expandedSections.location ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.primary ? "#8B0000" : "#8B0000"}
              />
            </View>
          </TouchableOpacity>

          {expandedSections.location && (
            <View style={styles.accordionContent}>
              <Text style={styles.fieldLabel}>Native States</Text>
              <View style={styles.chipRowWrap}>
                {staticStates.map((st) => {
                  const active = checkedStates.has(st.id);
                  return (
                    <TouchableOpacity
                      key={Array.isArray(st.id) ? st.id.join("-") : st.id}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => handleStateToggle(st.id)}
                    >
                      {active && <Ionicons name="checkmark" size={14} color="#881337" />}
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {st.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Work Location</Text>
              <CustomSelectDropdown
                placeholder="Select Work Location"
                data={states.map((st) => ({
                  label: st.State_name,
                  value: st.State_Pref_id.toString(),
                }))}
                selectedValue={selectedWorkLocationId}
                onSelect={(item) => setSelectedWorkLocationId(item.value)}
              />
            </View>
          )}
        </View>

        {/* Section 7: Profile Photo */}
        <View style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            activeOpacity={0.8}
            onPress={() => toggleSection("photo")}
          >
            <View style={styles.accordionIconCircle}>
              <Feather name="camera" size={18} color={Colors.matchingcirclecolor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accordionTitle}>Profile Photo</Text>
              <Text style={styles.accordionSubtitle}>
                {ppChecked ? "Only with photo" : "All profiles"}
              </Text>
            </View>
            <View style={styles.chevronCircle}>
              <Ionicons
                name={expandedSections.photo ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.primary ? "#8B0000" : "#8B0000"}
              />
            </View>
          </TouchableOpacity>

          {expandedSections.photo && (
            <View style={styles.accordionContent}>
              <TouchableOpacity
                style={styles.photoToggleRow}
                onPress={() => ppSetChecked(!ppChecked)}
              >
                <View style={[styles.checkboxBase, ppChecked && styles.checkboxChecked]}>
                  {ppChecked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.photoToggleText}>People only with photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Bottom Button */}
        <View style={styles.bottomBarSubmit}>
          <TouchableOpacity style={{ flex: 1 }} onPress={handleSubmit} activeOpacity={0.85}>
            <View style={styles.submitGradientBtn}>
              <Text style={styles.submitBtnText}>Submit Search Criteria</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: rs(12, 16, 20),
    paddingBottom: 24,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    // fontSize: rs(20, 22, 24),
    fontSize: 22,
    fontWeight: 700,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: rs(12, 13, 14),
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  clearBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clearBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  searchBarPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 5000,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 9 : 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,

  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: "#18181B",
  },
  accordionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  accordionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.iconContainerBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  accordionTitle: {
    lineHeight: 14,
    fontSize: 15,
    fontWeight: "700",
    color: "#18181B",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  accordionSubtitle: {
    fontSize: 13,
    color: "#71717A",
    marginTop: 2,
  },
  chevronCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  accordionContent: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F4F4F5",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717A",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  inputFlexContainer: {
    flexDirection: "row",
    gap: 10,
  },
  roundedInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: Colors.selectedBg,
    color: "#18181B",
  },
  dropdownStyle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.selectedBg,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: "#71717A",
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: "#18181B",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    maxHeight: "60%",
    paddingVertical: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#18181B",
  },
  dropdownOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
  },
  dropdownOptionSelected: {
    backgroundColor: "#FEF2F2",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#3F3F46",
  },
  dropdownItemTextSelected: {
    color: "#BD1225",
    fontWeight: "700",
  },
  chipRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    backgroundColor: Colors.selectedBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  filterChipActive: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECDD3",
  },
  filterChipText: {
    fontSize: 13,
    color: "#3F3F46",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#881337",
    fontWeight: "700",
  },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "#F4F4F5",
    borderRadius: 20,
    padding: 3,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 18,
  },
  segmentedBtnActive: {
    backgroundColor: "#BD1225",
  },
  segmentedText: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "600",
  },
  segmentedTextActive: {
    color: "#FFFFFF",
  },
  photoToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  checkboxBase: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E4E4E7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#BD1225",
    borderColor: "#BD1225",
  },
  photoToggleText: {
    fontSize: 14,
    color: "#18181B",
    fontWeight: "500",
  },
  bottomBarSubmit: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  submitGradientBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});