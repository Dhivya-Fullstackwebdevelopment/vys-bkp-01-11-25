import React, { useState, useRef, useEffect } from 'react'
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Animated,
    TouchableWithoutFeedback,
    TouchableHighlight,
    Dimensions,
    Modal,
    TextInput,
    Button,
    Platform, Pressable

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
import { Rasi } from '../Rasi';
import { getProfileDetailsMatch, getMyProfilePersonal, updateProfilePersonal } from '../../CommonApiCall/CommonApiCall'; // Import the API function
import RNPickerSelect from 'react-native-picker-select';
import config from "../../API/Apiurl";
import axios from "axios";
import { EducationalDetails } from '../ProfileEdit/EducationalDetails';
import { FamilyDetails } from '../ProfileEdit/FamilyDetails';
import { HoroscopeDetails } from '../ProfileEdit/HoroscopeDetails';
import { ContactDetails } from '../ProfileEdit/ContactDetails';
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

export const ProfileDetailsEdit = () => {

    // State and animation values for each menu
    const [personalDetails, setPersonalDetails] = useState(null); // State for profile details
    const [showPersonalDetails, setShowPersonalDetails] = useState(true);
    const [showEducationDetails, setShowEducationDetails] = useState(false);
    const [showFamilyDetails, setShowFamilyDetails] = useState(false);
    const [showHoroscopeDetails, setShowHoroscopeDetails] = useState(false);
    const [showContactDetails, setShowContactDetails] = useState(false);
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [period, setPeriod] = useState('AM');

    const [formValues, setFormValues] = useState({
        personal_profile_name: '',
        personal_gender: '',
        personal_age: '',
        personal_profile_dob: '',
        personal_place_of_birth: '',
        personal_time_of_birth: '',
        personal_weight: '',
        personal_profile_height: '',
        personal_profile_marital_status_name: '',
        personal_blood_group: '',
        personal_about_self: '',
        personal_profile_complexion_name: '',
        personal_hobbies: '',
        personal_pysically_changed: '',
        personal_eye_wear: '',
        profile_created_by: '',
        personal_profile_marital_status_id: null,
        personal_profile_complexion_id: null,
        personal_profile_for_id: null,
        Mobile_no: ''
        // no_of_children: '',
    });
    const [isFetched, setIsFetched] = useState(false);
    const [showDatepicker, setShowDatepicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const currentDate = new Date(); // Current date
    const currentYear = currentDate.getFullYear(); // Current year

    // Adjust minDate and maxDate to fit the requirement
    const minDate = new Date(1947, 0, 1); // January 1, 1947
    const maxDate = new Date(currentYear - 19, 11, 31);
    const CalendarIcon = ({ onPress }) => (
        <Pressable
            onPress={onPress}
            style={{ position: "absolute", right: 10, top: 15 }}
        >
            <Ionicons name="calendar" size={18} color="#535665" />
        </Pressable>
    );

    const calculateAge = (dob) => {
        if (!dob) return '';

        const birthDate = new Date(dob);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        // Adjust age if birthday hasn't occurred this year yet
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age.toString();
    };
    // In ProfileDetailsEdit.js
    const fetchProfileData = async () => {
        try {
            const data = await getMyProfilePersonal();

            // --- THIS IS THE FIX ---
            if (data && data.data) {
                setPersonalDetails(data.data);
            } else {
                setPersonalDetails(null);
            }
            // --- END FIX ---

        } catch (error) {
            console.error('Failed to load profile data', error);
            setPersonalDetails(null); // <-- ALSO ADD THIS
        }
    };
    // UseEffect to fetch profile data initially
    useEffect(() => {
        fetchProfileData(); // Call the function when component mounts
    }, []); // Empty dependency array ensures it only runs on mount

    const handleTimeChange = (type, value) => {
        if (type === 'hour') {
            setHour(value);
        } else if (type === 'minute') {
            setMinute(value);
        } else if (type === 'period') {
            setPeriod(value);
        }

        // Update the formValues with the combined time string
        const timeString = type === 'hour' ? `${value}:${minute} ${period}` :
            type === 'minute' ? `${hour}:${value} ${period}` :
                `${hour}:${minute} ${value}`;

        setFormValues(prevValues => ({
            ...prevValues,
            personal_time_of_birth: timeString
        }));
    };

    useEffect(() => {
        // Parse existing time of birth when personalDetails is available
        if (personalDetails?.personal_time_of_birth) {
            const timeString = personalDetails.personal_time_of_birth;
            // Handle different time formats
            if (timeString.includes(':')) {
                const [timePart, periodPart] = timeString.split(' ');
                if (timePart) {
                    const [hours, minutes] = timePart.split(':');
                    setHour(hours || '');
                    setMinute(minutes || '');
                    setPeriod((periodPart && (periodPart === 'AM' || periodPart === 'PM')) ? periodPart : 'AM');
                }
            }
        }
    }, [personalDetails]);

    useEffect(() => {
        // Update form values only once when personalDetails is fetched
        if (personalDetails && !isFetched) {
            const initialAge = personalDetails.personal_profile_dob
                ? calculateAge(personalDetails.personal_profile_dob)
                : '';
            setFormValues({
                ...formValues,
                personal_profile_name: personalDetails.personal_profile_name || '',
                personal_profile_dob: personalDetails.personal_profile_dob || '',
                personal_gender: personalDetails.personal_gender || '',
                personal_age: initialAge, // Use calculated age instead of stored age
                personal_place_of_birth: personalDetails.personal_place_of_birth || '',
                personal_time_of_birth: personalDetails.personal_time_of_birth || '',
                personal_weight: personalDetails.personal_weight || '',
                personal_profile_height: personalDetails.personal_profile_height || '',
                personal_profile_marital_status_id: personalDetails.personal_profile_marital_status_id || null,
                personal_profile_complexion_id: personalDetails.personal_profile_complexion_id || null,
                personal_profile_for_id: personalDetails.personal_profile_for_id || null,
                personal_profile_marital_status_name: personalDetails.personal_profile_marital_status_name || '',
                personal_blood_group: personalDetails.personal_blood_group || '',
                personal_about_self: personalDetails.personal_about_self || '',
                personal_profile_complexion_name: personalDetails.personal_profile_complexion_name || '',
                personal_hobbies: personalDetails.personal_hobbies || '',
                personal_pysically_changed: personalDetails.personal_pysically_changed || '',
                personal_eye_wear: personalDetails.personal_eye_wear || '',
                profile_created_by: personalDetails.profile_created_by || '',
                personal_body_type: personalDetails.personal_body_type || '',
                personal_video_url: personalDetails.personal_video_url || '',
                Mobile_no: personalDetails.mobile_no || ''
                // no_of_children: personalDetails.no_of_children || '',
            });
            setIsFetched(true);  // Mark as fetched to prevent further updates
        }
    }, [personalDetails, isFetched]);  // Add `isFetched` as a dependency



    // Personal Menu
    const [pMenuOpen, setPMenuOpen] = useState(false);
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

    const [Details, setProfileDetails] = useState(null); // State for profile details
    // const [personalDetails, setPersonalDetails] = useState(null); // State for profile details
    const [isEditMode, setIsEditMode] = useState(false); // Toggle between view and edit mode


    const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
    const [heightOptions, setHeightOptions] = useState([]);
    const [complexionOptions, setComplexionOptions] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [profileOptions, setProfileOptions] = useState([]);

    // Fetch marital status options from the API
    useEffect(() => {
        const fetchMaritalStatus = async () => {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Marital_Status/`);
                const maritalStatusArray = Object.keys(response.data).map(key => ({
                    label: response.data[key].marital_sts_name,
                    value: response.data[key].marital_sts_id.toString(),
                }));
                setMaritalStatusOptions(maritalStatusArray);
            } catch (error) {
                console.error("Error fetching marital status:", error);
            }
        };

        fetchMaritalStatus();
    }, []);


    useEffect(() => {
        const fetchHeightOption = async () => {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Height/`);
                const heightArray = Object.keys(response.data).map(key => ({
                    label: response.data[key].height_description,
                    value: response.data[key].height_id.toString(),
                }));
                setHeightOptions(heightArray);
            } catch (error) {
                console.error("Error fetching height options:", error);
            }
        };

        fetchHeightOption();
    }, []);


    useEffect(() => {
        const fetchComplexion = async () => {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Complexion/`);
                const complexionArray = Object.keys(response.data).map(key => ({
                    label: response.data[key].complexion_description,
                    value: response.data[key].complexion_id.toString(),
                }));
                setComplexionOptions(complexionArray);
            } catch (error) {
                console.error("Error fetching complexion options:", error);
            }
        };

        fetchComplexion();
    }, []);

    useEffect(() => {
        const fetchProfileDetails = async () => {
            try {
                const result = await getProfileDetailsMatch(); // Pass profile_id and user_profile_id
                // console.log("dddfd",result);
                setProfileDetails(result); // Update the state with profile details
            } catch (error) {
                console.error('Error fetching profile details:', error);
            }
        };
        fetchProfileDetails();
    }, []);

    useEffect(() => {
        const fetchProfileOptions = async () => {
            try {
                const response = await axios.post(
                    `${config.apiUrl}/auth/Get_Profileholder/`
                );
                const profileOptionsArray = Object.keys(response.data).map((key) => ({
                    label: response.data[key].owner_description,
                    value: response.data[key].owner_id.toString(),
                    id: response.data[key].owner_id,
                }));
                setProfileOptions(profileOptionsArray);
            } catch (error) {
                console.error("Error fetching profile options:", error);
            }
        };
        fetchProfileOptions();
    }, []);

    const handleChange = (field, value) => {
        setFormValues((prevValues) => {
            // Update the value to either the user input or empty string
            const updatedValue = value === '' ? '' : value;
            return {
                ...prevValues,
                [field]: updatedValue,
            };
        });
        // Clear the error message for the field
        setValidationErrors((prevErrors) => ({
            ...prevErrors,
            [field]: '',
        }));
    };

    useEffect(() => {
        // Reset form values to personalDetails whenever personalDetails changes
        if (personalDetails) {
            setFormValues((prevValues) => ({
                ...prevValues,
                ...Object.keys(prevValues).reduce((acc, key) => {
                    acc[key] = prevValues[key] === '' ? personalDetails[key] || '' : prevValues[key];
                    return acc;
                }, {}),
            }));
        }
    }, [personalDetails]);

    const validateForm = () => {
        const errors = {};
        const isTenDigits = (value) => /^\d{10}$/.test(value);
        // Validate each field
        if (!formValues.personal_profile_name || formValues.personal_profile_name.trim() === '') {
            errors.personal_profile_name = 'Name is required';
        }
        // if (!formValues.personal_gender) errors.personal_gender = 'Gender is required';
        // if (!formValues.personal_age) errors.personal_age = 'Age is required';
        if (!formValues.personal_profile_dob) {
            errors.personal_profile_dob = 'Date of birth is required';
        }
        if (!formValues.personal_place_of_birth || formValues.personal_place_of_birth.trim() === '') {
            errors.personal_place_of_birth = 'Place of birth is required';
        }
        // if (!formValues.personal_time_of_birth) errors.personal_time_of_birth = 'Time of birth is required';
        // if (!formValues.personal_weight) errors.personal_weight = 'Weight is required';
        if (!formValues.personal_profile_height) {
            errors.personal_profile_height = 'Height is required';
        }
        if (!formValues.personal_profile_marital_status_id) {
            errors.personal_profile_marital_status_id = 'Marital status is required';
        }
        if (!formValues.personal_profile_complexion_id) {
            errors.personal_profile_complexion_id = 'Complexion is required';
        }
        if (formValues.Mobile_no && !isTenDigits(formValues.Mobile_no)) {
            errors.Mobile_no = 'Please enter at least 10 digits for Registered Mobile';
        }
        // if (!formValues.personal_blood_group) errors.personal_blood_group = 'Blood group is required';
        // if (!formValues.personal_about_self) errors.personal_about_self = 'About yourself is required';
        // if (!formValues.personal_profile_complexion_id) errors.personal_profile_complexion_id = 'Complexion is required';
        // if (!formValues.personal_profile_for_id) errors.personal_profile_for_id = 'Complexion is required';
        // if (!formValues.personal_hobbies) errors.personal_hobbies = 'Hobbies are required';
        // if (!formValues.personal_pysically_changed) errors.personal_pysically_changed = 'Physical status is required';
        // if (!formValues.personal_eye_wear) errors.personal_eye_wear = 'Eye wear status is required';
        // if (!formValues.profile_created_by) errors.profile_created_by = 'Profile created by is required';
        // if ([2, 3, 5].includes(Number(formValues.personal_profile_marital_status_id)) && !formValues.no_of_children) {
        //     errors.no_of_children = 'No. of Children is required';
        // }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0; // Return true if there are no errors
    };

    const handleSave = async () => {
        console.log("all data edit ===>")
        const timeOfBirth = hour && minute ? `${hour}:${minute} ${period}` : '';
        console.log("my profile time of birth", timeOfBirth);
        console.log("Form values:", formValues);

        if (validateForm()) {
            const profileData = {
                Profile_name: formValues.personal_profile_name,
                Gender: formValues.personal_gender,
                personal_age: formValues.personal_age,
                Profile_dob: formValues.personal_profile_dob,
                place_of_birth: formValues.personal_place_of_birth,
                time_of_birth: timeOfBirth,
                Profile_height: formValues.personal_profile_height,
                weight: formValues.personal_weight,
                eye_wear: formValues.personal_eye_wear,
                body_type: formValues.personal_body_type,
                Profile_marital_status: formValues.personal_profile_marital_status_id,
                blood_group: formValues.personal_blood_group,
                about_self: formValues.personal_about_self,
                Profile_complexion: formValues.personal_profile_complexion_id,
                hobbies: formValues.personal_hobbies,
                physically_changed: formValues.personal_pysically_changed,
                Profile_for: formValues.personal_profile_for_id,
                Mobile_no: formValues.Mobile_no
                // no_of_children: formValues.no_of_children,
            };
            console.log("all data edit ===>", profileData)
            try {
                const response = await updateProfilePersonal(profileData);
                console.log('Profile updated successfully:', response);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Profile Details updated successfully' || response.message,
                }); // Show success message using Toast
                // Set edit mode to false after successful update
                setIsEditMode(false);
                // Fetch the updated profile data again
                fetchProfileData();
            } catch (error) {
                console.error('Failed to update profile:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to update profile details' || error.message,
                }); // Show error message using Toast
            }
        }
    };

    const togglePersonalDetails = () => {
        setShowEducationDetails(false)
        setShowFamilyDetails(false)
        setShowHoroscopeDetails(false)
        setShowContactDetails(false)
        setShowPersonalDetails((prev) => !prev);
    };

    const toggleEducationDetails = () => {
        setShowPersonalDetails(false)
        setShowFamilyDetails(false)
        setShowHoroscopeDetails(false)
        setShowContactDetails(false)
        setShowEducationDetails((prev) => !prev);
    };

    const toggleFamilyDetails = () => {
        setShowPersonalDetails(false)
        setShowEducationDetails(false)
        setShowHoroscopeDetails(false)
        setShowContactDetails(false)
        setShowFamilyDetails((prev) => !prev);
    };

    const toggleHoroscopeDetails = () => {
        setShowPersonalDetails(false)
        setShowEducationDetails(false)
        setShowFamilyDetails(false)
        setShowContactDetails(false)
        setShowHoroscopeDetails((prev) => !prev);
    };

    const toggleContactDetails = () => {
        setShowPersonalDetails(false)
        setShowEducationDetails(false)
        setShowFamilyDetails(false)
        setShowHoroscopeDetails(false)
        setShowContactDetails((prev) => !prev);
    };

    return (
        <View style={styles.scrollViewContentContainer}>


            <View style={styles.iconsRowContainer}>
                <View style={styles.iconContainer}>
                    {/* Personal Icon */}
                    <TouchableOpacity onPress={togglePersonalDetails}>
                        <FontAwesome5
                            name="user-circle"
                            size={24}
                            color={showPersonalDetails ? '#FFFFFF' : '#85878C'}
                            style={styles.iconStyle}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.iconText, { color: showPersonalDetails ? '#FFFFFF' : '#85878C' }]}>Personal</Text>
                </View>

                <View style={styles.iconContainer}>
                    {/* Education & Profession */}
                    <TouchableOpacity onPress={toggleEducationDetails}>
                        <MaterialIcons
                            name="work"
                            size={22}
                            color={showEducationDetails ? '#FFFFFF' : '#85878C'}
                            style={styles.iconStyle}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.iconText, { color: showEducationDetails ? '#FFFFFF' : '#85878C' }]}>Work</Text>
                </View>

                <View style={styles.iconContainer}>
                    {/* Family */}

                    <TouchableOpacity onPress={toggleFamilyDetails}>
                        <FontAwesome5
                            name="users"
                            size={22}
                            color={showFamilyDetails ? '#FFFFFF' : '#85878C'}
                            style={styles.iconStyle}
                        />
                        <Text style={[styles.iconText, { color: showFamilyDetails ? '#FFFFFF' : '#85878C' }]}>Family</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.iconContainer}>
                    {/* Horoscope */}
                    <TouchableOpacity onPress={toggleHoroscopeDetails}>
                        <MaterialCommunityIcons
                            name="zodiac-libra"
                            size={22}
                            color={showHoroscopeDetails ? '#FFFFFF' : '#85878C'}
                            style={styles.iconStyle}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.iconText, { color: showHoroscopeDetails ? '#FFFFFF' : '#85878C' }]}>Horoscope</Text>
                </View>

                <View style={styles.iconContainer}>
                    {/* Contact Details */}
                    <TouchableOpacity onPress={toggleContactDetails}>
                        <MaterialIcons
                            name="phone"
                            size={22}
                            color={showContactDetails ? '#FFFFFF' : '#85878C'}
                            style={styles.iconStyle}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.iconText, { color: showContactDetails ? '#FFFFFF' : '#85878C' }]}>Contact</Text>
                </View>

            </View>

            {showPersonalDetails && (
                <View style={styles.menuChanges}>
                    <View style={styles.editOptions}>
                        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 15 }}>Profile Details</Text>
                        <TouchableWithoutFeedback onPress={() => setIsEditMode(!isEditMode)}>
                            <Text style={styles.redText}>{isEditMode ? 'View' : 'Edit'}</Text>
                        </TouchableWithoutFeedback>
                        {isEditMode ? (
                            <View style={styles.editOptions}>
                                <Text style={styles.labelNew}>Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Name"
                                    value={formValues.personal_profile_name}
                                    onChangeText={(text) => handleChange('personal_profile_name', text)}
                                />
                                {validationErrors.personal_profile_name && <Text style={styles.error}>{validationErrors.personal_profile_name}</Text>}

                                {/* <Text style={styles.labelNew}>Gender</Text>
                                <RNPickerSelect
                                    disabled={true}
                                    onValueChange={(value) => handleChange('personal_gender', value)}
                                    useNativeAndroidPickerStyle={false} // Important for custom styles on Android

                                    items={[
                                        { label: 'Male', value: 'male' },
                                        { label: 'Female', value: 'female' },
                                    ]}
                                    value={formValues.personal_gender}
                                    style={{
                                        inputIOS: styles.input,
                                        inputAndroid: styles.input,
                                    }}
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down" // Name of the icon
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                    placeholder={{ label: "Select Gender", value: null }}
                                />
                                {validationErrors.personal_gender && <Text style={styles.error}>{validationErrors.personal_gender}</Text>} */}



                                {/* <Text style={styles.labelNew}>Date of Birth</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="DOB"
                                        value={formValues.personal_profile_dob}
                                        onChangeText={(text) => handleChange('personal_profile_dob', text)}
                                    />
                                    {validationErrors.personal_profile_dob && <Text style={styles.error}>{validationErrors.personal_profile_dob}</Text>} */}

                                <Text style={styles.label}>Date of Birth</Text>
                                <Pressable onPress={() => setShowDatepicker(true)}>
                                    <TextInput
                                        style={[styles.input, { color: 'black' }]}
                                        placeholder="Date of Birth"
                                        value={formValues.personal_profile_dob}
                                        editable={false}
                                    />
                                    <CalendarIcon onPress={() => setShowDatepicker(true)} />
                                </Pressable>

                                {validationErrors.personal_profile_dob && (
                                    <Text style={styles.error}>{validationErrors.personal_profile_dob}</Text>
                                )}

                                {showDatepicker && (
                                    <DateTimePicker
                                        mode="date"
                                        display="calendar"
                                        value={formValues.personal_profile_dob ? new Date(formValues.personal_profile_dob) : maxDate}
                                        onChange={(event, date) => {
                                            if (date) {
                                                const formattedDate = date.toISOString().split('T')[0];

                                                // Update date of birth
                                                handleChange('personal_profile_dob', formattedDate);

                                                // Calculate and update age automatically
                                                const calculatedAge = calculateAge(formattedDate);
                                                handleChange('personal_age', calculatedAge);

                                                setShowDatepicker(false);
                                            }
                                        }}
                                        minimumDate={minDate}
                                        maximumDate={maxDate}
                                    />
                                )}

                                <Text style={styles.labelNew}>Age</Text>
                                <TextInput
                                    style={[styles.input, { color: 'black' }]}
                                    placeholder="Age"
                                    value={formValues.personal_age.toString()}
                                    keyboardType="numeric"
                                    editable={false}
                                    onChangeText={(text) => handleChange('personal_age', text)}
                                />

                                <Text style={styles.labelNew}>Place of Birth</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Place of Birth"
                                    value={formValues.personal_place_of_birth}
                                    onChangeText={(text) => handleChange('personal_place_of_birth', text)}
                                />
                                {validationErrors.personal_place_of_birth && <Text style={styles.error}>{validationErrors.personal_place_of_birth}</Text>}

                                {/* Remove the existing TextInput for Time of Birth and replace with: */}
                                <Text style={styles.labelNew}>Time of Birth</Text>
                                <View style={styles.timeContainer}>
                                    <View style={styles.timePicker}>
                                        <RNPickerSelect
                                            onValueChange={(value) => handleTimeChange('hour', value)}
                                            items={Array.from({ length: 12 }, (_, i) => ({
                                                label: (i + 1).toString().padStart(2, '0'),
                                                value: (i + 1).toString().padStart(2, '0'),
                                            }))}
                                            value={hour}
                                            useNativeAndroidPickerStyle={false}
                                            placeholder={{ label: "Select hour", value: "" }}
                                            style={pickerSelectStyles}
                                        />
                                    </View>

                                    <Text style={styles.timeSeparator}>:</Text>

                                    <View style={styles.timePicker}>
                                        <RNPickerSelect
                                            onValueChange={(value) => handleTimeChange('minute', value)}
                                            items={Array.from({ length: 60 }, (_, i) => ({
                                                label: i.toString().padStart(2, '0'),
                                                value: i.toString().padStart(2, '0'),
                                            }))}
                                            value={minute}
                                            useNativeAndroidPickerStyle={false}
                                            placeholder={{ label: "Select minute", value: "" }}
                                            style={pickerSelectStyles}
                                        />
                                    </View>

                                    <View style={styles.timePicker}>
                                        <RNPickerSelect
                                            onValueChange={(value) => handleTimeChange('period', value)}
                                            items={[
                                                { label: 'AM', value: 'AM' },
                                                { label: 'PM', value: 'PM' },
                                            ]}
                                            value={period}
                                            useNativeAndroidPickerStyle={false}
                                            placeholder={{ label: "AM | PM", value: "" }}
                                            style={pickerSelectStyles}
                                        />
                                    </View>
                                </View>
                                {/* {validationErrors.personal_time_of_birth && <Text style={styles.error}>{validationErrors.personal_time_of_birth}</Text>} */}

                                <Text style={styles.labelNew}>Height</Text>
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_profile_height', value)}
                                    items={heightOptions}
                                    value={formValues.personal_profile_height}
                                    useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down" // Name of the icon
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                    placeholder={{ label: "Select Height", value: null }}
                                    style={pickerSelectStyles}
                                />
                                {validationErrors.personal_profile_height && <Text style={styles.error}>{validationErrors.personal_profile_height}</Text>}

                                <Text style={styles.labelNew}>Weight</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Weight"
                                    value={formValues.personal_weight}
                                    keyboardType="numeric"
                                    onChangeText={(text) => handleChange('personal_weight', text)}
                                />
                                {/* {validationErrors.personal_weight && <Text style={styles.error}>{validationErrors.personal_weight}</Text>} */}

                                <Text style={styles.labelNew}>Body Type</Text>
                                {/* <TextInput
                                    style={styles.input}
                                    placeholder="Body Type"
                                    value={formValues.personal_body_type}
                                    onChangeText={(text) => handleChange('personal_body_type', text)}
                                /> */}
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_body_type', value)}
                                    items={[
                                        { label: 'Slim', value: 'Slim' },
                                        { label: 'Fat', value: 'Fat' },
                                        { label: 'Normal', value: 'Normal' },
                                        // { label: 'Glasses', value: 'glasses' },
                                        // { label: 'Contact Lenses', value: 'contact_lenses' },
                                    ]}
                                    value={formValues.personal_body_type}
                                    useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down" // Name of the icon
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                    placeholder={{ label: "Body Type", value: null }}
                                    style={pickerSelectStyles}
                                />
                                {/* {validationErrors.personal_body_type && <Text style={styles.error}>{validationErrors.personal_body_type}</Text>} */}

                                <Text style={styles.labelNew}>Eye Wear</Text>
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_eye_wear', value)}
                                    items={[
                                        { label: 'Yes', value: 'Yes' },
                                        { label: 'No', value: 'No' },
                                        // { label: 'Glasses', value: 'glasses' },
                                        // { label: 'Contact Lenses', value: 'contact_lenses' },
                                    ]}
                                    value={formValues.personal_eye_wear}
                                    useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down" // Name of the icon
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                    placeholder={{ label: "Eye Wear", value: null }}
                                    style={pickerSelectStyles}
                                />
                                {/* {validationErrors.personal_eye_wear && (
                                    <Text style={styles.error}>{validationErrors.personal_eye_wear}</Text>
                                )} */}

                                <Text style={styles.labelNew}>Marital Status</Text>
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_profile_marital_status_id', value)}
                                    items={maritalStatusOptions}
                                    value={formValues.personal_profile_marital_status_id}
                                    useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down" // Name of the icon
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                    placeholder={{ label: "Select Marital Status", value: null }}
                                    style={pickerSelectStyles}
                                />
                                {validationErrors.personal_profile_marital_status_id && <Text style={styles.error}>{validationErrors.personal_profile_marital_status_id}</Text>}

                                <Text style={styles.labelNew}>Blood Group</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Blood Group"
                                    value={formValues.personal_blood_group}
                                    onChangeText={(text) => handleChange('personal_blood_group', text)}
                                />
                                {/* {validationErrors.personal_blood_group && <Text style={styles.error}>{validationErrors.personal_blood_group}</Text>} */}

                                <Text style={styles.labelNew}>About Myself</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="About Yourself"
                                    value={formValues.personal_about_self}
                                    onChangeText={(text) => handleChange('personal_about_self', text)}
                                />
                                {/* {validationErrors.personal_about_self && <Text style={styles.error}>{validationErrors.personal_about_self}</Text>} */}

                                <Text style={styles.labelNew}>Complexion</Text>
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_profile_complexion_id', value)}
                                    items={complexionOptions}
                                    value={formValues.personal_profile_complexion_id}
                                    useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down" // Name of the icon
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                    placeholder={{ label: "Select Complexion", value: null }}
                                    style={pickerSelectStyles}
                                />
                                {validationErrors.personal_profile_complexion_id && <Text style={styles.error}>{validationErrors.personal_profile_complexion_id}</Text>}

                                <Text style={styles.labelNew}>Hobbies</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Hobbies"
                                    value={formValues.personal_hobbies}
                                    onChangeText={(text) => handleChange('personal_hobbies', text)}
                                />
                                {/* {validationErrors.personal_hobbies && <Text style={styles.error}>{validationErrors.personal_hobbies}</Text>} */}

                                <Text style={styles.labelNew}>Physical Status</Text>
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_pysically_changed', value)}
                                    items={[
                                        { label: 'Yes', value: 'yes' },
                                        { label: 'No', value: 'no' },
                                    ]}
                                    value={formValues.personal_pysically_changed}
                                    useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down" // Name of the icon
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                    placeholder={{ label: "Physical Status", value: null }}
                                    style={pickerSelectStyles}
                                />

                                <Text style={styles.labelNew}>Registered Mobile</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Registered Mobile"
                                    value={formValues.Mobile_no}
                                    useNativeAndroidPickerStyle={false}
                                    onChangeText={(text) => handleChange('Mobile_no', text)}
                                    keyboardType="numeric"

                                />
                                {validationErrors.Mobile_no && (
                                    <Text style={styles.error}>{validationErrors.Mobile_no}</Text>
                                )}

                                {/* <Text style={styles.labelNew}>Profile Created For</Text>
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_profile_for_id', value)}
                                    items={profileOptions}
                                    value={formValues.personal_profile_for_id}
                                    useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down" // Name of the icon
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                    placeholder={{ label: "Profile Created", value: null }}
                                    style={pickerSelectStyles}
                                />
                                {validationErrors.personal_profile_for_id && <Text style={styles.error}>{validationErrors.personal_profile_for_id}</Text>} */}

                                {/* <Text style={styles.labelNew}>Video URL</Text>
                                <TextInput
                                    style={styles.labelNew}
                                    placeholder="Video URL"
                                    value={formValues.personal_video_url}
                                    onChangeText={(text) => handleChange('personal_video_url', text)}
                                /> */}
                                {/* {validationErrors.personal_body_type && <Text style={styles.error}>{validationErrors.personal_body_type}</Text>} */}

                                {/* {[2, 3, 5].includes(Number(formValues.personal_profile_marital_status_id)) && (
                                        <>
                                            <Text style={styles.labelNew}>No. of Children</Text>
                                            <RNPickerSelect
                                                onValueChange={(value) => handleChange('no_of_children', value)}
                                                items={[
                                                    { label: '1', value: '1' },
                                                    { label: '2', value: '2' },
                                                    { label: '3', value: '3' },
                                                    { label: '4', value: '4' },
                                                    { label: '5', value: '5' },
                                                ]}
                                                value={formValues.no_of_children}
                                                useNativeAndroidPickerStyle={false}
                                                Icon={() => (
                                                    <Ionicons
                                                        name="chevron-down"
                                                        size={24}
                                                        color="gray"
                                                        style={{ marginTop: 10 }}
                                                    />
                                                )}
                                                placeholder={{ label: "Select No. of Children", value: null }}
                                                style={pickerSelectStyles}
                                            />
                                            {validationErrors.no_of_children && (
                                                <Text style={styles.error}>{validationErrors.no_of_children}</Text>
                                            )}
                                        </>
                                    )} */}
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
                        ) : (
                            <View style={styles.editOptions}>
                                {/* <Text style={styles.titleNew}>Personal Details</Text>
                                    <View style={styles.line} /> */}
                                {personalDetails && (
                                    <>
                                        <Text style={styles.labelNew}>Name : <Text style={styles.valueNew}>{personalDetails.personal_profile_name || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Gender : <Text style={styles.valueNew}>{personalDetails.personal_gender || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Age : <Text style={styles.valueNew}>{personalDetails.personal_age || "N/A"} Years</Text></Text>
                                        <Text style={styles.labelNew}>DOB : <Text style={styles.valueNew}>{personalDetails.personal_profile_dob}</Text></Text>
                                        <Text style={styles.labelNew}>Place of Birth : <Text style={styles.valueNew}>{personalDetails.personal_place_of_birth || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Time of Birth : <Text style={styles.valueNew}>{personalDetails.personal_time_of_birth || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Height : <Text style={styles.valueNew}>{personalDetails.personal_profile_height || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Weight : <Text style={styles.valueNew}>{personalDetails.personal_weight || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Body Type : <Text style={styles.valueNew}>{personalDetails.personal_body_type || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Eye Wear : <Text style={styles.valueNew}>{personalDetails.personal_eye_wear || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Marital Status : <Text style={styles.valueNew}>{personalDetails.personal_profile_marital_status_name || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Blood Group : <Text style={styles.valueNew}>{personalDetails.personal_blood_group || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>About Myself : <Text style={styles.valueNew}>{personalDetails.personal_about_self || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Complexion : <Text style={styles.valueNew}>{personalDetails.personal_profile_complexion_name || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Hobbies : <Text style={styles.valueNew}>{personalDetails.personal_hobbies || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Physical Status : <Text style={styles.valueNew}>{personalDetails.personal_pysically_changed || "N/A"}</Text></Text>
                                        <Text style={styles.labelNew}>Registered Mobile : <Text style={styles.valueNew}>{personalDetails.mobile_no || "N/A"}</Text></Text>
                                        {/* <Text style={styles.labelNew}>Profile Created By : <Text style={styles.valueNew}>{personalDetails.personal_profile_for_name}</Text></Text> */}
                                        {/* {[2, 3, 5].includes(Number(personalDetails.personal_profile_marital_status_id)) && (
                                                <Text style={styles.labelNew}>
                                                    No. of Children : <Text style={styles.valueNew}>{personalDetails.no_of_children}</Text>
                                                </Text>
                                            )} */}
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            )}

            {showEducationDetails && (
                <EducationalDetails />
            )}

            {showFamilyDetails && (
                <FamilyDetails />
            )}

            {showHoroscopeDetails && (
                <HoroscopeDetails />
            )}

            {showContactDetails && (
                <ContactDetails />
            )}

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "flex-start",
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
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconStyle: {
        marginHorizontal: 8,
    },
    iconText: {
        fontSize: 12,
        marginBottom: 2,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
        alignSelf: 'flex-start',
        fontWeight: 'bold',
    },
    iconMenuFlex: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        // width: "100%",
    },
    menuChanges: {
        width: '100%', backgroundColor: '#4F515D',
        justifyContent: 'center', alignItems: 'center'
    },
    redText: {
        color: "#ED1E24",
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "inter",
        marginVertical: 15,
        alignSelf: "flex-start",
        paddingHorizontal: 10,
    },

    editOptions: {
        width: '90%',
        backgroundColor: '#ffffff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 2,
        marginTop: 10
    },
    labelNew: {
        color: '#282C3F',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 7
    },
    valueNew: {
        color: '#282C3F',
        fontSize: 15,
        fontWeight: '500',
    },
    menuContainer: {
        width: "100%",
        overflow: 'hidden', // Ensure content doesn't overflow
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

    // editOptions: {
    //     // padding: 20, // Add some padding for spacing
    // },
    input: {
        height: 50, // Increase height
        borderWidth: 1,
        borderColor: '#ccc', // Light gray border
        borderRadius: 5, // Rounded corners
        paddingHorizontal: 10, // Horizontal padding
        marginBottom: 15, // Space between inputs
        fontSize: 16, // Increase font size for better readability
    },
    pickerSelect: {
        inputIOS: {
            height: 50, // Increase height
            borderWidth: 1,
            borderColor: '#ccc', // Light gray border
            borderRadius: 5, // Rounded corners
            paddingHorizontal: 10, // Horizontal padding
            marginBottom: 15, // Space between inputs
            fontSize: 16, // Increase font size for better readability
        },
        inputAndroid: {
            height: 50, // Increase height
            borderWidth: 1,
            borderColor: '#ccc', // Light gray border
            borderRadius: 5, // Rounded corners
            paddingHorizontal: 10, // Horizontal padding
            marginBottom: 15, // Space between inputs
            fontSize: 16, // Increase font size for better readability

        },
    },
    label: {
        marginBottom: 5, // Space between label and input
        fontSize: 16, // Font size for labels
    },
    container: {
        marginBottom: 15, // Space between container elements
    },
    scrollViewContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // padding: 16,
    },
    iconsRowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // alignItems: 'center',
        width: '100%',
        paddingHorizontal: 16,
        backgroundColor: '#4F515D',
        paddingVertical: 20,
        borderBottomWidth: 0.5,
        borderColor: '#fff',
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
    },
    titleNew: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },

    line: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 10,
        width: '100%',
    },

    // labelNew: {
    //     fontSize: 14,
    //     color: '#666',
    //     marginVertical: 5,
    //     fontWeight: '500',
    // },

    valueNew: {
        fontSize: 14,
        color: '#333',
        fontWeight: '400',
    },

    // editOptions: {
    //     backgroundColor: '#FFF',
    //     borderRadius: 8,
    //     padding: 15,
    //     width: '90%',
    //     marginVertical: 10,
    //     elevation: 2,
    //     shadowColor: '#000',
    //     shadowOffset: {
    //         width: 0,
    //         height: 2,
    //     },
    //     shadowOpacity: 0.25,
    //     shadowRadius: 3.84,
    // },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    timePicker: {
        flex: 1,
        marginHorizontal: 2,
    },
    timeSeparator: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginHorizontal: 5,
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        color: 'black',
        paddingRight: 30,
        textAlign: 'center',
    },
    inputAndroid: {
        fontSize: 16,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        color: 'black',
        paddingRight: 30,
        textAlign: 'center',
    },
});