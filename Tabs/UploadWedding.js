import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Pressable,
    Platform,
    Alert,
    ActivityIndicator,
    SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker'; // ✅ Added calendar support
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import Toast from "react-native-toast-message";
import axios from 'axios';
import config from '../API/Apiurl';
import { Picker } from "@react-native-picker/picker";
import { BottomTabBarComponent } from '../Navigation/ReuseTabNavigation';

export const UploadWedding = () => {
    const navigation = useNavigation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginUserProfileId, setLoginUserProfileId] = useState("");

    // Form States
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [weddingDate, setWeddingDate] = useState(""); // Holds clean "YYYY-MM-DD" string
    const [through, setThrough] = useState("Vysyamala");
    const [experience, setExperience] = useState("");
    const [agreed, setAgreed] = useState(false);
    
    // Calendar Picker Control States
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentDateValue, setCurrentDateValue] = useState(new Date());

    // Upload Management States
    const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(""); 
    const [isUploadingImage, setIsUploadingImage] = useState(false); 
    const [localFileName, setLocalFileName] = useState(""); 

    // Validation Error States
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const getProfileId = async () => {
            const id =
                await AsyncStorage.getItem("loginuser_profileId") ||
                await AsyncStorage.getItem("profile_id_new");
            if (id) setLoginUserProfileId(id);
        };
        getProfileId();
    }, []);

    // ── Interactive Calendar Event Handlers ─────────────────────────
    const onDateChange = (event, selectedDate) => {
        // Hide native UI modal element immediately for Android platforms
        if (Platform.OS === 'android') {
            setShowCalendar(false);
        }

        if (selectedDate) {
            setCurrentDateValue(selectedDate);
            
            // Format to standard structural payload string template: YYYY-MM-DD
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            setWeddingDate(formattedDate);
            setErrors(p => ({ ...p, weddingDate: null }));
        }
    };

    // ── Media Selection & Safe Processing Pipeline ──────────────────
    const handlePickPhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert(
                    "Permission Required 🔒", 
                    "You need to allow access to your photos to upload a wedding picture."
                );
                return;
            }

            // ✅ FIX: Replaced deprecated parameters matching modern modern standard
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], // Clean explicit string target configuration block
                allowsEditing: false,        
                aspect: [1, 1],             
                quality: 0.8,                 
            });

            if (result.canceled || !result.assets?.length) {
                return;
            }

            const asset = result.assets[0];
            const filename = asset.fileName || asset.uri.split('/').pop() || 'wedding_photo.jpg';
            const mimeType = asset.mimeType || 'image/jpeg';

            setLocalFileName(filename);
            setErrors(prev => ({ ...prev, photo: null }));
            setIsUploadingImage(true);

            const imageUploadData = new FormData();
            imageUploadData.append('image', {
                uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
                name: filename,
                type: mimeType,
            });
            imageUploadData.append('profile_id', loginUserProfileId);

            console.log("Uploading Wedding Image directly to Backend API...");
            
            const imageResponse = await axios.post(
                `${config.apiUrl}/auth/upload-profile-image/`,
                imageUploadData,
                { 
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json'
                    } 
                }
            );

            console.log("Image Upload API Response Data:", imageResponse.data);
            const isImageUploadSuccess = imageResponse.data?.status === 1 || imageResponse.data?.Status === 1;

            if (imageResponse.status === 200 && isImageUploadSuccess) {
                const serverUrl = imageResponse.data?.url || asset.uri; 
                setUploadedPhotoUrl(serverUrl);

                Toast.show({
                    type: "success",
                    text1: "Uploaded Successfully ✓",
                    text2: "Your cropped wedding image is verified on the server.",
                    position: "bottom"
                });
            } else {
                setLocalFileName("");
                setUploadedPhotoUrl("");
                Toast.show({
                    type: 'error',
                    text1: 'Upload Failed',
                    text2: imageResponse.data?.message || 'Failed to process crop imagery properties.',
                    position: 'bottom'
                });
            }
        } catch (err) {
            console.log("Gallery Picker or Upload Failure Context:", err);
            setLocalFileName("");
            setUploadedPhotoUrl("");
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to upload photo selection to the server.",
                position: "bottom"
            });
        } finally {
            setIsUploadingImage(false);
        }
    };
    
    const validateForm = () => {
        let valid = true;
        let formErrors = {};

        if (!name.trim()) { formErrors.name = "Bride / Groom Name is required"; valid = false; }
        if (!city.trim()) { formErrors.city = "City is required"; valid = false; }
        if (!weddingDate.trim()) { formErrors.weddingDate = "Wedding Date selection is required"; valid = false; }
        if (!experience.trim()) { formErrors.experience = "Please share your experience"; valid = false; }
        if (!uploadedPhotoUrl) { formErrors.photo = "Wedding photo upload is mandatory"; valid = false; }
        if (!agreed) { formErrors.agreed = "You must agree to display the photo"; valid = false; }

        setErrors(formErrors);
        return valid;
    };

    const onSubmit = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);

            const marriageDetailsPayload = {
                profile_id: loginUserProfileId,
                marriage_date: weddingDate,
                groom_bride_name: name,
                groombridecity: city,
                settled_thru: through,
                marriage_comments: experience,
                marriage_photo_details: agreed ? "Yes" : "No",
                marriage_image_url: uploadedPhotoUrl 
            };

            console.log("Submitting Settlement Details Payload:", marriageDetailsPayload);
            const detailsResponse = await axios.post(
                `${config.apiUrl}/api/marriage-settle-details/create/`,
                marriageDetailsPayload,
                { headers: { 'Content-Type': 'application/json' } }
            );

            console.log("Settlement Details Response Data:", detailsResponse.data);

            if (detailsResponse.status === 200 || detailsResponse.status === 201) {
                Alert.alert(
                    "Wedding Details Submitted! 💍",
                    "Thank you for sharing your beautiful success story with us!",
                    [
                        {
                            text: "OK",
                            onPress: async () => {
                                await AsyncStorage.clear();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: "LoginPage" }],
                                });
                            }
                        }
                    ],
                    { cancelable: false }
                );
            }
        } catch (error) {
            console.error('Submission Framework Error Context:', error?.response?.data || error);
            Toast.show({
                type: 'error',
                text1: 'Unexpected Error',
                text2: error?.response?.data?.message || 'An error occurred during submission.',
                position: 'bottom'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#ED1E24" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Upload Wedding Details 💍</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>

                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bride / Groom Name <Text style={styles.redText}>*</Text></Text>
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            placeholder="Enter name"
                            placeholderTextColor="#888"
                            value={name}
                            onChangeText={(text) => { setName(text); setErrors(p => ({ ...p, name: null })); }}
                        />
                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                    </View>

                    {/* City Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>City <Text style={styles.redText}>*</Text></Text>
                        <TextInput
                            style={[styles.input, errors.city && styles.inputError]}
                            placeholder="Enter city"
                            placeholderTextColor="#888"
                            value={city}
                            onChangeText={(text) => { setCity(text); setErrors(p => ({ ...p, city: null })); }}
                        />
                        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                    </View>

                    {/* ✅ FIXED: Interactive Calendar Trigger Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Wedding Date <Text style={styles.redText}>*</Text></Text>
                        <TouchableOpacity 
                            style={[styles.dateSelectorButton, errors.weddingDate && styles.inputError]}
                            onPress={() => setShowCalendar(true)}
                        >
                            <Text style={[styles.dateSelectorText, !weddingDate && { color: "#888" }]}>
                                {weddingDate ? weddingDate : "Select Wedding Date"}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#ED1E24" />
                        </TouchableOpacity>
                        {errors.weddingDate && <Text style={styles.errorText}>{errors.weddingDate}</Text>}

                        {/* Native Calendar Picker Overlay Element Component */}
                        {showCalendar && (
                            <View>
                                <DateTimePicker
                                    value={currentDateValue}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    // maximumDate={new Date()} // Blocks picking impossible future dates
                                />
                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity 
                                        style={styles.iosDoneButton} 
                                        onPress={() => setShowCalendar(false)}
                                    >
                                        <Text style={styles.iosDoneButtonText}>Confirm Date Selection</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Dropdown Fixed Through */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Marriage Fixed Through <Text style={styles.redText}>*</Text></Text>
                        <View style={styles.pickerBorder}>
                            <Picker selectedValue={through} onValueChange={(itemValue) => setThrough(itemValue)}>
                                <Picker.Item label="Vysyamala" value="Vysyamala" />
                                <Picker.Item label="Relative" value="Relative" />
                                <Picker.Item label="Friend" value="Friend" />
                                <Picker.Item label="Others" value="Others" />
                            </Picker>
                        </View>
                    </View>

                    {/* Upload Tile Input Row */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Upload Wedding Photo <Text style={styles.redText}>*</Text></Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.uploadButton,
                                uploadedPhotoUrl ? styles.uploadSuccessBorder : errors.photo ? styles.inputError : null,
                                pressed && { opacity: 0.85 }
                            ]}
                            onPress={handlePickPhoto}
                            disabled={isUploadingImage}
                        >
                            <View style={styles.uploadRowLeft}>
                                {isUploadingImage ? (
                                    <ActivityIndicator size="small" color="#BD1225" style={{ marginRight: 10 }} />
                                ) : (
                                    <Ionicons 
                                        name={uploadedPhotoUrl ? "checkmark-circle" : "image-outline"} 
                                        size={22} 
                                        color={uploadedPhotoUrl ? "#22C55E" : "#888"} 
                                        style={{ marginRight: 8 }} 
                                    />
                                )}
                                <Text style={[styles.uploadButtonText, uploadedPhotoUrl && { color: '#16A34A', fontWeight: '600' }]} numberOfLines={1}>
                                    {isUploadingImage 
                                        ? "Uploading Image..." 
                                        : uploadedPhotoUrl 
                                            ? "✓ Uploaded successfully" 
                                            : "Select & Crop Wedding Photo"
                                    }
                                </Text>
                            </View>
                            
                            <View style={[styles.statusBadge, { backgroundColor: uploadedPhotoUrl ? "#DCFCE7" : "#F3F4F6" }]}>
                                <Ionicons 
                                    name={uploadedPhotoUrl ? "checkmark" : "cloud-upload-outline"} 
                                    size={16} 
                                    color={uploadedPhotoUrl ? "#22C55E" : "#4B5563"} 
                                />
                            </View>
                        </Pressable>
                        {errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}
                    </View>

                    {/* Preview Area Component */}
                    {uploadedPhotoUrl && !isUploadingImage && (
                        <View style={styles.previewBox}>
                            <Image source={{ uri: uploadedPhotoUrl }} style={styles.previewImage} />
                            <Text style={styles.previewText}>Uploaded File: {localFileName}</Text>
                        </View>
                    )}

                    {/* Experience Text Area Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Your Experience <Text style={styles.redText}>*</Text></Text>
                        <TextInput
                            style={[styles.input, styles.textArea, errors.experience && styles.inputError]}
                            placeholder="Share your experience"
                            placeholderTextColor="#888"
                            multiline
                            numberOfLines={4}
                            value={experience}
                            onChangeText={(text) => { setExperience(text); setErrors(p => ({ ...p, experience: null })); }}
                        />
                        {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}
                    </View>

                    {/* Checkbox Element */}
                    <View style={styles.checkboxContainer}>
                        <Pressable
                            style={[styles.checkboxBase, agreed && styles.checkboxChecked, errors.agreed && styles.checkboxError]}
                            onPress={() => { setAgreed(!agreed); setErrors(p => ({ ...p, agreed: null })); }}
                        >
                            {agreed && <Ionicons name="checkmark" size={14} color="white" />}
                        </Pressable>
                        <Text style={styles.checkboxLabel}>I agree to display the photo in Santhosha Pendlilu section</Text>
                    </View>
                    {errors.agreed && <Text style={[styles.errorText, { marginTop: -5, marginBottom: 15 }]}>{errors.agreed}</Text>}

                    {/* Submit Form Button Block */}
                    <TouchableOpacity style={styles.btn} onPress={onSubmit} disabled={isSubmitting || isUploadingImage}>
                        <LinearGradient colors={["#BD1225", "#FF4050"]} style={styles.linearGradient}>
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.btnText}>Submit Details</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                </View>
            </ScrollView>
            <BottomTabBarComponent />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#fff5f7" },
    headerContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E5E5", flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 15 },
    headerText: { color: "#000000", fontSize: 18, fontWeight: "bold", marginLeft: 12 },
    scrollContainer: { paddingHorizontal: 15, paddingVertical: 20, paddingBottom: 100 },
    card: { backgroundColor: "#fff", padding: 20, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    inputGroup: { marginBottom: 15 },
    label: { color: "#444444", fontSize: 14, fontWeight: "700", fontFamily: "inter", marginBottom: 6 },
    redText: { color: "red" },
    input: { color: "#333333", borderWidth: 1, borderRadius: 10, borderColor: "#ccc", padding: 12, fontSize: 14, fontFamily: "inter" },
    inputError: { borderColor: "#ED1E24" },
    textArea: { height: 100, textAlignVertical: "top" },
    pickerBorder: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, overflow: 'hidden' },
    
    // Calendar UI styles
    dateSelectorButton: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, backgroundColor: "#fff" },
    dateSelectorText: { fontSize: 14, color: "#333", fontFamily: "inter" },
    iosDoneButton: { padding: 10, backgroundColor: "#F3F4F6", alignItems: "center", marginTop: 5, borderRadius: 8 },
    iosDoneButtonText: { color: "#ED1E24", fontWeight: "700", fontSize: 14 },

    // Upload Tile UI Updates
    uploadButton: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5, borderColor: "#ccc", borderRadius: 10, padding: 12, backgroundColor: "#f9f9f9" },
    uploadRowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    uploadSuccessBorder: { borderColor: "#22C55E", backgroundColor: "#F0FDF4" },
    statusBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    uploadButtonText: { color: "#555", fontSize: 14, flex: 1 },
    
    checkboxContainer: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20, paddingRight: 15 },
    checkboxBase: { width: 18, height: 18, justifyContent: "center", alignItems: "center", borderRadius: 4, borderWidth: 2, borderColor: "#535665", backgroundColor: "transparent", marginRight: 8, marginTop: 2 },
    checkboxChecked: { backgroundColor: "#e51b3f", borderColor: "#e51b3f" },
    checkboxError: { borderColor: "#ED1E24" },
    checkboxLabel: { fontSize: 13, color: "#555", lineHeight: 18 },
    errorText: { color: "#ED1E24", fontSize: 12, marginTop: 4, fontWeight: "600", paddingLeft: 2 },
    linearGradient: { borderRadius: 10, justifyContent: "center", padding: 14, alignItems: "center" },
    btn: { width: "100%", marginTop: 10 },
    btnText: { color: "white", fontWeight: "700", fontSize: 16 },
    previewBox: { alignItems: 'center', marginBottom: 15, marginTop: 5 },
    previewImage: { width: 120, height: 120, borderRadius: 10, borderWidth: 1, borderColor: '#22C55E' },
    previewText: { fontSize: 11, color: '#666', marginTop: 5 }
});