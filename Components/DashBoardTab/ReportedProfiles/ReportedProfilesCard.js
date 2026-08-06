import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    Image,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { AntDesign, Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import Toast from "react-native-toast-message";


export const ReportedProfilesCard = () => {

    // Bookmark State Declaration
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Bookmark Toast Message Indicator
    const handleSavePress = () => {
        setIsBookmarked(!isBookmarked);
        Toast.show({
            type: isBookmarked ? "info" : "success",
            text1: isBookmarked ? "Unsaved" : "Saved",
            text2: isBookmarked
                ? "Profile has been removed from bookmarks."
                : "Profile has been saved to bookmarks.",
            position: "top",
        });
    };

    return (
        <View style={styles.container}>

            <View style={styles.profileDiv}>

                <View style={styles.cardContainer}>
                    <View style={styles.profileContainer}>
                        <Image source={require("../../../assets/img/Dp.png")} />
                        <TouchableOpacity onPress={handleSavePress}>
                            <MaterialIcons
                                name={isBookmarked ? "bookmark" : "bookmark-border"}
                                size={20}
                                color="#fff"
                                style={styles.saveIcon}
                            />
                        </TouchableOpacity>



                        <View style={styles.profileContent}>
                            <View>
                                <Text style={styles.profileName}>
                                    Harini <Text style={styles.profileId}>(VM32787)</Text>
                                </Text>
                                <Text style={styles.profileAge}>
                                    28 Yrs <Text style={styles.line}>|</Text> 5ft 10in (177 cms)
                                </Text>
                                <Text style={styles.zodiac}>Uthiram</Text>
                                <Text style={styles.employed}>Employed</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.notesContainer}>
                        <Text style={styles.notesTitle}>Astro Match</Text>
                        <Text style={styles.notesDesc}>Last updated on July 30, 2024</Text>

                        <View style={styles.resolvedFlex}>
                            <MaterialIcons
                                name="check-circle" size={18} color={"#fff"} />
                            <Text style={styles.resolvedText}>Resolved</Text>
                        </View>
                    </View>

                </View>

            </View>


        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },

    profileDiv: {
        width: "100%",
        paddingHorizontal: 10,
    },

    cardContainer: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 8,
        marginVertical: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },

    profileContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        borderRadius: 8,
        // padding: 8,
        marginBottom: 10,
        backgroundColor: "#fff",
    },

    saveIcon: {
        position: "absolute",
        left: -25,
        top: 5,
    },

    profileContent: {
        paddingLeft: 10,
    },

    profileName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FF6666",
        fontFamily: "inter",
        marginBottom: 10,
    },

    profileId: {
        fontSize: 14,
        color: "#85878C",
    },

    profileAge: {
        fontSize: 14,
        color: "#4F515D",
        marginBottom: 5,
    },

    line: {},

    zodiac: {
        fontSize: 14,
        color: "#4F515D",
        marginBottom: 5,
    },

    employed: {
        fontSize: 14,
        color: "#4F515D",
    },

    notesContainer: {
        width: "100%",
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#f0f0f0",
    },

    notesTitle: {
        color: "#535665",
        fontSize: 12,
        fontWeight: "700",
    },

    notesDesc: {
        color: "#535665",
        fontSize: 10,
        fontWeight: "300",
    },

    resolvedFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "#08771A",
        width: 100,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginTop: 5,
        borderRadius: 6,
    },

    resolvedText: {
        color: "#fff",
        marginLeft: 5,
    }
});