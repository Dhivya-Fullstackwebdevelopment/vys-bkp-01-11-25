import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import axios from "axios"; // Import axios
import config from "../API/Apiurl";


export const OtpVerify = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const otpRefs = useRef([]);
  const [MobileNo, setMobileNo] = useState("");
  const [ProfileId, setProfileId] = useState("");
  const [ProfileOwner, setProfileOwner] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [email, setEmail] = useState("");
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendMessage, setResendMessage] = useState("");
  const [timer, setTimer] = useState(60); // Add timer state
  const [isEditing, setIsEditing] = useState(false); // State to track if we are editing the number/email
  const [fullNumber, setFullNumber] = useState(""); // State to store the entered mobile number or email
  const [mobileError, setMobileError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false); // Add state to track submission


  useEffect(() => {
    retrieveDataFromSession();
    startResendTimer(60); // Initially disable resend for 60 seconds
  }, []);

  useEffect(() => {
    if (resendDisabled) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev > 0) {
            return prev - 1;
          } else {
            clearInterval(interval);
            setResendDisabled(false);
            return 0;
          }
        });
      }, 1000);
    }
  }, [resendDisabled]);


  const getMaskedMobileNo = (mobile) => {
    if (!mobile) return ""; // Handle null or undefined values
    if (mobile.length <= 5) return mobile; // No masking if length <= 5
    const visiblePart = mobile.slice(-5); // Last 5 digits
    const maskedPart = "x".repeat(mobile.length - 5); // Mask the rest
    return maskedPart + visiblePart;
  };

  const [state, setState] = useState({
    password: '',
    countryCode: '',
    email: '',
    gender: '',
    profileFor: '',
  });

  // Function to fetch data from AsyncStorage
  const fetchData = async () => {
    try {
      const password = await AsyncStorage.getItem('passwordnNew');
      const countryCode = await AsyncStorage.getItem('ccodenew');
      const email = await AsyncStorage.getItem('emailnew');
      const gender = await AsyncStorage.getItem('gendernew');
      const mobile = await AsyncStorage.getItem('Mobile_no');
      setFullNumber(mobile);
      const profileFor = JSON.parse(await AsyncStorage.getItem('profilefornew')); // Parse back to original type

      // Update state
      setState({
        password: password || '', // Fallback to empty string if null
        countryCode: countryCode || '',
        email: email || '',
        gender: gender || '',
        profileFor: profileFor || '',
      });
    } catch (error) {
      console.error('Error fetching data from AsyncStorage:', error);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchData();
  }, []);

  const retrieveDataFromSession = async () => {
    try {
      const profileValue = await AsyncStorage.getItem("profile_owner");
      const profileId = await AsyncStorage.getItem("profile_id");
      const mobileno = await AsyncStorage.getItem("Mobile_no");
      const countrycode = await AsyncStorage.getItem("countrycode");
      const email = await AsyncStorage.getItem("email");

      setMobileNo(mobileno);
      setProfileId(profileId);
      setProfileOwner(profileValue);
      setCountryCode(countrycode);
      setEmail(email);

      console.log("Retrieved Profile Value:", profileValue);
      console.log("Retrieved Profile ID:", profileId);
      console.log("Retrieved Mobile No:", mobileno);
      console.log("Retrieved country code:", countrycode);
    } catch (error) {
      console.error("Error retrieving data from session:", error);
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;

    if (text === "") {
      if (index > 0) {
        otpRefs.current[index - 1].focus();
      } else {
        newOtp[index] = "";
      }
    } else if (text.length === 1 && index < otp.length - 1) {
      otpRefs.current[index + 1].focus();
    }

    setOtp(newOtp);
  };

  const handleBackspace = (index) => {
    const newOtp = [...otp];
    newOtp[index - 1] = "";
    const prevRef = otpRefs.current[index - 1];
    if (prevRef) {
      prevRef.focus();
    }
    setOtp(newOtp);
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join("");

    if (otp.includes("") || enteredOtp.length !== 6) {
      Alert.alert("Error", "Please enter a complete 6-digit OTP.");
      return;
    }

    console.log(enteredOtp);
    console.log(ProfileId);

    try {
      setSubmitting(true); // Set submitting state to true

      const response = await axios.post(
        `${config.apiUrl}/auth/Otp_verify/`,
        {
          Otp: enteredOtp,
          ProfileId: ProfileId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const jsonResponse = response.data;
      console.log("JSON Response:", JSON.stringify(jsonResponse));
      console.log(jsonResponse.message);

      if (jsonResponse.message !== "OTP verified successfully.") {
        Alert.alert("Success", "OTP verified successfully.");
        navigation.navigate("BasicDetails");
        // navigation.navigate("ContactInfo");
      } else {
        Alert.alert("Error", jsonResponse.message || "OTP verification failed.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      Alert.alert("Error", "An error occurred during OTP verification.");
    }finally {
      setSubmitting(false); // Reset submitting state after API call
    }
  };

  const startResendTimer = (seconds) => {
    setResendDisabled(true);
    setTimer(seconds);
  };

  const handleResendOtp = async () => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/auth/Get_resend_otp/`,
        {
          ProfileId: ProfileId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setResendMessage("OTP resent successfully.");
        setTimeout(() => {
          setResendMessage("");
        }, 3000);
        startResendTimer(60);
      } else {
        Alert.alert("Error", response.data.message || "Failed to resend OTP.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      Alert.alert("Error", "An error occurred while resending OTP.");
    }
  };

  const handleEditNumber = () => {
    setIsEditing(true); // Start editing
  };
  const handleEditNumber1 = () => {
    setIsEditing(false); // Start editing
  };

  const validateMobileNumber = () => {
    if (fullNumber.length !== 10 || !/^\d+$/.test(fullNumber)) {
      setMobileError("Mobile number must be exactly 10 digits.");
      return false; // Validation fails
    } else {
      setMobileError("");
      return true; // Validation passes

    }
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return false; // Validation fails
    } else {
      setEmailError("");
      return true; // Validation passes

    }
  };

  const handleSendOtp = async () => {
    if (countryCode === "91") {
      // Validate mobile number if countryCode is "91"
      const isMobileValid = validateMobileNumber();
      if (!isMobileValid) {
        return; // If mobile number is invalid, stop further execution
      }
    } else {
      // Validate email if countryCode is not "91"
      const isEmailValid = validateEmail();
      if (!isEmailValid) {
        return; // If email is invalid, stop further execution
      }
    }


    try {

      const registrationData = {
        Mobile_no: fullNumber,
        EmailId: email, // If it's a mobile number, it won't be used, and if it's an email, this will be used.
        Profile_for: state.profileFor, // Assuming this is the profile owner
        Gender: state.gender, // Assuming gender value, you can adjust as per your state
        Password: state.password, // Example password, adjust accordingly
        mobile_country: state.countryCode,
      };

      console.log("Registration Data:", registrationData);

      const response = await axios.post(`${config.apiUrl}/auth/Registrationstep1/`, registrationData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.Status === 1) {
        const jsonResponse = response.data;
        console.log("Registration successful:", jsonResponse);

        const proid = await AsyncStorage.setItem('profile_id', jsonResponse.profile_id.toString());
        setProfileId(proid);
        await AsyncStorage.setItem('profile_owner', jsonResponse.profile_owner);
        await AsyncStorage.setItem('Mobile_no', jsonResponse.Mobile_no);
        await AsyncStorage.setItem('countrycode', countryCode);
        // await AsyncStorage.setItem('email', jsonResponse.EmailId);

        // Navigate to OTP verification page after registration
        //navigation.navigate("OtpVerify");
        setIsEditing(false); // Start editing

      } else {
        Alert.alert("Error", "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "An error occurred during registration.");
    }

  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.mobile}>Mobile Verification</Text>
        <Text style={styles.mobileText}>
          Please verify your mobile number and say why we need mobile verification
        </Text>
      </View>

      <View style={styles.otpContainer}>
        <Text style={styles.otp}>OTP Verification</Text>
        <Text style={styles.otpText}>
          {countryCode === "91"
            ? `We have sent a verification code to your mobile number ${getMaskedMobileNo(fullNumber)}`
            : `We have sent a verification code to your email ${email}`}
        </Text>
        <TouchableOpacity onPress={handleEditNumber}>
          <Text style={styles.otpTextEdit}>
            {!isEditing
              ? `Edit ${countryCode === "91" ? "Number" : "Email"}`
              : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEditNumber1}>
          <Text style={styles.otpTextEdit}>
            {isEditing ? "Cancel Edit" : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <View>
          {/* Render Mobile Number Input if countryCode is "91" */}
          {countryCode === "91" && (
            <TextInput
              style={[styles.input, mobileError && styles.inputError]}
              placeholder="Enter number"
              value={fullNumber}
              onChangeText={setFullNumber}
              onBlur={validateMobileNumber} // Validate on blur
              keyboardType="numeric"
            />
          )}
          {mobileError ? <Text style={styles.errorText}>{mobileError}</Text> : null}

          {/* Render Email Input if countryCode is not "91" */}
          {countryCode !== "91" && (
            <View>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                onBlur={validateEmail} // Validate on blur
                keyboardType="email-address"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>
          )}
        </View>

      ) : (
        <View style={styles.otpInputContainer}>
          {otp.map((value, index) => (
            <TextInput
              key={index}
              style={[
                styles.otpInput,
                index === focusedIndex && styles.focusedOtpInput,
              ]}
              value={value}
              onChangeText={(text) => handleOtpChange(text, index)}
              maxLength={1}
              keyboardType="numeric"
              ref={(el) => (otpRefs.current[index] = el)}
              onFocus={() => setFocusedIndex(index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Backspace" && value === "") {
                  handleBackspace(index);
                }
              }}
            />
          ))}
        </View>
      )}


      {resendMessage ? (
        <Text style={styles.successMessage}>{resendMessage}</Text>
      ) : (
        <Text style={styles.existing}>
          Didn't receive OTP?{" "}
          <Text
            style={resendDisabled ? styles.redText : styles.redText}
            onPress={!resendDisabled ? handleResendOtp : null}
          >
            Resend OTP {resendDisabled && <Text style={styles.redText}>({timer}s)</Text>}
          </Text>
        </Text>
      )}

      {isEditing ? (
        <TouchableOpacity style={styles.btn} onPress={handleSendOtp}>
          <LinearGradient
            colors={["#BD1225", "#FF4050"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            useAngle={true}
            angle={92.08}
            angleCenter={{ x: 0.5, y: 0.5 }}
            style={styles.linearGradient}
          >
            <Text style={styles.verify}>Send OTP</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={submitting} // Disable button when submitting
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
            {/* <Text style={styles.verify}>Verify</Text> */}
            <Text style={styles.verify}>{submitting ? "Submitting..." : "Verify"}</Text>
            
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginVertical: 20,
    fontSize: 16,
  },

  textContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },

  mobile: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },

  mobileText: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 16,
    marginBottom: 50,
  },

  otpContainer: {
    width: "100%",
    textAlign: "center",
    alignSelf: "center",
    paddingHorizontal: 20,
  },

  otp: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  otpText: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },

  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  otpInput: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: "#D4D5D9",
    borderRadius: 6,
    backgroundColor: "#fff",
    textAlign: "center",
    fontSize: 16,
    color: "#535665",
    fontFamily: "inter",
    fontWeight: "700",
    marginHorizontal: 5,
    marginVertical: 20,
  },

  focusedOtpInput: {
    borderColor: "#BD1225", // Highlight color
    borderWidth: 2, // Highlight border width
  },

  existing: {
    fontSize: 14,
    color: "#000",
    textAlign: "center",
    fontFamily: "inter",
    marginBottom: 50,
  },

  redText: {
    color: "#ED1E24",
    fontFamily: "inter",
    fontWeight: "700",
  },

  disabledResendText: {
    color: "#D4D5D9",
    fontFamily: "inter",
    fontWeight: "700",
  },

  successMessage: {
    fontSize: 14,
    color: "green",
    textAlign: "center",
    fontFamily: "inter",
    marginBottom: 50,
  },

  btn: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 6,
    shadowColor: "#EE1E2440",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 30,
    paddingHorizontal: 20,
  },

  verify: {
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

  otpTextEdit: {
    fontSize: 16,
    textAlign: "center",
    color: '#0000FF', // Change to your desired style
    textDecorationLine: 'underline', // To make it look like a link
  },
});

export default OtpVerify;
