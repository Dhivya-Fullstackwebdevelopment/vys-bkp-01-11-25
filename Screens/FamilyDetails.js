import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import config from "../API/Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tooltip, Icon } from "react-native-elements";
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
  fatherName: z.string().min(1, "Father's Name is required"),
  moValue: z.string().optional(),
  foValue: z.string().optional(),
  brotherValue: z.string().optional(),
  sisterValue: z.string().optional(),
  brotherMarriedValue: z.string().optional(),
  sisterMarriedValue: z.string().optional(),
  ftValue: z.string().optional(),
  fvValue: z.string().optional(),
  fsValue: z.string().optional(),
  motherName: z.string().optional(),
  myhobbies: z.string().optional(),
  AboutMyself: z.string().optional(),
  familyName: z.string().optional(),
  bloodGroup: z.string().optional(),
  bodytype: z.string().optional(),
  eyewear: z.string().optional(),
  weight: z.string().optional(),
  suyaGothram: z.string().min(1, "Suya Gothram is required"),
  noOfChildren: z.string().optional(),
  fatherAlive: z.string().optional(),
  motherAlive: z.string().optional(),
  propertyDetails: z.string().optional(),
  propertyWorth: z.string().optional(),
  uncleGothram: z.string().optional(),
  ancestorOrigin: z.string().optional(),
  aboutFamily: z.string().optional(),
});

const bloodGroupOptions = [
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
];

const bodytype = [
  { label: 'Slim', value: 'Slim' },
  { label: 'Fat', value: 'Fat' },
  { label: 'Normal', value: 'Normal' },
];

const eyewearOptions = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
];

export const FamilyDetails = () => {
  const scrollViewRef = useRef(null);
  const inputRefs = useRef({});
  const navigation = useNavigation();

  const [showBrotherMarried, setShowBrotherMarried] = useState(false);
  const [showSisterMarried, setShowSisterMarried] = useState(false);
  const [physicallyChallenged, setPhysicallyChallenged] = useState('no');
  const [showPhysicallyChallengedDetails, setShowPhysicallyChallengedDetails] = useState(false);
  const [foOccupationOptions, setFoOccupationOptions] = useState([]);
  const [moOccupationOptions, setMoOccupationOptions] = useState([]);
  const [propertyWorthOptions, setPropertyWorth] = useState([]);
  const [familyTypeOptions, setFamilyType] = useState([]);
  const [familyStatusOptions, setFamilyStatus] = useState([]);
  const [familyValueOptions, setFamilyValues] = useState([]);
  const [MobileNo, setMobileNo] = useState("");
  const [ProfileId, setProfileId] = useState("");
  const [ProfileOwner, setProfileOwner] = useState("");
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    handleKeyDown,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fatherName: "",
      moValue: "",
      foValue: "",
      brotherValue: "",
      brotherMarriedValue: "",
      sisterValue: "",
      sisterMarriedValue: "",
      ftValue: "",
      fvValue: "",
      fsValue: "",
      motherName: "",
      propertyDetails: "",
      propertyWorth: "",
      suyaGothram: "",
      uncleGothram: "",
      ancestorOrigin: "",
      aboutFamily: "",
      myhobbies: "",
      AboutMyself: "",
      familyName: "",
      bloodGroup: "",
      weight: "",
      bodytype: "",
      eyewear: "",
      noOfChildren: "",
      fatherAlive: "yes",
      motherAlive: "yes",
    },
  });

  useEffect(() => {
    retrieveDataFromSession();
    fetchParentOccupations();
    fetchPropertyworth();
    fetchFamilyType();
    fetchFamilyStatus();
    fetchFamilyValue();
  }, []);

  const retrieveDataFromSession = async () => {
    try {
      let profileValue = await AsyncStorage.getItem("profile_owner");
      const profileId = await AsyncStorage.getItem("profile_id");
      const mobileno = await AsyncStorage.getItem("Mobile_no");
      const maritalStatusValue = await AsyncStorage.getItem("martial_status");

      profileValue = profileValue === "Ownself" ? "yourself" : profileValue;
      setMobileNo(mobileno);
      setProfileId(profileId);
      setProfileOwner(profileValue);
      setMaritalStatus(maritalStatusValue);

      console.log("Retrieved Profile Value:", profileValue);
      console.log("Retrieved Profile ID:", profileId);
      console.log("Retrieved Mobile No:", mobileno);
      console.log("Retrieved Marital Status:", maritalStatusValue);
    } catch (error) {
      console.error("Error retrieving data from session:", error);
    }
  };

  const fetchParentOccupations = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Parent_Occupation/`);
      const ParentOccupationArray = Object.keys(response.data).map(key => ({
        label: response.data[key].occupation_description,
        value: response.data[key].occupation_id.toString(),
      }));
      setFoOccupationOptions(ParentOccupationArray);
      setMoOccupationOptions(ParentOccupationArray);
    } catch (error) {
      console.error("Error fetching Occupation:", error);
    }
  };

  const fetchPropertyworth = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Property_Worth/`);
      const PropertyWorthArray = Object.keys(response.data).map(key => ({
        label: response.data[key].property_description,
        value: response.data[key].property_id.toString(),
      }));
      setPropertyWorth(PropertyWorthArray);
    } catch (error) {
      console.error("Error fetching Property Worth:", error);
    }
  };

  const fetchFamilyType = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_FamilyType/`);
      const FamilyTypeArray = Object.keys(response.data).map(key => ({
        label: response.data[key].family_description,
        value: response.data[key].family_id.toString(),
      }));
      setFamilyType(FamilyTypeArray);
    } catch (error) {
      console.error("Error fetching Family type:", error);
    }
  };

  const fetchFamilyStatus = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_FamilyStatus/`);
      const FamilyStatusArray = Object.keys(response.data).map(key => ({
        label: response.data[key].family_status_name,
        value: response.data[key].family_status_id.toString(),
      }));
      setFamilyStatus(FamilyStatusArray);
    } catch (error) {
      console.error("Error fetching Family status:", error);
    }
  };

  const fetchFamilyValue = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_FamilyValue/`);
      const FamilyValueArray = Object.keys(response.data).map(key => ({
        label: response.data[key].family_value_name,
        value: response.data[key].family_value_id.toString(),
      }));
      setFamilyValues(FamilyValueArray);
    } catch (error) {
      console.error("Error fetching Family Value:", error);
    }
  };

  const scrollToError = (errorField) => {
    if (errorField && inputRefs.current[errorField]) {
      inputRefs.current[errorField].focus();
      scrollViewRef.current?.scrollTo({
        y: inputRefs.current[errorField].offsetTop - 50,
        animated: true,
      });
    } else {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const onError = (errors) => {
    if (errors.fatherName || errors.motherName) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      const firstErrorField = Object.keys(errors)[0];
      scrollToError(firstErrorField);
    }
  };

  const fetchExistingFamilyData = async () => {
    try {
      const profileId = await AsyncStorage.getItem("profile_id_new");
      if (!profileId) return;
      const response = await axios.post(`${config.apiUrl}/auth/Get_Family_Details/`, {
        profile_id: profileId,
      });
      if (response.data.Status === 1 && response.data.family_details) {
        const familyData = response.data.family_details;
        setValue("fatherName", familyData.father_name || "");
        setValue("foValue", familyData.father_occupation || "");
        setValue("motherName", familyData.mother_name || "");
        setValue("moValue", familyData.mother_occupation || "");
        setValue("familyName", familyData.family_name || "");
        setValue("suyaGothram", familyData.suya_gothram || "");
        setValue("myhobbies", familyData.hobbies || "");
        setValue("AboutMyself", familyData.about_self || "");
        setValue("bloodGroup", familyData.blood_group || "");
        setValue("weight", familyData.weight ? familyData.weight.toString() : "");
        setValue("bodytype", familyData.bodytype || "");
        setValue("eyewear", familyData.eyewear || "");
        setValue("brotherValue", familyData.no_of_brother ? familyData.no_of_brother.toString() : "0");
        setValue("brotherMarriedValue", familyData.no_of_bro_married ? familyData.no_of_bro_married.toString() : "0");
        setValue("sisterValue", familyData.no_of_sister ? familyData.no_of_sister.toString() : "0");
        setValue("sisterMarriedValue", familyData.no_of_sis_married ? familyData.no_of_sis_married.toString() : "0");
        setValue("ftValue", familyData.family_type || "");
        setValue("fvValue", familyData.family_value || "");
        setValue("fsValue", familyData.family_status || "");
        setValue("propertyWorth", familyData.property_worth || "");
        setValue("uncleGothram", familyData.uncle_gothram || "");
        setValue("ancestorOrigin", familyData.ancestor_origin || "");
        setValue("aboutFamily", familyData.about_family || "");
        setValue("noOfChildren", familyData.no_of_children ? familyData.no_of_children.toString() : "");
        setValue("fatherAlive", familyData.father_alive === "no" ? "no" : "yes");
        setValue("motherAlive", familyData.mother_alive === "no" ? "no" : "yes");
        setPhysicallyChallenged(familyData.Pysically_changed === "yes" ? "yes" : "no");
        setShowPhysicallyChallengedDetails(familyData.Pysically_changed === "yes");
      }
    } catch (error) {
      console.error("Error fetching existing family data:", error);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const profileId = await AsyncStorage.getItem("profile_id_new");
      if (!profileId) {
        throw new Error("ProfileId not found in sessionStorage");
      }
      const formattedData = {
        profile_id: profileId,
        father_name: data.fatherName,
        father_occupation: data.foValue,
        mother_name: data.motherName,
        mother_occupation: data.moValue,
        family_name: data.familyName,
        about_self: data.AboutMyself,
        hobbies: data.myhobbies,
        blood_group: data.bloodGroup,
        Pysically_changed: physicallyChallenged,
        no_of_brother: data.brotherValue || 0,
        no_of_bro_married: data.brotherMarriedValue || 0,
        no_of_sister: data.sisterValue || 0,
        no_of_sis_married: data.sisterMarriedValue || 0,
        family_type: data.ftValue,
        family_value: data.fvValue,
        family_status: data.fsValue,
        property_worth: data.propertyWorth,
        ancestor_origin: data.ancestorOrigin,
        uncle_gothram: data.uncleGothram,
        suya_gothram: data.suyaGothram,
        weight: data.weight,
        body_type: data.bodytype,
        eye_wear: data.eyewear,
        no_of_children: data.noOfChildren || "0",
        father_alive: data.fatherAlive || "yes",
        mother_alive: data.motherAlive || "yes",
        property_details: data.propertyDetails,
        about_family: data.aboutFamily,
      };

      console.log("Formatted Data:", formattedData);

      const response = await axios.post(`${config.apiUrl}/auth/Family_registration/`, formattedData);
      if (response.data.Status === 1) {
        navigation.navigate("EduDetails");
      } else {
        console.error("Error: Response status is not 1", response.data);
      }
    } catch (error) {
      console.error("Error submitting form data:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const brotherValue = watch("brotherValue");
  const sisterValue = watch("sisterValue");

  useEffect(() => {
    setShowBrotherMarried(parseInt(brotherValue) >= 1);
  }, [brotherValue]);

  useEffect(() => {
    setShowSisterMarried(parseInt(sisterValue) >= 1);
  }, [sisterValue]);

  const renderOptions = (maxValue) => {
    const options = [];
    for (let i = 0; i <= maxValue; i++) {
      options.push({ value: i.toString(), label: i === 5 ? "5+" : i.toString() });
    }
    return options;
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
          <Text style={styles.headerTitle}>Family Details</Text>
          <Text style={styles.headerSubtitle}>Tell us about your family</Text>
        </View>
      </LinearGradient>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.cardContainer}>
          {/* ── Father Name ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Father Name <Text style={styles.requiredStar}>*</Text></Text>
            <Controller
              control={control}
              name="fatherName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  ref={(el) => (inputRefs.current.fatherName = el)}
                  style={styles.input}
                  placeholder="Enter Father's Name"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.fatherName && (
              <Text style={styles.errorText}>{errors.fatherName.message}</Text>
            )}
          </View>

          {/* ── Father Occupation ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Father Occupation</Text>
            <Controller
              control={control}
              name="foValue"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter Father's Occupation"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* ── Mother Name ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Mother Name</Text>
            <Controller
              control={control}
              name="motherName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter Mother's Name"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* ── Mother Occupation ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Mother Occupation</Text>
            <Controller
              control={control}
              name="moValue"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter Mother's Occupation"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* ── Family Name ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Family Name</Text>
            <Controller
              control={control}
              name="familyName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter Family Name"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* ── Suya Gothram ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Suya Gothram <Text style={styles.requiredStar}>*</Text></Text>
            <Controller
              control={control}
              name="suyaGothram"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter Suya Gothram"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.suyaGothram && (
              <Text style={styles.errorText}>{errors.suyaGothram.message}</Text>
            )}
          </View>

          {/* ── My Hobbies ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>My Hobbies</Text>
            <Controller
              control={control}
              name="myhobbies"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter your hobbies..."
                  placeholderTextColor={Colors.textMuted}
                  multiline={true}
                  numberOfLines={4}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* ── About Myself ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>About Myself</Text>
            <Controller
              control={control}
              name="AboutMyself"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter about yourself..."
                  placeholderTextColor={Colors.textMuted}
                  multiline={true}
                  numberOfLines={4}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* ── Physically Challenged ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Physically Challenged ?</Text>
            <View style={styles.radioButtonContainer}>
              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    physicallyChallenged === 'yes' && styles.radioButtonSelected,
                  ]}
                  onPress={() => {
                    setPhysicallyChallenged('yes');
                    setShowPhysicallyChallengedDetails(true);
                  }}
                >
                  {physicallyChallenged === 'yes' && <View style={styles.innerCircle} />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setPhysicallyChallenged('yes');
                    setShowPhysicallyChallengedDetails(true);
                  }}
                >
                  <Text style={styles.radioLabel}>Yes</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    physicallyChallenged === 'no' && styles.radioButtonSelected,
                  ]}
                  onPress={() => {
                    setPhysicallyChallenged('no');
                    setShowPhysicallyChallengedDetails(false);
                  }}
                >
                  {physicallyChallenged === 'no' && <View style={styles.innerCircle} />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setPhysicallyChallenged('no');
                    setShowPhysicallyChallengedDetails(false);
                  }}
                >
                  <Text style={styles.radioLabel}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {showPhysicallyChallengedDetails && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Details</Text>
              <Controller
                control={control}
                name="physicallyChallengedDetails"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Details..."
                    placeholderTextColor={Colors.textMuted}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          )}

          {/* ── Father Alive ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Father Alive</Text>
            <Controller
              control={control}
              name="fatherAlive"
              render={({ field: { onChange, value } }) => (
                <View style={styles.radioButtonContainer}>
                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        value === 'yes' && styles.radioButtonSelected,
                      ]}
                      onPress={() => onChange('yes')}
                    >
                      {value === 'yes' && <View style={styles.innerCircle} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onChange('yes')}>
                      <Text style={styles.radioLabel}>Yes</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        value === 'no' && styles.radioButtonSelected,
                      ]}
                      onPress={() => onChange('no')}
                    >
                      {value === 'no' && <View style={styles.innerCircle} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onChange('no')}>
                      <Text style={styles.radioLabel}>No</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>

          {/* ── Mother Alive ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Mother Alive</Text>
            <Controller
              control={control}
              name="motherAlive"
              render={({ field: { onChange, value } }) => (
                <View style={styles.radioButtonContainer}>
                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        value === 'yes' && styles.radioButtonSelected,
                      ]}
                      onPress={() => onChange('yes')}
                    >
                      {value === 'yes' && <View style={styles.innerCircle} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onChange('yes')}>
                      <Text style={styles.radioLabel}>Yes</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        value === 'no' && styles.radioButtonSelected,
                      ]}
                      onPress={() => onChange('no')}
                    >
                      {value === 'no' && <View style={styles.innerCircle} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onChange('no')}>
                      <Text style={styles.radioLabel}>No</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>

          {/* ── Weight ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Weight (kg)</Text>
            <Controller
              name="weight"
              control={control}
              rules={{
                validate: (value) => {
                  if (!value) return true;
                  if (String(value).length > 3) return "Weight can only be up to 3 digits";
                  if (Number(value) > 150) return "Weight must be below 150";
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={String(value)}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  maxLength={3}
                  onKeyPress={handleKeyDown}
                  placeholder="Enter weight"
                  placeholderTextColor={Colors.textMuted}
                />
              )}
            />
            {errors.weight && <Text style={styles.errorText}>{errors.weight.message}</Text>}
          </View>

          {/* ── Body Type ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Body Type</Text>
            <Controller
              name="bodytype"
              control={control}
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Body Type"
                  data={bodytype}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
          </View>

          {/* ── Eye Wear ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Eye Wear</Text>
            <Controller
              name="eyewear"
              control={control}
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Eye Wear"
                  data={eyewearOptions}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
          </View>

          {/* ── Blood Group ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Blood Group</Text>
            <Controller
              control={control}
              name="bloodGroup"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Blood Group"
                  data={bloodGroupOptions}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
          </View>

          {/* ── No. of Children (conditional) ── */}
          {['2', '3', '5'].includes(maritalStatus) && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>No. of Children</Text>
              <Controller
                control={control}
                name="noOfChildren"
                render={({ field: { onChange, value } }) => (
                  <CustomDropdown
                    placeholder="Select No. of Children"
                    data={[
                      { label: '1', value: '1' },
                      { label: '2', value: '2' },
                      { label: '3', value: '3' },
                      { label: '4', value: '4' },
                      { label: '5', value: '5' },
                    ]}
                    selectedValue={value}
                    onSelect={(item) => onChange(item.value)}
                  />
                )}
              />
            </View>
          )}

          {/* ── Brother ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Brother</Text>
            <Controller
              control={control}
              name="brotherValue"
              render={({ field: { onChange, value } }) => (
                <View style={styles.boxRow}>
                  {[0, 1, 2, 3, 4, 5].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.box,
                        value === val.toString() && styles.boxSelected,
                      ]}
                      onPress={() => onChange(val.toString())}
                    >
                      <Text
                        style={[
                          styles.boxText,
                          value === val.toString() && styles.boxTextSelected,
                        ]}
                      >
                        {val === 5 ? "5+" : val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* ── Brother Married ── */}
          {showBrotherMarried && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Brother Married</Text>
              <Controller
                control={control}
                name="brotherMarriedValue"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.boxRow}>
                    {renderOptions(parseInt(brotherValue)).map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.box,
                          value === option.value && styles.boxSelected,
                        ]}
                        onPress={() => onChange(option.value)}
                      >
                        <Text
                          style={[
                            styles.boxText,
                            value === option.value && styles.boxTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>
          )}

          {/* ── Sister ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Sister</Text>
            <Controller
              control={control}
              name="sisterValue"
              render={({ field: { onChange, value } }) => (
                <View style={styles.boxRow}>
                  {[0, 1, 2, 3, 4, 5].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.box,
                        value === val.toString() && styles.boxSelected,
                      ]}
                      onPress={() => onChange(val.toString())}
                    >
                      <Text
                        style={[
                          styles.boxText,
                          value === val.toString() && styles.boxTextSelected,
                        ]}
                      >
                        {val === 5 ? "5+" : val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* ── Sister Married ── */}
          {showSisterMarried && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Sister Married</Text>
              <Controller
                control={control}
                name="sisterMarriedValue"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.boxRow}>
                    {renderOptions(parseInt(sisterValue)).map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.box,
                          value === option.value && styles.boxSelected,
                        ]}
                        onPress={() => onChange(option.value)}
                      >
                        <Text
                          style={[
                            styles.boxText,
                            value === option.value && styles.boxTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>
          )}

          {/* ── Family Type ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Family Type</Text>
            <Controller
              control={control}
              name="ftValue"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Family Type"
                  data={familyTypeOptions}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
          </View>

          {/* ── Family Value ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Family Value</Text>
            <Controller
              control={control}
              name="fvValue"
              render={({ field: { onChange, value } }) => (
                <View style={styles.boxRow}>
                  {familyValueOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.box,
                        value === option.value && styles.boxSelected,
                      ]}
                      onPress={() => onChange(option.value)}
                    >
                      <Text
                        style={[
                          styles.boxText,
                          value === option.value && styles.boxTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* ── Family Status ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Family Status</Text>
            <Controller
              control={control}
              name="fsValue"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Family Status"
                  data={familyStatusOptions}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
          </View>

          {/* ── Property Details ── */}
          <View style={styles.inputContainer}>
            <View style={styles.labelWrapper}>
              <Text style={styles.fieldLabel}>Property Details</Text>
              <Tooltip
                popover={
                  <Text style={styles.tooltipText}>
                    Residential, Commercial, Shopping Complex, Farm House, Shop, Agriculture land, Multistorage building
                  </Text>
                }
                backgroundColor="#fff"
                overlayColor="rgba(0,0,0,0.5)"
                width={250}
                height={120}
                placement="bottom"
              >
                <Icon name="info" type="material" size={16} color={Colors.textMuted} style={styles.infoIcon} />
              </Tooltip>
            </View>
            <Controller
              control={control}
              name="propertyDetails"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter Property Details"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* ── Property Worth ── */}
          <View style={styles.inputContainer}>
            <View style={styles.labelWrapper}>
              <Text style={styles.fieldLabel}>Property Worth</Text>
              <Tooltip
                popover={
                  <Text style={styles.tooltipText}>
                    Approx 1c, 5c, 50c, 30L, 80L, etc.,
                  </Text>
                }
                backgroundColor="#fff"
                overlayColor="rgba(0,0,0,0.5)"
                width={250}
                height={120}
                placement="bottom"
              >
                <Icon name="info" type="material" size={16} color={Colors.textMuted} style={styles.infoIcon} />
              </Tooltip>
            </View>
            <Controller
              control={control}
              name="propertyWorth"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter Property Worth"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* ── Uncle Gothram ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Uncle Gothram</Text>
            <Controller
              control={control}
              name="uncleGothram"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter Uncle Gothram"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* ── Ancestor Origin ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Ancestor Origin</Text>
            <Controller
              control={control}
              name="ancestorOrigin"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter Ancestor Origin"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* ── About Family ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>About Family</Text>
            <Controller
              control={control}
              name="aboutFamily"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter about your family..."
                  placeholderTextColor={Colors.textMuted}
                  multiline={true}
                  numberOfLines={4}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* ── Next Button ── */}
          <TouchableOpacity
            style={styles.btn}
            onPress={handleSubmit(onSubmit, onError)}
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
                <Text style={styles.buttonText}>{submitting ? "Submitting..." : "Next"}</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.primaryForeground || "#FFFFFF"} />
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
    height: 100,
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
  // ── Radio / Box styles ──────────────────────────────────────────────────
  radioButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "35%",
    marginTop: 8,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border || "#ccc",
    alignItems: "center",
    justifyContent: "center",
    height: 18,
    width: 18,
    marginRight: 6,
  },
  radioButtonSelected: {
    backgroundColor: Colors.primary || "#FF6666",
    borderColor: Colors.primary || "#FF6666",
  },
  innerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  radioLabel: {
    fontSize: 14,
    color: Colors.textDark || "#535665",
  },
  boxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  box: {
    borderWidth: 1,
    borderColor: Colors.border || "#D4D5D9",
    backgroundColor: Colors.card || "#fff",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginHorizontal: 1,
    borderRadius: 4,
  },
  boxSelected: {
    backgroundColor: Colors.primary || "#FF6666",
    borderColor: Colors.primary || "#FF6666",
  },
  boxText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textDark || "#535665",
    textAlign: "center",
  },
  boxTextSelected: {
    color: "#FFF",
  },
  // ── Tooltip ──
  labelWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  infoIcon: {
    marginLeft: 6,
  },
  tooltipText: {
    fontSize: 14,
    color: "#000",
    padding: 8,
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
    marginRight: 6,
  },
  errorText: {
    color: Colors.destructive || "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
});

export default FamilyDetails;