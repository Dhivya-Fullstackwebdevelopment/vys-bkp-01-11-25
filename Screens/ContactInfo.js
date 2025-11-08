import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import config from "../API/Apiurl";
// import CountryPicker from 'react-native-country-picker-modal';
import { CountryButton, CountryPicker } from "react-native-country-codes-picker";
import Icon from 'react-native-vector-icons/FontAwesome';
import { Tooltip } from "react-native-elements"; // Install react-native-elements for the Tooltip component if not already installed


const phoneRegex = /^[0-9]{10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pincodeRegex = /^[0-9]{6}$/;

const schema = z.object({
  address: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional().refine(
    (value) => !value || pincodeRegex.test(value),
    { message: "Pincode must be 6 digits" }
  ),
  alternateMobile: z
    .string()
    .optional()
    .refine(
      (value) => !value || phoneRegex.test(value),
      { message: "Alternate mobile number must be 10 digits" }
    ),
  whatsappNumber: z
    .string()
    .optional()
    .refine(
      (value) => !value || phoneRegex.test(value),
      { message: "WhatsApp number must be 10 digits" }
    ),
  daughterMobile: z
    .string()
    .optional().refine(
      (value) => !value || phoneRegex.test(value),
      { message: "Mobile number must be 10 digits" }
    ),
  daughterEmail: z
    .string()
    .optional()
    .refine(
      (value) => !value || emailRegex.test(value),
      { message: "Invalid email address" }
    ),
});



function ListHeaderComponent({ countries, lang, onPress }) {
  return (
    <View
      style={{
        paddingBottom: 20,
      }}
    >
      <Text>
        Popular countries
      </Text>
      {countries?.map((country, index) => {
        return (
          <CountryButton
            key={index}
            item={country}
            name={country?.name?.[lang || 'en']}
            onPress={() => onPress(country)}
          />
        )
      })}
    </View>
  )
}

export const ContactInfo = () => {

  const [showPicker, setShowPicker] = useState(false); // Initialize state here
  const [countryCode, setCountryCode] = useState("+91"); // Default to India

  // const [countryCode, setCountryCode] = useState('1'); // Default to USA
  const [country, setCountry] = useState(null);


  const [mobileNumber, setMobileNumber] = useState('');
  // const [showPicker, setShowPicker] = useState(false); // Initialize state here
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);


  // const onSelect = (country) => {
  //   setCountryCode(country.callingCode[0]);
  //   setCountry(country);
  // };


  const navigation = useNavigation();
  const [ProfileId, setProfileId] = useState("");
  const [ProfileOwner, setProfileOwner] = useState("");
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [districtList, setDistrictList] = useState([]); // District dropdown data
  const [cityList, setCityList] = useState([]);
  const [MobileNo, setMobileNo] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [submitting, setSubmitting] = useState(false); // Add state to track submission
  // const [selectedState, setSelectedState] = useState(null); // Selected state value

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
    setError,
    clearErrors,
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
      // Replace "ownself" with "yourself"
      profileValue = profileValue === "Ownself" ? "yourself" : profileValue;
      setProfileId(profileId);
      setProfileOwner(profileValue);
      console.log("Retrieved Profile Value:", profileValue);
      console.log("Retrieved Profile ID:", profileId);
    } catch (error) {
      console.error("Error retrieving data from session:", error);
    }
  };

  const fetchCountryList = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Country/`);
      const countryData = response.data;

      // Assuming countryData is an object with country_id as keys
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
      const response = await axios.post(`${config.apiUrl}/auth/Get_State/`, {
        country_id: countryId,
      });
      const stateData = response.data;

      // Convert stateData object to array
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
    await axios.post(`${config.apiUrl}/auth/Get_District/`, { state_id })
      .then(response => {
        const districtData = Object.values(response.data).map(district => ({
          label: district.disctict_name,
          value: district.disctict_id.toString(),
        }));
        setDistrictList(districtData);

      })
      .catch(error => {
        console.error('Error fetching districts:', error);
      });
  };

  const fetchCityList = async (districtId) => {
    await axios.post(`${config.apiUrl}/auth/Get_City/`, { district_id: districtId })
      .then(response => {
        // Extract cities from response object using Object.values
        if (response.data) {
          const cityData = Object.values(response.data).map(city => ({
            label: city.city_name.trim(), // Trim whitespace around city names
            value: city.city_id.toString(),
          }));
          setCityList(cityData); // Assuming setCityList updates the dropdown options
          setIsOtherSelected(false); // Reset "Other" option

        } else {
          console.error('Error: Unexpected response structure:', response.data);
        }
      })
      .catch(error => {
        console.error('Error fetching cities:', error);
      });
  };

  const onSubmit = async (data) => {
    setSubmitting(true);

    // Check if alternate mobile matches main mobile
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

      // If it's a city ID (numeric), find the city name
      // if (selectedCountry === "1" &&
      //   ["1", "2", "3", "4", "5", "6", "7"].includes(selectedState) &&
      //   !isOtherSelected &&
      //   data.city &&
      //   data.city !== "Other") {

      //   const selectedCity = cityList.find(city => city.value === data.city);
      //   if (selectedCity) {
      //     cityValue = selectedCity.name || selectedCity.label;
      //   }
      // }
      // // If it's "Other" or free text, use the input value directly
      // else if (isOtherSelected && cityInputValue) {
      //   cityValue = cityInputValue;
      // }
      if (selectedCountry === "1" &&
        ["1", "2", "3", "4", "5", "6", "7"].includes(selectedState) &&
        !isOtherSelected &&
        data.city &&
        data.city !== "Other") {

        const selectedCity = cityList.find(city => city.value === data.city);
        if (selectedCity) {
          cityValue = selectedCity.label; // Use the city name
        }
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

      console.log("Request Body:", requestBody);

      const response = await axios.post(`${config.apiUrl}/auth/Contact_registration/`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("Contact_registration API Response:", response.data);
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
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.contactInfoHead}>Contact Information</Text>

        <View style={styles.formContainer}>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Country<Text style={styles.redText}>*</Text>
            </Text>
            <Controller
              name="country"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  style={styles.dropdown}
                  data={countryList}
                  maxHeight={180}
                  labelField="label"
                  valueField="value"
                  placeholder="Select country"
                  value={value}
                  onChange={(item) => {
                    onChange(item.value);
                    fetchStateList(item.value);
                    setSelectedCountry(item.value); // Store the selected country value to conditionally render the fields
                  }}
                />
              )}
            />
            {errors.country && <Text style={styles.error}>{errors.country.message}</Text>}
          </View>




          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Address
            </Text>
            <Controller
              name="address"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter your address"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
          </View>



          {/* State Dropdown */}
          {/* {selectedCountry && ( */}
          {selectedCountry === "1" && (
            <>
              {/* State Dropdown or TextInput */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  State<Text style={styles.redText}></Text>
                </Text>
                <Controller
                  name="state"
                  control={control}
                  render={({ field: { onChange, value } }) =>
                    <Dropdown
                      style={styles.dropdown}
                      data={stateList}
                      maxHeight={180}
                      labelField="label"
                      valueField="value"
                      placeholder="Select state"
                      value={value}
                      onChange={(item) => {
                        onChange(item.value);
                        fetchDistrictList(item.value); // Fetch districts based on selected state
                        setSelectedState(item.value); // Store selected state
                      }}
                    />
                  }
                />
                {/* Uncomment for error messages */}
                {/* {errors.state && <Text style={styles.error}>{errors.state.message}</Text>} */}
              </View>

              {/* District Dropdown or TextInput */}
              {["1", "2", "3", "4", "5", "6", "7"].includes(selectedState) && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    District<Text style={styles.redText}></Text>
                  </Text>
                  <Controller
                    name="district"
                    control={control}
                    render={({ field: { onChange, value } }) =>
                      <Dropdown
                        style={styles.dropdown}
                        data={districtList}
                        maxHeight={180}
                        labelField="label"
                        valueField="value"
                        placeholder="Select district"
                        value={value}
                        onChange={(item) => {
                          onChange(item.value); // Update selected district
                          fetchCityList(item.value); // Fetch cities based on selected district
                        }}
                      />
                    }
                  />
                  {/* Uncomment for error messages */}
                  {/* {errors.district && <Text style={styles.error}>{errors.district.message}</Text>} */}
                </View>
              )}
            </>
          )}



          <View style={styles.inputContainer}>
            <View style={styles.labelWrapper}>
              <Text style={styles.label}>
                City
                {selectedCountry === "1" &&
                  ["1", "2", "3", "4", "5", "6", "7"].includes(selectedState) && (
                    <Tooltip
                      popover={
                        <Text>
                          Select your city from the list. If your city is not listed, select Others.
                        </Text>
                      }
                      backgroundColor="#fff"
                      overlayColor="rgba(0, 0, 0, 0.5)"
                      width={200}
                      height={70}
                      placement="bottom"
                    >
                      <Icon name="info-circle" size={16} color="#555" style={styles.infoIcon} />
                    </Tooltip>
                  )}
              </Text>
              {/* Conditionally render Tooltip */}

            </View>

            <Controller
              name="city"
              control={control}
              render={({ field: { onChange, value } }) => {
                // Add "Other" option dynamically
                const cityListWithOther = [...cityList, { label: "Other", value: "Other" }];

                if (isOtherSelected) {
                  return (
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your city"
                      value={value}
                      onChangeText={(text) => onChange(text)} // Update city as text input
                    />

                  );
                }

                return selectedCountry === "1" &&
                  ["1", "2", "3", "4", "5", "6", "7"].includes(selectedState) ? (
                  <Dropdown
                    style={styles.dropdown}
                    data={cityListWithOther} // Use dynamically modified city list
                    maxHeight={180}
                    labelField="label"
                    valueField="value"
                    placeholder="Select city"
                    value={value}
                    onChange={(item) => {
                      if (item.value === "Other") {
                        setIsOtherSelected(true); // Switch to text input
                        onChange(""); // Clear the current value
                      } else {
                        onChange(item.value); // Update selected city
                        setIsOtherSelected(false); // Ensure dropdown remains for other selections
                      }
                    }}
                  />
                ) : (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your city"
                    value={value}
                    onChangeText={(text) => onChange(text)} // Update city as text input
                  />
                );
              }}

            />
            {errors.city && <Text style={styles.error}>{errors.city.message}</Text>}

          </View>







          {/* Pincode Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Pincode<Text style={styles.redText}></Text>
            </Text>
            <Controller
              name="pincode"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter pincode"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.pincode && <Text style={styles.error}>{errors.pincode.message}</Text>}
          </View>





          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Alternate Mobile Number<Text style={styles.redText}></Text>
            </Text>

            <View style={styles.inputWrapper}>


              {/* TouchableOpacity to show country list directly */}
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={styles.countryCodeContainer}
              >
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Icon name="chevron-down" size={16} color="#000" style={styles.downArrow} />
              </TouchableOpacity>



              <CountryPicker
                countryCodesPickerSearchInput  // Enables search input in the country picker modal
                show={showPicker}
                // when picker button press you will get the country object with dial code
                pickerButtonOnPress={(item) => {
                  setCountryCode(item.dial_code); // Sets the selected country code
                  setShowPicker(false); // Closes the picker modal
                }}
                ListHeaderComponent={ListHeaderComponent}
                // popularCountries={['en', 'ua', 'pl', 'in']}
                popularCountries={['en', 'in']} // Popular countries list
              />

              {/* Mobile Number Input */}
              <Controller
                name="alternateMobile"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.mobileInput}
                    placeholder="Mobile Number"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
            {isSubmitted && errors.alternateMobile && (
              <Text style={styles.error}>{errors.alternateMobile.message}</Text>
            )}


            {/* {errors.alternateMobile && (
              <Text style={styles.error}>
                {errors.alternateMobile.message}
              </Text>
            )} */}
          </View>




          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              WhatsApp Number<Text style={styles.redText}></Text>
            </Text>

            <View style={styles.inputWrapper}>
              {/* TouchableOpacity to show country list directly */}
              {/* <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.countryCodeContainer}>
                <Text style={styles.countryCode}>+{countryCode}</Text>
                <Icon name="chevron-down" size={16} color="#000" style={styles.downArrow} />
              </TouchableOpacity> */}

              {/* TouchableOpacity to show country list directly */}
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={styles.countryCodeContainer}
              >
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Icon name="chevron-down" size={16} color="#000" style={styles.downArrow} />
              </TouchableOpacity>

              {/* CountryPicker */}
              {/* {showPicker && (
                <CountryPicker
                  withFilter
                  withFlag
                  withAlphaFilter
                  onSelect={(country) => {
                    onSelect(country);
                    setShowPicker(false); // Close after selection
                  }}
                  countryCode={country?.cca2}
                  onClose={() => setShowPicker(false)}
                  visible={showPicker} // Control visibility with the state
                  style={styles.countryPicker}
                />
              )} */}


              <CountryPicker
                countryCodesPickerSearchInput  // Enables search input in the country picker modal
                show={showPicker}
                // when picker button press you will get the country object with dial code
                pickerButtonOnPress={(item) => {
                  setCountryCode(item.dial_code); // Sets the selected country code
                  setShowPicker(false); // Closes the picker modal
                }}
                ListHeaderComponent={ListHeaderComponent}
                // popularCountries={['en', 'ua', 'pl', 'in']}
                popularCountries={['en', 'in']} // Popular countries list
              />

              {/* WhatsApp Number Input */}
              <Controller
                name="whatsappNumber"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.mobileInput}
                    placeholder="Enter WhatsApp number"
                    keyboardType="numeric"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
            {isSubmitted && errors.whatsappNumber && (
              <Text style={styles.error}>{errors.whatsappNumber.message}</Text>
            )}

            {/* {errors.whatsappNumber && (
              <Text style={styles.error}>
                {errors.whatsappNumber.message}
              </Text>
            )} */}
          </View>

        </View>

        <Text style={styles.contactInfoHead}>For admin purpose only(This information will not be displayed online)</Text>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {/* {`Enter ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Number`}<Text style={styles.redText}>*</Text> */}
              {`Enter ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Number`}
            </Text>

            <View style={styles.inputWrapper}>
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={styles.countryCodeContainer}
              >
                <Text style={styles.countryCode}>{countryCode}</Text>
                <Icon name="chevron-down" size={16} color="#000" style={styles.downArrow} />
              </TouchableOpacity>

              <CountryPicker
                countryCodesPickerSearchInput  // Enables search input in the country picker modal
                show={showPicker}
                // when picker button press you will get the country object with dial code
                pickerButtonOnPress={(item) => {
                  setCountryCode(item.dial_code); // Sets the selected country code
                  setShowPicker(false); // Closes the picker modal
                }}
                ListHeaderComponent={ListHeaderComponent}
                // popularCountries={['en', 'ua', 'pl', 'in']}
                popularCountries={['en', 'in']} // Popular countries list
              />

              {/* Mobile Number Input */}
              <Controller
                name="daughterMobile"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.mobileInput}
                    placeholder={`Enter ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Number`}
                    keyboardType="numeric"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>

            {errors.daughterMobile && (
              <Text style={styles.error}>{errors.daughterMobile.message}</Text>
            )}
          </View>


          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {/* {`Enter ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Email`}<Text style={styles.redText}>*</Text> */}
              {`Enter ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Email`}
            </Text>
            <Controller
              name="daughterEmail"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${ProfileOwner} Email`}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {/* {errors.daughterEmail && (
              <Text style={styles.error}>{errors.daughterEmail.message}</Text>
            )} */}
          </View>

          <TouchableOpacity
            style={styles.btn}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting} // Disable button when submitting

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
                {/* <Text style={styles.login}>Next</Text> */}
                <Text style={styles.login}>{submitting ? "Submitting..." : "Next"}</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfoHead: {
    color: "#535665",
    fontSize: 14,
    fontWeight: "700",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    color: "#535665",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#D4D5D9",
    padding: 10,
    // marginBottom: 10,
  },
  dropdown: {
    width: "100%",
    color: "#535665",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#D4D5D9",
    paddingHorizontal: 10,
    paddingVertical: 13,
    // marginBottom: 10,
  },
  label: {
    color: "#535665",
    fontSize: 14,
    fontWeight: "600",
  },
  redText: {
    color: "#FF6666",
  },
  btn: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 6,
    marginTop: 15,
    marginBottom: 30,
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  login: {
    textAlign: "center",
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 1,
    marginRight: 5,
  },
  linearGradient: {
    borderRadius: 5,
    justifyContent: "center",
    padding: 15,
  },
  error: {
    color: "#FF0000",
    fontSize: 12,
    fontFamily: "inter",
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeContainer: {
    // backgroundColor: "#C3C3BB", // Background color for the country code box
    backgroundColor: "#FFF", // Background color for the country code box
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 10,
    height: 50, // Match the height of the mobile number input
    borderWidth: 1,
    borderColor: "#D4D5D9",
  },

  countryCode: {
    fontSize: 16,
    top: '15%', // Center it vertically

  },
  mobileInput: {
    flex: 1,
    height: 50, // Match the height of the country code box
    borderWidth: 1,
    borderColor: "#D4D5D9",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    paddingHorizontal: 10,
  },
  downArrow: {
    marginLeft: 30, // Adjust margin as needed
    marginRight: 0, // Ensure no right margin
    right: 0, // Adjust as needed to position it correctly
    alignSelf: 'center', // Center the icon vertically
    bottom: '25%', // Center it vertically
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 4,
    top: 20,
    left: 0,
    zIndex: 10,
  },
  tooltipText: {
    color: "#000",
    fontSize: 12,
  },
  infoIcon: {
    marginLeft: 8,
  },
});

export default ContactInfo;
