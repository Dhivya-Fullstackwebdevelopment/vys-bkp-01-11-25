// import React, { useState, useEffect } from 'react';
// import {
//     StyleSheet,
//     Text,
//     TextInput,
//     View,
//     ScrollView,
//     TouchableOpacity,
//     Image,
//     Pressable,
//     Platform,
//     Alert,
//     ActivityIndicator,
//     SafeAreaView
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { launchImageLibrary } from "react-native-image-picker";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useNavigation } from "@react-navigation/native";
// import { LinearGradient } from 'expo-linear-gradient';
// import Toast from "react-native-toast-message";
// import axios from 'axios';
// import config from '../API/Apiurl';
// import { Picker } from "@react-native-picker/picker";
// import { BottomTabBarComponent } from '../Navigation/ReuseTabNavigation'

// export const UploadWedding = () => {
//     const navigation = useNavigation();
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [loginUserProfileId, setLoginUserProfileId] = useState("");

//     // Form States
//     const [name, setName] = useState("");
//     const [city, setCity] = useState("");
//     const [weddingDate, setWeddingDate] = useState("");
//     const [through, setThrough] = useState("Vysyamala");
//     const [experience, setExperience] = useState("");
//     const [agreed, setAgreed] = useState(false);
//     const [photoFile, setPhotoFile] = useState(null);

//     // Validation Error States
//     const [errors, setErrors] = useState({});

//     useEffect(() => {
//         const getProfileId = async () => {
//             const id =
//                 await AsyncStorage.getItem("loginuser_profileId") ||
//                 await AsyncStorage.getItem("profile_id_new");
//             if (id) setLoginUserProfileId(id);
//         };
//         getProfileId();
//     }, []);

//     const handlePickPhoto = () => {
//         const options = { mediaType: 'photo', quality: 1 };
//         launchImageLibrary(options, (response) => {
//             if (response.didCancel) return;
//             if (response.assets && response.assets.length > 0) {
//                 const asset = response.assets[0];

//                 // Max file size validation: 5MB check
//                 if (asset.fileSize && asset.fileSize > 5000000) {
//                     Toast.show({
//                         type: "error",
//                         text1: "File Too Large",
//                         text2: "Maximum wedding photo size is 5MB",
//                         position: "bottom"
//                     });
//                     return;
//                 }
//                 setPhotoFile(asset);
//                 setErrors(prev => ({ ...prev, photo: null }));
//             }
//         });
//     };

//     const validateForm = () => {
//         let valid = true;
//         let formErrors = {};

//         if (!name.trim()) { formErrors.name = "Bride / Groom Name is required"; valid = false; }
//         if (!city.trim()) { formErrors.city = "City is required"; valid = false; }
//         if (!weddingDate.trim()) { formErrors.weddingDate = "Wedding Date is required"; valid = false; }
//         if (!experience.trim()) { formErrors.experience = "Please share your experience"; valid = false; }
//         if (!photoFile) { formErrors.photo = "Wedding photo is required"; valid = false; }
//         if (!agreed) { formErrors.agreed = "You must agree to display the photo"; valid = false; }

//         setErrors(formErrors);
//         return valid;
//     };

//     const onSubmit = async () => {
//         if (!validateForm()) return;

//         try {
//             setIsSubmitting(true);

//             // 1. Upload Wedding Image API Block
//             const imageUploadData = new FormData();
//             imageUploadData.append('image', {
//                 uri: Platform.OS === 'android' ? photoFile.uri : photoFile.uri.replace('file://', ''),
//                 name: photoFile.fileName || 'wedding_photo.jpg',
//                 type: photoFile.type || 'image/jpeg',
//             });
//             imageUploadData.append('profile_id', loginUserProfileId);

//             console.log("Uploading Wedding Image...");
//             const imageResponse = await axios.post(
//                 `${config.apiUrl}/auth/upload-profile-image/`,
//                 imageUploadData,
//                 { headers: { 'Content-Type': 'multipart/form-data' } }
//             );

//             // 2. Image Upload Verification Step
//             if (imageResponse.status === 200 && imageResponse.data.status === 1) {

//                 // 3. Create Marriage Settlement Details Entry Payload
//                 const marriageDetailsPayload = {
//                     profile_id: loginUserProfileId,
//                     marriage_date: weddingDate,
//                     groom_bride_name: name,
//                     groombridecity: city,
//                     settled_thru: through,
//                     marriage_comments: experience,
//                     marriage_photo_details: agreed ? "Yes" : "No"
//                 };

//                 console.log("Submitting Settlement Details Payload:", marriageDetailsPayload);
//                 const detailsResponse = await axios.post(
//                     `${config.apiUrl}/api/marriage-settle-details/create/`,
//                     marriageDetailsPayload,
//                     { headers: { 'Content-Type': 'application/json' } }
//                 );

//                 if (detailsResponse.status === 200 || detailsResponse.status === 201) {

//                     // 🎉 4. Final Alert Popup matching Web Timeout + Structural App Logout
//                     Alert.alert(
//                         "Wedding Details Submitted! 💍",
//                         "Thank you for sharing your beautiful success story with us!",
//                         [
//                             {
//                                 text: "OK",
//                                 onPress: async () => {
//                                     await AsyncStorage.clear();
//                                     navigation.reset({
//                                         index: 0,
//                                         routes: [{ name: "LoginPage" }],
//                                     });
//                                 }
//                             }
//                         ],
//                         { cancelable: false }
//                     );

//                     // Web 2-second fallback simulation safely resetting state tree
//                     setTimeout(async () => {
//                         try {
//                             await AsyncStorage.clear();
//                             navigation.reset({
//                                 index: 0,
//                                 routes: [{ name: "LoginPage" }],
//                             });
//                         } catch (e) {
//                             console.log("Fallback loop clearing exception context:", e);
//                         }
//                     }, 2000);
//                 }
//             } else {
//                 Toast.show({
//                     type: 'error',
//                     text1: 'Upload Failed',
//                     text2: 'Failed to upload image to directory asset routes.',
//                     position: 'bottom'
//                 });
//             }

//         } catch (error) {
//             console.error('Submission Framework Error:', error?.response?.data || error);
//             Toast.show({
//                 type: 'error',
//                 text1: 'Unexpected Error',
//                 text2: error?.response?.data?.message || 'An error occurred during submission.',
//                 position: 'bottom'
//             });
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     return (
//         <SafeAreaView style={styles.safeArea}>
//             <View style={styles.headerContainer}>
//                 <TouchableOpacity onPress={() => navigation.goBack()}>
//                     <Ionicons name="arrow-back" size={24} color="#ED1E24" />
//                 </TouchableOpacity>
//                 <Text style={styles.headerText}>Upload Wedding Details 💍</Text>
//             </View>

//             <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
//                 <View style={styles.card}>

//                     {/* Name Input */}
//                     <View style={styles.inputGroup}>
//                         <Text style={styles.label}>Bride / Groom Name <Text style={styles.redText}>*</Text></Text>
//                         <TextInput
//                             style={[styles.input, errors.name && styles.inputError]}
//                             placeholder="Enter name"
//                             placeholderTextColor="#888"
//                             value={name}
//                             onChangeText={(text) => { setName(text); setErrors(p => ({ ...p, name: null })); }}
//                         />
//                         {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
//                     </View>

//                     {/* City Input */}
//                     <View style={styles.inputGroup}>
//                         <Text style={styles.label}>City <Text style={styles.redText}>*</Text></Text>
//                         <TextInput
//                             style={[styles.input, errors.city && styles.inputError]}
//                             placeholder="Enter city"
//                             placeholderTextColor="#888"
//                             value={city}
//                             onChangeText={(text) => { setCity(text); setErrors(p => ({ ...p, city: null })); }}
//                         />
//                         {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
//                     </View>

//                     {/* Date Input */}
//                     <View style={styles.inputGroup}>
//                         <Text style={styles.label}>Wedding Date <Text style={styles.redText}>*</Text></Text>
//                         <TextInput
//                             style={[styles.input, errors.weddingDate && styles.inputError]}
//                             placeholder="YYYY-MM-DD"
//                             placeholderTextColor="#888"
//                             value={weddingDate}
//                             onChangeText={(text) => { setWeddingDate(text); setErrors(p => ({ ...p, weddingDate: null })); }}
//                         />
//                         {errors.weddingDate && <Text style={styles.errorText}>{errors.weddingDate}</Text>}
//                     </View>

//                     {/* Dropdown Pickers */}
//                     <View style={styles.inputGroup}>
//                         <Text style={styles.label}>Marriage Fixed Through <Text style={styles.redText}>*</Text></Text>
//                         <View style={styles.pickerBorder}>
//                             <Picker selectedValue={through} onValueChange={(itemValue) => setThrough(itemValue)}>
//                                 <Picker.Item label="Vysyamala" value="Vysyamala" />
//                                 <Picker.Item label="Relative" value="Relative" />
//                                 <Picker.Item label="Friend" value="Friend" />
//                                 <Picker.Item label="Others" value="Others" />
//                             </Picker>
//                         </View>
//                     </View>

//                     {/* Photo Selector */}
//                     {/* Photo Selector */}
//                     <View style={styles.inputGroup}>
//                         <Text style={styles.label}>Upload Wedding Photo <Text style={styles.redText}>*</Text></Text>

//                         <Pressable
//                             style={({ pressed }) => [
//                                 styles.uploadButton,
//                                 errors.photo && styles.inputError,
//                                 pressed && { opacity: 0.7, backgroundColor: '#f0f0f0' }
//                             ]}
//                             // Intercepts the gesture instantly before the scroll container locks the touch responder
//                             onPressIn={handlePickPhoto}
//                             hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                         >
//                             <Ionicons name="image-outline" size={20} color="#888" style={{ marginRight: 8 }} />
//                             <Text style={styles.uploadButtonText} numberOfLines={1}>
//                                 {photoFile ? photoFile.fileName : "Select Wedding Photo"}
//                             </Text>
//                         </Pressable>

//                         {errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}
//                     </View>

//                     {/* Experience Text Area Input */}
//                     <View style={styles.inputGroup}>
//                         <Text style={styles.label}>Your Experience <Text style={styles.redText}>*</Text></Text>
//                         <TextInput
//                             style={[styles.input, styles.textArea, errors.experience && styles.inputError]}
//                             placeholder="Share your experience"
//                             placeholderTextColor="#888"
//                             multiline
//                             numberOfLines={4}
//                             value={experience}
//                             onChangeText={(text) => { setExperience(text); setErrors(p => ({ ...p, experience: null })); }}
//                         />
//                         {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}
//                     </View>

//                     {/* Checkbox Element */}
//                     <View style={styles.checkboxContainer}>
//                         <Pressable
//                             style={[styles.checkboxBase, agreed && styles.checkboxChecked, errors.agreed && styles.checkboxError]}
//                             onPress={() => { setAgreed(!agreed); setErrors(p => ({ ...p, agreed: null })); }}
//                         >
//                             {agreed && <Ionicons name="checkmark" size={14} color="white" />}
//                         </Pressable>
//                         <Text style={styles.checkboxLabel}>I agree to display the photo in Santhosha Pendlilu section</Text>
//                     </View>
//                     {errors.agreed && <Text style={[styles.errorText, { marginTop: -5, marginBottom: 15 }]}>{errors.agreed}</Text>}

//                     {/* Submit Form Button Block */}
//                     <TouchableOpacity style={styles.btn} onPress={onSubmit} disabled={isSubmitting}>
//                         <LinearGradient colors={["#BD1225", "#FF4050"]} style={styles.linearGradient}>
//                             {isSubmitting ? (
//                                 <ActivityIndicator size="small" color="#fff" />
//                             ) : (
//                                 <Text style={styles.btnText}>Submit Details</Text>
//                             )}
//                         </LinearGradient>
//                     </TouchableOpacity>

//                 </View>
//             </ScrollView>
//             <BottomTabBarComponent />
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     safeArea: { flex: 1, backgroundColor: "#fff5f7" },
//     headerContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E5E5", flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 15 },
//     headerText: { color: "#000000", fontSize: 18, fontWeight: "bold", marginLeft: 12 },
//     scrollContainer: { paddingHorizontal: 15, paddingVertical: 20, paddingBottom: 100 },
//     card: { backgroundColor: "#fff", padding: 20, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
//     inputGroup: { marginBottom: 15 },
//     label: { color: "#444444", fontSize: 14, fontWeight: "700", fontFamily: "inter", marginBottom: 6 },
//     redText: { color: "red" },
//     input: { color: "#333333", borderWidth: 1, borderRadius: 10, borderColor: "#ccc", padding: 12, fontSize: 14, fontFamily: "inter" },
//     inputError: { borderColor: "#ED1E24" },
//     textArea: { height: 100, textAlignVertical: "top" },
//     pickerBorder: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, overflow: 'hidden' },
//     uploadButton: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, backgroundColor: "#f9f9f9" },
//     uploadButtonText: { color: "#555", fontSize: 14, flex: 1 },
//     checkboxContainer: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20, paddingRight: 15 },
//     checkboxBase: { width: 18, height: 18, justifyContent: "center", alignItems: "center", borderRadius: 4, borderWidth: 2, borderColor: "#535665", backgroundColor: "transparent", marginRight: 8, marginTop: 2 },
//     checkboxChecked: { backgroundColor: "#e51b3f", borderColor: "#e51b3f" },
//     checkboxError: { borderColor: "#ED1E24" },
//     checkboxLabel: { fontSize: 13, color: "#555", lineHeight: 18 },
//     errorText: { color: "#ED1E24", fontSize: 12, marginTop: 4, fontWeight: "600", paddingLeft: 2 },
//     linearGradient: { borderRadius: 10, justifyContent: "center", padding: 14, alignItems: "center" },
//     btn: { width: "100%", marginTop: 10 },
//     btnText: { color: "white", fontWeight: "700", fontSize: 16 }
// });

import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    ScrollView,
    TouchableOpacity,
    Pressable,
    Platform,
    Alert,
    ActivityIndicator,
    SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// 1. Changed import to expo-image-picker ✅
import * as ImagePicker from 'expo-image-picker';
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
    const [weddingDate, setWeddingDate] = useState("");
    const [through, setThrough] = useState("Vysyamala");
    const [experience, setExperience] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);

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

    // 2. Fixed handlePickPhoto using Expo's native picker API ✅
    const handlePickPhoto = async () => {
        try {
            // Request permissions to open gallery
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "You need to allow access to your photos to upload a wedding picture.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];

                // Auto extract filename cleanly from image path
                const filename = asset.fileName || asset.uri.split('/').pop() || 'wedding_photo.jpg';

                setPhotoFile({
                    uri: asset.uri,
                    fileName: filename,
                    type: asset.mimeType || 'image/jpeg',
                });
                
                setErrors(prev => ({ ...prev, photo: null }));
            }
        } catch (err) {
            console.log("Gallery Picker Error:", err);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to open photo library.",
                position: "bottom"
            });
        }
    };

    const validateForm = () => {
        let valid = true;
        let formErrors = {};

        if (!name.trim()) { formErrors.name = "Bride / Groom Name is required"; valid = false; }
        if (!city.trim()) { formErrors.city = "City is required"; valid = false; }
        if (!weddingDate.trim()) { formErrors.weddingDate = "Wedding Date is required"; valid = false; }
        if (!experience.trim()) { formErrors.experience = "Please share your experience"; valid = false; }
        if (!photoFile) { formErrors.photo = "Wedding photo is required"; valid = false; }
        if (!agreed) { formErrors.agreed = "You must agree to display the photo"; valid = false; }

        setErrors(formErrors);
        return valid;
    };

    const onSubmit = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);

            const imageUploadData = new FormData();
            imageUploadData.append('image', {
                uri: Platform.OS === 'android' ? photoFile.uri : photoFile.uri.replace('file://', ''),
                name: photoFile.fileName,
                type: photoFile.type,
            });
            imageUploadData.append('profile_id', loginUserProfileId);

            console.log("Uploading Wedding Image...");
            const imageResponse = await axios.post(
                `${config.apiUrl}/auth/upload-profile-image/`,
                imageUploadData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (imageResponse.status === 200 && imageResponse.data.status === 1) {

                const marriageDetailsPayload = {
                    profile_id: loginUserProfileId,
                    marriage_date: weddingDate,
                    groom_bride_name: name,
                    groombridecity: city,
                    settled_thru: through,
                    marriage_comments: experience,
                    marriage_photo_details: agreed ? "Yes" : "No"
                };

                console.log("Submitting Settlement Details Payload:", marriageDetailsPayload);
                const detailsResponse = await axios.post(
                    `${config.apiUrl}/api/marriage-settle-details/create/`,
                    marriageDetailsPayload,
                    { headers: { 'Content-Type': 'application/json' } }
                );

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

                    setTimeout(async () => {
                        try {
                            await AsyncStorage.clear();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: "LoginPage" }],
                            });
                        } catch (e) {
                            console.log("Fallback loop clearing exception context:", e);
                        }
                    }, 2000);
                }
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Upload Failed',
                    text2: 'Failed to upload image.',
                    position: 'bottom'
                });
            }

        } catch (error) {
            console.error('Submission Framework Error:', error?.response?.data || error);
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

                    {/* Date Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Wedding Date <Text style={styles.redText}>*</Text></Text>
                        <TextInput
                            style={[styles.input, errors.weddingDate && styles.inputError]}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#888"
                            value={weddingDate}
                            onChangeText={(text) => { setWeddingDate(text); setErrors(p => ({ ...p, weddingDate: null })); }}
                        />
                        {errors.weddingDate && <Text style={styles.errorText}>{errors.weddingDate}</Text>}
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

                    {/* Photo Selector - Fixed with Pressable + hitSlop combination */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Upload Wedding Photo <Text style={styles.redText}>*</Text></Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.uploadButton,
                                errors.photo && styles.inputError,
                                pressed && { backgroundColor: '#e8e8e8', opacity: 0.8 }
                            ]}
                            onPress={handlePickPhoto}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Ionicons name="image-outline" size={20} color="#888" style={{ marginRight: 8 }} />
                            <Text style={styles.uploadButtonText} numberOfLines={1}>
                                {photoFile ? photoFile.fileName : "Select Wedding Photo"}
                            </Text>
                        </Pressable>
                        {errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}
                    </View>

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
                    <TouchableOpacity style={styles.btn} onPress={onSubmit} disabled={isSubmitting}>
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
    uploadButton: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, backgroundColor: "#f9f9f9" },
    uploadButtonText: { color: "#555", fontSize: 14, flex: 1 },
    checkboxContainer: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20, paddingRight: 15 },
    checkboxBase: { width: 18, height: 18, justifyContent: "center", alignItems: "center", borderRadius: 4, borderWidth: 2, borderColor: "#535665", backgroundColor: "transparent", marginRight: 8, marginTop: 2 },
    checkboxChecked: { backgroundColor: "#e51b3f", borderColor: "#e51b3f" },
    checkboxError: { borderColor: "#ED1E24" },
    checkboxLabel: { fontSize: 13, color: "#555", lineHeight: 18 },
    errorText: { color: "#ED1E24", fontSize: 12, marginTop: 4, fontWeight: "600", paddingLeft: 2 },
    linearGradient: { borderRadius: 10, justifyContent: "center", padding: 14, alignItems: "center" },
    btn: { width: "100%", marginTop: 10 },
    btnText: { color: "white", fontWeight: "700", fontSize: 16 }
});