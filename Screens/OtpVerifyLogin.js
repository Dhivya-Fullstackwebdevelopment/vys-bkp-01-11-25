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
  AppState,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Colors, rs } from "../Reusable/Theme";
import config from "../API/Apiurl";
import { registerForPushNotificationsAsync } from "../utils/PushNotification";

export const OtpVerifyLogin = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const otpRefs = useRef([]);
  const otpAutoFilled = useRef(false);
  const isAutofilling = useRef(false);
  const [MobileNo, setMobileNo] = useState("");
  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);  // ← ADD THIS
  // ================= 60 SEC TIMER =================
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const fillOtp = (code) => {
    if (!code) return;
    const digits = code.replace(/[^0-9]/g, "").slice(0, 6).split("");
    const updatedOtp = [...digits, ...Array(6 - digits.length).fill("")].slice(0, 6);

    isAutofilling.current = true;
    setOtp(updatedOtp);

    setTimeout(() => {
      isAutofilling.current = false;
    }, 300);

    if (digits.length === 6) {
      Keyboard.dismiss();
      otpRefs.current[5]?.focus();
    } else {
      const focusTarget = Math.min(digits.length, 5);
      otpRefs.current[focusTarget]?.focus();
    }
  };

  const fillOtpRef = useRef(fillOtp);
  useEffect(() => {
    fillOtpRef.current = fillOtp;
  });

  const checkClipboardForOtp = async () => {
    try {
      if (otpAutoFilled.current) return;
      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) return;
      const text = await Clipboard.getStringAsync();
      const match = text.match(/\b\d{6}\b/);
      if (match) {
        fillOtpRef.current(match[0]);
        otpAutoFilled.current = true;
      }
    } catch (error) {
      console.log("Error reading clipboard:", error);
    }
  };

  useEffect(() => {
    retrieveDataFromSession();
    checkClipboardForOtp();
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkClipboardForOtp();
      }
    });
    return () => subscription.remove();
  }, []);

  const retrieveDataFromSession = async () => {
    try {
      const mobileno = await AsyncStorage.getItem("Mobile_no_Login");
      setMobileNo(mobileno || "");
      console.log("Retrieved Mobile No:", mobileno);
    } catch (error) {
      console.error("Error retrieving data from session:", error);
    }
  };

  const handleOtpChange = (text, index) => {
    if (isAutofilling.current) return;

    const cleanText = text.replace(/[^0-9]/g, "");

    // Handles keyboard suggestions and paste into any box
    if (cleanText.length > 1) {
      const incomingOtp = cleanText.length >= 6 ? cleanText.slice(-6) : cleanText;
      fillOtp(incomingOtp);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);

    if (cleanText !== "") {
      if (index < 5) {
        otpRefs.current[index + 1]?.focus();
      } else {
        Keyboard.dismiss();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  // ================= RESEND OTP API =================
  const handleResendOtp = async () => {
    if (timer > 0 || isResending) return;

    setIsResending(true);
    try {
      const response = await axios.post(
        `${config.apiUrl}/auth/Login_with_mobileno/`,
        { Mobile_no: MobileNo },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Resend OTP Response:", response.data);

      if (response.data.status === 1) {
        Toast.show({
          type: "success",
          text1: "OTP Resent",
          text2: response.data.message || "OTP resent successfully.",
          position: "top",
          visibilityTime: 4000,
        });
        setOtp(["", "", "", "", "", ""]);
        otpAutoFilled.current = false;
        setTimer(60);
        otpRefs.current[0]?.focus();
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to Resend OTP",
          text2: response.data.message || "Unable to resend OTP. Please try again.",
          position: "top",
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      console.error("Resend OTP Error:", error.response?.data || error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error.response?.data?.message ||
          "An error occurred while resending OTP. Please try again.",
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join("");

    if (otp.includes("") || enteredOtp.length !== 6) {
      Alert.alert("Error", "Please enter a complete 6-digit OTP.");
      return;
    }


    try {
      const pushToken = await registerForPushNotificationsAsync();

      console.log("Full Expo Push Token:", pushToken);

      // Remove ExponentPushToken[ ]
      const fcm_token = pushToken
        ? pushToken.replace("ExponentPushToken[", "").replace("]", "")
        : "";
      console.log("otp verify fcm_token", fcm_token)
      const response = await axios.post(
        `${config.apiUrl}/auth/Login_verifyotp/`,
        {
          Mobile_no: MobileNo,
          Otp: enteredOtp,
          fcm_token: fcm_token,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("OTP Verify Response:", response.data);

      if (response.data.status === 1) {
        const {
          token,
          profile_id,
          login_username,
          notification_count,
          cur_plan_id,
          plan_name,
          profile_image,
          profile_completion,
          gender,
          height,
          age,
          marital_status,
          custom_message,
          birth_star_id,
          birth_rasi_id,
          profile_owner,
          quick_reg,
          plan_limits,
          valid_till,
        } = response.data;

        await AsyncStorage.setItem("loginuser_profileId", profile_id || "");
        await AsyncStorage.setItem("login_username", login_username);
        await AsyncStorage.setItem("profile_id_new", profile_id || "");
        await AsyncStorage.setItem("auth_token", token || "");
        await AsyncStorage.setItem("selectedPlanId", plan_limits?.[0]?.plan_id?.toString() || "");
        await AsyncStorage.setItem("martial_status", marital_status?.toString() || "");
        await AsyncStorage.setItem("current_plan_id", cur_plan_id?.toString() || "");
        await AsyncStorage.setItem("plan_name", plan_name ?? "");
        await AsyncStorage.setItem("valid_till_date", valid_till?.toString() || "");
        await AsyncStorage.setItem("gender", gender?.toString() || "");
        await AsyncStorage.setItem("birthStarValue", birth_star_id?.toString() || "");
        await AsyncStorage.setItem("birthStaridValue", birth_rasi_id?.toString() || "");
        await AsyncStorage.setItem("custom_message", custom_message?.toString() || "");
        await AsyncStorage.setItem("age", age?.toString() || "");
        await AsyncStorage.setItem("height", height?.toString() || "");
        await AsyncStorage.setItem("profile_image", profile_image || "");
        await AsyncStorage.setItem("notification_count", String(notification_count ?? 0));
        await AsyncStorage.setItem("profile_completion", String(profile_completion ?? ""));
        await AsyncStorage.setItem("profile_owner", profile_owner || "");
        await AsyncStorage.setItem("quick_reg", String(quick_reg ?? ""));
        await AsyncStorage.setItem("plan_limits", JSON.stringify(plan_limits || []));

        await AsyncStorage.removeItem("Dev_otp_autofill");

        console.log("Login data stored successfully.");

        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: "You have successfully logged in.",
          position: "top",
          visibilityTime: 4000,
        });

        navigation.reset({
          index: 0,
          routes: [{ name: "HomeWithToast" }],
        });
      } else {
        Alert.alert("Login Failed", response.data.message || "Invalid OTP.");
      }
    } catch (error) {
      console.error("OTP Verify Error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
        "An error occurred while logging in. Please try again."
      );
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
                We have sent a verification code to{" "}
                <Text style={styles.mobileHighlight}>{MobileNo}</Text>
              </Text>
            </View>

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
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  keyboardType="number-pad"
                  textContentType={index === 0 ? "oneTimeCode" : "none"}
                  autoComplete={
                    index === 0
                      ? Platform.OS === "android"
                        ? "sms-otp"
                        : "one-time-code"
                      : "off"
                  }
                  ref={(el) => (otpRefs.current[index] = el)}
                />
              ))}
            </View>

            {/* Resend OTP with 60s Countdown Timer */}
            <View style={styles.resendContainer}>
              {isResending ? (
                <ActivityIndicator size="small" color={Colors.primary || "#B72024"} />
              ) : timer > 0 ? (
                <Text style={styles.resendText}>
                  Resend OTP in <Text style={styles.timerHighlight}>{timer}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7}>
                  <Text style={styles.resendText}>
                    Didn't receive OTP?{" "}
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={styles.btn}
              onPress={handleVerify}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary || "#B72024", Colors.primary || "#FF4050"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linearGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Verify</Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={Colors.primaryForeground || "#FFFFFF"}
                  />
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
  mobileHighlight: {
    fontWeight: "700",
    color: Colors.textDark || "#1E1E1E",
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
    minHeight: 24,
    justifyContent: "center",
  },
  resendText: {
    fontSize: 14,
    color: Colors.textMuted || "#71717A",
  },
  timerHighlight: {
    color: Colors.primary || "#B72024",
    fontWeight: "700",
  },
  resendLink: {
    color: Colors.primary || "#B72024",
    fontWeight: "700",
  },
  btn: {
    width: "100%",
    borderRadius: 26,
    shadowColor: Colors.primary || "#B72024",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
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
});

export default OtpVerifyLogin;