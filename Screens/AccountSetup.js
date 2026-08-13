import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  Linking,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import config from "../API/Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CountryButton, CountryPicker } from "react-native-country-codes-picker";
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors, rs } from "../Reusable/Theme";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Custom Dropdown (Modal + FlatList) ──────────────────────────────────────
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

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = zod.object({
  profileValue: zod.string().min(1, "Profile for is required."),
  genderValue: zod.string().min(1, "Gender is required."),
  mobileNumber: zod.string().min(1, "Mobile number is required").regex(/^[0-9]{10}$/, "Invalid mobile number format."),
  email: zod.string().min(1, "Email is required").email("Invalid email format."),
  password: zod
    .string()
    .min(8, "Password must be at least 8 characters ")
    .regex(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/,
      "Password must be at least 8 characters with an uppercase letter and special character"
    ),
  Profile_country: zod.string().optional(),
  stateValue: zod.string().optional(),
});

function ListHeaderComponent({ countries, lang, onPress }) {
  return (
    <View style={{ paddingBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Popular countries</Text>
      {countries?.map((country, index) => (
        <CountryButton
          key={index}
          item={country}
          name={country?.name?.[lang || 'en']}
          onPress={() => onPress(country)}
        />
      ))}
    </View>
  );
}

export const AccountSetup = () => {
  const [countryCode, setCountryCode] = useState("+91");
  const [showPicker, setShowPicker] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [checked, setChecked] = useState(false);
  const navigation = useNavigation();
  const { control, handleSubmit, setValue, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      profileValue: "",
      genderValue: "",
      mobileNumber: "",
      email: "",
      password: "",
    },
  });

  const [profileOptions, setProfileOptions] = useState([]);
  const [mobileNoError, setMobileError] = useState('');
  const [emailError, setEmailError] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [otpMessage, setOtpMessage] = useState("OTP will be sent to this number");
  const [passwordInfo, setPasswordInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [countriesList] = useState([
    { label: "India", value: "1" },
    { label: "NRI", value: "" },
  ]);
  const [statesList, setStatesList] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("1");

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch((err) => console.error("Failed to open URL:", err));
  };

  useEffect(() => {
    fetchProfileOptions();
  }, []);

  const [genderOptions, setGenderOptions] = useState([
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ]);

  const fetchProfileOptions = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Profileholder/`);
      const profileOptionsArray = Object.keys(response.data).map((key) => ({
        label: response.data[key].owner_description,
        value: response.data[key].owner_id.toString(),
        id: response.data[key].owner_id,
      }));
      setProfileOptions(profileOptionsArray);
    } catch (error) {
      console.error("Error fetching profile options:", error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCheckboxToggle = () => {
    setChecked(!checked);
  };

  const fetchStates = async (countryId) => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_State/`, { country_id: countryId });
      const statesArray = Object.values(response.data).map((state) => ({
        label: state.state_name,
        value: state.state_id.toString(),
      }));
      setStatesList(statesArray);
    } catch (error) {
      console.error("Error fetching states:", error);
      setStatesList([]);
    }
  };

  useEffect(() => {
    if (selectedCountry === "1") {
      fetchStates("1");
    }
  }, []);

  const onSubmit = async (data) => {
    if (!checked) {
      Alert.alert("Error", "Please agree to the Terms and Conditions and Privacy Policy.");
      return;
    }
    const fullNumber = mobileNumber;
    const cleanedCountryCode = countryCode.replace('+', '');
    try {
      setSubmitting(true);
      const selectedProfile = profileOptions.find(option => option.value === data.profileValue);
      if (!selectedProfile) {
        console.error("Selected profile not found");
        return;
      }
      const registrationData = {
        Profile_for: selectedProfile.id,
        Gender: data.genderValue,
        Mobile_no: fullNumber,
        EmailId: data.email,
        Password: data.password,
        mobile_country: cleanedCountryCode,
        Profile_country: selectedCountry,
        Profile_state: data.stateValue || "",
      };
      await AsyncStorage.setItem('gender', data.genderValue);
      await AsyncStorage.setItem('password', data.password);
      await AsyncStorage.setItem('passwordnNew', data.password);
      await AsyncStorage.setItem('ccodenew', cleanedCountryCode);
      await AsyncStorage.setItem('emailnew', data.email);
      await AsyncStorage.setItem('gendernew', data.genderValue);
      await AsyncStorage.setItem('profilefornew', JSON.stringify(selectedProfile.id));

      const response = await axios.post(`${config.apiUrl}/auth/Registrationstep1/`, registrationData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.Status === 1) {
        const jsonResponse = response.data;
        await AsyncStorage.setItem('profile_id', jsonResponse.profile_id.toString());
        await AsyncStorage.setItem('profile_owner', jsonResponse.profile_owner);
        await AsyncStorage.setItem('Mobile_no', jsonResponse.Mobile_no);
        await AsyncStorage.setItem('countrycode', cleanedCountryCode);
        await AsyncStorage.setItem('email', data.email);
        navigation.navigate("OtpVerify");
      } else {
        setEmailError(response.data.errors.EmailId);
        setMobileError(response.data.errors.Mobile_no);
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileChange = (item) => {
    setValue("profileValue", item.value);
    setValue("Profile_for", item.id.toString());
    if (item.id === 1) {
      setValue("genderValue", "Female");
      setGenderOptions([{ label: "Female", value: "Female" }]);
    } else if (item.id === 2) {
      setValue("genderValue", "Male");
      setGenderOptions([{ label: "Male", value: "Male" }]);
    } else {
      setGenderOptions([
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
      ]);
    }
    trigger("genderValue");
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.textContainer}>
          <Text style={styles.welcomeText}>While we find matches for you</Text>
          <Text style={styles.welcome}>Let's set up your profile</Text>
        </View>

        <View style={styles.cardContainer}>
          {/* Profile for */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Matrimony Profile for</Text>
            <Controller
              name="profileValue"
              control={control}
              render={({ field: { value, onChange } }) => (
                <CustomDropdown
                  placeholder="Select"
                  data={profileOptions}
                  selectedValue={value}
                  onSelect={(item) => {
                    onChange(item.value);
                    handleProfileChange(item);
                    trigger("profileValue");
                  }}
                  labelField="label"
                  valueField="value"
                />
              )}
            />
            {errors.profileValue && <Text style={styles.errorText}>{errors.profileValue.message}</Text>}
          </View>

          {/* Gender */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <Controller
              name="genderValue"
              control={control}
              render={({ field: { value, onChange } }) => (
                <CustomDropdown
                  placeholder="Select"
                  data={genderOptions}
                  selectedValue={value}
                  onSelect={(item) => {
                    onChange(item.value);
                    trigger("genderValue");
                  }}
                  labelField="label"
                  valueField="value"
                />
              )}
            />
            {errors.genderValue && <Text style={styles.errorText}>{errors.genderValue.message}</Text>}
          </View>

          {/* Mobile Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={styles.countryCodeContainer}
                activeOpacity={0.7}
              >
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Icon name="chevron-down" size={16} color={Colors.textMuted} style={styles.downArrow} />
              </TouchableOpacity>

              <CountryPicker
                countryCodesPickerSearchInput
                show={showPicker}
                pickerButtonOnPress={(item) => {
                  setCountryCode(item.dial_code);
                  setShowPicker(false);
                  setOtpMessage(item.dial_code === "+91" ? "OTP will be sent to this number" : "OTP will be sent to this email");
                }}
                ListHeaderComponent={ListHeaderComponent}
                popularCountries={['en', 'in']}
                lang="en"
                style={{
                  modal: { backgroundColor: Colors.card || '#FFFFFF' },
                  searchInput: { backgroundColor: Colors.selectedBg || '#F4F4F5' },
                }}
              />

              <Controller
                name="mobileNumber"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.mobileInput, errors.mobileNumber && styles.inputError]}
                    placeholder="Enter Mobile Number"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    value={mobileNumber}
                    onChangeText={(text) => {
                      setMobileNumber(text);
                      onChange(text);
                      setMobileError('');
                    }}
                  />
                )}
              />
            </View>
            {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber.message}</Text>}
            {mobileNoError ? <Text style={styles.errorText}>{mobileNoError}</Text> : null}
            {otpMessage === "OTP will be sent to this number" && (
              <Text style={styles.helperText}>{otpMessage}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            {otpMessage === "OTP will be sent to this email" && (
              <Text style={styles.helperText}>{otpMessage}</Text>
            )}
            <Controller
              name="email"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter Email"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Create Password</Text>
            <View style={styles.inputWrapperPassword}>
              <Controller
                name="password"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                    placeholder="Enter Password"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={value}
                    onFocus={() => setPasswordInfo("Password should be at least 8 characters with an uppercase letter and special character")}
                    onBlur={() => setPasswordInfo("")}
                    onChangeText={onChange}
                  />
                )}
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.passwordIcon}>
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            {passwordInfo ? <Text style={styles.helperText}>{passwordInfo}</Text> : null}
          </View>

          {/* Country */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Country</Text>
            <CustomDropdown
              placeholder="Select Country"
              data={countriesList}
              selectedValue={selectedCountry}
              onSelect={(item) => {
                setSelectedCountry(item.value);
                if (item.value === "1") fetchStates("1");
                else {
                  setStatesList([]);
                  setValue("stateValue", "");
                }
              }}
              labelField="label"
              valueField="value"
            />
          </View>

          {/* State (only for India) */}
          {selectedCountry === "1" && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>State</Text>
              <Controller
                name="stateValue"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CustomDropdown
                    placeholder="Select State"
                    data={statesList}
                    selectedValue={value}
                    onSelect={(item) => onChange(item.value)}
                    labelField="label"
                    valueField="value"
                  />
                )}
              />
              {errors.stateValue && <Text style={styles.errorText}>{errors.stateValue.message}</Text>}
            </View>
          )}

          {/* Terms & Conditions */}
          <View style={styles.checkboxContainer}>
            <Pressable
              style={[styles.checkboxBase, checked && styles.checkboxChecked]}
              onPress={handleCheckboxToggle}
            >
              {checked && <Ionicons name="checkmark" size={14} color="white" />}
            </Pressable>
            <Pressable onPress={handleCheckboxToggle}>
              <Text style={styles.checkboxLabel}>
                By clicking register free, I agree to the{" "}
                <Text style={styles.link} onPress={() => handleOpenLink('https://www.vysyamala.com/TermsandConditions')}>
                  T&C
                </Text>{" "}
                and{" "}
                <Text style={styles.link} onPress={() => handleOpenLink('https://www.vysyamala.com/PrivacyPolicy')}>
                  Privacy Policy
                </Text>.
              </Text>
            </Pressable>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.btn, submitting && styles.disabledButton]}
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
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>{submitting ? "Submitting..." : "Register"}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Login link */}
          <View style={styles.footerContainer}>
            <Text style={styles.account}>
              Existing user?{" "}
              <Text onPress={() => navigation.navigate("LoginPage")} style={styles.redText}>
                Login
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.selectedBg || "#FBF5ED",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: rs(20, 30, 40),
    alignItems: "center",
  },
  textContainer: {
    width: "100%",
    paddingHorizontal: rs(20, 24, 28),
    marginBottom: rs(16, 20, 24),
  },
  welcomeText: {
    color: Colors.textDark || "#1E1E1E",
    fontSize: 16,
    fontWeight: "400",
  },
  welcome: {
    color: Colors.textDark || "#1E1E1E",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
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
  input: {
    color: Colors.textDark || "#1E1E1E",
    borderWidth: 1,
    borderRadius: 16,
    borderColor: Colors.border || "#E4E4E7",
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    paddingHorizontal: 12,
    paddingVertical: rs(10, 12, 14),
    fontSize: 14,
  },
  inputError: {
    borderColor: Colors.destructive || "#EF4444",
  },
  // ── Custom Dropdown styles ───────────────────────────────────────────────────
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
    paddingVertical: rs(10, 12, 14),
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeContainer: {
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRightWidth: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 10,
    height: 48,
    minWidth: 70,
  },
  countryCode: {
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
  },
  downArrow: {
    position: "absolute",
    right: 6,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  mobileInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    paddingHorizontal: 10,
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
  },
  inputWrapperPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
  },
  passwordIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  errorText: {
    color: Colors.destructive || "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted || "#71717A",
    marginTop: 4,
    marginLeft: 4,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: rs(8, 10, 12),
  },
  checkboxBase: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border || "#E4E4E7",
    backgroundColor: "transparent",
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary || "#B72024",
    borderColor: Colors.primary || "#B72024",
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
    flex: 1,
  },
  link: {
    color: Colors.primary || "#B72024",
    textDecorationLine: "underline",
  },
  btn: {
    width: "100%",
    borderRadius: 26,
    shadowColor: Colors.primary || "#B72024",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: rs(8, 10, 12),
    marginBottom: rs(14, 18, 20),
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
  disabledButton: {
    opacity: 0.6,
  },
  footerContainer: {
    marginTop: rs(6, 8, 10),
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.chipInactiveBg || "#F4F4F5",
    alignItems: "center",
  },
  account: {
    fontSize: 14,
    color: Colors.textMuted || "#71717A",
    textAlign: "center",
  },
  redText: {
    color: Colors.primary || "#B72024",
    fontWeight: "700",
  },
});

export default AccountSetup;