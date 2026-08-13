import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, rs } from "../Reusable/Theme";
import config from "../API/Apiurl";

export const OtpVerify = () => {
  const navigation = useNavigation();
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
  const [timer, setTimer] = useState(60);
  const [isEditing, setIsEditing] = useState(false);
  const [fullNumber, setFullNumber] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState({
    password: '',
    countryCode: '',
    email: '',
    gender: '',
    profileFor: '',
  });

  useEffect(() => {
    retrieveDataFromSession();
    startResendTimer(60);
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
      return () => clearInterval(interval);
    }
  }, [resendDisabled]);

  const getMaskedMobileNo = (mobile) => {
    if (!mobile) return "";
    if (mobile.length <= 5) return mobile;
    const visiblePart = mobile.slice(-5);
    const maskedPart = "x".repeat(mobile.length - 5);
    return maskedPart + visiblePart;
  };

  const fetchData = async () => {
    try {
      const password = await AsyncStorage.getItem('passwordnNew');
      const countryCode = await AsyncStorage.getItem('ccodenew');
      const email = await AsyncStorage.getItem('emailnew');
      const gender = await AsyncStorage.getItem('gendernew');
      const mobile = await AsyncStorage.getItem('Mobile_no');
      setFullNumber(mobile);
      const profileFor = JSON.parse(await AsyncStorage.getItem('profilefornew'));
      setState({
        password: password || '',
        countryCode: countryCode || '',
        email: email || '',
        gender: gender || '',
        profileFor: profileFor || '',
      });
    } catch (error) {
      console.error('Error fetching data from AsyncStorage:', error);
    }
  };

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
      setSubmitting(true);
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

      if (jsonResponse.message === "OTP verified successfully.") {
        Alert.alert("Success", "OTP verified successfully.");
        navigation.navigate("BasicDetails");
      } else {
        Alert.alert("Error", jsonResponse.message || "OTP verification failed.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      Alert.alert("Error", "An error occurred during OTP verification.");
    } finally {
      setSubmitting(false);
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
    setIsEditing(true);
  };
  const handleEditNumber1 = () => {
    setIsEditing(false);
  };

  const validateMobileNumber = () => {
    if (fullNumber.length !== 10 || !/^\d+$/.test(fullNumber)) {
      setMobileError("Mobile number must be exactly 10 digits.");
      return false;
    } else {
      setMobileError("");
      return true;
    }
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const handleSendOtp = async () => {
    if (countryCode === "91") {
      const isMobileValid = validateMobileNumber();
      if (!isMobileValid) return;
    } else {
      const isEmailValid = validateEmail();
      if (!isEmailValid) return;
    }

    try {
      const registrationData = {
        Mobile_no: fullNumber,
        EmailId: email,
        Profile_for: state.profileFor,
        Gender: state.gender,
        Password: state.password,
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
        setIsEditing(false);
      } else {
        Alert.alert("Error", "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "An error occurred during registration.");
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1, width: "100%" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.textContainer}>
            <Text style={styles.welcomeText}>Mobile Verification</Text>
            <Text style={styles.welcome}>
              Please verify your mobile number to continue
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.cardContainer}>
            <View style={styles.otpHeaderContainer}>
              <Text style={styles.fieldLabel}>OTP Verification</Text>
              <Text style={styles.otpSubText}>
                {countryCode === "91"
                  ? `We have sent a verification code to your mobile number ${getMaskedMobileNo(fullNumber)}`
                  : `We have sent a verification code to your email ${email}`}
              </Text>
              {!isEditing ? (
                <TouchableOpacity onPress={handleEditNumber} activeOpacity={0.7}>
                  <Text style={styles.editLink}>Edit {countryCode === "91" ? "Number" : "Email"}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleEditNumber1} activeOpacity={0.7}>
                  <Text style={styles.editLink}>Cancel Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <View style={styles.editContainer}>
                {countryCode === "91" && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.fieldLabel}>Mobile Number</Text>
                    <TextInput
                      style={[styles.input, mobileError && styles.inputError]}
                      placeholder="Enter 10-digit mobile number"
                      placeholderTextColor={Colors.textMuted}
                      value={fullNumber}
                      onChangeText={setFullNumber}
                      onBlur={validateMobileNumber}
                      keyboardType="phone-pad"
                    />
                    {mobileError && <Text style={styles.errorText}>{mobileError}</Text>}
                  </View>
                )}

                {countryCode !== "91" && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                      style={[styles.input, emailError && styles.inputError]}
                      placeholder="Enter your email address"
                      placeholderTextColor={Colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      onBlur={validateEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {emailError && <Text style={styles.errorText}>{emailError}</Text>}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.btn}
                  onPress={handleSendOtp}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primary || "#FF4050"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.linearGradient}
                  >
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Send OTP</Text>
                      <Ionicons name="arrow-forward" size={18} color={Colors.primaryForeground || "#FFFFFF"} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* OTP Input Fields */}
                <View style={styles.otpInputContainer}>
                  {otp.map((value, index) => (
                    <TextInput
                      key={index}
                      style={[
                        styles.otpInput,
                        focusedIndex === index && styles.focusedOtpInput,
                      ]}
                      value={value}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onFocus={() => setFocusedIndex(index)}
                      maxLength={1}
                      keyboardType="numeric"
                      ref={(el) => (otpRefs.current[index] = el)}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === "Backspace" && value === "") {
                          handleBackspace(index);
                        }
                      }}
                    />
                  ))}
                </View>

                {/* Resend OTP */}
                {resendMessage ? (
                  <Text style={styles.successMessage}>{resendMessage}</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.resendContainer}
                    onPress={!resendDisabled ? handleResendOtp : null}
                    activeOpacity={resendDisabled ? 0.5 : 0.7}
                  >
                    <Text style={styles.resendText}>
                      Didn't receive OTP?{" "}
                      <Text
                        style={[
                          styles.resendLink,
                          resendDisabled && styles.resendLinkDisabled,
                        ]}
                      >
                        Resend OTP {resendDisabled && `(${timer}s)`}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Verify Button */}
                <TouchableOpacity
                  style={styles.btn}
                  onPress={handleVerify}
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
                        {submitting ? "Verifying..." : "Verify"}
                      </Text>
                      {!submitting && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={Colors.primaryForeground || "#FFFFFF"}
                        />
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
  welcomeText: {
    color: Colors.textDark || "#1E1E1E",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -1,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  welcome: {
    color: Colors.textMuted || "#71717A",
    fontSize: rs(14, 15, 16),
    marginTop: 4,
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
  otpHeaderContainer: {
    marginBottom: rs(14, 18, 20),
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted || "#71717A",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  otpSubText: {
    fontSize: 14,
    color: Colors.textMuted || "#71717A",
  },
  editLink: {
    fontSize: 14,
    color: Colors.primary || "#B72024",
    fontWeight: "600",
    marginTop: 4,
    textDecorationLine: "underline",
  },
  editContainer: {
    marginBottom: rs(12, 16, 20),
  },
  inputContainer: {
    width: "100%",
    marginBottom: rs(14, 18, 20),
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
  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: rs(12, 16, 20),
  },
  otpInput: {
    width: 44,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    textAlign: "center",
    fontSize: 18,
    color: Colors.textDark || "#1E1E1E",
    fontFamily: "inter",
    fontWeight: "700",
    marginHorizontal: 4,
  },
  focusedOtpInput: {
    borderColor: Colors.primary || "#B72024",
    borderWidth: 2,
  },
  resendContainer: {
    alignSelf: "center",
    marginBottom: rs(16, 20, 24),
  },
  resendText: {
    fontSize: 14,
    color: Colors.textMuted || "#71717A",
  },
  resendLink: {
    color: Colors.primary || "#B72024",
    fontWeight: "700",
  },
  resendLinkDisabled: {
    color: Colors.textMuted || "#71717A",
  },
  successMessage: {
    fontSize: 14,
    color: Colors.success || "#10B981",
    textAlign: "center",
    marginBottom: rs(16, 20, 24),
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

export default OtpVerify;