import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    ImageBackground,
    Image,
    Pressable,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    Modal
} from "react-native";
import {
    AntDesign,
    Ionicons,
    MaterialIcons,
    FontAwesome,
    FontAwesome5,
    FontAwesome6,
    MaterialCommunityIcons,
} from "@expo/vector-icons";
import Carousel from 'react-native-reanimated-carousel';
import ImageViewer from 'react-native-image-zoom-viewer';
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { ProfileDetailsView } from "../../Components/HomeTab/ProfileDetails/ProfileDetailsView";
import { FeaturedProfiles } from "../../Components/HomeTab/FeaturedProfiles";
import { VysyamalaAd } from "../../Components/HomeTab/VysyamalaAd";
import { SuggestedProfiles } from "../../Components/HomeTab/SuggestedProfiles";



export const ProfileDetailsRequest = () => {

    // Naviagtion
    const navigation = useNavigation();

    // Carousel State
    const width = Dimensions.get('window').width;

    const [activeSlide, setActiveSlide] = useState(0);
    const [selectedSlideIndex, setSelectedSlideIndex] = useState(null);
    const [isZoomVisible, setZoomVisible] = useState(false);

    const data = [
        'https://via.placeholder.com/600/92c952',
        'https://via.placeholder.com/600/771796',
        'https://via.placeholder.com/600/24f355',
        'https://via.placeholder.com/600/d32776',
        'https://via.placeholder.com/600/f66b97',
        'https://via.placeholder.com/600/56a8c2',
    ];

    const images = data.map(url => ({ url }));

    const handleSlidePress = (index) => {
        setSelectedSlideIndex(index);
        setZoomVisible(true);
    };

    const renderItem = ({ item, index }) => (
        <View
            style={[
                styles.itemContainer,
                { backgroundColor: selectedSlideIndex === index ? 'lightblue' : 'white' },
            ]}
        >
            <TouchableOpacity
                style={styles.imageWrapper}
                onPress={() => handleSlidePress(index)}
            >
                <Image source={{ uri: item }} style={styles.image} />
            </TouchableOpacity>
        </View>

    );

    // Bookmark Wishlist Profile
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Function to handle save icon press
    const handleSavePress = () => {
        setIsBookmarked(!isBookmarked); // Toggle bookmarked state
    };


    return (
        <ScrollView>
            <View style={styles.container}>

                <View style={{ flex: 1 }}>
                    <Carousel
                        loop
                        // width={width}
                        // height={400}
                        style={{ width: width, height: 400 }}
                        autoPlay={false}
                        data={data}
                        scrollAnimationDuration={1000}
                        onSnapToItem={(index) => setActiveSlide(index)}
                        renderItem={renderItem}
                    />

                    <View style={styles.paginationContainer}>
                        {data.map((_, i) => (
                            <View
                                key={`pagination-dot-${i}`}
                                style={[
                                    styles.dot,
                                    {
                                        opacity: i === activeSlide ? 1 : 0.4,
                                        transform: [{ scale: i === activeSlide ? 1 : 0.6 }],
                                    },
                                ]}
                            />
                        ))}
                    </View>
                    {isZoomVisible && (
                        <Modal visible={isZoomVisible} transparent={true}>
                            <ImageViewer
                                imageUrls={images}
                                index={selectedSlideIndex}
                                onClick={() => setZoomVisible(false)}
                            />
                        </Modal>
                    )}
                </View>

                <View style={styles.contentContainer}>

                    {/* Profile Name & Profile Bookmark icon */}
                    <View style={styles.nameIconFlex}>

                        {/* Profile Name & Verified Icon */}
                        <View style={styles.nameVerifyFlex}>
                            <Text style={styles.name}>Ram Paneer Selvam</Text>
                            <Ionicons name="shield-checkmark" size={18} color="#53c840" />
                        </View>

                        {/* Bookmark Wishlist Icon */}
                        <View style={styles.iconFlex}>
                            <Pressable onPress={handleSavePress}>
                                <MaterialIcons
                                    name={isBookmarked ? "bookmark" : "bookmark-border"}
                                    size={18}
                                    color="#4F515D"
                                    style={styles.saveIcon}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* Profile ID */}
                    <Text style={styles.profileNumber}>VM32787</Text>

                    {/* Profile Details & Matcing Score Meter */}
                    <View style={styles.detailsMeterFlex}>

                        <View>
                            <Text style={styles.label}>Age : <Text style={styles.value}>22 Years</Text></Text>
                            <Text style={styles.label}>Height : <Text style={styles.value}>5 ft 5 inch (165 cms)</Text></Text>
                            <Text style={styles.label}>Star : <Text style={styles.value}>Anusham</Text></Text>
                            <Text style={styles.label}>Profession : <Text style={styles.value}>Employed</Text></Text>
                            <Text style={styles.label}>Education : <Text style={styles.value}>B.Tech., Mech</Text></Text>
                        </View>

                        <View>
                            <Image source={require("../../assets/img/MatchingScore.png")} />
                        </View>
                    </View>

                    <View>
                        <Text style={styles.interestText}>I am interested in your profile. If you are interested in my profile, please contact me.</Text>
                    </View>

                    {/* buttons */}
                    <View style={styles.buttonContainer}>
                        {/* Submit */}
                        <TouchableOpacity
                            style={styles.btn}
                            onPress={() => {
                                navigation.navigate("");
                            }}
                        >
                            {/* <LinearGradient
                                colors={["#BD1225", "#FF4050"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                useAngle={true}
                                angle={92.08}
                                angleCenter={{ x: 0.5, y: 0.5 }}
                                style={styles.linearGradient}
                            > */}
                            <View style={styles.loginContainer}>
                                <View style={styles.acceptContainer}>
                                    <MaterialIcons name="check-circle" size={18} color={"#fff"} />
                                    <Text style={styles.acceptContainerText}>Accept</Text>
                                </View>
                            </View>
                            {/* </LinearGradient> */}
                        </TouchableOpacity>

                        {/* Cancel */}
                        <TouchableOpacity
                            onPress={() => {
                                navigation.navigate("");
                            }}
                        >
                            <View style={styles.loginContainer}>
                                <View style={styles.declineContainer}>
                                    <MaterialCommunityIcons name="close-circle" size={18} color={"#ED1E24"} />
                                    <Text style={styles.declineContainerText}>Decline</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Message */}
                        <TouchableOpacity
                            onPress={() => {
                                navigation.navigate("");
                            }}
                        >
                            <View style={styles.loginContainer}>
                                <View style={styles.messageContainer}>
                                    {/* <Text style={styles.cancel}>Decline</Text> */}
                                    <MaterialIcons name="message" size={18} color={"#ED1E24"} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Icons */}
                    <View style={styles.fiveIconFlex}>
                        <Ionicons
                            name="share-social-sharp"
                            size={24}
                            color="#4F515D"
                            style={styles.iconsFour}
                        />

                        <Ionicons
                            name="document-text"
                            size={24}
                            color="#4F515D"
                            style={styles.iconsFour}
                        />

                        <MaterialCommunityIcons
                            name="alert"
                            size={24}
                            color="#4F515D"
                            style={styles.iconsFour}
                        />

                        <MaterialCommunityIcons
                            name="account-voice"
                            size={24}
                            color="#4F515D"
                            style={styles.iconsFour}
                        />

                        <MaterialCommunityIcons
                            name="printer"
                            size={24}
                            color="#4F515D"
                            style={styles.iconsFour}
                        />
                    </View>

                    {/* Details */}
                    <Text style={styles.details}>Details</Text>

                </View>

                {/* Profile Details View Component */}
                <ProfileDetailsView />

                {/* Featured Profiles */}
                <FeaturedProfiles />

                {/* Vysyamala Ad */}
                <VysyamalaAd />

                {/* Suggested Profiles */}
                <SuggestedProfiles />

            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "flex-start",
    },

    // menuContainer: {
    //   width: "100%",
    //   overflow: 'hidden', // Ensure content doesn't overflow
    // },

    itemContainer: {
        // flex: 1,
        // borderWidth: 1,
        justifyContent: 'center',
    },

    image: {
        // width: width,
        // height: width / 2,
        width: "100%",
        height: "100%",
        // resizeMode: "cover",
    },

    indexText: {
        textAlign: 'center',
        fontSize: 30,
    },

    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
        backgroundColor: 'transparent',
    },

    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
    },

    contentContainer: {
        width: "100%",
        paddingHorizontal: 10,
    },

    name: {
        color: "#FF6666",
        fontSize: 20,
        fontFamily: "inter",
        fontWeight: "700",
        marginRight: 10,
        // marginBottom: 10,
    },

    nameIconFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        paddingVertical: 10,
    },

    nameVerifyFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    iconFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        // width: "15%",
    },

    saveIcon: {
        // position: "absolute",
        // left: -25,
        // top: 5,
    },

    profileNumber: {
        fontSize: 12,
        fontWeight: "700",
        color: "#535665",
        // paddingHorizontal: 10,
        marginBottom: 10,
        alignSelf: "flex-start",
    },

    detailsMeterFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    label: {
        color: "#535665",
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "inter",
        marginBottom: 10,
    },

    value: {
        color: "#535665",
        fontSize: 14,
        fontWeight: "500",
        fontFamily: "inter",
    },

    buttonContainer: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        alignSelf: "center",
        width: "100%",
        // paddingHorizontal: 10,
        marginVertical: 10,
    },

    btn: {
        // width: "100%",
        alignSelf: "center",
        borderRadius: 6,
        // shadowColor: "#EE1E2440",
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.2,
        // shadowRadius: 6,
        // elevation: 5,
        // marginBottom: 10,
    },

    loginContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    cancel: {
        color: "#ED1E24",
        fontSize: 14,
        fontWeight: "600",
        fontFamily: "inter",
        // alignSelf: "flex-start",
        borderWidth: 2,
        borderColor: "#ED1E24",
        borderRadius: 5,
        paddingHorizontal: 15,
        paddingVertical: 8.5,
        letterSpacing: 1,
        // marginBottom: 10,
    },

    login: {
        textAlign: "center",
        color: "white",
        fontWeight: "600",
        fontSize: 14,
        letterSpacing: 1,
        fontFamily: "inter",
        // marginRight: 5,
    },

    linearGradient: {
        borderRadius: 5,
        justifyContent: "center",
        padding: 10,
        marginRight: 15,
    },

    fiveIconFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 20,
    },

    details: {
        fontSize: 16,
        fontWeight: "700",
        fontFamily: "inter",
        color: "#282C3F",
        alignSelf: "flex-start",
        // paddingHorizontal: 10,
        marginVertical: 10,
    },

    interestText: {
        color: "#85878C",
        fontSize: 14,
        fontWeight: "400",
        marginVertical: 10,
        // backgroundColor: "red"
    },

    acceptContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#53C840",
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginRight: 10,
    },

    acceptContainerText: {
        textAlign: "center",
        color: "white",
        fontWeight: "600",
        fontSize: 14,
        letterSpacing: 1,
        fontFamily: "inter",
        marginLeft: 5,
    },

    declineContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#ED1E24",
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 20,
        marginRight: 10,
    },

    declineContainerText: {
        textAlign: "center",
        color: "#ED1E24",
        fontWeight: "600",
        fontSize: 14,
        letterSpacing: 1,
        fontFamily: "inter",
        marginLeft: 5,
    },

    messageContainer: {
        padding: 10,
    },

});
