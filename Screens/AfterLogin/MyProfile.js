// import React, { useState, useRef, useEffect } from 'react';
// import {
//     StyleSheet,
//     Text,
//     View,
//     Image,
//     TouchableOpacity,
//     Pressable,
//     Dimensions,
//     Modal,
//     Alert,
//     ActivityIndicator,
//     Linking,
//     Animated,
//     Platform,
//     SafeAreaView,
//     Easing,
// } from "react-native";
// import {
//     Ionicons,
//     MaterialIcons,
// } from "@expo/vector-icons";
// import Carousel from 'react-native-reanimated-carousel';
// import ImageViewer from 'react-native-image-zoom-viewer';
// import { launchImageLibrary } from 'react-native-image-picker';
// import { LinearGradient } from "expo-linear-gradient";
// import { useNavigation } from "@react-navigation/native";
// import { ProfileIconsBar, ProfileSectionsContent } from '../../Components/MenuTab/ProfileDetailsEdit';
// import { uploadImageToServer, removeProfileImage, fetchImages, downloadPdfmyprofile, getMyProfilePersonal } from '../../CommonApiCall/CommonApiCall';
// import config from '../../API/Apiurl';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Toast from "react-native-toast-message";
// import { getMyEducationalDetails } from '../../CommonApiCall/CommonApiCall';
// import { TopAlignedImage } from '../../Components/ReuseImageAlign/TopAlignedImage';

// // Responsive helpers
// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// const isTablet = SCREEN_WIDTH >= 768;
// const fs = (size) => isTablet ? Math.round(size * 1.3) : size;

// // Layout Constants
// const HERO_IMAGE_HEIGHT = isTablet ? 480 : 380;
// const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
// const COMPACT_HEADER_HEIGHT = 60;
// const COLLAPSE_DISTANCE = HERO_IMAGE_HEIGHT - COMPACT_HEADER_HEIGHT;

// // Shimmer Component for loading state
// const ShimmerLoader = () => {
//     const animatedValue = useRef(new Animated.Value(0)).current;

//     useEffect(() => {
//         Animated.loop(
//             Animated.sequence([
//                 Animated.timing(animatedValue, {
//                     toValue: 1,
//                     duration: 1000,
//                     easing: Easing.linear,
//                     useNativeDriver: true,
//                 }),
//                 Animated.timing(animatedValue, {
//                     toValue: 0,
//                     duration: 1000,
//                     easing: Easing.linear,
//                     useNativeDriver: true,
//                 })
//             ])
//         ).start();
//     }, [animatedValue]);

//     const opacity = animatedValue.interpolate({
//         inputRange: [0, 1],
//         outputRange: [0.3, 0.7],
//     });

//     return (
//         <View style={styles.shimmerContainer}>
//             <Animated.View style={[styles.shimmerHero, { opacity }]} />
//             <View style={styles.shimmerContent}>
//                 <Animated.View style={[styles.shimmerBar, { opacity, width: '60%', height: 24 }]} />
//                 <Animated.View style={[styles.shimmerBar, { opacity, width: '40%', height: 18, marginTop: 12 }]} />
//                 <Animated.View style={[styles.shimmerBar, { opacity, width: '80%', height: 16, marginTop: 12 }]} />
//                 <Animated.View style={[styles.shimmerBar, { opacity, width: '90%', height: 16, marginTop: 8 }]} />
//                 <Animated.View style={[styles.shimmerBar, { opacity, width: '70%', height: 16, marginTop: 8 }]} />
//             </View>
//         </View>
//     );
// };

// export const MyProfile = () => {
//     const navigation = useNavigation();
//     const scrollY = useRef(new Animated.Value(0)).current;
//     const scrollViewRef = useRef(null);

//     const sectionOffsetsRef = useRef({
//         iconBarTop: 0,
//         personal: 0,
//         education: 0,
//         family: 0,
//         horoscope: 0,
//         contact: 0,
//     });

//     const scrollToProfileSection = (key) => {
//         const offsets = sectionOffsetsRef.current;
//         const y = Math.max(0, (offsets.iconBarTop || 0) + (offsets[key] || 0) - 10);
//         scrollViewRef.current?.scrollTo({ y, animated: true });
//     };

//     const [isBookmarked, setIsBookmarked] = useState(false);
//     const handleSavePress = () => setIsBookmarked(!isBookmarked);

//     const screenWidth = Dimensions.get('window').width;
//     const carouselHeight = HERO_IMAGE_HEIGHT;

//     const [shareModalVisible, setShareModalVisible] = useState(false);
//     const [activeSlide, setActiveSlide] = useState(0);
//     const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
//     const [isZoomVisible, setZoomVisible] = useState(false);
//     const [data, setData] = useState([]);
//     const [profileDetails, setProfileDetails] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [pageLoading, setPageLoading] = useState(true);
//     const [educationalDetails, setEducationalDetails] = useState(null);
//     const [currentPlanId, setCurrentPlanId] = useState(null);
//     const allowedPremiumIds = [1, 2, 3, 10, 11, 13, 14, 15, 16, 17];
//     const [selectedPdfLanguage, setSelectedPdfLanguage] = useState("english");
//     const [showLanguagePopup, setShowLanguagePopup] = useState(false);

//     const handleAddOnPackagePress = () => {
//         if (profileDetails?.package_name === "Free") {
//             navigation.navigate('MembershipPlan');
//         } else {
//             navigation.navigate('PayNow', { isAddOnOnly: true });
//         }
//     };

//     useEffect(() => {
//         fetchAndSetImages();
//     }, []);

//     const fetchAndSetImages = async () => {
//         try {
//             const result = await fetchImages();
//             if (result.Status === 1) {
//                 const images = result.data.map((image) => ({
//                     id: image.id,
//                     url: `${image.image}`,
//                     uploaded_at: image.uploaded_at,
//                 }));
//                 setData(images);
//             }
//         } catch (error) {
//             console.error('Error fetching images:', error);
//         } finally {
//             setPageLoading(false);
//         }
//     };

//     const handleImageUpload = (id) => {
//         Alert.alert(
//             'Select Option',
//             'Would you like to upload a new image or remove the current one?',
//             [
//                 {
//                     text: 'Upload Image',
//                     onPress: () => uploadImage(id),
//                 },
//                 {
//                     text: 'Remove Image',
//                     onPress: () => removeImage(id),
//                 },
//                 {
//                     text: 'Cancel',
//                     style: 'cancel',
//                 },
//             ],
//             { cancelable: true }
//         );
//     };

//     const uploadImage = async (id) => {
//         launchImageLibrary({
//             mediaType: 'photo',
//             quality: 1,
//         }, async (response) => {
//             if (response.didCancel) {
//                 console.log('User cancelled image picker');
//                 return;
//             }

//             if (response.error) {
//                 console.log('ImagePicker Error: ', response.error);
//                 return;
//             }

//             if (response.assets && response.assets[0]) {
//                 const file = response.assets[0];
//                 const profileId = await AsyncStorage.getItem("loginuser_profileId");

//                 if (!profileId) {
//                     Toast.show({
//                         type: "error",
//                         text1: "Error",
//                         text2: "Profile ID not found",
//                         position: "bottom",
//                     });
//                     return;
//                 }

//                 const formData = new FormData();
//                 formData.append("profile_id", profileId);

//                 if (id !== null) {
//                     formData.append("replace_image_ids", id.toString());
//                     formData.append("replace_image_files", {
//                         uri: file.uri,
//                         type: file.type || 'image/jpeg',
//                         name: file.fileName || `image_${Date.now()}.jpg`,
//                     });
//                 } else {
//                     formData.append("new_image_files", {
//                         uri: file.uri,
//                         type: file.type || 'image/jpeg',
//                         name: file.fileName || `image_${Date.now()}.jpg`,
//                     });
//                 }

//                 try {
//                     setLoading(true);
//                     const response = await uploadImageToServer(formData);
//                     console.log("Image processed successfully:", response);

//                     Toast.show({
//                         type: "success",
//                         text1: "Success",
//                         text2: id ? "Image replaced successfully" : "Image uploaded successfully",
//                         position: "bottom",
//                     });

//                     await fetchAndSetImages();
//                 } catch (error) {
//                     console.error("Upload error:", error);
//                     if (error.message && error.message !== '__SILENT__') {
//                         Toast.show({
//                             type: "error",
//                             text1: "Upload Error",
//                             text2: error.message || "Failed to upload image",
//                             position: "bottom",
//                         });
//                     }
//                 } finally {
//                     setLoading(false);
//                 }
//             }
//         });
//     };

//     // Remove the selected image
//     const removeImage = async (id) => {
//         try {
//             setLoading(true);

//             const profileId = await AsyncStorage.getItem("loginuser_profileId");
//             if (!profileId) {
//                 throw new Error('Profile ID not found');
//             }

//             const formData = new FormData();
//             formData.append('profile_id', profileId);
//             formData.append('image_id', id.toString());

//             const result = await removeProfileImage(formData);

//             if (result.success) {
//                 Toast.show({
//                     type: "success",
//                     text1: "Success",
//                     text2: "Image removed successfully",
//                     position: "bottom",
//                 });
//             }
//             await fetchAndSetImages();
//         } catch (error) {
//             Toast.show({
//                 type: "error",
//                 text1: "Error",
//                 text2: error.message || "Failed to remove image",
//                 position: "bottom",
//             });
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         const fetchProfileAndPlanDetails = async () => {
//             try {
//                 const result = await getMyProfilePersonal();
//                 console.log("Profile Details fetched:", result);

//                 await AsyncStorage.setItem("selectedPlanName", result.data.package_name || "Gold");
//                 setProfileDetails(result.data);

//                 const planIdStr = await AsyncStorage.getItem("current_plan_id");
//                 if (planIdStr) {
//                     setCurrentPlanId(parseInt(planIdStr, 10));
//                 } else {
//                     setCurrentPlanId(0);
//                 }

//             } catch (error) {
//                 console.error('Error fetching profile details or plan ID:', error);
//             }
//         };

//         fetchProfileAndPlanDetails();
//     }, []);

//     const renderItem = ({ item }) => (
//         <View style={styles.itemContainer} key={item.id}>
//             <TouchableOpacity
//                 activeOpacity={0.9}
//                 style={styles.imageWrapper}
//                 onPress={() => {
//                     const idx = data.findIndex(d => d.id === item.id);
//                     setSelectedSlideIndex(idx >= 0 ? idx : 0);
//                     setZoomVisible(true);
//                 }}
//             >
//                 <TopAlignedImage
//                     uri={item.url || 'https://via.placeholder.com/150'}
//                     width={screenWidth}
//                     height={carouselHeight}
//                     style={styles.image}
//                 />
//             </TouchableOpacity>

//             <View style={styles.iconContainer}>
//                 {/* Plus icon for adding new image */}
//                 <TouchableOpacity
//                     style={styles.addIconWrapper}
//                     onPress={() => handleAddNewImage()}
//                 >
//                     <MaterialIcons
//                         name="add-circle"
//                         size={24}
//                         color="red"
//                     />
//                 </TouchableOpacity>

//                 {/* Edit icon for replacing current image */}
//                 <TouchableOpacity onPress={() => handleImageUpload(item.id)}>
//                     <MaterialIcons
//                         name="edit"
//                         size={24}
//                         color="red"
//                         style={styles.editIcon}
//                     />
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );

//     const handleAddNewImage = () => {
//         uploadImage(null);
//     };

//     const handleDownloadPdf = () => {
//         if (!profileDetails || !profileDetails.encrypted_profile_id) {
//             Alert.alert("Error", "Profile data is still loading...");
//             return;
//         }
//         setShowLanguagePopup(true);
//     };

//     const handlePdfSubmit = async () => {
//         setShowLanguagePopup(false);
//         setLoading(true);

//         try {
//             const encryptedId = profileDetails.encrypted_profile_id;
//             const result = await downloadPdfmyprofile(encryptedId, selectedPdfLanguage);
//             if (result && result.status === 'failure') {
//                 Alert.alert("Error", result.message || "Failed to generate PDF");
//             } else if (result) {
//                 Toast.show({
//                     type: 'success',
//                     text1: 'Success',
//                     text2: 'Horoscope downloaded successfully',
//                     position: "bottom",
//                 });
//             }
//         } catch (error) {
//             Alert.alert("Error", "Failed to download the file.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchProfileData = async () => {
//         try {
//             const data = await getMyEducationalDetails();
//             console.log("data educational details ===>", data);
//             setEducationalDetails(data.data);
//         } catch (error) {
//             console.error('Failed to load profile data', error);
//         }
//     };

//     useEffect(() => {
//         fetchProfileData();
//     }, []);

//     const handleWhatsAppShare = async (withImage = false) => {
//         const profileName = profileDetails?.personal_profile_name;
//         const profileId = profileDetails?.profile_id;
//         const encryptedProfileId = profileDetails?.encrypted_profile_id;
//         const age = profileDetails?.personal_age;
//         const starName = profileDetails?.star;
//         const registrationLink = 'vysyamala.com';
//         const profession = profileDetails?.prosession;
//         const annualIncome = educationalDetails?.personal_ann_inc_name;
//         const placeOfStay = educationalDetails?.personal_work_district || educationalDetails?.personal_work_city_name;
//         const education = educationalDetails?.persoanl_degree_name;
//         const companyName = educationalDetails?.personal_company_name;
//         const businessName = educationalDetails?.personal_business_name;
//         let professionLine = '💼 *Profession:* Not available\n';

//         if (profession) {
//             const professionLower = profession.toLowerCase();
//             if (professionLower === 'employed' && companyName) {
//                 professionLine = `💼 *Profession:* Employed at ${companyName}\n`;
//             } else if (professionLower === 'business' && businessName) {
//                 professionLine = `💼 *Profession:* Business at ${businessName}\n`;
//             } else if (professionLower === 'employed/business' && businessName) {
//                 professionLine = `💼 *Profession:* ${profession}-Employed at ${companyName}, Business at ${businessName}\n`;
//             } else if (professionLower === 'goverment/ psu' && companyName) {
//                 professionLine = `💼 *Profession:* Government/ PSU at ${companyName}\n`;
//             } else {
//                 professionLine = `💼 *Profession:* ${profession}\n`;
//             }
//         }

//         const shareUrl = withImage
//             ? `${config.apiUrl}/auth/profile/${encryptedProfileId}/`
//             : `${config.apiUrl}/auth/profile_view/${encryptedProfileId}/`;

//         const message =
//             `Check out this profile!\n\n` +
//             `🆔 *Profile ID:* ${profileId || 'Not available'}\n` +
//             `👤 *Profile Name:* ${profileName || 'Not available'}\n` +
//             `🎂 *Age:* ${age || 'Not available'} years\n` +
//             `✨ *Star Name:* ${starName || 'Not available'}\n` +
//             `💰 *Annual Income:* ${annualIncome || 'Not available'}\n` +
//             `🎓 *Education:* ${education || 'Not available'}\n` +
//             professionLine +
//             `📍 *Place of Stay:* ${placeOfStay || 'Not available'}\n\n` +
//             `🌟 *For More Details:* ${shareUrl}\n` +
//             `------------------------------------------- \n` +
//             `Click here to register your profile on Vysyamala :\n` +
//             `${registrationLink}`;

//         const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

//         try {
//             const supported = await Linking.canOpenURL(whatsappUrl);
//             if (!supported) {
//                 Toast.show({
//                     type: 'error',
//                     text1: 'Error',
//                     text2: 'WhatsApp is not installed',
//                     position: 'bottom',
//                 });
//                 return;
//             }
//             await Linking.openURL(whatsappUrl);
//         } catch (error) {
//             Toast.show({
//                 type: 'error',
//                 text1: 'Error',
//                 text2: 'Failed to share on WhatsApp',
//                 position: 'bottom',
//             });
//         } finally {
//             setShareModalVisible(false);
//         }
//     };

//     // Interpolations for Collapsing Header
//     const heroTranslateY = scrollY.interpolate({
//         inputRange: [0, COLLAPSE_DISTANCE],
//         outputRange: [0, -COLLAPSE_DISTANCE],
//         extrapolate: 'clamp',
//     });
//     const heroOpacity = scrollY.interpolate({
//         inputRange: [0, COLLAPSE_DISTANCE * 0.6, COLLAPSE_DISTANCE],
//         outputRange: [1, 0.4, 0],
//         extrapolate: 'clamp',
//     });
//     const compactBarOpacity = scrollY.interpolate({
//         inputRange: [COLLAPSE_DISTANCE * 0.5, COLLAPSE_DISTANCE],
//         outputRange: [0, 1],
//         extrapolate: 'clamp',
//     });
//     const compactBarTranslateY = scrollY.interpolate({
//         inputRange: [COLLAPSE_DISTANCE * 0.5, COLLAPSE_DISTANCE],
//         outputRange: [-16, 0],
//         extrapolate: 'clamp',
//     });

//     const headerBarOpacity = scrollY.interpolate({
//         inputRange: [0, 60, 100],
//         outputRange: [1, 0.3, 0],
//         extrapolate: 'clamp',
//     });
//     const headerBarTranslateY = scrollY.interpolate({
//         inputRange: [0, 100],
//         outputRange: [0, -HEADER_HEIGHT],
//         extrapolate: 'clamp',
//     });

//     const primaryImageUri = data.length > 0 ? (data[0]?.url || 'https://via.placeholder.com/150') : null;

//     if (pageLoading) {
//         return (
//             <SafeAreaView style={styles.mainContainer}>
//                 <ShimmerLoader />
//             </SafeAreaView>
//         );
//     }

//     return (
//         <SafeAreaView style={styles.mainContainer}>
//             {/* Top Fixed Header */}
//             <Animated.View
//                 style={[
//                     styles.headerContainer,
//                     {
//                         opacity: headerBarOpacity,
//                         transform: [{ translateY: headerBarTranslateY }],
//                     },
//                 ]}
//                 pointerEvents="box-none"
//             >
//                 <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
//                     <Ionicons name="arrow-back" size={24} color="#ED1E24" />
//                 </TouchableOpacity>
//                 <Text style={styles.headerText} numberOfLines={1}>My Profile</Text>
//                 <View style={{ width: 28 }} />
//             </Animated.View>

//             {/* Compact Sticky Profile Bar */}
//             <Animated.View
//                 pointerEvents={"box-none"}
//                 style={[
//                     styles.compactProfileBar,
//                     {
//                         opacity: compactBarOpacity,
//                         transform: [{ translateY: compactBarTranslateY }],
//                     },
//                 ]}
//             >
//                 <Image
//                     source={{ uri: primaryImageUri || 'https://via.placeholder.com/150' }}
//                     style={styles.compactAvatar}
//                 />
//                 <View style={{ flex: 1, marginLeft: 10 }}>
//                     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                         <Text style={styles.compactName} numberOfLines={1}>
//                             {profileDetails?.personal_profile_name || ''}
//                         </Text>
//                         <Ionicons name="shield-checkmark" size={14} color="#53C840" style={{ marginLeft: 6 }} />
//                     </View>
//                     <Text style={styles.compactSub} numberOfLines={1}>
//                         {profileDetails?.profile_id} {profileDetails?.personal_age ? `• ${profileDetails.personal_age} yrs` : ''}
//                     </Text>
//                 </View>
//                 <TouchableOpacity onPress={() => setShareModalVisible(true)} style={{ marginRight: 12 }}>
//                     <Ionicons name="share-social" size={20} color="#ED1E24" />
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={handleDownloadPdf}>
//                     <Ionicons name="print" size={20} color="#ED1E24" />
//                 </TouchableOpacity>
//             </Animated.View>

//             {/* Scrollable Body */}
//             <Animated.ScrollView
//                 ref={scrollViewRef}
//                 onScroll={Animated.event(
//                     [{ nativeEvent: { contentOffset: { y: scrollY } } }],
//                     { useNativeDriver: true }
//                 )}
//                 scrollEventThrottle={16}
//                 contentContainerStyle={{ paddingTop: HEADER_HEIGHT - 10, paddingBottom: 30 }}
//                 stickyHeaderIndices={[1]}
//             >
//                 {/* Section Index 0: Hero Carousel + Top Details */}
//                 <View style={{ backgroundColor: '#F4F4F4' }}>
//                     <Animated.View
//                         style={[
//                             styles.heroWrapper,
//                             { transform: [{ translateY: heroTranslateY }] },
//                         ]}
//                     >
//                         <Animated.View style={{ opacity: heroOpacity }}>
//                             <View style={{ width: '100%' }}>
//                                 {data.length > 0 ? (
//                                     <>
//                                         <Carousel
//                                             loop
//                                             width={screenWidth}
//                                             height={carouselHeight}
//                                             style={{ width: screenWidth, height: carouselHeight }}
//                                             autoPlay={false}
//                                             data={data}
//                                             scrollAnimationDuration={600}
//                                             onSnapToItem={(index) => setActiveSlide(index)}
//                                             renderItem={renderItem}
//                                         />

//                                         <View style={styles.paginationContainer}>
//                                             {data.map((_, i) => (
//                                                 <View
//                                                     key={`pagination-dot-${i}`}
//                                                     style={[
//                                                         styles.dot,
//                                                         {
//                                                             opacity: i === activeSlide ? 1 : 0.4,
//                                                             transform: [{ scale: i === activeSlide ? 1 : 0.6 }],
//                                                         },
//                                                     ]}
//                                                 />
//                                             ))}
//                                         </View>
//                                     </>
//                                 ) : (
//                                     <View style={styles.emptyContainer}>
//                                         <TouchableOpacity
//                                             style={styles.uploadWrapper}
//                                             onPress={() => uploadImage(null)}
//                                         >
//                                             <MaterialIcons name="add-photo-alternate" size={54} color="#888" />
//                                             <Text style={styles.uploadText}>Upload Image</Text>
//                                         </TouchableOpacity>
//                                     </View>
//                                 )}

//                                 {isZoomVisible && (
//                                     <Modal visible={isZoomVisible} transparent={true} onRequestClose={() => setZoomVisible(false)}>
//                                         <ImageViewer
//                                             imageUrls={data.map((item) => ({ url: item.url }))}
//                                             index={selectedSlideIndex}
//                                             onClick={() => setZoomVisible(false)}
//                                         />
//                                     </Modal>
//                                 )}
//                             </View>
//                         </Animated.View>
//                     </Animated.View>

//                     {/* Profile Summary Card */}
//                     <View style={styles.contentContainer}>
//                         {profileDetails ? (
//                             <>
//                                 <View style={styles.nameIconFlex}>
//                                     <Text style={styles.name}>{profileDetails.personal_profile_name}</Text>

//                                     <TouchableOpacity>
//                                         <Ionicons
//                                             name="shield-checkmark"
//                                             size={18}
//                                             color="#53c840"
//                                             style={styles.verificationIcon}
//                                         />
//                                     </TouchableOpacity>

//                                     <TouchableOpacity
//                                         style={styles.actionButton}
//                                         onPress={() => setShareModalVisible(true)}
//                                     >
//                                         <Ionicons
//                                             name="share-social"
//                                             size={20}
//                                             color="#ED1E24"
//                                         />
//                                     </TouchableOpacity>
//                                     <Modal
//                                         animationType="slide"
//                                         transparent={true}
//                                         visible={shareModalVisible}
//                                         onRequestClose={() => setShareModalVisible(false)}
//                                     >
//                                         <View style={{
//                                             flex: 1,
//                                             backgroundColor: 'rgba(0, 0, 0, 0.5)',
//                                             justifyContent: 'center',
//                                             alignItems: 'center'
//                                         }}>
//                                             <View style={{
//                                                 backgroundColor: 'white',
//                                                 borderRadius: 15,
//                                                 padding: 20,
//                                                 width: '80%',
//                                                 alignItems: 'center'
//                                             }}>
//                                                 <View style={{
//                                                     flexDirection: 'row',
//                                                     justifyContent: 'space-between',
//                                                     alignItems: 'center',
//                                                     width: '100%',
//                                                     marginBottom: 20
//                                                 }}>
//                                                     <Text style={{ fontSize: fs(18), fontWeight: 'bold', color: '#000' }}>Share Profile</Text>
//                                                     <TouchableOpacity onPress={() => setShareModalVisible(false)}>
//                                                         <Ionicons name="close" size={24} color="#000" />
//                                                     </TouchableOpacity>
//                                                 </View>
//                                                 <TouchableOpacity
//                                                     style={{
//                                                         flexDirection: 'row',
//                                                         alignItems: 'center',
//                                                         padding: 15,
//                                                         borderWidth: 1,
//                                                         borderColor: '#ddd',
//                                                         borderRadius: 10,
//                                                         marginVertical: 5,
//                                                         width: '100%'
//                                                     }}
//                                                     onPress={() => handleWhatsAppShare(true)}
//                                                 >
//                                                     <Ionicons name="image" size={24} color="#ED1E24" />
//                                                     <Text style={{ marginLeft: 15, fontSize: fs(16), color: '#000' }}>Share with Image</Text>
//                                                 </TouchableOpacity>

//                                                 <TouchableOpacity
//                                                     style={{
//                                                         flexDirection: 'row',
//                                                         alignItems: 'center',
//                                                         padding: 15,
//                                                         borderWidth: 1,
//                                                         borderColor: '#ddd',
//                                                         borderRadius: 10,
//                                                         marginVertical: 5,
//                                                         width: '100%'
//                                                     }}
//                                                     onPress={() => handleWhatsAppShare(false)}
//                                                 >
//                                                     <Ionicons name="document-text" size={24} color="#ED1E24" />
//                                                     <Text style={{ marginLeft: 15, fontSize: fs(16), color: '#000' }}>Share without Image</Text>
//                                                 </TouchableOpacity>
//                                             </View>
//                                         </View>
//                                     </Modal>

//                                     <TouchableOpacity style={{ alignItems: 'center' }} onPress={handleDownloadPdf}>
//                                         <Ionicons name="print" size={20} color="#ED1E24" />
//                                     </TouchableOpacity>
//                                 </View>

//                                 <Text style={styles.profileNumber}>{profileDetails.profile_id}</Text>

//                                 <View style={styles.planFlex}>
//                                     {profileDetails.valid_upto &&
//                                         new Date(profileDetails.valid_upto) < new Date() &&
//                                         allowedPremiumIds.includes(currentPlanId) ? (
//                                         <TouchableOpacity
//                                             style={styles.renewButtonWrapper}
//                                             onPress={() => navigation.navigate('PayNow')}
//                                         >
//                                             <LinearGradient
//                                                 colors={["#BD1225", "#FF4050"]}
//                                                 start={{ x: 0, y: 0 }}
//                                                 end={{ x: 1, y: 1 }}
//                                                 style={styles.renewButton}
//                                             >
//                                                 <Text style={styles.renewButtonText}>Renew</Text>
//                                             </LinearGradient>
//                                         </TouchableOpacity>
//                                     ) : (
//                                         <View style={styles.planFlex}>
//                                             <LinearGradient
//                                                 colors={
//                                                     profileDetails.package_name === "Platinum"
//                                                         ? ["#E5E4E2", "#C0C0C0", "#FFFFFF"]
//                                                         : profileDetails.package_name === "Gold"
//                                                             ? ["#D79D32", "#FFB800", "#FDE166"]
//                                                             : profileDetails.package_name === "Diamond"
//                                                                 ? ["#B9F2FF", "#FFFFFF", "#B9F2FF"]
//                                                                 : ["#D79D32", "#FFB800", "#FDE166"]
//                                                 }
//                                                 locations={[0, 0.5, 1]}
//                                                 start={{ x: 1, y: 1 }}
//                                                 end={{ x: 0, y: 0 }}
//                                                 style={[
//                                                     styles.goldLinearGradient,
//                                                     profileDetails.package_name === "Diamond" && styles.diamondText
//                                                 ]}
//                                             >
//                                                 <Text style={[
//                                                     styles.goldText,
//                                                     profileDetails.package_name === "Diamond" && { color: "#fff" }
//                                                 ]}>
//                                                     {profileDetails.package_name}
//                                                 </Text>
//                                             </LinearGradient>
//                                         </View>
//                                     )}
//                                     {profileDetails.valid_upto && (
//                                         <Text style={[styles.date, { marginBottom: 8, marginLeft: 10 }]}>
//                                             Valid Upto : {profileDetails.valid_upto}
//                                         </Text>
//                                     )}
//                                 </View>

//                                 <Pressable
//                                     style={styles.completeTextFlex}
//                                     onPress={handleAddOnPackagePress}
//                                 >
//                                     <Text style={styles.completeText}>Add on packages</Text>
//                                     <Ionicons name="arrow-forward" size={18} color="#ED1E24" />
//                                 </Pressable>

//                                 {/* Age */}
//                                 <View>
//                                     <Text style={styles.label}>Age : <Text style={styles.value}>{profileDetails.personal_age}</Text></Text>
//                                     <Text style={styles.label}>Height : <Text style={styles.value}>{profileDetails.personal_profile_height?.height_desc}</Text></Text>
//                                     <Text style={styles.label}>Star : <Text style={styles.value}>{profileDetails.star}</Text></Text>
//                                     <Text style={styles.label}>Profession : <Text style={styles.value}>{profileDetails.prosession}</Text></Text>
//                                     <Text style={styles.label}>Education : <Text style={styles.value}>{profileDetails.heightest_education}</Text></Text>
//                                 </View>
//                             </>
//                         ) : (
//                             <Text>Loading profile details...</Text>
//                         )}

//                     </View>
//                 </View>

//                 {/* Section Index 1: STICKY navigation icons */}
//                 <View style={{ backgroundColor: '#fff', zIndex: 10, elevation: 4 }}>
//                     <ProfileIconsBar onSelectSection={scrollToProfileSection} />
//                 </View>

//                 {/* Section Index 2: Profile content details */}
//                 <View style={{ backgroundColor: '#F4F4F4' }}>
//                     <ProfileSectionsContent sectionOffsetsRef={sectionOffsetsRef} />
//                 </View>
//             </Animated.ScrollView>

//             {/* Share Profile Modal (single instance, used by both entry points) */}
//             <Modal
//                 animationType="slide"
//                 transparent={true}
//                 visible={shareModalVisible}
//                 onRequestClose={() => setShareModalVisible(false)}
//             >
//                 <View style={styles.modalBackdrop}>
//                     <View style={styles.shareModalCard}>
//                         <View style={styles.modalHeader}>
//                             <Text style={{ fontSize: fs(18), fontWeight: 'bold', color: '#000' }}>Share Profile</Text>
//                             <TouchableOpacity onPress={() => setShareModalVisible(false)}>
//                                 <Ionicons name="close" size={24} color="#000" />
//                             </TouchableOpacity>
//                         </View>
//                         <TouchableOpacity
//                             style={styles.shareOptionBtn}
//                             onPress={() => handleWhatsAppShare(true)}
//                         >
//                             <Ionicons name="image" size={24} color="#ED1E24" />
//                             <Text style={styles.shareOptionText}>Share with Image</Text>
//                         </TouchableOpacity>

//                         <TouchableOpacity
//                             style={styles.shareOptionBtn}
//                             onPress={() => handleWhatsAppShare(false)}
//                         >
//                             <Ionicons name="document-text" size={24} color="#ED1E24" />
//                             <Text style={styles.shareOptionText}>Share without Image</Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </Modal>

//             {/* PDF Language Modal */}
//             <Modal
//                 visible={showLanguagePopup}
//                 transparent={true}
//                 animationType="fade"
//                 onRequestClose={() => setShowLanguagePopup(false)}
//             >
//                 <View style={styles.modalBackdrop}>
//                     <View style={styles.languageModalCard}>
//                         <TouchableOpacity
//                             style={{ alignSelf: 'flex-end' }}
//                             onPress={() => setShowLanguagePopup(false)}
//                         >
//                             <Ionicons name="close" size={24} color="black" />
//                         </TouchableOpacity>

//                         <Text style={{ fontSize: fs(18), fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
//                             Select Language
//                         </Text>

//                         <View style={{ marginBottom: 20 }}>
//                             <TouchableOpacity
//                                 style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}
//                                 onPress={() => setSelectedPdfLanguage("english")}
//                             >
//                                 <MaterialIcons
//                                     name={selectedPdfLanguage === "english" ? "radio-button-checked" : "radio-button-unchecked"}
//                                     size={24} color="#BD1225"
//                                 />
//                                 <Text style={{ fontSize: fs(16), marginLeft: 10 }}>English</Text>
//                             </TouchableOpacity>

//                             <TouchableOpacity
//                                 style={{ flexDirection: 'row', alignItems: 'center' }}
//                                 onPress={() => setSelectedPdfLanguage("tamil")}
//                             >
//                                 <MaterialIcons
//                                     name={selectedPdfLanguage === "tamil" ? "radio-button-checked" : "radio-button-unchecked"}
//                                     size={24} color="#BD1225"
//                                 />
//                                 <Text style={{ fontSize: fs(16), marginLeft: 10 }}>Tamil</Text>
//                             </TouchableOpacity>
//                         </View>

//                         <TouchableOpacity
//                             style={{ backgroundColor: '#BD1225', padding: 12, borderRadius: 8 }}
//                             onPress={handlePdfSubmit}
//                         >
//                             <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Submit</Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </Modal>

//             {/* Global Loader Overlay */}
//             {loading && (
//                 <View style={styles.loadingOverlay}>
//                     <ActivityIndicator size="large" color="#ED1E24" />
//                 </View>
//             )}
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     mainContainer: {
//         flex: 1,
//         backgroundColor: "#F4F4F4",
//     },
//     headerContainer: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         paddingHorizontal: 15,
//         borderBottomWidth: 1,
//         borderBottomColor: "#E5E5E5",
//         flexDirection: "row",
//         alignItems: "center",
//         justifyContent: "space-between",
//         backgroundColor: "#fff",
//         zIndex: 25,
//         elevation: 6,
//         paddingTop: Platform.OS === 'ios' ? 44 : 20,
//         height: HEADER_HEIGHT,
//     },
//     compactProfileBar: {
//         position: 'absolute',
//         top: HEADER_HEIGHT,
//         left: 0,
//         right: 0,
//         zIndex: 20,
//         backgroundColor: '#fff',
//         borderBottomWidth: 1,
//         borderBottomColor: '#E5E5E5',
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingHorizontal: 15,
//         paddingVertical: 8,
//         height: COMPACT_HEADER_HEIGHT,
//     },
//     compactAvatar: {
//         width: 38,
//         height: 38,
//         borderRadius: 19,
//         backgroundColor: '#eee',
//     },
//     compactName: {
//         color: '#282C3F',
//         fontSize: fs(15),
//         fontWeight: '800',
//     },
//     compactSub: {
//         color: '#85878C',
//         fontSize: fs(12),
//         marginTop: 2,
//         fontWeight: '500',
//     },
//     heroWrapper: {
//         zIndex: 1,
//     },
//     headerText: {
//         color: "#000000",
//         fontSize: fs(18),
//         fontWeight: "bold",
//         flex: 1,
//         textAlign: "center",
//     },
//     contentContainer: {
//         width: "100%",
//         paddingHorizontal: 14,
//         backgroundColor: '#F4F4F4',
//         zIndex: 2,
//         paddingTop: 10,
//     },
//     loadingOverlay: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: 'rgba(0,0,0,0.35)',
//         zIndex: 999,
//     },
//     name: {
//         color: "#FF6666",
//         fontSize: fs(22),
//         fontWeight: "700",
//     },
//     nameIconFlex: {
//         flexDirection: "row",
//         justifyContent: "flex-start",
//         alignItems: "center",
//         width: "100%",
//         paddingVertical: 14,
//         gap: 12,
//     },
//     verificationIcon: {
//         marginLeft: -4,
//     },
//     actionButton: {
//         marginLeft: 'auto',
//     },
//     profileNumber: {
//         fontSize: fs(17),
//         fontWeight: "700",
//         color: "#535665",
//         marginBottom: 10,
//         alignSelf: "flex-start",
//         marginTop: -10,
//     },
//     planFlex: {
//         flexDirection: "row",
//         justifyContent: "flex-start",
//         alignItems: "center",
//         alignSelf: "flex-start",
//     },
//     goldLinearGradient: {
//         borderRadius: 5,
//         justifyContent: "center",
//         alignItems: "center",
//         padding: 5,
//         width: 100,
//         marginRight: 10,
//     },
//     goldText: {
//         color: "#202332",
//         fontSize: fs(14),
//         fontWeight: "700",
//     },
//     diamondText: {
//         backgroundColor: '#1E293B',
//     },
//     date: {
//         fontSize: fs(13),
//         fontWeight: "700",
//         color: "#535665",
//     },
//     label: {
//         color: "#535665",
//         fontSize: fs(15),
//         fontWeight: "700",
//         marginBottom: 8,
//     },
//     value: {
//         color: "#535665",
//         fontSize: fs(15),
//         fontWeight: "500",
//     },
//     completeTextFlex: {
//         flexDirection: "row",
//         justifyContent: "flex-start",
//         alignItems: "center",
//         marginVertical: 10,
//     },
//     completeText: {
//         color: "#ED1E24",
//         fontSize: fs(14),
//         fontWeight: "600",
//     },
//     image: {
//         width: "100%",
//         height: "100%",
//         resizeMode: "cover",
//     },
//     paginationContainer: {
//         flexDirection: 'row',
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginVertical: 10,
//         backgroundColor: 'transparent',
//     },
//     dot: {
//         width: 8,
//         height: 8,
//         borderRadius: 4,
//         marginHorizontal: 5,
//         backgroundColor: '#333',
//     },
//     iconContainer: {
//         position: 'absolute',
//         bottom: 12,
//         right: 12,
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: 'rgba(255, 255, 255, 0.92)',
//         borderRadius: 20,
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         gap: 8,
//         elevation: 3,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.2,
//         shadowRadius: 2,
//     },
//     addIconWrapper: {
//         padding: 2,
//     },
//     itemContainer: {
//         position: 'relative',
//         width: '100%',
//         height: '100%',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     imageWrapper: {
//         width: '100%',
//         height: '100%',
//     },
//     renewButtonWrapper: {
//         alignSelf: 'flex-start',
//         marginBottom: 10,
//     },
//     renewButton: {
//         borderRadius: 6,
//         paddingVertical: 6,
//         paddingHorizontal: 12,
//         minWidth: 100,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     renewButtonText: {
//         color: 'white',
//         fontSize: fs(14),
//         fontWeight: '600',
//     },
//     emptyContainer: {
//         height: HERO_IMAGE_HEIGHT,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#EAEAEA',
//     },
//     uploadWrapper: {
//         justifyContent: 'center',
//         alignItems: 'center',
//         padding: 20,
//     },
//     uploadText: {
//         marginTop: 10,
//         fontSize: fs(15),
//         color: '#666',
//         fontWeight: '600',
//     },
//     shimmerContainer: {
//         flex: 1,
//         backgroundColor: '#F4F4F4',
//     },
//     shimmerHero: {
//         width: '100%',
//         height: HERO_IMAGE_HEIGHT,
//         backgroundColor: '#E0E0E0',
//     },
//     shimmerContent: {
//         padding: 16,
//     },
//     shimmerBar: {
//         backgroundColor: '#E0E0E0',
//         borderRadius: 4,
//     },
//     modalBackdrop: {
//         flex: 1,
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     shareModalCard: {
//         backgroundColor: 'white',
//         borderRadius: 15,
//         padding: 20,
//         width: '85%',
//         alignItems: 'center',
//     },
//     modalHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         width: '100%',
//         marginBottom: 20,
//     },
//     shareOptionBtn: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 14,
//         borderWidth: 1,
//         borderColor: '#ddd',
//         borderRadius: 10,
//         marginVertical: 6,
//         width: '100%',
//     },
//     shareOptionText: {
//         marginLeft: 15,
//         fontSize: fs(15),
//         color: '#000',
//         fontWeight: '500',
//     },
//     languageModalCard: {
//         backgroundColor: 'white',
//         width: '85%',
//         borderRadius: 10,
//         padding: 20,
//     }
// });

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

// ============================================================
// NOTE: All API calls, state, business logic and navigation
// below are UNCHANGED from the original file. Only layout,
// styling, and scroll/animation wiring were added or improved.
// ============================================================

// Responsive helpers
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const fs = (size) => isTablet ? Math.round(size * 1.3) : size;

// Layout Constants
const HERO_IMAGE_HEIGHT = isTablet ? 480 : 380;
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const COMPACT_HEADER_HEIGHT = 64;
const NAV_BAR_HEIGHT = 52;
const COLLAPSE_DISTANCE = HERO_IMAGE_HEIGHT - COMPACT_HEADER_HEIGHT;

// Section metadata used for the sticky quick-nav + active-section highlighting.
// Keys MUST match the keys used in sectionOffsetsRef inside ProfileSectionsContent.
const PROFILE_SECTIONS = [
    { key: 'personal', label: 'Personal', icon: 'account', lib: 'MCI' },
    { key: 'education', label: 'Education', icon: 'school', lib: 'MCI' },
    { key: 'profession', label: 'Profession', icon: 'briefcase', lib: 'FA5' },
    { key: 'family', label: 'Family', icon: 'account-group', lib: 'MCI' },
    { key: 'horoscope', label: 'Horoscope', icon: 'star-four-points', lib: 'MCI' },
    { key: 'contact', label: 'Contact', icon: 'phone', lib: 'MCI' },
];

// Shimmer Component for loading state
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
            <View style={styles.shimmerContent}>
                <Animated.View style={[styles.shimmerBar, { opacity, width: '60%', height: 24 }]} />
                <Animated.View style={[styles.shimmerBar, { opacity, width: '40%', height: 18, marginTop: 12 }]} />
                <Animated.View style={[styles.shimmerBar, { opacity, width: '80%', height: 16, marginTop: 12 }]} />
                <Animated.View style={[styles.shimmerBar, { opacity, width: '90%', height: 16, marginTop: 8 }]} />
                <Animated.View style={[styles.shimmerBar, { opacity, width: '70%', height: 16, marginTop: 8 }]} />
            </View>
        </View>
    );
};

// Small presentational helper for the "Age | Height | Star" style pill row.
// Pure UI — does not touch any data-fetching logic.
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

    const sectionOffsetsRef = useRef({
        iconBarTop: 0,
        personal: 0,
        education: 0,
        profession: 0,
        family: 0,
        horoscope: 0,
        contact: 0,
    });

    // Tracks which section tab should be visually highlighted.
    // This is purely presentational and does not change any data flow.
    const [activeSection, setActiveSection] = useState('personal');
    const activeSectionRef = useRef('personal');
    const scrollContainerYRef = useRef(0);

    const scrollToProfileSection = (key) => {
        const offsets = sectionOffsetsRef.current;
        const y = Math.max(0, (offsets.iconBarTop || 0) + (offsets[key] || 0) - 10);
        scrollViewRef.current?.scrollTo({ y, animated: true });
        setActiveSection(key);
        activeSectionRef.current = key;
    };

    // Recompute which section is active based on current scroll offset.
    // Cheap: just compares numbers already collected in sectionOffsetsRef.
    const updateActiveSectionFromScroll = useCallback((offsetY) => {
        const offsets = sectionOffsetsRef.current;
        const base = offsets.iconBarTop || 0;
        let current = PROFILE_SECTIONS[0].key;
        for (const section of PROFILE_SECTIONS) {
            const sectionY = base + (offsets[section.key] || 0);
            if (offsetY + NAV_BAR_HEIGHT + COMPACT_HEADER_HEIGHT + 20 >= sectionY) {
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
            }
            await fetchAndSetImages();
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
                <TouchableOpacity onPress={() => handleImageUpload(item.id)}>
                    <MaterialIcons
                        name="edit"
                        size={24}
                        color="red"
                        style={styles.editIcon}
                    />
                </TouchableOpacity>
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

    // Interpolations for Collapsing Header
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

    const headerBarOpacity = scrollY.interpolate({
        inputRange: [0, 60, 100],
        outputRange: [1, 0.3, 0],
        extrapolate: 'clamp',
    });
    const headerBarTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -HEADER_HEIGHT],
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
            {/* Top Fixed Header (app-level back/title bar) */}
            <Animated.View
                style={[
                    styles.headerContainer,
                    {
                        opacity: headerBarOpacity,
                        transform: [{ translateY: headerBarTranslateY }],
                    },
                ]}
                pointerEvents="box-none"
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
                    <Ionicons name="arrow-back" size={24} color="#ED1E24" />
                </TouchableOpacity>
                <Text style={styles.headerText} numberOfLines={1}>My Profile</Text>
                <View style={{ width: 32 }} />
            </Animated.View>

            {/* LEVEL 1 — Sticky Compact Profile Bar (photo + name + member id) */}
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
                        <Ionicons name="shield-checkmark" size={14} color="#53C840" style={{ marginLeft: 6 }} />
                    </View>
                    <Text style={styles.compactSub} numberOfLines={1}>
                        {profileDetails?.profile_id} {profileDetails?.personal_age ? `• ${profileDetails.personal_age} yrs` : ''}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setShareModalVisible(true)} style={styles.compactActionBtn}>
                    <Ionicons name="share-social" size={19} color="#ED1E24" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDownloadPdf} style={styles.compactActionBtn}>
                    <Ionicons name="print" size={19} color="#ED1E24" />
                </TouchableOpacity>
            </Animated.View>

            {/* Scrollable Body */}
            <Animated.ScrollView
                ref={scrollViewRef}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    {
                        useNativeDriver: true,
                        listener: (e) => {
                            const y = e.nativeEvent.contentOffset.y;
                            scrollContainerYRef.current = y;
                            updateActiveSectionFromScroll(y);
                        },
                    }
                )}
                scrollEventThrottle={16}
                removeClippedSubviews={Platform.OS === 'android'}
                contentContainerStyle={{ paddingTop: HEADER_HEIGHT - 10, paddingBottom: 30 }}
                stickyHeaderIndices={[1]}
            >
                {/* Section Index 0: Hero Carousel + Top Details */}
                <View style={{ backgroundColor: '#F4F4F4' }}>
                    <Animated.View
                        style={[
                            styles.heroWrapper,
                            { transform: [{ translateY: heroTranslateY }] },
                        ]}
                    >
                        <Animated.View style={{ opacity: heroOpacity }}>
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
                                            scrollAnimationDuration={600}
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
                                            onPress={() => uploadImage(null)}
                                        >
                                            <MaterialIcons name="add-photo-alternate" size={54} color="#888" />
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

                    {/* Profile Summary Card */}
                    <View style={styles.summaryCard}>
                        {profileDetails ? (
                            <>
                                <View style={styles.nameIconFlex}>
                                    <Text style={styles.name} numberOfLines={1}>{profileDetails.personal_profile_name}</Text>

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
                                            Valid Upto : {profileDetails.valid_upto}
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

                                {/* Age / Height / Star — clean pill layout instead of long text */}
                                <InfoPillRow
                                    items={[
                                        {
                                            label: 'age',
                                            value: profileDetails.personal_age ? `${profileDetails.personal_age} Yrs` : null,
                                            icon: <MaterialCommunityIcons name="cake-variant-outline" size={14} color="#ED1E24" />,
                                        },
                                        {
                                            label: 'height',
                                            value: profileDetails.personal_profile_height?.height_desc,
                                            icon: <MaterialCommunityIcons name="human-male-height" size={14} color="#ED1E24" />,
                                        },
                                        {
                                            label: 'star',
                                            value: profileDetails.star,
                                            icon: <MaterialCommunityIcons name="star-four-points-outline" size={14} color="#ED1E24" />,
                                        },
                                    ]}
                                />

                                <View style={styles.detailBlock}>
                                    <View style={styles.detailRow}>
                                        <FontAwesome5 name="briefcase" size={13} color="#85878C" style={styles.detailIcon} />
                                        <Text style={styles.label}>Profession</Text>
                                        <Text style={styles.value} numberOfLines={1}>{profileDetails.prosession || '—'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="school-outline" size={15} color="#85878C" style={styles.detailIcon} />
                                        <Text style={styles.label}>Education</Text>
                                        <Text style={styles.value} numberOfLines={1}>{profileDetails.heightest_education || '—'}</Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <Text>Loading profile details...</Text>
                        )}

                    </View>
                </View>

                {/* Section Index 1: STICKY navigation icons (LEVEL 2 sticky bar) */}
                <View style={styles.stickyNavWrapper}>
                    <ProfileIconsBar
                        onSelectSection={scrollToProfileSection}
                        activeSection={activeSection}
                        sections={PROFILE_SECTIONS}
                    />
                </View>

                {/* Section Index 2: Profile content details */}
                <View style={styles.sectionsBody}>
                    <ProfileSectionsContent sectionOffsetsRef={sectionOffsetsRef} />
                </View>
            </Animated.ScrollView>

            {/* Share Profile Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={shareModalVisible}
                onRequestClose={() => setShareModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.shareModalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={{ fontSize: fs(18), fontWeight: 'bold', color: '#000' }}>Share Profile</Text>
                            <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.shareOptionBtn}
                            onPress={() => handleWhatsAppShare(true)}
                        >
                            <Ionicons name="image" size={24} color="#ED1E24" />
                            <Text style={styles.shareOptionText}>Share with Image</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.shareOptionBtn}
                            onPress={() => handleWhatsAppShare(false)}
                        >
                            <Ionicons name="document-text" size={24} color="#ED1E24" />
                            <Text style={styles.shareOptionText}>Share without Image</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* PDF Language Modal */}
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
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>

                        <Text style={{ fontSize: fs(18), fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
                            Select Language
                        </Text>

                        <View style={{ marginBottom: 20 }}>
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

            {/* Global Loader Overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#ED1E24" />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: "#F4F4F4",
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        zIndex: 25,
        elevation: 6,
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
        height: HEADER_HEIGHT,
    },
    headerIconBtn: {
        padding: 6,
        borderRadius: 20,
    },
    compactProfileBar: {
        position: 'absolute',
        top: HEADER_HEIGHT,
        left: 0,
        right: 0,
        zIndex: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
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
        backgroundColor: '#eee',
        borderWidth: 1.5,
        borderColor: '#F0C4C4',
    },
    compactName: {
        color: '#282C3F',
        fontSize: fs(15),
        fontWeight: '800',
    },
    compactSub: {
        color: '#85878C',
        fontSize: fs(12),
        marginTop: 2,
        fontWeight: '500',
    },
    compactActionBtn: {
        marginLeft: 10,
        padding: 6,
        borderRadius: 18,
        backgroundColor: '#FFF1F1',
    },
    heroWrapper: {
        zIndex: 1,
    },
    heroBottomFade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 90,
    },
    headerText: {
        color: "#000000",
        fontSize: fs(18),
        fontWeight: "bold",
        flex: 1,
        textAlign: "center",
    },
    summaryCard: {
        width: "100%",
        marginTop: -18,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
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
        color: "#282C3F",
        fontSize: fs(21),
        fontWeight: "800",
        flexShrink: 1,
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
    profileNumber: {
        fontSize: fs(14),
        fontWeight: "700",
        color: "#ED1E24",
        marginBottom: 12,
        marginTop: 2,
        alignSelf: "flex-start",
        backgroundColor: '#FFF1F1',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
        overflow: 'hidden',
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
    },
    diamondText: {
        backgroundColor: '#1E293B',
    },
    date: {
        fontSize: fs(13),
        fontWeight: "700",
        color: "#535665",
    },
    // --- New: pill row for Age | Height | Star ---
    pillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    pillItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pillText: {
        fontSize: fs(13.5),
        fontWeight: '700',
        color: '#282C3F',
        marginLeft: 4,
    },
    pillDivider: {
        width: 1,
        height: 14,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 12,
    },
    // --- New: profession / education detail block ---
    detailBlock: {
        marginTop: 14,
        gap: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        width: 20,
    },
    label: {
        color: "#85878C",
        fontSize: fs(13.5),
        fontWeight: "600",
        width: 90,
    },
    value: {
        color: "#282C3F",
        fontSize: fs(14),
        fontWeight: "600",
        flex: 1,
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
        fontWeight: "600",
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
        backgroundColor: 'transparent',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 5,
        backgroundColor: '#333',
    },
    iconContainer: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
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
    },
    emptyContainer: {
        height: HERO_IMAGE_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EAEAEA',
    },
    uploadWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    uploadText: {
        marginTop: 10,
        fontSize: fs(15),
        color: '#666',
        fontWeight: '600',
    },
    shimmerContainer: {
        flex: 1,
        backgroundColor: '#F4F4F4',
    },
    shimmerHero: {
        width: '100%',
        height: HERO_IMAGE_HEIGHT,
        backgroundColor: '#E0E0E0',
    },
    shimmerContent: {
        padding: 16,
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
        backgroundColor: 'white',
        borderRadius: 15,
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
        borderColor: '#ddd',
        borderRadius: 10,
        marginVertical: 6,
        width: '100%',
    },
    shareOptionText: {
        marginLeft: 15,
        fontSize: fs(15),
        color: '#000',
        fontWeight: '500',
    },
    languageModalCard: {
        backgroundColor: 'white',
        width: '85%',
        borderRadius: 10,
        padding: 20,
    },
    // --- New: sticky nav (level 2) & section body wrappers ---
    stickyNavWrapper: {
        backgroundColor: '#fff',
        zIndex: 10,
        elevation: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
    },
    sectionsBody: {
        backgroundColor: '#F4F4F4',
        paddingHorizontal: 12,
        paddingTop: 12,
        gap: 12,
    },
});