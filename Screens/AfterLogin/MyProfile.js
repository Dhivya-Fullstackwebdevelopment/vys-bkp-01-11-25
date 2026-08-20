import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Pressable,
    Dimensions,
    Modal,
    Alert,
    ActivityIndicator,
    Linking,
    Animated,
    Platform,
    Easing,
    ScrollView,
    StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
    Ionicons,
    MaterialIcons,
    MaterialCommunityIcons,
    FontAwesome5,
} from "@expo/vector-icons";
import Carousel from 'react-native-reanimated-carousel';
import ImageViewer from 'react-native-image-zoom-viewer';
import { launchImageLibrary } from 'react-native-image-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { ProfileIconsBar, ProfileSectionsContent } from '../../Components/MenuTab/ProfileDetailsEdit';
import { uploadImageToServer, removeProfileImage, fetchImages, downloadPdfmyprofile, viewHoroscopePdf, getMyProfilePersonal, getMyEducationalDetails } from '../../CommonApiCall/CommonApiCall';
import config from '../../API/Apiurl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";
import { TopAlignedImage } from '../../Components/ReuseImageAlign/TopAlignedImage';
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";
import { Colors } from "../../Reusable/Theme";
import { openCachedPdf } from '../../Screens/AfterLogin/PdfViewerModal';
import { InAppPdfModal } from "../../Screens/AfterLogin/InAppPdfModal";

// Responsive helpers
const { width: SCREEN_WIDTH, height: SCREEN_H } = Dimensions.get('window');

const isTablet = SCREEN_WIDTH >= 768;

const fs = (size) => isTablet ? Math.round(size * 1.3) : size;
const verticalScale = (size) => (SCREEN_H / 812) * size;

// Layout Constants
const HERO_IMAGE_HEIGHT = Math.max(340, Math.min(460, verticalScale(420)));
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HERO_RADIUS = 28;

const PROFILE_SECTIONS = [
    { key: 'personal', label: 'Personal' },
    { key: 'education', label: 'Work & Education' },
    { key: 'family', label: 'Family' },
    { key: 'horoscope', label: 'Horoscope' },
    { key: 'contact', label: 'Contact' },
];

const ShimmerLoader = () => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <View style={styles.shimmerContainer}>
            <Animated.View style={[styles.shimmerHero, { opacity }]} />
            <View style={styles.shimmerCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Animated.View style={[styles.shimmerCircle, { opacity }]} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Animated.View style={[styles.shimmerBar, { opacity, width: '70%', height: 20 }]} />
                        <Animated.View style={[styles.shimmerBar, { opacity, width: '40%', height: 14, marginTop: 8 }]} />
                    </View>
                </View>
                <Animated.View style={[styles.shimmerBar, { opacity, width: '100%', height: 16, marginTop: 12 }]} />
                <Animated.View style={[styles.shimmerBar, { opacity, width: '85%', height: 16, marginTop: 8 }]} />
            </View>
        </View>
    );
};

const InfoPillRow = ({ items }) => {
    const visible = items.filter((it) => it.value !== undefined && it.value !== null && it.value !== '');
    if (visible.length === 0) return null;
    return (
        <View style={styles.pillRow}>
            {visible.map((it, idx) => (
                <React.Fragment key={it.label}>
                    <View style={styles.pillItem}>
                        {it.icon}
                        <Text style={styles.pillText}>{it.value}</Text>
                    </View>
                    {idx < visible.length - 1 && <View style={styles.pillDivider} />}
                </React.Fragment>
            ))}
        </View>
    );
};

export const MyProfile = () => {
    const navigation = useNavigation();
    const scrollY = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);
    const insets = useSafeAreaInsets();

    const sectionOffsetsRef = useRef({
        personal: 0,
        education: 0,
        family: 0,
        horoscope: 0,
        contact: 0,
    });

    const [activeSection, setActiveSection] = useState('personal');
    const activeSectionRef = useRef('personal');

    const isProgrammaticScroll = useRef(false);
    const programmaticScrollTimeout = useRef(null);

    // Sticky tab tracking
    const tabBarRef = useRef(null);
    const tabBarOffset = useRef(0);
    const [isTabSticky, setIsTabSticky] = useState(false);

    const scrollToProfileSection = (key) => {
        setActiveSection(key);
        activeSectionRef.current = key;
        isProgrammaticScroll.current = true;

        if (programmaticScrollTimeout.current) {
            clearTimeout(programmaticScrollTimeout.current);
        }

        const relativeOffset = sectionOffsetsRef.current[key] || 0;
        const inlineTabBarY = tabBarOffset.current || 0;

        // Sticky tab bar height is 50px
        const STICKY_BAR_HEIGHT = 50;

        // Calculate absolute position on the ScrollView so section lands directly under the sticky bar
        const absoluteTargetY = inlineTabBarY + relativeOffset - STICKY_BAR_HEIGHT;
        const targetOffset = Math.max(0, absoluteTargetY);

        scrollViewRef.current?.scrollTo({ y: targetOffset, animated: true });

        // Keep scroll handler locked while smooth animation finishes
        programmaticScrollTimeout.current = setTimeout(() => {
            isProgrammaticScroll.current = false;
        }, 850);
    };

    const updateActiveSectionFromScroll = useCallback((offsetY) => {
        const inlineTabBarY = tabBarOffset.current || 0;

        if (inlineTabBarY > 0) {
            setIsTabSticky(offsetY >= inlineTabBarY);
        }

        if (isProgrammaticScroll.current) return;

        const STICKY_BAR_HEIGHT = 50;
        let current = PROFILE_SECTIONS[0].key;

        for (const section of PROFILE_SECTIONS) {
            const sectionRelativeY = sectionOffsetsRef.current[section.key] || 0;
            const sectionAbsoluteY = inlineTabBarY + sectionRelativeY - STICKY_BAR_HEIGHT;

            // Trigger active tab when section top reaches near the sticky tab bar
            if (offsetY + 30 >= sectionAbsoluteY) {
                current = section.key;
            }
        }

        if (current !== activeSectionRef.current) {
            activeSectionRef.current = current;
            setActiveSection(current);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (programmaticScrollTimeout.current) {
                clearTimeout(programmaticScrollTimeout.current);
            }
        };
    }, []);

    const carouselHeight = HERO_IMAGE_HEIGHT;

    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
    const [isZoomVisible, setZoomVisible] = useState(false);
    const [data, setData] = useState([]);
    const [profileDetails, setProfileDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [educationalDetails, setEducationalDetails] = useState(null);
    const [currentPlanId, setCurrentPlanId] = useState(null);
    const allowedPremiumIds = [1, 2, 3, 10, 11, 13, 14, 15, 16, 17];
    const [selectedPdfLanguage, setSelectedPdfLanguage] = useState("english");
    const [showLanguagePopup, setShowLanguagePopup] = useState(false);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);

    const handleAddOnPackagePress = () => {
        if (profileDetails?.package_name === "Free" || "Unapproved") {
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
            if (result.Status === 1) {
                const images = result.data.map((image) => ({
                    id: image.id,
                    url: `${image.image}`,
                    uploaded_at: image.uploaded_at,
                }));
                setData(images);
            }
        } catch (error) {
            console.error('Error fetching images:', error);
        } finally {
            setPageLoading(false);
        }
    };

    const handleImageUpload = (id) => {
        Alert.alert(
            'Select Option',
            'Would you like to upload a new image or remove the current one?',
            [
                { text: 'Upload Image', onPress: () => uploadImage(id) },
                { text: 'Remove Image', onPress: () => removeImage(id) },
                { text: 'Cancel', style: 'cancel' },
            ],
            { cancelable: true }
        );
    };

    const uploadImage = async (id) => {
        // Request permission (if not already granted)
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.show({
                type: 'error',
                text1: 'Permission Denied',
                text2: 'We need camera roll permission to upload images.',
                position: 'top',
            });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false, // set to true if you want cropping
            quality: 1,
        });

        if (result.canceled) {
            return; // user cancelled
        }

        if (result.assets && result.assets[0]) {
            const file = result.assets[0];
            const profileId = await AsyncStorage.getItem('loginuser_profileId');
            if (!profileId) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Profile ID not found',
                    position: 'top',
                });
                return;
            }

            const formData = new FormData();
            formData.append('profile_id', profileId);

            // The file object from expo-image-picker has: uri, type, fileName
            const imageFile = {
                uri: file.uri,
                type: file.mimeType || 'image/jpeg',   // ✅ was file.type (undefined on expo-image-picker)
                name: file.fileName || `image_${Date.now()}.jpg`,
            };

            if (id !== null) {
                formData.append('replace_image_ids', id.toString());
                formData.append('replace_image_files', imageFile);
            } else {
                formData.append('new_image_files', imageFile);
            }

            try {
                setLoading(true);
                await uploadImageToServer(formData);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: id ? 'Image replaced successfully' : 'Image uploaded successfully',
                    position: 'top',
                });
                await fetchAndSetImages();
            } catch (error) {
                if (error.message && error.message !== '__SILENT__') {
                    Toast.show({
                        type: 'error',
                        text1: 'Upload Error',
                        text2: error.message === '__SILENT__' ? 'Failed to upload image. Check your network or server.' : error.message,
                        position: 'top',
                    });
                }
            } finally {
                setLoading(false);
            }
        } else {
            Toast.show({
                type: 'info',
                text1: 'No image selected',
                position: 'top',
            });
        }
    };

    const removeImage = async (id) => {
        try {
            setLoading(true);
            const profileId = await AsyncStorage.getItem("loginuser_profileId");
            if (!profileId) throw new Error('Profile ID not found');

            const formData = new FormData();
            formData.append('profile_id', profileId);
            formData.append('image_id', id.toString());

            const result = await removeProfileImage(formData);
            if (result.success) {
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: "Image removed successfully",
                    position: "top",
                });
            }
            await fetchAndSetImages();
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "Failed to remove image",
                position: "top",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchProfileAndPlanDetails = async () => {
            try {
                const result = await getMyProfilePersonal();
                await AsyncStorage.setItem("selectedPlanName", result.data.package_name || "Gold");
                setProfileDetails(result.data);

                const planIdStr = await AsyncStorage.getItem("current_plan_id");
                if (planIdStr) {
                    setCurrentPlanId(parseInt(planIdStr, 10));
                } else {
                    setCurrentPlanId(0);
                }
            } catch (error) {
                console.error('Error fetching profile details:', error);
            }
        };

        fetchProfileAndPlanDetails();
    }, []);

    // NOTE: floating add/edit pill removed from inside renderItem.
    // react-native-reanimated-carousel wraps each slide in a pan-gesture
    // handler which was intercepting the touch before it reached the
    // TouchableOpacity here, so the + / pencil buttons never fired.
    // The pill is now rendered as a sibling overlay in heroWrapper instead
    // (see below), which sits outside the carousel's gesture area.
    const renderItem = ({ item }) => (
        <View style={styles.itemContainer} key={item.id}>
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.imageWrapper}
                onPress={() => {
                    const idx = data.findIndex(d => d.id === item.id);
                    setSelectedSlideIndex(idx >= 0 ? idx : 0);
                    setZoomVisible(true);
                }}
            >
                <TopAlignedImage
                    uri={item.url || 'https://via.placeholder.com/150'}
                    width={SCREEN_WIDTH}
                    height={carouselHeight}
                    style={[styles.image, styles.curvedHeroImage]}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.55)']}
                    style={styles.heroBottomFade}
                    pointerEvents="none"
                />
            </TouchableOpacity>

            {/* <View style={styles.floatingActionPill} pointerEvents="box-none">
                <TouchableOpacity
                    style={styles.addIconCircle}
                    onPress={() => uploadImage(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleImageUpload(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="pencil" size={15} color="#A00014" />
                </TouchableOpacity>
            </View> */}
        </View>
    );


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
            const result = await viewHoroscopePdf(encryptedId, selectedPdfLanguage);

            if (result && typeof result === 'object' && result.status === 'failure') {
                Alert.alert("Error", result.message || "Failed to fetch horoscope");
                return;
            }

            if (typeof result === 'string' && result.length > 0) {
                // await openCachedPdf(result);
                // Toast.show({
                //     type: 'success',
                //     text1: 'Success',
                //     text2: 'Profile opened successfully!',
                //     position: "top",
                // });
                setSelectedPdfUrl(result);
                setPdfModalVisible(true);
            } else {
                throw new Error('Unexpected result');
            }
        } catch (error) {
            Alert.alert("Error", "Failed to open the file.");
        } finally {
            setLoading(false);
        }
    };

    const fetchProfileData = async () => {
        try {
            const data = await getMyEducationalDetails();
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
        const placeOfStay = educationalDetails?.personal_work_district || educationalDetails?.personal_work_city_name;
        const education = educationalDetails?.persoanl_degree_name;
        const companyName = educationalDetails?.personal_company_name;
        const businessName = educationalDetails?.personal_business_name;
        let professionLine = '💼 *Profession:* Not available\n';

        if (profession) {
            const professionLower = profession.toLowerCase();
            if (professionLower === 'employed' && companyName) {
                professionLine = `💼 *Profession:* Employed at ${companyName}\n`;
            } else if (professionLower === 'business' && businessName) {
                professionLine = `💼 *Profession:* Business at ${businessName}\n`;
            } else if (professionLower === 'employed/business' && businessName) {
                professionLine = `💼 *Profession:* ${profession}-Employed at ${companyName}, Business at ${businessName}\n`;
            } else if (professionLower === 'goverment/ psu' && companyName) {
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
                    position: 'top',
                });
                return;
            }
            await Linking.openURL(whatsappUrl);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to share on WhatsApp',
                position: 'top',
            });
        } finally {
            setShareModalVisible(false);
        }
    };

    if (pageLoading) {
        return (
            <SafeAreaView style={styles.mainContainer}>
                <ShimmerLoader />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.mainContainer} edges={['left', 'right']}>
            <StatusBar backgroundColor="#FBF5ED" barStyle="dark-content" />

            <LinearGradient
                colors={[Colors.primaryGradientStart || "#A00014", Colors.primaryGradientEnd || "#4A000A"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.headerContainer}
            >
                <Pressable
                    style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={22} color={Colors.cardBackground} />
                </Pressable>
                <Text style={styles.headerText} numberOfLines={1}>My Profile</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            {/* STICKY OVERLAY TAB BAR */}
            {isTabSticky && (
                <View style={[styles.stickyTabBarWrapper, { top: HEADER_HEIGHT }]}>
                    <ProfileIconsBar
                        onSelectSection={scrollToProfileSection}
                        activeSection={activeSection}
                        sections={PROFILE_SECTIONS}
                    />
                </View>
            )}

            <Animated.ScrollView
                ref={scrollViewRef}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    {
                        useNativeDriver: false,
                        listener: (e) => {
                            const y = e.nativeEvent.contentOffset.y;
                            updateActiveSectionFromScroll(y);
                        },
                    }
                )}
                scrollEventThrottle={16}
                removeClippedSubviews={Platform.OS === 'android'}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* HERO CAROUSEL WITH BOTTOM CORNER CURVES */}
                <View style={styles.heroWrapper}>
                    {data.length > 0 ? (
                        <>
                            <Carousel
                                loop
                                width={SCREEN_WIDTH}
                                height={carouselHeight}
                                style={{
                                    width: SCREEN_WIDTH,
                                    height: carouselHeight,
                                    overflow: 'hidden',
                                }}
                                autoPlay={false}
                                data={data}
                                scrollAnimationDuration={600}
                                onSnapToItem={(index) => setActiveSlide(index)}
                                renderItem={renderItem}
                            />
                            <View style={styles.imageCounterBadge}>
                                <Text style={styles.imageCounterText}>
                                    {activeSlide + 1}/{data.length}
                                </Text>
                            </View>
                            <View style={styles.floatingActionPillOverlay} pointerEvents="box-none">
                                <TouchableOpacity
                                    style={styles.addIconCircle}
                                    onPress={() => uploadImage(null)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="add" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (data.length > 0) {
                                            // Use the first image's id (or current slide)
                                            const currentItem = data[activeSlide];
                                            if (currentItem) handleImageUpload(currentItem.id);
                                        }
                                    }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="pencil" size={15} color="#A00014" />
                                </TouchableOpacity>
                            </View>

                        </>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <TouchableOpacity
                                style={styles.uploadWrapper}
                                onPress={() => uploadImage(null)}
                            >
                                <View style={styles.noPhotoIconCircle}>
                                    <MaterialIcons name="add-photo-alternate" size={30} color={Colors.primary} />
                                </View>
                                <Text style={styles.uploadText}>Upload Image</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isZoomVisible && (
                        <Modal visible={isZoomVisible} transparent={true} onRequestClose={() => setZoomVisible(false)}>
                            <ImageViewer
                                imageUrls={data.map((item) => ({ url: item.url }))}
                                index={selectedSlideIndex}
                                onClick={() => setZoomVisible(false)}
                            />
                        </Modal>
                    )}
                </View>

                {/* PROFILE SUMMARY CARD */}
                {/* ── CARD 1 : Identity & Plan ── */}
                <View style={styles.summaryCard}>
                    {profileDetails ? (
                        <>
                            {/* ROW 1: Name + Share & Download icons */}
                           // In your JSX, change the nameIconFlex View:
                            <View style={styles.nameIconFlex}>
                                <Text style={styles.name} numberOfLines={1}>
                                    {profileDetails.personal_profile_name}
                                </Text>
                                {/* This spacer pushes icons to far right */}
                                <View style={{ flex: 1 }} />
                                <Pressable
                                    style={({ pressed }) => [styles.iconCircleBtn, pressed && styles.iconButtonPressed]}
                                    onPress={() => setShareModalVisible(true)}
                                >
                                    <Ionicons name="share-social" size={18} color={Colors.primary} />
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => [styles.iconCircleBtn, pressed && styles.iconButtonPressed]}
                                    onPress={handleDownloadPdf}
                                >
                                    <MaterialIcons name="download" size={18} color={Colors.primary} />
                                </Pressable>
                            </View>

                            {/* ROW 2: Mobile Verified badge + Profile ID on same line */}
                            <View style={styles.verifiedAndIdRow}>
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle-outline" size={14} color="#2E7D32" />
                                    <Text style={styles.verifiedText}>Mobile Verified</Text>
                                </View>
                                <View style={styles.profileCodeChip}>
                                    <Text style={styles.profileCodeText}>{profileDetails.profile_id}</Text>
                                </View>
                            </View>

                            {/* ROW 4: Plan badge + Valid Upto on same line */}
                            <View style={styles.planValidRow}>
                                <LinearGradient
                                    colors={
                                        profileDetails.package_name === 'Platinum'
                                            ? ['#DBAF4B', '#DBAF4B', '#DBAF4B']
                                            : profileDetails.package_name === 'Diamond'
                                                ? ['#DBAF4B', '#DBAF4B', '#DBAF4B']
                                                : ['#DBAF4B', '#DBAF4B', '#DBAF4B']
                                    }
                                    locations={[0, 0.5, 1]}
                                    start={{ x: 1, y: 1 }}
                                    end={{ x: 0, y: 0 }}
                                    style={styles.planBadge}
                                >
                                    <MaterialCommunityIcons
                                        name="crown-outline"
                                        size={12}
                                        color={Colors.card}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={[
                                        styles.planBadgeText,
                                        profileDetails.package_name === 'Diamond' && { color: '#1E293B' }
                                    ]}>
                                        {profileDetails.package_name}
                                    </Text>
                                </LinearGradient>

                                {profileDetails.valid_upto &&
                                    profileDetails.package_name !== 'Free' &&
                                    profileDetails.package_name !== 'Unapproved' && (
                                        <Text style={styles.validUptoText}>
                                            Valid Upto : {profileDetails.valid_upto}
                                        </Text>
                                    )}
                            </View>

                            {/* ROW 5: Upgrade / Renew / Add on packages */}
                            {profileDetails.package_name === 'Free' || profileDetails.package_name === 'Unapproved' ? (
                                <TouchableOpacity
                                    style={styles.renewButtonWrapper}
                                    onPress={() => navigation.navigate('MembershipPlan')}
                                >
                                    <LinearGradient colors={[Colors.primary, Colors.primary]} style={styles.renewButton}>
                                        <Text style={styles.renewButtonText}>Upgrade</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : profileDetails.valid_upto &&
                                new Date(profileDetails.valid_upto) < new Date() &&
                                allowedPremiumIds.includes(currentPlanId) ? (
                                <TouchableOpacity
                                    style={styles.renewButtonWrapper}
                                    onPress={() => navigation.navigate('PayNow')}
                                >
                                    <LinearGradient colors={[Colors.primary, Colors.primary]} style={styles.renewButton}>
                                        <Text style={styles.renewButtonText}>Renew</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.completeTextFlex}
                                    onPress={handleAddOnPackagePress}
                                >
                                    <Text style={styles.completeText}>Add on packages</Text>
                                    <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <View style={{ paddingVertical: 10 }}>
                            <View style={[styles.shimmerBar, { width: '60%', height: 22, marginBottom: 8 }]} />
                            <View style={[styles.shimmerBar, { width: '35%', height: 16, marginBottom: 12 }]} />
                            <View style={[styles.shimmerBar, { width: '80%', height: 16, marginBottom: 8 }]} />
                            <View style={[styles.shimmerBar, { width: '70%', height: 16 }]} />
                        </View>
                    )}
                </View>

                {/* ── CARD 2 : Age / Height / Star + Profession / Education ── */}
                {profileDetails && (
                    <View style={styles.infoCard}>
                        <InfoPillRow
                            items={[
                                {
                                    label: 'age',
                                    value: profileDetails.personal_age ? `${profileDetails.personal_age} Yrs` : null,
                                    icon: <MaterialCommunityIcons name="cake-variant-outline" size={14} color={Colors.primary} />,
                                },
                                {
                                    label: 'height',
                                    value: profileDetails.personal_profile_height?.height_desc,
                                    icon: <MaterialCommunityIcons name="human-male-height" size={14} color={Colors.primary} />,
                                },
                                {
                                    label: 'star',
                                    value: profileDetails.star,
                                    icon: <MaterialCommunityIcons name="star-four-points-outline" size={14} color={Colors.primary} />,
                                },
                            ]}
                        />

                        <View style={styles.factsGrid}>
                            <View style={styles.factCardFull}>
                                <View style={styles.factIconBg}>
                                    <FontAwesome5 name="briefcase" size={14} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.factLabel}>Profession</Text>
                                    <Text style={styles.factValue} numberOfLines={1}>
                                        {profileDetails.prosession || 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.factCardFull}>
                                <View style={styles.factIconBg}>
                                    <MaterialCommunityIcons name="school-outline" size={16} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.factLabel}>Education</Text>
                                    <Text style={styles.factValue} numberOfLines={1}>
                                        {profileDetails.heightest_education || 'N/A'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
                {/* HORIZONTAL INLINE MENU BAR */}
                <View
                    ref={tabBarRef}
                    onLayout={(e) => {
                        tabBarOffset.current = e.nativeEvent.layout.y;
                    }}
                    style={styles.stickyNavWrapper}
                >
                    <View style={{ opacity: isTabSticky ? 0 : 1 }}>
                        <ProfileIconsBar
                            onSelectSection={scrollToProfileSection}
                            activeSection={activeSection}
                            sections={PROFILE_SECTIONS}
                        />
                    </View>
                </View>

                {/* EDITABLE PROFILE SECTIONS BODY */}
                <View style={styles.sectionsBody}>
                    <ProfileSectionsContent sectionOffsetsRef={sectionOffsetsRef} setLoading={setLoading} />
                </View>
            </Animated.ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={shareModalVisible}
                onRequestClose={() => setShareModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.shareModalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={{ fontSize: fs(18), fontWeight: '700', color: Colors.textDark, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>Share Profile</Text>
                            <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.textDark} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.shareOptionBtn}
                            onPress={() => handleWhatsAppShare(true)}
                        >
                            <Ionicons name="image" size={22} color={Colors.primary} />
                            <Text style={styles.shareOptionText}>Share with Image</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.shareOptionBtn}
                            onPress={() => handleWhatsAppShare(false)}
                        >
                            <Ionicons name="document-text" size={22} color={Colors.primary} />
                            <Text style={styles.shareOptionText}>Share without Image</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showLanguagePopup}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLanguagePopup(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.languageModalCard}>
                        <TouchableOpacity
                            style={{ alignSelf: 'flex-end' }}
                            onPress={() => setShowLanguagePopup(false)}
                        >
                            <Ionicons name="close" size={24} color={Colors.textDark} />
                        </TouchableOpacity>

                        <Text style={{ fontSize: fs(18), fontWeight: '700', textAlign: 'center', marginBottom: 20, color: Colors.textDark, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                            Select Language
                        </Text>

                        <View style={{ marginBottom: 20 }}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}
                                onPress={() => setSelectedPdfLanguage("english")}
                            >
                                <MaterialIcons
                                    name={selectedPdfLanguage === "english" ? "radio-button-checked" : "radio-button-unchecked"}
                                    size={24} color={Colors.primary}
                                />
                                <Text style={{ fontSize: fs(16), marginLeft: 10, color: Colors.textDark }}>English</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => setSelectedPdfLanguage("tamil")}
                            >
                                <MaterialIcons
                                    name={selectedPdfLanguage === "tamil" ? "radio-button-checked" : "radio-button-unchecked"}
                                    size={24} color={Colors.primary}
                                />
                                <Text style={{ fontSize: fs(16), marginLeft: 10, color: Colors.textDark }}>Tamil</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.submitBtnRed}
                            onPress={handlePdfSubmit}
                        >
                            <Text style={styles.submitBtnText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <InAppPdfModal
                visible={pdfModalVisible}
                pdfUrl={selectedPdfUrl}
                title="Horoscope PDF"
                profileId={profileDetails?.profile_id || ''}
                onClose={() => {
                    setPdfModalVisible(false);
                    setSelectedPdfUrl(null);
                }}
            />
            <BottomTabBarComponent />

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.selectedBg,
    },
    headerContainer: {
        position: 'relative',
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.selectedBg,
        zIndex: 25,
        elevation: 6,
        paddingTop: Platform.OS === 'ios' ? 10 : 25,
        height: HEADER_HEIGHT,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    headerIconBtnPressed: {
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
    iconButtonPressed: {
        opacity: 0.6,
    },
    heroWrapper: {
        zIndex: 1,
        borderBottomLeftRadius: HERO_RADIUS,
        borderBottomRightRadius: HERO_RADIUS,
        overflow: 'hidden',
    },
    heroBottomFade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 90,
    },
    headerText: {
        color: Colors.cardBackground,
        fontSize: fs(18),
        fontWeight: "700",
        flex: 1,
        textAlign: "left",
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        lineSpacing: -1,
    },
    summaryCard: {
        marginTop: -18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingRight: 20,        // ← extra right breathing room
        backgroundColor: Colors.cardBackground,
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 14,
        marginLeft: 12,
        marginRight: 12,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        zIndex: 999,
    },
    name: {
        color: Colors.textDark,
        fontSize: fs(19),        // was 20 — slightly smaller to fit row
        fontWeight: '700',
        flexShrink: 1,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        letterSpacing: -1,
    },
    nameIconFlex: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 2,
        gap: 6,
        flexWrap: 'nowrap',
    },
    verificationIcon: {
        marginLeft: -4,
    },
    actionButton: {
        marginLeft: 'auto',
    },
    profileCodeChip: {
        alignSelf: 'flex-start',
        backgroundColor: '#FEF7E6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 0,   // was 12
        marginTop: 0,      // was 4
    },
    profileCodeText: {
        fontSize: fs(13),
        fontWeight: "700",
        color: Colors.matchingcirclecolor,
        letterSpacing: 0.3,
    },
    planFlex: {
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        alignSelf: "flex-start",
        width: "100%",
    },
    planNameRow: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
    },
    goldLinearGradient: {
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        minWidth: 90,
    },
    goldText: {
        color: Colors.onPrimaryContainer,
        fontSize: fs(14),
        fontWeight: "700",
    },
    diamondText: {
        backgroundColor: '#1E293B',
    },
    date: {
        fontSize: fs(13),
        fontWeight: "700",
        color: Colors.textMuted,
    },
    pillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.snapshotbg,
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginTop: 4,
    },
    pillItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pillText: {
        fontSize: fs(13.5),
        fontWeight: '700',
        color: Colors.textDark,
        marginLeft: 4,
    },
    pillDivider: {
        width: 1,
        height: 14,
        backgroundColor: Colors.border,
        marginHorizontal: 12,
    },
    factsGrid: {
        marginTop: 12,
        gap: 8,
    },
    factCardFull: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.snapshotbg,
        padding: 10,
        borderRadius: 25,
        gap: 8,
    },
    factIconBg: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
    },
    factLabel: {
        fontSize: 10,
        color: Colors.textMuted,
    },
    factValue: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.textDark,
        marginTop: 1,
    },
    completeTextFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginVertical: 10,
        marginLeft: 3,
    },
    completeText: {
        color: Colors.primary,
        fontSize: fs(14),
        fontWeight: "600",
        marginRight: 4,
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
        borderBottomLeftRadius: HERO_RADIUS,
        borderBottomRightRadius: HERO_RADIUS,
    },
    imageCounterBadge: {
        position: 'absolute',
        bottom: 28,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 10,
    },
    imageCounterText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    floatingActionPill: {
        position: 'absolute',
        bottom: 22,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 24,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 12,
        zIndex: 999,
        elevation: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    addIconCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#A00014',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        position: 'relative',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: HERO_RADIUS,
        borderBottomRightRadius: HERO_RADIUS,
        overflow: 'hidden',
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
        borderBottomLeftRadius: HERO_RADIUS,
        borderBottomRightRadius: HERO_RADIUS,
        overflow: 'hidden',
    },
    curvedHeroImage: {
        borderBottomLeftRadius: HERO_RADIUS,
        borderBottomRightRadius: HERO_RADIUS,
    },
    renewButtonWrapper: {
        alignSelf: 'flex-start',
        marginBottom: 10,
        marginTop: 4,
    },
    renewButton: {
        borderRadius: 20,
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
    },
    emptyContainer: {
        height: HERO_IMAGE_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface1,
    },
    uploadWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noPhotoIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    uploadText: {
        marginTop: 4,
        fontSize: fs(15),
        color: Colors.textMuted,
        fontWeight: '600',
    },
    shimmerContainer: {
        flex: 1,
        backgroundColor: Colors.selectedBg,
    },
    shimmerHero: {
        width: '100%',
        height: HERO_IMAGE_HEIGHT,
        backgroundColor: '#E0E0E0',
    },
    shimmerCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 18,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
    },
    shimmerCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E0E0E0',
    },
    shimmerBar: {
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareModalCard: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 18,
        padding: 20,
        width: '85%',
        alignItems: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    shareOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 14,
        marginVertical: 6,
        width: '100%',
        gap: 12,
    },
    shareOptionText: {
        fontSize: fs(15),
        color: Colors.textDark,
        fontWeight: '500',
    },
    languageModalCard: {
        backgroundColor: Colors.cardBackground,
        width: '85%',
        borderRadius: 18,
        padding: 20,
    },
    submitBtnRed: {
        backgroundColor: Colors.primary,
        borderRadius: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    stickyNavWrapper: {
        backgroundColor: Colors.selectedBg,
        zIndex: 100,
        elevation: 8,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    stickyTabBarWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 500,
        backgroundColor: Colors.selectedBg,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 6,
    },
    sectionsBody: {
        backgroundColor: Colors.selectedBg,
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 12,
    },
    floatingActionPillOverlay: {
        position: 'absolute',
        bottom: 22,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 24,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 12,
        zIndex: 999,
        elevation: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    // ── NEW styles for updated summary card layout ──
    iconCircleBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F6EFE5',
        justifyContent: 'center',
        alignItems: 'center',
        // remove marginLeft: 8 — gap handles spacing now
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#81C784',
        borderRadius: 18,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 2,
        marginBottom: 2,
        gap: 5,
        backgroundColor: '#F1F8F1',
    },
    verifiedText: {
        fontSize: fs(12),
        color: '#2E7D32',
        fontWeight: '600',
    },
    planValidRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 2,
        gap: 12,
    },
    planBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    planBadgeText: {
        color: '#FFFFFF',
        fontSize: fs(13),
        fontWeight: '700',
    },
    validUptoText: {
        fontSize: fs(13),
        fontWeight: '500',
        color: Colors.textMuted,
    },
    infoCard: {
        marginHorizontal: 12,       // left & right space — matches summaryCard
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.cardBackground,
        marginTop: 8,
        marginBottom: 3,
        borderRadius: 14,           // same reduced radius
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    verifiedAndIdRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
        marginBottom: 4,
    },
});