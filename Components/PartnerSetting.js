import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";
import { updatePartnerPreferences, fetchPartnerProfilenew } from '../CommonApiCall/CommonApiCall';
import Toast from 'react-native-toast-message';
import MatchingStars from '../Components/MatchingStars/MatchingStars';

const schema = z.object({
    ageDifference: z.string().min(1, "Age Difference is required"),
    heightFrom: z.string().min(1, "Height From is required"),
    heightTo: z.string().min(1, "Height To is required"),
    chevvai: z.string().optional(),
    rehu: z.string().optional(),
    maritalStatus: z.array(z.string()).optional(),
    education: z.array(z.string()).optional(),
    fieldOfStudy: z.array(z.string()).optional(),
    profession: z.array(z.string()).optional(),
    annualIncomeMin: z.string().optional(),
    annualIncomeMax: z.string().optional(),
    foreignInterest: z.string().optional(),
    matchingStars: z.array(z.object({
        id: z.any(),
        rasi: z.any(),
        star: z.any(),
        label: z.string(),
    })).optional(),
});


const age = [
    { label: 'Select Age Difference', value: '' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '10', value: '10' }
];

export const PartnerSettings = () => {
    const navigation = useNavigation();
    const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            ageDifference: '',
            heightFrom: '',
            heightTo: '',
            maritalStatus: [],
            education: [],
            fieldOfStudy: [],
            profession: [],
            annualIncomeMin: '',
            annualIncomeMax: '',
            nativeState: [],
            foreignInterest: '',
            chevvai: '',
            rehu: '',
            workLocation: '',
            matchingStars: [],
        },
    });
    const maritalStatusSelected = watch("maritalStatus") || [];
    const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
    const [highestEduOptions, setHighestEduOptions] = useState([]);
    const [annualIncomeOptions, setAnnualIncomeOptions] = useState([]);
    const [professionOptions, setProfessionOptions] = useState([]);
    const [fieldOfStudyOptions, setFieldOfStudyOptions] = useState([]);
    const [selectedIncomeMinIds, setSelectedIncomeMinIds] = useState('');
    const [selectedIncomeMaxIds, setSelectedIncomeMaxIds] = useState('');
    const [matchingStarsData, setMatchingStarsData] = useState([]);
    const [allStarOptions, setAllStarOptions] = useState([]);
    const [selectedStarIds, setSelectedStarIds] = useState([]);
    const [heightOptions, setHeightOptions] = useState([]);

    const handleCheckboxChange = useCallback((updatedIds) => {
        setSelectedStarIds(updatedIds);
        setValue('matchingStars', updatedIds, { shouldValidate: true });
        console.log('Updated Selected Stars:', updatedIds);
    }, [setValue]);

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


    const fetchHighestEdu = async () => {
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


    const fetchAnnualIncome = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Annual_Income/`);
            const annualIncomeArray = Object.keys(response.data).map(key => ({
                label: response.data[key].income_description,
                value: response.data[key].income_id.toString(),
            }));
            setAnnualIncomeOptions(annualIncomeArray);
        } catch (error) {
            console.error("Error fetching annual income:", error);
        }
    };

    const fetchProfessionOptions = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Profes_Pref/`);
            const professionsArray = Object.keys(response.data).map(key => ({
                label: response.data[key].Profes_name,
                value: response.data[key].Profes_Pref_id.toString(),
            }));
            setProfessionOptions(professionsArray);
        } catch (error) {
            console.error("Error fetching profession options:", error);
        }
    };

    const fetchFieldOfStudy = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Field_ofstudy/`);
            const fieldOfStudyArray = Object.keys(response.data).map(key => ({
                label: response.data[key].study_description,
                value: response.data[key].study_id.toString(),
            }));
            setFieldOfStudyOptions(fieldOfStudyArray);
        } catch (error) {
            console.error("Error fetching field of study:", error);
        }
    };

    const fetchMatchingStars = async () => {
        const birthstar = await AsyncStorage.getItem("birthStarValue");
        const gender = await AsyncStorage.getItem("gender");
        const birthrasiId = await AsyncStorage.getItem("birthStaridValue");

        if (birthstar && gender && birthrasiId) {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Matchstr_Pref/`, {
                    birth_star_id: birthstar,
                    gender: gender,
                    birth_rasi_id: birthrasiId
                });

                const matchCountArrays = Object.values(response.data)
                    .map(matchCount => matchCount)
                    .sort((a, b) => b[0].match_count - a[0].match_count);

                setMatchingStarsData(matchCountArrays);

                const allAvailableStars = matchCountArrays.flatMap(matchCountArray =>
                    matchCountArray.map(star => ({
                        id: star.id.toString(),
                        rasi: star.dest_rasi_id.toString(),
                        star: star.dest_star_id.toString(),
                        label: `${star.matching_starname} - ${star.matching_rasiname}`,
                        match_count: star.match_count
                    }))
                );

                setAllStarOptions(allAvailableStars);
                return allAvailableStars;
            } catch (error) {
                console.error('Error fetching matching star options:', error);
                return [];
            }
        }
        return [];
    };

    const fetchHeightOptions = async () => {
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

    useEffect(() => {
        fetchMaritalStatus();
        fetchProfessionOptions();
        fetchHighestEdu();
        fetchAnnualIncome();
        fetchFieldOfStudy();
        fetchMatchingStars();
        fetchHeightOptions();
    }, []);

    // --- 2. Consolidated Form Data Initialization ---
    // This hook runs when all necessary options/star data are available
    useEffect(() => {
        const initializeFormData = async () => {
            // Wait for essential dropdown options to load
            if (maritalStatusOptions.length === 0 || highestEduOptions.length === 0 || annualIncomeOptions.length === 0 || professionOptions.length === 0 || fieldOfStudyOptions.length === 0 || allStarOptions.length === 0) {
                return;
            }

            // 1. Fetch saved partner preferences from the main endpoint
            try {
                const partnerProfileData = await fetchPartnerProfilenew();
                console.log("partnerProfileData", partnerProfileData);

                // 2. Set standard dropdown/checkbox values
                setValue('ageDifference', partnerProfileData.fromAge || '');
                setValue('heightFrom', partnerProfileData.fromHeight?.height_value || '');
                setValue('heightTo', partnerProfileData.toHeight?.height_value || '');
                // Ensure array types for multi-selects
                // setValue('education', Array.isArray(partnerProfileData.education) ? partnerProfileData.education : (partnerProfileData.education ? partnerProfileData.education.split(',') : []));
                // setValue('fieldOfStudy', Array.isArray(partnerProfileData.fieldofstudy) ? partnerProfileData.fieldofstudy : (partnerProfileData.fieldofstudy ? partnerProfileData.fieldofstudy.split(',') : []));
                // setValue('maritalStatus', Array.isArray(partnerProfileData.maritalStatus) ? partnerProfileData.maritalStatus : (partnerProfileData.maritalStatus ? partnerProfileData.maritalStatus.split(',') : []));
                // setValue('profession', Array.isArray(partnerProfileData.profession) ? partnerProfileData.profession : (partnerProfileData.profession ? partnerProfileData.profession.split(',') : []));
                setValue('education', partnerProfileData.education);
                setValue('fieldOfStudy', partnerProfileData.fieldofstudy);
                setValue('maritalStatus', partnerProfileData.maritalStatus);
                setValue('profession', partnerProfileData.profession);

                setValue('rehu', partnerProfileData.rahuKetuDhosam || '');
                setValue('chevvai', partnerProfileData.chevvaiDhosam || '');
                setValue('foreignInterest', partnerProfileData.foreignInterest || '');

                // Income
                // if (partnerProfileData.income !== undefined && partnerProfileData.income !== null) {
                //     const minIncome = String(partnerProfileData.income);
                //     setValue('annualIncomeMin', minIncome);
                //     setSelectedIncomeMinIds(minIncome);
                // }
                // if (partnerProfileData.incomeStatusMax !== undefined && partnerProfileData.incomeStatusMax !== null) {
                //     const maxIncome = String(partnerProfileData.incomeStatusMax);
                //     setValue('annualIncomeMax', maxIncome);
                //     setSelectedIncomeMaxIds(maxIncome);
                // }
                const minIncome = partnerProfileData.income || ''; // Now guaranteed to be string or ''
                setValue('annualIncomeMin', minIncome);
                setSelectedIncomeMinIds(minIncome);

                const maxIncome = partnerProfileData.incomeStatusMax || ''; // Now guaranteed to be string or ''
                setValue('annualIncomeMax', maxIncome);
                setSelectedIncomeMaxIds(maxIncome);

                // 3. Handle Matching Stars Initialization
                const savedStarIdsString = partnerProfileData.partner_porutham_ids;

                if (savedStarIdsString && savedStarIdsString.trim() !== '') {
                    // Saved data exists: use it
                    const selectedIds = savedStarIdsString.split(',');

                    // Map saved IDs to the full star objects (from allStarOptions)
                    const selectedStarObjects = allStarOptions
                        .filter(option => selectedIds.includes(option.id.toString()))
                        .map(item => ({
                            id: item.id,
                            rasi: item.rasi,
                            star: item.star,
                            label: item.label,
                        }));

                    setValue('matchingStars', selectedStarObjects);
                    setSelectedStarIds(selectedStarObjects);
                    console.log("Stars: Loaded saved preferences.", selectedStarObjects.length);

                } else {
                    // No saved data: set default (exclude porutham 0)
                    const defaultSelectedIds = allStarOptions
                        .filter(item => item.match_count !== 0)
                        .map(item => ({
                            id: item.id.toString(),
                            rasi: item.rasi,
                            star: item.star,
                            label: item.label,
                        }));

                    setSelectedStarIds(defaultSelectedIds);
                    setValue('matchingStars', defaultSelectedIds);
                    console.log("Stars: Set default (non-zero match count) preferences.", defaultSelectedIds.length);
                }

            } catch (error) {
                console.error('Error setting form values or fetching profile data:', error);
            }
        };

        initializeFormData();
    }, [
        setValue,
        maritalStatusOptions.length,
        highestEduOptions.length,
        annualIncomeOptions.length,
        professionOptions.length,
        fieldOfStudyOptions.length,
        allStarOptions.length // Re-run when options or stars are loaded
    ]);

    const onSubmit = async (data) => {
        try {
            const starArray = selectedStarIds.map(item => item.id);
            const rasiArray = selectedStarIds.map(item => item.rasi);
            const starRasiArray = selectedStarIds.map(item => `${item.star}-${item.rasi}`);

            const StarString = starArray.join(',');
            const combinedString = starRasiArray.join(',');

            const formattedData = {
                pref_age_differences: data.ageDifference || '',
                pref_height_from: data.heightFrom || '',
                pref_height_to: data.heightTo || '',
                pref_marital_status: data.maritalStatus ? data.maritalStatus.join(',') : '',
                pref_profession: data.profession ? data.profession.join(',') : '',
                pref_education: data.education ? data.education.join(',') : '',
                pref_fieldof_study: data.fieldOfStudy ? data.fieldOfStudy.join(',') : '',
                pref_anual_income: data.annualIncomeMin || '',
                pref_anual_income_max: data.annualIncomeMax || '',
                pref_chevvai: data.chevvai || '',
                pref_ragukethu: data.rehu || '',
                pref_foreign_intrest: data.foreignInterest || '',
                pref_porutham_star: StarString,
                pref_porutham_star_rasi: combinedString,
            };

            const result = await updatePartnerPreferences(formattedData);

            if (result.data.status === "success") {
                Toast.show({
                    type: 'success',
                    position: 'bottom',
                    text1: 'Successfully updated',
                    text2: 'Your partner preferences have been updated successfully.',
                });
            } else {
                Toast.show({
                    type: 'error',
                    position: 'bottom',
                    text1: 'Unsuccessful',
                    text2: 'There was a problem updating your preferences. Please try again.',
                });
            }
        } catch (error) {
            console.error("Error submitting contact details:", error);
            Toast.show({
                type: 'error',
                position: 'top',
                text1: 'Error',
                text2: 'An error occurred while submitting your details.',
            });
        }
    };

    const onError = (errors, e) => {
        console.log("--- VALIDATION FAILED ---", errors);
        const firstErrorKey = Object.keys(errors)[0];
        const firstErrorMessage = errors[firstErrorKey]?.message;

        Toast.show({
            type: 'error',
            position: 'bottom',
            text1: 'Submission Failed',
            text2: firstErrorMessage || 'Please fill all required fields.',
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
                {/* Age */}
                <View style={styles.searchContainer}>
                    <Text style={styles.redText}>Age Difference</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Controller
                                control={control}
                                name="ageDifference"
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        style={styles.dropdown}
                                        data={age}
                                        maxHeight={180}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Age Difference"
                                        value={value}
                                        onChange={(item) => {
                                            onChange(item.value);
                                        }}
                                    />
                                )}
                            />
                        </View>
                        {errors.ageDifference && <Text style={styles.errorText}>{errors.ageDifference.message}</Text>}
                    </View>
                </View>

                {/* Height */}
                {/* Height Section */}
                <View style={styles.searchContainer}>
                    <Text style={styles.redText}>Height</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.inputFlexContainer}>
                            {/* Height From Dropdown */}
                            <View style={[styles.inputFlexFirst, { padding: 0 }]}>
                                <Controller
                                    control={control}
                                    name="heightFrom"
                                    render={({ field: { onChange, value } }) => (
                                        <Dropdown
                                            style={styles.dropdown}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            data={heightOptions}
                                            maxHeight={250}
                                            labelField="label"
                                            valueField="value"
                                            placeholder="From"
                                            value={value}
                                            onChange={(item) => onChange(item.value)}
                                        />
                                    )}
                                />
                            </View>

                            {/* Height To Dropdown */}
                            <View style={[styles.inputFlex, { padding: 0 }]}>
                                <Controller
                                    control={control}
                                    name="heightTo"
                                    render={({ field: { onChange, value } }) => (
                                        <Dropdown
                                            style={styles.dropdown}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            data={heightOptions}
                                            maxHeight={250}
                                            labelField="label"
                                            valueField="value"
                                            placeholder="To"
                                            value={value}
                                            onChange={(item) => onChange(item.value)}
                                        />
                                    )}
                                />
                            </View>
                        </View>
                        {errors.heightFrom && (<Text style={styles.errorText}>{errors.heightFrom.message}</Text>)}
                        {errors.heightTo && (<Text style={styles.errorText}>{errors.heightTo.message}</Text>)}
                    </View>
                </View>
                {/* Marital Status */}
                <View style={styles.checkContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Pressable
                            style={[
                                styles.checkboxBase,
                                maritalStatusSelected?.length === maritalStatusOptions.length && maritalStatusOptions.length > 0 && styles.checkboxChecked,
                            ]}
                            onPress={() => {
                                const allValues = maritalStatusOptions.map(opt => opt.value);
                                if (maritalStatusSelected?.length === maritalStatusOptions.length) {
                                    setValue("maritalStatus", []);
                                } else {
                                    setValue("maritalStatus", allValues);
                                }
                            }}
                        >
                            {maritalStatusSelected?.length === maritalStatusOptions.length && maritalStatusOptions.length > 0 && (
                                <Ionicons name="checkmark" size={14} color="white" />
                            )}
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                const allValues = maritalStatusOptions.map(opt => opt.value);
                                if (maritalStatusSelected?.length === maritalStatusOptions.length) {
                                    setValue("maritalStatus", []);
                                } else {
                                    setValue("maritalStatus", allValues);
                                }
                            }}
                        >
                            <Text style={styles.checkRedText}>Marital Status</Text>
                        </Pressable>
                    </View>
                    <Controller
                        control={control}
                        name="maritalStatus"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxDivColFlex}>
                                {maritalStatusOptions.map((status) => (
                                    <View key={status.value} style={styles.checkboxContainer}>
                                        <Pressable
                                            style={[
                                                styles.checkboxBase,
                                                (value || []).includes(status.value) && styles.checkboxChecked,
                                            ]}
                                            onPress={() => {
                                                const currentValues = value || [];
                                                const newValue = currentValues.includes(status.value)
                                                    ? currentValues.filter((item) => item !== status.value)
                                                    : [...currentValues, status.value];
                                                onChange(newValue);
                                            }}
                                        >
                                            {(value || []).includes(status.value) && (
                                                <Ionicons name="checkmark" size={14} color="white" />
                                            )}
                                        </Pressable>
                                        <Pressable onPress={() => {
                                            const currentValues = value || [];
                                            const newValue = currentValues.includes(status.value)
                                                ? currentValues.filter((item) => item !== status.value)
                                                : [...currentValues, status.value];
                                            onChange(newValue);
                                        }}>
                                            <Text style={styles.checkboxLabel}>{status.label}</Text>
                                        </Pressable>
                                    </View>
                                ))}

                            </View>
                        )}
                    />
                    {errors.maritalStatus && <Text style={styles.errorTextCheckBox}>{errors.maritalStatus.message}</Text>}
                </View>

                {/* Education */}
                <View style={styles.checkContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Pressable
                            style={[
                                styles.checkboxBase,
                                (watch("education")?.length === highestEduOptions.length && highestEduOptions.length > 0) && styles.checkboxChecked,
                            ]}
                            onPress={() => {
                                const allValues = highestEduOptions.map(opt => opt.value);
                                if (watch("education")?.length === highestEduOptions.length) {
                                    setValue("education", []);
                                } else {
                                    setValue("education", allValues);
                                }
                            }}
                        >
                            {(watch("education")?.length === highestEduOptions.length && highestEduOptions.length > 0) && (
                                <Ionicons name="checkmark" size={14} color="white" />
                            )}
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                const allValues = highestEduOptions.map(opt => opt.value);
                                if (watch("education")?.length === highestEduOptions.length) {
                                    setValue("education", []);
                                } else {
                                    setValue("education", allValues);
                                }
                            }}
                        >
                            <Text style={styles.checkRedText}>Education</Text>
                        </Pressable>
                    </View>
                    <Controller
                        control={control}
                        name="education"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxDivColFlex}>
                                {highestEduOptions.map((education) => (
                                    <View key={education.value} style={styles.checkboxContainer}>
                                        <Pressable
                                            style={[
                                                styles.checkboxBase,
                                                (value || []).includes(education.value) && styles.checkboxChecked,
                                            ]}
                                            onPress={() => {
                                                const currentValues = value || [];
                                                const newValue = currentValues.includes(education.value)
                                                    ? currentValues.filter((item) => item !== education.value)
                                                    : [...currentValues, education.value];
                                                onChange(newValue);
                                            }}
                                        >
                                            {(value || []).includes(education.value) && (
                                                <Ionicons name="checkmark" size={14} color="white" />
                                            )}
                                        </Pressable>
                                        <Pressable onPress={() => {
                                            const currentValues = value || [];
                                            const newValue = currentValues.includes(education.value)
                                                ? currentValues.filter((item) => item !== education.value)
                                                : [...currentValues, education.value];
                                            onChange(newValue);
                                        }}>
                                            <Text style={styles.checkboxLabel}>{education.label}</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    />
                    {errors.education && <Text style={styles.errorTextCheckBox}>{errors.education.message}</Text>}
                </View>

                {/* Field of Study */}
                <View style={styles.checkContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Pressable
                            style={[
                                styles.checkboxBase,
                                (watch("fieldOfStudy")?.length === fieldOfStudyOptions.length && fieldOfStudyOptions.length > 0) && styles.checkboxChecked,
                            ]}
                            onPress={() => {
                                const allValues = fieldOfStudyOptions.map(opt => opt.value);
                                if (watch("fieldOfStudy")?.length === fieldOfStudyOptions.length) {
                                    setValue("fieldOfStudy", []);
                                } else {
                                    setValue("fieldOfStudy", allValues);
                                }
                            }}
                        >
                            {(watch("fieldOfStudy")?.length === fieldOfStudyOptions.length && fieldOfStudyOptions.length > 0) && (
                                <Ionicons name="checkmark" size={14} color="white" />
                            )}
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                const allValues = fieldOfStudyOptions.map(opt => opt.value);
                                if (watch("fieldOfStudy")?.length === fieldOfStudyOptions.length) {
                                    setValue("fieldOfStudy", []);
                                } else {
                                    setValue("fieldOfStudy", allValues);
                                }
                            }}
                        >
                            <Text style={styles.checkRedText}>Field of Study</Text>
                        </Pressable>
                    </View>
                    <Controller
                        control={control}
                        name="fieldOfStudy"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxDivColFlex}>
                                {fieldOfStudyOptions.map((field) => (
                                    <View key={field.value} style={styles.checkboxContainer}>
                                        <Pressable
                                            style={[
                                                styles.checkboxBase,
                                                (value || []).includes(field.value) && styles.checkboxChecked,
                                            ]}
                                            onPress={() => {
                                                const currentValues = value || [];
                                                const newValue = currentValues.includes(field.value)
                                                    ? currentValues.filter((item) => item !== field.value)
                                                    : [...currentValues, field.value];
                                                onChange(newValue);
                                            }}
                                        >
                                            {(value || []).includes(field.value) && (
                                                <Ionicons name="checkmark" size={14} color="white" />
                                            )}
                                        </Pressable>
                                        <Pressable onPress={() => {
                                            const currentValues = value || [];
                                            const newValue = currentValues.includes(field.value)
                                                ? currentValues.filter((item) => item !== field.value)
                                                : [...currentValues, field.value];
                                            onChange(newValue);
                                        }}>
                                            <Text style={styles.checkboxLabel}>{field.label}</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    />
                    {errors.fieldOfStudy && <Text style={styles.errorTextCheckBox}>{errors.fieldOfStudy.message}</Text>}
                </View>

                {/* Profession */}
                <View style={styles.checkContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Pressable
                            style={[
                                styles.checkboxBase,
                                (watch("profession")?.length === professionOptions.length && professionOptions.length > 0) && styles.checkboxChecked,
                            ]}
                            onPress={() => {
                                const allValues = professionOptions.map(opt => opt.value);
                                if (watch("profession")?.length === professionOptions.length) {
                                    setValue("profession", []);
                                } else {
                                    setValue("profession", allValues);
                                }
                            }}
                        >
                            {(watch("profession")?.length === professionOptions.length && professionOptions.length > 0) && (
                                <Ionicons name="checkmark" size={14} color="white" />
                            )}
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                const allValues = professionOptions.map(opt => opt.value);
                                if (watch("profession")?.length === professionOptions.length) {
                                    setValue("profession", []);
                                } else {
                                    setValue("profession", allValues);
                                }
                            }}
                        >
                            <Text style={styles.checkRedText}>Profession</Text>
                        </Pressable>
                    </View>
                    <Controller
                        control={control}
                        name="profession"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxDivColFlex}>
                                {professionOptions.map((professionOpt) => (
                                    <View key={professionOpt.value} style={styles.checkboxContainer}>
                                        <Pressable
                                            style={[
                                                styles.checkboxBase,
                                                (value || []).includes(professionOpt.value) && styles.checkboxChecked,
                                            ]}
                                            onPress={() => {
                                                const currentValues = value || [];
                                                const newValue = currentValues.includes(professionOpt.value)
                                                    ? currentValues.filter((item) => item !== professionOpt.value)
                                                    : [...currentValues, professionOpt.value];
                                                onChange(newValue);
                                            }}
                                        >
                                            {(value || []).includes(professionOpt.value) && (
                                                <Ionicons name="checkmark" size={14} color="white" />
                                            )}
                                        </Pressable>
                                        <Pressable onPress={() => {
                                            const currentValues = value || [];
                                            const newValue = currentValues.includes(professionOpt.value)
                                                ? currentValues.filter((item) => item !== professionOpt.value)
                                                : [...currentValues, professionOpt.value];
                                            onChange(newValue);
                                        }}>
                                            <Text style={styles.checkboxLabel}>{professionOpt.label}</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    />
                    {errors.profession && <Text style={styles.errorTextCheckBox}>{errors.profession.message}</Text>}
                </View>

                {/* Annual Income Min */}
                <View style={styles.searchContainer}>
                    <Text style={styles.redText}>Annual Income Min</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Controller
                                control={control}
                                name="annualIncomeMin"
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        style={styles.dropdown}
                                        placeholderStyle={styles.placeholderStyle}
                                        selectedTextStyle={styles.selectedTextStyle}
                                        data={[{ label: 'Select Annual Income Min', value: '' }, ...annualIncomeOptions]}
                                        maxHeight={180}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Select min Annual Income"
                                        value={value}
                                        onChange={(item) => {
                                            onChange(item.value);
                                            setSelectedIncomeMinIds(item.value);
                                        }}
                                    />
                                )}
                            />
                        </View>
                    </View>
                </View>

                {/* Annual Income Max */}
                <View style={styles.searchContainer}>
                    <Text style={styles.redText}>Annual Income Max</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Controller
                                control={control}
                                name="annualIncomeMax"
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        style={styles.dropdown}
                                        placeholderStyle={styles.placeholderStyle}
                                        selectedTextStyle={styles.selectedTextStyle}
                                        data={[{ label: 'Select Annual Income Max', value: '' }, ...annualIncomeOptions]}
                                        maxHeight={180}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Select max Annual Income"
                                        value={value}
                                        onChange={(item) => {
                                            onChange(item.value);
                                            setSelectedIncomeMaxIds(item.value);
                                        }}
                                    />
                                )}
                            />
                        </View>
                    </View>
                </View>

                {/* Chevvai Dropdown */}
                <View style={styles.searchContainer}>
                    <Text style={styles.redText}>Chevvai</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Controller
                                control={control}
                                name="chevvai"
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        style={styles.dropdown}
                                        data={[
                                            { label: "Select Chevvai", value: "" },
                                            { label: "Yes", value: "Yes" },
                                            { label: "No", value: "No" },
                                            { label: "Both", value: "Both" }
                                        ]}
                                        maxHeight={180}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Select Chevvai"
                                        value={value}
                                        onChange={(item) => {
                                            onChange(item.value);
                                        }}
                                    />
                                )}
                            />
                        </View>
                        {errors.chevvai && <Text style={styles.errorText}>{errors.chevvai.message}</Text>}
                    </View>
                </View>

                {/* Rehu Dropdown */}
                <View style={styles.searchContainer}>
                    <Text style={styles.redText}> Rahu/Ketu Dhosam</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Controller
                                control={control}
                                name="rehu"
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        style={styles.dropdown}
                                        data={[
                                            { label: "Select Rahu/Ketu Dhosam", value: "" },
                                            { label: "Yes", value: "Yes" },
                                            { label: "No", value: "No" },
                                            { label: "Both", value: "Both" }
                                        ]}
                                        maxHeight={180}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Select Rahu/Ketu Dhosam"
                                        value={value}
                                        onChange={(item) => {
                                            onChange(item.value);
                                        }}
                                    />
                                )}
                            />
                        </View>
                        {errors.rehu && <Text style={styles.errorText}>{errors.rehu.message}</Text>}
                    </View>
                </View>

                {/* Foreign Interest */}
                <View style={styles.searchContainer}>
                    <Text style={styles.redText}>Foreign Interest</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>

                            <Controller
                                control={control}
                                name="foreignInterest"
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        style={styles.dropdown}
                                        data={[
                                            { label: 'Select Foreign Interest', value: '' },
                                            { label: 'Yes', value: 'Yes' },
                                            { label: 'No', value: 'No' },
                                            { label: 'Both', value: 'Both' }]}
                                        maxHeight={180}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Select Foreign Interest"
                                        value={value}
                                        onChange={(item) => {
                                            onChange(item.value);
                                        }}
                                    />
                                )}
                            />
                        </View>
                    </View>
                </View>

                {/* Porutham */}
                <View style={styles.checkContainer}>
                    {matchingStarsData.length > 0 ? (
                        matchingStarsData
                            .sort((a, b) => b[0].match_count - a[0].match_count)
                            .map((matchCountArray, index) => {
                                const starAndRasi = matchCountArray.map(star => ({
                                    id: star.id.toString(),
                                    matching_starId: star.dest_star_id.toString(),
                                    matching_starname: star.matching_starname,
                                    matching_rasiId: star.dest_rasi_id.toString(),
                                    matching_rasiname: star.matching_rasiname,
                                }));

                                const matchCountValue = matchCountArray[0].match_count;

                                return (
                                    <MatchingStars
                                        key={`${index}`}
                                        matchCountValue={matchCountValue}
                                        starAndRasi={starAndRasi}
                                        selectedStarIds={selectedStarIds}
                                        onCheckboxChange={handleCheckboxChange}
                                    />
                                );
                            })
                    ) : (
                        <Text>Loading match stars...</Text>
                    )}
                </View>

                {/* Find Match Button */}
                <View style={styles.formContainer}>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={handleSubmit(onSubmit, onError)}
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
            </ScrollView>
        </SafeAreaView>
    );
};

// ... Styles (included for completeness)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",

    },

    partnerHead: {
        color: "#535665",
        // color: "#4F515D",
        fontFamily: "inter",
        fontSize: 24,
        fontWeight: "700",
        alignSelf: "flex-start",
        paddingHorizontal: 20,
        marginVertical: 10,
    },

    search: {
        fontSize: 16,
        fontWeight: "700",
        fontFamily: "inter",
        // color: "#282C3F",
        color: "#535665",
        alignSelf: "flex-start",
        paddingHorizontal: 20,
        marginVertical: 10,
    },


    inputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 4,
        borderColor: "#D4D5D9",
    },

    input: {
        flex: 1,
        color: "#535665",
        padding: 10,
        fontFamily: "inter",
    },

    dropdown: {
        width: "100%",
        color: "#535665",
        // borderWidth: 1,
        borderRadius: 4,
        borderColor: "#D4D5D9",
        padding: 10,
        fontFamily: "inter",
    },

    searchIcon: {
        paddingLeft: 10,
    },

    filterIcon: {
        position: "absolute",
        right: 20,
        bottom: 15,
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
        borderColor: "#D4D5D9",
        fontFamily: "inter",
    },

    inputFlexFirst: {
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

    checkRedText: {
        // color: "#FF6666",
        color: "#535665",
        fontSize: 20,
        fontWeight: "bold",
        fontFamily: "inter",
        alignSelf: "flex-start",
        // paddingHorizontal: 10,
        marginBottom: 10,
        marginTop: 5,
    },

    checkboxDivFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        alignSelf: "flex-start",
        fontFamily: "inter",
        width: "100%",
    },

    checkboxDivColFlex: {
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "flex-start",
        alignSelf: "flex-start",
        fontFamily: "inter",
        width: "100%",
    },

    checkBoxFlex: {
        // flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        alignSelf: "flex-start",
        // borderColor: "#D4D5D9",
        fontFamily: "inter",
    },

    checkContainer: {
        alignSelf: "flex-start",
        paddingHorizontal: 20,
        width: "100%", // Changed from 80% to 100% to fill space better
    },

    newCheckContainer: {
        alignSelf: "flex-start",
        paddingHorizontal: 20,
        width: "100%",
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
        // marginBottom: 20,
        paddingHorizontal: 20,
        // textAlign: "left",
        // alignSelf: "center",
    },

    dhosamFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        alignSelf: "flex-start",
        // borderColor: "#D4D5D9",
        // fontFamily: "inter",
        width: "80%",
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
        // borderColor: "#FF6666",
        borderColor: "#535665",
        backgroundColor: "transparent",
        marginRight: 6,
    },

    checkboxChecked: {
        // backgroundColor: "#FF6666",
        backgroundColor: "#535665",
    },

    checkboxLabel: {
        fontSize: 14,
        color: "#535665",
    },

    redTextLabel: {
        color: "#535665",
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "inter",
        alignSelf: "flex-start",
        paddingHorizontal: 20,
        marginBottom: 10,
    },

    placeholderStyle: {
        fontSize: 14,
    },

    selectedTextStyle: {
        fontSize: 14,
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
    formContainer: {
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
    errorText: {
        color: "#FF0000",
        fontSize: 12,
        fontFamily: "inter",
    },

    errorTextCheckBox: {
        color: "#FF0000",
        fontSize: 12,
        fontFamily: "inter",
        marginTop: -15,
        marginBottom: 10,
    }

});