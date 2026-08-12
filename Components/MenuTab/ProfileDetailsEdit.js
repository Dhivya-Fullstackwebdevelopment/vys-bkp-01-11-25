import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    Pressable,
    ScrollView,
} from "react-native";
import {
    Ionicons,
    MaterialIcons,
    FontAwesome5,
    MaterialCommunityIcons
} from "@expo/vector-icons";
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
import { Colors } from "../../Reusable/Theme";

export const ProfileIconsBar = ({ onSelectSection, activeSection, sections }) => {
    const tabList = sections || [
        { key: 'personal', label: 'Personal' },
        { key: 'education', label: 'Work & Education' },
        { key: 'family', label: 'Family' },
        { key: 'horoscope', label: 'Horoscope' },
        { key: 'contact', label: 'Contact' },
    ];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalTabContent}
        >
            {tabList.map((tab) => {
                const isActive = activeSection === tab.key;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabPill, isActive && styles.tabPillActive]}
                        onPress={() => onSelectSection && onSelectSection(tab.key)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

export const ProfileSectionsContent = ({ sectionOffsetsRef, setLoading }) => {
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
        Physically_challenged_details: "",
        Mobile_no: ''
    });
    const [isFetched, setIsFetched] = useState(false);
    const [showDatepicker, setShowDatepicker] = useState(false);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    const minDate = new Date(1947, 0, 1);
    const maxDate = new Date(currentYear - 19, 11, 31);

    const CalendarIcon = ({ onPress }) => (
        <Pressable onPress={onPress} style={styles.calendarIconPosition}>
            <Ionicons name="calendar" size={18} color={Colors.textMuted} />
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
                Physically_challenged_details:
                    formValues.personal_pysically_changed === "yes"
                        ? formValues.Physically_challenged_details
                        : "",

                Profile_for: formValues.personal_profile_for_id,
                Mobile_no: formValues.Mobile_no
            };
            try {
                if (setLoading) setLoading(true);
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
            } finally {
                if (setLoading) setLoading(false);
            }
        }
    };

    const setOffset = (key) => (e) => {
        if (sectionOffsetsRef && sectionOffsetsRef.current) {
            sectionOffsetsRef.current[key] = e.nativeEvent.layout.y;
        }
    };

    const renderRow = (label, value) => {
        if (value === undefined || value === null || value === '') return null;
        return (
            <View style={styles.rowItem} key={label}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowValue}>{value}</Text>
            </View>
        );
    };

    const ChevronIcon = () => (
        <Ionicons name="chevron-down" size={22} color={Colors.textMuted} style={{ marginTop: 10 }} />
    );

    return (
        <View style={styles.scrollViewContentContainer}>
            <View style={styles.menuChanges} onLayout={setOffset('personal')}>
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <View style={styles.sectionIconCircle}>
                            <FontAwesome5 name="user-circle" size={15} color={Colors.primary} />
                        </View>
                        <Text style={styles.cardSectionTitle}>Personal Details</Text>
                        <TouchableWithoutFeedback onPress={() => setIsEditMode(!isEditMode)}>
                            <View style={styles.editPill}>
                                <Ionicons name={isEditMode ? "eye-outline" : "create-outline"} size={14} color={Colors.primary} />
                                <Text style={styles.editPillText}>{isEditMode ? 'View' : 'Edit'}</Text>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>

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

                            <Text style={styles.labelNew}>Date of Birth</Text>
                            <Pressable onPress={() => setShowDatepicker(true)}>
                                <TextInput
                                    style={[styles.input, { color: Colors.textDark }]}
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
                                style={[styles.input, { color: Colors.textDark }]}
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
                                        Icon={ChevronIcon}
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
                                        Icon={ChevronIcon}
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
                                        Icon={ChevronIcon}
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
                                Icon={ChevronIcon}
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
                                Icon={ChevronIcon}
                                placeholder={{ label: "Select Body Type", value: null }}
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
                                Icon={ChevronIcon}
                                placeholder={{ label: "Select Eye Wear", value: null }}
                                style={pickerSelectStyles}
                            />

                            <Text style={styles.labelNew}>Marital Status</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_profile_marital_status_id', value)}
                                items={maritalStatusOptions}
                                value={formValues.personal_profile_marital_status_id}
                                useNativeAndroidPickerStyle={false}
                                Icon={ChevronIcon}
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
                                Icon={ChevronIcon}
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
                                onValueChange={(value) => {
                                    handleChange("personal_pysically_changed", value);
                                    if (value === "no") {
                                        handleChange("Physically_challenged_details", "");
                                    }
                                }}
                                items={[
                                    { label: "Yes", value: "yes" },
                                    { label: "No", value: "no" },
                                ]}
                                value={formValues.personal_pysically_changed}
                                useNativeAndroidPickerStyle={false}
                                Icon={ChevronIcon}
                                placeholder={{
                                    label: "Physical Status",
                                    value: null,
                                }}
                                style={pickerSelectStyles}
                            />

                            {formValues.personal_pysically_changed === "yes" && (
                                <>
                                    <Text style={styles.labelNew}>Challenged Details</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Challenged Details"
                                        value={formValues.Physically_challenged_details}
                                        onChangeText={(text) =>
                                            handleChange(
                                                "Physically_challenged_details",
                                                text
                                            )
                                        }
                                    />
                                </>
                            )}

                            <Text style={styles.labelNew}>Registered Mobile</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Registered Mobile"
                                value={formValues.Mobile_no}
                                onChangeText={(text) => handleChange('Mobile_no', text)}
                                keyboardType="numeric"
                            />
                            {validationErrors.Mobile_no && (
                                <Text style={styles.error}>{validationErrors.Mobile_no}</Text>
                            )}

                            <View style={styles.formContainer1}>
                                <TouchableOpacity style={styles.btn} onPress={handleSave}>
                                    <LinearGradient
                                        colors={[Colors.primary, Colors.primary]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
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
                            {personalDetails ? (
                                <>
                                    {renderRow("Name", personalDetails.personal_profile_name)}
                                    {renderRow("Gender", personalDetails.personal_gender)}
                                    {renderRow("Age", personalDetails.personal_age ? `${personalDetails.personal_age} Years` : null)}
                                    {renderRow("DOB", personalDetails.personal_profile_dob)}
                                    {renderRow("Place of Birth", personalDetails.personal_place_of_birth)}
                                    {renderRow("Time of Birth", personalDetails.personal_time_of_birth)}
                                    {renderRow("Height", personalDetails.personal_profile_height?.height_desc)}
                                    {renderRow("Weight", personalDetails.personal_weight)}
                                    {renderRow("Body Type", personalDetails.personal_body_type)}
                                    {renderRow("Eye Wear", personalDetails.personal_eye_wear)}
                                    {renderRow("Marital Status", personalDetails.personal_profile_marital_status_name)}
                                    {renderRow("Blood Group", personalDetails.personal_blood_group)}
                                    {renderRow("About Myself", personalDetails.personal_about_self)}
                                    {renderRow("Complexion", personalDetails.personal_profile_complexion_name)}
                                    {renderRow("Hobbies", personalDetails.personal_hobbies)}
                                    {renderRow("Physical Status", personalDetails.personal_pysically_changed)}
                                    {renderRow("Challenged Details", personalDetails.Physically_challenged_details)}
                                    {renderRow("Registered Mobile", personalDetails.mobile_no)}
                                </>
                            ) : null}
                        </View>
                    )}
                </View>
            </View>

            <View onLayout={setOffset('education')} style={{ width: '100%' }}>
                <EducationalDetails setLoading={setLoading} />
            </View>

            <View onLayout={setOffset('family')} style={{ width: '100%' }}>
                <FamilyDetails setLoading={setLoading} />
            </View>

            <View onLayout={setOffset('horoscope')} style={{ width: '100%' }}>
                <HoroscopeDetails setLoading={setLoading} />
            </View>

            <View onLayout={setOffset('contact')} style={{ width: '100%', marginBottom: 100 }}>
                <ContactDetails setLoading={setLoading} />
            </View>
        </View>
    );
};

export const ProfileDetailsEdit = () => {
    const localOffsetsRef = useRef({});
    return (
        <>
            <ProfileIconsBar onSelectSection={() => { }} />
            <ProfileSectionsContent sectionOffsetsRef={localOffsetsRef} />
        </>
    );
};

const styles = StyleSheet.create({
    horizontalTabContent: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        alignItems: 'center',
    },
    tabPill: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.cardBackground,
        marginRight: 8,
        alignItems: 'center',
        elevation: 1,
    },
    tabPillActive: {
        backgroundColor: Colors.primary,
    },
    tabPillText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    tabPillTextActive: {
        color: '#FFFFFF',
    },
    iconsRowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 16,
        backgroundColor: Colors.cardBackground,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: Colors.border,
        zIndex: 12,
        elevation: 8,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconStyle: {
        marginHorizontal: 8,
    },
    iconText: {
        fontSize: 11,
        marginTop: 4,
        textAlign: 'center',
        fontWeight: '700',
        color: Colors.textDark,
    },
    menuChanges: {
        width: '100%',
        backgroundColor: Colors.selectedBg,
    },
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 18,
        padding: 16,
        marginBottom: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    sectionIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.iconContainerBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textDark,
        fontFamily: 'serif',
        flex: 1,
    },
    editPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: Colors.iconContainerBg,
    },
    editPillText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    editOptionsInner: {
        width: '100%',
        marginTop: 4,
    },
    rowItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.chipInactiveBg,
    },
    rowLabel: {
        fontSize: 13,
        color: Colors.textMuted,
        flex: 1,
    },
    rowValue: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textDark,
        flex: 1.2,
        textAlign: 'right',
    },
    error: {
        color: Colors.destructive,
        fontSize: 12,
        marginTop: 2,
        marginBottom: 6,
        alignSelf: 'flex-start',
        fontWeight: '600',
    },
    labelNew: {
        color: Colors.textDark,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 10,
        fontSize: 15,
        color: Colors.textDark,
        backgroundColor: Colors.surface,
    },
    scrollViewContentContainer: {
        flexGrow: 1,
        width: '100%',
        gap: 12,
    },
    loginContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    login: {
        textAlign: "center",
        color: "white",
        fontWeight: "700",
        fontSize: 15,
        letterSpacing: 0.4,
    },
    formContainer1: {
        width: "100%",
        marginTop: 12,
    },
    linearGradient: {
        borderRadius: 22,
        justifyContent: "center",
        padding: 14,
    },
    btn: {
        width: "100%",
        alignSelf: "center",
        borderRadius: 22,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    timePicker: {
        flex: 1,
        marginHorizontal: 2,
    },
    timeSeparator: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textDark,
        marginHorizontal: 5,
    },
    calendarIconPosition: {
        position: "absolute",
        right: 12,
        top: 14,
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 15,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        color: Colors.textDark,
        paddingRight: 30,
        marginBottom: 10,
        backgroundColor: Colors.surface,
    },
    inputAndroid: {
        fontSize: 15,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        color: Colors.textDark,
        paddingRight: 30,
        marginBottom: 10,
        backgroundColor: Colors.surface,
    },
});