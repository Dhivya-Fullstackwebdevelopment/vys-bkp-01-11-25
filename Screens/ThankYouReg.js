import React, { useState, useEffect } from "react";
import { StyleSheet, Text, Alert, SafeAreaView, Pressable } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import config from "../API/Apiurl";
import Toast from "react-native-toast-message";
export const ThankYouReg = () => {
    const navigation = useNavigation();
    const [profileId, setProfileId] = useState("");
    const [isFromPartnerSettings, setIsFromPartnerSettings] = useState(false);

    useEffect(() => {
        retrieveDataFromSession();
        checkFromPartnerSettings();
    }, []);

    const checkFromPartnerSettings = async () => {
        const fromPartnerSettings = await AsyncStorage.getItem("from_partner_settings");
        console.log("Check ====>", fromPartnerSettings)
        setIsFromPartnerSettings(fromPartnerSettings === "true");
    };

    const retrieveDataFromSession = async () => {
        try {
            let profileValue = await AsyncStorage.getItem("profile_owner");
            const profileId = await AsyncStorage.getItem("profile_id_new");
            const mobileno = await AsyncStorage.getItem("Mobile_no");
            const birthstar = await AsyncStorage.getItem("birthStarValue");
            const gender = await AsyncStorage.getItem("gender");
            const password = await AsyncStorage.getItem("password");

            // Replace "ownself" with "yourself"
            profileValue = profileValue === "Ownself" ? "yourself" : profileValue;

            setProfileId(profileId);

            console.log("Retrieved Profile Value:", profileValue);
            console.log("Retrieved Profile ID:", profileId);
            console.log("Retrieved Mobile No:", mobileno);
            console.log("Retrieved birthstar:", birthstar);
            console.log("Retrieved gender:", gender);
            console.log("Retrieved password:", password);
        } catch (error) {
            console.error("Error retrieving data from session:", error);
        }
    };
    const handleLogin = async () => {
        try {
            const username = await AsyncStorage.getItem("profile_id_new");
            const password = await AsyncStorage.getItem("password");
            console.log("username, pwd ===>", username, password)
            const response = await axios.post(`${config.apiUrl}/auth/login/`, {
                username,
                password,
            });
            if (response.data.status === 1) {
                const {
                    token,
                    profile_id,
                    login_username,
                    age,
                    cur_plan_id,
                    plan_name,
                    profile_image,
                    gender,
                    height,
                    marital_status,
                    custom_message,
                    birth_star_id,
                    birth_rasi_id,
                    plan_limits,
                    valid_till,
                    profile_owner,
                    quick_reg,
                    profile_completion,
                    notification_count,
                } = response.data;
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
                console.log(profile_id);
                await AsyncStorage.setItem("auth_token", token);

                // Check if user came from partner settings
                // const fromPartnerSettings = await AsyncStorage.getItem("from_partner_settings");
                await AsyncStorage.removeItem("from_partner_settings");
                Toast.show({
                    type: "success",
                    text1: "Login Successful",
                    text2: "You have successfully logged in.",
                    position: "top",
                    visibilityTime: 4000,
                });
                // Navigate based on where user came from
                navigation.reset({
                    index: 0,
                    routes: [{ name: "HomeWithToast" }],
                });
            } else {
                Alert.alert("Login Failed", response.data.message);
            }
        } catch (error) {
            console.error("Error during login:", error);
            Alert.alert("Error", "An error occurred while logging in. Please try again.");
        }
    };

    const handleLoginDirectly = async () => {
        await AsyncStorage.removeItem("from_partner_settings");
        navigation.reset({
            index: 0,
            routes: [{ name: "HomeWithToast" }],
        });
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.ThankYouReg}
            // onPress={() => navigation.navigate("HomeWithToast")}
            >
                Thank You!
            </Text>
            <FontAwesome5 name="check" size={36} color="#03c668" />

            <Text style={styles.thankYouText}>
                Thank you for Registering your profile in Vysyamala. Your Profile ID is <Text style={styles.redText}>{profileId}</Text>. Thanks a bunch for filling that out. It means a lot to us, just like you do! We really appreciate you giving us a moment of your time today. Thanks for being you.
            </Text>

            {/* Centered Button */}
            <Pressable style={styles.loginButton} onPress=
                {isFromPartnerSettings ? handleLogin : handleLoginDirectly}
            >
                <Text style={styles.buttonText}>Click Here to Login</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" style={styles.arrowIcon} />
            </Pressable>

            <Text style={styles.copyRight}>
                Copyright &copy; 2024 | All Rights Reserved
            </Text>
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
    ThankYouReg: {
        fontSize: 24,
        fontWeight: "700",
        color: "#000",
        fontFamily: "inter",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 10,
    },
    thankYouText: {
        fontSize: 16,
        color: "#535665",
        fontFamily: "inter",
        fontWeight: "700",
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 20,
        marginTop: 10,
    },
    redText: {
        color: "#ED1E24",
        fontWeight: "700",
        fontFamily: "inter",
    },
    copyRight: {
        fontSize: 16,
        color: "#535665",
        fontFamily: "inter",
        fontWeight: "700",
        textAlign: "center",
        paddingHorizontal: 10,
        marginTop: 50,
    },
    loginButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#03c668",
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
        marginRight: 5,
    },
    arrowIcon: {
        marginLeft: 5,
    },
});

