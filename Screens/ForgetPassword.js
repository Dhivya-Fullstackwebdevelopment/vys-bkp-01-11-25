import React, { useState } from "react";
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
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import config from "../API/Apiurl";
import { Colors, rs } from "../Reusable/Theme";

export const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [userID, setUserID] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleInputChange = (field, value) => {
    if (field === "email") {
      setEmail(value);
      if (value) setUserID(""); // Clear User ID if typing in Email
    } else if (field === "userID") {
      setUserID(value);
      if (value) setEmail(""); // Clear Email if typing in User ID
    }
  };

  const handleSubmit = async () => {
    if (!email && !userID) {
      Alert.alert("Error", "Please fill in either Email or User ID");
      return;
    }

    setIsLoading(true);
    try {
      const payload = email
        ? { email }
        : { profile_id: userID };

      const response = await axios.post(`${config.apiUrl}/auth/Forget_password/`, payload);

      if (response.data?.message === "OTP sent to your email.") {
        console.log(response.data);
        Alert.alert("Success", "OTP sent successfully.");
        await AsyncStorage.setItem('forget_profile_id', response.data.forget_profile_id);
        navigation.navigate("ForgotPasswordOtp");
      } else {
        Alert.alert("Error", response.data?.error || "Request failed.");
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert("Error", "An error occurred while processing your request.");
    } finally {
      setIsLoading(false);
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
            <Text style={styles.welcomeText}>Forgot Password</Text>
            <Text style={styles.welcome}>
              Please enter your registered email ID or Vysyamala User ID.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.cardContainer}>
            {!userID && (
              <View style={styles.inputContainer}>
                <Text style={styles.fieldLabel}>Email ID</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Email ID"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={(value) => handleInputChange("email", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {!email && (
              <View style={styles.inputContainer}>
                <Text style={styles.fieldLabel}>User ID</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter User ID"
                    placeholderTextColor={Colors.textMuted}
                    value={userID}
                    onChangeText={(value) => handleInputChange("userID", value)}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.btn}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primary || "#FF4050"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linearGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>{isLoading ? "Submitting..." : "Submit"}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backContainer}
              onPress={() => navigation.navigate("LoginPage")}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back-outline" size={16} color={Colors.primary} />
              <Text style={styles.backText}>Back to Login</Text>
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
  backContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: rs(8, 10, 12),
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary || "#B72024",
  },
});

export default ForgetPassword;