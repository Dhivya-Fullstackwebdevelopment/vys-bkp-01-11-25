import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    ScrollView,
    TouchableOpacity,
    Modal,
    FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";
import { updateProfileVisibility, fetchProfileVisibility } from '../CommonApiCall/CommonApiCall';
import Toast from 'react-native-toast-message';
import { Colors } from '../Reusable/Theme'; // adjust path if needed

const schema = z.object({
    ageDifference: z.string().min(1, "Age difference is required"),
    toage: z.string().min(1, "To Age is required"),
    heightFrom: z.string().optional().default(''),
    heightTo: z.string().optional().default(''),
    chevvai: z.string().optional().default(''),
    rehu: z.string().optional().default(''),
    education: z.array(z.string()).optional().default([]),
    profession: z.array(z.string()).optional().default([]),
    annualIncomeMin: z.string().optional().default(''),
    annualIncomeMax: z.string().optional().default(''),
    foreignInterest: z.string().optional().default(''),
});

/* Custom Modal Dropdown Popup Component */
const CustomSelectDropdown = ({
    placeholder,
    data = [],
    selectedValue,
    onSelect,
    style,
}) => {
    const [modalVisible, setModalVisible] = useState(false);

    const selectedItem = data.find((item) => String(item.value) === String(selectedValue));
    const displayLabel = selectedItem && selectedItem.value !== '' ? selectedItem.label : placeholder;

    return (
        <>
            <TouchableOpacity
                style={[styles.dropdownStyle, style]}
                activeOpacity={0.7}
                onPress={() => setModalVisible(true)}
            >
                <Text
                    style={
                        selectedItem && selectedItem.value !== ''
                            ? styles.dropdownSelectedText
                            : styles.dropdownPlaceholder
                    }
                    numberOfLines={1}
                >
                    {displayLabel}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#71717A" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalHeaderTitle}>{placeholder}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={20} color="#18181B" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={data}
                            keyExtractor={(item, index) => item.value !== undefined && item.value !== null ? item.value.toString() : index.toString()}
                            renderItem={({ item }) => {
                                const isSelected = String(item.value) === String(selectedValue);
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.dropdownOptionItem,
                                            isSelected && styles.dropdownOptionSelected,
                                        ]}
                                        onPress={() => {
                                            onSelect(item);
                                            setModalVisible(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.dropdownItemText,
                                                isSelected && styles.dropdownItemTextSelected,
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark" size={16} color="#BD1225" />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

export const ProfileVisibility = () => {
    const navigation = useNavigation();
    const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            ageDifference: '',
            toage: '',
            heightFrom: '',
            heightTo: '',
            education: [],
            profession: [],
            annualIncomeMin: '',
            annualIncomeMax: '',
            foreignInterest: '',
            chevvai: '',
            rehu: '',
        },
    });

    const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
    const [highestEduOptions, setHighestEduOptions] = useState([]);
    const [annualIncomeOptions, setAnnualIncomeOptions] = useState([]);
    const [selectedIncomeMinIds, setSelectedIncomeMinIds] = useState('');
    const [selectedIncomeMaxIds, setSelectedIncomeMaxIds] = useState('');
    const [heightOptions, setHeightOptions] = useState([]);

    const professionOptions = [
        { value: '1', label: 'Employed' },
        { value: '2', label: 'Business' },
        { value: '3', label: 'Student' },
        { value: '4', label: 'Not working' },
        { value: '5', label: 'Not mentioned' },
        { value: '6', label: 'Employed/ Business' },
        { value: '7', label: 'Goverment/ PSU' },
    ];

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

    useEffect(() => {
        fetchMaritalStatus();
        fetchHighestEdu();
        fetchAnnualIncome();
        fetchHeightOptions();
    }, []);

    const onSubmit = async (data) => {
        try {
            const professionValues = data.profession.map(p => {
                const profOpt = professionOptions.find(opt => opt.value === p);
                return profOpt ? profOpt.value : p;
            });

            const formattedData = {
                visibility_age_from: data.ageDifference,
                visibility_age_to: data.toage,
                visibility_height_from: data.heightFrom,
                visibility_height_to: data.heightTo,
                visibility_profession: professionValues.join(','),
                visibility_education: data.education.join(','),
                visibility_anual_income: `${data.annualIncomeMin},${data.annualIncomeMax}`,
                visibility_ragukethu: data.chevvai,
                visibility_chevvai: data.rehu,
                visibility_foreign_interest: data.foreignInterest,
                status: 1
            };

            console.log("Post Data:", formattedData);

            const result = await updateProfileVisibility(formattedData);
            console.log("Registration response:", result.data);

            if (result.data.Status === 1) {
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

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const partnerProfileData = await fetchProfileVisibility();

                setValue('ageDifference', partnerProfileData.fromAge);
                setValue('toage', partnerProfileData.toage);
                setValue('heightFrom', partnerProfileData.fromHeight?.height_value || '');
                setValue('heightTo', partnerProfileData.toHeight?.height_value || '');
                setValue('education', partnerProfileData.education);
                setValue('maritalStatus', partnerProfileData.maritalStatus);

                const incomeRaw = partnerProfileData.incomeStatus
                    || partnerProfileData.income
                    || partnerProfileData.partner_ann_inc
                    || '';
                if (incomeRaw) {
                    const incomeValues = incomeRaw.toString().split(',');
                    setValue('annualIncomeMin', incomeValues[0] || '');
                    setValue('annualIncomeMax', incomeValues[incomeValues.length - 1] || '');
                } else {
                    setValue('annualIncomeMin', '');
                    setValue('annualIncomeMax', '');
                }
                setValue('profession', partnerProfileData.profession);
                setValue('rehu', partnerProfileData.rahuKetuDhosam);
                setValue('chevvai', partnerProfileData.chevvaiDhosam);
                setValue('foreignInterest', partnerProfileData.foreignInterest);
            } catch (error) {
                console.error('Error setting form values:', error);
            }
        };

        fetchProfileData();
    }, [setValue]);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* From Age */}
                <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>From Age</Text>
                    <Controller
                        control={control}
                        name="ageDifference"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Enter From Age"
                                placeholderTextColor="#71717A"
                                value={value}
                                keyboardType="numeric"
                                onChangeText={onChange}
                            />
                        )}
                    />
                    {errors.ageDifference && <Text style={styles.errorText}>{errors.ageDifference.message}</Text>}
                </View>

                {/* To Age */}
                <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>To Age</Text>
                    <Controller
                        control={control}
                        name="toage"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Enter To Age"
                                placeholderTextColor="#71717A"
                                value={value}
                                keyboardType="numeric"
                                onChangeText={onChange}
                            />
                        )}
                    />
                    {errors.toage && <Text style={styles.errorText}>{errors.toage.message}</Text>}
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
                                    <CustomSelectDropdown
                                        placeholder="From"
                                        data={heightOptions}
                                        selectedValue={value}
                                        onSelect={(item) => onChange(item.value)}
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
                                    <CustomSelectDropdown
                                        placeholder="To"
                                        data={heightOptions}
                                        selectedValue={value}
                                        onSelect={(item) => onChange(item.value)}
                                    />
                                )}
                            />
                            {errors.heightTo && <Text style={styles.errorText}>{errors.heightTo.message}</Text>}
                        </View>
                    </View>
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
                                                value.includes(education.value) && styles.checkboxChecked,
                                            ]}
                                            onPress={() => {
                                                const newValue = value.includes(education.value)
                                                    ? value.filter((item) => item !== education.value)
                                                    : [...value, education.value];
                                                onChange(newValue);
                                            }}
                                        >
                                            {value.includes(education.value) && (
                                                <Ionicons name="checkmark" size={14} color="white" />
                                            )}
                                        </Pressable>
                                        <Pressable onPress={() => {
                                            const newValue = value.includes(education.value)
                                                ? value.filter((item) => item !== education.value)
                                                : [...value, education.value];
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
                                {professionOptions.map((profession) => (
                                    <View key={profession.value} style={styles.checkboxItem}>
                                        <Pressable
                                            style={[
                                                styles.checkboxBase,
                                                value.includes(profession.value) && styles.checkboxChecked,
                                            ]}
                                            onPress={() => {
                                                const newValue = value.includes(profession.value)
                                                    ? value.filter((item) => item !== profession.value)
                                                    : [...value, profession.value];
                                                onChange(newValue);
                                            }}
                                        >
                                            {value.includes(profession.value) && (
                                                <Ionicons name="checkmark" size={14} color="white" />
                                            )}
                                        </Pressable>
                                        <Pressable onPress={() => {
                                            const newValue = value.includes(profession.value)
                                                ? value.filter((item) => item !== profession.value)
                                                : [...value, profession.value];
                                            onChange(newValue);
                                        }}>
                                            <Text style={styles.checkboxLabel}>{profession.label}</Text>
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
                            <CustomSelectDropdown
                                placeholder="Select min Annual Income"
                                data={annualIncomeOptions}
                                selectedValue={value}
                                onSelect={(item) => {
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
                            <CustomSelectDropdown
                                placeholder="Select max Annual Income"
                                data={annualIncomeOptions}
                                selectedValue={value}
                                onSelect={(item) => {
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
                            <CustomSelectDropdown
                                placeholder="Select Chevvai"
                                data={[
                                    { label: "Unknown", value: "Unknown" },
                                    { label: "Yes", value: "Yes" },
                                    { label: "No", value: "No" }
                                ]}
                                selectedValue={value}
                                onSelect={(item) => onChange(item.value)}
                            />
                        )}
                    />
                    {errors.chevvai && <Text style={styles.errorText}>{errors.chevvai.message}</Text>}
                </View>

                {/* Rahu/Ketu */}
                <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Rahu/Ketu Dhosam</Text>
                    <Controller
                        control={control}
                        name="rehu"
                        render={({ field: { onChange, value } }) => (
                            <CustomSelectDropdown
                                placeholder="Select Rahu/Ketu"
                                data={[
                                    { label: "Unknown", value: "Unknown" },
                                    { label: "Yes", value: "Yes" },
                                    { label: "No", value: "No" }
                                ]}
                                selectedValue={value}
                                onSelect={(item) => onChange(item.value)}
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
                            <CustomSelectDropdown
                                placeholder="Select Foreign Interest"
                                data={[
                                    { label: 'Yes', value: 'YES' },
                                    { label: 'No', value: 'NO' },
                                    { label: 'Both', value: 'BOTH' }
                                ]}
                                selectedValue={value}
                                onSelect={(item) => onChange(item.value)}
                            />
                        )}
                    />
                    {errors.foreignInterest && <Text style={styles.errorText}>{errors.foreignInterest.message}</Text>}
                </View>

                {/* Save Button */}
                <View style={styles.buttonWrapper}>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={handleSubmit(onSubmit, (errors) => {
                            console.log("Validation errors:", errors);
                            Toast.show({
                                type: 'error',
                                position: 'top',
                                text1: 'Please fill all required fields',
                            });
                        })}
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
    input: {
        borderWidth: 1,
        borderColor: "#E4E4E7",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: Colors.selectedBg || "#F4F4F5",
        color: "#18181B",
        fontSize: 14,
    },
    dropdownStyle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#E4E4E7",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: Colors.selectedBg || "#F4F4F5",
    },
    dropdownPlaceholder: {
        fontSize: 14,
        color: "#71717A",
    },
    dropdownSelectedText: {
        fontSize: 14,
        color: "#18181B",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        maxHeight: "60%",
        paddingVertical: 12,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F4F4F5",
    },
    modalHeaderTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#18181B",
    },
    dropdownOptionItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F4F4F5",
    },
    dropdownOptionSelected: {
        backgroundColor: "#FEF2F2",
    },
    dropdownItemText: {
        fontSize: 14,
        color: "#3F3F46",
    },
    dropdownItemTextSelected: {
        color: "#BD1225",
        fontWeight: "700",
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
    columnGrid: {
        flexDirection: "column",
        alignItems: "flex-start",
        width: "100%",
    },
    checkboxItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        width: "100%",
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
        flexShrink: 1,
    },
    errorText: {
        color: "#ED1E24",
        fontSize: 13,
        marginTop: 4,
        marginLeft: 5,
        fontWeight: "bold",
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
});