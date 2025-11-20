import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { SuggestedProfileCard } from "./SuggestedProfiles/SuggestedProfileCard";
import { fetchSuggestedProfiles } from "../../CommonApiCall/CommonApiCall";
import { useNavigation } from "@react-navigation/native";
//import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";


export const SuggestedProfiles = () => {
    const [profiles, setProfiles] = useState([]);
    const [error, setError] = useState(null);
    const navigation = useNavigation();
    useEffect(() => {
        const loadProfiles = async () => {
            try {
                const data = await fetchSuggestedProfiles();
                console.log("data suggested", data);
                if (data && Array.isArray(data)) {
                    setProfiles(data);
                    setError(null);
                } else {
                    console.error('Invalid data format received');
                    setProfiles([]);
                    setError('No suggested profiles available');
                }
            } catch (error) {
                console.error('Error loading profiles:', error);
                setProfiles([]);
                // setError('Unable to load suggested profiles. Please try again later.');
            }
        };

        loadProfiles();
    }, []);

    if (!profiles || profiles.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.suggestedProfileDiv}>

                {/* Heading */}
                <View style={styles.headingFlex}>
                    <View>
                        <Text style={styles.matching}>
                            Suggested Profiles
                            <Text style={styles.matchNumber}> ({profiles.length})
                            </Text>
                        </Text>
                    </View>

                    <View style={styles.viewAllFlex}>
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => navigation.navigate('FeaturedOrSuggestProfiles', { type: 'suggested', profiles: profiles })}
                        >
                            <Text style={styles.viewAllText}>View all</Text>
                            <FontAwesome6 name="chevron-right" size={12} color="#FF6666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : profiles.length > 0 ? (
                    <SuggestedProfileCard profiles={profiles} />
                ) : (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>No suggested profiles available at the moment</Text>
                    </View>
                )}

            </View>
            {/* <BottomTabBarComponent /> */}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFDE594D",
        // paddingBottom: 80,
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: '#FF6666',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },

    headingFlex: {
        flexDirection: "row",
        // justifyContent: "space-between",
        // alignItems: "center",
    },

    suggestedProfileDiv: {
        // paddingHorizontal: 5,
        paddingBottom: 10,
    },

    matching: {
        fontSize: 16,
        fontWeight: "700",
        color: "#282C3F",
        // alignSelf: "flex-start",
        paddingHorizontal: 10,
        marginVertical: 10,
    },

    matchNumber: {
        fontSize: 14,
        color: "#85878C",
    },

    viewAllFlex: {
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 10,
    },

    viewAllText: {
        color: "#FF6666",
        fontSize: 12,
        marginRight: 5,
        fontWeight: "700",
        marginLeft: 140,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
