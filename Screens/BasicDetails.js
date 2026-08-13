import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import config from "../API/Apiurl";
import { Colors, rs } from "../Reusable/Theme";

// ── Custom Modal Dropdown (like Search screen) ──────────────────────────────
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

// ── Zod validation schema ──────────────────────────────────────────────────
const schema = zod.object({
  daughterName: zod.string().min(3, "This field is required"),
  maritalStatus: zod.string().min(1, "Marital status is required"),
  selectedDate: zod
    .date()
    .nullable()
    .refine(
      (date) => {
        if (date === null) return false;
        const age = calculateAge(date);
        return age >= 18;
      },
      {
        message: "Your age should be 18 or above to create a profile.",
      }
    ),
  height: zod.string().min(1, "Height is required"),
  complexion: zod.string().min(1, "Complexion is required"),
});

const calculateAge = (birthDate) => {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  const dayDifference = today.getDate() - birthDate.getDate();
  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    return age - 1;
  }
  return age;
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const BasicDetails = () => {
  const navigation = useNavigation();
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [age, setAge] = useState(null);
  const [MobileNo, setMobileNo] = useState("");
  const [ProfileId, setProfileId] = useState("");
  const [ProfileOwner, setProfileOwner] = useState("");
  const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
  const [heightOptions, setHeightOptions] = useState([]);
  const [complexionOptions, setComplexionOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      daughterName: "",
      maritalStatus: "",
      height: "",
      complexion: "",
    },
  });

  useEffect(() => {
    retrieveDataFromSession();
    fetchMaritalStatus();
    fetchHeightOptions();
    fetchComplexionOptions();
  }, []);

  const retrieveDataFromSession = async () => {
    try {
      let profileValue = await AsyncStorage.getItem("profile_owner");
      const profileId = await AsyncStorage.getItem("profile_id");
      const mobileno = await AsyncStorage.getItem("Mobile_no");

      profileValue = profileValue === "Ownself" ? "yourself" : profileValue;

      setMobileNo(mobileno);
      setProfileId(profileId);
      setProfileOwner(profileValue);

      console.log("Retrieved Profile Value:", profileValue);
      console.log("Retrieved Profile ID:", profileId);
      console.log("Retrieved Mobile No:", mobileno);
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

  const fetchComplexionOptions = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Complexion/`);
      const complexionArray = Object.keys(response.data).map((key) => ({
        label: response.data[key].complexion_description,
        value: response.data[key].complexion_id.toString(),
      }));
      setComplexionOptions(complexionArray);
    } catch (error) {
      console.error("Error fetching complexion options:", error);
    }
  };

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const minDate = new Date(1947, 0, 1);
  const maxDate = new Date(currentYear - 18, 11, 31);

  const handleDateChange = async (event, date) => {
    if (event.type === "set") {
      const selected = date || currentDate;
      const safeDate = new Date(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
        12,
        0,
        0
      );

      const calculatedAge = calculateAge(safeDate);
      setShowDatepicker(false);
      setSelectedDate(safeDate);
      setAge(calculatedAge);
      setValue("selectedDate", safeDate, { shouldValidate: true });
      try {
        await AsyncStorage.setItem("userAge", calculatedAge.toString());
        await AsyncStorage.setItem("age", calculatedAge.toString());
        console.log("Age stored successfully:", calculatedAge);
      } catch (error) {
        console.error("Error saving age to storage:", error);
      }
    } else {
      setShowDatepicker(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      const requestBody = {
        ProfileId: ProfileId,
        Profile_name: data.daughterName,
        Profile_marital_status: data.maritalStatus,
        Profile_dob: formatDate(selectedDate),
        Profile_height: data.height,
        Profile_complexion: data.complexion,
      };

      console.log("Submitting Request Body:", requestBody);

      const response = await axios.post(`${config.apiUrl}/auth/Registrationstep2/`, requestBody);
      console.log("Registrationstep2 API Response:", response.data);

      const profileIdNew = response.data.profile_id;

      await AsyncStorage.setItem("profile_id_new", profileIdNew);
      await AsyncStorage.setItem("martial_status", data.maritalStatus.toString());
      await AsyncStorage.setItem("height", data.height.toString());

      navigation.navigate("ContactInfo");
    } catch (error) {
      console.error("Error calling Registrationstep2 API:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1, width: "100%" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Title Section */}
          <View style={styles.textContainer}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>STEP 2 OF 5</Text>
            </View>
            <Text style={styles.basicText}>
              Great! Now some basic details about {ProfileOwner === "yourself" ? "" : "your"} {ProfileOwner}
            </Text>
          </View>

          {/* Form Card Container */}
          <View style={styles.cardContainer}>
            {/* Daughter/Profile Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Controller
                control={control}
                name="daughterName"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[
                        styles.input,
                        errors.daughterName ? styles.inputError : null,
                      ]}
                      placeholder={`Enter ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Name`}
                      placeholderTextColor={Colors.textMuted}
                      value={value}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
              {errors.daughterName && (
                <Text style={styles.error}>{errors.daughterName.message}</Text>
              )}
            </View>

            {/* Marital Status Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Marital Status</Text>
              <Controller
                control={control}
                name="maritalStatus"
                render={({ field: { onChange, value } }) => (
                  <CustomDropdown
                    placeholder="Select Marital Status"
                    data={maritalStatusOptions}
                    selectedValue={value}
                    onSelect={(item) => {
                      onChange(item.value);
                      AsyncStorage.setItem("martial_status", item.value);
                    }}
                    style={[errors.maritalStatus && styles.inputError]}
                  />
                )}
              />
              {errors.maritalStatus && (
                <Text style={styles.error}>{errors.maritalStatus.message}</Text>
              )}
            </View>

            {/* Date of Birth Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <Pressable onPress={() => setShowDatepicker(true)}>
                <View style={[styles.inputWrapper, errors.selectedDate ? styles.inputError : null]}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Select Date of Birth"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                    editable={false}
                    pointerEvents="none"
                    value={selectedDate ? formatDate(selectedDate) : ""}
                  />
                </View>
              </Pressable>
              <Controller
                control={control}
                name="selectedDate"
                defaultValue={null}
                render={() => null}
              />
              {errors.selectedDate && (
                <Text style={styles.error}>{errors.selectedDate.message}</Text>
              )}
              {selectedDate && age >= 18 && (
                <View style={styles.ageBadge}>
                  <Text style={styles.ageText}>Calculated Age: {age} Years</Text>
                </View>
              )}
            </View>

            {showDatepicker && (
              <DateTimePicker
                mode="date"
                display="calendar"
                value={selectedDate || maxDate}
                onChange={handleDateChange}
                minimumDate={minDate}
                maximumDate={maxDate}
              />
            )}

            {/* Height Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Height</Text>
              <Controller
                control={control}
                name="height"
                render={({ field: { onChange, value } }) => (
                  <CustomDropdown
                    placeholder="Select Height"
                    data={heightOptions}
                    selectedValue={value}
                    onSelect={(item) => onChange(item.value)}
                    style={[errors.height && styles.inputError]}
                  />
                )}
              />
              {errors.height && (
                <Text style={styles.error}>{errors.height.message}</Text>
              )}
            </View>

            {/* Complexion Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Complexion</Text>
              <Controller
                control={control}
                name="complexion"
                render={({ field: { onChange, value } }) => (
                  <CustomDropdown
                    placeholder="Select Complexion"
                    data={complexionOptions}
                    selectedValue={value}
                    onSelect={(item) => onChange(item.value)}
                    style={[errors.complexion && styles.inputError]}
                  />
                )}
              />
              {errors.complexion && (
                <Text style={styles.error}>{errors.complexion.message}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.btn}
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primary || "#FF4050"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linearGradient}
              >
                <View style={styles.loginContainer}>
                  {submitting ? (
                    <ActivityIndicator color={Colors.primaryForeground || "#FFFFFF"} />
                  ) : (
                    <>
                      <Text style={styles.login}>Next</Text>
                      <Ionicons name="arrow-forward" size={18} color={Colors.primaryForeground || "#FFFFFF"} />
                    </>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.selectedBg || "#FBF5ED",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: rs(20, 30, 40),
  },
  textContainer: {
    width: "100%",
    paddingHorizontal: rs(20, 24, 28),
    marginBottom: rs(16, 20, 24),
  },
  brandBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.goldContainer || "#F2DEAC",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.chipActiveText || "#5D4220",
    letterSpacing: 0.5,
  },
  basicText: {
    color: Colors.textDark || "#1E1E1E",
    fontSize: rs(22, 24, 26),
    fontWeight: "700",
    letterSpacing: -0.5,
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: Colors.textDark || "#1E1E1E",
    paddingVertical: rs(10, 12, 14),
    fontSize: 14,
  },
  // ── Custom Dropdown styles ────────────────────────────────────────────────
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
  // ──────────────────────────────────────────────────────────────────────────
  inputError: {
    borderColor: Colors.destructive || "#EF4444",
  },
  ageBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: Colors.surface2 || "#F2E8DA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ageText: {
    color: Colors.textDark || "#1E1E1E",
    fontSize: 12,
    fontWeight: "600",
  },
  btn: {
    width: "100%",
    borderRadius: 26,
    shadowColor: Colors.primary || "#B72024",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 10,
    marginBottom: 10,
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  login: {
    textAlign: "center",
    color: Colors.primaryForeground || "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
    marginRight: 6,
  },
  linearGradient: {
    borderRadius: 26,
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  error: {
    color: Colors.destructive || "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
});

export default BasicDetails;