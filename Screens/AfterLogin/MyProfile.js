import React, { useState, useRef, useEffect } from 'react'
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    Image,
    ScrollView,
    TouchableOpacity,
    Pressable,
    Dimensions,
    Modal,
    Alert,
    ActivityIndicator, Linking
} from "react-native";
import {
    Ionicons,
    MaterialIcons,
} from "@expo/vector-icons";
import Carousel from 'react-native-reanimated-carousel';
import ImageViewer from 'react-native-image-zoom-viewer';
import RadioGroup from 'react-native-radio-buttons-group';
import { launchImageLibrary } from 'react-native-image-picker';
import { LinearGradient } from "expo-linear-gradient";
import CircularProgress from "react-native-circular-progress-indicator";
import { useNavigation } from "@react-navigation/native";
// import { Rasi } from '../../Components/Rasi';
import { DetailsEdit, ProfileDetailsEdit } from '../../Components/MenuTab/ProfileDetailsEdit';
import { getProfileDetailsMatch, uploadImageToServer, removeProfileImage, fetchImages, downloadPdfPorutham, downloadPdf, downloadPdfmyprofile, getMyProfilePersonal } from '../../CommonApiCall/CommonApiCall'; // Import the API function
import config from '../../API/Apiurl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";
import { getMyEducationalDetails } from '../../CommonApiCall/CommonApiCall';
import { TopAlignedImage } from '../../Components/ReuseImageAlign/TopAlignedImage';

// ✅ Responsive helpers - outside component so usable in StyleSheet
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const fs = (size) => isTablet ? Math.round(size * 1.3) : size;

export const MyProfile = () => {
    const navigation = useNavigation();

    const [isBookmarked, setIsBookmarked] = useState(false);

    // Function to handle save icon press
    const handleSavePress = () => {
        setIsBookmarked(!isBookmarked); // Toggle bookmarked state
    };

    // Carousel State - full width on all screens
    const screenWidth = Dimensions.get('window').width;
    const width = screenWidth; // ✅ always full width
    const carouselHeight = isTablet ? 500 : 400;

    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [selectedSlideIndex, setSelectedSlideIndex] = useState(null);
    const [isZoomVisible, setZoomVisible] = useState(false);
    const [data, setData] = useState([]);
    const [profileDetails, setProfileDetails] = useState(null); // State for profile details
    const [loading, setLoading] = useState(false);
    const [educationalDetails, setEducationalDetails] = useState(null);
    const [currentPlanId, setCurrentPlanId] = useState(null);
    const allowedPremiumIds = [1, 2, 3, 10, 11, 13, 14, 15, 16, 17];
    const [selectedPdfLanguage, setSelectedPdfLanguage] = useState("english");
    const [showLanguagePopup, setShowLanguagePopup] = useState(false);

    // Add this new function inside your MyProfile component:
    const handleAddOnPackagePress = () => {
        if (profileDetails.package_name === "Free") {
            navigation.navigate('MembershipPlan');
        } else {
            navigation.navigate('PayNow', { isAddOnOnly: true });
        }
    };

    useEffect(() => {
        fetchAndSetImages();
    }, []);

    const fetchAndSetImages = async () => {
        try {
            const result = await fetchImages();
            console.log('result imagescheck ==>', result);
            if (result.Status === 1) {
                const images = result.data.map((image) => ({
                    id: image.id,
                    url: `${image.image}`,
                    uploaded_at: image.uploaded_at,
                }));
                setData(images);
                console.log('Fetched images:', images);
            } else {
                console.log('Failed to fetch images:', result.message);
            }
        } catch (error) {
            console.error('Error fetching images:', error);
        }
    };

    const handleImageUpload = (id) => {
        Alert.alert(
            'Select Option',
            'Would you like to upload a new image or remove the current one?',
            [
                {
                    text: 'Upload Image',
                    onPress: () => uploadImage(id),
                },
                {
                    text: 'Remove Image',
                    onPress: () => removeImage(id),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ],
            { cancelable: true }
        );
    };

    const uploadImage = async (id) => {
        launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
        }, async (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
                return;
            }

            if (response.error) {
                console.log('ImagePicker Error: ', response.error);
                return;
            }

            if (response.assets && response.assets[0]) {
                const file = response.assets[0];
                const profileId = await AsyncStorage.getItem("loginuser_profileId");

                if (!profileId) {
                    Toast.show({
                        type: "error",
                        text1: "Error",
                        text2: "Profile ID not found",
                        position: "bottom",
                    });
                    return;
                }

                const formData = new FormData();
                formData.append("profile_id", profileId);

                if (id !== null) {
                    formData.append("replace_image_ids", id.toString());
                    formData.append("replace_image_files", {
                        uri: file.uri,
                        type: file.type || 'image/jpeg',
                        name: file.fileName || `image_${Date.now()}.jpg`,
                    });
                } else {
                    formData.append("new_image_files", {
                        uri: file.uri,
                        type: file.type || 'image/jpeg',
                        name: file.fileName || `image_${Date.now()}.jpg`,
                    });
                }

                try {
                    setLoading(true);
                    const response = await uploadImageToServer(formData);
                    console.log("Image processed successfully:", response);

                    Toast.show({
                        type: "success",
                        text1: "Success",
                        text2: id ? "Image replaced successfully" : "Image uploaded successfully",
                        position: "bottom",
                    });

                    await fetchAndSetImages();
                } catch (error) {
                    console.error("Upload error:", error);
                    if (error.message && error.message !== '__SILENT__') {
                        Toast.show({
                            type: "error",
                            text1: "Upload Error",
                            text2: error.message || "Failed to upload image",
                            position: "bottom",
                        });
                    }
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // Remove the selected image
    const removeImage = async (id) => {
        try {
            setLoading(true);

            const profileId = await AsyncStorage.getItem("loginuser_profileId");
            if (!profileId) {
                throw new Error('Profile ID not found');
            }

            const formData = new FormData();
            formData.append('profile_id', profileId);
            formData.append('image_id', id.toString());

            const result = await removeProfileImage(formData);

            if (result.success) {
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: "Image removed successfully",
                    position: "bottom",
                });

                const newData = data.filter(item => item.id !== id);
                setData(newData);
            }
            fetchAndSetImages();
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "Failed to remove image",
                position: "bottom",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchProfileAndPlanDetails = async () => {
            try {
                const result = await getMyProfilePersonal();
                console.log("Profile Details fetched:", result);

                await AsyncStorage.setItem("selectedPlanName", result.data.package_name || "Gold");
                setProfileDetails(result.data);

                const planIdStr = await AsyncStorage.getItem("current_plan_id");
                if (planIdStr) {
                    setCurrentPlanId(parseInt(planIdStr, 10));
                } else {
                    setCurrentPlanId(0);
                }

            } catch (error) {
                console.error('Error fetching profile details or plan ID:', error);
            }
        };

        fetchProfileAndPlanDetails();
    }, []);

    const renderItem = ({ item, index }) => (
        <View style={styles.itemContainer} key={item.id}>
            <TouchableOpacity style={styles.imageWrapper}>
                <TopAlignedImage
                    uri={item.url || 'https://via.placeholder.com/150'}
                    width={width}
                    height={carouselHeight}
                    style={styles.image}
                />
            </TouchableOpacity>

            {/* Container for both icons */}
            <View style={styles.iconContainer}>
                {/* Plus icon for adding new image */}
                <TouchableOpacity
                    style={styles.addIconWrapper}
                    onPress={() => handleAddNewImage()}
                >
                    <MaterialIcons
                        name="add-circle"
                        size={24}
                        color="red"
                    />
                </TouchableOpacity>

                {/* Edit icon for replacing current image */}
                <MaterialIcons
                    name="edit"
                    size={24}
                    color="red"
                    style={styles.editIcon}
                    onPress={() => handleImageUpload(item.id)}
                />
            </View>
        </View>
    );

    const handleAddNewImage = () => {
        uploadImage(null);
    };

    const handleDownloadPdf = () => {
        if (!profileDetails || !profileDetails.encrypted_profile_id) {
            Alert.alert("Error", "Profile data is still loading...");
            return;
        }
        setShowLanguagePopup(true);
    };

    const handlePdfSubmit = async () => {
        setShowLanguagePopup(false);
        setLoading(true);

        try {
            const encryptedId = profileDetails.encrypted_profile_id;

            const result = await downloadPdfmyprofile(encryptedId, selectedPdfLanguage);
            console.log("PDF download result:", result);
            if (result && result.status === 'failure') {
                Alert.alert("Error", result.message || "Failed to generate PDF");
            } else if (result) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Horoscope downloaded successfully',
                    position: "bottom",
                });
            }
        } catch (error) {
            Alert.alert("Error", "Failed to download the file.");
        } finally {
            setLoading(false);
        }
    };

    const fetchProfileData = async () => {
        try {
            const data = await getMyEducationalDetails();
            console.log("data educational details ===>", data);
            setEducationalDetails(data.data);
        } catch (error) {
            console.error('Failed to load profile data', error);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleWhatsAppShare = async (withImage = false) => {
        const profileName = profileDetails?.personal_profile_name;
        const profileId = profileDetails?.profile_id;
        const encryptedProfileId = profileDetails?.encrypted_profile_id;
        const age = profileDetails?.personal_age;
        const starName = profileDetails?.star;
        const registrationLink = 'vysyamala.com';
        const profession = profileDetails?.prosession;
        const annualIncome = educationalDetails?.personal_ann_inc_name;
        const placeOfStay = educationalDetails?.personal_work_district || educationalDetails?.personal_work_city_name
        const education = educationalDetails?.persoanl_degree_name;
        const companyName = educationalDetails?.personal_company_name;
        const businessName = educationalDetails?.personal_business_name;
        let professionLine = '💼 *Profession:* Not available\n';

        if (profession) {
            if (profession.toLowerCase() === 'employed' && companyName) {
                professionLine = `💼 *Profession:* Employed at ${companyName}\n`;
            } else if (profession.toLowerCase() === 'business' && businessName) {
                professionLine = `💼 *Profession:* Business at ${businessName}\n`;
            } else if (profession.toLowerCase() === 'employed/business' && businessName) {
                professionLine = `💼 *Profession:* ${profession}-Employed at ${companyName}, Business at ${businessName}\n`;
            } else if (profession.toLowerCase() === 'goverment/ psu' && companyName) {
                professionLine = `💼 *Profession:* Government/ PSU at ${companyName}\n`;
            } else {
                professionLine = `💼 *Profession:* ${profession}\n`;
            }
        }

        const shareUrl = withImage
            ? `${config.apiUrl}/auth/profile/${encryptedProfileId}/`
            : `${config.apiUrl}/auth/profile_view/${encryptedProfileId}/`;

        const message =
            `Check out this profile!\n\n` +
            `🆔 *Profile ID:* ${profileId || 'Not available'}\n` +
            `👤 *Profile Name:* ${profileName || 'Not available'}\n` +
            `🎂 *Age:* ${age || 'Not available'} years\n` +
            `✨ *Star Name:* ${starName || 'Not available'}\n` +
            `💰 *Annual Income:* ${annualIncome || 'Not available'}\n` +
            `🎓 *Education:* ${education || 'Not available'}\n` +
            professionLine +
            `📍 *Place of Stay:* ${placeOfStay || 'Not available'}\n\n` +
            `🌟 *For More Details:* ${shareUrl}\n` +
            `------------------------------------------- \n` +
            `Click here to register your profile on Vysyamala :\n` +
            `${registrationLink}`;

        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

        try {
            const supported = await Linking.canOpenURL(whatsappUrl);
            if (!supported) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'WhatsApp is not installed',
                    position: 'bottom',
                });
                return;
            }
            await Linking.openURL(whatsappUrl);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to share on WhatsApp',
                position: 'bottom',
            });
        } finally {
            setShareModalVisible(false);
        }
    };

    return (
        <ScrollView>
            <SafeAreaView style={styles.container}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#ED1E24" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>{"My Profile"}</Text>
                </View>

                {/* ✅ Full width image section */}
                <View style={{ width: '100%' }}>
                    {data.length > 0 ? (
                        <>
                            <Carousel
                                loop
                                width={screenWidth}
                                height={carouselHeight}
                                style={{ width: screenWidth, height: carouselHeight }}
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
                        </>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <TouchableOpacity
                                style={styles.uploadWrapper}
                                onPress={() => handleImageUpload(null)}
                            >
                                <MaterialIcons name="add-photo-alternate" size={48} color="gray" />
                                <Text style={styles.uploadText}>Upload Image</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isZoomVisible && (
                        <Modal visible={isZoomVisible} transparent={true}>
                            <ImageViewer
                                imageUrls={data.map((item) => ({ url: item.url }))}
                                index={selectedSlideIndex}
                                onClick={() => setZoomVisible(false)}
                            />
                        </Modal>
                    )}
                </View>

                {/* ✅ Content below image - not overlapping */}
                <View style={styles.contentContainer}>
                    {profileDetails ? (
                        <>
                            <View style={styles.nameIconFlex}>
                                <Text style={styles.name}>{profileDetails.personal_profile_name}</Text>

                                <TouchableOpacity>
                                    <Ionicons
                                        name="shield-checkmark"
                                        size={18}
                                        color="#53c840"
                                        style={styles.verificationIcon}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => setShareModalVisible(true)}
                                >
                                    <Ionicons
                                        name="share-social"
                                        size={20}
                                        color="#ED1E24"
                                    />
                                </TouchableOpacity>

                                <Modal
                                    animationType="slide"
                                    transparent={true}
                                    visible={shareModalVisible}
                                    onRequestClose={() => setShareModalVisible(false)}
                                >
                                    <View style={{
                                        flex: 1,
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <View style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            padding: 20,
                                            width: '80%',
                                            alignItems: 'center'
                                        }}>
                                            <View style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                width: '100%',
                                                marginBottom: 20
                                            }}>
                                                <Text style={{ fontSize: fs(18), fontWeight: 'bold', color: '#000' }}>Share Profile</Text>
                                                <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                                                    <Ionicons name="close" size={24} color="#000" />
                                                </TouchableOpacity>
                                            </View>
                                            <TouchableOpacity
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    padding: 15,
                                                    borderWidth: 1,
                                                    borderColor: '#ddd',
                                                    borderRadius: 10,
                                                    marginVertical: 5,
                                                    width: '100%'
                                                }}
                                                onPress={() => handleWhatsAppShare(true)}
                                            >
                                                <Ionicons name="image" size={24} color="#ED1E24" />
                                                <Text style={{ marginLeft: 15, fontSize: fs(16), color: '#000' }}>Share with Image</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    padding: 15,
                                                    borderWidth: 1,
                                                    borderColor: '#ddd',
                                                    borderRadius: 10,
                                                    marginVertical: 5,
                                                    width: '100%'
                                                }}
                                                onPress={() => handleWhatsAppShare(false)}
                                            >
                                                <Ionicons name="document-text" size={24} color="#ED1E24" />
                                                <Text style={{ marginLeft: 15, fontSize: fs(16), color: '#000' }}>Share without Image</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Modal>

                                <TouchableOpacity style={{ alignItems: 'center' }} onPress={handleDownloadPdf}>
                                    <Ionicons name="print" size={20} color="#ED1E24" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.profileNumber}>{profileDetails.profile_id}</Text>

                            <View style={styles.planFlex}>
                                {profileDetails.valid_upto &&
                                    new Date(profileDetails.valid_upto) < new Date() &&
                                    allowedPremiumIds.includes(currentPlanId) ? (
                                    <TouchableOpacity
                                        style={styles.renewButtonWrapper}
                                        onPress={() => navigation.navigate('PayNow')}
                                    >
                                        <LinearGradient
                                            colors={["#BD1225", "#FF4050"]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.renewButton}
                                        >
                                            <Text style={styles.renewButtonText}>Renew</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.planFlex}>
                                        <LinearGradient
                                            colors={
                                                profileDetails.package_name === "Platinum"
                                                    ? ["#E5E4E2", "#C0C0C0", "#FFFFFF"]
                                                    : profileDetails.package_name === "Gold"
                                                        ? ["#D79D32", "#FFB800", "#FDE166"]
                                                        : profileDetails.package_name === "Diamond"
                                                            ? ["#B9F2FF", "#FFFFFF", "#B9F2FF"]
                                                            : ["#D79D32", "#FFB800", "#FDE166"]
                                            }
                                            locations={[0, 0.5, 1]}
                                            start={{ x: 1, y: 1 }}
                                            end={{ x: 0, y: 0 }}
                                            style={[
                                                styles.goldLinearGradient,
                                                profileDetails.package_name === "Diamond" && styles.diamondText
                                            ]}
                                        >
                                            <Text style={[
                                                styles.goldText,
                                                profileDetails.package_name === "Diamond" && { color: "#fff" }
                                            ]}>
                                                {profileDetails.package_name}
                                            </Text>
                                        </LinearGradient>
                                    </View>
                                )}
                                {profileDetails.valid_upto && (
                                    <Text style={[styles.date, { marginBottom: 8, marginLeft: 10 }]}>
                                        Valid Upto :
                                        {profileDetails.valid_upto}
                                    </Text>
                                )}
                            </View>

                            <Pressable
                                style={styles.completeTextFlex}
                                onPress={handleAddOnPackagePress}
                            >
                                <Text style={styles.completeText}>Add on packages</Text>
                                <Ionicons name="arrow-forward" size={18} color="#ED1E24" />
                            </Pressable>

                            {/* Age */}
                            <View>
                                <Text style={styles.label}>Age : <Text style={styles.value}>{profileDetails.personal_age}</Text></Text>
                                <Text style={styles.label}>Height : <Text style={styles.value}>{profileDetails.personal_profile_height?.height_desc}</Text></Text>
                                <Text style={styles.label}>Star : <Text style={styles.value}>{profileDetails.star}</Text></Text>
                                <Text style={styles.label}>Profession : <Text style={styles.value}>{profileDetails.prosession}</Text></Text>
                                <Text style={styles.label}>Education : <Text style={styles.value}>{profileDetails.heightest_education}</Text></Text>
                            </View>
                        </>
                    ) : (
                        <Text>Loading profile details...</Text>
                    )}

                </View>

                {/* Details View */}
                <ProfileDetailsEdit />
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#ED1E24" />
                    </View>
                )}
            </SafeAreaView>

            {/* Language Selection Modal */}
            <Modal
                visible={showLanguagePopup}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLanguagePopup(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: 'white', width: '85%', borderRadius: 10, padding: 20 }}>
                        <TouchableOpacity
                            style={{ alignSelf: 'flex-end' }}
                            onPress={() => setShowLanguagePopup(false)}
                        >
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>

                        <Text style={{ fontSize: fs(18), fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>Select Language</Text>

                        <View style={{ marginBottom: 20 }}>
                            {/* English */}
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}
                                onPress={() => setSelectedPdfLanguage("english")}
                            >
                                <MaterialIcons
                                    name={selectedPdfLanguage === "english" ? "radio-button-checked" : "radio-button-unchecked"}
                                    size={24} color="#BD1225"
                                />
                                <Text style={{ fontSize: fs(16), marginLeft: 10 }}>English</Text>
                            </TouchableOpacity>

                            {/* Tamil */}
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => setSelectedPdfLanguage("tamil")}
                            >
                                <MaterialIcons
                                    name={selectedPdfLanguage === "tamil" ? "radio-button-checked" : "radio-button-unchecked"}
                                    size={24} color="#BD1225"
                                />
                                <Text style={{ fontSize: fs(16), marginLeft: 10 }}>Tamil</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={{ backgroundColor: '#BD1225', padding: 12, borderRadius: 8 }}
                            onPress={handlePdfSubmit}
                        >
                            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F4F4",
    },
    headerContainer: {
        padding: 3,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
        marginLeft: 10,
        marginBottom: 10,
    },
    headerText: {
        color: "#000000",
        fontSize: fs(18),
        fontWeight: "bold",
        marginLeft: 10,
    },
    contentContainer: {
        width: "100%",
        paddingHorizontal: 10,
        backgroundColor: '#F4F4F4',  // ✅ prevents overlap
        zIndex: 2,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 999,
    },
    name: {
        color: "#FF6666",
        fontSize: fs(22),
        fontFamily: "inter",
        fontWeight: "700",
    },
    nameIconFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",  // ✅ fixed: was space-between (caused icons to float right)
        alignItems: "center",
        width: "100%",
        paddingVertical: 20,
        gap: 12,                        // ✅ space between items
    },
    iconFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "15%",
    },
    saveIcon: {},
    profileNumber: {
        fontSize: fs(17),
        fontWeight: "700",
        color: "#535665",
        marginBottom: 10,
        alignSelf: "flex-start",
        marginTop: -15,
    },
    planFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        alignSelf: "flex-start",
    },
    goldLinearGradient: {
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center",
        padding: 5,
        width: 100,
        marginRight: 10,
    },
    goldText: {
        color: "#202332",
        fontSize: fs(14),
        fontWeight: "700",
        fontFamily: "inter",
    },
    date: {
        fontSize: fs(13),
        fontWeight: "700",
        color: "#535665",
    },
    label: {
        color: "#535665",
        fontSize: fs(16),
        fontWeight: "700",
        fontFamily: "inter",
        marginBottom: 10,
    },
    value: {
        color: "#535665",
        fontSize: fs(16),
        fontWeight: "500",
        fontFamily: "inter",
    },
    sandalProfileContainer: {
        width: "100%",
        backgroundColor: "#FFFBE3",
        borderRadius: 8,
        paddingVertical: 20,
        marginTop: 20,
    },
    sandalContainerFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "flex-start",
    },
    percentageContent: {
        marginLeft: 15,
    },
    profilePercentage: {
        color: "#535665",
        fontSize: fs(14),
        fontWeight: "700",
        fontFamily: "inter",
        marginBottom: 5,
    },
    percentageText: {
        color: "#535665",
        fontSize: fs(12),
        fontWeight: "300",
        fontFamily: "inter",
        marginBottom: 10,
        flexWrap: "wrap",
        maxWidth: "85%",
    },
    completeTextFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginVertical: 10,
    },
    completeText: {
        color: "#ED1E24",
        fontSize: fs(14),
        fontWeight: "500",
        fontFamily: "inter",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    details: {
        fontSize: fs(16),
        fontWeight: "700",
        fontFamily: "inter",
        color: "#282C3F",
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        marginVertical: 10,
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    indexText: {
        textAlign: 'center',
        fontSize: fs(30),
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
    editIcon: {
        padding: 0,
    },
    iconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 1,
        padding: 5,
        gap: 5,
    },
    addIconWrapper: {
        padding: 0,
    },
    itemContainer: {
        position: 'relative',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
    },
    renewButtonWrapper: {
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    renewButton: {
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    renewButtonText: {
        color: 'white',
        fontSize: fs(14),
        fontWeight: '600',
        fontFamily: "inter",
    },
    emptyContainer: {
        height: 400,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    uploadWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 10,
        fontSize: fs(14),
        color: 'gray',
    },
});