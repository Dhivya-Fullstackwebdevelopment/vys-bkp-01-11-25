import React from "react";
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import config from "../API/Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

        // DEV/TESTING ONLY: if backend returns the OTP directly in
        // response_data.Otp, stash it so the verify screen can auto-fill
        // the boxes without waiting for SMS autofill. Remove this block
        // (and stop returning Otp from the backend) before production —
        // the OTP should never be readable from an API response.
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
      <View style={styles.textContainer}>
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.welcome}>Login to your account</Text>
      </View>

      <View style={styles.formContainer}>
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.phoneNumber ? styles.inputError : null,
                ]}
                placeholder="Phone Number"
                keyboardType="number-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
              )}
            </View>
          )}
        />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit(onSubmit)}>
          <LinearGradient
            colors={["#BD1225", "#FF4050"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            useAngle={true}
            angle={92.08}
            angleCenter={{ x: 0.5, y: 0.5 }}
            style={styles.linearGradient}
          >
            <View style={styles.sendOtpContainer}>
              <Text style={styles.sendOtp}>Send OTP</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.orText}>or</Text>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => {
            navigation.navigate("LoginWithPhoneNumber");
          }}
        >
          <Text
            onPress={() => {
              navigation.navigate("LoginPage");
            }}
            style={styles.profile}
          >
            Login With Profile ID
          </Text>
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
  inputContainer: {
    width: "100%",
    marginBottom: 24,
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
  btn: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 6,
    marginBottom: 30,
  },
  sendOtpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sendOtp: {
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
  profileBtn: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ED1E24",
    borderRadius: 6,
    justifyContent: "center",
    padding: 15,
    marginTop: 30,
  },
  profile: {
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
    fontSize: 16,
    fontFamily: "inter",
  },
  errorText: {
    color: "red",
    fontSize: 12,
  },
});

export default LoginWithPhoneNumber;