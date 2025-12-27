import React, { useState, useEffect, useRef } from 'react'
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    Switch,
    SafeAreaView,
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

    useEffect(() => {
        const fetchInitialSettings = async () => {
            try {
                const profileId = await AsyncStorage.getItem("loginuser_profileId") ||
                    await AsyncStorage.getItem("profile_id_new");

                if (!profileId) return;

                const response = await axios.post("https://app.vysyamala.com/auth/Get_save_details/", {
                    profile_id: profileId,
                    page_id: "2", // Consistent with your web logic
                });

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

                    if (isProtected && data.Photo_password) {
                        setPassword(data.Photo_password);
                    }
                }
            } catch (error) {
                console.error("Error fetching saved details:", error);
            }
        };

        fetchInitialSettings();
    }, []);

    const handleSubmitPhotoSettings = async () => {
        // Note: AsyncStorage.getItem is asynchronous, so we must await it
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
        console.log("Photo_ID_settiings formdata", formData)
        // Helper to append files safely
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
            const response = await axios.post("https://app.vysyamala.com/auth/Photo_Id_Settings/", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                // Optional: Track upload progress like your web version
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`Upload Progress: ${percentCompleted}%`);
                }
            });

            // Axios stores data in response.data
            const result = response.data;

            if (result.status === 'success' || result.Status === 1) {
                Toast.show({
                    type: 'success',
                    text1: 'Photo Settings Updated Successfully',
                    position: 'bottom'
                });
                // Clear temporary file states if needed
            } else {
                Toast.show({
                    type: 'error',
                    text1: result.message || 'Photo Settings Update Failed',
                    position: 'bottom'
                });
            }
        } catch (error) {
            console.error("Axios Error:", error);
            Toast.show({
                type: 'error',
                text1: 'Network Error: Failed to upload settings',
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


    // useEffect(() => {
    //     const getAlertSettings = async () => {
    //         try {
    //             const alerts = await fetchAlertSettings();
    //             console.log("alerts", alerts);
    //             // Set the checked state based on the fetched alert IDs
    //             const initialCheckedAlerts = {};
    //             alerts.forEach(alert => {
    //                 initialCheckedAlerts[`email_${alert.id}`] = true; // Assuming email and SMS have the same IDs
    //                 initialCheckedAlerts[`sms_${alert.id}`] = true;
    //             });

    //             setCheckedAlerts(initialCheckedAlerts);

    //             // Separate email and SMS alerts if needed
    //             setEmailAlerts(alerts); // For simplicity, assuming all alerts are for email in this case
    //             setSmsAlerts(alerts); // Same for SMS alerts
    //         } catch (error) {
    //             console.error('Error setting up alert settings:', error);
    //         }
    //     };

    //     getAlertSettings();
    // }, []);


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



    // Function to handle file selection for different types

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

    return (
        <View style={{ flex: 1 }}>
            <ScrollView>
                <View style={styles.container}>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#ED1E24" />
                        </TouchableOpacity>

                        <Text style={styles.headerText}>
                            {"Other Settings"}
                        </Text>
                    </View>
                    {/* <View style={styles.contentContainer}>
                    <Text style={styles.profileName}>Other Settings */}
                    {/* <Text style={styles.profileId}> (05)</Text> */}
                    {/* </Text>
                </View> */}

                    {/* Alert Settings */}
                    <View>
                        <TouchableWithoutFeedback onPress={() => toggleMenu(pMenuOpen, setPMenuOpen, animatedHeightP, rotationP, 200)}>
                            <View style={styles.detailsMenu}>
                                <View style={styles.iconMenuFlex}>
                                    <MaterialIcons name="notifications" size={18} color="#fff" style={styles.saveIcon} />
                                    <Text style={styles.menuName}>Alert Settings</Text>
                                </View>
                                <Animated.View style={{ transform: [{ rotate: rotateInterpolate(rotationP) }] }}>
                                    <MaterialIcons name="arrow-drop-down" size={18} color="#fff" style={styles.saveIcon} />
                                </Animated.View>
                            </View>
                        </TouchableWithoutFeedback>

                        <Animated.View style={[styles.menuContainer, { height: pMenuOpen ? 'auto' : 0 }]}>
                            {pMenuOpen && (
                                <View style={styles.editOptions}>
                                    <ScrollView style={styles.scrollView}>
                                        {/* Email Alerts */}
                                        <View style={styles.checkBoxList}>
                                            <Text style={styles.subCaption}>Email Alerts</Text>
                                            {emailAlerts.map(alert => (
                                                <View key={`email_${alert.id}`} style={styles.checkboxContainer}>
                                                    <Pressable
                                                        style={[
                                                            styles.checkboxBase,
                                                            checkedAlerts[`email_${alert.id}`] && styles.checkboxChecked,
                                                        ]}
                                                        onPress={() => handleCheckboxToggle(`email_${alert.id}`)}
                                                    >
                                                        {checkedAlerts[`email_${alert.id}`] && (
                                                            <Ionicons name="checkmark" size={14} color="white" />
                                                        )}
                                                    </Pressable>
                                                    <Pressable onPress={() => handleCheckboxToggle(`email_${alert.id}`)}>
                                                        <Text style={styles.checkboxLabel}>{alert.alert_name}</Text>
                                                    </Pressable>
                                                </View>
                                            ))}
                                        </View>

                                        {/* SMS Alerts */}
                                        <View style={styles.checkBoxList}>
                                            <Text style={styles.subCaption}>SMS Alerts</Text>
                                            {smsAlerts.map(alert => (
                                                <View key={`sms_${alert.id}`} style={styles.checkboxContainer}>
                                                    <Pressable
                                                        style={[
                                                            styles.checkboxBase,
                                                            checkedAlerts[`sms_${alert.id}`] && styles.checkboxChecked,
                                                        ]}
                                                        onPress={() => handleCheckboxToggle(`sms_${alert.id}`)}
                                                    >
                                                        {checkedAlerts[`sms_${alert.id}`] && (
                                                            <Ionicons name="checkmark" size={14} color="white" />
                                                        )}
                                                    </Pressable>
                                                    <Pressable onPress={() => handleCheckboxToggle(`sms_${alert.id}`)}>
                                                        <Text style={styles.checkboxLabel}>{alert.alert_name}</Text>
                                                    </Pressable>
                                                </View>
                                            ))}

                                        </View>
                                    </ScrollView>

                                    {/* Save Button */}
                                    {/* <Button title="Save" onPress={handleSave} /> */}
                                    <View style={styles.formContainer1}>
                                        <TouchableOpacity
                                            style={styles.btn}
                                            onPress={handleSave}
                                        >
                                            <LinearGradient
                                                colors={["#BD1225", "#FF4050"]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                useAngle={true}
                                                angle={92.08}
                                                angleCenter={{ x: 0.5, y: 0.5 }}
                                                style={styles.linearGradient}
                                            >
                                                <View style={styles.loginContainer}>
                                                    <Text style={styles.login}>Save</Text>
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </Animated.View>
                    </View>

                    {/* Education & Profession Details */}
                    <View>
                        <TouchableWithoutFeedback onPress={() => toggleMenu(eduMenuOpen, setEduMenuOpen, animatedHeightEdu, rotationEdu, 800)}>
                            <View style={styles.detailsMenu}>
                                <View style={styles.iconMenuFlex}>
                                    <MaterialIcons name="image" size={18} color="#fff" style={styles.saveIcon} />
                                    <Text style={styles.menuName}>Photo / ID Settings</Text>
                                </View>

                                <Animated.View style={{ transform: [{ rotate: rotateInterpolate(rotationEdu) }] }}>
                                    <MaterialIcons name="arrow-drop-down" size={18} color="#fff" style={styles.saveIcon} />
                                </Animated.View>
                            </View>
                        </TouchableWithoutFeedback>

                        {/* {eduMenuOpen && (
                            <View style={styles.editOptions}>
                                <View style={styles.formContainer}>
                                    <View style={styles.checkboxContainer}>
                                        <Pressable
                                            style={[styles.checkboxBase, checked && styles.checkboxChecked]}
                                            onPress={handleCheckboxTogglePassword}
                                        >
                                            {checked && <Ionicons name="checkmark" size={14} color="white" />}
                                        </Pressable>

                                        <Pressable onPress={handleCheckboxTogglePassword}>
                                            <Text style={styles.checkboxLabel}>
                                                Protect my images with password (only people you share the password can view the images)
                                            </Text>
                                        </Pressable>
                                    </View>

                                    {checked && (
                                        <View>
                                            <Text style={styles.label}>
                                                Enter Password<Text style={styles.redText}>*</Text>
                                            </Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Password"
                                                secureTextEntry={!showPassword}
                                                value={password}
                                                onChangeText={setPassword}
                                            />
                                            <Pressable
                                                onPress={togglePasswordVisibility}
                                                style={styles.passwordIDIcon}
                                            >
                                                <AntDesign
                                                    name={showPassword ? 'eye' : 'eyeo'}
                                                    size={18}
                                                    color="#535665"
                                                />
                                            </Pressable>
                                        </View>
                                    )}
                                    {checked && (
                                        <Button title="Save" onPress={handleSavePassword} />
                                    )}
                                </View>
                            </View>
                        )} */}
                        {eduMenuOpen && (
                            <View style={styles.editOptions}>
                                {renderFilePreview = (label, currentFile, uploadedUrl, type) => (
                                    <View style={{ marginBottom: 20 }}>
                                        <Text style={styles.label}>{label}</Text>
                                        <TouchableOpacity style={styles.uploadContainer} onPress={() => pickImage(type)}>
                                            <Text style={styles.uploadText}>
                                                {currentFile ? currentFile.fileName : `Select ${label}`}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Show Uploaded File (Like your reference image) */}
                                        {uploadedUrl && !currentFile && (
                                            <View style={styles.fileItem}>
                                                <Image source={{ uri: uploadedUrl }} style={styles.fileImage} />
                                                <View style={styles.fileDetails}>
                                                    <Text style={styles.checkboxLabel} numberOfLines={1}>
                                                        {uploadedUrl.split('/').pop()}
                                                    </Text>
                                                    <Text style={styles.uploadedStatus}>Uploaded Files</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {renderFilePreview("Horoscope Image", horoscopeFile, uploadedHoroscope, 'horoscope')}
                                {renderFilePreview("ID Proof", idProofFile, uploadedIDProof, 'idproof')}

                                {maritalStatus === "2" &&
                                    renderFilePreview("Divorce Proof", divorceFile, uploadedDivorceProof, 'divorce')
                                }


                                {/* Password Protection */}
                                <View style={styles.checkboxContainer}>
                                    <Pressable style={[styles.checkboxBase, checked && styles.checkboxChecked]} onPress={() => setChecked(!checked)}>
                                        {checked && <Ionicons name="checkmark" size={14} color="white" />}
                                    </Pressable>
                                    <Text style={styles.checkboxLabel}>Protect my images with password (only people you share the password with can view the images)</Text>
                                </View>

                                {checked && (
                                    <View style={styles.passwordInputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter Password"
                                            // Use the showPassword state to toggle visibility
                                            secureTextEntry={!showPassword}
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                        <Pressable
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.passwordIcon}
                                        >
                                            <AntDesign
                                                name={showPassword ? "eye" : "eyeo"}
                                                size={18}
                                                color="#535665"
                                            />
                                        </Pressable>
                                    </View>
                                )}
                                {/* Video URL */}
                                <Text style={[styles.label, { marginTop: 15 }]}>Upload Video Link</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="URL"
                                    value={videoUrl}
                                    onChangeText={setVideoUrl}
                                />
                                <Text style={styles.checkboxLabel}>
                                    Note: If video link is not available, you can share the videos to Vysyamala's admin WhatsApp No.9043085524.
                                </Text>

                                <TouchableOpacity style={styles.btn} onPress={handleSubmitPhotoSettings}>
                                    <LinearGradient colors={["#BD1225", "#FF4050"]} style={styles.linearGradient}>
                                        <Text style={styles.login}>Save</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Partner Settings */}
                    <View style={{ flex: 1 }}>
                        <TouchableWithoutFeedback onPress={() => toggleMenu(famMenuOpen, setFamMenuOpen, animatedHeightFam, rotationFam, 900)}>
                            <View style={styles.detailsMenu}>
                                <View style={styles.iconMenuFlex}>
                                    <FontAwesome6 name="user-gear" size={18} color="#fff" style={styles.saveIcon} />
                                    <Text style={styles.menuName}>Partner Settings</Text>
                                </View>

                                <Animated.View style={{ transform: [{ rotate: rotateInterpolate(rotationFam) }] }}>
                                    <MaterialIcons name="arrow-drop-down" size={18} color="#fff" style={styles.saveIcon} />
                                </Animated.View>
                            </View>
                        </TouchableWithoutFeedback>

                        <Animated.View >
                            {famMenuOpen && (
                                <ScrollView style={styles.scrollView}>
                                    <PartnerSettings />
                                </ScrollView>
                            )}
                        </Animated.View>
                    </View>

                    {planId === "3" || planId === "17" && (
                        <View style={{ flex: 1 }}>
                            <TouchableWithoutFeedback onPress={() => toggleMenu(pvMenuOpen, setPvMenuOpen, animatedHeightPv, rotationPv, 900)}>
                                <View style={styles.detailsMenu}>
                                    <View style={styles.iconMenuFlex}>
                                        <FontAwesome6 name="user-gear" size={18} color="#fff" style={styles.saveIcon} />
                                        <Text style={styles.menuName}>Profile Visibility</Text>
                                    </View>

                                    <Animated.View style={{ transform: [{ rotate: rotateInterpolate(rotationPv) }] }}>
                                        <MaterialIcons name="arrow-drop-down" size={18} color="#fff" style={styles.saveIcon} />
                                    </Animated.View>
                                </View>
                            </TouchableWithoutFeedback>

                            <Animated.View >
                                {pvMenuOpen && (
                                    <ScrollView style={styles.scrollView}>
                                        <ProfileVisibility />
                                    </ScrollView>
                                )}
                            </Animated.View>
                        </View>
                    )}

                    {/* Change Password */}
                    <View>
                        <TouchableWithoutFeedback onPress={() => toggleMenu(horMenuOpen, setHorMenuOpen, animatedHeightHor, rotationHor, 1360)}>
                            <View style={styles.detailsMenu}>
                                <View style={styles.iconMenuFlex}>
                                    <MaterialIcons name="lock" size={18} color="#fff" style={styles.saveIcon} />
                                    <Text style={styles.menuName}>Change Password</Text>
                                </View>

                                <Animated.View style={{ transform: [{ rotate: rotateInterpolate(rotationHor) }] }}>
                                    <MaterialIcons name="arrow-drop-down" size={18} color="#fff" style={styles.saveIcon} />
                                </Animated.View>
                            </View>
                        </TouchableWithoutFeedback>

                        <Animated.View style={[styles.menuContainer, { height: heightInterpolate(animatedHeightHor, 1360) }]}>

                            {/* <Text style={styles.redText}>Edit</Text> */}

                            {horMenuOpen && (

                                <View style={styles.editOptions}>
                                    <View>
                                        {/* Enter Old Password */}
                                        <View>
                                            <Text style={styles.subCaption}>Enter Old Password</Text>
                                            <View style={styles.passwordInputContainer}>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Enter Old Password"
                                                    secureTextEntry={!showOldPassword}
                                                    value={oldPassword}
                                                    onChangeText={setOldPassword}
                                                />
                                                <Pressable
                                                    onPress={() => setShowOldPassword((prev) => !prev)}
                                                    style={styles.passwordIcon}
                                                >
                                                    <AntDesign name={showOldPassword ? "eye" : "eyeo"} size={18} color="#535665" />
                                                </Pressable>
                                            </View>
                                            {oldPasswordError ? <Text style={styles.errorText}>{oldPasswordError}</Text> : null}
                                        </View>

                                        {/* Enter New Password */}
                                        <View>
                                            <Text style={styles.subCaption}>Enter New Password</Text>
                                            <View style={styles.passwordInputContainer}>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Enter New Password"
                                                    secureTextEntry={!showNewPassword}
                                                    value={newPassword}
                                                    onChangeText={setNewPassword}
                                                />
                                                <Pressable
                                                    onPress={() => setShowNewPassword((prev) => !prev)}
                                                    style={styles.passwordIcon}
                                                >
                                                    <AntDesign name={showNewPassword ? "eye" : "eyeo"} size={18} color="#535665" />
                                                </Pressable>
                                            </View>
                                            {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}
                                        </View>

                                        {/* Confirm New Password */}
                                        <View>
                                            <Text style={styles.subCaption}>Confirm New Password</Text>
                                            <View style={styles.passwordInputContainer}>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Confirm New Password"
                                                    secureTextEntry={!showConfirmPassword}
                                                    value={confirmPassword}
                                                    onChangeText={setConfirmPassword}
                                                />
                                                <Pressable
                                                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                                                    style={styles.passwordIcon}
                                                >
                                                    <AntDesign name={showConfirmPassword ? "eye" : "eyeo"} size={18} color="#535665" />
                                                </Pressable>
                                            </View>
                                            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                                        </View>

                                        {/* Save Button */}
                                        {/* <Button title="Save" onPress={handleChangePassword} /> */}
                                        <View style={styles.formContainer1}>
                                            <TouchableOpacity
                                                style={styles.btn}
                                                onPress={handleChangePassword}>
                                                <LinearGradient
                                                    colors={["#BD1225", "#FF4050"]}
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
                            {/* Rasi Component */}
                            {/* <Rasi /> */}
                        </Animated.View>
                    </View>
                </View>
            </ScrollView >
            <BottomTabBarComponent />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F4F4",
        paddingBottom: 80,
        // alignItems: "center",
        // justifyContent: "flex-start",
    },
    errorText: {
        color: "#ED1E24",
        fontSize: 13,
        marginBottom: 5,
        marginLeft: 5,
        fontFamily: "inter",
        fontWeight: "bold",
        // marginTop: 10,
    },
    headerContainer: {
        padding: 3,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
        marginLeft: 10,
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

    profileCardContainer: {
        width: "100%",
    },

    profileName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#282C3F",
        fontFamily: "inter",
        // marginBottom: 10,
        marginVertical: 15,
        paddingTop: 10,
    },

    profileId: {
        fontSize: 14,
        color: "#85878C",
    },

    detailsMenu: {
        width: "100%",
        backgroundColor: "#4F515D",
        paddingHorizontal: 10,
        paddingVertical: 20,
        // paddingTop: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        alignSelf: "center",
        borderBottomWidth: 0.5,
        borderColor: "#fff",
    },

    menuName: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "500",
        fontFamily: "inter",
        marginLeft: 5,
    },

    iconMenuFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        // width: "100%",
    },

    redText: {
        color: "#ED1E24",
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "inter",
        marginVertical: 15,
        alignSelf: "flex-start",
        // paddingHorizontal: 10,
    },

    editOptions: {
        width: "100%",
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 10,
    },

    menuContainer: {
        // width: "100%",
        overflow: 'hidden', // Ensure content doesn't overflow
    },

    subCaption: {
        color: "#535665",
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "inter",
        marginVertical: 10,
        alignSelf: "flex-start",
        // paddingHorizontal: 10,
    },

    checkboxContainer: {
        flexDirection: "row",
        // justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        // paddingHorizontal: 10,
        // textAlign: "left",
        // alignSelf: "center",
    },

    singleCheckboxContainer: {
        flexDirection: "row",
        // justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        paddingHorizontal: 10,
        // textAlign: "left",
        // alignSelf: "center",
    },

    dhosamFlex: {
        flexDirection: "row",
        // justifyContent: "space-between",
        // alignItems: "flex-start",
        // alignSelf: "flex-start",
        // borderColor: "#D4D5D9",
        // fontFamily: "inter",
    },

    checkboxBase: {
        width: 18,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 2,
        borderWidth: 2,
        borderColor: "#535665",
        backgroundColor: "transparent",
        marginRight: 6,
    },

    checkboxChecked: {
        backgroundColor: "#535665",
    },

    checkboxLabel: {
        fontSize: 14,
        color: "#535665",
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

    formContainer: {
        width: "100%",
        paddingHorizontal: 10,
        // flexDirection: "row",
        // alignItems: "center",
    },

    searchContainer: {
        width: "100%",
        marginBottom: 15,
        textAlign: "left",
    },

    redText: {
        color: "#535665",
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "inter",
        alignSelf: "flex-start",
        paddingHorizontal: 20,
        // marginBottom: 10,
    },

    inputFlexContainer: {
        flexDirection: "row", // Change to row
        justifyContent: "space-between", // Apply space between
        alignItems: "center",
        width: "100%",
        // borderColor: "#D4D5D9",
        // fontFamily: "inter",
    },

    inputStyle: {
        flex: 1,
        color: "#535665",
        padding: 10, // Adjust padding
        marginRight: 10, // Adjust margin right
        fontFamily: "inter",
        borderWidth: 1,
        borderRadius: 4,
        borderColor: "#D4D5D9",
    },

    inputFlex: {
        flex: 1,
        color: "#535665",
        padding: 10, // Adjust padding
        fontFamily: "inter",
        borderWidth: 1,
        borderRadius: 4,
        borderColor: "#D4D5D9",
    },

    // inputStyle: {
    //     width: "100%",
    // },

    radioContainer: {
        justifyContent: "center",
        alignItems: "flex-start",
    },

    passwordInputContainer: {
        width: "100%",
    },

    input: {
        color: "#535665",
        borderWidth: 1,
        borderRadius: 4,
        borderColor: "#D4D5D9",
        padding: 10,
        fontFamily: "inter",
    },

    passwordIcon: {
        position: "absolute",
        right: 10,
        top: 15,
    },

    // Upload Images Style
    uploadContainer: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderStyle: "dashed",
        borderRadius: 5,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },

    uploadText: {
        color: "#888",
    },

    filesContainer: {
        // marginBottom: 20,
    },

    fileItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },

    fileImage: {
        width: 50,
        height: 50,
        marginRight: 10,
    },

    fileDetails: {
        flex: 1,
    },

    removeButton: {
        color: "#FF5666",
        marginTop: 5,
    },

    progressBar: {
        marginBottom: 10,
    },

    spaceText: {
        fontSize: 14,
        color: "#888",
    },

    basicText: {
        color: "#535665",
        fontFamily: "inter",
        fontSize: 16,
        fontWeight: "700",
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        marginVertical: 10,
        marginBottom: 10,
    },

    passwordIDIcon: {
        position: "absolute",
        right: 10,
        top: 45,
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
        paddingHorizontal: 20,
    },

    linearGradient: {
        borderRadius: 5,
        justifyContent: "center",
        padding: 15,
    },
    btn: {
        width: "100%",
        alignSelf: "center",
        borderRadius: 6,
        marginBottom: 30,
        marginTop: 10,
    },
    fileItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        marginTop: -10,
        marginBottom: 10,
    },
    fileImage: {
        width: 45,
        height: 45,
        borderRadius: 4,
        marginRight: 12,
    },
    fileDetails: {
        flex: 1,
        justifyContent: 'center'
    },
    uploadedStatus: {
        fontSize: 11,
        color: "#2E7D32", // Green to indicate success
        fontWeight: "600",
        marginTop: 2
    }
});
