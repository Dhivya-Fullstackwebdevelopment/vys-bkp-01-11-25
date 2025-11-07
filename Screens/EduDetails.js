import React, { useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios"; // Import axios
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";
import CountryPicker from 'react-native-country-picker-modal';




// const professionOptions = [
//     { label: "Employed", value: "Employed" },
//     { label: "Business", value: "Business" },
//     { label: "Student", value: "Student" },
//     { label: "Not Working", value: "Not Working" },
//     { label: "No Mention", value: "No Mention" },
// ];

export const EduDetails = () => {
    const navigation = useNavigation();
    const [selectedDegrees, setSelectedDegrees] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    // // Handler for updating selected degrees
    // const handleDegreeChange = (item) => {
    //     setSelectedDegrees((prevSelected) => {
    //         // Check if the item is already selected
    //         const isAlreadySelected = prevSelected.some((degree) => degree.value === item.value);

    //         if (isAlreadySelected) {
    //             // If already selected, remove it (toggle selection)
    //             return prevSelected.filter((degree) => degree.value !== item.value);
    //         } else {
    //             // If not selected, add it to the array
    //             return [...prevSelected, item];
    //         }
    //     });

    //     handleChange("degreeval", selectedDegrees); // Optional: Call parent function
    // };

    // Replace your handleDegreeChange function with this:
    const handleDegreeChange = (item) => {
        setSelectedDegrees((prevSelected) => {
            // Check if the item is already selected
            const isAlreadySelected = prevSelected.some((degree) => degree.value === item.value);

            let newSelection;
            if (isAlreadySelected) {
                // If already selected, remove it (toggle selection)
                newSelection = prevSelected.filter((degree) => degree.value !== item.value);
            } else {
                // If not selected, add it to the array
                newSelection = [...prevSelected, item];
            }

            // Check if "Other" (value 86) is in the new selection
            const hasOther = newSelection.some((degree) => degree.value === 86 || degree.value === '86');
            setIsOtherSelected(hasOther);

            return newSelection;
        });
    };

    // // Handler for updating selected degrees
    // const handleDegreeChange = (values) => {
    //     // 'values' is the new, complete array of selected values, e.g., ['1', '2', 'other']
    //     setSelectedDegrees(values);
    // };

    const [formData, setFormData] = useState({
        edValue: "",
        deValue: "",
        educationDetail: "",
        aboutEducation: "",
        boxValue: "",
        inValue: "",
        actualIncome: "",
        cValue: "",
        sValue: "",
        ciValue: "",
        pincode: "",
        careerNotes: "",
        workPlace: "",
        district: "",
        fieldofvalue: "",
        degreeval: ""
    });

    const [errors, setErrors] = useState({});
    const [highestEduOption, setHighestEduOptions] = useState([]);
    const [ugDegreeOption, setUgDegreeOptions] = useState([]);
    const [professionOptions, setProfessionalPreferences] = useState([]);
    const [annualIncomeOption, setAnnualIncomeOptions] = useState([]);
    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [districtList, setDistrictList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [fieldOfStudyOptions, setFieldOfStudyOptions] = useState([]);
    const [selectedFieldOfStudy, setSelectedFieldOfStudy] = useState(null);
    const [fieldOfStudyText, setFieldOfStudyText] = useState('');
    const [error, setError] = useState(null);
    const [degreeOptions, setDegreeOptions] = useState([]);
    const [selectedDegree, setSelectedDegree] = useState(null);



    const [companyName, setCompanyName] = useState("");
    const [designation, setDesignation] = useState("");
    const [professionDetail, setProfessionDetail] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [businessAddress, setBusinessAddress] = useState("");
    const [natureOfBusiness, setNatureOfBusiness] = useState("");
    const [submitting, setSubmitting] = useState(false); // Add state to track submission
    const [isOtherSelected, setIsOtherSelected] = useState(false);
    const [otherDegree, setOtherDegree] = useState("");

    // const [currency, setCurrency] = useState(
    //     { flag: '🌍', code: 'USD', currency: 'United States Dollar' }
    // );
    // const [pickerVisible, setPickerVisible] = useState(false); // Initialize pickerVisible state

    const [pickerVisible, setPickerVisible] = useState(false);
    const [currency, setCurrency] = useState({
        code: 'Select Currency',
        currency: 'INR',
        flag: ''
    });

    // Function to handle country selection
    const onSelectCurrency = (country) => {
        setCurrency({
            code: country.cca2,
            currency: country.currency[0],
            flag: country.flag
        });
        setPickerVisible(false); // Close the picker modal after selection
    };



    // const onSelectCurrency = (country) => {
    //     setCurrency({
    //         flag: country.flag || '🌍',
    //         code: country.currencyCode || 'USD',
    //         currency: country.currency || 'Currency'
    //     });
    //     setPickerVisible(false); // Close picker after selection
    // };


    useEffect(() => {
        retrieveDataFromSession();
        fetchHighestEdu();
        fetchUgDegree();
        fetchAnnualIncome();
        fetchCountryList();
        fetchProfessionalPreferences();
    }, []);

    const retrieveDataFromSession = async () => {
        try {
            const profileValue = await AsyncStorage.getItem("profile_owner");
            const profileId = await AsyncStorage.getItem("profile_id");
            const mobileno = await AsyncStorage.getItem("Mobile_no");
        } catch (error) {
            console.error("Error retrieving data from session:", error);
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
            console.log(highestEduArray);
        } catch (error) {
            console.error("Error fetching highest education:", error);
        }
    };

    const fetchUgDegree = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Ug_Degree/`);
            const ugDegreeArray = Object.keys(response.data).map(key => ({
                label: response.data[key].degree_description,
                value: response.data[key].degree_id.toString(),
            }));
            setUgDegreeOptions(ugDegreeArray);
        } catch (error) {
            console.error("Error fetching UG Degree:", error);
        }
    };

    const fetchProfessionalPreferences = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Profes_Pref/`);

            // Map the response data into an array of objects with `label` and `value`
            const professionalPreferencesArray = Object.keys(response.data).map(key => ({
                label: response.data[key].Profes_name,  // Professional name (label for dropdown)
                value: response.data[key].Profes_Pref_id.toString(),  // Professional ID (value for dropdown)
            }));

            // Update your state or handle the data as needed
            setProfessionalPreferences(professionalPreferencesArray);  // Assuming you have a state setter
        } catch (error) {
            console.error("Error fetching Professional Preferences:", error);
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

    const fetchCountryList = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Country/`);
            const countryData = Object.keys(response.data).map(key => ({
                label: response.data[key].country_name,
                value: response.data[key].country_id.toString(),
            }));
            setCountryList(countryData);
        } catch (error) {
            console.error("Error fetching country list:", error);
        }
    };

    const fetchStateList = async (countryId) => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_State/`, { country_id: countryId });
            const stateData = Object.keys(response.data).map(key => ({
                label: response.data[key].state_name,
                value: response.data[key].state_id.toString(),
            }));
            setStateList(stateData);
        } catch (error) {
            console.error("Error fetching state list:", error);
        }
    };

    const fetchDistrictList = async (stateId) => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_District/`, { state_id: stateId });
            const districtData = Object.values(response.data).map(district => ({
                label: district.disctict_name,
                value: district.disctict_id.toString(),
            }));
            setDistrictList(districtData);
        } catch (error) {
            console.error('Error fetching districts:', error);
        }
    };

    const fetchCityList = async (districtId) => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_City/`, { district_id: districtId });
            const cityData = Object.values(response.data).map(city => ({
                label: city.city_name.trim(),
                value: city.city_id.toString(),
            }));
            setCityList(cityData);
        } catch (error) {
            console.error('Error fetching cities:', error);
        }
    };


    useEffect(() => {
        const fetchFieldOfStudy = async () => {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Field_ofstudy/`);
                // Map response data into Dropdown-compatible options
                const options = Object.keys(response.data).map((key) => ({
                    label: response.data[key].study_description,
                    value: response.data[key].study_id,
                }));
                setFieldOfStudyOptions(options);
                setError(null); // Clear error on successful fetch
            } catch (error) {
                console.error("Error fetching Field of Study options:", error);
                setError("Failed to load options. Please try again."); // Show error message
            }
        };

        // Only fetch Field of Study options if the education value is 1, 2, or 3
        if (["1", "2", "3"].includes(formData.edValue)) {
            fetchFieldOfStudy();
        } else {
            setFieldOfStudyOptions([]); // Clear options when not needed
        }
    }, [formData.edValue]);

    useEffect(() => {
        const fetchDegrees = async () => {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Degree_list/`, {
                    edu_level: formData.edValue,
                    field_of_study: formData.fieldofvalue,
                });

                // Transform the API response into an array of options for the dropdown
                const options = Object.keys(response.data).map((key) => ({
                    label: response.data[key].degeree_description,
                    value: response.data[key].degeree_id,
                }));

                setDegreeOptions(options);
                setError(null); // Clear error if the fetch is successful
            } catch (error) {
                console.error("Error fetching Degree options:", error);
                setError("Failed to load degree options. Please try again.");
            }
        };

        // Fetch degrees only if both parameters are available
        if (formData.edValue && formData.fieldofvalue) {
            fetchDegrees();
        }
    }, [formData.edValue, formData.fieldofvalue]); // Re-fetch when eduLevel or fieldOfStudy changes



    const validate = () => {
        const newErrors = {};

        if (!formData.edValue) newErrors.edValue = "Highest Education Level is required";
        // if (!formData.deValue) newErrors.deValue = "UG Degree is required";
        // if (!formData.educationDetail) newErrors.educationDetail = "Education qualification detail is required";
        // if (!formData.aboutEducation) newErrors.aboutEducation = "About Education is required";
        if (!formData.boxValue) newErrors.boxValue = "Profession is required";
        // if (!formData.inValue) newErrors.inValue = "Annual Income is required";
        // if (!formData.cValue) newErrors.cValue = "Country is required";

        // if (formData.cValue === "1") { // If country is 'India' (assuming '1' is the value for India)
        //     if (!formData.sValue) newErrors.sValue = "State is required";
        //     if (!formData.district) newErrors.district = "District is required";
        //     if (!formData.ciValue) newErrors.ciValue = "City is required";
        // }

        // if (!formData.pincode) {
        //     newErrors.pincode = "Pincode is required";
        // } else if (!/^\d{6}$/.test(formData.pincode)) {
        //     newErrors.pincode = "Pincode must be exactly 6 digits";
        // }

        setErrors(newErrors);

        // Return true if there are no errors
        return Object.keys(newErrors).length === 0;
    };


    const handleChange = (field, value) => {
        console.log(`Selected ${field}:`, value); // Log the selected value

        setFormData((prevData) => ({
            ...prevData,
            [field]: value,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: undefined, // Clear the error for the field that is being changed
        }));
    };

    const onSubmit = async () => {

        if (!validate()) {
            // Alert.alert("Validation Error", "Please correct the highlighted errors.");
            return;
        }

        try {
            setSubmitting(true); // Set submitting state to true

            const profileId = await AsyncStorage.getItem("profile_id_new");
            if (!profileId) {
                throw new Error("ProfileId not found in sessionStorage");
            }

            const degreeValues = selectedDegrees
                .filter(degree => degree.value !== 86 && degree.value !== '86') // Filter out "Other" (86)
                .map(degree => degree.value); // Extract just the value

            const degreePayload = degreeValues.join(','); // Join IDs with comma

            // FIXED: Check if degree with ID 86 is selected
            const isOtherDegreeSelected = selectedDegrees.some(
                degree => degree.value === 86 || degree.value === '86'
            );
            const finalOtherDegree = isOtherDegreeSelected ? otherDegree : "";

            // --- Process City ---
            let finalCityName = ""; // This will hold the final city name string

            if (isOtherSelected) {
                // Case 1: User typed the city name manually.
                // formData.ciValue already holds the typed string.
                finalCityName = formData.ciValue;
            } else if (formData.ciValue) {
                // Case 2: User selected from the dropdown.
                // formData.ciValue holds the city ID. We need to find the city *name* (label).
                const selectedCityObject = cityList.find(city => city.value === formData.ciValue);

                if (selectedCityObject) {
                    finalCityName = selectedCityObject.label; // Get the name from the object
                }
            }
            const finalWorkOtherCity = isOtherSelected ? formData.ciValue : "";

            // --- Process Currency ---
            const currencyCode = currency.currency === 'Select Currency' ? 'INR' : currency.currency;

            const formattedData = {
                profile_id: profileId,
                highest_education: formData.edValue,
                ug_degeree: formData.deValue,
                about_edu: formData.aboutEducation,
                profession: formData.boxValue,
                anual_income: formData.inValue,
                actual_income: formData.actualIncome,
                work_country: formData.cValue,
                work_state: formData.sValue,
                work_pincode: formData.pincode,
                career_plans: formData.careerNotes,
                // work_city: formData.ciValue,
                work_place: formData.workPlace,
                status: "1",
                Profile_district: formData.district,
                field_ofstudy: formData.fieldofvalue,
                company_name: (formData.boxValue === "1" || formData.boxValue === "6" || formData.boxValue === "7") ? companyName : "",
                designation: (formData.boxValue === "1" || formData.boxValue === "6" || formData.boxValue === "7") ? designation : "",
                profession_details: (formData.boxValue === "1" || formData.boxValue === "6" || formData.boxValue === "7") ? professionDetail : "",

                business_name: (formData.boxValue === "2" || formData.boxValue === "6") ? businessName : "",
                business_address: (formData.boxValue === "2" || formData.boxValue === "6") ? businessAddress : "",
                nature_of_business: (formData.boxValue === "2" || formData.boxValue === "6") ? natureOfBusiness : "",

                // Currency
                currency: currencyCode,

                // Degree Details
                degree: degreePayload,
                other_degree: finalOtherDegree,

                // City Details
                work_city: finalCityName,
                work_other_city: finalWorkOtherCity,
            };

            console.log("Formatted Data:", formattedData);

            const response = await axios.post(`${config.apiUrl}/auth/Education_registration/`, formattedData);

            if (response.data.Status === 1) {
                navigation.navigate("HoroDetails");
            } else {
                console.error("Error: Response status is not 1", response.data);
            }
        } catch (error) {
            console.error("Error submitting form data:", error);
        }
        finally {
            setSubmitting(false); // Reset submitting state after API call
        }
    };

    return (
        <ScrollView>
            <SafeAreaView style={styles.container}>
                <Text style={styles.eduHead}>Education Details</Text>
                <View style={styles.formContainer}>

                    {/* Highest Education Level */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Highest Education Level<Text style={styles.redText}>*</Text></Text>
                        <Dropdown
                            style={styles.dropdown}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            data={highestEduOption}
                            placeholder="Select your education level"
                            labelField="label"
                            valueField="value"
                            value={formData.edValue}
                            onChange={(item) => handleChange('edValue', item.value)}
                        />
                        {errors.edValue && <Text style={styles.error}>{errors.edValue}</Text>}
                    </View>

                    {formData.edValue && (
                        <View style={styles.inputContainer}>
                            {["1", "2", "3"].includes(formData.edValue) ? (
                                <>
                                    {/* Label for the dropdown */}
                                    <Text style={styles.label}>Field of Study</Text>

                                    {/* Dropdown for values 1, 2, 3 */}
                                    <Dropdown
                                        style={styles.dropdown}
                                        placeholderStyle={styles.placeholderStyle}
                                        selectedTextStyle={styles.selectedTextStyle}
                                        data={fieldOfStudyOptions}
                                        placeholder="Select Field of Study"
                                        labelField="label"
                                        valueField="value"
                                        value={formData.fieldofvalue || ""} // Ensure value is a string
                                        onChange={(item) => handleChange("fieldofvalue", item.value)} // Update state
                                    />
                                </>
                            ) : formData.edValue === "4" ? (
                                <>
                                    {/* Label for the TextInput */}
                                    <Text style={styles.label}>Field of Study</Text>

                                    {/* TextInput for value 4 */}
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your Field of Study"
                                        value={fieldOfStudyText || ""} // Ensure value is a string
                                        onChangeText={(text) => setFieldOfStudyText(text)} // Update state
                                    />
                                </>
                            ) : null}

                            {/* Ensure the error message is wrapped in a Text component */}
                            {/* {error && <Text style={styles.errorText}>{error}</Text>} */}
                        </View>
                    )}



                    {/* {["1", "2", "3"].includes(formData.edValue) ? (
                        // Show Dropdown for values 1, 2, 3
                        <View style={styles.inputContainer}>
                            <Text style={{ fontSize: 16, marginBottom: 8 }}>Degree</Text>
                            <Dropdown
                                style={styles.dropdown}

                                placeholderStyle={{ color: "#aaa" }}
                                selectedTextStyle={{ color: "#000" }}
                                data={degreeOptions}
                                placeholder="Select a degree"
                                labelField="label"
                                valueField="value"
                                value={selectedDegree}
                                onChange={(item) => handleChange('degreeval', item.value)}
                            />
                            {error && <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>}
                        </View>
                    ) : formData.edValue === "4" ? (
                        // Show TextInput styled like Dropdown for value 4
                        <View>
                            <Text style={styles.label}>Degree</Text>
                            <TextInput
                                style={styles.input}

                                placeholder="Enter your degree"
                                placeholderTextColor="#aaa" // To match dropdown placeholder style
                                value={selectedDegree}
                                onChangeText={(text) => setSelectedDegree(text)}
                            />
                            {error && <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>}
                        </View>
                    ) : null} */}



                    {["1", "2", "3", "4"].includes(formData.edValue) && (
                        <View style={styles.inputContainer}>
                            <Text style={{ fontSize: 16, marginBottom: 8 }}>Specific Field</Text>

                            {/* Multiple Select Dropdown */}
                            <Dropdown
                                style={styles.dropdown}
                                placeholderStyle={{ color: "#aaa" }}
                                selectedTextStyle={{ color: "#000" }}
                                data={degreeOptions} // Don't add "Other" here, it should come from API
                                placeholder="Select degrees"
                                labelField="label"
                                valueField="value"
                                value={selectedDegrees}
                                onChange={(item) => handleDegreeChange(item)}
                                multiple={true}
                                mode="BADGE"
                            />

                            {/* Text Area to display selected values */}
                            <TextInput
                                style={[styles.textArea, { marginTop: 16 }]}
                                multiline
                                editable={false}
                                value={
                                    Array.isArray(selectedDegrees)
                                        ? selectedDegrees.map((degree) => degree.label).join(", ")
                                        : ""
                                }
                            />

                            {/* Conditionally render free text field when "Other" (86) is selected */}
                            {isOtherSelected && (
                                <View style={{ marginTop: 16 }}>
                                    <Text style={styles.label}>Other Education</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your degree"
                                        placeholderTextColor="#aaa"
                                        value={otherDegree}
                                        onChangeText={(text) => setOtherDegree(text)}
                                    />
                                </View>
                            )}

                            {error && <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>}
                        </View>
                    )}
                    {/* About Education */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>About your Education<Text style={styles.redText}></Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter details about  education"
                            value={formData.aboutEducation}
                            onChangeText={(value) => handleChange('aboutEducation', value)}
                        />
                        {/* {errors.aboutEducation && <Text style={styles.error}>{errors.aboutEducation}</Text>} */}
                    </View>

                    {/* Profession */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Profession<Text style={styles.redText}>*</Text></Text>
                        <Dropdown
                            style={styles.dropdown}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            data={professionOptions}
                            placeholder="Select  Profession"
                            labelField="label"
                            valueField="value"
                            value={formData.boxValue}
                            onChange={(item) => handleChange('boxValue', item.value)}
                        />
                        {errors.boxValue && <Text style={styles.error}>{errors.boxValue}</Text>}
                    </View>




                    <View>
                        {formData.boxValue === "1" && (
                            <View style={styles.inputContainer}>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Company Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter company name"
                                        value={companyName}
                                        onChangeText={setCompanyName}
                                    />
                                </View>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Designation</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter designation"
                                        value={designation}
                                        onChangeText={setDesignation}
                                    />
                                </View>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Profession Details</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter profession details"
                                        multiline
                                        value={professionDetail}
                                        onChangeText={setProfessionDetail}
                                    />
                                </View>
                            </View>
                        )}

                        {formData.boxValue === "2" && (
                            <View style={styles.inputContainer}>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Business Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter business name"
                                        value={businessName}
                                        onChangeText={setBusinessName}
                                    />
                                </View>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Business Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter business address"
                                        value={businessAddress}
                                        onChangeText={setBusinessAddress}
                                    />
                                </View>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Nature of Business</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter nature of business"
                                        multiline
                                        value={natureOfBusiness}
                                        onChangeText={setNatureOfBusiness}
                                    />
                                </View>
                            </View>
                        )}

                        {formData.boxValue === "6" && (
                            <View style={styles.inputContainer}>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Company Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter company name"
                                        value={companyName}
                                        onChangeText={setCompanyName}
                                    />
                                </View>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Designation</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter designation"
                                        value={designation}
                                        onChangeText={setDesignation}
                                    />
                                </View>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Profession Details</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter profession details"
                                        multiline
                                        value={professionDetail}
                                        onChangeText={setProfessionDetail}
                                    />
                                </View>


                                <View style={styles.inputContainer}>
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Business Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter business name"
                                            value={businessName}
                                            onChangeText={setBusinessName}
                                        />
                                    </View>
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Business Address</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter business address"
                                            value={businessAddress}
                                            onChangeText={setBusinessAddress}
                                        />
                                    </View>
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Nature of Business</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter nature of business"
                                            multiline
                                            value={natureOfBusiness}
                                            onChangeText={setNatureOfBusiness}
                                        />
                                    </View>
                                </View>


                            </View>
                        )}

                        {formData.boxValue === "7" && (
                            <View style={styles.inputContainer}>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Add Company Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter company name"
                                        value={companyName}
                                        onChangeText={setCompanyName}
                                    />
                                </View>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Add Designation</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter designation"
                                        value={designation}
                                        onChangeText={setDesignation}
                                    />
                                </View>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Add Profession in Detail</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter profession details"
                                        multiline
                                        value={professionDetail}
                                        onChangeText={setProfessionDetail}
                                    />
                                </View>
                            </View>
                        )}
                    </View>










                    {/* Currency Picker */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>
                            Annual Income<Text style={styles.redText}></Text>
                        </Text>
                        <View style={styles.currencyFlexContainer}>
                            {/* Small Text Field for Currency */}
                            <View style={styles.currencyTextContainer}>
                                <Text style={styles.currencyText}>INR (₹)</Text>
                            </View>

                            {/* Annual Income Dropdown */}
                            <Dropdown
                                style={[styles.dropdown, styles.annualInputStyle]}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                data={annualIncomeOption}
                                placeholder="Select Annual Income"
                                labelField="label"
                                valueField="value"
                                value={formData.inValue}
                                onChange={(item) => handleChange('inValue', item.value)}
                            />
                            {/* Uncomment to display validation error */}
                            {/* {errors.inValue && <Text style={styles.error}>{errors.inValue}</Text>} */}
                        </View>
                    </View>





                    <View style={styles.inputContainer}>

                        <Text style={styles.label}>Actual Income<Text style={styles.redText}></Text></Text>
                        <View style={styles.currencyFlexContainer}>

                            <View style={styles.annualInputContainer}>
                                {/* <Text style={styles.label}>Currency</Text> */}
                                <TouchableOpacity style={styles.currencyPicker} onPress={() => setPickerVisible(true)}>
                                    {/* <Text style={styles.flag}>{currency.flag || '🌍'}</Text> */}
                                    {/* <Text style={styles.currencyCode}>{currency.code}</Text> */}
                                    <Text style={styles.currencyName}>{currency.currency}</Text>
                                </TouchableOpacity>

                                <View>
                                    <CountryPicker
                                        withFilter
                                        withCurrency
                                        withFlag
                                        withCountryNameButton
                                        withAlphaFilter
                                        onSelect={onSelectCurrency}
                                        visible={pickerVisible}
                                        onClose={() => setPickerVisible(false)} // Close picker on backdrop tap
                                        // Custom flag button to avoid default label
                                        renderFlagButton={() => <></>}
                                    />
                                </View>

                            </View>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, styles.actualIncomeInput]}
                                    placeholder="Enter actual income"
                                    keyboardType="numeric"
                                    value={formData.actualIncome}
                                    onChangeText={(value) => handleChange('actualIncome', value)}
                                />
                                {errors.actualIncome && <Text style={styles.error}>{errors.actualIncome}</Text>}
                            </View>
                            {/* {errors.inValue && <Text style={styles.error}>{errors.inValue}</Text>} */}
                        </View>
                    </View>


                    {/* Actual Income */}
                    {/* <View style={styles.inputContainer}>
                        <Text style={styles.label}>Actual Income</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter actual income"
                            keyboardType="numeric"
                            value={formData.actualIncome}
                            onChangeText={(value) => handleChange('actualIncome', value)}
                        />
                        {errors.actualIncome && <Text style={styles.error}>{errors.actualIncome}</Text>}
                    </View> */}

                    {/* Country */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Country<Text style={styles.redText}></Text></Text>
                        <Dropdown
                            style={styles.dropdown}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            data={countryList}
                            placeholder="Select country"
                            labelField="label"
                            valueField="value"
                            value={formData.cValue}
                            onChange={(item) => {
                                handleChange('cValue', item.value);
                                fetchStateList(item.value);
                                setSelectedCountry(item.value);
                            }}
                        />
                        {/* {errors.cValue && <Text style={styles.error}>{errors.cValue}</Text>} */}
                    </View>

                    {/* State */}
                    {/* State */}
                    {selectedCountry === "1" && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>State<Text style={styles.redText}></Text></Text>
                            <Dropdown
                                style={styles.dropdown}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                data={stateList}
                                placeholder="Select state"
                                labelField="label"
                                valueField="value"
                                value={formData.sValue}
                                onChange={(item) => {
                                    handleChange('sValue', item.value);
                                    fetchDistrictList(item.value);

                                    // Reset district and city when state changes
                                    setSelectedDistrict(null);
                                    handleChange('district', '');
                                    handleChange('ciValue', '');
                                    setCityList([]);

                                    setErrors(prev => ({ ...prev, sValue: undefined }));
                                }}
                            />
                            {/* {errors.sValue && <Text style={styles.error}>{errors.sValue}</Text>} */}
                        </View>
                    )}

                    {/* District */}
                    {selectedCountry === "1" && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>District<Text style={styles.redText}></Text></Text>
                            <Dropdown
                                style={styles.dropdown}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                data={districtList}
                                placeholder="Select district"
                                labelField="label"
                                valueField="value"
                                value={formData.district}
                                onChange={(item) => {
                                    handleChange('district', item.value);
                                    fetchCityList(item.value);
                                    setSelectedDistrict(item.value); // Set selected district
                                    setErrors(prev => ({ ...prev, district: undefined }));
                                }}
                            />
                            {/* {errors.district && <Text style={styles.error}>{errors.district}</Text>} */}
                        </View>
                    )}

                    {/* City */}
                    {/* {selectedCountry === "1" && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>City<Text style={styles.redText}></Text></Text>
                            <Dropdown
                                style={styles.dropdown}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                data={cityList}
                                placeholder="Select city"
                                labelField="label"
                                valueField="value"
                                value={formData.ciValue}
                                onChange={(item) => {
                                    handleChange('ciValue', item.value);
                                    setErrors(prev => ({ ...prev, ciValue: undefined })); // Clear error on selection
                                }}
                            />
                            {errors.ciValue && <Text style={styles.error}>{errors.ciValue}</Text>}
                        </View>
                    )} */}

                    {selectedCountry === "1" && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>
                                City<Text style={styles.redText}></Text>
                            </Text>
                            {!isOtherSelected ? (
                                <Dropdown
                                    style={styles.dropdown}
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    data={[...cityList, { label: "Others", value: "Others" }]} // Add "Others" to dropdown options
                                    placeholder="Select city"
                                    labelField="label"
                                    valueField="value"
                                    value={formData.ciValue}
                                    onChange={(item) => {
                                        if (item.value === "Others") {
                                            setIsOtherSelected(true); // Switch to text input
                                            handleChange('ciValue', ''); // Clear the current dropdown value
                                        } else {
                                            handleChange('ciValue', item.value);
                                            setErrors((prev) => ({ ...prev, ciValue: undefined })); // Clear error on selection
                                        }
                                    }}
                                />
                            ) : (
                                <TextInput
                                    style={[
                                        styles.input,
                                        errors.ciValue ? styles.inputError : null, // Apply error styling if needed
                                    ]}
                                    placeholder="Enter your city"
                                    value={formData.ciValue}
                                    onChangeText={(text) => {
                                        handleChange('ciValue', text);
                                        setErrors((prev) => ({ ...prev, ciValue: undefined })); // Clear error on input
                                    }}
                                />
                            )}
                            {errors.ciValue && <Text style={styles.error}>{errors.ciValue}</Text>}
                        </View>
                    )}



                    {/* Work Place */}
                    {selectedCountry !== "1" && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Work Place</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter work place"
                                value={formData.workPlace}
                                onChangeText={(value) => handleChange('workPlace', value)}
                            />
                        </View>
                    )}

                    {/* Pincode */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Pincode</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your pincode"
                            keyboardType="numeric"
                            value={formData.pincode}
                            onChangeText={(value) => handleChange('pincode', value)}
                        />
                        {errors.pincode && <Text style={styles.error}>{errors.pincode}</Text>}
                    </View>

                    {/* Career Notes */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Career Notes</Text>
                        <TextInput
                            style={[styles.inputTextarea]}
                            multiline
                            placeholder="Enter career notes"
                            value={formData.careerNotes}
                            onChangeText={(value) => handleChange('careerNotes', value)}
                        />
                        {errors.careerNotes && <Text style={styles.error}>{errors.careerNotes}</Text>}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={onSubmit}
                        disabled={submitting} // Disable button when submitting

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
                                {/* <Text style={styles.login}>Next</Text> */}
                                <Text style={styles.login}>{submitting ? "Submitting..." : "Next"}</Text>

                                <Ionicons name="arrow-forward" size={18} color="white" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </ScrollView >
    );
};



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },

    eduHead: {
        color: "#535665",
        fontFamily: "inter",
        fontSize: 24,
        fontWeight: "700",
        alignSelf: "flex-start",
        paddingHorizontal: 20,
        marginVertical: 10,
    },

    formContainer: {
        width: "100%",
        paddingHorizontal: 20,
    },

    label: {
        color: "#535665",
        fontSize: 14,
        fontWeight: "600",
        // fontFamily: "inter",
    },

    redText: {
        color: "#FF6666",
        fontSize: 14,
        fontWeight: "700",
    },

    inputContainer: {
        width: "100%",
        marginBottom: 20,
    },

    input: {
        color: "#535665",
        borderWidth: 1,
        borderRadius: 4,
        borderColor: "#D4D5D9",
        padding: 10,
        // marginBottom: 10,
        fontFamily: "inter",
    },

    dropdown: {
        width: "100%",
        color: "#535665",
        borderWidth: 1,
        borderRadius: 4,
        borderColor: "#D4D5D9",
        paddingHorizontal: 10,
        paddingVertical: 13,
        // marginBottom: 10,
        fontFamily: "inter",
    },

    placeholderStyle: {
        fontSize: 14,
    },

    selectedTextStyle: {
        fontSize: 14,
    },

    iconStyle: {
        width: 20,
        height: 20,
    },

    textBoxFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        width: "100%",
    },

    box: {
        borderWidth: 1,
        borderColor: "#D4D5D9",
        backgroundColor: "#fff",
        alignItems: "center",
        fontSize: 14,
        flex: 1,
        padding: 6,
    },

    selectedBox: {
        backgroundColor: "#FF6666",
        color: "#fff",
    },

    boxText: {
        fontSize: 10,
        fontWeight: "500",
        color: "#535665",
    },

    selectedBoxText: {
        color: "#fff",
    },

    inputTextarea: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 10,
        height: 100, // Set a fixed height for better visibility
        textAlignVertical: "top"
        // marginBottom: 16,
    },

    btn: {
        width: "100%",
        alignSelf: "center",
        borderRadius: 6,
        // shadowColor: "#EE1E2440",
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.2,
        // shadowRadius: 6,
        // elevation: 5,
        marginTop: 15,
        marginBottom: 30,
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

    linearGradient: {
        borderRadius: 5,
        justifyContent: "center",
        padding: 15,
    },

    error: {
        color: "#FF0000",
        fontSize: 12,
        fontFamily: "inter",
    },
    actualIncomeInput: {
        width: '87%',
    },
    currencyFlexContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start"
    },

    currencyPicker: {
        width: "100%",
        color: "#535665",
        borderWidth: 1,
        borderRadius: 4,
        borderColor: "#D4D5D9",
        paddingHorizontal: 10,
        paddingVertical: 12,
        marginBottom: 20,
        fontFamily: "inter",
    },
    flag: {
        fontSize: 12,
        marginRight: 2,
    },
    currencyCode: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 2,
    },
    currencyName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 2,
    },
    annualInputContainer: {
        display: "flex",
        flexFlow: "row",
    },
    annualInputStyle: {
        width: '82%',
    },

    textArea: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 12,
        height: 100,
        textAlignVertical: "top",
        backgroundColor: "#f9f9f9",
        color: "#000",
    },
    currencyFlexContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencyTextContainer: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 5,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        marginRight: 8,
        // backgroundColor: '#f0f0f0', // Optional background color
        borderRadius: 4,
    },
    currencyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },

});


