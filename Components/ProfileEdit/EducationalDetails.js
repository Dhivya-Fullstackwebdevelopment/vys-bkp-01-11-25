import React, { useState, useRef, useEffect } from 'react'
import {
    StyleSheet,
    Text,
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
    TextInput,
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
import { getMyEducationalDetails, updateProfileEducation } from '../../CommonApiCall/CommonApiCall';
import RNPickerSelect from 'react-native-picker-select';
import config from "../../API/Apiurl";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

export const EducationalDetails = () => {

    const [educationalDetails, setEducationalDetails] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [highestEduOptions, setHighestEduOptions] = useState([]);
    const [annualIncomeOptions, setAnnualIncomeOptions] = useState([]);
    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [professionOptions, setProfessionalPreferences] = useState([]);
    const [isFetched, setIsFetched] = useState(false);
    const [fieldOfStudyOptions, setFieldOfStudyOptions] = useState([]);
    const [degreeOptions, setDegreeOptions] = useState([]);
    const [selectedDegrees, setSelectedDegrees] = useState([]);
    const [isOthersSelected, setIsOthersSelected] = useState(false);
    const [districtList, setDistrictList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [workDistrictInput, setWorkDistrictInput] = useState("");
    const [customCity, setCustomCity] = useState("");
    const [showStateTextbox, setShowStateTextbox] = useState(false);
    const [isCityDropdown, setIsCityDropdown] = useState(true);

    const fetchFieldOfStudy = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Field_ofstudy/`);
            const fieldOfStudyArray = Object.keys(response.data).map(key => ({
                label: response.data[key].study_description,
                value: response.data[key].study_id.toString(),
            }));
            setFieldOfStudyOptions(fieldOfStudyArray);
        } catch (error) {
            console.error("Error fetching Field of Study:", error);
        }
    };

    const fetchDegreeOptions = async (eduLevel, fieldOfStudy) => {
        if (!eduLevel || !fieldOfStudy) return;

        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Degree_list/`, {
                edu_level: eduLevel,
                field_of_study: fieldOfStudy,
            });

            const degreeArray = Object.keys(response.data).map(key => ({
                label: response.data[key].degeree_description,
                value: response.data[key].degeree_id.toString(),
            }));
            setDegreeOptions(degreeArray);
        } catch (error) {
            console.error("Error fetching degrees:", error);
        }
    };

    const fetchDistrictList = async (stateId) => {
        if (!stateId) {
            setDistrictList([]);
            return;
        }

        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_District/`, {
                state_id: stateId.toString(),
            });
            const districtData = response.data;

            const formattedDistrictList = Object.keys(districtData).map((key) => ({
                label: districtData[key].disctict_name,
                value: districtData[key].disctict_id.toString(),
            }));

            setDistrictList(formattedDistrictList);
        } catch (error) {
            console.error("Error fetching district list:", error);
            setDistrictList([]);
        }
    };

    const fetchCityList = async (districtId) => {
        if (!districtId) {
            setCityList([]);
            return;
        }

        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_City/`, {
                district_id: districtId.toString(),
            });
            const cityData = response.data;

            const formattedCityList = Object.keys(cityData).map((key) => ({
                label: cityData[key].city_name,
                value: cityData[key].city_id.toString(),
            }));

            setCityList(formattedCityList);
            setIsCityDropdown(true);
        } catch (error) {
            console.error("Error fetching city list:", error);
            setCityList([]);
        }
    };

    const fetchAnnualIncomeOptions = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Annual_Income/`);
            const annualIncomeArray = Object.keys(response.data).map(key => ({
                label: response.data[key].income_description,
                value: response.data[key].income_id.toString(),
            }));
            setAnnualIncomeOptions(annualIncomeArray);
        } catch (error) {
            console.error("Error fetching Annual Income:", error);
        }
    };

    const fetchCountryList = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Country/`);
            const countryData = response.data;

            const formattedCountryList = Object.keys(countryData).map((key) => ({
                label: countryData[key].country_name,
                value: countryData[key].country_id.toString(),
            }));

            setCountryList(formattedCountryList);
        } catch (error) {
            console.error("Error fetching country list:", error);
        }
    };

    useEffect(() => {
        fetchCountryList();
        fetchAnnualIncomeOptions();
        fetchFieldOfStudy();
    }, []);

    useEffect(() => {
        const fetchHighestEducation = async () => {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Highest_Education/`);
                const highestEduArray = Object.keys(response.data).map(key => ({
                    label: response.data[key].education_description,
                    value: response.data[key].education_id.toString(),
                }));
                setHighestEduOptions(highestEduArray);
            } catch (error) {
                console.error("Error fetching highest education:", error);
            }
        };
        fetchHighestEducation();
    }, []);

    const fetchStateList = async (countryId) => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_State/`, {
                country_id: countryId,
            });
            const stateData = response.data;

            const formattedStateList = Object.keys(stateData).map((key) => ({
                label: stateData[key].state_name,
                value: stateData[key].state_id.toString(),
            }));

            setStateList(formattedStateList);
        } catch (error) {
            console.error("Error fetching state list:", error);
        }
    };

    useEffect(() => {
        const fetchProfessionalPreferences = async () => {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Profes_Pref/`);

                const professionalPreferencesArray = Object.keys(response.data).map(key => ({
                    label: response.data[key].Profes_name,
                    value: response.data[key].Profes_Pref_id.toString(),
                }));

                setProfessionalPreferences(professionalPreferencesArray);
            } catch (error) {
                console.error("Error fetching Professional Preferences:", error);
            }
        };
        fetchProfessionalPreferences();
    }, []);

    const [formValues, setFormValues] = useState({
        personal_edu_name: '',
        personal_about_edu: '',
        personal_profession_name: '',
        personal_ann_inc_name: '',
        personal_gross_ann_inc: '',
        personal_work_coun_name: '',
        personal_work_sta_name: '',
        personal_work_pin: '',
        personal_career_plans: '',
        personal_work_place: '',
        personal_edu_id: null,
        personal_profession: null,
        personal_ann_inc_id: null,
        personal_work_sta_id: null,
        personal_work_coun_id: null,
        personal_company_name: '',
        personal_designation: '',
        personal_profess_details: '',
        personal_business_name: '',
        personal_business_addresss: '',
        personal_nature_of_business: '',
        persoanl_field_ofstudy: '',
        persoanl_degree: '',
        persoanl_edu_other: '',
        personal_work_district: '',
        personal_work_city: '',
        personal_work_district_id: null,
        personal_work_city_id: '',
    });

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

    useEffect(() => {
        if (educationalDetails && !isFetched) {
            setFormValues({
                personal_edu_name: educationalDetails.personal_edu_name || '',
                personal_about_edu: educationalDetails.personal_about_edu || '',
                personal_profession_name: educationalDetails.personal_profession_name || '',
                personal_ann_inc_name: educationalDetails.personal_ann_inc_name || '',
                personal_gross_ann_inc: educationalDetails.personal_gross_ann_inc || '',
                personal_work_coun_name: educationalDetails.personal_work_coun_name || '',
                personal_work_sta_name: educationalDetails.personal_work_sta_name || '',
                personal_work_pin: educationalDetails.personal_work_pin || '',
                personal_career_plans: educationalDetails.personal_career_plans || '',
                personal_work_place: educationalDetails.personal_work_place || '',
                personal_edu_id: educationalDetails.personal_edu_id || null,
                personal_profession: educationalDetails.personal_profession || null,
                personal_ann_inc_id: educationalDetails.personal_ann_inc_id || null,
                personal_work_sta_id: educationalDetails.personal_work_sta_id || null,
                personal_work_coun_id: educationalDetails.personal_work_coun_id || null,
                personal_company_name: educationalDetails.personal_company_name || '',
                personal_designation: educationalDetails.personal_designation || '',
                personal_profess_details: educationalDetails.personal_profess_details || '',
                personal_business_name: educationalDetails.personal_business_name || '',
                personal_business_addresss: educationalDetails.personal_business_addresss || '',
                personal_nature_of_business: educationalDetails.personal_nature_of_business || '',
                persoanl_field_ofstudy: educationalDetails.persoanl_field_ofstudy || '',
                persoanl_degree: educationalDetails.persoanl_degree || '',
                persoanl_edu_other: educationalDetails.persoanl_edu_other || '',
                personal_work_district: educationalDetails.personal_work_district || '',
                personal_work_city: educationalDetails.personal_work_city_name || '',
                personal_work_district_id: educationalDetails.personal_work_district_id || null,
                personal_work_city_id: educationalDetails.personal_work_city_id || null,
            });

            if (educationalDetails.persoanl_degree) {
                const degreeIds = educationalDetails.persoanl_degree.split(',').map(id => id.trim());
                setSelectedDegrees(degreeIds);
                if (degreeIds.includes("86")) {
                    setIsOthersSelected(true);
                }
            }

            if (educationalDetails.personal_edu_id && educationalDetails.persoanl_field_ofstudy) {
                fetchDegreeOptions(educationalDetails.personal_edu_id, educationalDetails.persoanl_field_ofstudy);
            }

            if (educationalDetails.personal_work_district_id) {
                setFormValues(prev => ({
                    ...prev,
                    personal_work_district_id: educationalDetails.personal_work_district_id
                }));
            } else if (educationalDetails.personal_work_district) {
                setWorkDistrictInput(educationalDetails.personal_work_district);
            }

            if (educationalDetails.personal_work_city_id) {
                const isNumericId = !isNaN(educationalDetails.personal_work_city_id);

                if (isNumericId) {
                    setFormValues(prev => ({
                        ...prev,
                        personal_work_city_id: educationalDetails.personal_work_city_id
                    }));
                    setIsCityDropdown(true);
                } else {
                    setCustomCity(educationalDetails.personal_work_city_id);
                    setIsCityDropdown(false);
                    setFormValues(prev => ({
                        ...prev,
                        personal_work_city_id: "others",
                        personal_work_city: educationalDetails.personal_work_city_id
                    }));
                }
            } else if (educationalDetails.personal_work_city_name) {
                setCustomCity(educationalDetails.personal_work_city_name);
                setFormValues(prev => ({
                    ...prev,
                    personal_work_city: educationalDetails.personal_work_city_name
                }));
            }

            if (educationalDetails.personal_work_coun_id === "1") {
                setShowStateTextbox(false);
            } else {
                setShowStateTextbox(true);
            }

            if (educationalDetails.personal_work_coun_id) {
                fetchStateList(educationalDetails.personal_work_coun_id);
            }

            if (educationalDetails.personal_work_sta_id) {
                fetchDistrictList(educationalDetails.personal_work_sta_id);
            }

            if (educationalDetails.personal_work_district_id) {
                fetchCityList(educationalDetails.personal_work_district_id);
            }

            setIsFetched(true);
        }
    }, [educationalDetails, isFetched, cityList]);

    useEffect(() => {
        if (educationalDetails && cityList.length > 0) {
            const cityIdOrName = educationalDetails.personal_work_city_id;
            const cityName = educationalDetails.personal_work_city_name;

            if (cityIdOrName && isNaN(cityIdOrName)) {
                const matchingCity = cityList.find(
                    city => city.label.toLowerCase().trim() === cityIdOrName.toLowerCase().trim()
                );

                if (matchingCity) {
                    setFormValues(prev => ({
                        ...prev,
                        personal_work_city_id: matchingCity.value,
                        personal_work_city: matchingCity.label
                    }));
                    setIsCityDropdown(true);
                    setCustomCity("");
                } else {
                    setIsCityDropdown(false);
                    setCustomCity(cityIdOrName);
                }
            } else if (cityName && !cityIdOrName) {
                const matchingCity = cityList.find(
                    city => city.label.toLowerCase().trim() === cityName.toLowerCase().trim()
                );

                if (matchingCity) {
                    setFormValues(prev => ({
                        ...prev,
                        personal_work_city_id: matchingCity.value,
                        personal_work_city: matchingCity.label
                    }));
                    setIsCityDropdown(true);
                } else {
                    setFormValues(prev => ({
                        ...prev,
                        personal_work_city_id: "others",
                        personal_work_city: cityName
                    }));
                    setIsCityDropdown(false);
                    setCustomCity(cityName);
                }
            }
        }
    }, [cityList, educationalDetails]);

    const handleChange = (field, value) => {
        setFormValues((prevValues) => {
            const updatedValue = value === '' ? '' : value;

            const updates = {
                ...prevValues,
                [field]: updatedValue,
            };

            if (field === 'personal_profession') {
                updates.personal_company_name = '';
                updates.personal_designation = '';
                updates.personal_profess_details = '';
                updates.personal_business_name = '';
                updates.personal_business_addresss = '';
                updates.personal_nature_of_business = '';
            }

            if (field === 'personal_work_coun_id') {
                updates.personal_work_sta_id = "";
                updates.personal_work_sta_name = '';
                updates.personal_work_district_id = "";
                updates.personal_work_district = '';
                updates.personal_work_city_id = "";
                updates.personal_work_city = '';
                setDistrictList([]);
                setCityList([]);
                setWorkDistrictInput("");
                setCustomCity("");

                if (value === "1") {
                    setShowStateTextbox(false);
                } else {
                    setShowStateTextbox(true);
                }
            }

            if (field === 'personal_work_sta_id') {
                updates.personal_work_district_id = "";
                updates.personal_work_district = '';
                updates.personal_work_city_id = "";
                updates.personal_work_city = '';
                setCityList([]);
                setCustomCity("");
                if (value) {
                    fetchDistrictList(value);
                }
            }

            if (field === 'personal_work_district_id') {
                updates.personal_work_city_id = "";
                updates.personal_work_city = '';
                setCustomCity("");
                if (value) {
                    fetchCityList(value);
                }
            }

            if (field === 'personal_edu_id') {
                updates.persoanl_field_ofstudy = '';
                updates.persoanl_degree = '';
                setSelectedDegrees([]);
                setDegreeOptions([]);
                setIsOthersSelected(false);
            }

            if (field === 'persoanl_field_ofstudy') {
                updates.persoanl_degree = '';
                setSelectedDegrees([]);
                setDegreeOptions([]);
                setIsOthersSelected(false);

                if (updates.personal_edu_id && value) {
                    fetchDegreeOptions(updates.personal_edu_id, value);
                }
            }

            return updates;
        });

        if (field === 'personal_work_coun_id' && value) {
            fetchStateList(value);
        }

        setValidationErrors((prevErrors) => ({
            ...prevErrors,
            [field]: '',
        }));
    };

    const handleDegreeSelection = (degreeId) => {
        setSelectedDegrees(prev => {
            let newSelectedDegrees;
            if (prev.includes(degreeId)) {
                newSelectedDegrees = prev.filter(id => id !== degreeId);
            } else {
                newSelectedDegrees = [...prev, degreeId];
            }

            setFormValues(prevValues => ({
                ...prevValues,
                persoanl_degree: newSelectedDegrees.join(',')
            }));

            setIsOthersSelected(newSelectedDegrees.includes("86"));

            return newSelectedDegrees;
        });
    };

    const handleCityChange = (value) => {
        if (value === "others") {
            setIsCityDropdown(false);
            setCustomCity("");
            setFormValues(prev => ({
                ...prev,
                personal_work_city_id: "others",
                personal_work_city: ""
            }));
        } else {
            setIsCityDropdown(true);
            const selectedCity = cityList.find(city => city.value === value);
            setFormValues(prev => ({
                ...prev,
                personal_work_city_id: selectedCity,
                personal_work_city: selectedCity ? selectedCity.label : ""
            }));
        }
    };

    const handleCustomCityInput = (text) => {
        setCustomCity(text);
        setFormValues(prev => ({
            ...prev,
            personal_work_city: text
        }));
    };

    const validateForm = () => {
        const errors = {};
        let hasErrors = false;

        const validateField = (value, fieldName, errorMessage) => {
            if (!value || value.trim() === '') {
                errors[fieldName] = errorMessage;
                hasErrors = true;
                return false;
            }
            return true;
        };

        validateField(formValues.personal_edu_id, 'personal_edu_id', 'Education Level is required');
        validateField(formValues.personal_profession, 'personal_profession', 'Profession is required');

        setValidationErrors(errors);
        return !hasErrors;
    };

    const handleSave = async () => {
        try {
            const isValid = validateForm();
            if (!isValid) {
                const errorMessages = Object.values(validationErrors).join('\n');
                Toast.show({
                    type: 'error',
                    text1: 'Validation Error',
                    text2: errorMessages,
                    visibilityTime: 4000,
                    autoHide: true,
                });
                return;
            }

            const profileData = {
                education_level: formValues.personal_edu_id,
                about_edu: formValues.personal_about_edu?.trim(),
                profession: formValues.personal_profession,
                annual_income: formValues.personal_ann_inc_id,
                actual_income: formValues.personal_gross_ann_inc?.trim(),
                work_country: formValues.personal_work_coun_id,
                work_state: formValues.personal_work_sta_id,
                work_pincode: formValues.personal_work_pin?.trim(),
                career_plans: formValues.personal_career_plans?.trim(),
                work_place: formValues.personal_work_place?.trim(),
                field_ofstudy: formValues.persoanl_field_ofstudy,
                degree: formValues.persoanl_degree,
                other_degree: formValues.persoanl_edu_other?.trim() || '',
                company_name: "",
                designation: "",
                profession_details: "",
                business_name: "",
                business_address: "",
                nature_of_business: "",
                work_district: formValues.personal_work_coun_id === "1"
                    ? (formValues.personal_work_district_id || workDistrictInput || formValues.personal_work_district || "")
                    : "",
                work_city: formValues.personal_work_coun_id === "1"
                    ? (formValues.personal_work_city_id === "others"
                        ? customCity
                        : (formValues.personal_work_city || ""))
                    : "",
            };

            if (formValues.personal_profession === "6") {
                profileData.company_name = formValues.personal_company_name?.trim() || "";
                profileData.designation = formValues.personal_designation?.trim() || "";
                profileData.profession_details = formValues.personal_profess_details?.trim() || "";
                profileData.business_name = formValues.personal_business_name?.trim() || "";
                profileData.business_address = formValues.personal_business_addresss?.trim() || "";
                profileData.nature_of_business = formValues.personal_nature_of_business?.trim() || "";
            } else if (formValues.personal_profession === "1" || formValues.personal_profession === "7") {
                profileData.company_name = formValues.personal_company_name?.trim() || "";
                profileData.designation = formValues.personal_designation?.trim() || "";
                profileData.profession_details = formValues.personal_profess_details?.trim() || "";
            } else if (formValues.personal_profession === "2") {
                profileData.business_name = formValues.personal_business_name?.trim() || "";
                profileData.business_address = formValues.personal_business_addresss?.trim() || "";
                profileData.nature_of_business = formValues.personal_nature_of_business?.trim() || "";
            }

            const response = await updateProfileEducation(profileData);

            if (response && response.status === "success") {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: response.message || 'Profile updated successfully',
                    visibilityTime: 3000,
                    autoHide: true,
                });
                setIsEditMode(false);
                await fetchProfileData();
            } else {
                throw new Error(response?.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to update profile. Please try again.',
                visibilityTime: 4000,
                autoHide: true,
            });
        }
    };

    const educationLevelsRequiringFieldOfStudy = ["1", "2", "3", "4"];
    const showFieldOfStudy = educationLevelsRequiringFieldOfStudy.includes(formValues.personal_edu_id);

    return (
        <View style={styles.menuChanges}>
            <View style={styles.editOptions}>
                {/* Unified Section Header (Icon + Title + Divider) */}
                <View style={styles.sectionHeaderRow}>
                    <MaterialIcons name="work" size={20} color="#BD1225" style={{ marginRight: 8 }} />
                    <Text style={styles.sectionHeaderTitle}>Education & Profession Details</Text>
                </View>
                <View style={styles.sectionDivider} />

                {/* Edit / View Toggle Link */}
                <TouchableWithoutFeedback onPress={() => setIsEditMode(!isEditMode)}>
                    <Text style={styles.redText}>{isEditMode ? 'View' : 'Edit'}</Text>
                </TouchableWithoutFeedback>

                {isEditMode ? (
                    <View style={styles.editOptionsInner}>
                        <Text style={styles.labelNew}>Highest Education</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_edu_id', value)}
                            items={highestEduOptions}
                            value={formValues.personal_edu_id}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons
                                    name="chevron-down"
                                    size={24}
                                    color="gray"
                                    style={{ marginTop: 10 }}
                                />
                            )}
                            placeholder={{ label: "Select Education", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.personal_edu_id && <Text style={styles.error}>{validationErrors.personal_edu_id}</Text>}

                        {showFieldOfStudy && (
                            <>
                                <Text style={styles.labelNew}>Field of Study</Text>
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('persoanl_field_ofstudy', value)}
                                    items={fieldOfStudyOptions}
                                    value={formValues.persoanl_field_ofstudy}
                                    useNativeAndroidPickerStyle={false}
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down"
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                    placeholder={{ label: "Select Field of Study", value: null }}
                                    style={pickerSelectStyles}
                                />
                                {validationErrors.persoanl_field_ofstudy && <Text style={styles.error}>{validationErrors.persoanl_field_ofstudy}</Text>}

                                {formValues.persoanl_field_ofstudy && (
                                    <>
                                        <Text style={styles.labelNew}>Specific Field</Text>
                                        <View style={styles.dropdownContainer}>
                                            <RNPickerSelect
                                                onValueChange={(value) => {
                                                    if (value && !selectedDegrees.includes(value)) {
                                                        handleDegreeSelection(value);
                                                    }
                                                }}
                                                items={degreeOptions.filter(degree => !selectedDegrees.includes(degree.value))}
                                                useNativeAndroidPickerStyle={false}
                                                Icon={() => (
                                                    <Ionicons
                                                        name="chevron-down"
                                                        size={24}
                                                        color="gray"
                                                        style={{ marginTop: 10 }}
                                                    />
                                                )}
                                                placeholder={{ label: "Select Specific Field", value: null }}
                                                style={pickerSelectStyles}
                                            />
                                        </View>

                                        {selectedDegrees.length > 0 && (
                                            <View style={styles.selectedChipsContainer}>
                                                {selectedDegrees.map((degreeId) => {
                                                    const degree = degreeOptions.find(d => d.value === degreeId);
                                                    return (
                                                        <View key={degreeId} style={styles.chip}>
                                                            <Text style={styles.chipText}>{degree?.label}</Text>
                                                            <TouchableOpacity
                                                                onPress={() => handleDegreeSelection(degreeId)}
                                                                style={styles.chipClose}
                                                            >
                                                                <Ionicons name="close" size={16} color="#fff" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        )}

                                        {validationErrors.persoanl_degree && <Text style={styles.error}>{validationErrors.persoanl_degree}</Text>}

                                        {isOthersSelected && (
                                            <>
                                                <Text style={styles.labelNew}>Other Education</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Enter Specific field"
                                                    value={formValues.persoanl_edu_other}
                                                    onChangeText={(text) => handleChange('persoanl_edu_other', text)}
                                                />
                                                {validationErrors.persoanl_edu_other && <Text style={styles.error}>{validationErrors.persoanl_edu_other}</Text>}
                                            </>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        <Text style={styles.labelNew}>About Education</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="About Education"
                            value={formValues.personal_about_edu}
                            onChangeText={(text) => handleChange('personal_about_edu', text)}
                        />
                        {validationErrors.personal_about_edu && <Text style={styles.error}>{validationErrors.personal_about_edu}</Text>}

                        <Text style={styles.labelNew}>Profession</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_profession', value)}
                            items={professionOptions}
                            value={formValues.personal_profession}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons
                                    name="chevron-down"
                                    size={24}
                                    color="gray"
                                    style={{ marginTop: 10 }}
                                />
                            )}
                            placeholder={{ label: "Select Profession", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.personal_profession && <Text style={styles.error}>{validationErrors.personal_profession}</Text>}

                        {(formValues.personal_profession === "1" ||
                            formValues.personal_profession === "7" ||
                            formValues.personal_profession === "6") && (
                                <>
                                    <Text style={styles.labelNew}>Company Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Company Name"
                                        value={formValues.personal_company_name}
                                        onChangeText={(text) => handleChange('personal_company_name', text)}
                                    />
                                    {validationErrors.personal_company_name && <Text style={styles.error}>{validationErrors.personal_company_name}</Text>}

                                    <Text style={styles.labelNew}>Designation</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Designation"
                                        value={formValues.personal_designation}
                                        onChangeText={(text) => handleChange('personal_designation', text)}
                                    />
                                    {validationErrors.personal_designation && <Text style={styles.error}>{validationErrors.personal_designation}</Text>}

                                    <Text style={styles.labelNew}>Profession Details</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Profession Details"
                                        value={formValues.personal_profess_details}
                                        onChangeText={(text) => handleChange('personal_profess_details', text)}
                                    />
                                    {validationErrors.personal_profess_details && <Text style={styles.error}>{validationErrors.personal_profess_details}</Text>}
                                </>
                            )}

                        {(formValues.personal_profession === "6" ||
                            formValues.personal_profession === "2") && (
                                <>
                                    <Text style={styles.labelNew}>Business Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Business Name"
                                        value={formValues.personal_business_name}
                                        onChangeText={(text) => handleChange('personal_business_name', text)}
                                    />
                                    {validationErrors.personal_business_name && <Text style={styles.error}>{validationErrors.personal_business_name}</Text>}

                                    <Text style={styles.labelNew}>Business Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Business Address"
                                        value={formValues.personal_business_addresss}
                                        onChangeText={(text) => handleChange('personal_business_addresss', text)}
                                    />
                                    {validationErrors.personal_business_addresss && <Text style={styles.error}>{validationErrors.personal_business_addresss}</Text>}

                                    <Text style={styles.labelNew}>Nature of Business</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nature of Business"
                                        value={formValues.personal_nature_of_business}
                                        onChangeText={(text) => handleChange('personal_nature_of_business', text)}
                                    />
                                    {validationErrors.personal_nature_of_business && <Text style={styles.error}>{validationErrors.personal_nature_of_business}</Text>}
                                </>
                            )}

                        <Text style={styles.labelNew}>Annual Income</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_ann_inc_id', value)}
                            items={annualIncomeOptions}
                            value={formValues.personal_ann_inc_id}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons
                                    name="chevron-down"
                                    size={24}
                                    color="gray"
                                    style={{ marginTop: 10 }}
                                />
                            )}
                            placeholder={{ label: "Select Annual Income", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.personal_ann_inc_id && <Text style={styles.error}>{validationErrors.personal_ann_inc_id}</Text>}

                        <Text style={styles.labelNew}>Gross Annual Income</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Gross Income"
                            value={formValues.personal_gross_ann_inc}
                            onChangeText={(text) => handleChange('personal_gross_ann_inc', text)}
                            keyboardType="numeric"
                        />
                        {validationErrors.personal_gross_ann_inc && <Text style={styles.error}>{validationErrors.personal_gross_ann_inc}</Text>}

                        <Text style={styles.labelNew}>Work Country</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_work_coun_id', value)}
                            items={countryList}
                            value={formValues.personal_work_coun_id}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons
                                    name="chevron-down"
                                    size={24}
                                    color="gray"
                                    style={{ marginTop: 10 }}
                                />
                            )}
                            placeholder={{ label: "Select Country", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.personal_work_coun_id && <Text style={styles.error}>{validationErrors.personal_work_coun_id}</Text>}

                        {formValues.personal_work_coun_id === "1" && (
                            <>
                                <Text style={styles.labelNew}>Work State</Text>
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_work_sta_id', value)}
                                    items={stateList}
                                    value={formValues.personal_work_sta_id}
                                    useNativeAndroidPickerStyle={false}
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down"
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
                                    )}
                                    placeholder={{ label: "Select State", value: null }}
                                    style={pickerSelectStyles}
                                />
                            </>
                        )}
                        {validationErrors.personal_work_sta_id && <Text style={styles.error}>{validationErrors.personal_work_sta_id}</Text>}

                        {formValues.personal_work_coun_id === "1" && formValues.personal_work_sta_id && (
                            <>
                                <Text style={styles.labelNew}>Work District</Text>
                                {districtList.length > 0 ? (
                                    <RNPickerSelect
                                        onValueChange={(value) => {
                                            handleChange('personal_work_district_id', value);
                                            setWorkDistrictInput("");
                                        }}
                                        items={districtList}
                                        value={formValues.personal_work_district_id}
                                        useNativeAndroidPickerStyle={false}
                                        Icon={() => (
                                            <Ionicons
                                                name="chevron-down"
                                                size={24}
                                                color="gray"
                                                style={{ marginTop: 10 }}
                                            />
                                        )}
                                        placeholder={{ label: "Select District", value: null }}
                                        style={pickerSelectStyles}
                                    />
                                ) : (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter District Name"
                                        value={workDistrictInput || formValues.personal_work_district || ""}
                                        onChangeText={(text) => {
                                            setWorkDistrictInput(text);
                                            setFormValues(prev => ({
                                                ...prev,
                                                personal_work_district: text
                                            }));
                                        }}
                                    />
                                )}
                            </>
                        )}

                        {formValues.personal_work_coun_id === "1" && (formValues.personal_work_district_id || workDistrictInput) && (
                            <>
                                <Text style={styles.labelNew}>Work City</Text>
                                {isCityDropdown ? (
                                    <RNPickerSelect
                                        onValueChange={handleCityChange}
                                        items={[
                                            ...cityList,
                                            { label: "Others", value: "others" }
                                        ]}
                                        value={formValues.personal_work_city_id}
                                        useNativeAndroidPickerStyle={false}
                                        Icon={() => (
                                            <Ionicons
                                                name="chevron-down"
                                                size={24}
                                                color="gray"
                                                style={{ marginTop: 10 }}
                                            />
                                        )}
                                        placeholder={{ label: "Select City", value: null }}
                                        style={pickerSelectStyles}
                                    />
                                ) : (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter City Name"
                                        value={customCity}
                                        onChangeText={handleCustomCityInput}
                                    />
                                )}
                            </>
                        )}

                        <Text style={styles.labelNew}>Work Place</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Work Place"
                            value={formValues.personal_work_place}
                            onChangeText={(text) => handleChange('personal_work_place', text)}
                        />
                        {validationErrors.personal_work_place && <Text style={styles.error}>{validationErrors.personal_work_place}</Text>}

                        <Text style={styles.labelNew}>Pincode</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Pincode"
                            value={formValues.personal_work_pin}
                            onChangeText={(text) => handleChange('personal_work_pin', text)}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                        {validationErrors.personal_work_pin && <Text style={styles.error}>{validationErrors.personal_work_pin}</Text>}

                        <Text style={styles.labelNew}>Career Plan</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Career Plan"
                            value={formValues.personal_career_plans}
                            onChangeText={(text) => handleChange('personal_career_plans', text)}
                        />
                        {validationErrors.personal_career_plans && <Text style={styles.error}>{validationErrors.personal_career_plans}</Text>}

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
                    <View style={styles.editOptionsInner}>
                        {educationalDetails && (
                            <>
                                <Text style={styles.labelNew}>Education Level : <Text style={styles.valueNew}>{educationalDetails.personal_edu_name || "N/A"}</Text></Text>
                                {educationalDetails.persoanl_field_ofstudy_name && (
                                    <Text style={styles.labelNew}>Field of Study : <Text style={styles.valueNew}>{educationalDetails.persoanl_field_ofstudy_name || "N/A"}</Text></Text>
                                )}
                                {educationalDetails.persoanl_degree_name && (
                                    <Text style={styles.labelNew}>Specific Field : <Text style={styles.valueNew}>{educationalDetails.persoanl_degree_name || "N/A"}</Text></Text>
                                )}
                                {educationalDetails.persoanl_edu_other && (
                                    <Text style={styles.labelNew}>Other Education : <Text style={styles.valueNew}>{educationalDetails.persoanl_edu_other || "N/A"}</Text></Text>
                                )}
                                <Text style={styles.labelNew}>About Education : <Text style={styles.valueNew}>{educationalDetails.personal_about_edu || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Profession : <Text style={styles.valueNew}>{educationalDetails.personal_profession_name || "N/A"}</Text></Text>
                                {educationalDetails.personal_company_name && (
                                    <Text style={styles.labelNew}>Company Name : <Text style={styles.valueNew}>{educationalDetails.personal_company_name || "N/A"}</Text></Text>
                                )}
                                {educationalDetails.personal_designation && (
                                    <Text style={styles.labelNew}>Designation : <Text style={styles.valueNew}>{educationalDetails.personal_designation || "N/A"}</Text></Text>
                                )}
                                {educationalDetails.personal_profess_details && (
                                    <Text style={styles.labelNew}>Profession Details : <Text style={styles.valueNew}>{educationalDetails.personal_profess_details || "N/A"}</Text></Text>
                                )}
                                {educationalDetails.personal_business_name && (
                                    <Text style={styles.labelNew}>Business Name : <Text style={styles.valueNew}>{educationalDetails.personal_business_name || "N/A"}</Text></Text>
                                )}
                                {educationalDetails.personal_business_addresss && (
                                    <Text style={styles.labelNew}>Business Address : <Text style={styles.valueNew}>{educationalDetails.personal_business_addresss || "N/A"}</Text></Text>
                                )}
                                {educationalDetails.personal_nature_of_business && (
                                    <Text style={styles.labelNew}>Nature of Business : <Text style={styles.valueNew}>{educationalDetails.personal_nature_of_business || "N/A"}</Text></Text>
                                )}
                                <Text style={styles.labelNew}>Gross Annual Income : <Text style={styles.valueNew}>{educationalDetails.personal_ann_inc_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Gross Income : <Text style={styles.valueNew}>{educationalDetails.personal_gross_ann_inc || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Work Country : <Text style={styles.valueNew}>{educationalDetails.personal_work_coun_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Work State : <Text style={styles.valueNew}>{educationalDetails.personal_work_sta_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Work District : <Text style={styles.valueNew}>{educationalDetails.personal_work_district || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Work City : <Text style={styles.valueNew}>{educationalDetails.personal_work_city_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Work Place : <Text style={styles.valueNew}>{educationalDetails.personal_work_place || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Work Pincode : <Text style={styles.valueNew}>{educationalDetails.personal_work_pin || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Career Plans : <Text style={styles.valueNew}>{educationalDetails.personal_career_plans || "N/A"}</Text></Text>
                            </>
                        )}
                    </View>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    menuChanges: {
        width: '100%',
        backgroundColor: '#F4F4F4',
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    editOptionsInner: {
        width: '100%',
    },
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
    redText: {
        color: "#ED1E24",
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "inter",
        marginVertical: 10,
        alignSelf: "flex-end",
    },
    labelNew: {
        color: '#282C3F',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 7,
    },
    valueNew: {
        color: '#282C3F',
        fontSize: 15,
        fontWeight: '500',
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
    error: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
        alignSelf: 'flex-start',
        fontWeight: 'bold',
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
    selectedChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
        padding: 5,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'gray',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        margin: 4,
    },
    chipText: {
        color: '#fff',
        fontSize: 14,
        marginRight: 6,
    },
    chipClose: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownContainer: {
        marginBottom: 15,
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
    },
});