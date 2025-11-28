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

export const MyProfile = () => {
    const navigation = useNavigation();

    const [isBookmarked, setIsBookmarked] = useState(false);

    // Function to handle save icon press
    const handleSavePress = () => {
        setIsBookmarked(!isBookmarked); // Toggle bookmarked state
    };

    // Carousel State
    const width = Dimensions.get('window').width;
    const [shareModalVisible, setShareModalVisible] = useState(false);

    const [activeSlide, setActiveSlide] = useState(0);
    const [selectedSlideIndex, setSelectedSlideIndex] = useState(null);
    const [isZoomVisible, setZoomVisible] = useState(false);
    const [data, setData] = useState([]);
    const [profileDetails, setProfileDetails] = useState(null); // State for profile details
    const [loading, setLoading] = useState(false);
    const [educationalDetails, setEducationalDetails] = useState(null);
    // const currentPlanId = AsyncStorage.getItem("current_plan_id");
    const [currentPlanId, setCurrentPlanId] = useState(null);
    const allowedPremiumIds = [1, 2, 3, 10, 11, 13, 14, 15, 16, 17];
    // Fetch images from API
    // useEffect(() => {
    //     const fetchAndSetImages = async () => {
    //         try {
    //             const result = await fetchImages(); // Assuming fetchImages is your utility function
    //             console.log('result imagescheck ==>', result);
    //             if (result.Status === 1) {
    //                 // const baseURL = 'https://matrimonyapi.rainyseasun.com';
    //                 const images = result.data.map((image) => ({
    //                     id: image.id,
    //                     url: `${config.apiUrl}${image.image}`,
    //                     uploaded_at: image.uploaded_at,
    //                 }));
    //                 setData(images);
    //                 console.log('Fetched images:', images);
    //             } else {
    //                 console.log('Failed to fetch images:', result.message);
    //             }
    //         } catch (error) {
    //             console.error('Error fetching images:', error);
    //         }
    //     };

    //     fetchAndSetImages(); // Call the renamed function
    // }, []);

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
                    onPress: () => uploadImage(id),  // Pass the image id
                },
                {
                    text: 'Remove Image',
                    onPress: () => removeImage(id),  // Pass the image id
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ],
            { cancelable: true }
        );
    };

    // Upload a new image
    // const uploadImage = async (id) => {
    //     launchImageLibrary({}, async (response) => {
    //         if (response.didCancel) {
    //             console.log('User cancelled image picker');
    //         } else if (response.error) {
    //             console.log('ImagePicker Error: ', response.error);
    //         } else if (response.assets) {
    //             const file = response.assets[0];
    //             console.log("response  ===>  ", response)
    //             const formData = new FormData();

    //             // Check if the image has an ID (i.e., if we're replacing it)
    //             if (id !== null) {
    //                 const imageToReplace = data.find(item => item.id === id); // Find the image by ID
    //                 if (imageToReplace) {
    //                     formData.append("replace_image_ids", imageToReplace.id.toString());
    //                     // formData.append("replace_image_files", file, file.fileName);
    //                     formData.append("replace_image_files", {
    //                         uri: response.assets[0].uri,
    //                         type: 'image/jpeg',
    //                         name: response.assets[0].fileName,
    //                     });
    //                 }
    //             } else {
    //                 // If the image doesn't have an ID, upload it as a new image
    //                 formData.append("new_image_files", {
    //                     uri: response.assets[0].uri,
    //                     type: 'image/jpeg',
    //                     name: response.assets[0].fileName,
    //                 });
    //             }

    //             try {
    //                 console.log("upload image my profile formdata ==>", formData)
    //                 // Call the common API function
    //                 const response = await uploadImageToServer(formData);
    //                 console.log("Image processed successfully:", response);
    //                 // alert("Image uploaded successfully");
    //                 Toast.show({
    //                     type: "success",
    //                     text1: "Profile Viewed",
    //                     text2: `Image uploaded successfully.`,
    //                     position: "bottom",
    //                 });

    //                 // Update the data state with the new image URL (if successful)
    //                 if (id !== null) {
    //                     // Update the replaced image
    //                     const newData = [...data];
    //                     const updatedIndex = newData.findIndex(item => item.id === id);
    //                     if (updatedIndex !== -1) {
    //                         newData[updatedIndex].url = response.imageUrl; // assuming the response contains the new image URL
    //                     }
    //                     setData(newData);
    //                 } else {
    //                     // For new image, add a new entry (if required)
    //                     setData(prevData => [
    //                         ...prevData,
    //                         { id: response.newImageId, url: response.imageUrl },
    //                     ]);
    //                 }
    //                 fetchAndSetImages();
    //             } catch (error) {
    //                 // alert(error.message); // Show error message from API call
    //                 Toast.show({
    //                     type: "error",
    //                     text1: "Search Error",
    //                     text2: error.message,
    //                     position: "bottom",
    //                 });
    //             }
    //         }
    //     });
    // };

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

                // If id is provided, we're replacing an image
                if (id !== null) {
                    formData.append("replace_image_ids", id.toString());
                    formData.append("replace_image_files", {
                        uri: file.uri,
                        type: file.type || 'image/jpeg',
                        name: file.fileName || `image_${Date.now()}.jpg`,
                    });
                } else {
                    // If id is null, we're adding a new image
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

                    // Refresh images
                    await fetchAndSetImages();
                } catch (error) {
                    console.error("Upload error:", error);
                    Toast.show({
                        type: "error",
                        text1: "Upload Error",
                        text2: error.message || "Failed to upload image",
                        position: "bottom",
                    });
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

                // Remove the image from local state
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

    // useEffect(() => {
    //     const fetchProfileDetails = async () => {
    //         try {
    //             const result = await getMyProfilePersonal(); // Pass profile_id and user_profile_id
    //             console.log("dddfd", result);
    //             await AsyncStorage.setItem("selectedPlanName", result.data.package_name || "Gold"); // Store the selected plan name in AsyncStorage
    //             setProfileDetails(result.data); // Update the state with profile details
    //         } catch (error) {
    //             console.error('Error fetching profile details:', error);
    //         }
    //     };

    //     fetchProfileDetails();
    // }, []);

    useEffect(() => {
        const fetchProfileAndPlanDetails = async () => {
            try {
                // 1. Fetch Profile Details
                const result = await getMyProfilePersonal();
                console.log("Profile Details fetched:", result);

                await AsyncStorage.setItem("selectedPlanName", result.data.package_name || "Gold"); // Store the selected plan name in AsyncStorage
                setProfileDetails(result.data); // Update the state with profile details

                // 2. Fetch and set current plan ID correctly
                const planIdStr = await AsyncStorage.getItem("current_plan_id");
                if (planIdStr) {
                    // Convert the string ID from AsyncStorage to an integer
                    setCurrentPlanId(parseInt(planIdStr, 10));
                } else {
                    // Default to 0 or another indicator if not set
                    setCurrentPlanId(0);
                }

            } catch (error) {
                console.error('Error fetching profile details or plan ID:', error);
            }
        };

        fetchProfileAndPlanDetails();
    }, []);

    // const renderItem = ({ item, index }) => (
    //     <View style={styles.itemContainer} key={item.id}>
    //         <TouchableOpacity
    //             style={styles.imageWrapper}
    //         // onPress={() => console.log(`Image with ID ${item.id} pressed`)}
    //         >
    //             <Image
    //                 source={{ uri: item.url || 'https://via.placeholder.com/150' }} // Add a fallback image if url is empty
    //                 style={styles.image}
    //                 onError={() => console.log(`Failed to load image at index with ID: ${item.id}`)}
    //             />
    //         </TouchableOpacity>

    //         <MaterialIcons
    //             name="edit"
    //             size={24}
    //             color="red"
    //             style={styles.editIcon}
    //             onPress={() => handleImageUpload(item.id)} // Pass the image id here
    //         />
    //     </View>
    // );

    const renderItem = ({ item, index }) => (
        <View style={styles.itemContainer} key={item.id}>
            <TouchableOpacity style={styles.imageWrapper}>
                <TopAlignedImage
                    uri={item.url || 'https://via.placeholder.com/150'}
                    width={width} // Use the width of the screen (or container width)
                    height={400} // Use the height of your carousel slide
                    style={styles.image} // Pass any container styling
                />
                {/* <Image
                    source={{ uri: item.url || 'https://via.placeholder.com/150' }}
                    style={styles.image}
                    onError={() => console.log(`Failed to load image at index with ID: ${item.id}`)}
                /> */}
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
        uploadImage(null); // Pass null to indicate it's a new image
    };


    const handleDownloadPdf = async () => {
        // Proceed with the download if permission is granted
        const profileId = await AsyncStorage.getItem("loginuser_profileId");
        try {
            setLoading(true)
            const filePath = await downloadPdfmyprofile(profileId);
            // Alert.alert("Download Complete", `File saved to: ${filePath}`);
        } catch (error) {
            Alert.alert("Error", "Failed to download the file.");
        } finally {
            setLoading(false)
        }
    };


    const fetchProfileData = async () => {
        try {
            const data = await getMyEducationalDetails();
            console.log("data educational details ===>", data);
            setEducationalDetails(data.data); // Set the data in the state
        } catch (error) {
            console.error('Failed to load profile data', error);
        }
    };


    useEffect(() => {
        fetchProfileData(); // Call the function when component mounts
    }, []);

    const handleWhatsAppShare = async (withImage = false) => {
        const profileName = profileDetails?.personal_profile_name;
        const profileId = profileDetails?.profile_id;
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
        // Choose URL based on whether to include image or not
        const shareUrl = withImage
            ? `https://app.vysyamala.com/auth/profile/${profileId}/`
            : `https://app.vysyamala.com/auth/profile_view/${profileId}/`;

        const message =
            `Check out this profile!\n\n` +
            // `🌟 *Profile Link:* ${shareUrl}\n` +
            `🆔 *Profile ID:* ${profileId || 'Not available'}\n` +
            `👤 *Profile Name:* ${profileName || 'Not available'}\n` +
            `🎂 *Age:* ${age || 'Not available'} years\n` +
            `✨ *Star Name:* ${starName || 'Not available'}\n` +
            `💰 *Annual Income:* ${annualIncome || 'Not available'}\n` +
            `🎓 *Education:* ${education || 'Not available'}\n` +
            // `💼 *Profession:* ${profession || 'Not available'}${companyName || businessName ? ` at ${companyName || businessName}` : ''}\n` +4
            professionLine +
            `📍 *Place of Stay:* ${placeOfStay || 'Not available'}\n\n` +
            `🌟 *For More Details:* ${shareUrl}\n` +
            `------------------------------------------- \n` +
            `Click here to register your profile on Vysyamala :\n`
            +
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
                <View style={{ flex: 1 }}>
                    {data.length > 0 ? (
                        <>
                            <Carousel
                                loop
                                width={width}
                                height={400}
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

                <View style={styles.contentContainer}>
                    {profileDetails ? (
                        <>
                            <View style={styles.nameIconFlex}>
                                <Text style={styles.name}>{profileDetails.personal_profile_name}</Text>
                                {/* <View style={styles.verificationBadge}> */}
                                <TouchableOpacity>
                                    <Ionicons
                                        name="shield-checkmark"
                                        size={18}
                                        color="#53c840"
                                        style={styles.verificationIcon}
                                    />
                                </TouchableOpacity>
                                {/* </View> */}

                                {/* <View style={styles.actionButtons}> */}
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
                                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Share Profile</Text>
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
                                                <Text style={{ marginLeft: 15, fontSize: 16, color: '#000' }}>Share with Image</Text>
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
                                                <Text style={{ marginLeft: 15, fontSize: 16, color: '#000' }}>Share without Image</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Modal>
                                <TouchableOpacity style={{ alignItems: 'center' }} onPress={handleDownloadPdf}>
                                    <Ionicons name="print" size={20} color="#ED1E24" />
                                    {/* <Text style={{fontSize: 12, marginTop: 5, color: '#ED1E24'}}>Print</Text> */}
                                </TouchableOpacity>
                            </View>
                            {/* </View> */}

                            <Text style={styles.profileNumber}>{profileDetails.profile_id}</Text>

                            <View style={styles.planFlex}>
                                {/* <LinearGradient
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
                                        {profileDetails.package_name || "Gold"}
                                    </Text>
                                </LinearGradient>
                                <Text style={styles.date}>
                                    Valid Upto :
                                    {profileDetails.valid_upto == ""
                                        ? "2024-01-01"
                                        : profileDetails.valid_upto}
                                </Text> */}
                                {profileDetails.valid_upto &&
                                    new Date(profileDetails.valid_upto) < new Date() &&
                                    allowedPremiumIds.includes(currentPlanId) ? (
                                    // --- SHOW RENEW BUTTON ---
                                    <TouchableOpacity
                                        style={styles.renewButtonWrapper}
                                        onPress={() => navigation.navigate('PayNow')} // Navigates to your upgrade screen
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

                            {/* Plan flex */}
                            {/* <View style={styles.planFlex}>
                                <LinearGradient
                                    colors={["#D79D32", "#FFB800", "#FDE166"]}
                                    locations={[0, 0.5, 1]}
                                    start={{ x: 1, y: 1 }}
                                    end={{ x: 0, y: 0 }}
                                    // useAngle={true}
                                    // angle={92.08}
                                    // angleCenter={{ x: 0.5, y: 0.5 }}
                                    style={styles.goldLinearGradient}
                                >
                                    <Text style={styles.goldText}>Gold</Text>
                                </LinearGradient>
                                <Text style={styles.date}>Valid Upto: 16-Mar-2024</Text>
                            </View> */}


                            {/* <View style={styles.completeTextFlex}>
                                <Text style={styles.completeText}>Add on packages </Text>
                                <Ionicons name="arrow-forward" size={18} color="#ED1E24" />
                            </View> */}

                            <Pressable
                                style={styles.completeTextFlex}
                                onPress={() => navigation.navigate('PayNow')} // Replace 'TargetScreen' with your target screen's name
                            >
                                <Text style={styles.completeText}>Add on packages</Text>
                                <Ionicons name="arrow-forward" size={18} color="#ED1E24" />
                            </Pressable>

                            {/* Age */}
                            <View>
                                <Text style={styles.label}>Age : <Text style={styles.value}>{profileDetails.personal_age}</Text></Text>
                                <Text style={styles.label}>Height : <Text style={styles.value}>{profileDetails.personal_profile_height}</Text></Text>
                                <Text style={styles.label}>Star : <Text style={styles.value}>{profileDetails.star}</Text></Text>
                                <Text style={styles.label}>Profession : <Text style={styles.value}>{profileDetails.prosession}</Text></Text>
                                <Text style={styles.label}>Education : <Text style={styles.value}>{profileDetails.heightest_education}</Text></Text>
                            </View>

                            {/* sandalContainer */}
                            {/* <View style={styles.sandalProfileContainer}>

                                <View style={styles.sandalContainerFlex}>
                                    <CircularProgress
                                        value={85}
                                        // value={parseInt(profileDetails?.profile_details?.completion_per, 10) || 0}
                                        valueSuffix={"%"}
                                        radius={35}
                                        duration={2000}
                                        activeStrokeWidth={8}
                                        inActiveStrokeWidth={8}
                                        progressValueColor={"#535665"}
                                        progressValueStyle={{ fontSize: 14, fontWeight: "500" }}
                                        titleFontSize={16}
                                        maxValue={100}
                                        // title={"KM/H"}
                                        titleColor={"white"}
                                        titleStyle={{ fontWeight: "bold" }}
                                        activeStrokeColor={"#2FBD12"}
                                        inActiveStrokeColor={"#2FBD12"}
                                        inActiveStrokeOpacity={0.2}
                                    // circleBackgroundColor={'#333'}
                                    />


                                    <View style={styles.percentageContent}>
                                        <Text style={styles.profilePercentage}>
                                            Your profile is now {profileDetails.matching_score}% complete
                                        </Text>
                                        <Text style={styles.percentageText}>
                                            Complete your profile we will suggest profiles based on your
                                            preference
                                        </Text>

                                        <View style={styles.completeTextFlex}>
                                            <Text style={styles.completeText}>Complete Your Profile </Text>
                                            <Ionicons name="arrow-forward" size={18} color="#ED1E24" />
                                        </View>
                                    </View>
                                </View>

                            </View> */}
                        </>
                    ) : (
                        <Text>Loading profile details...</Text>
                    )}

                </View>

                {/* Details */}
                {/* <Text style={styles.details}>Details</Text> */}

                {/* Details View */}
                <ProfileDetailsEdit />
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#ED1E24" />
                    </View>
                )}
            </SafeAreaView>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F4F4",
        // alignItems: "center",
        // justifyContent: "flex-start",
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
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 10,
    },
    contentContainer: {
        width: "100%",
        paddingHorizontal: 10,
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
        fontSize: 22,
        fontFamily: "inter",
        fontWeight: "700",
        // marginBottom: 10,
    },
    nameIconFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        paddingVertical: 20,
    },

    iconFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "15%",
    },

    saveIcon: {
        // position: "absolute",
        // left: -25,
        // top: 5,
    },

    profileNumber: {
        fontSize: 17,
        fontWeight: "700",
        color: "#535665",
        // paddingHorizontal: 10,
        marginBottom: 10,
        alignSelf: "flex-start",
        marginTop: -15,
    },

    planFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        alignSelf: "flex-start",
        // marginBottom: 10,
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
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "inter",
    },

    date: {
        fontSize: 13,
        fontWeight: "700",
        color: "#535665",
    },

    label: {
        color: "#535665",
        fontSize: 16,
        fontWeight: "700",
        fontFamily: "inter",
        marginBottom: 10,
    },

    value: {
        color: "#535665",
        fontSize: 16,
        fontWeight: "500",
        fontFamily: "inter",
    },

    sandalProfileContainer: {
        width: "100%",
        backgroundColor: "#FFFBE3",
        borderRadius: 8,
        // paddingHorizontal: 10,
        paddingVertical: 20,
        // paddingTop: 20,
        // paddingBottom: 10,
        marginTop: 20,
    },

    sandalContainerFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        // alignSelf: "center",
        // marginTop: 10,

    },

    percentageContent: {
        marginLeft: 15,
    },

    profilePercentage: {
        color: "#535665",
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "inter",
        // marginTop: 10,
        marginBottom: 5,
        // alignSelf: "flex-start",
    },

    percentageText: {
        color: "#535665",
        fontSize: 12,
        fontWeight: "300",
        fontFamily: "inter",
        marginBottom: 10,
        // paddingRight: 80, // Adjust this value as needed
        flexWrap: "wrap", // Allow text to wrap within its container
        maxWidth: "85%", // Set a maximum width for the text container
        // alignSelf: "flex-start",
    },

    completeTextFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginVertical: 10,
        // alignSelf: "center",
    },

    completeText: {
        color: "#ED1E24",
        fontSize: 14,
        fontWeight: "500",
        fontFamily: "inter",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },

    details: {
        fontSize: 16,
        fontWeight: "700",
        fontFamily: "inter",
        color: "#282C3F",
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        marginVertical: 10,
    },

    // detailsMenu: {
    //     width: "100%",
    //     backgroundColor: "#4F515D",
    //     paddingHorizontal: 10,
    //     paddingVertical: 20,
    //     // paddingTop: 20,
    //     flexDirection: "row",
    //     justifyContent: "space-between",
    //     alignItems: "center",
    //     alignSelf: "center",
    // },

    // menuName: {
    //     color: "#fff",
    //     fontSize: 15,
    //     fontWeight: "500",
    //     fontFamily: "inter",
    //     marginLeft: 5,
    // },

    // iconMenuFlex: {
    //     flexDirection: "row",
    //     justifyContent: "flex-start",
    //     alignItems: "center",
    //     // width: "100%",
    // },

    // redText: {
    //     color: "#ED1E24",
    //     fontSize: 14,
    //     fontWeight: "700",
    //     fontFamily: "inter",
    //     marginVertical: 15,
    //     alignSelf: "flex-start",
    //     paddingHorizontal: 10,
    // },

    // editOptions: {
    //     width: "100%",
    //     alignSelf: "flex-start",
    //     paddingHorizontal: 10,
    // },

    // menuContainer: {
    //     width: "100%",
    //     overflow: 'hidden', // Ensure content doesn't overflow
    // },

    // itemContainer: {
    //     // flex: 1,
    //     // borderWidth: 1,
    //     justifyContent: 'center',
    // },

    image: {
        // width: width,
        // height: width / 2,
        width: "100%",
        height: "100%",
        resizeMode: "cover",
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

    editIcon: {
        position: "absolute",
        right: 0,
        bottom: 0,
        zIndex: 10,
        backgroundColor: "#fff",
        padding: 5,
        // borderRadius: 5,
        borderTopLeftRadius: 5,
    },
    // Add these new styles to your existing styles object
    iconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },

    addIconWrapper: {
        backgroundColor: '#fff',
        padding: 5,
        borderTopLeftRadius: 5,
        marginRight: 5,
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

    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
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

    editIcon: {
        padding: 0,
    },
    renewButtonWrapper: {
        alignSelf: 'flex-start', // Aligns button to the left
        marginBottom: 10, // Spacing below the button
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
        fontSize: 14,
        fontWeight: '600',
        fontFamily: "inter",
    },
});
