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
    Platform
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
import { getMyHoroscopeDetails, updateProfileHoroscope, fetchRasiImage, fetchAmsamImage } from '../../CommonApiCall/CommonApiCall'; // Import the API function
import RNPickerSelect from 'react-native-picker-select';
import config from "../../API/Apiurl";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const HoroscopeDetails = () => {

    const [horoscopeDetails, setHoroscopeDetails] = useState(null); // State for profile details
    const [isEditMode, setIsEditMode] = useState(false); // Toggle between view and edit mode
    const [birthStars, setBirthStars] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [rasiList, setRasiList] = useState([]);
    const [lagnams, setLagnams] = useState([]);
    const [selectedLagnam, setSelectedLagnam] = useState(null);
    const [isFetched, setIsFetched] = useState(false);
    const [dayOptions, setDayOptions] = useState([]);
    const [monthOptions, setMonthOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);
    const [rasiGrid, setRasiGrid] = useState([]);
    const [amsaGrid, setAmsaGrid] = useState([]);











    const [formValues, setFormValues] = useState({
        personal_bthstar_name: '',
        personal_bth_rasi_name: '',
        personal_lagnam_didi_name: '',
        personal_didi: '',
        personal_chevvai_dos: '',
        personal_ragu_dos: '',
        personal_nalikai: '',
        personal_surya_goth: '',
        personal_madulamn: '',
        personal_dasa: '',
        personal_dasa_bal_day: '',
        personal_dasa_bal_month: '',
        personal_dasa_bal_year: '',
        personal_bthstar_id: null,
        personal_bth_rasi_id: null,
        personal_lagnam_didi_id: null,
        personal_horoscope_hints: '',
    });

    const chevvaiDoshamOptions = [
        { label: 'Unknown', value: 'Unknown' },
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' },
    ];

    const raguDoshamOptions = [
        { label: 'Unknown', value: 'Unknown' },
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' },
    ];

    const extractGridData = (htmlString) => {
        const rows = [];
        const rowMatches = htmlString.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];

        rowMatches.forEach(rowHtml => {
            const cells = [];
            const cellMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];

            cellMatches.forEach(cellHtml => {
                // 1. Replace <br> with newline for React Native Text
                let text = cellHtml.replace(/<br\s*\/?>/gi, '\n');
                text = text.replace(/<\/p>/gi, '\n');
                // 2. Remove tags
                text = text.replace(/<[^>]+>/g, '').trim();
                // 3. Decode entities
                text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
                cells.push(text);
            });

            if (cells.length > 0) rows.push(cells);
        });
        return rows;
    };

    // --- FETCH CHARTS DATA ---
    useEffect(() => {
        const loadCharts = async () => {
            try {
                // Get logged in user ID
                const profileId = await AsyncStorage.getItem("loginuser_profileId");

                if (profileId) {
                    // Fetch Rasi
                    const rasiData = await fetchRasiImage(profileId);
                    if (rasiData && rasiData.status === 1) {
                        setRasiGrid(extractGridData(rasiData.html));
                    } else {
                        setRasiGrid([]);
                    }

                    // Fetch Amsam
                    const amsaData = await fetchAmsamImage(profileId);
                    if (amsaData && amsaData.status === 1) {
                        setAmsaGrid(extractGridData(amsaData.html));
                    } else {
                        setAmsaGrid([]);
                    }
                }
            } catch (error) {
                console.error("Error loading charts:", error);
            }
        };
        loadCharts();
    }, []);

    // Function to fetch profile data
    const fetchProfileData = async () => {
        try {
            const data = await getMyHoroscopeDetails();
            console.log("data ====>", data.data);
            setHoroscopeDetails(data.data); // Set the data in the state
        } catch (error) {
            console.error('Failed to load profile data', error);
        }
    };



    useEffect(() => {
        fetchProfileData(); // Call the function when component mounts
    }, []);

    useEffect(() => {
        const fetchBirthStars = async () => {
            try {
                const response = await axios.post(
                    `${config.apiUrl}/auth/Get_Birth_Star/`,
                    { personal_bthstar_name: "" }
                );
                const birthStarsData = Object.values(response.data).map((item) => ({
                    label: item.birth_star,
                    value: item.birth_id,
                }));
                setBirthStars(birthStarsData);
            } catch (error) {
                console.error("Error fetching Birth Star data:", error);
            }
        };

        fetchBirthStars();
    }, []);


    useEffect(() => {
        const fetchRasis = async () => {
            if (!formValues.personal_bthstar_id) return;

            try {
                const response = await axios.post(
                    `${config.apiUrl}/auth/Get_Rasi/`,
                    {
                        birth_id: formValues.personal_bthstar_id.toString(),
                    }
                );
                const rasiData = Object.values(response.data).map((item) => ({
                    label: item.rasi_name, // Adjust based on API response
                    value: item.rasi_id, // Adjust based on API response
                }));
                setRasiList(rasiData);
            } catch (error) {
                console.error("Error fetching Rasi data:", error);
            }
        };

        fetchRasis();
    }, [formValues.personal_bthstar_id]);


    useEffect(() => {
        const fetchLagnams = async () => {
            try {
                const response = await axios.post(
                    `${config.apiUrl}/auth/Get_Lagnam_Didi/`,
                    {}
                );
                const lagnamsData = Object.values(response.data).map((item) => ({
                    label: item.didi_description, // Adjust key based on API response
                    value: item.didi_id,  // Adjust key based on API response
                }));
                setLagnams(lagnamsData);
            } catch (error) {
                console.error("Error fetching Lagnam data:", error);
            }
        };

        fetchLagnams();
    }, []);



    useEffect(() => {
        // Populate day, month and year options
        const days = Array.from({ length: 31 }, (_, i) => ({
            label: i.toString(),
            label: i.toString(),
        }));
        setDayOptions(days);

        // For months: 00 to 12
        const months = Array.from({ length: 13 }, (_, i) => ({
            label: i.toString(),
            label: i.toString(),
        }));
        setMonthOptions(months);

        const years = Array.from({ length: 30 }, (_, i) => ({ label: `${i}`, value: `${i}` }));
        setYearOptions(years);
    }, []);

    useEffect(() => {
        // Update form values when personalDetails is fetched
        if (horoscopeDetails && !isFetched) {
            // Parse dasa balance value
            let day = '', month = '', year = '';
            const dasaBalance = horoscopeDetails.personal_dasa_bal;

            if (dasaBalance && typeof dasaBalance === 'string') {
                // Check for the new format first: "Y Years, M Months, D Days"
                const yearMatch = dasaBalance.match(/(\d+)\s*Years/);
                const monthMatch = dasaBalance.match(/(\d+)\s*Months/);
                const dayMatch = dasaBalance.match(/(\d+)\s*Days/);

                if (yearMatch || monthMatch || dayMatch) {
                    // New format detected
                    year = yearMatch ? yearMatch[1] : ''; // Get value or empty string
                    month = monthMatch ? monthMatch[1] : '';
                    day = dayMatch ? dayMatch[1] : '';
                } else if (dasaBalance.includes(':')) {
                    // Fallback to original parsing logic for "day:x, month:y, year:z"
                    const parts = dasaBalance.split(', ');
                    parts.forEach(part => {
                        const [key, value] = part.split(':');
                        if (key === 'day') day = value;
                        if (key === 'month') month = value;
                        if (key === 'year') year = value;
                    });
                }
            }

            setFormValues({
                personal_bthstar_name: horoscopeDetails.personal_bthstar_name || '',
                personal_bth_rasi_name: horoscopeDetails.personal_bth_rasi_name || '',
                personal_lagnam_didi_name: horoscopeDetails.personal_lagnam_didi_name || '',
                personal_didi: horoscopeDetails.personal_didi || '',
                personal_chevvai_dos: horoscopeDetails.personal_chevvai_dos || '',
                personal_ragu_dos: horoscopeDetails.personal_ragu_dos || '',
                personal_nalikai: horoscopeDetails.personal_nalikai || '',
                personal_surya_goth: horoscopeDetails.personal_surya_goth || '',
                personal_madulamn: horoscopeDetails.personal_madulamn || '',
                personal_dasa: horoscopeDetails.personal_dasa || '',
                personal_dasa_bal_day: day,
                personal_dasa_bal_month: month,
                personal_dasa_bal_year: year,
                personal_bthstar_id: horoscopeDetails.personal_bthstar_id || null,
                personal_bth_rasi_id: horoscopeDetails.personal_bth_rasi_id || null,
                personal_lagnam_didi_id: horoscopeDetails.personal_lagnam_didi_id || null,
                personal_horoscope_hints: horoscopeDetails.personal_horoscope_hints || '',
            });
            setIsFetched(true);
        }
    }, [horoscopeDetails, isFetched]);


    // Personal Menu





    // const handleChange = (field, value) => {
    //     setFormValues((prevValues) => ({

    //         ...prevValues,
    //         [field]: value,
    //     }));


    //     // Clear the error message for the field
    //     setValidationErrors((prevErrors) => ({
    //         ...prevErrors,
    //         [field]: '',
    //     }));
    // };

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

    const validateForm = () => {
        const errors = {};

        // Validate only the ID fields since they are the ones being sent to the API
        if (!formValues.personal_bthstar_id) errors.personal_bthstar_id = 'Birth Star is required';
        if (!formValues.personal_bth_rasi_id) errors.personal_bth_rasi_id = 'Rasi is required';
        // if (!formValues.personal_lagnam_didi_id) errors.personal_lagnam_didi_id = 'Lagnam/Didi is required';
        // if (!formValues.personal_didi) errors.personal_didi = 'Didi is required';
        // if (!formValues.personal_chevvai_dos) errors.personal_chevvai_dos = 'Chevvai Dosam is required';
        // if (!formValues.personal_ragu_dos) errors.personal_ragu_dos = 'Rahu Dosam is required';
        // if (!formValues.personal_nalikai) errors.personal_nalikai = 'Nalikai is required';
        if (!formValues.personal_surya_goth) errors.personal_surya_goth = 'Surya Gowthram is required';
        // if (!formValues.personal_dasa) errors.personal_dasa = 'Dasa is required';
        // if (!formValues.personal_dasa_bal_day) errors.personal_dasa_bal_day = 'Dasa Day is required';
        // if (!formValues.personal_dasa_bal_month) errors.personal_dasa_bal_month = 'Dasa Month is required';
        // if (!formValues.personal_dasa_bal_year) errors.personal_dasa_bal_year = 'Dasa Year is required';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };


    const handleSave = async () => {
        if (validateForm()) {
            try {
                console.log("formValues ====>", formValues);
                const yearVal = formValues.personal_dasa_bal_year;
                const monthVal = formValues.personal_dasa_bal_month;
                const dayVal = formValues.personal_dasa_bal_day;

                // Check if any value is selected (is not null or empty string)
                const isAnyFieldSet = (yearVal !== null && yearVal !== undefined && yearVal !== '') ||
                    (monthVal !== null && monthVal !== undefined && monthVal !== '') ||
                    (dayVal !== null && dayVal !== undefined && dayVal !== '');

                let formattedDasaBalance = ''; // Default to empty string

                if (isAnyFieldSet) {
                    // If at least one field is set, default others to '0'
                    const finalYear = yearVal || '0';
                    const finalMonth = monthVal || '0';
                    const finalDay = dayVal || '0';

                    formattedDasaBalance = `${finalYear} Years, ${finalMonth} Months, ${finalDay} Days`;
                }
                // Convert IDs to strings and ensure no null values
                const profileData = {
                    birthstar_name: formValues.personal_bthstar_id ? String(formValues.personal_bthstar_id) : '',
                    birth_rasi_name: formValues.personal_bth_rasi_id ? String(formValues.personal_bth_rasi_id) : '',
                    lagnam_didi: formValues.personal_lagnam_didi_id ? String(formValues.personal_lagnam_didi_id) : '',
                    chevvai_dosaham: formValues.personal_chevvai_dos || '',
                    ragu_dosham: formValues.personal_ragu_dos || '',
                    nalikai: formValues.personal_nalikai || '',
                    suya_gothram: formValues.personal_surya_goth || '',
                    madulamn: formValues.personal_madulamn || '',
                    dasa_name: formValues.personal_dasa || '',
                    dasa_balance: formattedDasaBalance,
                    horoscope_hints: formValues.personal_horoscope_hints || '',
                    didi: formValues.personal_didi || '',
                    amsa_kattam: "{Grid 1: empty, Grid 2: empty, Grid 3: empty, Grid 4: empty, Grid 5: empty, Grid 6: empty, Grid 7: empty, Grid 8: empty, Grid 9: empty, Grid 10: empty, Grid 11: empty, Grid 12: empty}",
                    rasi_kattam: "{Grid 1: empty, Grid 2: empty, Grid 3: empty, Grid 4: empty, Grid 5: empty, Grid 6: empty, Grid 7: empty, Grid 8: empty, Grid 9: empty, Grid 10: empty, Grid 11: empty, Grid 12: empty}"
                };

                // Validate that required fields are not empty strings
                const requiredFields = ['birthstar_name', 'birth_rasi_name', 'lagnam_didi'];
                const emptyFields = requiredFields.filter(field => !profileData[field]);

                if (emptyFields.length > 0) {
                    console.error('Required fields are empty:', emptyFields);
                    setValidationErrors({
                        submit: `Please fill in required fields: ${emptyFields.join(', ')}`
                    });
                    return;
                }

                console.log("Sending profileData ====>", profileData);
                const response = await updateProfileHoroscope(profileData);
                console.log("API Response ====>", response);

                if (response && response.status === "success") {
                    Toast.show({
                        type: 'success',
                        text1: 'Success',
                        text2: response.message || 'Horoscope Details updated successfully',
                    });
                    setIsEditMode(false);
                    fetchProfileData();
                } else {
                    // Handle API error response with more detail
                    const errorMessage = response?.message || 'Failed to update profile. Please try again.';
                    console.error('API Error:', errorMessage);
                    setValidationErrors({
                        submit: errorMessage
                    });
                }
            } catch (error) {
                console.error('Failed to update profile:', error);
                // More detailed error message
                const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile. Please try again.';
                setValidationErrors({
                    submit: errorMessage
                });
            }
        }
    };



    return (
        <View style={styles.menuChanges}>
            <View style={styles.editOptions}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 15 }}>Horoscope Details</Text>
                <TouchableWithoutFeedback onPress={() => setIsEditMode(!isEditMode)}>
                    <Text style={styles.redText}>{isEditMode ? 'View' : 'Edit'}</Text>
                </TouchableWithoutFeedback>
                {isEditMode ? (
                    <View style={styles.editOptions}>
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Birth Star</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_bthstar_id', value)}
                                items={birthStars}
                                value={formValues.personal_bthstar_id}
                                useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                Icon={() => (
                                    <Ionicons
                                        name="chevron-down" // Name of the icon
                                        size={24}
                                        color="gray"
                                        style={{ marginTop: 10 }}
                                    />
                                )}
                                placeholder={{ label: "Select Birth Star", value: null }}
                                style={pickerSelectStyles}
                            />
                            {validationErrors.personal_bthstar_id && (
                                <Text style={styles.error}>{validationErrors.personal_bthstar_id}</Text>
                            )}
                        </View>

                        {/* Rasi */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Rasi</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_bth_rasi_id', value)}
                                items={rasiList}
                                value={formValues.personal_bth_rasi_id}
                                useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                Icon={() => (
                                    <Ionicons
                                        name="chevron-down" // Name of the icon
                                        size={24}
                                        color="gray"
                                        style={{ marginTop: 10 }}
                                    />
                                )}
                                placeholder={{ label: "Select Rasi", value: null }}
                                style={pickerSelectStyles}
                            />
                            {validationErrors.personal_bth_rasi_id && (
                                <Text style={styles.error}>{validationErrors.personal_bth_rasi_id}</Text>
                            )}
                        </View>

                        {/* Lagnam / Didi */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Lagnam</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_lagnam_didi_id', value)}
                                items={lagnams}
                                value={formValues.personal_lagnam_didi_id}
                                useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                Icon={() => (
                                    <Ionicons
                                        name="chevron-down" // Name of the icon
                                        size={24}
                                        color="gray"
                                        style={{ marginTop: 10 }}
                                    />
                                )}
                                placeholder={{ label: "Select Lagnam/Didi", value: null }}
                                style={pickerSelectStyles}
                            />
                            {validationErrors.personal_lagnam_didi_id && (
                                <Text style={styles.error}>{validationErrors.personal_lagnam_didi_id}</Text>
                            )}
                        </View>

                        {/* Dasa */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Dasa Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Dasa Name"
                                value={formValues.personal_dasa}
                                onChangeText={(text) => handleChange('personal_dasa', text)}
                            />
                            {validationErrors.personal_dasa && (
                                <Text style={styles.error}>{validationErrors.personal_dasa}</Text>
                            )}
                        </View>

                        {/* Dasa Balance */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Dasa Balance</Text>
                            <View style={styles.dropdownFlex}>
                                {/* Year Dropdown */}
                                <View style={styles.dropdownFit}>
                                    <RNPickerSelect
                                        onValueChange={(value) => handleChange('personal_dasa_bal_year', value)}
                                        items={yearOptions}
                                        value={formValues.personal_dasa_bal_year}
                                        useNativeAndroidPickerStyle={false}
                                        Icon={() => (
                                            <Ionicons
                                                name="chevron-down"
                                                size={24}
                                                color="gray"
                                                style={{ marginTop: 10 }}
                                            />
                                        )}
                                        placeholder={{ label: "Year", value: null }}
                                        style={pickerSelectStyles}
                                    />
                                    {validationErrors.personal_dasa_bal_year && (
                                        <Text style={styles.error}>{validationErrors.personal_dasa_bal_year}</Text>
                                    )}
                                </View>

                                {/* Month Dropdown */}
                                <View style={styles.dropdownFit}>
                                    <RNPickerSelect
                                        onValueChange={(value) => handleChange('personal_dasa_bal_month', value)}
                                        items={monthOptions}
                                        value={formValues.personal_dasa_bal_month}
                                        useNativeAndroidPickerStyle={false}
                                        Icon={() => (
                                            <Ionicons
                                                name="chevron-down"
                                                size={24}
                                                color="gray"
                                                style={{ marginTop: 10 }}
                                            />
                                        )}
                                        placeholder={{ label: "Month", value: null }}
                                        style={pickerSelectStyles}
                                    />
                                    {validationErrors.personal_dasa_bal_month && (
                                        <Text style={styles.error}>{validationErrors.personal_dasa_bal_month}</Text>
                                    )}
                                </View>

                                {/* Day Dropdown */}
                                <View style={styles.dropdownFit}>
                                    <RNPickerSelect
                                        onValueChange={(value) => handleChange('personal_dasa_bal_day', value)}
                                        items={dayOptions}
                                        value={formValues.personal_dasa_bal_day}
                                        useNativeAndroidPickerStyle={false}
                                        Icon={() => (
                                            <Ionicons
                                                name="chevron-down"
                                                size={24}
                                                color="gray"
                                                style={{ marginTop: 10 }}
                                            />
                                        )}
                                        placeholder={{ label: "Day", value: null }}
                                        style={pickerSelectStyles}
                                    />
                                    {validationErrors.personal_dasa_bal_day && (
                                        <Text style={styles.error}>{validationErrors.personal_dasa_bal_day}</Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Nalikai */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Nallikai</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Nallikai"
                                value={formValues.personal_nalikai}
                                onChangeText={(text) => handleChange('personal_nalikai', text)}
                            />
                            {validationErrors.personal_nalikai && (
                                <Text style={styles.error}>{validationErrors.personal_nalikai}</Text>
                            )}
                        </View>

                        {/* Didi */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Didi</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Didi"
                                value={formValues.personal_didi}
                                onChangeText={(text) => handleChange('personal_didi', text)}
                            />
                            {validationErrors.personal_didi && <Text style={styles.error}>{validationErrors.personal_didi}</Text>}
                        </View>

                        {/* Surya Gowthram */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Surya Gothram</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Surya Gothram"
                                value={formValues.personal_surya_goth}
                                onChangeText={(text) => handleChange('personal_surya_goth', text)}
                            />
                            {validationErrors.personal_surya_goth && (
                                <Text style={styles.error}>{validationErrors.personal_surya_goth}</Text>
                            )}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Madhulam</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Madhulam"
                                value={formValues.personal_madulamn}
                                onChangeText={(text) => handleChange('personal_madulamn', text)}
                            />
                        </View>

                        {/* Chevvai Dosam */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Chevvai Dosham</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_chevvai_dos', value)}
                                items={chevvaiDoshamOptions}
                                value={formValues.personal_chevvai_dos}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => (
                                    <Ionicons
                                        name="chevron-down"
                                        size={24}
                                        color="gray"
                                        style={{ marginTop: 10 }}
                                    />
                                )}
                                placeholder={{ label: "Select Chevvai Dosam", value: null }}
                                style={pickerSelectStyles}
                            />
                            {validationErrors.personal_chevvai_dos && (
                                <Text style={styles.error}>{validationErrors.personal_chevvai_dos}</Text>
                            )}
                        </View>

                        {/* Rahu Dosam */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Rahu Dosham</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_ragu_dos', value)}
                                items={raguDoshamOptions}
                                value={formValues.personal_ragu_dos}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => (
                                    <Ionicons
                                        name="chevron-down"
                                        size={24}
                                        color="gray"
                                        style={{ marginTop: 10 }}
                                    />
                                )}
                                placeholder={{ label: "Select Rahu Dosam", value: null }}
                                style={pickerSelectStyles}
                            />
                            {validationErrors.personal_ragu_dos && (
                                <Text style={styles.error}>{validationErrors.personal_ragu_dos}</Text>
                            )}
                        </View>

                        {/* Horoscope Hints */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Horoscope Hints</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Horoscope Hints"
                                value={formValues.personal_horoscope_hints}
                                onChangeText={(text) => handleChange('personal_horoscope_hints', text)}
                            />
                            {validationErrors.personal_horoscope_hints && (
                                <Text style={styles.error}>{validationErrors.personal_horoscope_hints}</Text>
                            )}
                        </View>

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
                ) : (
                    <View style={styles.editOptions}>
                        {horoscopeDetails && (
                            <>
                                <Text style={styles.labelNew}>Birth Star : <Text style={styles.valueNew}>{horoscopeDetails.personal_bthstar_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Rasi : <Text style={styles.valueNew}>{horoscopeDetails.personal_bth_rasi_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Lagnam : <Text style={styles.valueNew}>{horoscopeDetails.personal_lagnam_didi_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Dasa Name : <Text style={styles.valueNew}>{horoscopeDetails.personal_dasa || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Dasa Balance : <Text style={styles.valueNew}>{horoscopeDetails.personal_dasa_bal || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Nallikai : <Text style={styles.valueNew}>{horoscopeDetails.personal_nalikai || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Didi : <Text style={styles.valueNew}>{horoscopeDetails.personal_didi || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Suya Gothram : <Text style={styles.valueNew}>{horoscopeDetails.personal_surya_goth || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Madhulam : <Text style={styles.valueNew}>{horoscopeDetails.personal_madulamn || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Ragu Dosham : <Text style={styles.valueNew}>{horoscopeDetails.personal_ragu_dos || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Chevvai Dosham : <Text style={styles.valueNew}>{horoscopeDetails.personal_chevvai_dos || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Horoscope Hints : <Text style={styles.valueNew}>{horoscopeDetails.personal_horoscope_hints || "N/A"}</Text></Text>
                                {rasiGrid.length >= 4 && (
                                    <View style={styles.horoscopeSection}>
                                        <View style={styles.chartBorder}>
                                            {/* Top Row */}
                                            <View style={styles.chartRow}>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][0]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][1]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][2]}</Text></View>
                                                <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{rasiGrid[0][3]}</Text></View>
                                            </View>
                                            {/* Middle Section */}
                                            <View style={[styles.chartRow, { flex: 2, borderBottomWidth: 1 }]}>
                                                <View style={styles.sideColumn}>
                                                    <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}>
                                                        <Text style={styles.chartText}>{rasiGrid[1][0]}</Text>
                                                    </View>
                                                    <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}>
                                                        <Text style={styles.chartText}>{rasiGrid[2][0]}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.centerBox}>
                                                    <Text style={styles.centerLabel}>Rasi</Text>
                                                    <Text style={styles.centerDomain}>vysyamala.com</Text>
                                                </View>
                                                <View style={[styles.sideColumn, { borderRightWidth: 0 }]}>
                                                    <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}>
                                                        <Text style={styles.chartText}>{rasiGrid[1][rasiGrid[1].length - 1]}</Text>
                                                    </View>
                                                    <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}>
                                                        <Text style={styles.chartText}>{rasiGrid[2][rasiGrid[2].length - 1]}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            {/* Bottom Row */}
                                            <View style={[styles.chartRow, { borderBottomWidth: 0 }]}>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][0]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][1]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][2]}</Text></View>
                                                <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{rasiGrid[3][3]}</Text></View>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* --- AMSA CHART RENDER --- */}
                                {amsaGrid.length >= 4 && (
                                    <View style={styles.horoscopeSection}>
                                        <View style={styles.chartBorder}>
                                            {/* Top Row */}
                                            <View style={styles.chartRow}>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][0]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][1]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][2]}</Text></View>
                                                <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{amsaGrid[0][3]}</Text></View>
                                            </View>
                                            {/* Middle Section */}
                                            <View style={[styles.chartRow, { flex: 2, borderBottomWidth: 1 }]}>
                                                <View style={styles.sideColumn}>
                                                    <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}>
                                                        <Text style={styles.chartText}>{amsaGrid[1][0]}</Text>
                                                    </View>
                                                    <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}>
                                                        <Text style={styles.chartText}>{amsaGrid[2][0]}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.centerBox}>
                                                    <Text style={styles.centerLabel}>Amsam</Text>
                                                    <Text style={styles.centerDomain}>vysyamala.com</Text>
                                                </View>
                                                <View style={[styles.sideColumn, { borderRightWidth: 0 }]}>
                                                    <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 1 }]}>
                                                        <Text style={styles.chartText}>{amsaGrid[1][amsaGrid[1].length - 1]}</Text>
                                                    </View>
                                                    <View style={[styles.chartCell, { flex: 1, borderBottomWidth: 0 }]}>
                                                        <Text style={styles.chartText}>{amsaGrid[2][amsaGrid[2].length - 1]}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            {/* Bottom Row */}
                                            <View style={[styles.chartRow, { borderBottomWidth: 0 }]}>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[3][0]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[3][1]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[3][2]}</Text></View>
                                                <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{amsaGrid[3][3]}</Text></View>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}
            </View>
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
        paddingHorizontal: 10,
    },

    editOptions: {
        width: '100%',
        backgroundColor: '#F9F9F9',
        // padding: 16,
        borderRadius: 8,
        marginBottom: 16,
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
    menuChanges: {
        width: '100%',
        backgroundColor: '#4F515D',
        justifyContent: 'center',
        alignItems: 'center'
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
    error: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
        alignSelf: 'flex-start',
        fontWeight: 'bold',
    },
    valueNew: {
        color: '#282C3F',
        fontSize: 15,
        fontWeight: '500',
    },
    dropdownFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "start",
        width: "100%",
    },
    dropdownFit: {
        width: "32.33%",
        fontFamily: "inter",
    },

    horoscopeSection: {
        padding: 10,
        backgroundColor: '#fff',
        alignItems: 'center',
        width: '100%',
    },
    chartBorder: {
        borderWidth: 1.5,
        borderColor: '#000',
        backgroundColor: '#FFFACD',
        width: '100%',
        maxWidth: 350,
        aspectRatio: 1,
        marginVertical: 10,
    },
    chartRow: {
        flexDirection: 'row',
        flex: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
    },
    chartCell: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderColor: '#000',
        padding: 2,
    },
    sideColumn: {
        flex: 1,
        borderRightWidth: 1,
        borderColor: '#000',
    },
    centerBox: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderColor: '#000',
        backgroundColor: '#FFFACD',
    },
    chartText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#008000',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    },
    centerLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#008000',
        marginBottom: 5,
        fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    },
    centerDomain: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#008000',
        fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
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
        paddingRight: 30, // to ensure the text is never behind the icon
    },
    inputAndroid: {
        fontSize: 16,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        color: 'black',
        paddingRight: 30, // to ensure the text is never behind the icon
    },
});