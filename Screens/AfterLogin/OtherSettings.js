import React, { useState, useEffect, useRef } from 'react'
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    Switch,
    ImageBackground,
    Image,
    ScrollView,
    TouchableOpacity,
    Pressable,
    Animated,
    TouchableWithoutFeedback,
    TouchableHighlight,
    Dimensions,
    Modal,
    Button,
    Platform,
} from "react-native";
import {
    AntDesign,
    Ionicons,
    MaterialIcons,
    FontAwesome,
    FontAwesome5,
    FontAwesome6,
    MaterialCommunityIcons,
    Feather,
} from "@expo/vector-icons";
import { launchImageLibrary } from "react-native-image-picker";
import * as Progress from "react-native-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo } from 'react';
import RadioGroup from 'react-native-radio-buttons-group';
import { useNavigation } from "@react-navigation/native";
import { getAlertSettings, updateNotificationSettings, handleSavePasswordChange, changeUserPassword, fetchAlertSettings, fetchAlertSettingsGet } from '../../CommonApiCall/CommonApiCall'; // Adjust the path as necessary
import { PartnerSettings } from '../../Components/PartnerSetting';
import { ProfileVisibility } from '../../Components/ProfileVisibility';
import Toast from "react-native-toast-message";
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarComponent } from '../../Navigation/ReuseTabNavigation';
// import { PartnerSettings } from '../PartnerSettings';
import axios from 'axios';
import config from '../../API/Apiurl';
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert } from "react-native";
import { Colors, rs } from '../../Reusable/Theme';
import { SafeAreaView } from "react-native-safe-area-context";


export const OtherSettings = () => {
    const navigation = useNavigation();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [oldPasswordError, setOldPasswordError] = useState('');
    const [newPasswordError, setNewPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');


    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [horoscopeFile, setHoroscopeFile] = useState(null);
    const [idProofFile, setIdProofFile] = useState(null);
    const [divorceFile, setDivorceFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [maritalStatus, setMaritalStatus] = useState('');
    console.log("maritalStatus", maritalStatus)

    const [uploadedHoroscope, setUploadedHoroscope] = useState("");
    const [uploadedIDProof, setUploadedIDProof] = useState("");
    const [uploadedDivorceProof, setUploadedDivorceProof] = useState("");
    const [allowVisit, setAllowVisit] = useState(null); // ❌ no default
    //const currentPlanId = AsyncStorage.getItem("current_plan_id");
    const [currentPlanId, setCurrentPlanId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [hideMenuOpen, setHideMenuOpen] = useState(false);
    const animatedHeightHide = useRef(new Animated.Value(0)).current;
    const rotationHide = useRef(new Animated.Value(0)).current;

    const [hideReason, setHideReason] = useState("");
    const [engagementDate, setEngagementDate] = useState("");
    const [comments, setComments] = useState("");
    const [profileId, setProfileId] = useState("");
    const [hideLoading, setHideLoading] = useState(false);
    const [otherReason, setOtherReason] = useState("");
    const [deleteReason, setDeleteReason] = useState("");
    const [deleteComments, setDeleteComments] = useState("");
    const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);
    const rotationDelete = useRef(new Animated.Value(0)).current;
    const [showHideCalendar, setShowHideCalendar] = useState(false);
    const [calendarDate, setCalendarDate] = useState(new Date());

    const onHideDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowHideCalendar(false);
        }
        if (selectedDate) {
            setCalendarDate(selectedDate);
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            setEngagementDate(`${year}-${month}-${day}`);
        }
    };

    const handleHideProfile = async () => {
        try {
            // --- 1. Validations ---
            if (!hideReason) {
                Toast.show({
                    type: "error",
                    text1: "Hide Reason is required",
                    position: "top",
                });
                return;
            }

            if (!profileId) {
                Toast.show({
                    type: "error",
                    text1: "Profile ID is required",
                    position: "top",
                });
                return;
            }

            if (!engagementDate) {
                Toast.show({
                    type: "error",
                    text1: "Engagement Date is required",
                    position: "top",
                });
                return;
            }

            if (hideReason === "Others" && !comments.trim()) {
                Toast.show({
                    type: "error",
                    text1: "Please enter reason",
                    position: "top",
                });
                return;
            }

            setHideLoading(true);

            // --- 2. Hide Profile API Request ---
            const payload = {
                profile_id: profileId,
                reason: hideReason === "Others" ? otherReason : hideReason,
                other_text: otherReason,
            };

            console.log("Hide Profile Payload:", payload);

            const response = await axios.post(
                `${config.apiUrl}/auth/hide-profile/`,
                payload,
                { headers: { "Content-Type": "application/json" } }
            );

            console.log("Hide Profile Response:", response.data);

            if (response?.data?.Status === 1) {

                // --- 3. Run Marriage Settle Details API if condition matches ---
                const formData = new FormData();
                formData.append("marriage_settled_comment", comments || "");
                formData.append("engagement_date", engagementDate);
                formData.append("profile_id", profileId);

                console.log("Marriage Settle Details Payload:", {
                    marriage_settled_comment: comments || "",
                    engagement_date: engagementDate,
                    profile_id: profileId
                });

                await axios.post(
                    `${config.apiUrl}/api/marriage-settle-details/create/`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );

                // --- 4. Dynamic Conditional Popup Messaging & Redirections ---
                if (hideReason === "Marriage Settled") {

                    // Web equivalence: /UploadWedding redirect after 5 seconds or manual click
                    Alert.alert(
                        "Congratulations! 💐",
                        "May Lord Vasavi Kanyakaparameswari bless your married life.\n\nOur team will contact you after deactivating your profile.\n\nPlease take a moment to fill the success story form.",
                        [
                            {
                                text: "OK",
                                onPress: () => {
                                    navigation.navigate("UploadWedding");
                                },
                            },
                        ],
                        { cancelable: false }
                    );

                    // Auto redirect fallback logic matching web timeout configuration
                    setTimeout(() => {
                        // Check if user is still on this view context before tracking redirect triggers
                        navigation.navigate("UploadWedding");
                    }, 5000);

                } else {

                    // Web equivalence: localStorage.clear() and redirect to /login after 2 seconds
                    Alert.alert(
                        "Profile Hidden Status",
                        "Your profile has been hidden successfully.\n\nPlease contact us whenever you want to activate your profile.",
                        [
                            {
                                text: "OK",
                                onPress: async () => {
                                    try {
                                        await AsyncStorage.clear();
                                        navigation.reset({
                                            index: 0,
                                            routes: [{ name: "LoginPage" }],
                                        });
                                    } catch (err) {
                                        console.log("Logout Stack Clean Error:", err);
                                    }
                                },
                            },
                        ],
                        { cancelable: false }
                    );

                    // Auto logout framework sync matching web timeout configurations
                    setTimeout(async () => {
                        try {
                            await AsyncStorage.clear();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: "LoginPage" }],
                            });
                        } catch (err) {
                            console.log("Timeout Stack Clean Error:", err);
                        }
                    }, 2000);
                }

            } else {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: response?.data?.message || "Failed to hide profile",
                    position: "top",
                });
            }
        } catch (error) {
            console.log("Hide Profile Error Context:", error?.response?.data || error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error?.response?.data?.message || "Something went wrong",
                position: "top",
            });
        } finally {
            setHideLoading(false);
        }
    };

    useEffect(() => {
        const loadProfileId = async () => {
            const id =
                await AsyncStorage.getItem("loginuser_profileId") ||
                await AsyncStorage.getItem("profile_id_new");

            if (id) {
                setProfileId(id);
            }
        };

        loadProfileId();
    }, []);


    useEffect(() => {
        const fetchCurrentPlan = async () => {
            const plan = await AsyncStorage.getItem("current_plan_id");
            setCurrentPlanId(plan); // plan will be "16"
        };
        fetchCurrentPlan();
    }, []);

    // Fetch marital status on mount (similar to your web logic)
    useEffect(() => {
        const checkStatus = async () => {
            const status = await AsyncStorage.getItem("martial_status");
            setMaritalStatus(status);
        };
        checkStatus();
    }, []);

    const pickImage = (type) => {
        const options = { mediaType: 'photo', quality: 1 };
        launchImageLibrary(options, (response) => {
            if (response.didCancel) return;
            const file = response.assets[0];
            if (type === 'horoscope') setHoroscopeFile(file);
            if (type === 'idproof') setIdProofFile(file);
            if (type === 'divorce') setDivorceFile(file);
        });
    };

    const validatePasswords = () => {
        let isValid = true;

        if (!oldPassword) {
            setOldPasswordError('Old Password is required.');
            isValid = false;
        } else {
            setOldPasswordError('');
        }

        if (!newPassword) {
            setNewPasswordError('New Password is required.');
            isValid = false;
        } else {
            setNewPasswordError('');
        }

        if (!confirmPassword) {
            setConfirmPasswordError('Confirm Password is required.');
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            setConfirmPasswordError('New Password and Confirm Password do not match.');
            isValid = false;
        } else {
            setConfirmPasswordError('');
        }

        return isValid;
    };


    const handleChangePassword = async () => {
        if (!validatePasswords()) {
            return;
        }

        try {
            console.log("Old Password:", oldPassword, "New Password:", newPassword, "Confirm Password:", confirmPassword);
            const result = await changeUserPassword(oldPassword, newPassword, confirmPassword);

            if (result.status === 'success') {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Password updated successfully.',
                    position: 'bottom'
                });
                // Optionally reset form fields here
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.message || 'Failed to update password.',
                    position: 'bottom'

                });
            }
        } catch (error) {
            let errorMessage = 'An error occurred while updating the password.';

            // Handle specific API error responses
            if (error.response) {
                // Handle specific status codes
                if (error.response.status === 400) {
                    errorMessage = error.response.data?.message || 'Invalid password details provided.';
                } else if (error.response.status === 401) {
                    errorMessage = 'Current password is incorrect.';
                } else if (error.response.status === 422) {
                    errorMessage = error.response.data?.message || 'Password validation failed.';
                }
            }

            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMessage,
                position: 'bottom'
            });
        }
    };

    const fetchInitialSettings = async () => {
        try {
            const profileId = await AsyncStorage.getItem("loginuser_profileId") ||
                await AsyncStorage.getItem("profile_id_new");

            if (!profileId) return;

            const response = await axios.post(`${config.apiUrl}/auth/Get_save_details/`, {
                profile_id: profileId,
                page_id: "2", // Consistent with your web logic
            });
            // console.log("response",response)

            if (response.data.Status === 1) {
                const data = response.data.data;

                // Set existing file URLs (to display to user)
                setUploadedHoroscope(data.horoscope_file || "");
                setUploadedIDProof(data.Profile_idproof || "");
                setUploadedDivorceProof(data.Profile_divorceproof || "");

                // Set Video URL
                setVideoUrl(data.Video_url || "");

                // Set Password Protection status
                const isProtected = data.Photo_protection === "1";
                setChecked(isProtected);
                if (data.allow_visit !== undefined && data.allow_visit !== null) {
                    setAllowVisit(Number(data.allow_visit));
                }

                if (isProtected && data.Photo_password) {
                    setPassword(data.Photo_password);
                }
            }
        } catch (error) {
            console.error("Error fetching saved details:", error);
        }
    };
    useEffect(() => {
        fetchInitialSettings();
    }, []);

    const handleSubmitPhotoSettings = async () => {
        const profileId = await AsyncStorage.getItem("loginuser_profileId") ||
            await AsyncStorage.getItem("profile_id_new");

        if (!profileId) {
            Toast.show({ type: 'error', text1: 'User Profile ID not found' });
            return;
        }

        const formData = new FormData();
        formData.append("profile_id", profileId);
        formData.append("photo_protection", checked ? "1" : "0");
        formData.append("photo_password", checked ? password : "");
        formData.append("Video_url", videoUrl);
        // if (allowVisit !== null) {
        //     formData.append("allow_visit", allowVisit); // ✅ 0 or 1
        // }
        if (currentPlanId === "16" && allowVisit !== null) {
            formData.append("allow_visit", allowVisit);
        }


        const appendFile = (key, file) => {
            if (file) {
                formData.append(key, {
                    uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
                    name: file.fileName || `${key}.jpg`,
                    type: file.type || 'image/jpeg',
                });
            }
        };

        appendFile("horoscope_file", horoscopeFile);
        appendFile("idproof_file", idProofFile);
        appendFile("divorcepf_file", divorceFile);

        try {
            const response = await axios.post(`${config.apiUrl}/auth/Photo_Id_Settings/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`Upload Progress: ${percentCompleted}%`);
                }
            });

            const result = response.data;

            // --- UPDATED LOGIC HERE ---
            // Check for specific keys returned by your API instead of .status
            if (result.horoscope_data || result.registration_data) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Photo Settings Updated Successfully',
                    position: 'bottom'
                });

                // Optional: Update the UI with the new URLs returned by the API
                if (result.horoscope_data?.horoscope_file) {
                    setUploadedHoroscope(result.horoscope_data.horoscope_file);
                    setHoroscopeFile(null); // Clear the picker state
                }
                if (result.registration_data?.Profile_idproof) {
                    setUploadedIDProof(result.registration_data.Profile_idproof);
                    setIdProofFile(null); // Clear the picker state
                }
                await fetchInitialSettings()
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Update Failed',
                    text2: result.message || 'Photo Settings Update Failed',
                    position: 'bottom'
                });
            }
        } catch (error) {
            console.error("Axios Error:", error);
            Toast.show({
                type: 'error',
                text1: 'Network Error',
                text2: 'Failed to upload settings',
                position: 'bottom'
            });
        }
    };

    const [checked, setChecked] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');

    const handleCheckboxTogglePassword = async () => {
        const newChecked = !checked;
        setChecked(newChecked);

        // Call API with photo_protection set to 0 if unchecked, 1 if checked
        if (!newChecked) {
            try {
                const result = await handleSavePasswordChange(password, 0); // Unchecked, so pass 0
                if (result.data.status === 1) {
                    console.log('Successfully updated');
                } else {
                    console.error('Update failed:', result.data.message);
                }
            } catch (error) {
                console.error('Error updating password:', error);
            }
        }
    };

    // Save password and protection status
    const handleSavePassword = async () => {
        try {
            if (password.length < 8) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Password must be at least 8 characters long.',
                    position: 'bottom'
                });
                return;
            }
            console.log("password", password);
            const result = await handleSavePasswordChange(password, checked ? 1 : 0); // Pass 1 if checked, otherwise 0
            console.log("result", JSON.stringify(result.data.status));
            if (result.data.status === 1) {
                console.log('Successfully updated');
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: result.data.message,
                    position: 'bottom'
                });
            } else {
                console.error('Update failed:', result.data.message);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.data.message || 'Failed to update password.',
                    position: 'bottom'
                });
            }
        } catch (error) {
            console.error('Error updating password:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to update password.',
                position: 'bottom'
            });
        }
    };



    const [emailAlerts, setEmailAlerts] = useState([]);
    const [smsAlerts, setSmsAlerts] = useState([]);
    const [checkedAlerts, setCheckedAlerts] = useState({}); // To track checked state
    const [pMenuOpen, setPMenuOpen] = useState(false);

    useEffect(() => {
        const fetchAlertSettings = async () => {
            try {
                const data = await getAlertSettings();
                console.log("Fetched alert types:", data);

                setEmailAlerts(data['Email Alerts'] || []);
                setSmsAlerts(data['SMS Alerts'] || []);

                // Initialize checkedAlerts with false for all alerts
                const initialChecked = {};
                data['Email Alerts'].forEach(alert => {
                    initialChecked[`email_${alert.id}`] = false;
                });
                data['SMS Alerts'].forEach(alert => {
                    initialChecked[`sms_${alert.id}`] = false;
                });
                setCheckedAlerts(initialChecked);

                // Now fetch the enabled alerts from API and mark them as true
                const enabledAlerts = await fetchAlertSettingsGet();
                console.log("Enabled alert settings:", enabledAlerts);

                const updatedChecked = { ...initialChecked };
                enabledAlerts.forEach(alert => {
                    updatedChecked[`email_${alert.id}`] = true;
                    updatedChecked[`sms_${alert.id}`] = true;
                });

                setCheckedAlerts(updatedChecked);
            } catch (err) {
                console.error('Failed to load alert settings:', err.message);
            }
        };

        fetchAlertSettings();
    }, []);

    // Function to handle checkbox toggle
    const handleCheckboxToggle = (id) => {
        setCheckedAlerts(prevState => ({
            ...prevState,
            [id]: !prevState[id],
        }));
    };

    const getSelectedIds = () => {
        const selectedIds = Object.keys(checkedAlerts)
            .filter(key => checkedAlerts[key])  // Filter only the keys that are true
            .map(key => parseInt(key.split('_')[1]));  // Extract the numeric ID from each key

        console.log('Selected IDs:', selectedIds);
        return selectedIds;
    };


    const handleSave = async () => {
        // Retrieve selected IDs
        const selectedIdsArray = getSelectedIds(); // This should return an array of IDs
        // Convert the array of selected IDs into a comma-separated string
        const selectedIdsString = selectedIdsArray.join(','); // Converts [1, 2, 4] to "1,2,4"

        try {
            // Call the API
            const result = await updateNotificationSettings(selectedIdsString);

            // Handle the result
            if (result.status === "1") {
                console.log('Success:', result.message);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: result.message,
                    position: 'bottom'
                });
                // Show success message, update state, etc.
            } else {
                console.error('Failure:', result.message);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.message || 'Failed to update alert settings.',
                    position: 'bottom'
                });
                // Show error message, etc.
            }
        } catch (error) {
            console.error('Error:', error.message);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to update alert settings.',
                position: 'bottom'
            });
            // Handle unexpected errors
        }
    };


    // The rest of your component remains the same
    console.log(checkedAlerts);
    // Partner Settings Radio Buttons 
    const radioButtons = useMemo(() => ([
        {
            id: '1', // acts as primary key, should be unique and non-empty string
            label: 'Matching Profile Alert',
            value: 'option1'
        },
        {
            id: '2',
            label: 'Matching Profile Alert',
            value: 'option2'
        },
        {
            id: '3',
            label: 'Matching Profile Alert',
            value: 'option3'
        }
    ]), []);

    const [selectedRadioId, setSelectedRadioId] = useState();

    // Change Password

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };



    // State and animation values for each menu

    // Personal Menu
    const animatedHeightP = useRef(new Animated.Value(0)).current;
    const rotationP = useRef(new Animated.Value(0)).current;

    // Education Menu
    const [eduMenuOpen, setEduMenuOpen] = useState(false);
    const animatedHeightEdu = useRef(new Animated.Value(0)).current;
    const rotationEdu = useRef(new Animated.Value(0)).current;

    // Family Menu
    const [famMenuOpen, setFamMenuOpen] = useState(false);
    const animatedHeightFam = useRef(new Animated.Value(0)).current;
    const rotationFam = useRef(new Animated.Value(0)).current;

    // Family Menu
    const [horMenuOpen, setHorMenuOpen] = useState(false);
    const animatedHeightHor = useRef(new Animated.Value(0)).current;
    const rotationHor = useRef(new Animated.Value(0)).current;

    const [pvMenuOpen, setPvMenuOpen] = useState(false);
    const animatedHeightPv = useRef(new Animated.Value(0)).current;
    const rotationPv = useRef(new Animated.Value(0)).current;

    // Contact Menu
    const [conMenuOpen, setConMenuOpen] = useState(false);
    const animatedHeightCon = useRef(new Animated.Value(0)).current;
    const rotationCon = useRef(new Animated.Value(0)).current;

    // Function to toggle menu
    const toggleMenu = (menuState, setMenuState, animatedHeight, rotation, height) => {
        const initialValue = menuState ? 1 : 0;
        const finalValue = menuState ? 0 : 1;

        setMenuState(!menuState);

        Animated.timing(animatedHeight, {
            toValue: finalValue,
            duration: 300,
            useNativeDriver: false,
        }).start();

        Animated.timing(rotation, {
            toValue: finalValue,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const heightInterpolate = (animatedHeight, height) => animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, height], // Adjust based on your content height
    });

    const rotateInterpolate = (rotation) => rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });


    // Checkbox State Declaration

    // Alert Settings
    // Matching Profile Alert
    const [asMPAChecked, asMPASetChecked] = useState(false);

    const asMPAHandleCheckboxToggle = () => {
        asMPASetChecked(!asMPAChecked);
    };

    // Profile visitor Alert
    const [asPVAChecked, asPVASetChecked] = useState(false);

    const asPVAHandleCheckboxToggle = () => {
        asPVASetChecked(!asPVAChecked);
    };

    // Recently Updated Profile
    const [asRUPChecked, asRUPSetChecked] = useState(false);

    const asRUPHandleCheckboxToggle = () => {
        asRUPSetChecked(!asRUPChecked);
    };

    // Express Interest Alert
    const [asEIAChecked, asEIASetChecked] = useState(false);

    const asEIAHandleCheckboxToggle = () => {
        asEIASetChecked(!asEIAChecked);
    };

    // Offers & Events 
    const [asOEChecked, asOESetChecked] = useState(false);

    const asOEHandleCheckboxToggle = () => {
        asOESetChecked(!asOEChecked);
    };


    // Partner Settings
    // Matching Profile Alert
    const [pseaMPAChecked, pseaMPASetChecked] = useState(false);

    const pseaMPAHandleCheckboxToggle = () => {
        pseaMPASetChecked(!pseaMPAChecked);
    };

    // Profile visitor Alert
    const [pseaPVAChecked, pseaPVASetChecked] = useState(false);

    const pseaPVAHandleCheckboxToggle = () => {
        pseaPVASetChecked(!pseaPVAChecked);
    };

    // Recently Updated Profile
    const [pseaRUPChecked, pseaRUPSetChecked] = useState(false);

    const pseaRUPHandleCheckboxToggle = () => {
        pseaRUPSetChecked(!pseaRUPChecked);
    };

    // Express Interest Alert
    const [pseaEIAChecked, pseaEIASetChecked] = useState(false);

    const pseaEIAHandleCheckboxToggle = () => {
        pseaEIASetChecked(!pseaEIAChecked);
    };

    // Offers & Events 
    const [pseaOEChecked, pseaOESetChecked] = useState(false);

    const pseaOEHandleCheckboxToggle = () => {
        pseaOESetChecked(!pseaOEChecked);
    };

    // Partner Settings Email Alert
    // Matching Profile Alert
    const [psMPAChecked, psMPASetChecked] = useState(false);

    const psMPAHandleCheckboxToggle = () => {
        psMPASetChecked(!psMPAChecked);
    };

    // Profile visitor Alert
    const [psPVAChecked, psPVASetChecked] = useState(false);

    const psPVAHandleCheckboxToggle = () => {
        psPVASetChecked(!psPVAChecked);
    };

    // Recently Updated Profile
    const [psRUPChecked, psRUPSetChecked] = useState(false);

    const psRUPHandleCheckboxToggle = () => {
        psRUPSetChecked(!psRUPChecked);
    };

    // Express Interest Alert
    const [psEIAChecked, psEIASetChecked] = useState(false);

    const psEIAHandleCheckboxToggle = () => {
        psEIASetChecked(!psEIAChecked);
    };

    // Offers & Events 
    const [psOEChecked, psOESetChecked] = useState(false);

    const psOEHandleCheckboxToggle = () => {
        psOESetChecked(!psOEChecked);
    };

    const [planId, setPlanId] = useState(null);

    useEffect(() => {
        const fetchPlanId = async () => {
            try {
                const id = await AsyncStorage.getItem("selectedPlanId");
                setPlanId(id);
            } catch (e) {
                setPlanId(null);
            }
        };
        fetchPlanId();
    }, []);

    const handleLogout = async () => {
        try {
            await AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: "LoginPage" }] });
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setDeleteLoading(true);
            const profileId =
                (await AsyncStorage.getItem("loginuser_profileId")) ||
                (await AsyncStorage.getItem("profile_id_new"));

            // 📝 Console log the request data before calling the API
            console.log("Sending delete request for Profile ID:", profileId);
            console.log("Payload reasons:", { reason: deleteReason, comments: deleteComments });

            const response = await axios.post(
                `${config.apiUrl}/auth/delete_account/`,
                {
                    profile_id: profileId,
                    reason: deleteReason, // Making sure your backend reasons are passed if required
                    comments: deleteComments
                }
            );

            // 🟢 This only runs if server returns 200 OK status
            console.log("API Success Response:", response.data);
            const { Status, message } = response.data;

            const isDuplicate = message?.includes("Duplicate entry") || message?.includes("duplicate");
            const isAlreadyDeleted = message?.includes("Account already deleted") || message?.includes("already deleted");

            if (Status === 1 || isDuplicate || isAlreadyDeleted) {
                Toast.show({
                    type: "success",
                    text1: "Account Deleted",
                    text2: "Your account has been deleted successfully.",
                    position: "top",
                });

                setTimeout(async () => {
                    await AsyncStorage.clear();
                    navigation.reset({
                        index: 0,
                        routes: [{ name: "LoginPage" }],
                    });
                }, 1500);

            } else {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: message || "Failed to delete account",
                    position: "top",
                });
            }
        } catch (error) {
            // 🔴 This handles 400, 401, 500 errors gracefully
            console.log("Delete Account Error Object:", error);

            let errorMsg = "Something went wrong";

            if (error.response) {
                // The server responded with a status code out of the 2xx range
                console.log("API Error Response Data:", error.response.data);
                console.log("API Error Status Code:", error.response.status);

                // Extract message if it exists in response data
                errorMsg = error.response.data?.message || error.response.data?.Error || "Bad Request (400)";

                // Check if the error data itself mentions it's already deleted or duplicated
                const serverMessage = error.response.data?.message || "";
                const isDuplicate = serverMessage?.includes("Duplicate entry") || serverMessage?.includes("duplicate");
                const isAlreadyDeleted = serverMessage?.includes("Account already deleted") || serverMessage?.includes("already deleted");

                // If the admin side already deleted it, treat it as a success outcome for the user app
                if (isDuplicate || isAlreadyDeleted) {
                    Toast.show({
                        type: "success",
                        text1: "Account Status",
                        text2: "Account is already processed or removed.",
                        position: "top",
                    });

                    setTimeout(async () => {
                        await AsyncStorage.clear();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: "LoginPage" }],
                        });
                    }, 1500);
                    return; // Stop running the rest of the error handler
                }
            } else if (error.request) {
                // The request was made but no response was received
                console.log("API Error Request Context:", error.request);
                errorMsg = "No response from server. Check your network connection.";
            } else {
                // Something happened in setting up the request
                console.log("Error Message:", error.message);
                errorMsg = error.message;
            }

            Toast.show({
                type: "error",
                text1: "Backend Error",
                text2: errorMsg,
                position: "top",
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    // ── UI-only helper: section icon circle + chevron circle used across all accordions ──
    const SectionHeader = ({ icon, iconLib, title, open, onPress }) => {
        const IconLib = iconLib || MaterialIcons;
        return (
            <TouchableWithoutFeedback onPress={onPress}>
                <View style={styles.detailsMenu}>
                    <View style={styles.iconMenuFlex}>
                        <View style={styles.accordionIconCircle}>
                            <IconLib name={icon} size={18} color={Colors.matchingcirclecolor} />
                        </View>
                        <Text style={styles.menuName}>{title}</Text>
                    </View>
                    <View style={styles.chevronCircle}>
                        <MaterialIcons
                            name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                            size={20}
                            color="#8B0000"
                        />
                    </View>
                </View>
            </TouchableWithoutFeedback>
        );
    };

    return (
        <SafeAreaView  style={{ flex: 1, backgroundColor: Colors.cardBackground || "#FAF6F0" }}>
            <ScrollView>
                <View style={styles.container}>

                    {/* Gradient Header Banner — matches Home/Search style */}
                    <LinearGradient
                        colors={[Colors.primaryGradientStart || "#A00014", Colors.primaryGradientEnd || "#4A000A"]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.headerBanner}
                    >
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>Other Settings</Text>
                            <Text style={styles.headerSubtitle}>Manage your account & preferences</Text>
                        </View>
                    </LinearGradient>

                    {/* Alert Settings */}
                    <View style={styles.accordionCard}>
                        <SectionHeader
                            icon="notifications"
                            title="Alert Settings"
                            open={pMenuOpen}
                            onPress={() => toggleMenu(pMenuOpen, setPMenuOpen, animatedHeightP, rotationP, 200)}
                        />

                        {pMenuOpen && (
                            <View style={styles.accordionContent}>

                                {/* Hide Reason */}
                                <Text style={styles.fieldLabel}>
                                    HIDE REASON <Text style={{ color: "red" }}>*</Text>
                                </Text>

                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={hideReason}
                                        onValueChange={(itemValue) =>
                                            setHideReason(itemValue)
                                        }
                                    >
                                        <Picker.Item
                                            label="Select Reason"
                                            value=""
                                        />

                                        <Picker.Item
                                            label="Temporary Hide"
                                            value="Temporary Hide"
                                        />

                                        <Picker.Item
                                            label="Take a Break"
                                            value="Take a Break"
                                        />

                                        <Picker.Item
                                            label="Marriage Settled"
                                            value="Marriage Settled"
                                        />

                                        <Picker.Item
                                            label="Personal Reason"
                                            value="Personal Reason"
                                        />

                                        <Picker.Item
                                            label="Others"
                                            value="Others"
                                        />
                                    </Picker>
                                </View>

                                {/* Others Reason */}
                                {hideReason === "Others" && (
                                    <>
                                        <Text style={styles.fieldLabel}>
                                            ENTER REASON
                                        </Text>

                                        <TextInput
                                            style={[styles.input, { height: 100 }]}
                                            multiline
                                            value={otherReason}           // ✅ FIXED
                                            onChangeText={setOtherReason} // ✅ FIXED
                                            placeholder="Enter your reason"
                                            placeholderTextColor="#71717A"
                                        />
                                    </>
                                )}

                                {/* Profile ID */}
                                <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                                    VYSYAMALA GROOM/BRIDE ID
                                    <Text style={{ color: "red" }}> *</Text>
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    value={profileId}
                                    onChangeText={setProfileId}
                                    placeholder="Enter Profile ID"
                                    placeholderTextColor="#71717A"
                                />

                                {/* Engagement Date */}
                                <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                                    ENGAGEMENT DATE
                                    <Text style={{ color: "red" }}> *</Text>
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#71717A"
                                    value={engagementDate}
                                    onChangeText={setEngagementDate}
                                />

                                {/* Comments */}
                                <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                                    COMMENTS
                                </Text>

                                <TextInput
                                    style={[
                                        styles.input,
                                        { height: 100 }
                                    ]}
                                    multiline
                                    value={comments}
                                    onChangeText={setComments}
                                    placeholder="Comments"
                                    placeholderTextColor="#71717A"
                                />

                                <TouchableOpacity
                                    style={styles.btn}
                                    onPress={handleHideProfile}
                                    disabled={hideLoading}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, Colors.primary]}
                                        style={styles.linearGradient}
                                    >
                                        <Text style={styles.login}>
                                            {hideLoading
                                                ? "Submitting..."
                                                : "Submit"}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                            </View>
                        )}
                    </View>

                    {/* Photo / ID Settings */}
                    <View style={styles.accordionCard}>
                        <SectionHeader
                            icon="image"
                            title="Photo / ID Settings"
                            open={eduMenuOpen}
                            onPress={() => toggleMenu(eduMenuOpen, setEduMenuOpen, animatedHeightEdu, rotationEdu, 800)}
                        />

                        {eduMenuOpen && (
                            <View style={styles.accordionContent}>

                                {/* Horoscope Image */}
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={styles.fieldLabel}>HOROSCOPE IMAGE</Text>
                                    <TouchableOpacity style={styles.uploadContainer} onPress={() => pickImage('horoscope')}>
                                        <Feather name="upload-cloud" size={20} color="#71717A" style={{ marginBottom: 6 }} />
                                        <Text style={styles.uploadText}>
                                            {horoscopeFile ? horoscopeFile.fileName : `Select Horoscope Image`}
                                        </Text>
                                    </TouchableOpacity>
                                    {uploadedHoroscope && !horoscopeFile && (
                                        <View style={styles.fileItem}>
                                            <Image source={{ uri: uploadedHoroscope }} style={styles.fileImage} />
                                            <View style={styles.fileDetails}>
                                                <Text style={styles.checkboxLabel} numberOfLines={1}>
                                                    {uploadedHoroscope.split('/').pop()}
                                                </Text>
                                                <Text style={styles.uploadedStatus}>Uploaded Files</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* ID Proof */}
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={styles.fieldLabel}>ID PROOF</Text>
                                    <TouchableOpacity style={styles.uploadContainer} onPress={() => pickImage('idproof')}>
                                        <Feather name="upload-cloud" size={20} color="#71717A" style={{ marginBottom: 6 }} />
                                        <Text style={styles.uploadText}>
                                            {idProofFile ? idProofFile.fileName : `Select ID Proof`}
                                        </Text>
                                    </TouchableOpacity>
                                    {uploadedIDProof && !idProofFile && (
                                        <View style={styles.fileItem}>
                                            <Image source={{ uri: uploadedIDProof }} style={styles.fileImage} />
                                            <View style={styles.fileDetails}>
                                                <Text style={styles.checkboxLabel} numberOfLines={1}>
                                                    {uploadedIDProof.split('/').pop()}
                                                </Text>
                                                <Text style={styles.uploadedStatus}>Uploaded Files</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Divorce Proof - only for marital status 2 */}
                                {maritalStatus === "2" && (
                                    <View style={{ marginBottom: 20 }}>
                                        <Text style={styles.fieldLabel}>DIVORCE PROOF</Text>
                                        <TouchableOpacity style={styles.uploadContainer} onPress={() => pickImage('divorce')}>
                                            <Feather name="upload-cloud" size={20} color="#71717A" style={{ marginBottom: 6 }} />
                                            <Text style={styles.uploadText}>
                                                {divorceFile ? divorceFile.fileName : `Select Divorce Proof`}
                                            </Text>
                                        </TouchableOpacity>
                                        {uploadedDivorceProof && !divorceFile && (
                                            <View style={styles.fileItem}>
                                                <Image source={{ uri: uploadedDivorceProof }} style={styles.fileImage} />
                                                <View style={styles.fileDetails}>
                                                    <Text style={styles.checkboxLabel} numberOfLines={1}>
                                                        {uploadedDivorceProof.split('/').pop()}
                                                    </Text>
                                                    <Text style={styles.uploadedStatus}>Uploaded Files</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Password Protection */}
                                <TouchableOpacity style={styles.checkboxContainer} activeOpacity={0.8} onPress={() => setChecked(!checked)}>
                                    <View style={[styles.checkboxBase, checked && styles.checkboxChecked]}>
                                        {checked && <Ionicons name="checkmark" size={14} color="white" />}
                                    </View>
                                    <Text style={styles.checkboxLabel}>Protect my images with password (only people you share the password with can view the images)</Text>
                                </TouchableOpacity>

                                {checked && (
                                    <View style={styles.passwordInputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter Password"
                                            placeholderTextColor="#71717A"
                                            secureTextEntry={!showPassword}
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                        <Pressable
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.passwordIcon}
                                        >
                                            <Ionicons
                                                name={showPassword ? "eye" : "eye-off"}
                                                size={18}
                                                color="#535665"
                                            />
                                        </Pressable>
                                    </View>
                                )}

                                {/* Video URL */}
                                <Text style={[styles.fieldLabel, { marginTop: 15 }]}>UPLOAD VIDEO LINK</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="URL"
                                    placeholderTextColor="#71717A"
                                    value={videoUrl}
                                    onChangeText={setVideoUrl}
                                />
                                <Text style={styles.helperNote}>
                                    Note: If video link is not available, you can share the videos to Vysyamala's admin WhatsApp No.9043085524.
                                </Text>

                                {currentPlanId === "16" && (
                                    <>
                                        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>DELIGHT VISIBILITY SETTING</Text>
                                        <View style={styles.segmentedContainer}>
                                            <TouchableOpacity
                                                style={[styles.segmentedBtn, allowVisit === 1 && styles.segmentedBtnActive]}
                                                onPress={() => setAllowVisit(1)}
                                            >
                                                <Text style={[styles.segmentedText, allowVisit === 1 && styles.segmentedTextActive]}>Yes</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.segmentedBtn, allowVisit === 0 && styles.segmentedBtnActive]}
                                                onPress={() => setAllowVisit(0)}
                                            >
                                                <Text style={[styles.segmentedText, allowVisit === 0 && styles.segmentedTextActive]}>No</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}

                                <TouchableOpacity style={styles.btn} onPress={handleSubmitPhotoSettings}>
                                    <LinearGradient colors={[Colors.primary, Colors.primary]} style={styles.linearGradient}>
                                        <Text style={styles.login}>Save</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                            </View>
                        )}
                    </View>

                    {/* Partner Settings */}
                    <View style={styles.accordionCard}>
                        <SectionHeader
                            icon="user-gear"
                            iconLib={FontAwesome6}
                            title="Partner Settings"
                            open={famMenuOpen}
                            onPress={() => toggleMenu(famMenuOpen, setFamMenuOpen, animatedHeightFam, rotationFam, 900)}
                        />

                        {famMenuOpen && (
                            <View style={styles.accordionContent}>
                                <PartnerSettings />
                            </View>
                        )}
                    </View>

                    {(planId === "3" || planId === "17") && (
                        <View style={styles.accordionCard}>
                            <SectionHeader
                                icon="user-gear"
                                iconLib={FontAwesome6}
                                title="Profile Visibility"
                                open={pvMenuOpen}
                                onPress={() => toggleMenu(pvMenuOpen, setPvMenuOpen, animatedHeightPv, rotationPv, 900)}
                            />

                            {pvMenuOpen && (
                                <View style={styles.accordionContent}>
                                    <ProfileVisibility />
                                </View>
                            )}
                        </View>
                    )}

                    {/* Change Password */}
                    <View style={styles.accordionCard}>
                        <SectionHeader
                            icon="lock"
                            title="Change Password"
                            open={horMenuOpen}
                            onPress={() => toggleMenu(horMenuOpen, setHorMenuOpen, animatedHeightHor, rotationHor, 1360)}
                        />

                        {horMenuOpen && (

                            <View style={styles.accordionContent}>
                                <View>
                                    {/* Enter Old Password */}
                                    <View>
                                        <Text style={styles.fieldLabel}>ENTER OLD PASSWORD</Text>
                                        <View style={styles.passwordInputContainer}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter Old Password"
                                                placeholderTextColor="#71717A"
                                                secureTextEntry={!showOldPassword}
                                                value={oldPassword}
                                                onChangeText={setOldPassword}
                                            />
                                            <Pressable
                                                onPress={() => setShowOldPassword((prev) => !prev)}
                                                style={styles.passwordIcon}
                                            >
                                                <Ionicons name={showOldPassword ? "eye" : "eye-off"} size={18} color="#535665" />

                                            </Pressable>
                                        </View>
                                        {oldPasswordError ? <Text style={styles.errorText}>{oldPasswordError}</Text> : null}
                                    </View>

                                    {/* Enter New Password */}
                                    <View>
                                        <Text style={[styles.fieldLabel, { marginTop: 10 }]}>ENTER NEW PASSWORD</Text>
                                        <View style={styles.passwordInputContainer}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter New Password"
                                                placeholderTextColor="#71717A"
                                                secureTextEntry={!showNewPassword}
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                            />
                                            <Pressable
                                                onPress={() => setShowNewPassword((prev) => !prev)}
                                                style={styles.passwordIcon}
                                            >
                                                <Ionicons name={showNewPassword ? "eye" : "eye-off"} size={18} color="#535665" />
                                            </Pressable>
                                        </View>
                                        {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}
                                    </View>

                                    {/* Confirm New Password */}
                                    <View>
                                        <Text style={[styles.fieldLabel, { marginTop: 10 }]}>CONFIRM NEW PASSWORD</Text>
                                        <View style={styles.passwordInputContainer}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Confirm New Password"
                                                placeholderTextColor="#71717A"
                                                secureTextEntry={!showConfirmPassword}
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                            />
                                            <Pressable
                                                onPress={() => setShowConfirmPassword((prev) => !prev)}
                                                style={styles.passwordIcon}
                                            >
                                                <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={18} color="#535665" />
                                            </Pressable>
                                        </View>
                                        {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                                    </View>

                                    {/* Save Button */}
                                    <View style={styles.formContainer1}>
                                        <TouchableOpacity
                                            style={styles.btn}
                                            onPress={handleChangePassword}>
                                            <LinearGradient
                                                colors={[Colors.primary, Colors.primary]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                useAngle={true}
                                                angle={92.08}
                                                angleCenter={{ x: 0.5, y: 0.5 }}
                                                style={styles.linearGradient}>
                                                <View style={styles.loginContainer}>
                                                    <Text style={styles.login}>Save</Text>
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Delete Account Menu */}
                    <View style={styles.accordionCard}>
                        <SectionHeader
                            icon="delete-forever"
                            title="Delete Account"
                            open={deleteMenuOpen}
                            onPress={() => toggleMenu(deleteMenuOpen, setDeleteMenuOpen, new Animated.Value(0), rotationDelete, 300)}
                        />

                        {deleteMenuOpen && (
                            <View style={styles.accordionContent}>
                                <Text style={styles.fieldLabel}>
                                    REASON <Text style={{ color: "red" }}>*</Text>
                                </Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={deleteReason}
                                        onValueChange={(itemValue) => setDeleteReason(itemValue)}
                                    >
                                        <Picker.Item label="Select Reason" value="" />
                                        <Picker.Item label="Marriage Settled" value="Marriage Settled" />
                                        <Picker.Item label="Personal Reason" value="Personal Reason" />
                                        <Picker.Item label="Others" value="Others" />
                                    </Picker>
                                </View>

                                {deleteReason !== "" && (
                                    <>
                                        <Text style={styles.fieldLabel}>COMMENTS</Text>
                                        <TextInput
                                            style={[styles.input, { height: 80, marginBottom: 15 }]}
                                            multiline
                                            value={deleteComments}
                                            onChangeText={setDeleteComments}
                                            placeholder="Enter your comments"
                                            placeholderTextColor="#71717A"
                                        />
                                    </>
                                )}

                                <TouchableOpacity
                                    style={styles.btndelete}
                                    onPress={handleDeleteAccount}
                                    disabled={deleteLoading}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, Colors.primary]}
                                        style={styles.linearGradient}
                                    >
                                        <Text style={styles.login}>
                                            {deleteLoading ? "Deleting..." : "Delete Account"}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>


                    {/* Hide My Profile Menu */}
                    <View style={styles.accordionCard}>
                        <SectionHeader
                            icon="visibility-off"
                            title="Hide My Profile"
                            open={hideMenuOpen}
                            onPress={() =>
                                toggleMenu(
                                    hideMenuOpen,
                                    setHideMenuOpen,
                                    animatedHeightHide,
                                    rotationHide,
                                    600
                                )
                            }
                        />

                        {hideMenuOpen && (
                            <View style={styles.accordionContent}>

                                {/* Hide Reason */}
                                <Text style={styles.fieldLabel}>
                                    HIDE REASON <Text style={{ color: "red" }}>*</Text>
                                </Text>

                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={hideReason}
                                        onValueChange={(itemValue) =>
                                            setHideReason(itemValue)
                                        }
                                    >
                                        <Picker.Item
                                            label="Select Reason"
                                            value=""
                                        />

                                        <Picker.Item
                                            label="Temporary Hide"
                                            value="Temporary Hide"
                                        />

                                        <Picker.Item
                                            label="Take a Break"
                                            value="Take a Break"
                                        />

                                        <Picker.Item
                                            label="Marriage Settled"
                                            value="Marriage Settled"
                                        />

                                        <Picker.Item
                                            label="Personal Reason"
                                            value="Personal Reason"
                                        />

                                        <Picker.Item
                                            label="Others"
                                            value="Others"
                                        />
                                    </Picker>
                                </View>

                                {/* Others Reason */}
                                {hideReason === "Others" && (
                                    <>
                                        <Text style={styles.fieldLabel}>
                                            ENTER REASON
                                        </Text>

                                        <TextInput
                                            style={[
                                                styles.input,
                                                { height: 100 }
                                            ]}
                                            multiline
                                            value={comments}
                                            onChangeText={setComments}
                                            placeholder="Enter your reason"
                                            placeholderTextColor="#71717A"
                                        />
                                    </>
                                )}

                                {/* Profile ID */}
                                <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                                    VYSYAMALA GROOM/BRIDE ID
                                    <Text style={{ color: "red" }}> *</Text>
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    value={profileId}
                                    onChangeText={setProfileId}
                                    placeholder="Enter Profile ID"
                                    placeholderTextColor="#71717A"
                                />

                                {/* Engagement Date */}
                                {/* Engagement Date Selector Row */}
                                <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                                    ENGAGEMENT DATE <Text style={{ color: "red" }}> *</Text>
                                </Text>

                                <TouchableOpacity
                                    style={styles.calendarTriggerButton}
                                    onPress={() => setShowHideCalendar(true)}
                                >
                                    <Text style={[styles.calendarTriggerText, !engagementDate && { color: "#888" }]}>
                                        {engagementDate ? engagementDate : "Select Engagement Date"}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={20} color="#ED1E24" />
                                </TouchableOpacity>

                                {showHideCalendar && (
                                    <View>
                                        <DateTimePicker
                                            value={calendarDate}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onHideDateChange}
                                        // maximumDate={new Date()} // Disallows future selections
                                        />
                                        {Platform.OS === 'ios' && (
                                            <TouchableOpacity
                                                style={styles.iosConfirmButton}
                                                onPress={() => setShowHideCalendar(false)}
                                            >
                                                <Text style={styles.iosConfirmButtonText}>Confirm Date</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {/* Comments */}
                                <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                                    COMMENTS
                                </Text>

                                <TextInput
                                    style={[
                                        styles.input,
                                        { height: 100 }
                                    ]}
                                    multiline
                                    value={comments}
                                    onChangeText={setComments}
                                    placeholder="Comments"
                                    placeholderTextColor="#71717A"
                                />

                                <TouchableOpacity
                                    style={styles.btn}
                                    onPress={handleHideProfile}
                                    disabled={hideLoading}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, Colors.primary]}
                                        style={styles.linearGradient}
                                    >
                                        <Text style={styles.login}>
                                            {hideLoading
                                                ? "Submitting..."
                                                : "Submit"}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                            </View>
                        )}
                    </View>
                </View>
            </ScrollView >
            <BottomTabBarComponent />
        </SafeAreaView >
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background || "#F4F4F4",
        paddingBottom: 200,
    },
    errorText: {
        color: "#ED1E24",
        fontSize: 13,
        marginBottom: 5,
        marginLeft: 5,
        fontFamily: "inter",
        fontWeight: "bold",
    },

    // ── Gradient Header — matches Search.js headerBanner ─────────────────────
    headerBanner: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: rs(12, 16, 20),
        paddingBottom: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    backBtn: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 13,
        color: "rgba(255, 255, 255, 0.7)",
        marginTop: 2,
    },

    // ── Accordion Card — matches Search.js accordionCard ─────────────────────
    accordionCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 28,
        marginHorizontal: 16,
        marginVertical: 6,
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
    },
    detailsMenu: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        alignSelf: "center",
    },
    accordionIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.iconContainerBg,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    chevronCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.selectedBg,
        alignItems: "center",
        justifyContent: "center",
    },
    accordionContent: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F4F4F5",
    },

    menuName: {
        color: "#18181B",
        fontSize: 15,
        fontWeight: "700",
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    },

    iconMenuFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        flex: 1,
    },

    fieldLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#71717A",
        textTransform: "uppercase",
        marginBottom: 8,
        letterSpacing: 0.3,
    },

    helperNote: {
        fontSize: 12,
        color: "#71717A",
        marginTop: 6,
        lineHeight: 17,
    },

    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },

    checkboxBase: {
        width: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#E4E4E7",
        backgroundColor: "transparent",
        marginRight: 10,
    },

    checkboxChecked: {
        backgroundColor: Colors.primary || "#BD1225",
        borderColor: Colors.primary || "#BD1225",
    },

    checkboxLabel: {
        fontSize: 14,
        color: "#3F3F46",
        flex: 1,
    },

    pickerWrapper: {
        borderWidth: 1,
        borderColor: "#E4E4E7",
        borderRadius: 16,
        marginBottom: 15,
        backgroundColor: Colors.selectedBg,
        overflow: "hidden",
    },

    passwordInputContainer: {
        width: "100%",
    },

    input: {
        color: "#18181B",
        borderWidth: 1,
        borderRadius: 16,
        borderColor: "#E4E4E7",
        padding: 12,
        fontFamily: "inter",
        backgroundColor: Colors.selectedBg,
        marginBottom: 6,
    },

    passwordIcon: {
        position: "absolute",
        right: 14,
        top: 16,
    },

    // Upload Images Style
    uploadContainer: {
        borderWidth: 1.5,
        borderColor: "#E4E4E7",
        borderStyle: "dashed",
        borderRadius: 20,
        padding: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        backgroundColor: Colors.selectedBg,
    },

    uploadText: {
        color: "#71717A",
        fontSize: 13,
    },

    fileItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.selectedBg,
        padding: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F4F4F5",
        marginBottom: 10,
    },
    fileImage: {
        width: 45,
        height: 45,
        borderRadius: 10,
        marginRight: 12,
    },
    fileDetails: {
        flex: 1,
        justifyContent: 'center'
    },
    uploadedStatus: {
        fontSize: 11,
        color: "#2E7D32",
        fontWeight: "600",
        marginTop: 2
    },

    // ── Segmented control — matches Search.js SegmentedRadio ────────────────
    segmentedContainer: {
        flexDirection: "row",
        backgroundColor: Colors.selectedBg,
        borderRadius: 20,
        padding: 8,
        marginTop: 4,
        marginBottom: 15,
    },
    segmentedBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 18,
    },
    segmentedBtnActive: {
        backgroundColor: Colors.primary || "#BD1225",
    },
    segmentedText: {
        fontSize: 13,
        color: "#71717A",
        fontWeight: "600",
    },
    segmentedTextActive: {
        color: "#FFFFFF",
    },

    loginContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    login: {
        textAlign: "center",
        color: "white",
        fontWeight: "600",
        fontSize: 16,
        letterSpacing: 1,
        fontFamily: "inter",
        marginRight: 5,
    },
    formContainer1: {
        width: "100%",
    },

    linearGradient: {
        borderRadius: 26,
        justifyContent: "center",
        padding: 15,
    },
    btndelete: {
        width: "60%",
        alignSelf: "center",
        borderRadius: 26,
        marginBottom: 10,
        marginTop: 10,
        elevation: 3,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },

    btn: {
        width: "50%",
        alignSelf: "center",
        borderRadius: 26,
        marginBottom: 10,
        marginTop: 10,
        elevation: 3,
        shadowColor: "#BD1225",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },

    calendarTriggerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#E4E4E7",
        borderRadius: 16,
        padding: 12,
        backgroundColor: Colors.selectedBg,
        marginBottom: 10
    },
    calendarTriggerText: {
        fontSize: 14,
        color: "#535665",
        fontFamily: "inter"
    },
    iosConfirmButton: {
        padding: 12,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        marginTop: 5,
        borderRadius: 16
    },
    iosConfirmButtonText: {
        color: "#ED1E24",
        fontWeight: "700",
        fontSize: 14
    }
});