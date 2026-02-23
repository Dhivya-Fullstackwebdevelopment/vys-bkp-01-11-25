import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Dropdown } from "react-native-element-dropdown";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import config from "../API/Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
// import CountryPicker from 'react-native-country-picker-modal';
import { CountryButton, CountryPicker } from "react-native-country-codes-picker";
import Icon from 'react-native-vector-icons/FontAwesome';




const schema = zod.object({
  profileValue: zod.string().min(1, "Profile for is required."),
  genderValue: zod.string().min(1, "Gender is required."),
  mobileNumber: zod.string().min(1, "Mobile number is required").regex(/^[0-9]{10}$/, "Invalid mobile number format."),
  email: zod.string().min(1, "Email is required").email("Invalid email format."),
  // password: zod
  //   .string()
  //   .min(8, 'Password must be at least 8 characters')
  //   .regex(
  //     /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/,
  //     'Password must contain at least one uppercase letter and one special character'
  //   ),

  // password: zod
  //   .string()
  //   .min(8, 'Password must be at least 8 characters long')
  //   .regex(
  //     /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
  //     'Password must contain at least one letter, one number, and be at least 8 characters long'
  //   ),

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

export const AccountSetup = () => {

  const [country, setCountry] = useState(null);

  const [countryCode, setCountryCode] = useState("+91"); // Default to India
  const [showPicker, setShowPicker] = useState(false); // Initialize state here

  const [mobileNumber, setMobileNumber] = useState('');
  const [checked, setChecked] = useState(false);


  // const [show, setShow] = useState(false);
  // const [countryCode, setCountryCode] = useState('');


  // const onSelect = (country) => {
  //   setCountryCode(country.callingCode[0]);
  //   setCountry(country);
  // };


  const navigation = useNavigation();
  const { control, handleSubmit, setValue, setError, formState: { errors }, trigger } = useForm({
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
  const [disabledGender, setDisabledGender] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [countriesList] = useState([
    { label: "India", value: "1" },
    { label: "NRI", value: "" },
  ]);
  const [statesList, setStatesList] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("1");

  const handleOpenLink = (url) => {
    console.log("hiiii");
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
      const response = await axios.post(
        `${config.apiUrl}/auth/Get_Profileholder/`
      );
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
      const response = await axios.post(
        `${config.apiUrl}/auth/Get_State/`,
        { country_id: countryId }
      );

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
    console.log(countryCode);
    const cleanedCountryCode = countryCode.replace('+', '');
    console.log(cleanedCountryCode); // Will print "91"
    console.log(fullNumber);
    try {
      setSubmitting(true); // Set submitting state to true

      const selectedProfile = profileOptions.find(option => option.value === data.profileValue);
      if (!selectedProfile) {
        console.error("Selected profile not found");
        return;
      }

      const registrationData = {
        Profile_for: selectedProfile.id,
        Gender: data.genderValue,
        // Mobile_no: data.mobileNumber,
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
      await AsyncStorage.setItem('profilefornew', JSON.stringify(selectedProfile.id)); // Convert to string

      console.log("Registration Data:", registrationData);

      const response = await axios.post(`${config.apiUrl}/auth/Registrationstep1/`, registrationData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.Status === 1) {
        const jsonResponse = response.data;
        console.log("Registration successful:", jsonResponse);

        // Store data in session storage or AsyncStorage
        await AsyncStorage.setItem('profile_id', jsonResponse.profile_id.toString());
        await AsyncStorage.setItem('profile_owner', jsonResponse.profile_owner);
        await AsyncStorage.setItem('Mobile_no', jsonResponse.Mobile_no);
        await AsyncStorage.setItem('countrycode', cleanedCountryCode);
        await AsyncStorage.setItem('email', data.email);

        // Assuming jsonResponse contains necessary data for OTP handling
        navigation.navigate("OtpVerify");
      } else {
        console.log("Registration failed:", response.data);
        setEmailError(response.data.errors.EmailId);
        setMobileError(response.data.errors.Mobile_no);
        // Handle specific error scenarios if needed
        // For example, setError or display an error message
      }
    } catch (error) {
      console.error("Registration error:", error);
      // Handle other types of errors, e.g., network issues
      // Accessing error.response.data if available for specific error details
    }
    finally {
      setSubmitting(false); // Reset submitting state after API call
    }
  };



  const handleProfileChange = (item) => {
    setValue("profileValue", item.value); // Set profile value
    setValue("Profile_for", item.id.toString()); // Assuming Profile_for expects a string

    // Dynamically set default gender and update the visible gender options
    if (item.id === 1) {
      setValue("genderValue", "Female"); // Automatically select 'Female'
      setGenderOptions([{ label: "Female", value: "Female" }]); // Show only Female
    } else if (item.id === 2) {
      setValue("genderValue", "Male"); // Automatically select 'Male'
      setGenderOptions([{ label: "Male", value: "Male" }]); // Show only Male
    } else {
      setGenderOptions([
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
      ]); // Show both options
    }

    trigger("genderValue"); // Re-validate genderValue field
  };





  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.match}>While we find matches for you</Text>
          <Text style={styles.setUp}>Let's set up your profile</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Controller
              name="profileValue"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Dropdown
                  style={styles.dropdown}
                  data={profileOptions}
                  maxHeight={180}
                  labelField="label"
                  valueField="value"
                  placeholder="Matrimony Profile for"
                  value={value}
                  onChange={(item) => {
                    onChange(item.value); // Update the form value
                    handleProfileChange(item); // Automatically handle profile and gender change
                    trigger("profileValue"); // Re-validate profileValue field
                  }}
                />
              )}
            />
            {errors.profileValue && <Text style={styles.error}>{errors.profileValue.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Controller
              name="genderValue"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Dropdown
                  style={styles.dropdown}
                  data={genderOptions} // Use dynamic gender options
                  maxHeight={180}
                  labelField="label"
                  valueField="value"
                  placeholder="Gender"
                  value={value}
                  onChange={(item) => {
                    onChange(item.value); // Update the form value
                    trigger("genderValue"); // Re-validate genderValue field
                  }}
                />
              )}
            />
            {errors.genderValue && <Text style={styles.error}>{errors.genderValue.message}</Text>}
          </View>


          <View style={styles.inputMobileNumber}>
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
                countryCodesPickerSearchInput // Enables search input in the country picker modal
                show={showPicker}
                pickerButtonOnPress={(item) => {
                  setCountryCode(item.dial_code); // Sets the selected country code
                  setShowPicker(false); // Closes the picker modal

                  // Set OTP message based on country code
                  if (item.dial_code === "+91") {
                    setOtpMessage("OTP will be sent to this number");
                  } else {
                    setOtpMessage("OTP will be sent to this email");
                  }
                }}
                ListHeaderComponent={ListHeaderComponent}
                popularCountries={['en', 'in']} // Popular countries list
              />

              {/* Mobile Number Input */}
              <Controller
                name="mobileNumber"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.mobileInput}
                    placeholder="Mobile Number"
                    keyboardType="numeric"
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

            {errors.mobileNumber && <Text style={styles.error}>{errors.mobileNumber.message}</Text>}

            {mobileNoError ? (
              <Text style={styles.errortext}>{mobileNoError}</Text>
            ) : null}
            {otpMessage === "OTP will be sent to this number" ? (
              <Text style={styles.otpMessage}>{otpMessage}</Text>
            ) : null}
          </View>

          <View style={styles.inputEmailContainer}>
            {/* Show email OTP message if country code is not +91 */}
            {otpMessage === "OTP will be sent to this email" && (
              <Text style={styles.otpMessage}>{otpMessage}</Text>
            )}

            <Controller
              name="email"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={value}
                  onChangeText={(text) => {
                    onChange(text); // Update the value in the form
                    setEmailError(''); // Clear the email error
                  }}
                />
              )}
            />

            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

            {emailError ? (
              <Text style={styles.errortext}>{emailError}</Text>
            ) : null}
          </View>




          <View style={styles.inputContainer}>
            <Controller
              name="password"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Create Password"
                  secureTextEntry={!showPassword}
                  value={value}
                  onFocus={() => setPasswordInfo("Password should be at least 8 characters long and contain one alphabet and one digit")}
                  onBlur={() => setPasswordInfo("")} // Clear the message on blur
                  onChangeText={onChange}
                />
              )}
            />

            {/* Toggle Password Visibility */}
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.passwordIcon}>
              <AntDesign name={showPassword ? "eye" : "eyeo"} size={18} color="#535665" />
            </TouchableOpacity>

            {/* Display Password Validation Errors */}
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

            {/* Display Password Guidelines on Focus */}
            {passwordInfo ? (
              <Text style={styles.passwordInfo}>{passwordInfo}</Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Dropdown
              style={styles.dropdown}
              data={countriesList}
              maxHeight={180}
              labelField="label"
              valueField="value"
              placeholder="Select Country"
              value={selectedCountry}
              onChange={(item) => {
                setSelectedCountry(item.value);
                if (item.value === "1") {
                  fetchStates("1");
                } else {
                  setStatesList([]);
                  setValue("stateValue", "");
                }
              }}
            />
          </View>

          {selectedCountry === "1" && (
            <View style={styles.inputContainer}>
              <Controller
                name="stateValue"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Dropdown
                    style={styles.dropdown}
                    data={statesList}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Select State"
                    value={value}
                    onChange={(item) => {
                      onChange(item.value);
                    }}
                  />
                )}
              />
              {errors.stateValue && <Text style={styles.error}>{errors.stateValue.message}</Text>}
            </View>
          )}

          <View style={styles.textContainer}>
            <View style={styles.checkboxContainer}>
              <Pressable
                style={[styles.checkboxBase, checked && styles.checkboxChecked]}
                onPress={handleCheckboxToggle}
              >
                {checked && <Ionicons name="checkmark" size={14} color="white" />}
              </Pressable>
              <Pressable>
                <Text style={styles.linkText}>
                  By clicking register free, I agree to the{" "}
                  <Text
                    style={styles.link}
                    onPress={() => handleOpenLink('http://matrimonyapp.rainyseasun.com/TermsandConditions')}
                  >
                    T&C
                  </Text>{" "}
                  and{" "}
                  <Text
                    style={styles.link}
                    onPress={() => handleOpenLink('http://matrimonyapp.rainyseasun.com/TermsandConditions')}
                  >
                    Privacy Policy
                  </Text>.
                </Text>
              </Pressable>
            </View>
          </View>

          {/* <TouchableOpacity style={styles.btn} onPress={handleSubmit(onSubmit)}>
            <LinearGradient
              colors={["#BD1225", "#FF4050"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              angle={92.08}
              style={styles.linearGradient}
            >
              <Text style={styles.register}>Register</Text>
            </LinearGradient>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.btn, submitting && styles.disabledButton]}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting} // Disable button when submitting
          >
            <LinearGradient
              colors={submitting ? ["#BD1225", "#FF4050"] : ["#BD1225", "#FF4050"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              angle={92.08}
              style={styles.linearGradient}
            >
              <Text style={styles.register}>{submitting ? "Submitting..." : "Register"}</Text>
            </LinearGradient>
          </TouchableOpacity>






          <Text style={styles.existing}>
            Existing user?{" "}
            <Text onPress={() => navigation.navigate("LoginPage")} style={styles.redText}>
              Login
            </Text>
          </Text>
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

  textContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },

  formContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },

  match: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 16,
  },

  setUp: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 50,
  },

  inputContainer: {
    width: "100%",
    marginBottom: 24,
  },

  inputEmailContainer: {
    marginTop: 24,
    marginBottom: 10,
  },

  input: {
    color: "#535665",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#D4D5D9",
    padding: 10,
    fontFamily: "inter",
    position: "relative",
  },

  dropdown: {
    width: "100%",
    color: "#535665",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#D4D5D9",
    paddingHorizontal: 10,
    paddingVertical: 13,
    fontFamily: "inter",
  },

  passwordIcon: {
    position: "absolute",
    right: 10,
    top: 15,
  },

  placeholderStyle: {
    fontSize: 14,
  },

  selectedTextStyle: {
    fontSize: 14,
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginVertical: 10,
  },

  checkboxBase: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
    borderWidth: 2,
    borderColor: "#FF6666",
    backgroundColor: "transparent",
    marginRight: 6,
  },

  checkboxChecked: {
    backgroundColor: "#FF6666",
  },

  checkboxLabel: {
    fontSize: 14,
    color: "#535665",
  },

  btn: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 6,
    // shadowColor: "#EE1E2440",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.2,
    // shadowRadius: 6,
    // elevation: 5,
    marginBottom: 30,
  },

  register: {
    textAlign: "center",
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 1,
    fontFamily: "inter",
  },

  linearGradient: {
    borderRadius: 5,
    justifyContent: "center",
    padding: 15,
  },

  existing: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
    fontFamily: "inter",
  },

  redText: {
    color: "#ED1E24",
    fontFamily: "inter",
  },

  error: {
    color: "#FF0000",
    fontSize: 12,
    fontFamily: "inter",
  },

  errortext: {
    color: "red",
    fontFamily: "inter",
    fontSize: 12,
    // marginTop: -15,
  },

  inputMobileNumber: {
    // marginBottom: 10,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: 10,
  },

  countryCodeContainer: {
    // backgroundColor: "#C3C3BB", // Background color for the country code box
    backgroundColor: "#fff", // Background color for the country code box
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: 70,
    height: 50, // Match the height of the mobile number input
    borderWidth: 1,
    borderColor: "#D4D5D9",
  },

  countryCode: {
    fontSize: 14,
    // top: '15%', // Center it vertically
  },

  mobileInput: {
    flex: 1,
    // height: 50, // Match the height of the country code box
    borderWidth: 1,
    borderColor: "#D4D5D9",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  downArrow: {
    // marginLeft: 30, // Adjust margin as needed
    position: "absolute",
    marginRight: 0, // Ensure no right margin
    right: 10, // Adjust as needed to position it correctly
    alignSelf: 'center', // Center the icon vertically
    // bottom: '25%', // Center it vertically
  },

  linkText: {
    fontSize: 16,
    color: '#000',
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },

});

export default AccountSetup;
