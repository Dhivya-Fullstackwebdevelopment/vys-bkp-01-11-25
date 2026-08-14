import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";
import CountryPicker from "react-native-country-picker-modal";
import { Colors, rs } from "../Reusable/Theme";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Custom Modal Dropdown ──────────────────────────────────────────────────
const CustomDropdown = ({
  placeholder,
  data = [],
  selectedValue,
  onSelect,
  style,
  labelField = "label",
  valueField = "value",
  multiple = false,
  selectedItems = [],
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // For single-select: derive display label from selectedValue
  const selectedItem = !multiple
    ? data.find((item) => String(item[valueField]) === String(selectedValue))
    : null;
  const displayLabel = multiple
    ? selectedItems.length > 0
      ? selectedItems.map((i) => i[labelField]).join(", ")
      : placeholder
    : selectedItem
    ? selectedItem[labelField]
    : placeholder;

  const isPlaceholder = multiple ? selectedItems.length === 0 : !selectedItem;

  return (
    <>
      <TouchableOpacity
        style={[styles.dropdownStyle, style]}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={isPlaceholder ? styles.dropdownPlaceholder : styles.dropdownSelectedText}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#71717A" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
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
                const isSelected = multiple
                  ? selectedItems.some(
                      (s) => String(s[valueField]) === String(item[valueField])
                    )
                  : String(item[valueField]) === String(selectedValue);
                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownOptionItem,
                      isSelected && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      onSelect(item);
                      if (!multiple) setModalVisible(false);
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
            {multiple && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export const EduDetails = () => {
  const navigation = useNavigation();
  const [selectedDegrees, setSelectedDegrees] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const handleDegreeChange = (item) => {
    setSelectedDegrees((prevSelected) => {
      const isAlreadySelected = prevSelected.some(
        (degree) => degree.value === item.value
      );
      let newSelection;
      if (isAlreadySelected) {
        newSelection = prevSelected.filter((degree) => degree.value !== item.value);
      } else {
        newSelection = [...prevSelected, item];
      }
      const hasOther = newSelection.some(
        (degree) => degree.value === 86 || degree.value === "86"
      );
      setIsOtherSelected(hasOther);
      return newSelection;
    });
  };

  const [formData, setFormData] = useState({
    edValue: "",
    deValue: "",
    educationDetail: "",
    aboutEducation: "",
    boxValue: "",
    inValue: "",
    actualIncome: "",
    cValue: "",
    sValue: "",
    ciValue: "",
    pincode: "",
    careerNotes: "",
    workPlace: "",
    district: "",
    fieldofvalue: "",
    degreeval: "",
  });

  const [errors, setErrors] = useState({});
  const [highestEduOption, setHighestEduOptions] = useState([]);
  const [ugDegreeOption, setUgDegreeOptions] = useState([]);
  const [professionOptions, setProfessionalPreferences] = useState([]);
  const [annualIncomeOption, setAnnualIncomeOptions] = useState([]);
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [fieldOfStudyOptions, setFieldOfStudyOptions] = useState([]);
  const [selectedFieldOfStudy, setSelectedFieldOfStudy] = useState(null);
  const [fieldOfStudyText, setFieldOfStudyText] = useState("");
  const [error, setError] = useState(null);
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [selectedDegree, setSelectedDegree] = useState(null);

  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");
  const [professionDetail, setProfessionDetail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [natureOfBusiness, setNatureOfBusiness] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [otherDegree, setOtherDegree] = useState("");

  const [pickerVisible, setPickerVisible] = useState(false);
  const [currency, setCurrency] = useState({
    code: "Select Currency",
    currency: "INR",
    flag: "",
  });

  const onSelectCurrency = (country) => {
    setCurrency({
      code: country.cca2,
      currency: country.currency[0],
      flag: country.flag,
    });
    setPickerVisible(false);
  };

  useEffect(() => {
    retrieveDataFromSession();
    fetchHighestEdu();
    fetchUgDegree();
    fetchAnnualIncome();
    fetchCountryList();
    fetchProfessionalPreferences();
  }, []);

  const retrieveDataFromSession = async () => {
    try {
      const profileValue = await AsyncStorage.getItem("profile_owner");
      const profileId = await AsyncStorage.getItem("profile_id");
      const mobileno = await AsyncStorage.getItem("Mobile_no");
    } catch (error) {
      console.error("Error retrieving data from session:", error);
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

  const fetchUgDegree = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Ug_Degree/`);
      const ugDegreeArray = Object.keys(response.data).map((key) => ({
        label: response.data[key].degree_description,
        value: response.data[key].degree_id.toString(),
      }));
      setUgDegreeOptions(ugDegreeArray);
    } catch (error) {
      console.error("Error fetching UG Degree:", error);
    }
  };

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

  const fetchAnnualIncome = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Annual_Income/`);
      const annualIncomeArray = Object.keys(response.data).map((key) => ({
        label: response.data[key].income_description,
        value: response.data[key].income_id.toString(),
      }));
      setAnnualIncomeOptions(annualIncomeArray);
    } catch (error) {
      console.error("Error fetching annual income:", error);
    }
  };

  const fetchCountryList = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Country/`);
      const countryData = Object.keys(response.data).map((key) => ({
        label: response.data[key].country_name,
        value: response.data[key].country_id.toString(),
      }));
      setCountryList(countryData);
    } catch (error) {
      console.error("Error fetching country list:", error);
    }
  };

  const fetchStateList = async (countryId) => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_State/`, {
        country_id: countryId,
      });
      const stateData = Object.keys(response.data).map((key) => ({
        label: response.data[key].state_name,
        value: response.data[key].state_id.toString(),
      }));
      setStateList(stateData);
    } catch (error) {
      console.error("Error fetching state list:", error);
    }
  };

  const fetchDistrictList = async (stateId) => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_District/`, {
        state_id: stateId,
      });
      const districtData = Object.values(response.data).map((district) => ({
        label: district.disctict_name,
        value: district.disctict_id.toString(),
      }));
      setDistrictList(districtData);
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  const fetchCityList = async (districtId) => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_City/`, {
        district_id: districtId,
      });
      const cityData = Object.values(response.data).map((city) => ({
        label: city.city_name.trim(),
        value: city.city_id.toString(),
      }));
      setCityList(cityData);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  useEffect(() => {
    const fetchFieldOfStudy = async () => {
      try {
        const response = await axios.post(`${config.apiUrl}/auth/Get_Field_ofstudy/`);
        const options = Object.keys(response.data).map((key) => ({
          label: response.data[key].study_description,
          value: response.data[key].study_id,
        }));
        setFieldOfStudyOptions(options);
        setError(null);
      } catch (error) {
        console.error("Error fetching Field of Study options:", error);
        setError("Failed to load options. Please try again.");
      }
    };

    if (["1", "2", "3"].includes(formData.edValue)) {
      fetchFieldOfStudy();
    } else {
      setFieldOfStudyOptions([]);
    }
  }, [formData.edValue]);

  useEffect(() => {
    const fetchDegrees = async () => {
      try {
        const response = await axios.post(`${config.apiUrl}/auth/Get_Degree_list/`, {
          edu_level: formData.edValue,
          field_of_study: formData.fieldofvalue,
        });
        const options = Object.keys(response.data).map((key) => ({
          label: response.data[key].degeree_description,
          value: response.data[key].degeree_id,
        }));
        setDegreeOptions(options);
        setError(null);
      } catch (error) {
        console.error("Error fetching Degree options:", error);
        setError("Failed to load degree options. Please try again.");
      }
    };

    if (formData.edValue && formData.fieldofvalue) {
      fetchDegrees();
    }
  }, [formData.edValue, formData.fieldofvalue]);

  const validate = () => {
    const newErrors = {};
    if (!formData.edValue) newErrors.edValue = "Highest Education Level is required";
    if (!formData.boxValue) newErrors.boxValue = "Profession is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [field]: undefined,
    }));
  };

  const onSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const profileId = await AsyncStorage.getItem("profile_id_new");
      if (!profileId) {
        throw new Error("ProfileId not found in sessionStorage");
      }

      const degreeValues = selectedDegrees
        .filter((degree) => degree.value !== 86 && degree.value !== "86")
        .map((degree) => degree.value);
      const degreePayload = degreeValues.join(",");

      const isOtherDegreeSelected = selectedDegrees.some(
        (degree) => degree.value === 86 || degree.value === "86"
      );
      const finalOtherDegree = isOtherDegreeSelected ? otherDegree : "";

      let finalCityName = "";
      if (isOtherSelected) {
        finalCityName = formData.ciValue;
      } else if (formData.ciValue) {
        const selectedCityObject = cityList.find(
          (city) => city.value === formData.ciValue
        );
        if (selectedCityObject) {
          finalCityName = selectedCityObject.label;
        }
      }
      const finalWorkOtherCity = isOtherSelected ? formData.ciValue : "";

      const currencyCode =
        currency.currency === "Select Currency" ? "INR" : currency.currency;

      const formattedData = {
        profile_id: profileId,
        highest_education: formData.edValue,
        ug_degeree: formData.deValue,
        about_edu: formData.aboutEducation,
        profession: formData.boxValue,
        anual_income: formData.inValue,
        actual_income: formData.actualIncome,
        work_country: formData.cValue,
        work_state: formData.sValue,
        work_pincode: formData.pincode,
        career_plans: formData.careerNotes,
        work_place: formData.workPlace,
        status: "1",
        work_district: formData.district,
        field_ofstudy: formData.fieldofvalue,
        company_name:
          formData.boxValue === "1" ||
          formData.boxValue === "6" ||
          formData.boxValue === "7"
            ? companyName
            : "",
        designation:
          formData.boxValue === "1" ||
          formData.boxValue === "6" ||
          formData.boxValue === "7"
            ? designation
            : "",
        profession_details:
          formData.boxValue === "1" ||
          formData.boxValue === "6" ||
          formData.boxValue === "7"
            ? professionDetail
            : "",
        business_name:
          formData.boxValue === "2" || formData.boxValue === "6"
            ? businessName
            : "",
        business_address:
          formData.boxValue === "2" || formData.boxValue === "6"
            ? businessAddress
            : "",
        nature_of_business:
          formData.boxValue === "2" || formData.boxValue === "6"
            ? natureOfBusiness
            : "",
        currency: currencyCode,
        degree: degreePayload,
        other_degree: finalOtherDegree,
        work_city: finalCityName,
        work_other_city: finalWorkOtherCity,
      };

      console.log("Formatted Data:", formattedData);

      const response = await axios.post(
        `${config.apiUrl}/auth/Education_registration/`,
        formattedData
      );

      if (response.data.Status === 1) {
        navigation.navigate("HoroDetails");
      } else {
        console.error("Error: Response status is not 1", response.data);
      }
    } catch (error) {
      console.error("Error submitting form data:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Gradient Header ────────────────────────────────────────────── */}
      <LinearGradient
        colors={[
          Colors.primaryGradientStart || "#A00014",
          Colors.primaryGradientEnd || "#4A000A",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBanner}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Education Details</Text>
          <Text style={styles.headerSubtitle}>
            Tell us about your education & career
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {/* ── Highest Education Level ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>
              Highest Education Level{" "}
              <Text style={styles.requiredStar}>*</Text>
            </Text>
            <CustomDropdown
              placeholder="Select your education level"
              data={highestEduOption}
              selectedValue={formData.edValue}
              onSelect={(item) => handleChange("edValue", item.value)}
            />
            {errors.edValue && (
              <Text style={styles.errorText}>{errors.edValue}</Text>
            )}
          </View>

          {/* ── Field of Study ── */}
          {formData.edValue && (
            <View style={styles.inputContainer}>
              {["1", "2", "3"].includes(formData.edValue) ? (
                <>
                  <Text style={styles.fieldLabel}>Field of Study</Text>
                  <CustomDropdown
                    placeholder="Select Field of Study"
                    data={fieldOfStudyOptions}
                    selectedValue={formData.fieldofvalue || ""}
                    onSelect={(item) => handleChange("fieldofvalue", item.value)}
                  />
                </>
              ) : formData.edValue === "4" ? (
                <>
                  <Text style={styles.fieldLabel}>Field of Study</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your Field of Study"
                    placeholderTextColor={Colors.textMuted}
                    value={fieldOfStudyText || ""}
                    onChangeText={(text) => setFieldOfStudyText(text)}
                  />
                </>
              ) : null}
            </View>
          )}

          {/* ── Specific Field (Degrees) ── */}
          {["1", "2", "3", "4"].includes(formData.edValue) && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Specific Field</Text>
              <CustomDropdown
                placeholder="Select degrees"
                data={degreeOptions}
                selectedValue={null}
                onSelect={(item) => handleDegreeChange(item)}
                multiple={true}
                selectedItems={selectedDegrees}
              />

              <TextInput
                style={[styles.textArea, { marginTop: 8 }]}
                multiline
                editable={false}
                value={
                  Array.isArray(selectedDegrees)
                    ? selectedDegrees.map((degree) => degree.label).join(", ")
                    : ""
                }
              />

              {isOtherSelected && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.fieldLabel}>Other Education</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your degree"
                    placeholderTextColor={Colors.textMuted}
                    value={otherDegree}
                    onChangeText={(text) => setOtherDegree(text)}
                  />
                </View>
              )}
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          )}

          {/* ── About Education ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>About your Education</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter details about education"
              placeholderTextColor={Colors.textMuted}
              value={formData.aboutEducation}
              onChangeText={(value) => handleChange("aboutEducation", value)}
              multiline
            />
          </View>

          {/* ── Profession ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>
              Profession <Text style={styles.requiredStar}>*</Text>
            </Text>
            <CustomDropdown
              placeholder="Select Profession"
              data={professionOptions}
              selectedValue={formData.boxValue}
              onSelect={(item) => handleChange("boxValue", item.value)}
            />
            {errors.boxValue && (
              <Text style={styles.errorText}>{errors.boxValue}</Text>
            )}
          </View>

          {/* ── Conditional fields for profession ── */}
          {formData.boxValue === "1" && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Company Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter company name"
                placeholderTextColor={Colors.textMuted}
                value={companyName}
                onChangeText={setCompanyName}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Designation
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter designation"
                placeholderTextColor={Colors.textMuted}
                value={designation}
                onChangeText={setDesignation}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Profession Details
              </Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Enter profession details"
                placeholderTextColor={Colors.textMuted}
                multiline
                value={professionDetail}
                onChangeText={setProfessionDetail}
              />
            </View>
          )}

          {formData.boxValue === "2" && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Business Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter business name"
                placeholderTextColor={Colors.textMuted}
                value={businessName}
                onChangeText={setBusinessName}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Business Address
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter business address"
                placeholderTextColor={Colors.textMuted}
                value={businessAddress}
                onChangeText={setBusinessAddress}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Nature of Business
              </Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Enter nature of business"
                placeholderTextColor={Colors.textMuted}
                multiline
                value={natureOfBusiness}
                onChangeText={setNatureOfBusiness}
              />
            </View>
          )}

          {formData.boxValue === "6" && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Company Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter company name"
                placeholderTextColor={Colors.textMuted}
                value={companyName}
                onChangeText={setCompanyName}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Designation
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter designation"
                placeholderTextColor={Colors.textMuted}
                value={designation}
                onChangeText={setDesignation}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Profession Details
              </Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Enter profession details"
                placeholderTextColor={Colors.textMuted}
                multiline
                value={professionDetail}
                onChangeText={setProfessionDetail}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Business Name
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter business name"
                placeholderTextColor={Colors.textMuted}
                value={businessName}
                onChangeText={setBusinessName}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Business Address
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter business address"
                placeholderTextColor={Colors.textMuted}
                value={businessAddress}
                onChangeText={setBusinessAddress}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Nature of Business
              </Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Enter nature of business"
                placeholderTextColor={Colors.textMuted}
                multiline
                value={natureOfBusiness}
                onChangeText={setNatureOfBusiness}
              />
            </View>
          )}

          {formData.boxValue === "7" && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Company Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter company name"
                placeholderTextColor={Colors.textMuted}
                value={companyName}
                onChangeText={setCompanyName}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Designation
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter designation"
                placeholderTextColor={Colors.textMuted}
                value={designation}
                onChangeText={setDesignation}
              />
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Profession Details
              </Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Enter profession details"
                placeholderTextColor={Colors.textMuted}
                multiline
                value={professionDetail}
                onChangeText={setProfessionDetail}
              />
            </View>
          )}

          {/* ── Annual Income ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Annual Income</Text>
            <View style={styles.currencyFlexContainer}>
              <View style={styles.currencyTextContainer}>
                <Text style={styles.currencyText}>INR (₹)</Text>
              </View>
              <CustomDropdown
                placeholder="Select Annual Income"
                data={annualIncomeOption}
                selectedValue={formData.inValue}
                onSelect={(item) => handleChange("inValue", item.value)}
                style={styles.annualInputStyle}
              />
            </View>
          </View>

          {/* ── Actual Income ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Actual Income</Text>
            <View style={styles.currencyFlexContainer}>
              <View style={styles.annualInputContainer}>
                <TouchableOpacity
                  style={styles.currencyPicker}
                  onPress={() => setPickerVisible(true)}
                >
                  <Text style={styles.currencyName}>{currency.currency}</Text>
                </TouchableOpacity>
                <CountryPicker
                  withFilter
                  withCurrency
                  withFlag
                  withCountryNameButton
                  withAlphaFilter
                  onSelect={onSelectCurrency}
                  visible={pickerVisible}
                  onClose={() => setPickerVisible(false)}
                  renderFlagButton={() => <></>}
                />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.actualIncomeInput]}
                  placeholder="Enter actual income"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={formData.actualIncome}
                  onChangeText={(value) => handleChange("actualIncome", value)}
                />
              </View>
            </View>
            {errors.actualIncome && (
              <Text style={styles.errorText}>{errors.actualIncome}</Text>
            )}
          </View>

          {/* ── Work Country ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Work Country</Text>
            <CustomDropdown
              placeholder="Select country"
              data={countryList}
              selectedValue={formData.cValue}
              onSelect={(item) => {
                handleChange("cValue", item.value);
                fetchStateList(item.value);
                setSelectedCountry(item.value);
              }}
            />
          </View>

          {/* ── Work State (India only) ── */}
          {selectedCountry === "1" && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Work State</Text>
              <CustomDropdown
                placeholder="Select state"
                data={stateList}
                selectedValue={formData.sValue}
                onSelect={(item) => {
                  handleChange("sValue", item.value);
                  fetchDistrictList(item.value);
                  setSelectedDistrict(null);
                  handleChange("district", "");
                  handleChange("ciValue", "");
                  setCityList([]);
                  setErrors((prev) => ({ ...prev, sValue: undefined }));
                }}
              />
            </View>
          )}

          {/* ── District (India only) ── */}
          {selectedCountry === "1" && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>District</Text>
              <CustomDropdown
                placeholder="Select district"
                data={districtList}
                selectedValue={formData.district}
                onSelect={(item) => {
                  handleChange("district", item.value);
                  setSelectedDistrict(item.value);
                  fetchCityList(item.value);
                  handleChange("ciValue", "");
                  setIsOtherSelected(false);
                  setErrors((prev) => ({ ...prev, district: undefined }));
                }}
              />
            </View>
          )}

          {/* ── Work City (India only) ── */}
          {selectedCountry === "1" && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Work City</Text>
              {!isOtherSelected ? (
                <CustomDropdown
                  placeholder="Select city"
                  data={[...cityList, { label: "Others", value: "Others" }]}
                  selectedValue={formData.ciValue}
                  onSelect={(item) => {
                    if (item.value === "Others") {
                      setIsOtherSelected(true);
                      handleChange("ciValue", "");
                    } else {
                      handleChange("ciValue", item.value);
                      setErrors((prev) => ({ ...prev, ciValue: undefined }));
                      if (formData.district) {
                        fetchCityList(formData.district);
                      }
                    }
                  }}
                />
              ) : (
                <TextInput
                  style={[styles.input, errors.ciValue && styles.inputError]}
                  placeholder="Enter your city"
                  placeholderTextColor={Colors.textMuted}
                  value={formData.ciValue}
                  onChangeText={(text) => {
                    handleChange("ciValue", text);
                    setErrors((prev) => ({ ...prev, ciValue: undefined }));
                  }}
                />
              )}
              {errors.ciValue && (
                <Text style={styles.errorText}>{errors.ciValue}</Text>
              )}
            </View>
          )}

          {/* ── Work Place (outside India) ── */}
          {selectedCountry !== "1" && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Work Place</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter work place"
                placeholderTextColor={Colors.textMuted}
                value={formData.workPlace}
                onChangeText={(value) => handleChange("workPlace", value)}
              />
            </View>
          )}

          {/* ── Pincode ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Pincode</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your pincode"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={formData.pincode}
              onChangeText={(value) => handleChange("pincode", value)}
            />
            {errors.pincode && (
              <Text style={styles.errorText}>{errors.pincode}</Text>
            )}
          </View>

          {/* ── Career Notes ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Career Notes</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              multiline
              placeholder="Enter career notes"
              placeholderTextColor={Colors.textMuted}
              value={formData.careerNotes}
              onChangeText={(value) => handleChange("careerNotes", value)}
            />
            {errors.careerNotes && (
              <Text style={styles.errorText}>{errors.careerNotes}</Text>
            )}
          </View>

          {/* ── Next Button ── */}
          <TouchableOpacity
            style={styles.btn}
            onPress={onSubmit}
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
                <Text style={styles.buttonText}>
                  {submitting ? "Submitting..." : "Next"}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={Colors.primaryForeground || "#FFFFFF"}
                />
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
  requiredStar: {
    color: Colors.destructive || "#EF4444",
  },
  input: {
    color: Colors.textDark || "#1E1E1E",
    borderWidth: 1,
    borderRadius: 16,
    borderColor: Colors.border || "#E4E4E7",
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    paddingHorizontal: 12,
    paddingVertical: rs(10, 12, 14),
    fontSize: 14,
    textAlignVertical: "top",
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    paddingHorizontal: 12,
    paddingVertical: rs(10, 12, 14),
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
    minHeight: 80,
    textAlignVertical: "top",
  },
  // ── Custom Dropdown styles ───────────────────────────────────────────────
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
    flex: 1,
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
    flex: 1,
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
  doneButton: {
    margin: 12,
    backgroundColor: Colors.primary || "#BD1225",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  // ── Currency / Income ───────────────────────────────────────────────────
  currencyFlexContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyTextContainer: {
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    paddingHorizontal: 10,
    paddingVertical: rs(8, 10, 12),
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  currencyText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textDark || "#1E1E1E",
  },
  annualInputStyle: {
    flex: 1,
  },
  annualInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  currencyPicker: {
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    paddingHorizontal: 12,
    paddingVertical: rs(8, 10, 12),
    justifyContent: "center",
    alignItems: "center",
  },
  currencyName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textDark || "#1E1E1E",
  },
  actualIncomeInput: {
    flex: 1,
  },
  inputError: {
    borderColor: Colors.destructive || "#EF4444",
  },
  errorText: {
    color: Colors.destructive || "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
  // ── Button ──────────────────────────────────────────────────────────────
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
    marginRight: 6,
  },
});

export default EduDetails;