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
import { getMyContactDetails, updateProfileContact } from '../../CommonApiCall/CommonApiCall'; // Import the API function
import RNPickerSelect from 'react-native-picker-select';
import config from "../../API/Apiurl";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

export const ContactDetails = () => {

    const [contactDetails, setContactDetails] = useState(null); // State for profile details
    const [isEditMode, setIsEditMode] = useState(false); // Toggle between view and edit mode
    const [validationErrors, setValidationErrors] = useState({});
    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [selectedStateId, setSelectedStateId] = useState(null);
    const [selectedCityId, setSelectedCityId] = useState(null);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities] = useState([]);
    const [isFetched, setIsFetched] = useState(false);
    const [isCityDropdown, setIsCityDropdown] = useState(true); // Tracks if city is dropdown or textbox
    const [customCity, setCustomCity] = useState("");

    const fetchCountryList = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Country/`);
            const countryData = response.data;

            // Assuming countryData is an object with country_id as keys
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
        fetchCountryList(); // Call function to fetch country list
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
        // Ensure the contactDetails and state ID are available before proceeding
        if (!contactDetails?.personal_prof_stat_id && !selectedStateId) return;

        const stateIdToUse = selectedStateId || contactDetails?.personal_prof_stat_id;

        const fetchDistrict = async () => {
            try {
                const response = await axios.post(
                    `${config.apiUrl}/auth/Get_District/`,
                    {
                        state_id: stateIdToUse.toString(), // Use the fallback state ID
                    }
                );

                const districtdata = response.data;

                // Convert the object to an array of formatted districts
                const formattedDistrictList = Object.keys(districtdata).map((key) => ({
                    label: districtdata[key].disctict_name,
                    value: districtdata[key].disctict_id.toString(),
                }));

                setDistricts(formattedDistrictList); // Update the districts state
            } catch (error) {
                console.error("Error fetching districts:", error);
            }
        };

        fetchDistrict();
    }, [selectedStateId, contactDetails?.personal_prof_stat_id]); // Watch both selectedStateId and contactDetails changes




    useEffect(() => {
        // Use selectedCityId or fallback to contactDetails.personal_prof_district_id
        const districtIdToUse = selectedCityId || contactDetails?.personal_prof_district_id;

        if (!districtIdToUse && !contactDetails?.personal_prof_district_id) return; // Exit if no valid district ID or contactDetails property

        const fetchCity = async () => {
            try {
                const response = await axios.post(
                    `${config.apiUrl}/auth/Get_City/`,
                    {
                        district_id: districtIdToUse.toString(), // Use the fallback district ID
                    }
                );

                const cityData = response.data;

                // Convert the object to an array of formatted cities
                const formattedCityList = Object.keys(cityData).map((key) => ({
                    label: cityData[key].city_name,
                    value: cityData[key].city_id.toString(),
                }));

                setCities(formattedCityList); // Update the cities state
            } catch (error) {
                console.error("Error fetching city:", error);
            }
        };

        fetchCity();
    }, [selectedCityId, contactDetails?.personal_prof_district_id]); // Watch both selectedCityId and contactDetails changes





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

    // Function to fetch profile data
    const fetchProfileData = async () => {
        try {
            const data = await getMyContactDetails();
            setContactDetails(data.data); // Set the data in the state
        } catch (error) {
            console.error('Failed to load profile data', error);
        }
    };

    useEffect(() => {
        fetchProfileData(); // Call the function when component mounts
    }, []);


    useEffect(() => {
        // Update form values when contactDetails is fetched
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
            setIsFetched(true);  // Mark as fetched to prevent further updates

            if (contactDetails.personal_prof_count_id) {
                fetchStateList(contactDetails.personal_prof_count_id);
            }
            if (contactDetails.personal_prof_stat_id) {
                // This will trigger the district-fetching useEffect
                setSelectedStateId(contactDetails.personal_prof_stat_id);
            }
            if (contactDetails.personal_prof_district_id) {
                // This will trigger the city-fetching useEffect
                setSelectedCityId(contactDetails.personal_prof_district_id);
            }
        }
    }, [contactDetails, isFetched]);

    useEffect(() => {
        // Only run after initial data is fetched AND city list is populated
        if (isFetched && cities.length > 0 && contactDetails) {

            // If an ID is already set (and not 'others'), we trust it.
            if (formValues.personal_prof_city_id && formValues.personal_prof_city_id !== 'others') {
                const idExists = cities.some(c => c.value === formValues.personal_prof_city_id);
                if (idExists) {
                    setIsCityDropdown(true);
                    return; // ID is valid, nothing more to do
                }
            }

            // If no valid ID, try to match by NAME
            const targetCityName = contactDetails.personal_prof_city_name;

            if (targetCityName) {
                const matchedCity = cities.find(
                    city => city.label.toLowerCase() === targetCityName.toLowerCase()
                );

                if (matchedCity) {
                    // Match found! Set the dropdown ID and name.
                    setFormValues(prev => ({
                        ...prev,
                        personal_prof_city_id: matchedCity.value,
                        personal_prof_city_name: matchedCity.label,
                    }));
                    setIsCityDropdown(true);
                    setCustomCity("");
                } else {
                    // No match found. Set to "Others" and show textbox.
                    setFormValues(prev => ({
                        ...prev,
                        personal_prof_city_id: "others", // Use 'others' to track
                        personal_prof_city_name: targetCityName,
                    }));
                    setIsCityDropdown(false);
                    setCustomCity(targetCityName);
                }
            }
        }
    }, [cities, isFetched, contactDetails]); // Dependencies



    // const handleChange = (field, value) => {
    //     setFormValues((prevValues) => ({
    //         ...prevValues,
    //         [field]: value,
    //     }));

    //     if (field === 'personal_prof_count_id') {
    //         fetchStateList(value); // Fetch states based on selected country
    //     }
    //     if (field === 'personal_prof_stat_id') {
    //         setSelectedStateId(value); // Update the state ID
    //     }

    //     if (field === 'personal_prof_district_id') {
    //         setSelectedCityId(value); // Update the state ID
    //     }
    //     // Clear the error message for the field
    //     setValidationErrors((prevErrors) => ({
    //         ...prevErrors,
    //         [field]: '',
    //     }));
    // };


    // --- ADD THIS NEW HANDLER ---
    const handleCustomCityInput = (text) => {
        setCustomCity(text);
        setFormValues(prev => ({
            ...prev,
            personal_prof_city_name: text // Update the name
        }));
    };

    // --- REPLACE your existing handleChange with this ---
    const handleChange = (field, value) => {

        // Special handling for country
        if (field === 'personal_prof_count_id') {
            fetchStateList(value); // Fetch new states
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

            // Special handling for state
        } else if (field === 'personal_prof_stat_id') {
            setSelectedStateId(value); // Trigger district fetch
            setFormValues(prev => ({
                ...prev,
                personal_prof_stat_id: value,
                personal_prof_district_id: null,
                personal_prof_city_id: null,
                personal_prof_city_name: '',
            }));
            setDistricts([]);
            setCities([]);

            // Special handling for district
        } else if (field === 'personal_prof_district_id') {
            setSelectedCityId(value); // Trigger city fetch
            setFormValues(prev => ({
                ...prev,
                personal_prof_district_id: value,
                personal_prof_city_id: null,
                personal_prof_city_name: '',
            }));
            setCities([]);

            // Special handling for city dropdown
        } else if (field === 'personal_prof_city_id') {
            if (value === 'others') {
                setIsCityDropdown(false); // Show text input
                setCustomCity('');       // Clear old custom value
                setFormValues(prev => ({
                    ...prev,
                    personal_prof_city_id: 'others',
                    personal_prof_city_name: '', // Clear name
                }));
            } else {
                const selectedCity = cities.find(city => city.value === value);
                setIsCityDropdown(true); // Ensure dropdown is showing
                setFormValues(prev => ({
                    ...prev,
                    personal_prof_city_id: value,
                    personal_prof_city_name: selectedCity ? selectedCity.label : '',
                }));
            }

            // Special handling for city *text input* (non-India)
        } else if (field === 'personal_prof_city_name') {
            setFormValues(prev => ({
                ...prev,
                personal_prof_city_name: value, // Set name
                personal_prof_city_id: null,    // Clear ID
            }));

            // Default handler for all other fields
        } else {
            setFormValues((prevValues) => ({
                ...prevValues,
                [field]: value,
            }));
        }

        // Clear validation error
        setValidationErrors((prevErrors) => ({
            ...prevErrors,
            [field]: '',
        }));
    };



    const validateForm = () => {
        const errors = {};

        // // Helper function for 10-digit check
        const isTenDigits = (value) => /^\d{10}$/.test(value);
        const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

        // if (!formValues.personal_prof_addr) errors.personal_prof_addr = 'Professional Address is required';
        // if (!formValues.personal_prof_city) errors.personal_prof_city = 'Professional City is required';
        // if (!formValues.personal_prof_pin) errors.personal_prof_pin = 'Professional Pin Code is required';

        // // Phone validation
        // if (!formValues.personal_prof_phone) {
        //     errors.personal_prof_phone = 'Professional Phone Number is required';
        // } else if (!isTenDigits(formValues.personal_prof_phone)) {
        //     errors.personal_prof_phone = 'Phone Number must be 10 digits';
        // }

        // // Mobile validation
        // if (!formValues.personal_prof_mob_no) {
        //     errors.personal_prof_mob_no = 'Mobile Number is required';
        // } else if (!isTenDigits(formValues.personal_prof_mob_no)) {
        //     errors.personal_prof_mob_no = 'Mobile Number must be 10 digits';
        // }

        // // WhatsApp validation
        // if (!formValues.personal_prof_whats) {
        //     errors.personal_prof_whats = 'WhatsApp Number is required';
        // } else if (!isTenDigits(formValues.personal_prof_whats)) {
        //     errors.personal_prof_whats = 'WhatsApp Number must be 10 digits';
        // }
        if (formValues.personal_prof_mob_no && !isTenDigits(formValues.personal_prof_mob_no)) {
            errors.personal_prof_mob_no = 'Please enter at least 10 digits for Mobile Number';
        }
        if (formValues.personal_prof_whats && !isTenDigits(formValues.personal_prof_whats)) {
            errors.personal_prof_whats = 'Please enter at least 10 digits for Whatsapp Number';
        }
        if (formValues.personal_prof_phone && !isTenDigits(formValues.personal_prof_phone)) {
            errors.personal_prof_phone = 'Please enter at least 10 digits for Alternate Mobile Number';
        }

        // if (!formValues.personal_email) errors.personal_email = 'Email is required';
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
        // // Conditional validations based on country ID
        // if (formValues.personal_prof_count_id === "1") {
        //     if (!formValues.personal_prof_stat_id) errors.personal_prof_stat_id = 'State is required';
        //     if (!formValues.personal_prof_district_id) errors.personal_prof_district_id = 'District is required';
        //     if (!formValues.personal_prof_city_id) errors.personal_prof_city_id = 'City is required';
        // } else {
        //     if (!formValues.personal_prof_stat_name) errors.personal_prof_stat_name = 'State Name is required';
        //     if (!formValues.personal_prof_district_name) errors.personal_prof_district_name = 'District Name is required';
        //     if (!formValues.personal_prof_city_name) errors.personal_prof_city_name = 'City Name is required';
        // }

        if (!formValues.personal_prof_count_id) errors.personal_prof_count_id = 'Country is required';

        setValidationErrors(errors);

        return Object.keys(errors).length === 0;
    };


    const handleSave = async () => {
        console.log('Form Values:', formValues); // Log the form values before validation
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
                console.log(profileData);

                const response = await updateProfileContact(profileData);
                console.log('Profile updated successfully:', response);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Contact Details updated successfully' || response.message,
                });
                setIsEditMode(false); // Exit edit mode on success
                fetchProfileData();  // Refresh profile data
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
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 15 }}>Contact Details</Text>
                <TouchableWithoutFeedback onPress={() => setIsEditMode(!isEditMode)}>
                    <Text style={styles.redText}>{isEditMode ? 'View' : 'Edit'}</Text>
                </TouchableWithoutFeedback>
                {isEditMode ? (
                    <View style={styles.editOptions}>
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

                        {/* Address Field */}
                        {/* <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Address</Text>
                            <TextInput
                                style={[styles.input, validationErrors.personal_prof_addr ? styles.errorInput : null]}
                                placeholder="Enter Address"
                                value={formValues.personal_prof_addr}
                                onChangeText={(text) => handleChange('personal_prof_addr', text)}
                                multiline={true}
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                            {validationErrors.personal_prof_addr && (
                                <Text style={styles.error}>{validationErrors.personal_prof_addr}</Text>
                            )}
                        </View> */}

                        {/* Country Selector */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>Country</Text>
                            <RNPickerSelect
                                onValueChange={(value) => handleChange('personal_prof_count_id', value)}
                                items={countryList}
                                value={formValues.personal_prof_count_id}
                                useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                Icon={() => (
                                    <Ionicons
                                        name="chevron-down" // Name of the icon
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
                        </View>

                        {/* State Selector or Input */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>State</Text>
                            {formValues.personal_prof_count_id === "1" ? (
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_prof_stat_id', value)}
                                    items={stateList}
                                    value={formValues.personal_prof_stat_id}
                                    useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down" // Name of the icon
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
                        </View>

                        {/* District Selector or Input */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>District</Text>
                            {formValues.personal_prof_count_id === "1" ? (
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_prof_district_id', value)}
                                    items={districts}
                                    value={formValues.personal_prof_district_id}
                                    useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down" // Name of the icon
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
                        </View>

                        {/* City Selector or Input */}
                        <View style={styles.formGroup}>
                            <Text style={styles.labelNew}>City</Text>
                            {formValues.personal_prof_count_id === "1" ? (
                                <RNPickerSelect
                                    onValueChange={(value) => handleChange('personal_prof_city_id', value)}
                                    items={cities}
                                    value={formValues.personal_prof_city_id}
                                    useNativeAndroidPickerStyle={false} // Important for custom styles on Android
                                    Icon={() => (
                                        <Ionicons
                                            name="chevron-down" // Name of the icon
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
                        </View>

                        {/* Phone Field */}
                        <View style={styles.formGroup}>
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
                        </View>

                        {/* WhatsApp Field */}
                        <View style={styles.formGroup}>
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
                        </View>

                        {/* Email Field */}
                        <View style={styles.formGroup}>
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
                        </View>

                        <View style={styles.formGroup}>
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
                        </View>

                        {/* Mobile Field */}
                        <View style={styles.formGroup}>
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
                        </View>

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
        height: 50,
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
        fontSize: 16,
        alignSelf: 'center',  // This helps center the input
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