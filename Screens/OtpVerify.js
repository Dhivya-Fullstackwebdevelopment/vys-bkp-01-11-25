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
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import config from "../API/Apiurl";
import Toast from "react-native-toast-message";

export const OtpVerifyLogin = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const hiddenInputRef = useRef(null);
  const [MobileNo, setMobileNo] = useState("");

  useEffect(() => {
    retrieveDataFromSession();
    // Auto-focus the hidden input so the OS autofill suggestion bar
    // (iOS) / SMS Retriever (Android) can attach to it immediately.
    const t = setTimeout(() => hiddenInputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const retrieveDataFromSession = async () => {
    try {
      const mobileno = await AsyncStorage.getItem("Mobile_no_Login");
      setMobileNo(mobileno);

      // DEV/TESTING ONLY: if the backend returned the OTP directly in the
      // send-OTP response, it was stashed under this key — auto-fill the
      // boxes with it. Remove this once the backend stops returning Otp
      // in the API response (production should rely on real SMS entry).
      const devOtp = await AsyncStorage.getItem("Dev_otp_autofill");
      if (devOtp && /^\d{6}$/.test(devOtp)) {
        setOtp(devOtp.split(""));
        await AsyncStorage.removeItem("Dev_otp_autofill"); // one-time use
      }
    } catch (error) {
      console.error("Error retrieving data from session:", error);
    }
  };

  // Called whenever the hidden input changes — either by the user typing
  // there, or by the OS autofilling the full 6-digit code into it.
  const handleHiddenChange = (text) => {
    const digitsOnly = text.replace(/[^0-9]/g, "").slice(0, 6);
    const newOtp = ["", "", "", "", "", ""];
    digitsOnly.split("").forEach((d, i) => (newOtp[i] = d));
    setOtp(newOtp);

    if (digitsOnly.length === 6) {
      // Autofilled or fully typed — move focus off keyboard.
      hiddenInputRef.current?.blur();
    } else {
      // Keep visual focus ring on the box the user is "at".
      const nextIndex = Math.min(digitsOnly.length, 5);
      otpRefs.current[nextIndex]?.focus?.();
    }
  };

  // Manual per-box editing still works; it forwards into the same
  // hidden input's value so both paths stay in sync.
  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, "").slice(-1);
    setOtp(newOtp);

    if (text && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index) => {
    if (index === 0) return;
    const newOtp = [...otp];
    if (newOtp[index] === "") {
      newOtp[index - 1] = "";
      otpRefs.current[index - 1]?.focus();
    }
    setOtp(newOtp);
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join("");

    if (otp.includes("") || enteredOtp.length !== 6) {
      Alert.alert("Error", "Please enter a complete 6-digit OTP.");
      return;
    }

    try {
      const response = await axios.post(
        `${config.apiUrl}/auth/Login_verifyotp/`,
        {
          Mobile_no: MobileNo,
          Otp: enteredOtp,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === 1) {
        const {
          token,
          profile_id,
          notification_count,
          cur_plan_id,
          profile_image,
          profile_completion,
          gender,
          height,
          marital_status,
          custom_message,
          birth_star_id,
          birth_rasi_id,
          profile_owner,
          quick_reg,
          plan_limits,
          valid_till,
        } = response.data;

        await AsyncStorage.setItem("auth_token", token || "");
        await AsyncStorage.setItem("loginuser_profileId", profile_id || "");
        await AsyncStorage.setItem(
          "notification_count",
          String(notification_count ?? 0)
        );
        await AsyncStorage.setItem("cur_plan_id", cur_plan_id || "");
        await AsyncStorage.setItem("profile_image", profile_image || "");
        await AsyncStorage.setItem(
          "profile_completion",
          String(profile_completion ?? "")
        );
        await AsyncStorage.setItem("gender", gender || "");
        await AsyncStorage.setItem("height", height || "");
        await AsyncStorage.setItem("marital_status", marital_status || "");
        await AsyncStorage.setItem(
          "custom_message",
          String(custom_message ?? "")
        );
        await AsyncStorage.setItem("birth_star_id", birth_star_id || "");
        await AsyncStorage.setItem("birth_rasi_id", birth_rasi_id || "");
        await AsyncStorage.setItem("profile_owner", profile_owner || "");
        await AsyncStorage.setItem("quick_reg", String(quick_reg ?? ""));
        await AsyncStorage.setItem("valid_till", valid_till || "");
        await AsyncStorage.setItem(
          "plan_limits",
          JSON.stringify(plan_limits || [])
        );

        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: "You have successfully logged in.",
          position: "bottom",
          visibilityTime: 4000,
        });

        navigation.reset({
          index: 0,
          routes: [{ name: "HomeWithToast" }],
        });
      } else {
        Alert.alert("Login Failed", response.data.message);
      }
    } catch (error) {
      console.error(
        "OTP Verify Error:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "An error occurred while logging in. Please try again."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.mobile}>Mobile Verification</Text>
        <Text style={styles.mobileText}>
          Please verify your mobile number and say why we need mobile
          verification
        </Text>
      </View>

      <View style={styles.otpContainer}>
        <Text style={styles.otp}>OTP Verification</Text>
        <Text style={styles.otpText}>
          We have sent a verification code to {MobileNo}
        </Text>
      </View>

      <View style={styles.otpInputContainer}>
        {/*
          Hidden input that actually receives the OS-level autofill.
          - Android: autoComplete="sms-otp" + textContentType="oneTimeCode"
            triggers the SMS Retriever API automatically (no permissions,
            no native linking, works out of the box in Expo/bare RN).
          - iOS: textContentType="oneTimeCode" makes the code that arrives
            in Messages show up in the QuickType bar above the keyboard.
          It sits at position 0 and is visually invisible but focusable.
        */}
        <TextInput
          ref={hiddenInputRef}
          value={otp.join("")}
          onChangeText={handleHiddenChange}
          keyboardType="number-pad"
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          maxLength={6}
          style={styles.hiddenInput}
        />

        {otp.map((value, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={1}
            onPress={() => hiddenInputRef.current?.focus()}
          >
            <TextInput
              style={styles.otpInput}
              value={value}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Backspace") handleBackspace(index);
              }}
              maxLength={1}
              keyboardType="numeric"
              ref={(el) => (otpRefs.current[index] = el)}
              showSoftInputOnFocus={false}
              caretHidden
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.existing}>
        Didn't receive OTP? <Text style={styles.redText}>Resend OTP</Text>
      </Text>

      <TouchableOpacity style={styles.btn} onPress={handleVerify}>
        <LinearGradient
          colors={["#BD1225", "#FF4050"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          useAngle={true}
          angle={92.08}
          angleCenter={{ x: 0.5, y: 0.5 }}
          style={styles.linearGradient}
        >
          <Text style={styles.verify}>Verify</Text>
        </LinearGradient>
      </TouchableOpacity>
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
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0.01,
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
    borderColor: "#BD1225",
    borderWidth: 2,
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
});

export default OtpVerifyLogin;
