import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import config from "../API/Apiurl";

// Define Zod schema
const schema = z.object({
  username: z.string().min(1, "Profile ID is required."),
  password: z.string().min(1, "Password is required."),
});

export const LoginPage = () => {
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgetPassword, setShowForgetPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  // const onSubmit = async (data) => {
  //   const { username, password } = data;
  //   setIsLoading(true);

  //   try {
  //     const response = await axios.post(`${config.apiUrl}/auth/login/`, {
  //       username,
  //       password,
  //     });

  //     if (response.data.status === 1) {
  //       const token = response.data.token;
  //       const profile_id = response.data.profile_id;
  //       await AsyncStorage.setItem("loginuser_profileId", profile_id);
  //       await AsyncStorage.setItem("profile_id_new", profile_id);
  //       console.log(profile_id);
  //       await AsyncStorage.setItem("auth_token", token);
  //       await AsyncStorage.setItem("selectedPlanId", response.data.plan_limits[0].plan_id);
  //       await AsyncStorage.setItem("martial_status", response.data.marital_status);
  //       await AsyncStorage.setItem("current_plan_id", response.data.cur_plan_id);


  //       Toast.show({
  //         type: "success",
  //         text1: "Login Successful",
  //         text2: "You have successfully logged in.",
  //         position: "bottom",
  //         visibilityTime: 4000,
  //       });

  //       navigation.replace("HomeWithToast"); // Changed from navigate to replace
  //     } else {
  //       Alert.alert("Login Failed", response.data.message);
  //     }
  //   } catch (error) {
  //     console.error("Error during login:", error);
  //     Alert.alert("Error", "An error occurred while logging in. Please try again.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

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
          plan_limits,
          marital_status,
          cur_plan_id,
          valid_till,
          gender,
          birth_star_id,
          birth_rasi_id,
          custom_message,
        } = response.data;

        console.log("Login Success:");
        console.log("Profile ID:", profile_id);
        console.log("Token:", token);
        console.log("Plan ID:", plan_limits?.[0]?.plan_id);
        console.log("Marital Status:", marital_status);
        console.log("Current Plan ID:", cur_plan_id);
        console.log("vaid date:", valid_till);
        console.log("login gender", gender);
        console.log("login birth star id", birth_star_id);
        console.log("login birth star id", birth_rasi_id);

        await AsyncStorage.setItem("loginuser_profileId", profile_id);
        await AsyncStorage.setItem("profile_id_new", profile_id);
        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("selectedPlanId", plan_limits?.[0]?.plan_id?.toString() || "");
        await AsyncStorage.setItem("martial_status", marital_status?.toString() || "");
        await AsyncStorage.setItem("current_plan_id", cur_plan_id?.toString() || "");
        await AsyncStorage.setItem("valid_till_date", valid_till?.toString() || "");
        await AsyncStorage.setItem("gender", gender?.toString() || "");
        await AsyncStorage.setItem("birthStarValue", birth_star_id?.toString() || "");
        await AsyncStorage.setItem("birthStaridValue", birth_rasi_id?.toString() || "");
        await AsyncStorage.setItem("custom_message", custom_message?.toString() || "");

        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: "You have successfully logged in.",
          position: "bottom",
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
      <View style={styles.textContainer}>
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.welcome}>Login to your account</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  errors.username ? styles.inputError : null,
                ]}
                placeholder="Profile ID"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.username && (
            <Text style={styles.errorText}>{errors.username.message}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  errors.password ? styles.inputError : null,
                ]}
                placeholder="Password"
                secureTextEntry={!showPassword}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          <Pressable
            onPress={togglePasswordVisibility}
            style={styles.passwordIcon}
          >
            <AntDesign
              name={showPassword ? "eye" : "eyeo"}
              size={18}
              color="#535665"
            />
          </Pressable>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
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
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.login}>Login</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Forgot Password Link */}
        {!showForgetPassword && (
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgetPassword")}
          >
            <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        {/* Render Forget Password Component */}
        {showForgetPassword && (
          <ForgetPassword />
        )}

        <Text style={styles.orText}>or</Text>

        {/* Phone Login Button */}
        <TouchableOpacity
          style={styles.phoneBtn}
          onPress={() => {
            navigation.navigate("LoginWithPhoneNumber");
          }}
        >
          <Text style={styles.phone}>Login With Phone Number</Text>
        </TouchableOpacity>

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

  formContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },

  inputContainer: {
    width: "100%",
    marginBottom: 24,
  },

  welcomeText: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 16,
  },

  welcome: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 50,
  },

  input: {
    color: "#535665",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#D4D5D9",
    padding: 10,
    fontFamily: "inter",
  },
  inputError: {
    borderColor: "red",
  },
  passwordIcon: {
    position: "absolute",
    right: 10,
    top: 15,
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    fontFamily: "inter",
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
    fontFamily: "inter",
    marginRight: 5,
  },
  linearGradient: {
    borderRadius: 5,
    justifyContent: "center",
    padding: 15,
  },
  orText: {
    color: "#000",
    fontFamily: "inter",
    fontSize: 14,
    textAlign: "center",
  },
  phoneBtn: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ED1E24",
    borderRadius: 6,
    justifyContent: "center",
    padding: 15,
    marginTop: 30,
    // shadowColor: "#EE1E2440",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.2,
    // shadowRadius: 6,
    // elevation: 5,
  },
  phone: {
    textAlign: "center",
    color: "#ED1E24",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 1,
    fontFamily: "inter",
  },
  account: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
    fontFamily: "inter",
    marginTop: 50,
  },
  redText: {
    color: "#ED1E24",
    fontFamily: "inter",
  },
});
