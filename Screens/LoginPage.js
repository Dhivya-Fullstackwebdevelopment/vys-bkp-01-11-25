import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import config from "../API/Apiurl";
import ForgetPassword from "./ForgetPassword";
import { Colors, rs } from "../Reusable/Theme";
import { SafeAreaView } from "react-native-safe-area-context";

// Define Zod schema
const schema = z.object({
  username: z.string().min(1, "Profile ID is required."),
  password: z.string().min(1, "Password is required."),
});

const WHY_AWARDS = {
  id: "5",
  icon: "ribbon-outline",
  title: "Awards & Recognition",
  subtitle: "Recognised by the community",
  subtitleHighlight: true,
};

export const LoginPage = () => {
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgetPassword, setShowForgetPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    activeProfiles: 0,
    happyCustomers: 0,
    successStories: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });


  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);

        const [registeredResponse, successStoriesResponse] =
          await Promise.all([
            axios.post(`${config.apiUrl}/auth/Just_registered/`, {}),
            axios.get(
              `${config.apiUrl}/auth/success-story-images/?page=1&page_size=10`
            ),
          ]);

        console.log("Just Registered:", registeredResponse.data);
        console.log("Success Stories:", successStoriesResponse.data);

        const registeredData = registeredResponse.data;
        const successStoriesData = successStoriesResponse.data;

        setStats({
          activeProfiles: Number(
            registeredData?.active_profiles_count
          ) || 0,

          happyCustomers: Number(
            registeredData?.happy_customers_count
          ) || 0,

          successStories: Number(
            successStoriesData?.count
          ) || 0,
        });

      } catch (error) {
        console.error(
          "Stats API Error:",
          error.response?.data || error.message
        );
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const WHY_STATS = [
    {
      id: "1",
      icon: "heart-outline",
      title: "Since 2008",
      subtitle: "Trusted matrimonial platform",
      subtitleHighlight: false,
    },
    {
      id: "2",
      icon: "people-outline",
      title: "Active Profiles",
      subtitle: statsLoading
        ? "Loading..."
        : `${stats.activeProfiles.toLocaleString()} Active Profiles`,
      subtitleHighlight: true,
    },
    {
      id: "3",
      icon: "heart-circle-outline",
      title: "Happy Customers",
      subtitle: statsLoading
        ? "Loading..."
        : `${stats.happyCustomers.toLocaleString()} Happy Customers`,
      subtitleHighlight: true,
    },
    {
      id: "4",
      icon: "stats-chart-outline",
      title: "Success Stories",
      subtitle: statsLoading
        ? "Loading..."
        : `${stats.successStories.toLocaleString()} Success Stories`,
      subtitleHighlight: true,
    },
  ];

  const onSubmit = async (data) => {
    const { username, password } = data;
    setIsLoading(true);

    try {
      console.log("Login Attempt:", { username, password }); // Debug input

      const response = await axios.post(`${config.apiUrl}/auth/login/`, {
        username,
        password,
      });

      console.log("Full Login Response:", response.data); // Log full API response

      if (response.data.status === 1) {
        const {
          token,
          profile_id,
          login_username,
          plan_limits,
          marital_status,
          cur_plan_id,
          plan_name,
          valid_till,
          gender,
          birth_star_id,
          birth_rasi_id,
          custom_message,
          age,
          height,
          profile_image,
        } = response.data;

        console.log("Login Success:");
        console.log("Profile ID:", profile_id);
        console.log("login_username:", login_username);
        console.log("Token:", token);
        console.log("Plan ID:", plan_limits?.[0]?.plan_id);
        console.log("Marital Status:", marital_status);
        console.log("Current Plan ID:", cur_plan_id);
        console.log("Plan Name:", plan_name);
        console.log("vaid date:", valid_till);
        console.log("login gender", gender);
        console.log("login birth star id", birth_star_id);
        console.log("login birth star id", birth_rasi_id);
        console.log("height", height);

        await AsyncStorage.setItem("loginuser_profileId", profile_id);
        await AsyncStorage.setItem("login_username", login_username);
        await AsyncStorage.setItem("profile_id_new", profile_id);
        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("selectedPlanId", plan_limits?.[0]?.plan_id?.toString() || "");
        await AsyncStorage.setItem("martial_status", marital_status?.toString() || "");
        await AsyncStorage.setItem("current_plan_id", cur_plan_id?.toString() || "");
        await AsyncStorage.setItem("plan_name", plan_name);
        await AsyncStorage.setItem("valid_till_date", valid_till?.toString() || "");
        await AsyncStorage.setItem("gender", gender?.toString() || "");
        await AsyncStorage.setItem("birthStarValue", birth_star_id?.toString() || "");
        await AsyncStorage.setItem("birthStaridValue", birth_rasi_id?.toString() || "");
        await AsyncStorage.setItem("custom_message", custom_message?.toString() || "");
        await AsyncStorage.setItem("age", age?.toString() || "");
        await AsyncStorage.setItem("height", height?.toString() || "");
        await AsyncStorage.setItem("profile_image", profile_image || "");

        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: "You have successfully logged in.",
          position: "top",
          visibilityTime: 4000,
        });

        navigation.replace("HomeWithToast");
      } else {
        console.warn("Login Failed:", response.data.message);
        Alert.alert("Login Failed", response.data.message);
      }
    } catch (error) {
      console.error("Error during login:", error.response?.data || error.message);
      Alert.alert("Error", "An error occurred while logging in. Please try again.");
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
          {/* Header Greeting Banner */}
          <View style={styles.textContainer}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.welcome}>Find the meaningful connection within the Arya Vysyas Community</Text>
          </View>

          {/* Form Card Container */}
          <View style={styles.cardContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Profile ID</Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[
                        styles.input,
                        errors.username ? styles.inputError : null,
                      ]}
                      placeholder="Enter Profile ID"
                      placeholderTextColor={Colors.textMuted}
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="characters"
                    />
                  </View>
                )}
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[
                        styles.input,
                        errors.password ? styles.inputError : null,
                      ]}
                      placeholder="Enter Password"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={value}
                      onChangeText={onChange}
                    />
                    <Pressable
                      onPress={togglePasswordVisibility}
                      style={styles.passwordIcon}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={18}
                        color={Colors.textMuted}
                      />
                    </Pressable>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            {/* Forgot Password Link */}
            {!showForgetPassword && (
              <TouchableOpacity
                style={styles.forgotPassContainer}
                onPress={() => navigation.navigate("ForgetPassword")}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Render Forget Password Component */}
            {showForgetPassword && <ForgetPassword />}

            {/* Login Submit Button */}
            <TouchableOpacity
              style={styles.btn}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primary || "#FF4050"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linearGradient}
              >
                <View style={styles.loginContainer}>
                  {isLoading ? (
                    <ActivityIndicator color={Colors.primaryForeground || "#FFFFFF"} />
                  ) : (
                    <>
                      <Text style={styles.login}>Login</Text>
                      <Ionicons name="arrow-forward" size={18} color={Colors.primaryForeground || "#FFFFFF"} />
                    </>
                  )}
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

            {/* Phone Login Button */}
            <TouchableOpacity
              style={styles.phoneBtn}
              onPress={() => navigation.navigate("LoginWithPhoneNumber")}
              activeOpacity={0.85}
            >
              <Ionicons name="call-outline" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.phone}>Login With Phone Number</Text>
            </TouchableOpacity>

            {/* Registration Footer */}
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

          {/* ── Why Vysyamala Section ── */}
          <View style={styles.whySection}>

            {/* Section Title with side lines */}
            <View style={styles.whyTitleRow}>
              <View style={styles.whyTitleLine} />
              <Text style={styles.whySectionTitle}>WHY VYSYAMALA?</Text>
              <View style={styles.whyTitleLine} />
            </View>

            {/* 2-column grid: 4 stat cards */}
            <View style={styles.whyGrid}>
              {WHY_STATS.map((item) => (
                <View key={item.id} style={styles.whyCard}>
                  <View style={styles.whyIconCircle}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={Colors.matchingcirclecolor || "#64181F"}
                    />
                  </View>
                  <View style={styles.whyTextBlock}>
                    <Text style={styles.whyCardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.whyCardSubtitle,
                        item.subtitleHighlight
                          ? styles.whyCardSubtitleHighlight
                          : styles.whyCardSubtitleMuted,
                      ]}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Full-width Awards & Recognition card */}
            <View style={styles.whyCardFull}>
              <View style={styles.whyIconCircle}>
                <Ionicons
                  name={WHY_AWARDS.icon}
                  size={18}
                  color={Colors.matchingcirclecolor || "#64181F"}
                />
              </View>
              <View style={styles.whyTextBlock}>
                <Text style={styles.whyCardTitle}>{WHY_AWARDS.title}</Text>
                <Text
                  style={[
                    styles.whyCardSubtitle,
                    styles.whyCardSubtitleHighlight,
                  ]}
                >
                  {WHY_AWARDS.subtitle}
                </Text>
              </View>
            </View>

            {/* CTA Buttons */}
            <TouchableOpacity
              style={styles.whyBtn}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  url: "https://vysyamala.com/HappyStoriesMobile",
                  title: "Santhosha Pendlilu",
                })
              }
            >
              <Text style={styles.whyBtnText}>View Success Stories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.whyBtn, { marginBottom: 0 }]}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  url: "https://vysyamala.com/AwardsMobile",
                  title: "Awards",
                })
              }
            >
              <Text style={styles.whyBtnText}>View Awards</Text>
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
  passwordIcon: {
    paddingLeft: 8,
  },
  errorText: {
    color: Colors.destructive || "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
  forgotPassContainer: {
    alignSelf: "flex-end",
    marginBottom: rs(16, 20, 24),
    marginTop: -4,
  },
  forgotPasswordLink: {
    color: Colors.primary || "#B72024",
    fontSize: 13,
    fontWeight: "600",
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
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  login: {
    textAlign: "center",
    color: Colors.primaryForeground || "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
    marginRight: 6,
  },
  linearGradient: {
    borderRadius: 26,
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
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
  phoneBtn: {
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
  phone: {
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

  // ── Why Vysyamala styles ──
  whySection: {
    width: "100%",
    paddingHorizontal: rs(16, 20, 24),
    marginTop: rs(20, 24, 28),
    paddingBottom: rs(16, 20, 24),
  },
  whyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: rs(14, 16, 18),
  },
  whyTitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.textMuted || "#71717A",
    opacity: 0.3,
  },
  whySectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted || "#71717A",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    paddingHorizontal: 10,
  },
  whyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  whyCard: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card || "#FFFFFF",
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  whyCardFull: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card || "#FFFFFF",
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  whyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.goldContainer || "#F2DEAC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  whyTextBlock: {
    flex: 1,
    paddingRight: 4,
  },
  whyCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textDark || "#1E1E1E",
    marginBottom: 2,
  },
  whyCardSubtitle: {
    fontSize: 10,
    fontWeight: "400",
  },
  whyCardSubtitleMuted: {
    color: Colors.textMuted || "#71717A",
  },
  whyCardSubtitleHighlight: {
    color: Colors.textMuted || "#71717A",
    fontWeight: "500",
  },
  whyBtn: {
    width: "100%",
    backgroundColor: "#FCEDCA",
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  whyBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.chipActiveText || "#7A5C1E",
    letterSpacing: 0.2,
  },
});