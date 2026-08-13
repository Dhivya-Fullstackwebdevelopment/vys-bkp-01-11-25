import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";
import MatchingStars from "../Components/MatchingStars/MatchingStars";
import { Colors, rs } from "../Reusable/Theme";

// ── Custom Modal Dropdown (popup) ──────────────────────────────────────────
const CustomDropdown = ({
  placeholder,
  data = [],
  selectedValue,
  onSelect,
  style,
  labelField = "label",
  valueField = "value",
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedItem = data.find((item) => String(item[valueField]) === String(selectedValue));
  const displayLabel = selectedItem ? selectedItem[labelField] : placeholder;

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
              keyExtractor={(item, index) =>
                item[valueField] ? String(item[valueField]) : index.toString()
              }
              renderItem={({ item }) => {
                const isSelected = String(item[valueField]) === String(selectedValue);
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
                      {item[labelField]}
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

// ── Zod schema ──────────────────────────────────────────────────────────────
const schema = z.object({
  ageDifference: z.string().optional(),
  heightFrom: z.string().optional(),
  heightTo: z.string().optional(),
  chevvai: z.string().optional(),
  rehu: z.string().optional(),
  maritalStatus: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  profession: z.array(z.string()).optional(),
  annualIncome: z.string().optional(),
  annualIncomeMax: z.string().optional(),
  foreignInterest: z.string().optional(),
});

const age = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "7", value: "7" },
  { label: "8", value: "8" },
  { label: "9", value: "9" },
  { label: "10", value: "10" },
];

const foreignInterest = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
  { label: "both", value: "both" },
];

export const PartnerSettings = () => {
  const navigation = useNavigation();
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ageDifference: "5",
      heightFrom: "",
      heightTo: "",
      maritalStatus: [],
      education: [],
      profession: [],
      annualIncome: "",
      annualIncomeMax: "",
      foreignInterest: "",
      chevvai: "",
      rehu: "",
      fieldOfStudy: "",
    },
  });

  const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
  const [highestEduOptions, setHighestEduOptions] = useState([]);
  const [annualIncomeOptions, setAnnualIncomeOptions] = useState([]);
  const [birthStarValue, setBrthStar] = useState([]);
  const [martialValue, setMaritalStatus] = useState([]);
  const [GenderValue, setGender] = useState([]);
  const [height, setHeight] = useState([]);
  const [matchList, setMatchList] = useState([]);
  const [matchStars, setMatchStars] = useState([]);
  const [selectedStarIds, setSelectedStarIds] = useState([]);
  const [RasiIds, setRasiIds] = useState([]);
  const [StarIds, setStarIds] = useState([]);
  const [selectedStarRasiPairs, setSelectedStarRasiPairs] = useState([]);
  const [professionalPreferences, setProfessionalPreferences] = useState([]);
  const [fieldOfStudyOptions, setFieldOfStudyOptions] = useState([]);
  const [fieldError, setFieldError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [heightOptions, setHeightOptions] = useState([]);

  const maritalStatusSelected = watch("maritalStatus") || [];
  const fieldOfStudySelected = watch("fieldOfStudy") || [];

  const fetchFieldOfStudy = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Field_ofstudy/`);
      const options = Object.keys(response.data).map((key) => ({
        label: response.data[key].study_description,
        value: response.data[key].study_id,
      }));
      setFieldOfStudyOptions(options);
      setFieldError(null);
    } catch (error) {
      console.error("Error fetching Field of Study options:", error);
      setFieldError("Failed to load options. Please try again.");
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

  useEffect(() => {
    fetchMaritalStatus();
    retrieveDataFromSession();
    fetchHighestEdu();
    fetchAnnualIncome();
    fetchFieldOfStudy();
    fetchHeightOptions();
  }, []);

  const retrieveDataFromSession = async () => {
    try {
      let profileValue = await AsyncStorage.getItem("profile_owner");
      const profileId = await AsyncStorage.getItem("profile_id_new");
      const mobileno = await AsyncStorage.getItem("Mobile_no");
      const birthstar = await AsyncStorage.getItem("birthStarValue");
      const gender = await AsyncStorage.getItem("gender");
      const height = await AsyncStorage.getItem("height");
      const martialstatus = await AsyncStorage.getItem("martial_status");
      profileValue = profileValue === "Ownself" ? "yourself" : profileValue;
      setBrthStar(birthstar);
      setGender(gender);
      setHeight(height);
      setMaritalStatus(martialstatus);
      console.log("Retrieved Profile Value:", profileValue);
      console.log("Retrieved Profile ID:", profileId);
      console.log("Retrieved Mobile No:", mobileno);
      console.log("Retrieved birthstar:", birthstar);
      console.log("Retrieved gender:", gender);
      console.log("Retrieved height:", height);
      console.log("Retrieved martialstatus:", martialstatus);
    } catch (error) {
      console.error("Error retrieving data from session:", error);
    }
  };

  const fetchMaritalStatus = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Marital_Status/`);
      const maritalStatusArray = Object.keys(response.data).map((key) => ({
        label: response.data[key].marital_sts_name,
        value: response.data[key].marital_sts_id.toString(),
      }));
      setMaritalStatusOptions(maritalStatusArray);
    } catch (error) {
      console.error("Error fetching marital status:", error);
    }
  };

  const fetchHighestEdu = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Highest_Education/`);
      const highestEduArray = Object.keys(response.data).map((key) => ({
        label: response.data[key].education_description,
        value: response.data[key].education_id.toString(),
      }));
      setHighestEduOptions(highestEduArray);
    } catch (error) {
      console.error("Error fetching highest education:", error);
    }
  };

  const fetchAnnualIncome = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Annual_Income/`);
      const annualIncomeArray = Object.keys(response.data).map((key) => ({
        label: response.data[key].income_description,
        value: response.data[key].income_id.toString(),
      }));
      setAnnualIncomeOptions(annualIncomeArray);
    } catch (error) {
      console.error("Error fetching UG Degree:", error);
    }
  };

  useEffect(() => {
    const fetchMatchingStars = async () => {
      const birthstar = await AsyncStorage.getItem("birthStarValue");
      const gender = await AsyncStorage.getItem("gender");
      const birthstarid = await AsyncStorage.getItem("birthStaridValue");
      console.log("birthstar =====>", birthstar);
      console.log("gender =====>", gender);
      console.log("birthstarid =====>", birthstarid);
      try {
        const response = await axios.post(`${config.apiUrl}/auth/Get_Matchstr_Pref/`, {
          birth_star_id: birthstar,
          gender: gender,
          birth_rasi_id: birthstarid,
        });
        const matchCountArrays = Object.values(response.data);
        console.log("matchCountArrays =====>", matchCountArrays);
        setMatchStars(matchCountArrays);
        const initialSelected = matchCountArrays
          .flatMap((matchCountArray) =>
            matchCountArray[0].match_count !== 0
              ? matchCountArray.map((star) => ({
                  id: star.id.toString(),
                  rasi: star.dest_rasi_id.toString(),
                  star: star.dest_star_id.toString(),
                  label: `${star.matching_starname} - ${star.matching_rasiname}`,
                }))
              : []
          );
        setSelectedStarIds(initialSelected);
        console.log("Response from server:", matchCountArrays);
      } catch (error) {
        console.error("Error fetching matching star options:", error);
      }
    };
    fetchMatchingStars();
  }, []);

  useEffect(() => {
    const fetchProfessionalPreferences = async () => {
      try {
        const response = await axios.post(`${config.apiUrl}/auth/Get_Profes_Pref/`);
        const professionalPreferencesArray = Object.keys(response.data).map((key) => ({
          label: response.data[key].Profes_name,
          value: response.data[key].Profes_Pref_id.toString(),
        }));
        setProfessionalPreferences(professionalPreferencesArray);
      } catch (error) {
        console.error("Error fetching Professional Preferences:", error);
      }
    };
    fetchProfessionalPreferences();
  }, []);

  const handleCheckboxChange = (updatedIds) => {
    setSelectedStarIds(updatedIds);
    console.log("Updated Selected Stars:", updatedIds);
  };

  const onSubmit = async (data) => {
    console.log("Data submitted:", data);
    try {
      setSubmitting(true);
      const profileId = await AsyncStorage.getItem("profile_id_new");
      if (!profileId) {
        throw new Error("ProfileId not found in sessionStorage");
      }
      const starArray = selectedStarIds.map((item) => item.id);
      const rasiArray = selectedStarIds.map((item) => item.rasi);
      const starRasiArray = selectedStarIds.map((item) => `${item.star}-${item.rasi}`);
      const StarString = starArray.join(",");
      const RasiString = rasiArray.join(",");
      const combinedString = starRasiArray.join(",");

      console.log(StarString);
      console.log(combinedString);

      const formattedData = {
        profile_id: profileId,
        pref_age_differences: data.ageDifference,
        pref_height_from: data.heightFrom,
        pref_height_to: data.heightTo,
        pref_marital_status: data.maritalStatus.join(","),
        pref_profession: data.profession.join(","),
        pref_education: data.education.join(","),
        pref_anual_income: data.annualIncome,
        pref_chevvai: data.chevvai || "",
        pref_ragukethu: data.rehu || "",
        pref_foreign_intrest: data.foreignInterest,
        pref_porutham_star: StarString,
        pref_porutham_star_rasi: combinedString,
        status: "1",
      };

      console.log("Post Data:", formattedData);
      const response = await axios.post(`${config.apiUrl}/auth/Partner_pref_registration/`, formattedData);
      console.log("Registration response:", response.data);

      if (response.data.Status === 1) {
        await AsyncStorage.setItem("from_partner_settings", "true");
        navigation.navigate("MembershipPlan");
      } else {
        console.log("Registration unsuccessful:", response.data);
      }
    } catch (error) {
      console.error("Error submitting data:", error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (height) {
      if (GenderValue === "Male") {
        setValue("heightTo", height);
      } else if (GenderValue === "Female") {
        setValue("heightFrom", height);
      }
    }
  }, [height, GenderValue, setValue]);

  useEffect(() => {
    retrieveDataFromSessionNew();
  }, []);

  const retrieveDataFromSessionNew = async () => {
    try {
      const maritalstatus = await AsyncStorage.getItem("martial_status");
      if (maritalstatus) {
        const maritalValueInt = maritalstatus;
        setMaritalStatus(maritalValueInt);
        setValue("maritalStatus", [maritalValueInt]);
      }
    } catch (error) {
      console.error("Error retrieving marital status from session:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Gradient Header ────────────────────────────────────────────── */}
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
          <Text style={styles.headerTitle}>Partner Settings</Text>
          <Text style={styles.headerSubtitle}>Set your partner preferences</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.cardContainer}>
          {/* ── Age Difference ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Age Difference</Text>
            <Controller
              control={control}
              name="ageDifference"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Age Difference"
                  data={age}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
          </View>

          {/* ── Height ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Height</Text>
            <View style={styles.rowContainer}>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="heightFrom"
                  render={({ field: { onChange, value } }) => (
                    <CustomDropdown
                      placeholder="From"
                      data={heightOptions}
                      selectedValue={value}
                      onSelect={(item) => onChange(item.value)}
                    />
                  )}
                />
              </View>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="heightTo"
                  render={({ field: { onChange, value } }) => (
                    <CustomDropdown
                      placeholder="To"
                      data={heightOptions}
                      selectedValue={value}
                      onSelect={(item) => onChange(item.value)}
                    />
                  )}
                />
              </View>
            </View>
          </View>

          {/* ── Marital Status ── */}
          <View style={styles.inputContainer}>
            <View style={styles.checkboxGroupHeader}>
              <Pressable
                style={[
                  styles.checkboxBase,
                  maritalStatusSelected?.length === maritalStatusOptions.length &&
                    maritalStatusOptions.length > 0 &&
                    styles.checkboxChecked,
                ]}
                onPress={() => {
                  const allValues = maritalStatusOptions.map((opt) => opt.value);
                  if (maritalStatusSelected?.length === maritalStatusOptions.length) {
                    setValue("maritalStatus", []);
                  } else {
                    setValue("maritalStatus", allValues);
                  }
                }}
              >
                {maritalStatusSelected?.length === maritalStatusOptions.length &&
                  maritalStatusOptions.length > 0 && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
              </Pressable>
              <Pressable
                onPress={() => {
                  const allValues = maritalStatusOptions.map((opt) => opt.value);
                  if (maritalStatusSelected?.length === maritalStatusOptions.length) {
                    setValue("maritalStatus", []);
                  } else {
                    setValue("maritalStatus", allValues);
                  }
                }}
              >
                <Text style={styles.fieldLabel}>Marital Status</Text>
              </Pressable>
            </View>
            <Controller
              control={control}
              name="maritalStatus"
              render={({ field: { onChange, value } }) => (
                <View style={styles.columnGrid}>
                  {maritalStatusOptions.map((status) => (
                    <View key={status.value} style={styles.checkboxItem}>
                      <Pressable
                        style={[
                          styles.checkboxBase,
                          value?.includes(status.value) && styles.checkboxChecked,
                        ]}
                        onPress={() => {
                          const newValue = value?.includes(status.value)
                            ? value.filter((item) => item !== status.value)
                            : [...(value || []), status.value];
                          onChange(newValue);
                        }}
                      >
                        {value?.includes(status.value) && (
                          <Ionicons name="checkmark" size={14} color="white" />
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          const newValue = value?.includes(status.value)
                            ? value.filter((item) => item !== status.value)
                            : [...(value || []), status.value];
                          onChange(newValue);
                        }}
                      >
                        <Text style={styles.checkboxLabel}>{status.label}</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            />
          </View>

          {/* ── Education ── */}
          <View style={styles.inputContainer}>
            <View style={styles.checkboxGroupHeader}>
              <Pressable
                style={[
                  styles.checkboxBase,
                  watch("education")?.length === highestEduOptions.length &&
                    highestEduOptions.length > 0 &&
                    styles.checkboxChecked,
                ]}
                onPress={() => {
                  const allValues = highestEduOptions.map((opt) => opt.value);
                  if (watch("education")?.length === highestEduOptions.length) {
                    setValue("education", []);
                  } else {
                    setValue("education", allValues);
                  }
                }}
              >
                {watch("education")?.length === highestEduOptions.length &&
                  highestEduOptions.length > 0 && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
              </Pressable>
              <Pressable
                onPress={() => {
                  const allValues = highestEduOptions.map((opt) => opt.value);
                  if (watch("education")?.length === highestEduOptions.length) {
                    setValue("education", []);
                  } else {
                    setValue("education", allValues);
                  }
                }}
              >
                <Text style={styles.fieldLabel}>Education</Text>
              </Pressable>
            </View>
            <Controller
              control={control}
              name="education"
              render={({ field: { onChange, value } }) => (
                <View style={styles.columnGrid}>
                  {highestEduOptions.map((education) => (
                    <View key={education.value} style={styles.checkboxItem}>
                      <Pressable
                        style={[
                          styles.checkboxBase,
                          value?.includes(education.value) && styles.checkboxChecked,
                        ]}
                        onPress={async () => {
                          const newValue = value?.includes(education.value)
                            ? value.filter((item) => item !== education.value)
                            : [...(value || []), education.value];
                          onChange(newValue);
                          if (["1", "2", "3"].some((v) => newValue.includes(v))) {
                            await fetchFieldOfStudy();
                          } else {
                            setFieldOfStudyOptions([]);
                          }
                        }}
                      >
                        {value?.includes(education.value) && (
                          <Ionicons name="checkmark" size={14} color="white" />
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          const newValue = value?.includes(education.value)
                            ? value.filter((item) => item !== education.value)
                            : [...(value || []), education.value];
                          onChange(newValue);
                        }}
                      >
                        <Text style={styles.checkboxLabel}>{education.label}</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            />
          </View>

          {/* ── Field of Study ── */}
          <View style={styles.inputContainer}>
            <View style={styles.checkboxGroupHeader}>
              <Pressable
                style={[
                  styles.checkboxBase,
                  fieldOfStudySelected?.length === fieldOfStudyOptions.length &&
                    fieldOfStudyOptions.length > 0 &&
                    styles.checkboxChecked,
                ]}
                onPress={() => {
                  const allValues = fieldOfStudyOptions.map((opt) => opt.value);
                  if (fieldOfStudySelected?.length === fieldOfStudyOptions.length) {
                    setValue("fieldOfStudy", []);
                  } else {
                    setValue("fieldOfStudy", allValues);
                  }
                }}
              >
                {fieldOfStudySelected?.length === fieldOfStudyOptions.length &&
                  fieldOfStudyOptions.length > 0 && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
              </Pressable>
              <Pressable
                onPress={() => {
                  const allValues = fieldOfStudyOptions.map((opt) => opt.value);
                  if (fieldOfStudySelected?.length === fieldOfStudyOptions.length) {
                    setValue("fieldOfStudy", []);
                  } else {
                    setValue("fieldOfStudy", allValues);
                  }
                }}
              >
                <Text style={styles.fieldLabel}>Field of Study</Text>
              </Pressable>
            </View>
            <Controller
              control={control}
              name="fieldOfStudy"
              render={({ field: { onChange, value } }) => (
                <View style={styles.columnGrid}>
                  {fieldOfStudyOptions.map((field) => (
                    <View key={field.value} style={styles.checkboxItem}>
                      <Pressable
                        style={[
                          styles.checkboxBase,
                          value?.includes(field.value) && styles.checkboxChecked,
                        ]}
                        onPress={() => {
                          const newValue = value?.includes(field.value)
                            ? value.filter((item) => item !== field.value)
                            : [...(value || []), field.value];
                          onChange(newValue);
                        }}
                      >
                        {value?.includes(field.value) && (
                          <Ionicons name="checkmark" size={14} color="white" />
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          const newValue = value?.includes(field.value)
                            ? value.filter((item) => item !== field.value)
                            : [...(value || []), field.value];
                          onChange(newValue);
                        }}
                      >
                        <Text style={styles.checkboxLabel}>{field.label}</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            />
            {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
          </View>

          {/* ── Profession ── */}
          <View style={styles.inputContainer}>
            <View style={styles.checkboxGroupHeader}>
              <Pressable
                style={[
                  styles.checkboxBase,
                  watch("profession")?.length === professionalPreferences.length &&
                    professionalPreferences.length > 0 &&
                    styles.checkboxChecked,
                ]}
                onPress={() => {
                  const allValues = professionalPreferences.map((opt) => opt.value);
                  if (watch("profession")?.length === professionalPreferences.length) {
                    setValue("profession", []);
                  } else {
                    setValue("profession", allValues);
                  }
                }}
              >
                {watch("profession")?.length === professionalPreferences.length &&
                  professionalPreferences.length > 0 && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
              </Pressable>
              <Pressable
                onPress={() => {
                  const allValues = professionalPreferences.map((opt) => opt.value);
                  if (watch("profession")?.length === professionalPreferences.length) {
                    setValue("profession", []);
                  } else {
                    setValue("profession", allValues);
                  }
                }}
              >
                <Text style={styles.fieldLabel}>Profession</Text>
              </Pressable>
            </View>
            <Controller
              control={control}
              name="profession"
              render={({ field: { onChange, value } }) => (
                <View style={styles.columnGrid}>
                  {professionalPreferences.map((profession) => (
                    <View key={profession.value} style={styles.checkboxItem}>
                      <Pressable
                        style={[
                          styles.checkboxBase,
                          value?.includes(profession.value) && styles.checkboxChecked,
                        ]}
                        onPress={() => {
                          const newValue = value?.includes(profession.value)
                            ? value.filter((item) => item !== profession.value)
                            : [...(value || []), profession.value];
                          onChange(newValue);
                        }}
                      >
                        {value?.includes(profession.value) && (
                          <Ionicons name="checkmark" size={14} color="white" />
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          const newValue = value?.includes(profession.value)
                            ? value.filter((item) => item !== profession.value)
                            : [...(value || []), profession.value];
                          onChange(newValue);
                        }}
                      >
                        <Text style={styles.checkboxLabel}>{profession.label}</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            />
          </View>

          {/* ── Annual Income Min ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Annual Income Min</Text>
            <Controller
              control={control}
              name="annualIncome"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select min Annual Income"
                  data={annualIncomeOptions}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
          </View>

          {/* ── Annual Income Max ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Annual Income Max</Text>
            <Controller
              control={control}
              name="annualIncomeMax"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select max Annual Income"
                  data={annualIncomeOptions}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
          </View>

          {/* ── Chevvai ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Chevvai</Text>
            <Controller
              control={control}
              name="chevvai"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Chevvai"
                  data={[
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                    { label: "Both", value: "Both" },
                  ]}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
          </View>

          {/* ── Rehu ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Rahu/Ketu Dhosam</Text>
            <Controller
              control={control}
              name="rehu"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Rehu"
                  data={[
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                    { label: "Both", value: "Both" },
                  ]}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
          </View>

          {/* ── Foreign Interest ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Foreign Interest</Text>
            <Controller
              control={control}
              name="foreignInterest"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Foreign Interest"
                  data={foreignInterest}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
          </View>

          {/* ── Matching Stars ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Matching Stars</Text>
            {matchStars.length > 0 ? (
              matchStars
                .sort((a, b) => b[0].match_count - a[0].match_count)
                .map((matchCountArray, index) => {
                  const starAndRasi = matchCountArray.map((star) => ({
                    id: star.id.toString(),
                    matching_starId: star.dest_star_id.toString(),
                    matching_starname: star.matching_starname,
                    matching_rasiId: star.dest_rasi_id.toString(),
                    matching_rasiname: star.matching_rasiname,
                  }));
                  const matchCountValue = matchCountArray[0].match_count;
                  return (
                    <MatchingStars
                      key={`${index}`}
                      matchCountValue={matchCountValue}
                      starAndRasi={starAndRasi}
                      selectedStarIds={selectedStarIds}
                      onCheckboxChange={handleCheckboxChange}
                    />
                  );
                })
            ) : (
              <Text style={styles.helperText}>No match stars available</Text>
            )}
          </View>

          {/* ── Find Match Button ── */}
          <TouchableOpacity
            style={styles.btn}
            onPress={handleSubmit((data) => {
              console.log("Button pressed");
              onSubmit(data);
            })}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primary || "#FF4050"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.linearGradient}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>{submitting ? "Submitting..." : "Find Match"}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.selectedBg || "#FBF5ED",
  },
  // ── Header ──────────────────────────────────────────────────────────────
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
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: rs(12, 13, 14),
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  // ── Scroll content ─────────────────────────────────────────────────────
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: rs(12, 16, 20),
    alignItems: "center",
    paddingBottom: 80,
  },
  cardContainer: {
    width: "90%",
    backgroundColor: Colors.card || "#FFFFFF",
    borderRadius: 24,
    padding: rs(18, 22, 26),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: rs(12, 16, 20),
  },
  inputContainer: {
    width: "100%",
    marginBottom: rs(14, 18, 20),
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted || "#71717A",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfField: {
    flex: 1,
    marginRight: 8,
  },
  checkboxGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  columnGrid: {
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: "100%",
  },
  checkboxBase: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border || "#E4E4E7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary || "#BD1225",
    borderColor: Colors.primary || "#BD1225",
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
    flexShrink: 1,
  },
  // ── Custom Dropdown styles ──────────────────────────────────────────────
  dropdownStyle: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    paddingHorizontal: 12,
    paddingVertical: rs(8, 10, 12),
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: Colors.textMuted || "#71717A",
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
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
  // ── Button ──
  btn: {
    width: "100%",
    borderRadius: 26,
    shadowColor: Colors.primary || "#B72024",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: rs(8, 10, 12),
    marginBottom: 10,
  },
  linearGradient: {
    borderRadius: 26,
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    textAlign: "center",
    color: Colors.primaryForeground || "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  errorText: {
    color: Colors.destructive || "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
  helperText: {
    fontSize: 14,
    color: Colors.textMuted || "#71717A",
    marginTop: 6,
  },
});

export default PartnerSettings;