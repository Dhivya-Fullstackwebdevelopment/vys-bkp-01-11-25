import React from "react";
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import config from "../API/Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, rs } from "../Reusable/Theme";

const schema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone Number is required.")
    .regex(/^[0-9]{10}$/, "Phone Number must be 10 digits."),
});

export const LoginWithPhoneNumber = () => {
  const navigation = useNavigation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  const onSubmit = async (data) => {
    const { phoneNumber } = data;
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Login_with_mobileno/`, {
        Mobile_no: phoneNumber,
      });

      if (response.data.status === 1) {
        await AsyncStorage.setItem('Mobile_no_Login', phoneNumber);

        const devOtp = response.data.response_data?.Otp;
        if (devOtp) {
          await AsyncStorage.setItem('Dev_otp_autofill', String(devOtp));
        } else {
          await AsyncStorage.removeItem('Dev_otp_autofill');
        }

        navigation.navigate("OtpVerifyLogin");
      } else {
        Alert.alert("Failed", response.data.message);
      }
    } catch (error) {
      console.error("Error during OTP request:", error);
      Alert.alert("Error", "An error occurred while requesting OTP. Please try again.");
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
          {/* Header Greeting */}
          <View style={styles.textContainer}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.welcome}>Login to your account</Text>
          </View>

          {/* Form Card */}
          <View style={styles.cardContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <Controller
                control={control}
                name="phoneNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrapper, errors.phoneNumber && styles.inputError]}>
                    <Ionicons name="call-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Phone Number"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="phone-pad"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  </View>
                )}
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
              )}
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity style={styles.btn} onPress={handleSubmit(onSubmit)} activeOpacity={0.85}>
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

            <TouchableOpacity
              onPress={() => Linking.openURL("mailto:support@vysyamala.com")}
              activeOpacity={0.7}
            >
              <Text style={styles.helpSupportText}>
                Need Help? <Text style={styles.helpSupportHighlight}>Contact Support</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login With Profile ID */}
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate("LoginPage")}
              activeOpacity={0.85}
            >
              <Ionicons name="person-outline" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.profileBtnText}>Login With Profile ID</Text>
            </TouchableOpacity>

            {/* Register Footer */}
            <View style={styles.registerContainer}>
              <Text style={styles.account}>
                Don't have an account?{" "}
                <Text
                  onPress={() => navigation.navigate("AccountSetup")}
                  style={styles.redText}
                >
                  Register Now
                </Text>
              </Text>
            </View>
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
  inputError: {
    borderColor: Colors.destructive || "#EF4444",
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
  helpSupportText: {
    textAlign: "center",
    color: Colors.textMuted || "#71717A",
    fontSize: 13,
    marginVertical: 4,
  },
  helpSupportHighlight: {
    color: Colors.textDark || "#1E1E1E",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: rs(16, 20, 24),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border || "#E4E4E7",
  },
  orText: {
    color: Colors.textMuted || "#71717A",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 12,
  },
  profileBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card || "#FFFFFF",
    borderWidth: 1.5,
    borderColor: Colors.primary || "#B72024",
    borderRadius: 26,
    paddingVertical: 13,
  },
  profileBtnText: {
    textAlign: "center",
    color: Colors.primary || "#B72024",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  registerContainer: {
    marginTop: rs(20, 24, 28),
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

export default LoginWithPhoneNumber;