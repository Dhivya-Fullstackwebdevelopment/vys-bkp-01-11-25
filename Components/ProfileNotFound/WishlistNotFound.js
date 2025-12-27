import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const WishlistNotFound = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image source={require('../../assets/img/noResultFound.png')} style={styles.image} alt="No Results Found" />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>No Profiles added to wishlist</Text>
                    <Text style={styles.message}>
                        You haven’t added any profiles to your wishlist yet
                    </Text>
                    {/* <Text style={styles.message}>
                        <TouchableOpacity onPress={() => navigation.navigate("Search")}>
                            <Text style={styles.link}> Advanced Search</Text>
                        </TouchableOpacity>
                    </Text> */}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 60,
        paddingHorizontal: 10,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff", // Optional background color
    },
    content: {
        alignItems: "center",
    },
    image: {
        width: 100, // Adjust size based on your image dimensions
        height: 100,
        resizeMode: "contain",
    },
    textContainer: {
        marginTop: 20,
        alignItems: "center",
    },
    title: {
        fontSize: 19,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: "#000",
        textAlign: "center",
        marginBottom: 10, // Add spacing after each message
    },

    link: {
        color: "#1D4ED8", // Tailwind equivalent for `text-blue-900`
        textDecorationLine: "underline",
        fontWeight: "bold",

    },
});

export default WishlistNotFound;