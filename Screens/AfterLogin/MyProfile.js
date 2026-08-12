import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Pressable,
    Dimensions,
    Modal,
    Alert,
    ActivityIndicator,
    Linking,
    Animated,
    Platform,
    SafeAreaView,
    Easing,
    ScrollView,
} from "react-native";
import {
    Ionicons,
    MaterialIcons,
    MaterialCommunityIcons,
    FontAwesome5,
} from "@expo/vector-icons";
import Carousel from 'react-native-reanimated-carousel';
import ImageViewer from 'react-native-image-zoom-viewer';
import { launchImageLibrary } from 'react-native-image-picker';
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { ProfileIconsBar, ProfileSectionsContent } from '../../Components/MenuTab/ProfileDetailsEdit';
import { uploadImageToServer, removeProfileImage, fetchImages, downloadPdfmyprofile, getMyProfilePersonal } from '../../CommonApiCall/CommonApiCall';
import config from '../../API/Apiurl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";
import { getMyEducationalDetails } from '../../CommonApiCall/CommonApiCall';
import { TopAlignedImage } from '../../Components/ReuseImageAlign/TopAlignedImage';
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";
import { Colors } from "../../Reusable/Theme";

// Responsive helpers
const { width: SCREEN_WIDTH, height: SCREEN_H } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const fs = (size) => isTablet ? Math.round(size * 1.3) : size;
const verticalScale = (size) => (SCREEN_H / 812) * size;

// Layout Constants — matches ProfileDetails hero sizing logic
const HERO_IMAGE_HEIGHT = Math.max(340, Math.min(460, verticalScale(420)));
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const COMPACT_HEADER_HEIGHT = 64;
const NAV_BAR_HEIGHT = 50;
const TOTAL_STICKY_TOP = HEADER_HEIGHT;
const COLLAPSE_DISTANCE = HERO_IMAGE_HEIGHT - COMPACT_HEADER_HEIGHT;

// Section metadata used for sticky quick-nav
const PROFILE_SECTIONS = [
    { key: 'personal', label: 'Personal', icon: 'account', lib: 'MCI' },
    { key: 'education', label: 'Education', icon: 'school', lib: 'MCI' },
    { key: 'profession', label: 'Profession', icon: 'briefcase', lib: 'FA5' },
    { key: 'family', label: 'Family', icon: 'account-group', lib: 'MCI' },
    { key: 'horoscope', label: 'Horoscope', icon: 'star-four-points', lib: 'MCI' },
    { key: 'contact', label: 'Contact', icon: 'phone', lib: 'MCI' },
];

// Shimmer Loader for smooth initial page skeleton state
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
            <View style={styles.shimmerCard}>
                <Animated.View style={[styles.shimmerBar, { opacity, width: '50%', height: 20, marginBottom: 12 }]} />
                <Animated.View style={[styles.shimmerBar, { opacity, width: '100%', height: 45, marginBottom: 10 }]} />
                <Animated.View style={[styles.shimmerBar, { opacity, width: '100%', height: 45, marginBottom: 10 }]} />
            </View>
        </View>
    );
};

// Presentational helper for pill indicators — restyled to match ProfileDetails statusChip look
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
    const dotsScrollViewRef = useRef(null);

    const sectionOffsetsRef = useRef({
        iconBarTop: 0,
        personal: 0,
        education: 0,
        profession: 0,
        family: 0,
        horoscope: 0,
        contact: 0,
    });

    const [activeSection, setActiveSection] = useState('personal');
    const activeSectionRef = useRef('personal');
    const scrollContainerYRef = useRef(0);

    const scrollToProfileSection = (key) => {
        const offsets = sectionOffsetsRef.current;
        const targetOffset = (offsets.iconBarTop || 0) + (offsets[key] || 0);
        const adjustedY = Math.max(0, targetOffset - (HEADER_HEIGHT + COMPACT_HEADER_HEIGHT));

        scrollViewRef.current?.scrollTo({ y: adjustedY, animated: true });
        setActiveSection(key);
        activeSectionRef.current = key;
    };

    const updateActiveSectionFromScroll = useCallback((offsetY) => {
        const offsets = sectionOffsetsRef.current;
        const base = offsets.iconBarTop || 0;
        let current = PROFILE_SECTIONS[0].key;

        for (const section of PROFILE_SECTIONS) {
            const sectionY = base + (offsets[section.key] || 0);
            if (offsetY + HEADER_HEIGHT + COMPACT_HEADER_HEIGHT + NAV_BAR_HEIGHT >= sectionY) {
                current = section.key;
            }
        }

        if (current !== activeSectionRef.current) {
            activeSectionRef.current = current;
            setActiveSection(current);
        }
    }, []);

    const [isBookmarked, setIsBookmarked] = useState(false);
    const handleSavePress = () => setIsBookmarked(!isBookmarked);

    const screenWidth = Dimensions.get('window').width;
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

    const navPaddingTop = scrollY.interpolate({
        inputRange: [0, COLLAPSE_DISTANCE],
        outputRange: [0, 60],
        extrapolate: 'clamp',
    });

    const handleAddOnPackagePress = () => {
        if (profileDetails?.package_name === "Free") {
            navigation.navigate('MembershipPlan');
        } else {
            navigation.navigate('PayNow', { isAddOnOnly: true });
        }
    };

    useEffect(() => {
        fetchAndSetImages();
    }, []);

    useEffect(() => {
        if (dotsScrollViewRef.current && data.length > 1) {
            const dotWidth = 16;
            dotsScrollViewRef.current.scrollTo({
                x: Math.max(0, activeSlide * dotWidth - 50),
                animated: true,
            });
        }
    }, [activeSlide, data.length]);

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
        launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
        }, async (response) => {
            if (response.didCancel || response.error) return;

            if (response.assets && response.assets[0]) {
                const file = response.assets[0];
                const profileId = await AsyncStorage.getItem("loginuser_profileId");

                if (!profileId) {
                    Toast.show({
                        type: "error",
                        text1: "Error",
                        text2: "Profile ID not found",
                        position: "top",
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
                    await uploadImageToServer(formData);
                    Toast.show({
                        type: "success",
                        text1: "Success",
                        text2: id ? "Image replaced successfully" : "Image uploaded successfully",
                        position: "top",
                    });
                    await fetchAndSetImages();
                } catch (error) {
                    if (error.message && error.message !== '__SILENT__') {
                        Toast.show({
                            type: "error",
                            text1: "Upload Error",
                            text2: error.message || "Failed to upload image",
                            position: "top",
                        });
                    }
                } finally {
                    setLoading(false);
                }
            }
        });
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
                    width={screenWidth}
                    height={carouselHeight}
                    style={styles.image}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.55)']}
                    style={styles.heroBottomFade}
                    pointerEvents="none"
                />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
                <TouchableOpacity style={styles.addIconWrapper} onPress={() => handleAddNewImage()}>
                    <MaterialIcons name="add-circle" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleImageUpload(item.id)}>
                    <MaterialIcons name="edit" size={24} color={Colors.primary} style={styles.editIcon} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const handleAddNewImage = () => uploadImage(null);

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
            if (result && result.status === 'failure') {
                Alert.alert("Error", result.message || "Failed to generate PDF");
            } else if (result) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Horoscope downloaded successfully',
                    position: "top",
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

    const heroTranslateY = scrollY.interpolate({
        inputRange: [0, COLLAPSE_DISTANCE],
        outputRange: [0, -COLLAPSE_DISTANCE],
        extrapolate: 'clamp',
    });
    const heroOpacity = scrollY.interpolate({
        inputRange: [0, COLLAPSE_DISTANCE * 0.6, COLLAPSE_DISTANCE],
        outputRange: [1, 0.4, 0],
        extrapolate: 'clamp',
    });
    const compactBarOpacity = scrollY.interpolate({
        inputRange: [COLLAPSE_DISTANCE * 0.5, COLLAPSE_DISTANCE],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });
    const compactBarTranslateY = scrollY.interpolate({
        inputRange: [COLLAPSE_DISTANCE * 0.5, COLLAPSE_DISTANCE],
        outputRange: [-16, 0],
        extrapolate: 'clamp',
    });

    const primaryImageUri = data.length > 0 ? (data[0]?.url || 'https://via.placeholder.com/150') : null;

    if (pageLoading) {
        return (
            <SafeAreaView style={styles.mainContainer}>
                <ShimmerLoader />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.headerContainer}>
                <Pressable
                    style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={22} color={Colors.textDark} />
                </Pressable>
                <Text style={styles.headerText} numberOfLines={1}>My Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <Animated.View
                pointerEvents={"box-none"}
                style={[
                    styles.compactProfileBar,
                    {
                        opacity: compactBarOpacity,
                        transform: [{ translateY: compactBarTranslateY }],
                    },
                ]}
            >
                <Image
                    source={{ uri: primaryImageUri || 'https://via.placeholder.com/150' }}
                    style={styles.compactAvatar}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.compactName} numberOfLines={1}>
                            {profileDetails?.personal_profile_name || ''}
                        </Text>
                        <Ionicons name="shield-checkmark" size={14} color={Colors.success} style={{ marginLeft: 6 }} />
                    </View>
                    <Text style={styles.compactSub} numberOfLines={1}>
                        {profileDetails?.profile_id} {profileDetails?.personal_age ? `• ${profileDetails.personal_age} yrs` : ''}
                    </Text>
                </View>
                <Pressable onPress={() => setShareModalVisible(true)} style={({ pressed }) => [styles.compactActionBtn, pressed && styles.iconButtonPressed]}>
                    <Ionicons name="share-social" size={18} color={Colors.primary} />
                </Pressable>
                <Pressable onPress={handleDownloadPdf} style={({ pressed }) => [styles.compactActionBtn, pressed && styles.iconButtonPressed]}>
                    <Ionicons name="print" size={18} color={Colors.primary} />
                </Pressable>
            </Animated.View>

            <Animated.ScrollView
                ref={scrollViewRef}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    {
                        useNativeDriver: false,
                        listener: (e) => {
                            const y = e.nativeEvent.contentOffset.y;
                            scrollContainerYRef.current = y;
                            updateActiveSectionFromScroll(y);
                        },
                    }
                )}
                scrollEventThrottle={16}
                removeClippedSubviews={Platform.OS === 'android'}
                contentContainerStyle={{ paddingBottom: 30 }}
                stickyHeaderIndices={[1]}
            >
                <View style={{ backgroundColor: Colors.selectedBg }}>
                    <Animated.View
                        style={[
                            styles.heroWrapper,
                            { transform: [{ translateY: heroTranslateY }] },
                        ]}
                    >
                        <Animated.View style={{ opacity: heroOpacity }}>
                            <View style={{ width: '100%', position: 'relative' }}>
                                {data.length > 0 ? (
                                    <>
                                        <Carousel
                                            loop
                                            width={screenWidth}
                                            height={carouselHeight}
                                            style={{ width: screenWidth, height: carouselHeight }}
                                            autoPlay={false}
                                            data={data}
                                            scrollAnimationDuration={600}
                                            onSnapToItem={(index) => setActiveSlide(index)}
                                            renderItem={renderItem}
                                        />

                                        <View style={styles.paginationOuterWrapper}>
                                            <ScrollView
                                                ref={dotsScrollViewRef}
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                contentContainerStyle={styles.paginationScrollContent}
                                            >
                                                {data.map((_, i) => (
                                                    <View
                                                        key={`pagination-dot-${i}`}
                                                        style={[
                                                            styles.dot,
                                                            {
                                                                opacity: i === activeSlide ? 1 : 0.5,
                                                                transform: [{ scale: i === activeSlide ? 1.25 : 0.8 }],
                                                                backgroundColor: i === activeSlide ? Colors.primary : '#FFFFFF',
                                                            },
                                                        ]}
                                                    />
                                                ))}
                                            </ScrollView>
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
                        </Animated.View>
                    </Animated.View>

                    <View style={styles.summaryCard}>
                        {profileDetails ? (
                            <>
                                <View style={styles.nameIconFlex}>
                                    <Text style={styles.name} numberOfLines={1}>{profileDetails.personal_profile_name}</Text>
                                    <TouchableOpacity>
                                        <Ionicons
                                            name="shield-checkmark"
                                            size={18}
                                            color={Colors.success}
                                            style={styles.verificationIcon}
                                        />
                                    </TouchableOpacity>
                                    <Pressable
                                        style={({ pressed }) => [styles.actionButton, pressed && styles.iconButtonPressed]}
                                        onPress={() => setShareModalVisible(true)}
                                    >
                                        <Ionicons
                                            name="share-social"
                                            size={20}
                                            color={Colors.primary}
                                        />
                                    </Pressable>

                                    <Pressable
                                        style={({ pressed }) => [{ alignItems: 'center' }, pressed && styles.iconButtonPressed]}
                                        onPress={handleDownloadPdf}
                                    >
                                        <Ionicons name="print" size={20} color={Colors.primary} />
                                    </Pressable>
                                </View>

                                <View style={styles.profileCodeChip}>
                                    <Text style={styles.profileCodeText}>{profileDetails.profile_id}</Text>
                                </View>

                                <View style={styles.planFlex}>
                                    {profileDetails.valid_upto &&
                                        new Date(profileDetails.valid_upto) < new Date() &&
                                        allowedPremiumIds.includes(currentPlanId) ? (
                                        <TouchableOpacity
                                            style={styles.renewButtonWrapper}
                                            onPress={() => navigation.navigate('PayNow')}
                                        >
                                            <LinearGradient
                                                colors={[Colors.primary, Colors.primary]}
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
                                            Valid Upto : {profileDetails.valid_upto}
                                        </Text>
                                    )}
                                </View>

                                <Pressable
                                    style={styles.completeTextFlex}
                                    onPress={handleAddOnPackagePress}
                                >
                                    <Text style={styles.completeText}>Add on packages</Text>
                                    <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                                </Pressable>

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
                                            <Text style={styles.factValue} numberOfLines={1}>{profileDetails.prosession || '—'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.factCardFull}>
                                        <View style={styles.factIconBg}>
                                            <MaterialCommunityIcons name="school-outline" size={16} color={Colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.factLabel}>Education</Text>
                                            <Text style={styles.factValue} numberOfLines={1}>{profileDetails.heightest_education || '—'}</Text>
                                        </View>
                                    </View>
                                </View>
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
                </View>

                <Animated.View
                    style={[
                        styles.stickyNavWrapper,
                        { paddingTop: navPaddingTop }
                    ]}
                    onLayout={(e) => {
                        sectionOffsetsRef.current.iconBarTop = e.nativeEvent.layout.y;
                    }}
                >
                    <ProfileIconsBar
                        onSelectSection={scrollToProfileSection}
                        activeSection={activeSection}
                        sections={PROFILE_SECTIONS}
                    />
                </Animated.View>

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
        paddingTop: 10,
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
    compactProfileBar: {
        position: 'absolute',
        top: HEADER_HEIGHT,
        left: 0,
        right: 0,
        zIndex: 20,
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        height: COMPACT_HEADER_HEIGHT,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
    },
    compactAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.chipInactiveBg,
        borderWidth: 1.5,
        borderColor: Colors.primaryContainer,
    },
    compactName: {
        color: Colors.textDark,
        fontSize: fs(15),
        fontWeight: '800',
    },
    compactSub: {
        color: Colors.textMuted,
        fontSize: fs(12),
        marginTop: 2,
        fontWeight: '500',
    },
    compactActionBtn: {
        marginLeft: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.iconContainerBg,
    },
    heroWrapper: {
        zIndex: 1,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
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
        color: Colors.textDark,
        fontSize: fs(18),
        fontWeight: "700",
        flex: 1,
        textAlign: "center",
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    summaryCard: {
        width: "100%",
        marginTop: -18,
        paddingHorizontal: 16,
        paddingVertical: 18,
        backgroundColor: Colors.cardBackground,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
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
        fontSize: fs(21),
        fontWeight: "700",
        flexShrink: 1,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    nameIconFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        width: "100%",
        paddingVertical: 4,
        gap: 12,
    },
    verificationIcon: {
        marginLeft: -4,
    },
    actionButton: {
        marginLeft: 'auto',
    },
    profileCodeChip: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.iconContainerBg,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 12,
        marginTop: 4,
    },
    profileCodeText: {
        fontSize: fs(13),
        fontWeight: "700",
        color: Colors.primary,
        letterSpacing: 0.3,
    },
    planFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        alignSelf: "flex-start",
    },
    goldLinearGradient: {
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        padding: 5,
        width: 100,
        marginRight: 10,
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
        marginTop: 14,
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
    },
    paginationOuterWrapper: {
        position: 'absolute',
        bottom: 25,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paginationScrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
        elevation: 2,
    },
    iconContainer: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(250, 246, 240, 0.92)',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    addIconWrapper: {
        padding: 2,
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
        backgroundColor: Colors.cardBackground,
        zIndex: 100,
        elevation: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        minHeight: NAV_BAR_HEIGHT,
        justifyContent: 'center',
    },
    sectionsBody: {
        backgroundColor: Colors.selectedBg,
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 12,
    },
});