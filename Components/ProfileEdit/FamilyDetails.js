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

    return (
        <View style={styles.menuChanges}>
            <View style={styles.editOptions}>
                <View style={styles.sectionHeaderRow}>
                    <FontAwesome5 name="users" size={20} color="#BD1225" style={{ marginRight: 8 }} />
                    <Text style={styles.sectionHeaderTitle}>Family Details</Text>
                </View>
                <View style={styles.sectionDivider} />

                <TouchableWithoutFeedback onPress={() => setIsEditMode(!isEditMode)}>
                    <Text style={styles.redText}>{isEditMode ? 'View' : 'Edit'}</Text>
                </TouchableWithoutFeedback>

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
                                <Ionicons
                                    name="chevron-down"
                                    size={24}
                                    color="gray"
                                    style={{ marginTop: 10 }}
                                />
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
                                <Ionicons
                                    name="chevron-down"
                                    size={24}
                                    color="gray"
                                    style={{ marginTop: 10 }}
                                />
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
                                        <Ionicons
                                            name="chevron-down"
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
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
                                <Ionicons
                                    name="chevron-down"
                                    size={24}
                                    color="gray"
                                    style={{ marginTop: 10 }}
                                />
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
                                        <Ionicons
                                            name="chevron-down"
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
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
                                        <Ionicons
                                            name="chevron-down"
                                            size={24}
                                            color="gray"
                                            style={{ marginTop: 10 }}
                                        />
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
                                <Ionicons
                                    name="chevron-down"
                                    size={24}
                                    color="gray"
                                    style={{ marginTop: 10 }}
                                />
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
                                <Ionicons
                                    name="chevron-down"
                                    size={24}
                                    color="gray"
                                    style={{ marginTop: 10 }}
                                />
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
                                    colors={["#BD1225", "#FF4050"]}
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
                        {familyDetails && (
                            <>
                                <Text style={styles.labelNew}>About My Family : <Text style={styles.valueNew}>{familyDetails.personal_about_fam || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Father Name : <Text style={styles.valueNew}>{familyDetails.personal_father_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Father's Occupation : <Text style={styles.valueNew}>{familyDetails.personal_father_occu_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Mother Name : <Text style={styles.valueNew}>{familyDetails.personal_mother_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Mother's Occupation : <Text style={styles.valueNew}>{familyDetails.personal_mother_occu_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Family Status : <Text style={styles.valueNew}>{familyDetails.personal_fam_sta_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Sisters : <Text style={styles.valueNew}>{familyDetails.personal_sis || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Sisters Married : <Text style={styles.valueNew}>{familyDetails.personal_sis_married || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Brothers : <Text style={styles.valueNew}>{familyDetails.personal_bro || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Brothers Married : <Text style={styles.valueNew}>{familyDetails.personal_bro_married || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Property Details : <Text style={styles.valueNew}>{familyDetails.personal_prope_det || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Property Worth : <Text style={styles.valueNew}>{familyDetails.personal_property_worth || "N/A"}</Text></Text>
                                {(martialStatus === "2" || martialStatus === "3" || martialStatus === "5") && (
                                    <Text style={styles.labelNew}>
                                        No of Children : <Text style={styles.valueNew}>{familyDetails.personal_no_of_children}</Text>
                                    </Text>
                                )}
                                <Text style={styles.labelNew}>Father Alive : <Text style={styles.valueNew}>{familyDetails.father_alive || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Mother Alive : <Text style={styles.valueNew}>{familyDetails.mother_alive || "N/A"}</Text></Text>
                            </>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

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
        marginRight: 5,
    },
    formContainer1: {
        width: "100%",
        paddingHorizontal: 0,
        marginTop: 20,
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