import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    Platform,
    StatusBar,
    Pressable,
    ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, rs } from "../../Reusable/Theme";

export const WebViewHeader = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const { url, title } = route.params || {};

    const [loading, setLoading] = useState(true);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                backgroundColor={Colors.primaryGradientStart || "#A00014"}
                barStyle="light-content"
            />

            {/* ================= HEADER ================= */}
            <LinearGradient
                colors={[
                    Colors.primaryGradientStart || "#A00014",
                    Colors.primaryGradientEnd || "#4A000A",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerBanner}
            >
                {/* Logo - First Line */}
                <View style={styles.logoRow}>
                    <View style={styles.logoBadge}>
                        <Image
                            source={require("../../assets/img/VysyamalaLogo.png")}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Title + Arrow - Second Line */}
                <View style={styles.titleRow}>
                    {/* Back Arrow */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.backButton,
                            pressed && styles.backButtonPressed,
                        ]}
                        onPress={() => navigation.goBack()}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Ionicons
                            name="arrow-back"
                            size={20}
                            color="#FFFFFF"
                        />
                    </Pressable>
                    {!!title && (
                        <Text
                            style={styles.headerTitle}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {title}
                        </Text>
                    )}


                </View>
            </LinearGradient>

            {/* ================= WEB CONTENT ================= */}
            <View style={styles.webContainer}>
                <WebView
                    source={{ uri: url }}
                    style={styles.webView}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                />

                {loading && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator
                            size="large"
                            color={Colors.primaryGradientStart || "#A00014"}
                        />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    /* ================= HEADER ================= */

    headerBanner: {
        width: "100%",
        paddingHorizontal: 12,
        paddingTop: 5,
        paddingBottom: 5,
    },

    /* ================= FIRST LINE - LOGO ================= */

    logoRow: {
        width: "100%",
        alignItems: "flex-start",
        justifyContent: "center",
    },

    logoBadge: {
        backgroundColor: "rgba(255,255,255,0.95)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: "rgba(255,215,0,0.45)",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },

    logo: {
        width: rs(82, 95, 105),
        height: rs(22, 25, 28),
    },

    /* ================= SECOND LINE ================= */

    titleRow: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 3,
    },

    headerTitle: {
        flex: 1,
        fontSize: rs(13, 14, 15),
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "left",
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
        letterSpacing: 0,
        marginRight: 8,
    },

    /* ================= ARROW ================= */

    backButton: {
        width: 32,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
    },

    backButtonPressed: {
        backgroundColor: "rgba(255,255,255,0.16)",
        borderRadius: 15,
    },

    /* ================= WEBVIEW ================= */

    webContainer: {
        flex: 1,
    },

    webView: {
        flex: 1,
    },

    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.7)",
    },
});