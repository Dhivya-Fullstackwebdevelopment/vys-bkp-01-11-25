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
import { getProfileDetailsMatch, getMyProfilePersonal, updateProfilePersonal } from '../../CommonApiCall/CommonApiCall';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

// =====================================================================================
// ✅ Sticky icon row — solid background + zIndex/elevation so it's always clearly
//    visible once stuck (this was the "sticky not visible" bug — combined with the
//    header no longer reserving blank space, the bar now sits flush at the top).
// =====================================================================================
export const ProfileIconsBar = ({ onSelectSection }) => {
    return (
        <View style={styles.iconsRowContainer}>
            <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => onSelectSection && onSelectSection('personal')}>
                    <FontAwesome5 name="user-circle" size={24} color={'#FFFFFF'} style={styles.iconStyle} />
                </TouchableOpacity>
                <Text style={[styles.iconText, { color: '#FFFFFF' }]}>Personal</Text>
            </View>

            <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => onSelectSection && onSelectSection('education')}>
                    <MaterialIcons name="work" size={22} color={'#FFFFFF'} style={styles.iconStyle} />
                </TouchableOpacity>
                <Text style={[styles.iconText, { color: '#FFFFFF' }]}>Work</Text>
            </View>

            <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => onSelectSection && onSelectSection('family')}>
                    <FontAwesome5 name="users" size={22} color={'#FFFFFF'} style={styles.iconStyle} />
                    <Text style={[styles.iconText, { color: '#FFFFFF' }]}>Family</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => onSelectSection && onSelectSection('horoscope')}>
                    <MaterialCommunityIcons name="zodiac-libra" size={22} color={'#FFFFFF'} style={styles.iconStyle} />
                </TouchableOpacity>
                <Text style={[styles.iconText, { color: '#FFFFFF' }]}>Horoscope</Text>
            </View>

            <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => onSelectSection && onSelectSection('contact')}>
                    <MaterialIcons name="phone" size={22} color={'#FFFFFF'} style={styles.iconStyle} />
                </TouchableOpacity>
                <Text style={[styles.iconText, { color: '#FFFFFF' }]}>Contact</Text>
            </View>
        </View>
    );
};

// =====================================================================================
// ✅ All sections stacked together. Personal Details header now matches Image 3's
//    style exactly: icon + bold title + divider line, same card container
//    (rounded corners + shadow) used consistently in BOTH Edit and View modes.
//    All state/handlers/validation/API logic is UNCHANGED from before.
// =====================================================================================
export const ProfileSectionsContent = ({ sectionOffsetsRef }) => {

    const [personalDetails, setPersonalDetails] = useState(null);
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
        personal_body_type: '',
        profile_created_by: '',
        personal_profile_marital_status_id: null,
        personal_profile_complexion_id: null,
        personal_profile_for_id: null,
        Mobile_no: ''
    });
    const [isFetched, setIsFetched] = useState(false);
    const [showDatepicker, setShowDatepicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    const minDate = new Date(1947, 0, 1);
    const maxDate = new Date(currentYear - 19, 11, 31);
    const CalendarIcon = ({ onPress }) => (
        <Pressable onPress={onPress} style={{ position: "absolute", right: 10, top: 15 }}>
            <Ionicons name="calendar" size={18} color="#535665" />
        </Pressable>
    );

    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age.toString();
    };

    const fetchProfileData = async () => {
        try {
            const data = await getMyProfilePersonal();
            if (data && data.data) {
                setPersonalDetails(data.data);
            } else {
                setPersonalDetails(null);
            }
        } catch (error) {
            console.error('Failed to load profile data', error);
            setPersonalDetails(null);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleTimeChange = (type, value) => {
        if (type === 'hour') setHour(value);
        else if (type === 'minute') setMinute(value);
        else if (type === 'period') setPeriod(value);

        const timeString = type === 'hour' ? `${value}:${minute} ${period}` :
            type === 'minute' ? `${hour}:${value} ${period}` :
                `${hour}:${minute} ${value}`;

        setFormValues(prevValues => ({
            ...prevValues,
            personal_time_of_birth: timeString
        }));
    };

    useEffect(() => {
        if (personalDetails?.personal_time_of_birth) {
            const timeString = personalDetails.personal_time_of_birth;
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
        if (personalDetails && !isFetched) {
            const initialAge = personalDetails.personal_profile_dob
                ? calculateAge(personalDetails.personal_profile_dob)
                : '';
            setFormValues({
                ...formValues,
                personal_profile_name: personalDetails.personal_profile_name || '',
                personal_profile_dob: personalDetails.personal_profile_dob || '',
                personal_gender: personalDetails.personal_gender || '',
                personal_age: initialAge,
                personal_place_of_birth: personalDetails.personal_place_of_birth || '',
                personal_time_of_birth: personalDetails.personal_time_of_birth || '',
                personal_weight: personalDetails.personal_weight || '',
                personal_profile_height: personalDetails.personal_profile_height?.height_value || '',
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
            });
            setIsFetched(true);
        }
    }, [personalDetails, isFetched]);

    const [Details, setProfileDetails] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
    const [heightOptions, setHeightOptions] = useState([]);
    const [complexionOptions, setComplexionOptions] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [profileOptions, setProfileOptions] = useState([]);

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
                const result = await getProfileDetailsMatch();
                setProfileDetails(result);
            } catch (error) {
                console.error('Error fetching profile details:', error);
            }
        };
        fetchProfileDetails();
    }, []);

    useEffect(() => {
        const fetchProfileOptions = async () => {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Profileholder/`);
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
            const updatedValue = value === '' ? '' : value;
            return { ...prevValues, [field]: updatedValue };
        });
        setValidationErrors((prevErrors) => ({ ...prevErrors, [field]: '' }));
    };

    useEffect(() => {
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
        if (!formValues.personal_profile_name || formValues.personal_profile_name.trim() === '') {
            errors.personal_profile_name = 'Name is required';
        }
        if (!formValues.personal_profile_dob) {
            errors.personal_profile_dob = 'Date of birth is required';
        }
        if (!formValues.personal_place_of_birth || formValues.personal_place_of_birth.trim() === '') {
            errors.personal_place_of_birth = 'Place of birth is required';
        }
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
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        const timeOfBirth = hour && minute ? `${hour}:${minute} ${period}` : '';

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
            };
            try {
                const response = await updateProfilePersonal(profileData);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Profile Details updated successfully' || response.message,
                });
                setIsEditMode(false);
                fetchProfileData();
                await AsyncStorage.setItem("age", formValues.personal_age.toString());
                await AsyncStorage.setItem("height", formValues.personal_profile_height.toString());

            } catch (error) {
                console.error('Failed to update profile:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to update profile details' || error.message,
                });
            }
        }
    };

    // ---- helper to write layout offsets onto the ref passed from MyProfile ----
    const setOffset = (key) => (e) => {
        if (sectionOffsetsRef && sectionOffsetsRef.current) {
            sectionOffsetsRef.current[key] = e.nativeEvent.layout.y;
        }
    };

    return (
        <View style={styles.scrollViewContentContainer}>

            {/* ===== Personal Details — card header matches Image 3: icon + title + divider,
                     same for both Edit and View so all sections look visually equal ===== */}
            <View style={styles.menuChanges} onLayout={setOffset('personal')}>
                <View style={styles.editOptions}>

                    {/* ✅ Consistent section header row (icon + title + divider) */}
                    <View style={styles.sectionHeaderRow}>
                        <FontAwesome5 name="user-circle" size={20} color="#BD1225" style={{ marginRight: 8 }} />
                        <Text style={styles.sectionHeaderTitle}>Personal Details</Text>
                    </View>
                    <View style={styles.sectionDivider} />

                    <TouchableWithoutFeedback onPress={() => setIsEditMode(!isEditMode)}>
                        <Text style={styles.redText}>{isEditMode ? 'View' : 'Edit'}</Text>
                    </TouchableWithoutFeedback>

                    {isEditMode ? (
                        <View style={styles.editOptionsInner}>
                            <Text style={styles.labelNew}>Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Name"
                                value={formValues.personal_profile_name}
                                onChangeText={(text) => handleChange('personal_profile_name', text)}
                            />
                            {validationErrors.personal_profile_name && <Text style={styles.error}>{validationErrors.personal_profile_name}</Text>}

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
                                            handleChange('personal_profile_dob', formattedDate);
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

                            <Text style={styles.labelNew}>Height</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_profile_height', value)}
                                items={heightOptions}
                                value={formValues.personal_profile_height}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => (<Ionicons name="chevron-down" size={24} color="gray" style={{ marginTop: 10 }} />)}
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

                            <Text style={styles.labelNew}>Body Type</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_body_type', value)}
                                items={[
                                    { label: 'Slim', value: 'Slim' },
                                    { label: 'Fat', value: 'Fat' },
                                    { label: 'Normal', value: 'Normal' },
                                ]}
                                value={formValues.personal_body_type}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => (<Ionicons name="chevron-down" size={24} color="gray" style={{ marginTop: 10 }} />)}
                                placeholder={{ label: "Body Type", value: null }}
                                style={pickerSelectStyles}
                            />

                            <Text style={styles.labelNew}>Eye Wear</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_eye_wear', value)}
                                items={[
                                    { label: 'Yes', value: 'Yes' },
                                    { label: 'No', value: 'No' },
                                ]}
                                value={formValues.personal_eye_wear}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => (<Ionicons name="chevron-down" size={24} color="gray" style={{ marginTop: 10 }} />)}
                                placeholder={{ label: "Eye Wear", value: null }}
                                style={pickerSelectStyles}
                            />

                            <Text style={styles.labelNew}>Marital Status</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_profile_marital_status_id', value)}
                                items={maritalStatusOptions}
                                value={formValues.personal_profile_marital_status_id}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => (<Ionicons name="chevron-down" size={24} color="gray" style={{ marginTop: 10 }} />)}
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

                            <Text style={styles.labelNew}>About Myself</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="About Yourself"
                                value={formValues.personal_about_self}
                                onChangeText={(text) => handleChange('personal_about_self', text)}
                            />

                            <Text style={styles.labelNew}>Complexion</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_profile_complexion_id', value)}
                                items={complexionOptions}
                                value={formValues.personal_profile_complexion_id}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => (<Ionicons name="chevron-down" size={24} color="gray" style={{ marginTop: 10 }} />)}
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

                            <Text style={styles.labelNew}>Physical Status</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_pysically_changed', value)}
                                items={[
                                    { label: 'Yes', value: 'yes' },
                                    { label: 'No', value: 'no' },
                                ]}
                                value={formValues.personal_pysically_changed}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => (<Ionicons name="chevron-down" size={24} color="gray" style={{ marginTop: 10 }} />)}
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

                            <View style={styles.formContainer1}>
                                <TouchableOpacity style={styles.btn} onPress={handleSave}>
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
                        <View style={styles.editOptionsInner}>
                            {personalDetails && (
                                <>
                                    <Text style={styles.labelNew}>Name : <Text style={styles.valueNew}>{personalDetails.personal_profile_name || "N/A"}</Text></Text>
                                    <Text style={styles.labelNew}>Gender : <Text style={styles.valueNew}>{personalDetails.personal_gender || "N/A"}</Text></Text>
                                    <Text style={styles.labelNew}>Age : <Text style={styles.valueNew}>{personalDetails.personal_age || "N/A"} Years</Text></Text>
                                    <Text style={styles.labelNew}>DOB : <Text style={styles.valueNew}>{personalDetails.personal_profile_dob}</Text></Text>
                                    <Text style={styles.labelNew}>Place of Birth : <Text style={styles.valueNew}>{personalDetails.personal_place_of_birth || "N/A"}</Text></Text>
                                    <Text style={styles.labelNew}>Time of Birth : <Text style={styles.valueNew}>{personalDetails.personal_time_of_birth || "N/A"}</Text></Text>
                                    <Text style={styles.labelNew}>Height : <Text style={styles.valueNew}>{personalDetails.personal_profile_height?.height_desc || "N/A"}</Text></Text>
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
                                </>
                            )}
                        </View>
                    )}
                </View>
            </View>

            {/* ===== Education — always visible ===== */}
            <View onLayout={setOffset('education')}>
                <EducationalDetails />
            </View>

            {/* ===== Family — always visible ===== */}
            <View onLayout={setOffset('family')}>
                <FamilyDetails />
            </View>

            {/* ===== Horoscope — always visible ===== */}
            <View onLayout={setOffset('horoscope')}>
                <HoroscopeDetails />
            </View>

            {/* ===== Contact — always visible ===== */}
            <View onLayout={setOffset('contact')}>
                <ContactDetails />
            </View>

        </View>
    )
};

// Default export kept for backward compatibility with any other screen still
// importing `{ ProfileDetailsEdit }` directly (non-sticky fallback usage).
export const ProfileDetailsEdit = () => {
    const localOffsetsRef = useRef({});
    return (
        <>
            <ProfileIconsBar onSelectSection={() => {}} />
            <ProfileSectionsContent sectionOffsetsRef={localOffsetsRef} />
        </>
    );
};

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
    // ✅ Sticky bar container — solid bg + shadow/elevation to always be visible
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
    },
    menuChanges: {
        width: '100%',
        backgroundColor: '#F4F4F4',
        justifyContent: 'center',
        alignItems: 'center'
    },
    redText: {
        color: "#ED1E24",
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "inter",
        marginVertical: 10,
        alignSelf: "flex-end",
    },

    // ✅ Consistent card container for ALL sections — rounded corners + soft shadow,
    //    matches Image 3's card look. Used the same way in Edit & View.
    editOptions: {
        width: '92%',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        marginTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    // ✅ Inner wrapper for form/view content beneath the header row
    editOptionsInner: {
        width: '100%',
    },
    // ✅ Icon + Title row (matches Image 3's "Personal Details" style)
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#282C3F',
    },
    sectionDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#EDEDED',
        width: '100%',
        marginBottom: 4,
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
        overflow: 'hidden',
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
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    pickerSelect: {
        inputIOS: {
            height: 50,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 5,
            paddingHorizontal: 10,
            marginBottom: 15,
            fontSize: 16,
        },
        inputAndroid: {
            height: 50,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 5,
            paddingHorizontal: 10,
            marginBottom: 15,
            fontSize: 16,
        },
    },
    scrollViewContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ✅ FIXED sticky icon bar: solid bg, clear elevation so nothing hides it
    iconsRowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 16,
        backgroundColor: '#4F515D',
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderColor: '#fff',
        zIndex: 12,
        elevation: 8,
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
        paddingHorizontal: 0,
        marginTop: 10,
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
        marginBottom: 10,
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