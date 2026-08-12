import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
} from "react-native";
import {
    Ionicons,
    FontAwesome5,
} from "@expo/vector-icons";
import { getMyFamilyDetails, updateProfileFamily } from '../../CommonApiCall/CommonApiCall';
import RNPickerSelect from 'react-native-picker-select';
import config from "../../API/Apiurl";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Colors } from "../../Reusable/Theme";

export const FamilyDetails = ({ setLoading }) => {
    const [familyDetails, setFamilyDetails] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [familyStatusOptions, setFamilyStatus] = useState([]);
    const [selectedValue, setSelectedValue] = useState(null);
    const [SelectedValueBro, setSelectedValueBro] = useState(null);
    const [selectedSistersMarried, setSelectedSistersMarried] = useState(null);
    const [selectedBrothersMarried, setSelectedBrothersMarried] = useState(null);
    const [martialStatus, setMartialStatus] = useState(null);
    const [noOfChildren, setNoOfChildren] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isFetched, setIsFetched] = useState(false);

    const [formValues, setFormValues] = useState({
        personal_about_fam: '',
        personal_father_name: '',
        personal_father_occu_name: '',
        personal_mother_name: '',
        personal_mother_occu_name: '',
        personal_fam_sta_name: '',
        personal_sis: '',
        personal_sis_married: '',
        personal_bro: '',
        personal_bro_married: '',
        personal_prope_det: '',
        personal_property_worth: '',
        personal_father_occu_id: null,
        personal_mother_occu_id: null,
        personal_fam_sta_id: null,
        personal_no_of_children: null,
        father_alive: '',
        mother_alive: ''
    });

    const fetchProfileData = async () => {
        try {
            const data = await getMyFamilyDetails();
            setFamilyDetails(data.data);
        } catch (error) {
            console.error('Failed to load profile data', error);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    useEffect(() => {
        const fetchFamilyStatus = async () => {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_FamilyStatus/`);
                const FamilyStatusArray = Object.keys(response.data).map(key => ({
                    label: response.data[key].family_status_name,
                    value: response.data[key].family_status_id.toString(),
                }));
                setFamilyStatus(FamilyStatusArray);
            } catch (error) {
                console.error("Error fetching Family status:", error);
            }
        };
        fetchFamilyStatus();
    }, []);

    useEffect(() => {
        if (familyDetails && !isFetched) {
            setFormValues({
                personal_about_fam: familyDetails.personal_about_fam || '',
                personal_father_name: familyDetails.personal_father_name || '',
                personal_father_occu_name: familyDetails.personal_father_occu_name || '',
                personal_mother_name: familyDetails.personal_mother_name || '',
                personal_mother_occu_name: familyDetails.personal_mother_occu_name || '',
                personal_fam_sta_name: familyDetails.personal_fam_sta_name || '',
                personal_sis: familyDetails.personal_sis || '',
                personal_sis_married: familyDetails.personal_sis_married || '',
                personal_bro: familyDetails.personal_bro || '',
                personal_bro_married: familyDetails.personal_bro_married || '',
                personal_prope_det: familyDetails.personal_prope_det || '',
                personal_property_worth: familyDetails.personal_property_worth || '',
                personal_father_occu_id: familyDetails.personal_father_occu_id || null,
                personal_mother_occu_id: familyDetails.personal_mother_occu_id || null,
                personal_fam_sta_id: familyDetails.personal_fam_sta_id || null,
                personal_no_of_children: familyDetails.personal_no_of_children || null,
                father_alive: familyDetails.father_alive || '',
                mother_alive: familyDetails.mother_alive || '',
            });
            setIsFetched(true);
        }
    }, [familyDetails, isFetched]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getMyFamilyDetails();
                if (data?.data) {
                    setSelectedValue(data.data.personal_sis ? data.data.personal_sis.toString() : "0");
                    setSelectedValueBro(data.data.personal_bro ? data.data.personal_bro.toString() : "0");
                    setSelectedSistersMarried(data.data.personal_sis_married ? data.data.personal_sis_married.toString() : "0");
                    setSelectedBrothersMarried(data.data.personal_bro_married ? data.data.personal_bro_married.toString() : "0");
                }
            } catch (error) {
                console.error('Failed to load profile data', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchMartialStatus = async () => {
            try {
                const value = await AsyncStorage.getItem("martial_status");
                setMartialStatus(value);
            } catch (error) {
                console.error("Failed to fetch martial_status from AsyncStorage", error);
            }
        };
        fetchMartialStatus();
    }, []);

    const getSistersMarriedOptions = (sistersCount) => {
        const count = parseInt(sistersCount);
        return Array.from({ length: count + 1 }, (_, i) => ({
            label: i === 5 ? '5+' : i.toString(),
            value: i.toString(),
        }));
    };

    const getBrothersMarriedOptions = (brothersCount) => {
        const count = parseInt(brothersCount);
        return Array.from({ length: count + 1 }, (_, i) => ({
            label: i === 5 ? '5+' : i.toString(),
            value: i.toString(),
        }));
    };

    const handleSecondDropdownChange = (value) => {
        setSelectedSistersMarried(value);
        if (value !== null) {
            setValidationErrors((prevErrors) => ({
                ...prevErrors,
                selectedSistersMarried: '',
            }));
        }
    };

    const handleThirdDropdownChange = (value) => {
        setSelectedBrothersMarried(value);
        if (value !== null) {
            setValidationErrors((prevErrors) => ({
                ...prevErrors,
                selectedBrothersMarried: '',
            }));
        }
    };

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

        if (!formValues.personal_father_name) errors.personal_father_name = 'Father Name is required';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (validateForm()) {
            const familyData = {
                about_family: formValues.personal_about_fam || "",
                father_name: formValues.personal_father_name || "",
                father_occupation: formValues.personal_father_occu_name || "",
                mother_name: formValues.personal_mother_name || "",
                mother_occupation: formValues.personal_mother_occu_name || "",
                family_status: formValues.personal_fam_sta_id || "",
                no_of_sister: selectedValue || "0",
                no_of_sis_married: selectedSistersMarried || "0",
                no_of_brother: SelectedValueBro || "0",
                no_of_bro_married: selectedBrothersMarried || "0",
                property_details: formValues.personal_prope_det || "",
                property_worth: formValues.personal_property_worth || "",
                personal_about_fam: formValues.personal_about_fam || "",
                no_of_children: noOfChildren === "" ? "0" : noOfChildren,
                father_alive: formValues.father_alive || "",
                mother_alive: formValues.mother_alive || "",
            };

            try {
                setSubmitting(true);
                if (setLoading) setLoading(true);
                const response = await updateProfileFamily(familyData);

                if (response && response.status === 'success') {
                    Toast.show({
                        type: 'success',
                        text1: 'Success',
                        text2: response.message || 'Family profile updated successfully',
                        visibilityTime: 3000,
                        autoHide: true
                    });
                    setIsEditMode(false);
                    await fetchProfileData();
                } else {
                    throw new Error(response?.message || 'Update failed');
                }
            } catch (error) {
                console.error('Failed to update family profile:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: error.message || 'Failed to update family profile. Please try again.',
                    visibilityTime: 4000,
                    autoHide: true
                });
            } finally {
                setSubmitting(false);
                if (setLoading) setLoading(false);
            }
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

    return (
        <View style={styles.menuChanges}>
            <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                    <View style={styles.sectionIconCircle}>
                        <FontAwesome5 name="users" size={14} color={Colors.primary} />
                    </View>
                    <Text style={styles.cardSectionTitle}>Family Details</Text>
                    <TouchableWithoutFeedback onPress={() => setIsEditMode(!isEditMode)}>
                        <View style={styles.editPill}>
                            <Ionicons name={isEditMode ? "eye-outline" : "create-outline"} size={14} color={Colors.primary} />
                            <Text style={styles.editPillText}>{isEditMode ? 'View' : 'Edit'}</Text>
                        </View>
                    </TouchableWithoutFeedback>
                </View>

                {isEditMode ? (
                    <View style={styles.editOptionsInner}>
                        <Text style={styles.labelNew}>About My Family</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter About Family"
                            value={formValues.personal_about_fam}
                            onChangeText={(text) => handleChange('personal_about_fam', text)}
                        />
                        {validationErrors.personal_about_fam && <Text style={styles.error}>{validationErrors.personal_about_fam}</Text>}

                        <Text style={styles.labelNew}>Father Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Father Name"
                            value={formValues.personal_father_name}
                            onChangeText={(text) => handleChange('personal_father_name', text)}
                        />
                        {validationErrors.personal_father_name && <Text style={styles.error}>{validationErrors.personal_father_name}</Text>}

                        <Text style={styles.labelNew}>Father Occupation</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Father Occupation"
                            value={formValues.personal_father_occu_name}
                            onChangeText={(text) => handleChange('personal_father_occu_name', text)}
                        />
                        {validationErrors.personal_father_occu_name && <Text style={styles.error}>{validationErrors.personal_father_occu_name}</Text>}

                        <Text style={styles.labelNew}>Mother Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Mother Name"
                            value={formValues.personal_mother_name}
                            onChangeText={(text) => handleChange('personal_mother_name', text)}
                        />
                        {validationErrors.personal_mother_name && <Text style={styles.error}>{validationErrors.personal_mother_name}</Text>}

                        <Text style={styles.labelNew}>Mother Occupation</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Mother Occupation"
                            value={formValues.personal_mother_occu_name}
                            onChangeText={(text) => handleChange('personal_mother_occu_name', text)}
                        />
                        {validationErrors.personal_mother_occu_name && <Text style={styles.error}>{validationErrors.personal_mother_occu_name}</Text>}

                        <Text style={styles.labelNew}>Family Status</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_fam_sta_id', value)}
                            items={familyStatusOptions}
                            value={formValues.personal_fam_sta_id}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons name="chevron-down" size={22} color={Colors.textMuted} style={{ marginTop: 10 }} />
                            )}
                            placeholder={{ label: "Select Family Status", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.personal_fam_sta_id && <Text style={styles.error}>{validationErrors.personal_fam_sta_id}</Text>}

                        <Text style={styles.labelNew}>Number of Sisters</Text>
                        <RNPickerSelect
                            onValueChange={(value) => {
                                setSelectedValue(value);
                                if (value !== null) {
                                    setValidationErrors((prevErrors) => ({
                                        ...prevErrors,
                                        selectedValue: '',
                                    }));
                                }
                            }}
                            items={[
                                { label: '0', value: "0" },
                                { label: '1', value: "1" },
                                { label: '2', value: "2" },
                                { label: '3', value: "3" },
                                { label: '4', value: "4" },
                                { label: '5+', value: "5+" },
                            ]}
                            value={selectedValue}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons name="chevron-down" size={22} color={Colors.textMuted} style={{ marginTop: 10 }} />
                            )}
                            placeholder={{ label: 'Select No of Sisters', value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.selectedValue && <Text style={styles.error}>{validationErrors.selectedValue}</Text>}

                        {selectedValue !== null && parseInt(selectedValue) >= 1 && (
                            <>
                                <Text style={styles.labelNew}>Number of Sisters Married</Text>
                                <RNPickerSelect
                                    onValueChange={handleSecondDropdownChange}
                                    items={getSistersMarriedOptions(selectedValue)}
                                    value={selectedSistersMarried}
                                    useNativeAndroidPickerStyle={false}
                                    Icon={() => (
                                        <Ionicons name="chevron-down" size={22} color={Colors.textMuted} style={{ marginTop: 10 }} />
                                    )}
                                    placeholder={{ label: 'Select No of Sisters Married', value: null }}
                                    style={pickerSelectStyles}
                                />
                                {validationErrors.selectedSistersMarried && (
                                    <Text style={styles.error}>{validationErrors.selectedSistersMarried}</Text>
                                )}
                            </>
                        )}

                        <Text style={styles.labelNew}>Number of Brothers</Text>
                        <RNPickerSelect
                            onValueChange={(value) => {
                                setSelectedValueBro(value);
                                if (value !== null) {
                                    setValidationErrors((prevErrors) => ({
                                        ...prevErrors,
                                        SelectedValueBro: '',
                                    }));
                                }
                            }}
                            items={[
                                { label: '0', value: "0" },
                                { label: '1', value: "1" },
                                { label: '2', value: "2" },
                                { label: '3', value: "3" },
                                { label: '4', value: "4" },
                                { label: '5+', value: "5+" },
                            ]}
                            value={SelectedValueBro}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons name="chevron-down" size={22} color={Colors.textMuted} style={{ marginTop: 10 }} />
                            )}
                            placeholder={{ label: 'Select No of Brothers', value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.SelectedValueBro && <Text style={styles.error}>{validationErrors.SelectedValueBro}</Text>}

                        {SelectedValueBro !== null && parseInt(SelectedValueBro) >= 1 && (
                            <>
                                <Text style={styles.labelNew}>Number of Brothers Married</Text>
                                <RNPickerSelect
                                    onValueChange={handleThirdDropdownChange}
                                    items={getBrothersMarriedOptions(SelectedValueBro)}
                                    value={selectedBrothersMarried}
                                    useNativeAndroidPickerStyle={false}
                                    Icon={() => (
                                        <Ionicons name="chevron-down" size={22} color={Colors.textMuted} style={{ marginTop: 10 }} />
                                    )}
                                    placeholder={{ label: 'Select No of Brothers Married', value: null }}
                                    style={pickerSelectStyles}
                                />
                                {validationErrors.selectedBrothersMarried && (
                                    <Text style={styles.error}>{validationErrors.selectedBrothersMarried}</Text>
                                )}
                            </>
                        )}

                        <Text style={styles.labelNew}>Property Details</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Property Details"
                            value={formValues.personal_prope_det}
                            onChangeText={(text) => handleChange('personal_prope_det', text)}
                        />
                        {validationErrors.personal_prope_det && <Text style={styles.error}>{validationErrors.personal_prope_det}</Text>}

                        <Text style={styles.labelNew}>Property Worth</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Property Worth"
                            value={formValues.personal_property_worth}
                            onChangeText={(text) => handleChange('personal_property_worth', text)}
                        />
                        {validationErrors.personal_property_worth && <Text style={styles.error}>{validationErrors.personal_property_worth}</Text>}

                        {['2', '3', '5'].includes(martialStatus) && (
                            <>
                                <Text style={styles.labelNew}>No. of Children</Text>
                                <RNPickerSelect
                                    onValueChange={(value) => setNoOfChildren(value)}
                                    items={[
                                        { label: '0', value: '0' },
                                        { label: '1', value: '1' },
                                        { label: '2', value: '2' },
                                        { label: '3', value: '3' },
                                        { label: '4', value: '4' },
                                        { label: '5', value: '5' },
                                    ]}
                                    value={noOfChildren}
                                    useNativeAndroidPickerStyle={false}
                                    Icon={() => (
                                        <Ionicons name="chevron-down" size={22} color={Colors.textMuted} style={{ marginTop: 10 }} />
                                    )}
                                    placeholder={{ label: 'Select No. of Children', value: null }}
                                    style={pickerSelectStyles}
                                />
                                {validationErrors.noOfChildren && <Text style={styles.error}>{validationErrors.noOfChildren}</Text>}
                            </>
                        )}

                        <Text style={styles.labelNew}>Father Alive</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('father_alive', value)}
                            items={[
                                { label: 'Yes', value: 'yes' },
                                { label: 'No', value: 'no' },
                            ]}
                            value={formValues.father_alive}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons name="chevron-down" size={22} color={Colors.textMuted} style={{ marginTop: 10 }} />
                            )}
                            placeholder={{ label: "Is father alive?", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.father_alive && <Text style={styles.error}>{validationErrors.father_alive}</Text>}

                        <Text style={styles.labelNew}>Mother Alive</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('mother_alive', value)}
                            items={[
                                { label: 'Yes', value: 'yes' },
                                { label: 'No', value: 'no' },
                            ]}
                            value={formValues.mother_alive}
                            useNativeAndroidPickerStyle={false}
                            Icon={() => (
                                <Ionicons name="chevron-down" size={22} color={Colors.textMuted} style={{ marginTop: 10 }} />
                            )}
                            placeholder={{ label: "Is mother alive?", value: null }}
                            style={pickerSelectStyles}
                        />
                        {validationErrors.mother_alive && <Text style={styles.error}>{validationErrors.mother_alive}</Text>}

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
                                        <Text style={styles.login}>{submitting ? 'Saving...' : 'Save'}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.editOptionsInner}>
                        {familyDetails ? (
                            <>
                                {renderRow("About My Family", familyDetails.personal_about_fam)}
                                {renderRow("Father Name", familyDetails.personal_father_name)}
                                {renderRow("Father's Occupation", familyDetails.personal_father_occu_name)}
                                {renderRow("Mother Name", familyDetails.personal_mother_name)}
                                {renderRow("Mother's Occupation", familyDetails.personal_mother_occu_name)}
                                {renderRow("Family Status", familyDetails.personal_fam_sta_name)}
                                {renderRow("Sisters", familyDetails.personal_sis)}
                                {renderRow("Sisters Married", familyDetails.personal_sis_married)}
                                {renderRow("Brothers", familyDetails.personal_bro)}
                                {renderRow("Brothers Married", familyDetails.personal_bro_married)}
                                {renderRow("Property Details", familyDetails.personal_prope_det)}
                                {renderRow("Property Worth", familyDetails.personal_property_worth)}
                                {(martialStatus === "2" || martialStatus === "3" || martialStatus === "5") &&
                                    renderRow("No of Children", familyDetails.personal_no_of_children)}
                                {renderRow("Father Alive", familyDetails.father_alive)}
                                {renderRow("Mother Alive", familyDetails.mother_alive)}
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