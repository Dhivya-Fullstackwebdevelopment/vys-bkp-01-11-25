import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  FlatList,
  PanResponder,
  Image,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAdvanceSearchResults,
  Search_By_profileId,
} from "../CommonApiCall/CommonApiCall";
import config from "../API/Apiurl";
import { Colors, GlobalStyles, rs } from "../Reusable/Theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const sortSelectedFirst = (list, checkedSet, idKey) => {
  const selected = [];
  const rest = [];
  list.forEach((item) => {
    (checkedSet.has(item[idKey]) ? selected : rest).push(item);
  });
  return [...selected, ...rest];
};

// ← NEW: generic helper to know whether every item in `list` is already checked
const isAllSelected = (list, checkedSet, idKey) =>
  Array.isArray(list) && list.length > 0 && list.every((item) => checkedSet.has(item[idKey]));

const staticStates = [
  { id: [2, 7], name: "TamilNadu & Pondhicherry" },
  { id: 4, name: "Karnataka" },
  { id: 1, name: "Andhra Pradesh" },
  { id: 3, name: "Telangana" },
  { id: 5, name: "Kerala" },
  { id: 6, name: "Others" },
];

const computeDefaultRanges = (myAge, myHeight, gender, heightMin = 140, heightMax = 200) => {
  const normalizedGender = gender?.toLowerCase();

  const AGE_MIN = 18, AGE_MAX = 60;

  let ageRangeDefault = [24, 34];
  let heightRangeDefault = [155, 185];

  if (myAge > 0) {
    if (normalizedGender === "male") {
      ageRangeDefault = [Math.max(AGE_MIN, myAge - 6), Math.min(AGE_MAX, myAge + 1)];
    } else if (normalizedGender === "female") {
      ageRangeDefault = [Math.max(AGE_MIN, myAge - 1), Math.min(AGE_MAX, myAge + 6)];
    }
  }

  if (myHeight > 0) {
    if (normalizedGender === "male") {
      heightRangeDefault = [
        Math.max(heightMin, myHeight - 20),
        Math.min(heightMax, myHeight + 2),   // ← now clamps to real API max (213), not fake 200
      ];
    } else if (normalizedGender === "female") {
      heightRangeDefault = [
        Math.max(heightMin, myHeight - 2),
        Math.min(heightMax, myHeight + 20),
      ];
    }
  }

  if (ageRangeDefault[0] > ageRangeDefault[1]) ageRangeDefault = [ageRangeDefault[1], ageRangeDefault[1]];
  if (heightRangeDefault[0] > heightRangeDefault[1]) heightRangeDefault = [heightRangeDefault[1], heightRangeDefault[1]];

  return { ageRangeDefault, heightRangeDefault };
};

/* Custom Multi-Thumb Range Slider built with pure RN to avoid PropTypes crashes */
const CustomRangeSlider = ({ min, max, values, onValuesChange }) => {
  const [sliderWidth, setSliderWidth] = useState(260);
  const THUMB_SIZE = 18;
  const currentValues = useRef(values);
  currentValues.current = values;

  const trackWidth = Math.max(0, sliderWidth - THUMB_SIZE); // ← usable track, leaves room for thumb radius

  const getPositionFromValue = (val) => {
    return ((val - min) / (max - min)) * trackWidth;
  };

  const getValueFromPosition = (pos) => {
    const clampedPos = Math.max(0, Math.min(pos, trackWidth));
    return Math.round(min + (clampedPos / trackWidth) * (max - min));
  };

  const minPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const startPos = getPositionFromValue(currentValues.current[0]);
        const newPos = startPos + gestureState.dx;
        const newValue = getValueFromPosition(newPos);
        if (newValue <= currentValues.current[1]) {
          onValuesChange([newValue, currentValues.current[1]]);
        }
      },
    })
  ).current;

  const maxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const startPos = getPositionFromValue(currentValues.current[1]);
        const newPos = startPos + gestureState.dx;
        const newValue = getValueFromPosition(newPos);
        if (newValue >= currentValues.current[0]) {
          onValuesChange([currentValues.current[0], newValue]);
        }
      },
    })
  ).current;

  const minPos = getPositionFromValue(values[0]);
  const maxPos = getPositionFromValue(values[1]);


  return (
    <View
      style={styles.sliderContainer}
      onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width - 24)}
    >
      <View style={styles.sliderTrackBg}>
        <View
          style={[
            styles.sliderTrackActive,
            { left: minPos, width: Math.max(0, maxPos - minPos) }, // ← back to minPos→maxPos
          ]}
        />
      </View>
      <View
        {...minPanResponder.panHandlers}
        style={[styles.sliderThumb, { left: minPos }]}
      />
      <View
        {...maxPanResponder.panHandlers}
        style={[styles.sliderThumb, { left: maxPos, opacity: 0 }]}
      />
    </View>
  );
};

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

// ← NEW: reusable "Select All" checkbox row, placed above each multi-select chip group
const SelectAllRow = ({ checked, onToggle, label = "Select All", disabled = false }) => (
  <TouchableOpacity
    style={styles.selectAllRow}
    activeOpacity={0.7}
    onPress={onToggle}
    disabled={disabled}
  >
    <View style={[styles.checkboxBase, checked && styles.checkboxChecked]}>
      {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
    </View>
    <Text style={styles.selectAllText}>{label}</Text>
  </TouchableOpacity>
);

// MultiSelectDropdownModal – displays a summary label, opens a modal with checkboxes
const MultiSelectDropdownModal = ({
  placeholder,       // e.g. "Select Birth Stars"
  data = [],         // array of objects with id and label (e.g. { birth_id, birth_star })
  selectedSet,       // Set of selected ids
  onToggle,          // function(id) to toggle a single item
  onSelectAll,       // function() to toggle all
  isAllSelected,     // boolean: are all items selected?
  getLabel,          // function(item) => display label
  getId,             // function(item) => id
  summaryText,       // optional custom summary (e.g. `${selectedSet.size} selected`)
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const displaySummary = summaryText || (selectedSet.size > 0 ? `${selectedSet.size} selected` : placeholder);

  return (
    <>
      <TouchableOpacity
        style={styles.dropdownStyle}   // reuse existing dropdown style
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedSet.size > 0 ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
          {displaySummary}
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

            {/* Select All row inside modal */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F4F4F5' }}>
              <TouchableOpacity
                style={styles.selectAllRow}
                activeOpacity={0.7}
                onPress={onSelectAll}
              >
                <View style={[styles.checkboxBase, isAllSelected && styles.checkboxChecked]}>
                  {isAllSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.selectAllText}>Select All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={data}
              keyExtractor={(item, index) => getId(item)?.toString() || index.toString()}
              renderItem={({ item }) => {
                const id = getId(item);
                const isChecked = selectedSet.has(id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownOptionItem,
                      isChecked && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      onToggle(id);
                      // keep modal open to allow multiple selections
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isChecked && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {getLabel(item)}
                    </Text>
                    {isChecked && (
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
  // ← CHANGED: birth star is now multi-select, mirrors the marital/profession pattern
  const [checkedBirthStars, setCheckedBirthStars] = useState(new Set());
  const [selectedBirthStarIds, setSelectedBirthStarIds] = useState("");
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
  const [ageRange, setAgeRange] = useState([24, 34]);   // [fromAge, toAge]
  const [heightRange, setHeightRange] = useState([155, 185]); // [fromHeight, toHeight] in cm
  const [heightBounds, setHeightBounds] = useState({ min: 122, max: 213 })

  const [expandedSections, setExpandedSections] = useState({
    basics: true,
    marital: false,
    profession: false,
    education: false,
    astrology: false,
    location: false,
    photo: false,
  });
  const [profileImage, setProfileImage] = useState("");
  const [profileId, setProfileId] = useState("");

  useEffect(() => {
    const loadProfileHeader = async () => {
      try {
        const img = await AsyncStorage.getItem("profile_image");
        const id = await AsyncStorage.getItem("loginuser_profileId");

        setProfileImage(img || "");
        setProfileId(id || "");
      } catch (error) {
        console.error("Error loading profile header:", error);
      }
    };

    loadProfileHeader();
  }, []);

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

      // ← derive actual min/max cm from the API response
      const cmValues = Object.values(response.data)
        .map((h) => parseInt(h.height_id, 10))
        .filter((n) => !isNaN(n));

      if (cmValues.length > 0) {
        setHeightBounds({
          min: Math.min(...cmValues),
          max: Math.max(...cmValues),
        });
      }
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

  useEffect(() => {
    const loadDefaultRangesFromProfile = async () => {
      try {
        const myGender = await AsyncStorage.getItem("gender");
        const myAgeValue = await AsyncStorage.getItem("age");
        const myHeightValue = await AsyncStorage.getItem("height");

        const myAge = parseInt(myAgeValue || "0", 10);
        const myHeight = parseInt(myHeightValue || "0", 10);

        const { ageRangeDefault, heightRangeDefault } = computeDefaultRanges(
          myAge,
          myHeight,
          myGender,
          heightBounds.min,
          heightBounds.max
        );

        setAgeRange(ageRangeDefault);
        setHeightRange(heightRangeDefault);
      } catch (error) {
        console.error("Error loading default age/height from profile:", error);
      }
    };

    loadDefaultRangesFromProfile();
  }, [heightBounds]); // ← re-run once heightBounds updates from the API

  const handleCheckboxToggle = (statusId) => {
    setCheckedStatuses((prev) => {
      const updated = new Set(prev);
      updated.has(statusId) ? updated.delete(statusId) : updated.add(statusId);
      setSelectedIds(Array.from(updated).join(","));
      return updated;
    });
  };

  // ← NEW: Select All / Deselect All for Marital Status
  const handleSelectAllMarital = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCheckedStatuses((prev) => {
      const allSelected = isAllSelected(maritalStatuses, prev, "marital_sts_id");
      const updated = allSelected
        ? new Set()
        : new Set(maritalStatuses.map((s) => s.marital_sts_id));
      setSelectedIds(Array.from(updated).join(","));
      return updated;
    });
  };

  const handleProfessionToggle = (professionId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCheckedProfessions((prev) => {
      const updated = new Set(prev);
      updated.has(professionId) ? updated.delete(professionId) : updated.add(professionId);
      setSelectedProfessionIds(Array.from(updated).join(","));
      return updated;
    });
  };

  // ← NEW: Select All / Deselect All for Profession
  const handleSelectAllProfessions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCheckedProfessions((prev) => {
      const allSelected = isAllSelected(professions, prev, "Profes_Pref_id");
      const updated = allSelected
        ? new Set()
        : new Set(professions.map((p) => p.Profes_Pref_id));
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

  // ← NEW: Select All / Deselect All for Field of Study
  const handleSelectAllFieldOfStudy = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCheckFieldoStudy((prev) => {
      const allSelected = isAllSelected(fieldOfStudyOptions, prev, "study_id");
      const updated = allSelected
        ? new Set()
        : new Set(fieldOfStudyOptions.map((f) => f.study_id));
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

  // ← NEW: Select All / Deselect All for Native States
  const handleSelectAllStates = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCheckedStates((prev) => {
      const allSelected = isAllSelected(staticStates, prev, "id");
      const updated = allSelected
        ? new Set()
        : new Set(staticStates.map((s) => s.id));
      setSelectedStateIds(Array.from(updated).join(","));
      return updated;
    });
  };

  // ← NEW: Birth Star is now multi-select — toggle a single star
  const handleBirthStarToggle = (birthId) => {
    setCheckedBirthStars((prev) => {
      const updated = new Set(prev);
      updated.has(birthId) ? updated.delete(birthId) : updated.add(birthId);
      setSelectedBirthStarIds(Array.from(updated).join(","));
      return updated;
    });
  };

  // ← NEW: Select All / Deselect All for Birth Star
  const handleSelectAllBirthStars = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCheckedBirthStars((prev) => {
      const allSelected = isAllSelected(birthStars, prev, "birth_id");
      const updated = allSelected
        ? new Set()
        : new Set(birthStars.map((b) => b.birth_id));
      setSelectedBirthStarIds(Array.from(updated).join(","));
      return updated;
    });
  };

  // const getHeightLabel = (cmValue) => {
  //   if (!heightOptions || heightOptions.length === 0) return `${cmValue} cm`;
  //   let closest = heightOptions[0];
  //   let minDiff = Infinity;
  //   heightOptions.forEach((opt) => {
  //     const cm = parseInt(opt.value, 10);
  //     const diff = Math.abs(cm - cmValue);
  //     if (diff < minDiff) {
  //       minDiff = diff;
  //       closest = opt;
  //     }
  //   });
  //   return closest.label; // e.g. "5ft 2in - 157cm"
  // };

  const getHeightCm = (cmValue) => {
    if (!heightOptions || heightOptions.length === 0) return `${cmValue}cm`;
    let closest = heightOptions[0];
    let minDiff = Infinity;
    heightOptions.forEach((opt) => {
      const cm = parseInt(opt.value, 10);
      const diff = Math.abs(cm - cmValue);
      if (diff < minDiff) {
        minDiff = diff;
        closest = opt;
      }
    });
    return `${closest.value}cm`;
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

      // 1. Get values from slider state
      const fromAgeNum = ageRange[0];
      const toAgeNum = ageRange[1];
      const fromHeightNum = heightRange[0];
      const toHeightNum = heightRange[1];

      // 2. Validate Age range
      if (fromAgeNum > 0 && toAgeNum > 0 && fromAgeNum > toAgeNum) {
        setBtnLoading(false);
        return Toast.show({
          type: "error",
          text1: "Input Error",
          text2: "From Age cannot be greater than To Age",
          position: "top",
        });
      }

      // 3. Validate Height range (numeric)
      if (fromHeightNum > 0 && toHeightNum > 0 && fromHeightNum > toHeightNum) {
        setBtnLoading(false);
        return Toast.show({
          type: "error",
          text1: "Height Range Error",
          text2: "'From Height' cannot be greater than 'To Height'",
          position: "top",
        });
      }

      // 4. Gender‑specific constraints
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

      // 5. Map height (cm) to height_id from heightOptions
      const findHeightId = (cmValue) => {
        if (!heightOptions || heightOptions.length === 0) return "";
        let closest = heightOptions[0];
        let minDiff = Infinity;
        heightOptions.forEach((opt) => {
          const cm = parseInt(opt.value, 10);
          const diff = Math.abs(cm - cmValue);
          if (diff < minDiff) {
            minDiff = diff;
            closest = opt;
          }
        });
        return closest.value;
      };

      const fromHeightId = fromHeightNum > 0 ? findHeightId(fromHeightNum) : "";
      const toHeightId = toHeightNum > 0 ? findHeightId(toHeightNum) : "";

      // 6. Build params
      const params = {
        from_age: fromAgeNum,
        to_age: toAgeNum,
        from_height: fromHeightId,
        to_height: toHeightId,
        search_marital_status: selectedIds,
        search_profession: selectedProfessionIds,
        search_education: selectedEducationId,
        max_income: selectedIncomeMinIds,
        min_income: selectedIncomeMaxIds,
        field_ofstudy: selectedFieldofStudyIds,
        search_star: selectedBirthStarIds, // ← now a comma-separated list (multi-select)
        search_nativestate: selectedStateIds,
        chevvai_dhosam: chevvaiDhosam,
        ragukethu_dhosam: rahuKetuDhosam,
        people_withphoto: ppChecked ? 1 : 0,
        search_worklocation: selectedWorkLocationId,
      };
      console.log("advance search params", params)

      await AsyncStorage.setItem("searchParams", JSON.stringify(params));

      const searchResults = await getAdvanceSearchResults(10, 1);

      console.log("advance search results", searchResults)

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

  const clearFields = async () => {
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
    setCheckedBirthStars(new Set());           // ← CHANGED: reset multi-select birth star set
    setSelectedBirthStarIds("");                // ← CHANGED: reset multi-select birth star ids
    setSelectedWorkLocationId("");
    setSearchProfileId("");
    ppSetChecked(false);

    try {
      const myGender = await AsyncStorage.getItem("gender");
      const myAgeValue = await AsyncStorage.getItem("age");
      const myHeightValue = await AsyncStorage.getItem("height");
      const myAge = parseInt(myAgeValue || "0", 10);
      const myHeight = parseInt(myHeightValue || "0", 10);
      const { ageRangeDefault, heightRangeDefault } = computeDefaultRanges(
        myAge,
        myHeight,
        myGender,
        heightBounds.min,
        heightBounds.max
      );
      setAgeRange(ageRangeDefault);
      setHeightRange(heightRangeDefault);
    } catch (error) {
      console.error("Error resetting default age/height:", error);
      setAgeRange([24, 34]);
      setHeightRange([155, 185]);
    }

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
    const ageText = ageRange[0] && ageRange[1] ? `${ageRange[0]}-${ageRange[1]} yrs` : "Any age";
    const heightText = heightRange[0] && heightRange[1] ? ` · ${heightRange[0]}-${heightRange[1]} cm` : "";
    return `${ageText}${heightText}`;
  };

  const countSummary = (checkedSet, emptyText) =>
    checkedSet.size > 0 ? `${checkedSet.size} selected` : emptyText;

  const getMaritalSubtitle = () => countSummary(checkedStatuses, "Any status");

  const getProfessionSubtitle = () => {
    const parts = [];
    if (checkedProfessions.size > 0) parts.push(`${checkedProfessions.size} selected`);

    const minVal = selectedIncomeMinIds
      ? incomeOptions.find((o) => String(o.value) === String(selectedIncomeMinIds))?.label
      : null;
    const maxVal = selectedIncomeMaxIds
      ? incomeOptions.find((o) => String(o.value) === String(selectedIncomeMaxIds))?.label
      : null;

    if (minVal && maxVal) parts.push(`${minVal} - ${maxVal}`);
    else if (minVal) parts.push(`Min ${minVal}`);
    else if (maxVal) parts.push(`Max ${maxVal}`);

    return parts.length ? parts.join(" · ") : "Any profession";
  };

  const getEducationSubtitle = () => {
    const degreeCount = selectedEducationId ? 1 : 0;
    const fieldCount = checkFieldoStudy.size;
    if (degreeCount === 0 && fieldCount === 0) return "Any education";
    return `${degreeCount} degrees · ${fieldCount} fields`;
  };

  const getAstrologySubtitle = () => {
    const parts = [];

    if (chevvaiDhosam === "No") parts.push(`Chevvai: ${chevvaiDhosam}`);
    if (rahuKetuDhosam === "No") parts.push(`Rahu/Ketu: ${rahuKetuDhosam}`);

    // ← CHANGED: multi-select birth star count instead of a single selection
    if (checkedBirthStars.size > 0) parts.push(`${checkedBirthStars.size} stars selected`);

    return parts.length > 0 ? parts.join(" · ") : "Any preference";
  };

  const getLocationSubtitle = () => {
    const stateCount = checkedStates.size;
    const cityCount = selectedWorkLocationId ? 1 : 0;
    if (stateCount === 0 && cityCount === 0) return "Any location";
    return `${stateCount} states · ${cityCount} cities`;
  };

  const getActiveFilters = () => {
    const filters = [];

    maritalStatuses.forEach((s) => {
      if (checkedStatuses.has(s.marital_sts_id)) {
        filters.push({ id: `marital-${s.marital_sts_id}`, label: s.marital_sts_name, onRemove: () => handleCheckboxToggle(s.marital_sts_id) });
      }
    });

    professions.forEach((p) => {
      if (checkedProfessions.has(p.Profes_Pref_id)) {
        filters.push({ id: `prof-${p.Profes_Pref_id}`, label: p.Profes_name, onRemove: () => handleProfessionToggle(p.Profes_Pref_id) });
      }
    });

    const eduItem = educationOptions.find((e) => String(e.education_id) === String(selectedEducationId));
    if (eduItem) {
      filters.push({ id: "edu", label: eduItem.education_description, onRemove: () => setSelectedEducationId("") });
    }

    fieldOfStudyOptions.forEach((f) => {
      if (checkFieldoStudy.has(f.study_id)) {
        filters.push({ id: `field-${f.study_id}`, label: f.study_description, onRemove: () => handleFieldofStudyToggle(f.study_id) });
      }
    });

    staticStates.forEach((st) => {
      if (checkedStates.has(st.id)) {
        filters.push({ id: `state-${Array.isArray(st.id) ? st.id.join("-") : st.id}`, label: st.name, onRemove: () => handleStateToggle(st.id) });
      }
    });

    const workLoc = states.find((s) => String(s.State_Pref_id) === String(selectedWorkLocationId));
    if (workLoc) {
      filters.push({ id: "worklocation", label: workLoc.State_name, onRemove: () => setSelectedWorkLocationId("") });
    }

    // ← CHANGED: render one chip per selected birth star instead of a single selection
    birthStars.forEach((b) => {
      if (checkedBirthStars.has(b.birth_id)) {
        filters.push({ id: `birthstar-${b.birth_id}`, label: b.birth_star, onRemove: () => handleBirthStarToggle(b.birth_id) });
      }
    });

    if (ppChecked) {
      filters.push({ id: "photo", label: "With photo", onRemove: () => ppSetChecked(false) });
    }

    if (selectedIncomeMinIds) {
      filters.push({ id: "incomeMin", label: selectedIncomeMinLabel, onRemove: () => { setSelectedIncomeMinIds(""); setSelectedIncomeMinLabel("Select min Annual Income"); } });
    }
    if (selectedIncomeMaxIds) {
      filters.push({ id: "incomeMax", label: selectedIncomeMaxLabel, onRemove: () => { setSelectedIncomeMaxIds(""); setSelectedIncomeMaxLabel("Select Max Annual Income"); } });
    }

    if (chevvaiDhosam !== "No") {
      filters.push({ id: "chevvai", label: `Chevvai: ${chevvaiDhosam}`, onRemove: () => setChevvaiDhosam("No") });
    }
    if (rahuKetuDhosam !== "No") {
      filters.push({ id: "rahuketu", label: `Rahu/Ketu: ${rahuKetuDhosam}`, onRemove: () => setRahuKetuDhosam("No") });
    }

    return filters;
  };

  const activeFilters = getActiveFilters();

  return (
    <SafeAreaView style={GlobalStyles.container}>
      {/* Red Gradient Header Banner */}
      <LinearGradient
        colors={[
          Colors.primaryGradientStart || "#A00014",
          Colors.primaryGradientEnd || "#4A000A",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBanner}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={25} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Advanced search
          </Text>

          <Text style={styles.headerSubtitle}>
            Refine every detail
          </Text>
        </View>

        {/* Right Profile + Clear */}
        <View style={styles.headerRightSection}>
          <View style={styles.profileHeader}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileHeaderImage}
              />
            ) : (
              <View style={styles.profileIconCircle}>
                <Ionicons name="person" size={16} color="#8B0000" />
              </View>
            )}

            <Text style={styles.profileHeaderId} numberOfLines={1}>
              {profileId || "Profile"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={clearFields}
            style={styles.clearBtnRow}
            activeOpacity={0.7}
          >
            <Ionicons
              name="reload-outline"
              size={15}
              color="#FFFFFF"
            />
            <Text style={styles.clearBtnText}>
              Clear all
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>



      <ScrollView contentContainerStyle={{ paddingBottom: 200 }} nestedScrollEnabled={true}>
        {/* Search Bar */}
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

        {activeFilters.length > 0 && (
          <View style={styles.activeFiltersWrapper}>
            <View style={styles.activeFiltersHeaderRow}>
              <Ionicons name="options-outline" size={16} color="#71717A" />
              <Text style={styles.activeFiltersCount}>{activeFilters.length} ACTIVE FILTERS</Text>
            </View>
            <View style={styles.chipRowWrap}>
              {activeFilters.map((f) => (
                <View key={f.id} style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>{f.label}</Text>
                  <TouchableOpacity onPress={f.onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Ionicons name="close" size={14} color="#78716C" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

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
              {/* Age Range Slider */}
              <View style={styles.rangeBlock}>
                <View style={styles.rangeHeader}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <View style={styles.rangeBadge}>
                    <Text style={styles.rangeBadgeText}>
                      {ageRange[0]} – {ageRange[1]} yrs
                    </Text>
                  </View>
                </View>
                <CustomRangeSlider
                  min={18}
                  max={60}
                  values={ageRange}
                  onValuesChange={setAgeRange}
                />
              </View>

              {/* Height Range Slider */}
              <View style={[styles.rangeBlock, { marginTop: 16 }]}>
                <View style={styles.rangeHeader}>
                  <Text style={styles.fieldLabel}>Height</Text>
                  <View style={styles.rangeBadge}>
                    <Text style={styles.rangeBadgeText}>
                      {/* {getHeightLabel(heightRange[0])} – {getHeightLabel(heightRange[1])} */}
                      {getHeightCm(heightRange[0])} – {getHeightCm(heightRange[1])}
                    </Text>
                  </View>
                </View>
                <CustomRangeSlider
                  min={heightBounds.min}
                  max={heightBounds.max}
                  values={heightRange}
                  onValuesChange={setHeightRange}
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
              {/* ← NEW: Select All row */}
              <SelectAllRow
                checked={isAllSelected(maritalStatuses, checkedStatuses, "marital_sts_id")}
                onToggle={handleSelectAllMarital}
                disabled={maritalStatuses.length === 0}
              />
              <View style={styles.chipRowWrap}>
                {sortSelectedFirst(maritalStatuses, checkedStatuses, "marital_sts_id").map((status) => {
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
              {/* ← NEW: Select All row */}
              <SelectAllRow
                checked={isAllSelected(professions, checkedProfessions, "Profes_Pref_id")}
                onToggle={handleSelectAllProfessions}
                disabled={professions.length === 0}
              />
              <View style={styles.chipRowWrap}>
                {sortSelectedFirst(professions, checkedProfessions, "Profes_Pref_id").map((prof) => {
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
              <Text style={styles.accordionSubtitle}>{getEducationSubtitle()}</Text>
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
              {/* ← NEW: Select All row */}
              <SelectAllRow
                checked={isAllSelected(fieldOfStudyOptions, checkFieldoStudy, "study_id")}
                onToggle={handleSelectAllFieldOfStudy}
                disabled={fieldOfStudyOptions.length === 0}
              />
              <View style={styles.chipRowWrap}>
                {sortSelectedFirst(fieldOfStudyOptions, checkFieldoStudy, "study_id").map((field) => {
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
              <Text style={styles.accordionSubtitle}>{getAstrologySubtitle()}</Text>
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

              {/* ← CHANGED: Birth Star is now a multi-select chip group (was a single-select dropdown) */}
              {/* <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Birth Star</Text>
              <SelectAllRow
                checked={isAllSelected(birthStars, checkedBirthStars, "birth_id")}
                onToggle={handleSelectAllBirthStars}
                disabled={birthStars.length === 0}
              /> */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Birth Star</Text>
              <MultiSelectDropdownModal
                placeholder="Select Birth Stars"
                data={birthStars}
                selectedSet={checkedBirthStars}
                onToggle={handleBirthStarToggle}
                onSelectAll={handleSelectAllBirthStars}
                isAllSelected={isAllSelected(birthStars, checkedBirthStars, "birth_id")}
                getLabel={(item) => item.birth_star}
                getId={(item) => item.birth_id}
                summaryText={checkedBirthStars.size > 0 ? `${checkedBirthStars.size} star${checkedBirthStars.size > 1 ? 's' : ''} selected` : undefined}
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
              <Text style={styles.accordionSubtitle}>{getLocationSubtitle()}</Text>
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
              {/* ← NEW: Select All row */}
              <SelectAllRow
                checked={isAllSelected(staticStates, checkedStates, "id")}
                onToggle={handleSelectAllStates}
              />
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
        {/* <View style={styles.bottomBarSubmit}>
          <TouchableOpacity style={{ flex: 1 }} onPress={handleSubmit} activeOpacity={0.85}>
            <View style={styles.submitGradientBtn}>
              {btnLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Search Criteria</Text>
              )}
            </View>
          </TouchableOpacity>
        </View> */}

        {/* <View style={styles.stickyBottomBar}>
          <TouchableOpacity style={styles.clearBtnBottom} onPress={clearFields}>
            <Text style={styles.clearBtnBottomText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.showProfilesBtn} onPress={handleSubmit} activeOpacity={0.85}>
            {btnLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.showProfilesBtnText}>Show matching profiles</Text>
            )}
          </TouchableOpacity>
        </View> */}
      </ScrollView>
      <View style={styles.stickyBottomBar}>
        <TouchableOpacity style={styles.clearBtnBottom} onPress={clearFields}>
          <Text style={styles.clearBtnBottomText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.showProfilesBtn} onPress={handleSubmit} activeOpacity={0.85}>
          {btnLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.showProfilesBtnText}>Show matching profiles</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: rs(10, 12, 14),
    paddingBottom: rs(12, 14, 16),
    minHeight: 88,
  },

  backBtn: {
    width: 30,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
    marginRight: 4,
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 2,
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    fontSize: 11.5,
    color: "rgba(255, 255, 255, 0.72)",
    marginTop: 3,
  },
  clearBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    alignSelf: "flex-start",
    marginLeft: 22,   // moves Clear all slightly left/right
    gap: 4,
  },
  clearBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
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
    lineHeight: 18,
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
    backgroundColor: Colors.selectedBg,
    borderRadius: 20,
    padding: 8,
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
  // ← NEW: Select All row style, reuses the existing checkbox look
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    marginBottom: 8,
  },
  selectAllText: {
    fontSize: 13,
    color: "#18181B",
    fontWeight: "600",
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
  rangeBlock: {
    marginBottom: 8,
  },
  rangeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rangeBadge: {
    backgroundColor: Colors.iconContainerBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rangeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.matchingcirclecolor,
  },
  sliderContainer: {
    height: 36,
    justifyContent: "center",
    position: "relative",
    // marginHorizontal: 8,
  },
  sliderTrackBg: {
    height: 6,
    backgroundColor: "#F1D2D3",
    borderRadius: 2,
    position: "relative",
  },
  sliderTrackActive: {
    height: 6,
    backgroundColor: Colors.primary || "#BD1225",
    borderRadius: 2,
    position: "absolute",
  },
  sliderThumb: {
    width: 18,
    height: 18,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#F1D2D3",
    position: "absolute",
    top: 9,          // ← centers with 6px track height (36 - 18)/2
    left: 9,          // base offset, overridden by inline style per-thumb — actually remove this, inline `left` from render controls it
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  stickyBottomBar: {
    position: "absolute",        // ← make it float
    bottom: Platform.OS === "ios" ? 100 : 80,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 50,
    // NO backgroundColor, NO borderTopWidth, NO marginBottom
  },
  bottomBarCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 5,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  clearBtnBottom: {
    width: 70,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#E4E4E7",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  clearBtnBottomText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3F3F46",
  },
  showProfilesBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary || "#BD1225",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#BD1225",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  showProfilesBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  activeFiltersWrapper: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  activeFiltersHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  activeFiltersCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#71717A",
    letterSpacing: 0.3,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FDE9C8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeFilterChipText: {
    fontSize: 13,
    color: "#7C5A16",
    fontWeight: "500",
  },
  headerRightSection: {
    width: 100,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 2,
    paddingRight: 2,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    marginBottom: 7,
  },

  profileHeaderImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    marginRight: 5,
  },

  profileIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },


  profileHeaderId: {
    maxWidth: 58,
    fontSize: 10.5,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "right",
  },
});