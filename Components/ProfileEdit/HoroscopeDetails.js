import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    Platform,
} from "react-native";
import {
    Ionicons,
    FontAwesome5,
} from "@expo/vector-icons";
import { getMyHoroscopeDetails, updateProfileHoroscope, fetchRasiImage, fetchAmsamImage } from '../../CommonApiCall/CommonApiCall';
import RNPickerSelect from 'react-native-picker-select';
import config from "../../API/Apiurl";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from "../../Reusable/Theme";

export const HoroscopeDetails = ({ setLoading }) => {
    const [horoscopeDetails, setHoroscopeDetails] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [birthStars, setBirthStars] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [rasiList, setRasiList] = useState([]);
    const [lagnams, setLagnams] = useState([]);
    const [isFetched, setIsFetched] = useState(false);
    const [dayOptions, setDayOptions] = useState([]);
    const [monthOptions, setMonthOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);
    const [rasiGrid, setRasiGrid] = useState([]);
    const [amsaGrid, setAmsaGrid] = useState([]);

    const [formValues, setFormValues] = useState({
        personal_bthstar_name: '',
        personal_padham: null,
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

    const padhamOptions = [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
    ];

    const extractGridData = (htmlString) => {
        if (!htmlString) return [];

        const rows = [];
        const rowMatches = htmlString.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];

        rowMatches.forEach(rowHtml => {
            const cells = [];
            const cellMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];

            cellMatches.forEach(cellHtml => {
                let text = cellHtml.replace(/<br\s*\/?>/gi, '\n');
                text = text.replace(/<\/p>/gi, '\n');
                text = text.replace(/<[^>]+>/g, '').trim();
                text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
                text = text.replace(/\n\s*\n/g, '\n').trim();

                cells.push(text);
            });

            if (cells.length > 0) rows.push(cells);
        });
        return rows;
    };

    useEffect(() => {
        const loadCharts = async () => {
            try {
                const profileId = await AsyncStorage.getItem("loginuser_profileId");

                if (profileId) {
                    const rasiData = await fetchRasiImage(profileId);
                    if (rasiData && rasiData.status === 1) {
                        setRasiGrid(extractGridData(rasiData.html));
                    } else {
                        setRasiGrid([]);
                    }

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

    const fetchProfileData = async () => {
        try {
            const data = await getMyHoroscopeDetails();
            setHoroscopeDetails(data.data);
        } catch (error) {
            console.error('Failed to load profile data', error);
        }
    };

    useEffect(() => {
        fetchProfileData();
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
                    label: item.rasi_name,
                    value: item.rasi_id,
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
                    label: item.didi_description,
                    value: item.didi_id,
                }));
                setLagnams(lagnamsData);
            } catch (error) {
                console.error("Error fetching Lagnam data:", error);
            }
        };

        fetchLagnams();
    }, []);

    useEffect(() => {
        const days = Array.from({ length: 31 }, (_, i) => ({
            label: i.toString(),
            value: i.toString(),
        }));
        setDayOptions(days);

        const months = Array.from({ length: 13 }, (_, i) => ({
            label: i.toString(),
            value: i.toString(),
        }));
        setMonthOptions(months);

        const years = Array.from({ length: 30 }, (_, i) => ({ label: `${i}`, value: `${i}` }));
        setYearOptions(years);
    }, []);

    useEffect(() => {
        if (horoscopeDetails && !isFetched) {
            let day = '', month = '', year = '';
            const dasaBalance = horoscopeDetails.personal_dasa_bal;

            if (dasaBalance && typeof dasaBalance === 'string') {
                const yearMatch = dasaBalance.match(/(\d+)\s*Years/);
                const monthMatch = dasaBalance.match(/(\d+)\s*Months/);
                const dayMatch = dasaBalance.match(/(\d+)\s*Days/);

                if (yearMatch || monthMatch || dayMatch) {
                    year = yearMatch ? yearMatch[1] : '';
                    month = monthMatch ? monthMatch[1] : '';
                    day = dayMatch ? dayMatch[1] : '';
                } else if (dasaBalance.includes(':')) {
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
                personal_padham: horoscopeDetails.personal_padham
                    ? Number(horoscopeDetails.personal_padham)
                    : null,
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

    const handleChange = (field, value) => {
        setFormValues((prevValues) => {
            const updatedValue = value === '' ? '' : value;

            return {
                ...prevValues,
                [field]: updatedValue,
            };
        });

        setValidationErrors((prevErrors) => ({
            ...prevErrors,
            [field]: '',
        }));
    };

    const validateForm = () => {
        const errors = {};

        if (!formValues.personal_bthstar_id) errors.personal_bthstar_id = 'Birth Star is required';
        if (!formValues.personal_bth_rasi_id) errors.personal_bth_rasi_id = 'Rasi is required';
        if (!formValues.personal_surya_goth) errors.personal_surya_goth = 'Surya Gowthram is required';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (validateForm()) {
            try {
                if (setLoading) setLoading(true);

                const yearVal = formValues.personal_dasa_bal_year;
                const monthVal = formValues.personal_dasa_bal_month;
                const dayVal = formValues.personal_dasa_bal_day;

                const isAnyFieldSet = (yearVal !== null && yearVal !== undefined && yearVal !== '') ||
                    (monthVal !== null && monthVal !== undefined && monthVal !== '') ||
                    (dayVal !== null && dayVal !== undefined && dayVal !== '');

                let formattedDasaBalance = '';

                if (isAnyFieldSet) {
                    const finalYear = yearVal || '0';
                    const finalMonth = monthVal || '0';
                    const finalDay = dayVal || '0';

                    formattedDasaBalance = `${finalYear} Years, ${finalMonth} Months, ${finalDay} Days`;
                }

                const profileData = {
                    birthstar_name: formValues.personal_bthstar_id ? String(formValues.personal_bthstar_id) : '',
                    padham: formValues.personal_padham
                        ? Number(formValues.personal_padham)
                        : null,
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
                const requiredFields = ['birthstar_name', 'birth_rasi_name', 'lagnam_didi'];
                const emptyFields = requiredFields.filter(field => !profileData[field]);

                if (emptyFields.length > 0) {
                    console.error('Required fields are empty:', emptyFields);
                    setValidationErrors({
                        submit: `Please fill in required fields: ${emptyFields.join(', ')}`
                    });
                    return;
                }

                const response = await updateProfileHoroscope(profileData);

                if (response && response.status === "success") {
                    Toast.show({
                        type: 'success',
                        text1: 'Success',
                        text2: response.message || 'Horoscope Details updated successfully',
                    });
                    setIsEditMode(false);
                    fetchProfileData();
                } else {
                    const errorMessage = response?.message || 'Failed to update profile. Please try again.';
                    setValidationErrors({
                        submit: errorMessage
                    });
                }
            } catch (error) {
                console.error('Failed to update profile:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile. Please try again.';
                setValidationErrors({
                    submit: errorMessage
                });
            } finally {
                if (setLoading) setLoading(false);
            }
        }
    };

    // Helper to render a row in view mode
    const renderRow = (label, value) => {
        if (value === undefined || value === null || value === '') return null;
        return (
            <View style={styles.rowItem} key={label}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowValue}>{value}</Text>
            </View>
        );
    };

    return (
        <View style={styles.menuChanges}>
            <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                    <View style={styles.sectionIconCircle}>
                        <FontAwesome5 name="star" size={14} color={Colors.primary} />
                    </View>
                    <Text style={styles.cardSectionTitle}>Horoscope Details</Text>
                    <TouchableWithoutFeedback onPress={() => setIsEditMode(!isEditMode)}>
                        <View style={styles.editPill}>
                            <Ionicons name={isEditMode ? "eye-outline" : "create-outline"} size={14} color={Colors.primary} />
                            <Text style={styles.editPillText}>{isEditMode ? 'View' : 'Edit'}</Text>
                        </View>
                    </TouchableWithoutFeedback>
                </View>

                {isEditMode ? (
                    <View style={styles.editOptionsInner}>
                        <Text style={styles.labelNew}>Birth Star</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_bthstar_id', value)}
                            items={birthStars}
                            value={formValues.personal_bthstar_id}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons
                                    name="chevron-down"
                                    size={22}
                                    color={Colors.textMuted}
                                    style={{ marginTop: 10 }}
                                />
                            )}
                            placeholder={{ label: "Select Birth Star", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.personal_bthstar_id && (
                            <Text style={styles.error}>{validationErrors.personal_bthstar_id}</Text>
                        )}

                        <Text style={styles.labelNew}>Padham</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_padham', value)}
                            items={padhamOptions}
                            value={formValues.personal_padham}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons
                                    name="chevron-down"
                                    size={22}
                                    color={Colors.textMuted}
                                    style={{ marginTop: 10 }}
                                />
                            )}
                            placeholder={{ label: "Select Padham", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.personal_padham && (
                            <Text style={styles.error}>{validationErrors.personal_padham}</Text>
                        )}

                        <Text style={styles.labelNew}>Rasi</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_bth_rasi_id', value)}
                            items={rasiList}
                            value={formValues.personal_bth_rasi_id}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons
                                    name="chevron-down"
                                    size={22}
                                    color={Colors.textMuted}
                                    style={{ marginTop: 10 }}
                                />
                            )}
                            placeholder={{ label: "Select Rasi", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.personal_bth_rasi_id && (
                            <Text style={styles.error}>{validationErrors.personal_bth_rasi_id}</Text>
                        )}

                        <Text style={styles.labelNew}>Lagnam</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_lagnam_didi_id', value)}
                            items={lagnams}
                            value={formValues.personal_lagnam_didi_id}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons
                                    name="chevron-down"
                                    size={22}
                                    color={Colors.textMuted}
                                    style={{ marginTop: 10 }}
                                />
                            )}
                            placeholder={{ label: "Select Lagnam/Didi", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.personal_lagnam_didi_id && (
                            <Text style={styles.error}>{validationErrors.personal_lagnam_didi_id}</Text>
                        )}

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

                        <Text style={styles.labelNew}>Dasa Balance</Text>
                        <View style={styles.dropdownFlex}>
                            <View style={styles.dropdownFit}>
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_dasa_bal_year', value)}
                                    items={yearOptions}
                                    value={formValues.personal_dasa_bal_year}
                                    useNativeAndroidPickerStyle={false}
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down"
                                            size={22}
                                            color={Colors.textMuted}
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

                            <View style={styles.dropdownFit}>
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_dasa_bal_month', value)}
                                    items={monthOptions}
                                    value={formValues.personal_dasa_bal_month}
                                    useNativeAndroidPickerStyle={false}
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down"
                                            size={22}
                                            color={Colors.textMuted}
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

                            <View style={styles.dropdownFit}>
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_dasa_bal_day', value)}
                                    items={dayOptions}
                                    value={formValues.personal_dasa_bal_day}
                                    useNativeAndroidPickerStyle={false}
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down"
                                            size={22}
                                            color={Colors.textMuted}
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

                        <Text style={styles.labelNew}>Didi</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Didi"
                            value={formValues.personal_didi}
                            onChangeText={(text) => handleChange('personal_didi', text)}
                        />
                        {validationErrors.personal_didi && <Text style={styles.error}>{validationErrors.personal_didi}</Text>}

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

                        <Text style={styles.labelNew}>Madhulam</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Madhulam"
                            value={formValues.personal_madulamn}
                            onChangeText={(text) => handleChange('personal_madulamn', text)}
                        />

                        <Text style={styles.labelNew}>Chevvai Dosham</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_chevvai_dos', value)}
                            items={chevvaiDoshamOptions}
                            value={formValues.personal_chevvai_dos}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons
                                    name="chevron-down"
                                    size={22}
                                    color={Colors.textMuted}
                                    style={{ marginTop: 10 }}
                                />
                            )}
                            placeholder={{ label: "Select Chevvai Dosam", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.personal_chevvai_dos && (
                            <Text style={styles.error}>{validationErrors.personal_chevvai_dos}</Text>
                        )}

                        <Text style={styles.labelNew}>Rahu Dosham</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_ragu_dos', value)}
                            items={raguDoshamOptions}
                            value={formValues.personal_ragu_dos}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons
                                    name="chevron-down"
                                    size={22}
                                    color={Colors.textMuted}
                                    style={{ marginTop: 10 }}
                                />
                            )}
                            placeholder={{ label: "Select Rahu Dosam", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.personal_ragu_dos && (
                            <Text style={styles.error}>{validationErrors.personal_ragu_dos}</Text>
                        )}

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

                        <View style={styles.formContainer1}>
                            <TouchableOpacity
                                style={styles.btn}
                                onPress={handleSave}
                            >
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
                        {horoscopeDetails ? (
                            <>
                                {renderRow("Birth Star", horoscopeDetails.personal_bthstar_name)}
                                {renderRow("Padham", horoscopeDetails.personal_padham)}
                                {renderRow("Rasi", horoscopeDetails.personal_bth_rasi_name)}
                                {renderRow("Lagnam", horoscopeDetails.personal_lagnam_didi_name)}
                                {renderRow("Dasa Name", horoscopeDetails.personal_dasa)}
                                {renderRow("Dasa Balance", horoscopeDetails.personal_dasa_bal)}
                                {renderRow("Nallikai", horoscopeDetails.personal_nalikai)}
                                {renderRow("Didi", horoscopeDetails.personal_didi)}
                                {renderRow("Suya Gothram", horoscopeDetails.personal_surya_goth)}
                                {renderRow("Madhulam", horoscopeDetails.personal_madulamn)}
                                {renderRow("Ragu Dosham", horoscopeDetails.personal_ragu_dos)}
                                {renderRow("Chevvai Dosham", horoscopeDetails.personal_chevvai_dos)}
                                {renderRow("Horoscope Hints", horoscopeDetails.personal_horoscope_hints)}

                                {rasiGrid.length >= 4 && (
                                    <View style={styles.horoscopeSection}>
                                        <Text style={styles.chartTitle}>Rasi Grid</Text>
                                        <View style={styles.chartBorder}>
                                            <View style={styles.chartRow}>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][0]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][1]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[0][2]}</Text></View>
                                                <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{rasiGrid[0][3]}</Text></View>
                                            </View>
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
                                            <View style={[styles.chartRow, { borderBottomWidth: 0 }]}>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][0]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][1]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{rasiGrid[3][2]}</Text></View>
                                                <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{rasiGrid[3][3]}</Text></View>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {amsaGrid.length >= 4 && (
                                    <View style={styles.horoscopeSection}>
                                        <Text style={styles.chartTitle}>Amsam Grid</Text>
                                        <View style={styles.chartBorder}>
                                            <View style={styles.chartRow}>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][0]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][1]}</Text></View>
                                                <View style={styles.chartCell}><Text style={styles.chartText}>{amsaGrid[0][2]}</Text></View>
                                                <View style={[styles.chartCell, { borderRightWidth: 0 }]}><Text style={styles.chartText}>{amsaGrid[0][3]}</Text></View>
                                            </View>
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
                        ) : null}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
    labelNew: {
        color: Colors.textDark,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
        marginTop: 10,
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
    error: {
        color: Colors.destructive,
        fontSize: 12,
        marginTop: 2,
        marginBottom: 6,
        alignSelf: 'flex-start',
        fontWeight: '600',
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
    dropdownFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        width: "100%",
        marginBottom: 10,
    },
    dropdownFit: {
        width: "31%",
    },
    horoscopeSection: {
        paddingVertical: 10,
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
        padding: 1,
        overflow: 'hidden',
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
        fontSize: 10,
        fontWeight: 'bold',
        color: '#008000',
        textAlign: 'center',
        lineHeight: 10,
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
    chartTitle: {
        fontSize: 17,
        fontWeight: "bold",
        color: Colors.textDark,
        marginBottom: 6,
        alignSelf: "flex-start",
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