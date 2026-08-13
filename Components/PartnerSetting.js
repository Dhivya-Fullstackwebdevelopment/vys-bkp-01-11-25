import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
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
import { Colors } from '../Reusable/Theme'; // adjust path if needed

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

    useEffect(() => {
        const initializeFormData = async () => {
            if (maritalStatusOptions.length === 0 || highestEduOptions.length === 0 || annualIncomeOptions.length === 0 || professionOptions.length === 0 || fieldOfStudyOptions.length === 0 || allStarOptions.length === 0) {
                return;
            }

            try {
                const partnerProfileData = await fetchPartnerProfilenew();
                console.log("partnerProfileData", partnerProfileData);

                setValue('ageDifference', partnerProfileData.fromAge || '');
                setValue('heightFrom', partnerProfileData.fromHeight?.height_value || '');
                setValue('heightTo', partnerProfileData.toHeight?.height_value || '');
                setValue('education', partnerProfileData.education);
                setValue('fieldOfStudy', partnerProfileData.fieldofstudy);
                setValue('maritalStatus', partnerProfileData.maritalStatus);
                setValue('profession', partnerProfileData.profession);
                setValue('rehu', partnerProfileData.rahuKetuDhosam || '');
                setValue('chevvai', partnerProfileData.chevvaiDhosam || '');
                setValue('foreignInterest', partnerProfileData.foreignInterest || '');

                const minIncome = partnerProfileData.income || '';
                setValue('annualIncomeMin', minIncome);
                setSelectedIncomeMinIds(minIncome);

                const maxIncome = partnerProfileData.incomeStatusMax || '';
                setValue('annualIncomeMax', maxIncome);
                setSelectedIncomeMaxIds(maxIncome);

                const savedStarIdsString = partnerProfileData.partner_porutham_ids;
                if (savedStarIdsString && savedStarIdsString.trim() !== '') {
                    const selectedIds = savedStarIdsString.split(',');
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
                } else {
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
        allStarOptions.length
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
                    position: 'top',
                    text1: 'Successfully updated',
                    text2: 'Your partner preferences have been updated successfully.',
                });
            } else {
                Toast.show({
                    type: 'error',
                    position: 'top',
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
            position: 'top',
            text1: 'Submission Failed',
            text2: firstErrorMessage || 'Please fill all required fields.',
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Age Difference */}
                <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Age Difference</Text>
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
                                placeholder="Select Age Difference"
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                value={value}
                                onChange={(item) => onChange(item.value)}
                            />
                        )}
                    />
                    {errors.ageDifference && <Text style={styles.errorText}>{errors.ageDifference.message}</Text>}
                </View>

                {/* Height */}
                <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Height</Text>
                    <View style={styles.rowContainer}>
                        <View style={styles.halfField}>
                            <Controller
                                control={control}
                                name="heightFrom"
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        style={styles.dropdown}
                                        data={heightOptions}
                                        maxHeight={250}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="From"
                                        placeholderStyle={styles.placeholderStyle}
                                        selectedTextStyle={styles.selectedTextStyle}
                                        value={value}
                                        onChange={(item) => onChange(item.value)}
                                    />
                                )}
                            />
                            {errors.heightFrom && <Text style={styles.errorText}>{errors.heightFrom.message}</Text>}
                        </View>
                        <View style={styles.halfField}>
                            <Controller
                                control={control}
                                name="heightTo"
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        style={styles.dropdown}
                                        data={heightOptions}
                                        maxHeight={250}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="To"
                                        placeholderStyle={styles.placeholderStyle}
                                        selectedTextStyle={styles.selectedTextStyle}
                                        value={value}
                                        onChange={(item) => onChange(item.value)}
                                    />
                                )}
                            />
                            {errors.heightTo && <Text style={styles.errorText}>{errors.heightTo.message}</Text>}
                        </View>
                    </View>
                </View>

                {/* Marital Status */}
                <View style={styles.fieldWrapper}>
                    <View style={styles.checkboxGroupHeader}>
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
                            <Text style={styles.fieldLabel}>Marital Status</Text>
                        </Pressable>
                    </View>
                    <Controller
                        control={control}
                        name="maritalStatus"
                        render={({ field: { onChange, value } }) => (
                            <View style={[styles.checkboxGrid, styles.columnGrid]}>                                {maritalStatusOptions.map((status) => (
                                <View key={status.value} style={styles.checkboxItem}>
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
                    {errors.maritalStatus && <Text style={styles.errorText}>{errors.maritalStatus.message}</Text>}
                </View>

                {/* Education */}
                <View style={styles.fieldWrapper}>
                    <View style={styles.checkboxGroupHeader}>
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
                            <Text style={styles.fieldLabel}>Education</Text>
                        </Pressable>
                    </View>
                    <Controller
                        control={control}
                        name="education"
                        render={({ field: { onChange, value } }) => (
                            <View style={[styles.checkboxGrid, styles.columnGrid]}>
                                {highestEduOptions.map((education) => (
                                    <View key={education.value} style={styles.checkboxItem}>
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
                    {errors.education && <Text style={styles.errorText}>{errors.education.message}</Text>}
                </View>

                {/* Field of Study */}
                <View style={styles.fieldWrapper}>
                    <View style={styles.checkboxGroupHeader}>
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
                            <Text style={styles.fieldLabel}>Field of Study</Text>
                        </Pressable>
                    </View>
                    <Controller
                        control={control}
                        name="fieldOfStudy"
                        render={({ field: { onChange, value } }) => (
                            <View style={[styles.checkboxGrid, styles.columnGrid]}>
                                {fieldOfStudyOptions.map((field) => (
                                    <View key={field.value} style={styles.checkboxItem}>
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
                    {errors.fieldOfStudy && <Text style={styles.errorText}>{errors.fieldOfStudy.message}</Text>}
                </View>

                {/* Profession */}
                <View style={styles.fieldWrapper}>
                    <View style={styles.checkboxGroupHeader}>
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
                            <Text style={styles.fieldLabel}>Profession</Text>
                        </Pressable>
                    </View>
                    <Controller
                        control={control}
                        name="profession"
                        render={({ field: { onChange, value } }) => (
                            <View style={[styles.checkboxGrid, styles.columnGrid]}>
                                {professionOptions.map((professionOpt) => (
                                    <View key={professionOpt.value} style={styles.checkboxItem}>
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
                    {errors.profession && <Text style={styles.errorText}>{errors.profession.message}</Text>}
                </View>

                {/* Annual Income Min */}
                <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Annual Income Min</Text>
                    <Controller
                        control={control}
                        name="annualIncomeMin"
                        render={({ field: { onChange, value } }) => (
                            <Dropdown
                                style={styles.dropdown}
                                data={[{ label: 'Select Annual Income Min', value: '' }, ...annualIncomeOptions]}
                                maxHeight={180}
                                labelField="label"
                                valueField="value"
                                placeholder="Select min Annual Income"
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                value={value}
                                onChange={(item) => {
                                    onChange(item.value);
                                    setSelectedIncomeMinIds(item.value);
                                }}
                            />
                        )}
                    />
                </View>

                {/* Annual Income Max */}
                <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Annual Income Max</Text>
                    <Controller
                        control={control}
                        name="annualIncomeMax"
                        render={({ field: { onChange, value } }) => (
                            <Dropdown
                                style={styles.dropdown}
                                data={[{ label: 'Select Annual Income Max', value: '' }, ...annualIncomeOptions]}
                                maxHeight={180}
                                labelField="label"
                                valueField="value"
                                placeholder="Select max Annual Income"
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                value={value}
                                onChange={(item) => {
                                    onChange(item.value);
                                    setSelectedIncomeMaxIds(item.value);
                                }}
                            />
                        )}
                    />
                </View>

                {/* Chevvai */}
                <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Chevvai</Text>
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
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                value={value}
                                onChange={(item) => onChange(item.value)}
                            />
                        )}
                    />
                    {errors.chevvai && <Text style={styles.errorText}>{errors.chevvai.message}</Text>}
                </View>

                {/* Rahu/Ketu Dhosam */}
                <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Rahu/Ketu Dhosam</Text>
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
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                value={value}
                                onChange={(item) => onChange(item.value)}
                            />
                        )}
                    />
                    {errors.rehu && <Text style={styles.errorText}>{errors.rehu.message}</Text>}
                </View>

                {/* Foreign Interest */}
                <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Foreign Interest</Text>
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
                                    { label: 'Both', value: 'Both' }
                                ]}
                                maxHeight={180}
                                labelField="label"
                                valueField="value"
                                placeholder="Select Foreign Interest"
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                value={value}
                                onChange={(item) => onChange(item.value)}
                            />
                        )}
                    />
                </View>

                {/* Matching Stars */}
                <View style={styles.fieldWrapper}>
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
                        <Text style={styles.helperNote}>Loading match stars...</Text>
                    )}
                </View>

                {/* Save Button */}
                <View style={styles.buttonWrapper}>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={handleSubmit(onSubmit, onError)}
                    >
                        <LinearGradient
                            colors={[Colors.primary || "#BD1225", Colors.primary || "#BD1225"]}
                            style={styles.linearGradient}
                        >
                            <Text style={styles.login}>Save</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.cardBackground || "#FAF6F0",
    },
    scrollContent: {
        paddingBottom: 20,
    },
    fieldWrapper: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#71717A",
        textTransform: "uppercase",
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    dropdown: {
        borderWidth: 1,
        borderColor: "#E4E4E7",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: Colors.selectedBg || "#F4F4F5",
        color: "#18181B",
    },
    placeholderStyle: {
        fontSize: 14,
        color: "#71717A",
    },
    selectedTextStyle: {
        fontSize: 14,
        color: "#18181B",
    },
    rowContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    halfField: {
        flex: 1,
    },
    checkboxGroupHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    checkboxGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
    },
    checkboxItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
        marginBottom: 8,
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
        marginRight: 6,
    },
    checkboxChecked: {
        backgroundColor: Colors.primary || "#BD1225",
        borderColor: Colors.primary || "#BD1225",
    },
    checkboxLabel: {
        fontSize: 14,
        color: "#3F3F46",
    },
    errorText: {
        color: "#ED1E24",
        fontSize: 13,
        marginTop: 4,
        marginLeft: 5,
        fontWeight: "bold",
    },
    helperNote: {
        fontSize: 13,
        color: "#71717A",
        marginTop: 6,
    },
    buttonWrapper: {
        alignItems: "center",
        marginTop: 8,
        marginBottom: 16,
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
    linearGradient: {
        borderRadius: 26,
        justifyContent: "center",
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    login: {
        textAlign: "center",
        color: "white",
        fontWeight: "600",
        fontSize: 16,
        letterSpacing: 1,
        fontFamily: "inter",
    },
    columnGrid: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '100%',
    },
});