import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Platform,
    Dimensions,
} from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SuggestedProfileCard } from "./SuggestedProfiles/SuggestedProfileCard";
import { fetchSuggestedProfiles } from "../../CommonApiCall/CommonApiCall";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../Reusable/Theme";

const { width } = Dimensions.get("window");

export const SuggestedProfiles = () => {
    const [profiles, setProfiles] = useState([]);
    const [error, setError] = useState(null);
    const navigation = useNavigation();

    useEffect(() => {
        const loadProfiles = async () => {
            try {
                const data = await fetchSuggestedProfiles();
                if (data && Array.isArray(data)) {
                    setProfiles(data);
                    setError(null);
                } else {
                    setProfiles([]);
                    setError("No suggested profiles available");
                }
            } catch (error) {
                console.error("Error loading profiles:", error);
                setProfiles([]);
            }
        };
        loadProfiles();
    }, []);

    if (!profiles || profiles.length === 0) {
        return null;
    }

    return (
        <LinearGradient
            colors={[
                "#1A0A0A",
                Colors.secondary || "#4A1A2E",
                Colors.primaryGradientEnd || "#4A000A",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Decorative overlay with multiple glowing orbs */}
            <View style={styles.decorativeOverlay}>
                <View style={[styles.glowOrb, { top: -50, right: -30, width: width * 0.8, height: width * 0.8 }]} />
                <View style={[styles.glowOrb, { bottom: -40, left: -20, width: width * 0.6, height: width * 0.6 }]} />
                <View style={[styles.glowOrb, { top: "30%", left: "50%", width: width * 0.4, height: width * 0.4 }]} />
            </View>

            <View style={styles.contentWrapper}>
                {/* Heading */}
                <View style={styles.headingFlex}>
                    <View style={styles.titleRow}>
                        <LinearGradient
                            colors={["#FFD700", "#E8A317", "#C98A1F"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.starBadge}
                        >
                            <FontAwesome6 name="star" size={16} color="#4A000A" />
                            <View style={styles.glowRing} />
                        </LinearGradient>

                        <View>
                            <Text style={styles.matching}>Suggested Profiles</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.viewAllButton}
                        activeOpacity={0.8}
                        onPress={() =>
                            navigation.navigate("FeaturedOrSuggestProfiles", {
                                type: "suggested",
                                profiles: profiles,
                            })
                        }
                    >
                        <LinearGradient
                            colors={["#FFD700", "#E8A317"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.viewAllGradient}
                        >
                            <Text style={styles.viewAllText}>View all</Text>
                            <Ionicons name="chevron-forward" size={14} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : profiles.length > 0 ? (
                    <View style={styles.cardWrapper}>
                        <SuggestedProfileCard profiles={profiles} />
                    </View>
                ) : (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>No suggested profiles available</Text>
                    </View>
                )}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: "hidden",
        marginVertical: 8,
    },
    decorativeOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
    },
    glowOrb: {
        position: "absolute",
        borderRadius: 999,
        backgroundColor: "rgba(255, 215, 0, 0.06)",
        borderWidth: 1,
        borderColor: "rgba(255, 215, 0, 0.08)",
    },
    contentWrapper: {
        paddingVertical: 20,
        paddingHorizontal: 16,
        position: "relative",
        zIndex: 2,
    },
    headingFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 0,
        marginBottom: 18,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    starBadge: {
        width: 26,
        height: 26,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        position: "relative",
    },
    glowRing: {
        position: "absolute",
        width: 30,
        height: 30,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: "rgba(255, 215, 0, 0.3)",
    },
    matching: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
        letterSpacing: -1,
    },
    countPill: {
        alignSelf: "flex-start",
        marginTop: 4,
        backgroundColor: "rgba(255, 215, 0, 0.12)",
        paddingHorizontal: 12,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: "rgba(255, 215, 0, 0.2)",
    },
    matchNumber: {
        fontSize: 11,
        fontWeight: "600",
        color: "#FFD700",
        letterSpacing: 0.6,
        textTransform: "uppercase",
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    viewAllButton: {
        borderRadius: 22,
        overflow: "hidden",
        elevation: 6,
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
    },
    viewAllGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 5,
        gap: 3,
        lineSpacing: -2,
    },
    viewAllText: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 0.4,
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
    cardWrapper: {
        paddingHorizontal: 0,
    },
    errorContainer: {
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 14,
        textAlign: "center",
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },
});