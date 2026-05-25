import React from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Linking,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export const HelpSupport = () => {
    const navigation = useNavigation();

    const contactItems = [
        {
            icon: <Ionicons name="mail" size={22} color="#ED1E24" />,
            label: "Email Us",
            value: "support@vysyamala.com",
            onPress: () => Linking.openURL("mailto:support@vysyamala.com"),
        },
        {
            icon: <Ionicons name="call" size={22} color="#ED1E24" />,
            label: "Call Us",
            value: "9944851550",
            onPress: () => Linking.openURL("tel:9944851550"),
        },
        {
            icon: <FontAwesome6 name="whatsapp" size={22} color="#ED1E24" />,
            label: "WhatsApp Us",
            value: "9944851550",
            onPress: () => Linking.openURL("whatsapp://send?phone=919944851550"),
        },
    ];

    const faqItems = [
        {
            question: "How do I upgrade my plan?",
            answer: "Go to Menu → Upgrade / Membership Plan to view and purchase available plans.",
        },
        {
            question: "How do I update my profile?",
            answer: "Go to Menu → My Profile to edit your personal, educational, and family details.",
        },
        {
            question: "How do I delete my account?",
            answer: "Go to Menu → Other Settings → Delete Account.",
        },
        {
            question: "How do I protect my photos?",
            answer: "Go to Other Settings → Photo / ID Settings and enable password protection for your images.",
        },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: "#F4F4F4" }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Header */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#ED1E24" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Help & Support</Text>
                </View>

                {/* Contact Us Section */}
                <Text style={styles.sectionTitle}>Contact Us</Text>

                {contactItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.card}
                        onPress={item.onPress}
                    >
                        <View style={styles.iconBox}>{item.icon}</View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardLabel}>{item.label}</Text>
                            <Text style={styles.cardValue}>{item.value}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#aaa" />
                    </TouchableOpacity>
                ))}

                {/* Divider */}
                <View style={styles.divider} />

                {/* FAQ Section */}
                <Text style={styles.sectionTitle}>FAQs</Text>

                {faqItems.map((item, index) => (
                    <View key={index} style={styles.faqCard}>
                        <View style={styles.faqHeader}>
                            <MaterialIcons
                                name="help-outline"
                                size={18}
                                color="#ED1E24"
                                style={{ marginRight: 8, marginTop: 2 }}
                            />
                            <Text style={styles.faqQuestion}>{item.question}</Text>
                        </View>
                        <Text style={styles.faqAnswer}>{item.answer}</Text>
                    </View>
                ))}

                {/* Divider */}
                {/* <View style={styles.divider} /> */}

                {/* Working Hours */}
                <Text style={styles.sectionTitle}>Working Hours</Text>
                <View style={styles.card}>
                    <View style={styles.iconBox}>
                        <Ionicons name="time" size={22} color="#ED1E24" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardLabel}>Mon – Sat</Text>
                        <Text style={styles.cardValue}>9:00 AM – 6:00 PM</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        marginTop: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
        backgroundColor: "#fff",
    },
    headerText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
        marginLeft: 10,
        fontFamily: "inter",
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#888",
        fontFamily: "inter",
        marginTop: 20,
        marginBottom: 8,
        paddingHorizontal: 15,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingVertical: 16,
        paddingHorizontal: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E5E5E5",
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: "#FFF0F0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    cardContent: {
        flex: 1,
    },
    cardLabel: {
        fontSize: 13,
        color: "#888",
        fontFamily: "inter",
        marginBottom: 2,
    },
    cardValue: {
        fontSize: 15,
        fontWeight: "600",
        color: "#282C3F",
        fontFamily: "inter",
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
        marginVertical: 10,
        marginHorizontal: 15,
    },
    faqCard: {
        backgroundColor: "#fff",
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E5E5E5",
    },
    faqHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 6,
    },
    faqQuestion: {
        fontSize: 14,
        fontWeight: "700",
        color: "#282C3F",
        fontFamily: "inter",
        flex: 1,
    },
    faqAnswer: {
        fontSize: 13,
        color: "#535665",
        fontFamily: "inter",
        lineHeight: 20,
        paddingLeft: 26,
    },
});