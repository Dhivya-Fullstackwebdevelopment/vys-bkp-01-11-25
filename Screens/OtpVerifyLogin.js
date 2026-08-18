// import React, { useState, useRef, useEffect } from "react";
// import {
//   StyleSheet,
//   Text,
//   View,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { Ionicons } from "@expo/vector-icons";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import Toast from "react-native-toast-message";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Colors, rs } from "../Reusable/Theme";
// import config from "../API/Apiurl";

// export const OtpVerifyLogin = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [focusedIndex, setFocusedIndex] = useState(0);
//   const otpRefs = useRef([]);
//   const [MobileNo, setMobileNo] = useState("");

//   useEffect(() => {
//     retrieveDataFromSession();
//   }, []);

//   const retrieveDataFromSession = async () => {
//     try {
//       const mobileno = await AsyncStorage.getItem("Mobile_no_Login");
//       setMobileNo(mobileno || "");
//       console.log("Retrieved Mobile No:", mobileno);
//     } catch (error) {
//       console.error("Error retrieving data from session:", error);
//     }
//   };

//   const handleOtpChange = (text, index) => {
//     // Clean input to allow only numeric characters
//     const cleanText = text.replace(/[^0-9]/g, "");

//     // Handle full paste or SMS autofill (more than 1 digit received)
//     if (cleanText.length > 1) {
//       const digits = cleanText.slice(0, 6).split("");
//       const newOtp = [...otp];

//       digits.forEach((digit, i) => {
//         if (i < 6) newOtp[i] = digit;
//       });

//       setOtp(newOtp);

//       // Focus on the last filled input or the 6th input box
//       const targetIndex = Math.min(digits.length - 1, 5);
//       otpRefs.current[targetIndex]?.focus();
//       return;
//     }

//     // Normal single-digit entry
//     const newOtp = [...otp];
//     newOtp[index] = cleanText;
//     setOtp(newOtp);

//     if (cleanText !== "") {
//       // Move focus forward
//       if (index < 5) {
//         otpRefs.current[index + 1]?.focus();
//       }
//     }
//   };

//   const handleKeyPress = (e, index) => {
//     // Move focus backward on backspace if current cell is already empty
//     if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
//       otpRefs.current[index - 1]?.focus();
//     }
//   };

//   const handleVerify = async () => {
//     const enteredOtp = otp.join("");

//     if (otp.includes("") || enteredOtp.length !== 6) {
//       Alert.alert("Error", "Please enter a complete 6-digit OTP.");
//       return;
//     }

//     try {
//       const response = await axios.post(
//         `${config.apiUrl}/auth/Login_verifyotp/`,
//         {
//           Mobile_no: MobileNo,
//           Otp: enteredOtp,
//         },
//         {
//           headers: {
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       console.log("OTP Verify Response:", response.data);

//       if (response.data.status === 1) {
//         const {
//           token,
//           profile_id,
//           notification_count,
//           cur_plan_id,
//           profile_image,
//           profile_completion,
//           gender,
//           height,
//           age,
//           marital_status,
//           custom_message,
//           birth_star_id,
//           birth_rasi_id,
//           profile_owner,
//           quick_reg,
//           plan_limits,
//           valid_till,
//         } = response.data;

//         await AsyncStorage.setItem("loginuser_profileId", profile_id || "");
//         await AsyncStorage.setItem("profile_id_new", profile_id || "");
//         await AsyncStorage.setItem("auth_token", token || "");
//         await AsyncStorage.setItem("selectedPlanId", plan_limits?.[0]?.plan_id?.toString() || "");
//         await AsyncStorage.setItem("martial_status", marital_status?.toString() || "");
//         await AsyncStorage.setItem("current_plan_id", cur_plan_id?.toString() || "");
//         await AsyncStorage.setItem("valid_till_date", valid_till?.toString() || "");
//         await AsyncStorage.setItem("gender", gender?.toString() || "");
//         await AsyncStorage.setItem("birthStarValue", birth_star_id?.toString() || "");
//         await AsyncStorage.setItem("birthStaridValue", birth_rasi_id?.toString() || "");
//         await AsyncStorage.setItem("custom_message", custom_message?.toString() || "");
//         await AsyncStorage.setItem("age", age?.toString() || "");
//         await AsyncStorage.setItem("height", height?.toString() || "");
//         await AsyncStorage.setItem("profile_image", profile_image || "");
//         await AsyncStorage.setItem("notification_count", String(notification_count ?? 0));
//         await AsyncStorage.setItem("profile_completion", String(profile_completion ?? ""));
//         await AsyncStorage.setItem("profile_owner", profile_owner || "");
//         await AsyncStorage.setItem("quick_reg", String(quick_reg ?? ""));
//         await AsyncStorage.setItem("plan_limits", JSON.stringify(plan_limits || []));

//         await AsyncStorage.removeItem("Dev_otp_autofill");

//         console.log("Login data stored successfully.");

//         Toast.show({
//           type: "success",
//           text1: "Login Successful",
//           text2: "You have successfully logged in.",
//           position: "top",
//           visibilityTime: 4000,
//         });

//         navigation.reset({
//           index: 0,
//           routes: [{ name: "HomeWithToast" }],
//         });
//       } else {
//         Alert.alert("Login Failed", response.data.message || "Invalid OTP.");
//       }
//     } catch (error) {
//       console.error("OTP Verify Error:", error.response?.data || error.message);
//       Alert.alert(
//         "Error",
//         error.response?.data?.message ||
//           "An error occurred while logging in. Please try again."
//       );
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         style={{ flex: 1, width: "100%" }}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContainer}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Header */}
//           <View style={styles.textContainer}>
//             <Text style={styles.welcomeText}>Mobile Verification</Text>
//             <Text style={styles.welcome}>
//               Please verify your mobile number to continue
//             </Text>
//           </View>

//           {/* Form Card */}
//           <View style={styles.cardContainer}>
//             <View style={styles.otpHeaderContainer}>
//               <Text style={styles.fieldLabel}>OTP Verification</Text>
//               <Text style={styles.otpSubText}>
//                 We have sent a verification code to{" "}
//                 <Text style={styles.mobileHighlight}>{MobileNo}</Text>
//               </Text>
//             </View>

//             {/* OTP Input Fields */}
//             <View style={styles.otpInputContainer}>
//               {otp.map((value, index) => (
//                 <TextInput
//                   key={index}
//                   style={[
//                     styles.otpInput,
//                     focusedIndex === index && styles.focusedOtpInput,
//                   ]}
//                   value={value}
//                   onChangeText={(text) => handleOtpChange(text, index)}
//                   onKeyPress={(e) => handleKeyPress(e, index)}
//                   onFocus={() => setFocusedIndex(index)}
//                   // Allow first box to receive 6 digits for paste/autofill
//                   maxLength={index === 0 ? 6 : 1}
//                   keyboardType="number-pad"
//                   // iOS SMS autofill
//                   textContentType="oneTimeCode"
//                   // Android SMS autofill
//                   autoComplete="sms-otp"
//                   selectTextOnFocus
//                   ref={(el) => (otpRefs.current[index] = el)}
//                 />
//               ))}
//             </View>

//             {/* Resend OTP */}
//             <TouchableOpacity
//               style={styles.resendContainer}
//               onPress={() => {
//                 Alert.alert("Resend OTP", "OTP resent successfully!");
//               }}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.resendText}>
//                 Didn't receive OTP? <Text style={styles.resendLink}>Resend OTP</Text>
//               </Text>
//             </TouchableOpacity>

//             {/* Verify Button */}
//             <TouchableOpacity
//               style={styles.btn}
//               onPress={handleVerify}
//               activeOpacity={0.85}
//             >
//               <LinearGradient
//                 colors={[Colors.primary || "#B72024", Colors.primary || "#FF4050"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//                 style={styles.linearGradient}
//               >
//                 <View style={styles.buttonContent}>
//                   <Text style={styles.buttonText}>Verify</Text>
//                   <Ionicons
//                     name="checkmark-circle"
//                     size={18}
//                     color={Colors.primaryForeground || "#FFFFFF"}
//                   />
//                 </View>
//               </LinearGradient>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.selectedBg || "#FBF5ED",
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: rs(20, 30, 40),
//   },
//   textContainer: {
//     width: "100%",
//     paddingHorizontal: rs(20, 24, 28),
//     marginBottom: rs(16, 20, 24),
//   },
//   welcomeText: {
//     color: Colors.textDark || "#1E1E1E",
//     fontSize: 22,
//     fontWeight: "700",
//     letterSpacing: -1,
//     fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
//   },
//   welcome: {
//     color: Colors.textMuted || "#71717A",
//     fontSize: rs(14, 15, 16),
//     marginTop: 4,
//   },
//   cardContainer: {
//     width: "90%",
//     backgroundColor: Colors.card || "#FFFFFF",
//     borderRadius: 24,
//     padding: rs(18, 22, 26),
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.06,
//     shadowRadius: 10,
//     elevation: 4,
//   },
//   otpHeaderContainer: {
//     marginBottom: rs(14, 18, 20),
//   },
//   fieldLabel: {
//     fontSize: 12,
//     fontWeight: "700",
//     color: Colors.textMuted || "#71717A",
//     textTransform: "uppercase",
//     marginBottom: 4,
//     letterSpacing: 0.3,
//   },
//   otpSubText: {
//     fontSize: 14,
//     color: Colors.textMuted || "#71717A",
//   },
//   mobileHighlight: {
//     fontWeight: "700",
//     color: Colors.textDark || "#1E1E1E",
//   },
//   otpInputContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: rs(12, 16, 20),
//   },
//   otpInput: {
//     width: 44,
//     height: 48,
//     borderWidth: 1,
//     borderColor: Colors.border || "#E4E4E7",
//     borderRadius: 16,
//     backgroundColor: Colors.selectedBg || "#F4F4F5",
//     textAlign: "center",
//     fontSize: 18,
//     color: Colors.textDark || "#1E1E1E",
//     fontWeight: "700",
//     marginHorizontal: 4,
//   },
//   focusedOtpInput: {
//     borderColor: Colors.primary || "#B72024",
//     borderWidth: 2,
//   },
//   resendContainer: {
//     alignSelf: "center",
//     marginBottom: rs(16, 20, 24),
//   },
//   resendText: {
//     fontSize: 14,
//     color: Colors.textMuted || "#71717A",
//   },
//   resendLink: {
//     color: Colors.primary || "#B72024",
//     fontWeight: "700",
//   },
//   btn: {
//     width: "100%",
//     borderRadius: 26,
//     shadowColor: Colors.primary || "#B72024",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.25,
//     shadowRadius: 8,
//     elevation: 3,
//     marginBottom: rs(14, 18, 20),
//   },
//   linearGradient: {
//     borderRadius: 26,
//     justifyContent: "center",
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//   },
//   buttonContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   buttonText: {
//     textAlign: "center",
//     color: Colors.primaryForeground || "#FFFFFF",
//     fontWeight: "700",
//     fontSize: 16,
//     letterSpacing: 0.5,
//     marginRight: 6,
//   },
// });

// export default OtpVerifyLogin;


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
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, rs } from "../Reusable/Theme";
import config from "../API/Apiurl";

export const OtpVerifyLogin = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const otpRefs = useRef([]);
  const [MobileNo, setMobileNo] = useState("");

  useEffect(() => {
    retrieveDataFromSession();
  }, []);

  const retrieveDataFromSession = async () => {
    try {
      const mobileno = await AsyncStorage.getItem("Mobile_no_Login");
      setMobileNo(mobileno);
      console.log("Retrieved Mobile No:", mobileno);
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

    try {
      const response = await axios.post(
        `${config.apiUrl}/auth/Login_verifyotp/`,
        {
          Mobile_no: MobileNo,
          Otp: enteredOtp,
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
          notification_count,
          cur_plan_id,
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
        await AsyncStorage.setItem("profile_id_new", profile_id || "");
        await AsyncStorage.setItem("auth_token", token || "");
        await AsyncStorage.setItem("selectedPlanId", plan_limits?.[0]?.plan_id?.toString() || "");
        await AsyncStorage.setItem("martial_status", marital_status?.toString() || "");
        await AsyncStorage.setItem("current_plan_id", cur_plan_id?.toString() || "");
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
                  onFocus={() => setFocusedIndex(index)}
                  maxLength={1}
                  keyboardType="numeric"
                  ref={(el) => (otpRefs.current[index] = el)}
                />
              ))}
            </View>

            {/* Resend OTP */}
            <TouchableOpacity
              style={styles.resendContainer}
              onPress={() => {
                // Resend logic can be added here if needed
                Alert.alert("Resend OTP", "OTP resent successfully!");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.resendText}>
                Didn't receive OTP? <Text style={styles.resendLink}>Resend OTP</Text>
              </Text>
            </TouchableOpacity>

            {/* Verify Button */}
            <TouchableOpacity
              style={styles.btn}
              onPress={handleVerify}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primary || "#FF4050"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linearGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Verify</Text>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primaryForeground || "#FFFFFF"} />
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
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
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