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
import { getMyContactDetails, updateProfileContact } from '../../CommonApiCall/CommonApiCall';
import RNPickerSelect from 'react-native-picker-select';
import config from "../../API/Apiurl";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

export const ContactDetails = () => {

    const [contactDetails, setContactDetails] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [selectedStateId, setSelectedStateId] = useState(null);
    const [selectedCityId, setSelectedCityId] = useState(null);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities] = useState([]);
    const [isFetched, setIsFetched] = useState(false);
    const [isCityDropdown, setIsCityDropdown] = useState(true);
    const [customCity, setCustomCity] = useState("");

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
        fetchStateList();
    }, []);

    const fetchStateList = async (countryId = 1) => {
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
        if (!contactDetails?.personal_prof_stat_id && !selectedStateId) return;

        const stateIdToUse = selectedStateId || contactDetails?.personal_prof_stat_id;

        const fetchDistrict = async () => {
            try {
                const response = await axios.post(
                    `${config.apiUrl}/auth/Get_District/`,
                    {
                        state_id: stateIdToUse.toString(),
                    }
                );

                const districtdata = response.data;

                const formattedDistrictList = Object.keys(districtdata).map((key) => ({
                    label: districtdata[key].disctict_name,
                    value: districtdata[key].disctict_id.toString(),
                }));

                setDistricts(formattedDistrictList);
            } catch (error) {
                console.error("Error fetching districts:", error);
            }
        };

        fetchDistrict();
    }, [selectedStateId, contactDetails?.personal_prof_stat_id]);

    useEffect(() => {
        const districtIdToUse = selectedCityId || contactDetails?.personal_prof_district_id;

        if (!districtIdToUse && !contactDetails?.personal_prof_district_id) return;

        const fetchCity = async () => {
            try {
                const response = await axios.post(
                    `${config.apiUrl}/auth/Get_City/`,
                    {
                        district_id: districtIdToUse.toString(),
                    }
                );

                const cityData = response.data;

                const formattedCityList = Object.keys(cityData).map((key) => ({
                    label: cityData[key].city_name,
                    value: cityData[key].city_id.toString(),
                }));

                setCities(formattedCityList);
            } catch (error) {
                console.error("Error fetching city:", error);
            }
        };

        fetchCity();
    }, [selectedCityId, contactDetails?.personal_prof_district_id]);

    const [formValues, setFormValues] = useState({
        personal_prof_addr: '',
        personal_prof_city: '',
        personal_prof_stat_name: '',
        personal_prof_count_name: '',
        personal_prof_district_name: '',
        personal_prof_city_name: '',
        personal_prof_pin: '',
        personal_prof_phone: '',
        personal_prof_mob_no: '',
        personal_prof_whats: '',
        personal_email: '',
        admin_use_email: '',
        personal_prof_stat_id: null,
        personal_prof_count_id: null,
        personal_prof_district_id: null,
        personal_prof_city_id: null,
    });

    const fetchProfileData = async () => {
        try {
            const data = await getMyContactDetails();
            setContactDetails(data.data);
        } catch (error) {
            console.error('Failed to load profile data', error);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    useEffect(() => {
        if (contactDetails && !isFetched) {
            setFormValues({
                personal_prof_addr: contactDetails.personal_prof_addr || '',
                personal_prof_city: contactDetails.personal_prof_city || '',
                personal_prof_stat_name: contactDetails.personal_prof_stat_name || '',
                personal_prof_count_name: contactDetails.personal_prof_count_name || '',
                personal_prof_district_name: contactDetails.personal_prof_district_name || '',
                personal_prof_city_name: contactDetails.personal_prof_city_name || '',
                personal_prof_pin: contactDetails.personal_prof_pin || '',
                personal_prof_phone: contactDetails.personal_prof_phone || '',
                personal_prof_mob_no: contactDetails.personal_prof_mob_no || '',
                personal_prof_whats: contactDetails.personal_prof_whats || '',
                admin_use_email: contactDetails.admin_use_email || '',
                personal_email: contactDetails.personal_email || '',
                personal_prof_stat_id: contactDetails.personal_prof_stat_id || null,
                personal_prof_count_id: contactDetails.personal_prof_count_id || null,
                personal_prof_district_id: contactDetails.personal_prof_district_id || null,
                personal_prof_city_id: contactDetails.personal_prof_city_id || null,
            });
            setIsFetched(true);

            if (contactDetails.personal_prof_count_id) {
                fetchStateList(contactDetails.personal_prof_count_id);
            }
            if (contactDetails.personal_prof_stat_id) {
                setSelectedStateId(contactDetails.personal_prof_stat_id);
            }
            if (contactDetails.personal_prof_district_id) {
                setSelectedCityId(contactDetails.personal_prof_district_id);
            }
        }
    }, [contactDetails, isFetched]);

    useEffect(() => {
        if (isFetched && cities.length > 0 && contactDetails) {
            if (formValues.personal_prof_city_id && formValues.personal_prof_city_id !== 'others') {
                const idExists = cities.some(c => c.value === formValues.personal_prof_city_id);
                if (idExists) {
                    setIsCityDropdown(true);
                    return;
                }
            }

            const targetCityName = contactDetails.personal_prof_city_name;

            if (targetCityName) {
                const matchedCity = cities.find(
                    city => city.label.toLowerCase() === targetCityName.toLowerCase()
                );

                if (matchedCity) {
                    setFormValues(prev => ({
                        ...prev,
                        personal_prof_city_id: matchedCity.value,
                        personal_prof_city_name: matchedCity.label,
                    }));
                    setIsCityDropdown(true);
                    setCustomCity("");
                } else {
                    setFormValues(prev => ({
                        ...prev,
                        personal_prof_city_id: "others",
                        personal_prof_city_name: targetCityName,
                    }));
                    setIsCityDropdown(false);
                    setCustomCity(targetCityName);
                }
            }
        }
    }, [cities, isFetched, contactDetails]);

    const handleCustomCityInput = (text) => {
        setCustomCity(text);
        setFormValues(prev => ({
            ...prev,
            personal_prof_city_name: text
        }));
    };

    const handleChange = (field, value) => {
        if (field === 'personal_prof_count_id') {
            fetchStateList(value);
            setFormValues(prev => ({
                ...prev,
                personal_prof_count_id: value,
                personal_prof_stat_id: null,
                personal_prof_district_id: null,
                personal_prof_city_id: null,
                personal_prof_city_name: '',
                personal_prof_stat_name: '',
                personal_prof_district_name: '',
            }));
            setStateList([]);
            setDistricts([]);
            setCities([]);

        } else if (field === 'personal_prof_stat_id') {
            setSelectedStateId(value);
            setFormValues(prev => ({
                ...prev,
                personal_prof_stat_id: value,
                personal_prof_district_id: null,
                personal_prof_city_id: null,
                personal_prof_city_name: '',
            }));
            setDistricts([]);
            setCities([]);

        } else if (field === 'personal_prof_district_id') {
            setSelectedCityId(value);
            setFormValues(prev => ({
                ...prev,
                personal_prof_district_id: value,
                personal_prof_city_id: null,
                personal_prof_city_name: '',
            }));
            setCities([]);

        } else if (field === 'personal_prof_city_id') {
            if (value === 'others') {
                setIsCityDropdown(false);
                setCustomCity('');
                setFormValues(prev => ({
                    ...prev,
                    personal_prof_city_id: 'others',
                    personal_prof_city_name: '',
                }));
            } else {
                const selectedCity = cities.find(city => city.value === value);
                setIsCityDropdown(true);
                setFormValues(prev => ({
                    ...prev,
                    personal_prof_city_id: value,
                    personal_prof_city_name: selectedCity ? selectedCity.label : '',
                }));
            }

        } else if (field === 'personal_prof_city_name') {
            setFormValues(prev => ({
                ...prev,
                personal_prof_city_name: value,
                personal_prof_city_id: null,
            }));

        } else {
            setFormValues((prevValues) => ({
                ...prevValues,
                [field]: value,
            }));
        }

        setValidationErrors((prevErrors) => ({
            ...prevErrors,
            [field]: '',
        }));
    };

    const validateForm = () => {
        const errors = {};

        const isTenDigits = (value) => /^\d{10}$/.test(value);
        const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

        if (formValues.personal_prof_mob_no && !isTenDigits(formValues.personal_prof_mob_no)) {
            errors.personal_prof_mob_no = 'Please enter at least 10 digits for Mobile Number';
        }
        if (formValues.personal_prof_whats && !isTenDigits(formValues.personal_prof_whats)) {
            errors.personal_prof_whats = 'Please enter at least 10 digits for Whatsapp Number';
        }
        if (formValues.personal_prof_phone && !isTenDigits(formValues.personal_prof_phone)) {
            errors.personal_prof_phone = 'Please enter at least 10 digits for Alternate Mobile Number';
        }

        if (!formValues.personal_email) {
            errors.personal_email = 'Email is required';
        } else if (
            !isValidEmail(formValues.personal_email) ||
            !formValues.personal_email.includes('.com')
        ) {
            errors.personal_email = 'Please enter a valid Email';
        }

        if (formValues.admin_use_email) {
            if (
                !isValidEmail(formValues.admin_use_email) ||
                !formValues.admin_use_email.includes('.com')
            ) {
                errors.admin_use_email = 'Please enter a valid Profile Email';
            }
        }

        if (!formValues.personal_prof_count_id) errors.personal_prof_count_id = 'Country is required';

        setValidationErrors(errors);

        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (validateForm()) {
            const profileData = {
                Profile_address: formValues.personal_prof_addr,
                Profile_city: formValues.personal_prof_city_name,
                Profile_district: formValues.personal_prof_district_id,
                Profile_state: formValues.personal_prof_stat_id,
                Profile_country: formValues.personal_prof_count_id,
                Profile_pincode: formValues.personal_prof_pin,
                Profile_alternate_mobile: formValues.personal_prof_phone,
                Profile_mobile_no: formValues.personal_prof_mob_no,
                Profile_whatsapp: formValues.personal_prof_whats,
                EmailId: formValues.personal_email,
                Profile_emailid: formValues.admin_use_email,
            };

            try {
                const response = await updateProfileContact(profileData);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Contact Details updated successfully' || response.message,
                });
                setIsEditMode(false);
                fetchProfileData();
            } catch (error) {
                console.error('Failed to update profile:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to update contact details. Please try again.',
                });
            }
        }
    };

    return (
        <View style={styles.menuChanges}>
            <View style={styles.editOptions}>
                {/* Unified Section Header */}
                <View style={styles.sectionHeaderRow}>
                    <MaterialIcons name="phone" size={20} color="#BD1225" style={{ marginRight: 8 }} />
                    <Text style={styles.sectionHeaderTitle}>Contact Details</Text>
                </View>
                <View style={styles.sectionDivider} />

                {/* Edit / View Link */}
                <TouchableWithoutFeedback onPress={() => setIsEditMode(!isEditMode)}>
                    <Text style={styles.redText}>{isEditMode ? 'View' : 'Edit'}</Text>
                </TouchableWithoutFeedback>

                {isEditMode ? (
                    <View style={styles.editOptionsInner}>
                        {/* Address */}
                        <Text style={styles.labelNew}>Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Address"
                            value={formValues.personal_prof_addr}
                            onChangeText={(text) => handleChange('personal_prof_addr', text)}
                            multiline={true}
                            numberOfLines={4}
                        />
                        {validationErrors.personal_prof_addr && <Text style={styles.error}>{validationErrors.personal_prof_addr}</Text>}

                        {/* Country Selector */}
                        <Text style={styles.labelNew}>Country</Text>
                        <RNPickerSelect
                            onValueChange={(value) => handleChange('personal_prof_count_id', value)}
                            items={countryList}
                            value={formValues.personal_prof_count_id}
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
                        {validationErrors.personal_prof_count_id && (
                            <Text style={styles.error}>{validationErrors.personal_prof_count_id}</Text>
                        )}

                        {/* State Selector or Input */}
                        <Text style={styles.labelNew}>State</Text>
                        {formValues.personal_prof_count_id === "1" ? (
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_prof_stat_id', value)}
                                items={stateList}
                                value={formValues.personal_prof_stat_id}
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
                        ) : (
                            <TextInput
                                style={styles.input}
                                value={formValues.personal_prof_stat_name}
                                onChangeText={(value) => handleChange('personal_prof_stat_name', value)}
                                placeholder="Enter State"
                            />
                        )}
                        {formValues.personal_prof_count_id === "1" ? (
                            validationErrors.personal_prof_stat_id && (
                                <Text style={styles.error}>{validationErrors.personal_prof_stat_id}</Text>
                            )
                        ) : (
                            validationErrors.personal_prof_stat_name && (
                                <Text style={styles.error}>{validationErrors.personal_prof_stat_name}</Text>
                            )
                        )}

                        {/* District Selector or Input */}
                        <Text style={styles.labelNew}>District</Text>
                        {formValues.personal_prof_count_id === "1" ? (
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_prof_district_id', value)}
                                items={districts}
                                value={formValues.personal_prof_district_id}
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
                                value={formValues.personal_prof_district_name}
                                onChangeText={(value) => handleChange('personal_prof_district_name', value)}
                                placeholder="Enter District"
                            />
                        )}
                        {formValues.personal_prof_count_id === "1" ? (
                            validationErrors.personal_prof_district_id && (
                                <Text style={styles.error}>{validationErrors.personal_prof_district_id}</Text>
                            )
                        ) : (
                            validationErrors.personal_prof_district_name && (
                                <Text style={styles.error}>{validationErrors.personal_prof_district_name}</Text>
                            )
                        )}

                        {/* City Selector or Input */}
                        <Text style={styles.labelNew}>City</Text>
                        {formValues.personal_prof_count_id === "1" ? (
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_prof_city_id', value)}
                                items={cities}
                                value={formValues.personal_prof_city_id}
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
                                value={formValues.personal_prof_city_name}
                                onChangeText={(value) => handleChange('personal_prof_city_name', value)}
                                placeholder="Enter City"
                            />
                        )}
                        {formValues.personal_prof_count_id === "1" ? (
                            validationErrors.personal_prof_city_id && (
                                <Text style={styles.error}>{validationErrors.personal_prof_city_id}</Text>
                            )
                        ) : (
                            validationErrors.personal_prof_city_name && (
                                <Text style={styles.error}>{validationErrors.personal_prof_city_name}</Text>
                            )
                        )}

                        {/* Alternate Mobile */}
                        <Text style={styles.labelNew}>Alternate Mobile</Text>
                        <TextInput
                            style={[styles.input, validationErrors.personal_prof_phone && styles.inputError]}
                            placeholder="Alternate Mobile"
                            keyboardType="numeric"
                            value={formValues.personal_prof_phone}
                            onChangeText={(text) => handleChange('personal_prof_phone', text)}
                        />
                        {validationErrors.personal_prof_phone && (
                            <Text style={styles.error}>{validationErrors.personal_prof_phone}</Text>
                        )}

                        {/* WhatsApp */}
                        <Text style={styles.labelNew}>WhatsApp</Text>
                        <TextInput
                            style={[styles.input, validationErrors.personal_prof_whats && styles.inputError]}
                            placeholder="WhatsApp"
                            keyboardType="numeric"
                            value={formValues.personal_prof_whats}
                            onChangeText={(text) => handleChange('personal_prof_whats', text)}
                        />
                        {validationErrors.personal_prof_whats && (
                            <Text style={styles.error}>{validationErrors.personal_prof_whats}</Text>
                        )}

                        {/* Email */}
                        <Text style={styles.labelNew}>Email</Text>
                        <TextInput
                            style={[styles.input, validationErrors.personal_email && styles.inputError]}
                            placeholder="Email"
                            value={formValues.personal_email}
                            onChangeText={(text) => handleChange('personal_email', text)}
                        />
                        {validationErrors.personal_email && (
                            <Text style={styles.error}>{validationErrors.personal_email}</Text>
                        )}

                        {/* Profile Email ID */}
                        <Text style={styles.labelNew}>Profile Email ID</Text>
                        <TextInput
                            style={[styles.input, validationErrors.admin_use_email && styles.inputError]}
                            placeholder="Email"
                            value={formValues.admin_use_email}
                            onChangeText={(text) => handleChange('admin_use_email', text)}
                        />
                        {validationErrors.admin_use_email && (
                            <Text style={styles.error}>{validationErrors.admin_use_email}</Text>
                        )}

                        {/* Profile Mobile No */}
                        <Text style={styles.labelNew}>Profile Mobile No</Text>
                        <TextInput
                            style={[styles.input, validationErrors.personal_prof_mob_no && styles.inputError]}
                            placeholder="Mobile"
                            keyboardType="numeric"
                            value={formValues.personal_prof_mob_no}
                            onChangeText={(text) => handleChange('personal_prof_mob_no', text)}
                        />
                        {validationErrors.personal_prof_mob_no && (
                            <Text style={styles.error}>{validationErrors.personal_prof_mob_no}</Text>
                        )}

                        {/* Save Button */}
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
                        {contactDetails && (
                            <>
                                <Text style={styles.labelNew}>Address : <Text style={styles.valueNew}>{contactDetails.personal_prof_addr || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Country : <Text style={styles.valueNew}>{contactDetails.personal_prof_count_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>State : <Text style={styles.valueNew}>{contactDetails.personal_prof_stat_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>District : <Text style={styles.valueNew}>{contactDetails.personal_prof_district_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>City : <Text style={styles.valueNew}>{contactDetails.personal_prof_city_name || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Pincode : <Text style={styles.valueNew}>{contactDetails.personal_prof_pin || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Alternate Mobile : <Text style={styles.valueNew}>{contactDetails.personal_prof_phone || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>WhatsApp : <Text style={styles.valueNew}>{contactDetails.personal_prof_whats || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Email : <Text style={styles.valueNew}>{contactDetails.personal_email || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Profile Email ID : <Text style={styles.valueNew}>{contactDetails.admin_use_email || "N/A"}</Text></Text>
                                <Text style={styles.labelNew}>Profile Mobile No : <Text style={styles.valueNew}>{contactDetails.personal_prof_mob_no || "N/A"}</Text></Text>
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
        width: 370,
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
    inputError: {
        borderColor: 'red',
    },
    error: {
        color: 'red',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
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