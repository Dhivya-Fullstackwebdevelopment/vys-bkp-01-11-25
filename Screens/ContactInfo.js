import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import config from "../API/Apiurl";
import { CountryButton, CountryPicker } from "react-native-country-codes-picker";
import Icon from 'react-native-vector-icons/FontAwesome';
import { Tooltip } from "react-native-elements";
import { Colors, rs } from "../Reusable/Theme";

// ── Custom Modal Dropdown ──────────────────────────────────────────────────
const CustomDropdown = ({ placeholder, data = [], selectedValue, onSelect, style, labelField = "label", valueField = "value" }) => {
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
          style={selectedItem ? styles.dropdownSelectedText : styles.dropdownPlaceholder}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#71717A" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color="#18181B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={data}
              keyExtractor={(item, index) => (item[valueField] ? String(item[valueField]) : index.toString())}
              renderItem={({ item }) => {
                const isSelected = String(item[valueField]) === String(selectedValue);
                return (
                  <TouchableOpacity
                    style={[styles.dropdownOptionItem, isSelected && styles.dropdownOptionSelected]}
                    onPress={() => { onSelect(item); setModalVisible(false); }}
                  >
                    <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                      {item[labelField]}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#BD1225" />}
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

// ── Zod validation ──────────────────────────────────────────────────────────
const phoneRegex = /^[0-9]{10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pincodeRegex = /^[0-9]{6}$/;

const schema = z.object({
  address: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional().refine((value) => !value || pincodeRegex.test(value), { message: "Pincode must be 6 digits" }),
  alternateMobile: z.string().optional().refine((value) => !value || phoneRegex.test(value), { message: "Alternate mobile number must be 10 digits" }),
  whatsappNumber: z.string().optional().refine((value) => !value || phoneRegex.test(value), { message: "WhatsApp number must be 10 digits" }),
  daughterMobile: z.string().optional().refine((value) => !value || phoneRegex.test(value), { message: "Mobile number must be 10 digits" }),
  daughterEmail: z.string().optional().refine((value) => !value || emailRegex.test(value), { message: "Invalid email address" }),
});

function ListHeaderComponent({ countries, lang, onPress }) {
  return (
    <View style={{ paddingBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Popular countries</Text>
      {countries?.map((country, index) => (
        <CountryButton key={index} item={country} name={country?.name?.[lang || 'en']} onPress={() => onPress(country)} />
      ))}
    </View>
  );
}

export const ContactInfo = () => {
  const navigation = useNavigation();
  const [showPicker, setShowPicker] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [ProfileId, setProfileId] = useState("");
  const [ProfileOwner, setProfileOwner] = useState("");
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [MobileNo, setMobileNo] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
    setError,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      address: "",
      country: "",
      district: "",
      state: "",
      city: "",
      pincode: "",
      alternateMobile: "",
      whatsappNumber: "",
      daughterMobile: "",
      daughterEmail: "",
    },
  });

  useEffect(() => {
    retrieveDataFromSession();
    fetchCountryList();
  }, []);

  const retrieveDataFromSession = async () => {
    try {
      let profileValue = await AsyncStorage.getItem("profile_owner");
      const profileId = await AsyncStorage.getItem("profile_id_new");
      const mobileno = await AsyncStorage.getItem("Mobile_no");
      setMobileNo(mobileno);
      profileValue = profileValue === "Ownself" ? "yourself" : profileValue;
      setProfileId(profileId);
      setProfileOwner(profileValue);
    } catch (error) {
      console.error("Error retrieving data from session:", error);
    }
  };

  const fetchCountryList = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Country/`);
      const countryData = response.data;
      const formattedCountryList = Object.keys(countryData).map((key) => ({
        label: countryData[key].country_name,
        value: countryData[key].country_id.toString(),
      }));
      setCountryList(formattedCountryList);
    } catch (error) {
      console.error("Error fetching country list:", error);
    }
  };

  const fetchStateList = async (countryId) => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_State/`, { country_id: countryId });
      const stateData = response.data;
      const formattedStateList = Object.keys(stateData).map((key) => ({
        label: stateData[key].state_name,
        value: stateData[key].state_id.toString(),
      }));
      setStateList(formattedStateList);
    } catch (error) {
      console.error("Error fetching state list:", error);
    }
  };

  const fetchDistrictList = async (state_id) => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_District/`, { state_id });
      const districtData = Object.values(response.data).map(district => ({
        label: district.disctict_name,
        value: district.disctict_id.toString(),
      }));
      setDistrictList(districtData);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchCityList = async (districtId) => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_City/`, { district_id: districtId });
      if (response.data) {
        const cityData = Object.values(response.data).map(city => ({
          label: city.city_name.trim(),
          value: city.city_id.toString(),
        }));
        setCityList(cityData);
        setIsOtherSelected(false);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);

    if (MobileNo === data.alternateMobile) {
      setError("alternateMobile", {
        type: "manual",
        message: "This phone number already exists. Please enter an alternate mobile number.",
      });
      setSubmitting(false);
      return;
    }

    try {
      let cityValue = data.city;
      if (selectedCountry === "1" &&
        ["1", "2", "3", "4", "5", "6", "7"].includes(selectedState) &&
        !isOtherSelected &&
        data.city &&
        data.city !== "Other") {
        const selectedCity = cityList.find(city => city.value === data.city);
        if (selectedCity) cityValue = selectedCity.label;
      }

      const requestBody = {
        ProfileId: ProfileId,
        Profile_address: data.address,
        Profile_country: data.country,
        Profile_state: data.state || "",
        Profile_city: cityValue,
        Profile_pincode: data.pincode || "",
        Profile_alternate_mobile: data.alternateMobile || "",
        Profile_whatsapp: data.whatsappNumber || "",
        Profile_mobile_no: data.daughterMobile || "",
        Profile_district: data.district || "",
        Profile_emailid: data.daughterEmail || "",
      };

      const response = await axios.post(`${config.apiUrl}/auth/Contact_registration/`, requestBody, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.Status === 1) {
        navigation.navigate("UploadImages");
      }
    } catch (error) {
      console.error("Error calling Contact_registration API:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Gradient Header (like Search) ────────────────────────────────── */}
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
          <Text style={styles.headerTitle}>Contact Information</Text>
          <Text style={styles.headerSubtitle}>Provide your contact details</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.cardContainer}>
          {/* Country */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Country <Text style={styles.requiredStar}>*</Text></Text>
            <Controller
              name="country"
              control={control}
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select country"
                  data={countryList}
                  selectedValue={value}
                  onSelect={(item) => { onChange(item.value); fetchStateList(item.value); setSelectedCountry(item.value); }}
                />
              )}
            />
            {errors.country && <Text style={styles.errorText}>{errors.country.message}</Text>}
          </View>

          {/* Address */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Address</Text>
            <Controller
              name="address"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter your address"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={2}
                />
              )}
            />
          </View>

          {/* State (only for India) */}
          {selectedCountry === "1" && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>State</Text>
              <Controller
                name="state"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CustomDropdown
                    placeholder="Select state"
                    data={stateList}
                    selectedValue={value}
                    onSelect={(item) => { onChange(item.value); fetchDistrictList(item.value); setSelectedState(item.value); }}
                  />
                )}
              />
            </View>
          )}

          {/* District (only for specific states) */}
          {selectedCountry === "1" && ["1", "2", "3", "4", "5", "6", "7"].includes(selectedState) && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>District</Text>
              <Controller
                name="district"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CustomDropdown
                    placeholder="Select district"
                    data={districtList}
                    selectedValue={value}
                    onSelect={(item) => { onChange(item.value); fetchCityList(item.value); }}
                  />
                )}
              />
            </View>
          )}

          {/* City with Tooltip on the left */}
          <View style={styles.inputContainer}>
            <View style={styles.labelWrapper}>
              <Text style={styles.fieldLabel}>
                City
              </Text>

              {selectedCountry === "1" &&
                ["1", "2", "3", "4", "5", "6", "7"].includes(selectedState) && (
                  <Tooltip
                    popover={
                      <Text>
                        Select your city from the list. If your city is not listed,
                        select Others.
                      </Text>
                    }
                    backgroundColor="#fff"
                    overlayColor="rgba(0, 0, 0, 0.5)"
                    width={200}
                    height={70}
                    placement="bottom"
                  >
                    <Icon
                      name="info-circle"
                      size={16}
                      color={Colors.textMuted}
                      style={styles.tooltipIcon}
                    />
                  </Tooltip>
                )}
            </View>

            <Controller
              name="city"
              control={control}
              render={({ field: { onChange, value } }) => {
                const cityListWithOther = [...cityList, { label: "Other", value: "Other" }];

                if (isOtherSelected) {
                  return (
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your city"
                      placeholderTextColor={Colors.textMuted}
                      value={value}
                      onChangeText={(text) => onChange(text)}
                    />
                  );
                }

                return selectedCountry === "1" && ["1", "2", "3", "4", "5", "6", "7"].includes(selectedState) ? (
                  <CustomDropdown
                    placeholder="Select city"
                    data={cityListWithOther}
                    selectedValue={value}
                    onSelect={(item) => {
                      if (item.value === "Other") {
                        setIsOtherSelected(true);
                        onChange("");
                      } else {
                        onChange(item.value);
                        setIsOtherSelected(false);
                      }
                    }}
                  />
                ) : (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your city"
                    placeholderTextColor={Colors.textMuted}
                    value={value}
                    onChangeText={(text) => onChange(text)}
                  />
                );
              }}
            />
            {errors.city && <Text style={styles.errorText}>{errors.city.message}</Text>}
          </View>

          {/* Pincode */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Pincode</Text>
            <Controller
              name="pincode"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter pincode"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.pincode && <Text style={styles.errorText}>{errors.pincode.message}</Text>}
          </View>

          {/* Alternate Mobile */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Alternate Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.countryCodeContainer} activeOpacity={0.7}>
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Icon name="chevron-down" size={16} color={Colors.textMuted} style={styles.downArrow} />
              </TouchableOpacity>
              <CountryPicker
                countryCodesPickerSearchInput
                show={showPicker}
                pickerButtonOnPress={(item) => { setCountryCode(item.dial_code); setShowPicker(false); }}
                ListHeaderComponent={ListHeaderComponent}
                popularCountries={['en', 'in']}
                lang="en"
                style={{ modal: { backgroundColor: Colors.card || '#FFFFFF' }, searchInput: { backgroundColor: Colors.selectedBg || '#F4F4F5' } }}
              />
              <Controller
                name="alternateMobile"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.mobileInput}
                    placeholder="Enter alternate mobile"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
            {isSubmitted && errors.alternateMobile && <Text style={styles.errorText}>{errors.alternateMobile.message}</Text>}
          </View>

          {/* WhatsApp Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>WhatsApp Number</Text>
            <View style={styles.inputWrapper}>
              <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.countryCodeContainer} activeOpacity={0.7}>
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Icon name="chevron-down" size={16} color={Colors.textMuted} style={styles.downArrow} />
              </TouchableOpacity>
              <CountryPicker
                countryCodesPickerSearchInput
                show={showPicker}
                pickerButtonOnPress={(item) => { setCountryCode(item.dial_code); setShowPicker(false); }}
                ListHeaderComponent={ListHeaderComponent}
                popularCountries={['en', 'in']}
                lang="en"
                style={{ modal: { backgroundColor: Colors.card || '#FFFFFF' }, searchInput: { backgroundColor: Colors.selectedBg || '#F4F4F5' } }}
              />
              <Controller
                name="whatsappNumber"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.mobileInput}
                    placeholder="Enter WhatsApp number"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
            {isSubmitted && errors.whatsappNumber && <Text style={styles.errorText}>{errors.whatsappNumber.message}</Text>}
          </View>
        </View>

        {/* Admin purpose section */}
        <View style={styles.textContainer}>
          <Text style={styles.adminNote}>For admin purpose only (This information will not be displayed online)</Text>
        </View>

        <View style={styles.cardContainer}>
          {/* Daughter / Profile Owner Mobile */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>{`Enter ${ProfileOwner === "yourself" ? "your" : ProfileOwner} Number`}</Text>
            <View style={styles.inputWrapper}>
              <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.countryCodeContainer} activeOpacity={0.7}>
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Icon name="chevron-down" size={16} color={Colors.textMuted} style={styles.downArrow} />
              </TouchableOpacity>
              <CountryPicker
                countryCodesPickerSearchInput
                show={showPicker}
                pickerButtonOnPress={(item) => { setCountryCode(item.dial_code); setShowPicker(false); }}
                ListHeaderComponent={ListHeaderComponent}
                popularCountries={['en', 'in']}
                lang="en"
                style={{ modal: { backgroundColor: Colors.card || '#FFFFFF' }, searchInput: { backgroundColor: Colors.selectedBg || '#F4F4F5' } }}
              />
              <Controller
                name="daughterMobile"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.mobileInput}
                    placeholder={`Enter ${ProfileOwner === "yourself" ? "your" : ProfileOwner} number`}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
            {errors.daughterMobile && <Text style={styles.errorText}>{errors.daughterMobile.message}</Text>}
          </View>

          {/* Daughter / Profile Owner Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>{`Enter ${ProfileOwner === "yourself" ? "your" : ProfileOwner} Email`}</Text>
            <Controller
              name="daughterEmail"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${ProfileOwner} email`}
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.daughterEmail && <Text style={styles.errorText}>{errors.daughterEmail.message}</Text>}
          </View>

          {/* Next Button */}
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
  // ── Header styles (copied from Search) ──────────────────────────────────
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
  // ── Scroll content ──────────────────────────────────────────────────────
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: rs(12, 16, 20),
    alignItems: "center",
  },
  textContainer: {
    width: "100%",
    paddingHorizontal: rs(20, 24, 28),
    marginBottom: rs(12, 16, 20),
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
  headingText: {
    color: Colors.textDark || "#1E1E1E",
    fontSize: rs(22, 24, 26),
    fontWeight: "700",
    letterSpacing: -0.5,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
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
  adminNote: {
    fontSize: 13,
    color: Colors.textMuted || "#71717A",
    fontStyle: "italic",
    marginTop: 4,
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
  // ── Dropdown styles ──────────────────────────────────────────────────────
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
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipIcon: {
    marginLeft: 8,
    padding: 3,
    marginBottom: 2,
  },
  errorText: {
    color: Colors.destructive || "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
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

export default ContactInfo;