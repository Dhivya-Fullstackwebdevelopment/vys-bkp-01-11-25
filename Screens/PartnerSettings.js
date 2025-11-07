import React, { useEffect, useState } from 'react';
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
import axios from "axios"; // Import axios
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";
import MatchingStars from '../Components/MatchingStars/MatchingStars';


// const schema = z.object({
//     ageDifference: z.string().min(1, "Age difference is required"),
//     heightFrom: z.string().min(1, "Height from is required"),
//     heightTo: z.string().min(1, "Height to is required"),
//     chevvai: z.string().min(1, "Chevvai is required"),
//     rehu: z.string().min(1, "Rehu is required"),
//     maritalStatus: z.array(z.string()).min(1, "At least one marital status is required"),
//     education: z.array(z.string()).min(1, "At least one education option is required"),
//     profession: z.array(z.string()).min(1, "At least one profession option is required"),
//     annualIncome:z.string().min(1, "At least one income option is required"),
//     annualIncomeMax:z.string().min(1, "At least one income option is required"),
//     // nativeState: z.array(z.string()).min(1, "At least one native state is required"),
//     foreignInterest: z.string().min(1, "Foreign interest is required"),
//     // dhosam: z.array(z.string()).min(1, "At least one dhosam option is required"),
//     // porutham: z.array(z.string()).nonempty("At least one porutham option is required").optional,
//     // workLocation: z.string().min(1, "Work location is required"),
//     // profilePhoto: z.boolean(),
// });


const schema = z.object({
    ageDifference: z.string().optional(),
    heightFrom: z.string().optional(),
    heightTo: z.string().optional(),
    chevvai: z.string().optional(),
    rehu: z.string().optional(),
    maritalStatus: z.array(z.string()).optional(),
    education: z.array(z.string()).optional(),
    profession: z.array(z.string()).optional(),
    annualIncome: z.string().optional(),
    annualIncomeMax: z.string().optional(),
    foreignInterest: z.string().optional(),
    //fieldOfStudy: z.string().optional(),
});


const age = [
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

    // Add more options as needed
];

const foreignInterest = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
    { label: 'both', value: 'both' },
    // Add more options as needed
];

export const PartnerSettings = () => {
    const navigation = useNavigation();
    const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            ageDifference: '5',
            heightFrom: '',
            heightTo: '',
            maritalStatus: [],
            education: [],
            profession: [],
            // annualIncome: [],
            // annualIncomeMax: [],
            annualIncome: '',
            annualIncomeMax: '',
            //nativeState: [],
            foreignInterest: '',
            // dhosam: [],
            chevvai: '',
            rehu: '',
            //workLocation: '',
            fieldOfStudy: '',
            //profilePhoto: false,
        },
    });

    const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
    const [highestEduOptions, setHighestEduOptions] = useState([]);
    const [annualIncomeOptions, setAnnualIncomeOptions] = useState([]);
    const [birthStarValue, setBrthStar] = useState([]);
    const [martialValue, setMaritalStatus] = useState([]);
    const [GenderValue, setGender] = useState([]);
    const [height, setHeight] = useState([]);
    const [matchList, setMatchList] = useState([]);
    const [matchStars, setMatchStars] = useState([]);
    const [selectedStarIds, setSelectedStarIds] = useState([]);
    const [RasiIds, setRasiIds] = useState([]);
    const [StarIds, setStarIds] = useState([]);
    const [selectedStarRasiPairs, setSelectedStarRasiPairs] = useState([]);
    const [professionalPreferences, setProfessionalPreferences] = useState([]);
    const [fieldOfStudyOptions, setFieldOfStudyOptions] = useState([]); // For the new dropdown
    const [fieldError, setFieldError] = useState(null); // For error handling
    const [submitting, setSubmitting] = useState(false); // Add state to track submission


    const maritalStatusSelected = watch("maritalStatus") || [];
    const fieldOfStudySelected = watch("fieldOfStudy") || [];

    const fetchFieldOfStudy = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Field_ofstudy/`);

            // Log response to debug
            console.log("API Response:", response.data);

            // Convert the object to an array
            const options = Object.keys(response.data).map((key) => ({
                label: response.data[key].study_description,
                value: response.data[key].study_id,
            }));

            // Set the options in the state
            setFieldOfStudyOptions(options);
            setFieldError(null); // Clear error if fetch is successful
        } catch (error) {
            console.error("Error fetching Field of Study options:", error);
            setFieldError("Failed to load options. Please try again."); // Show error message
        }
    };

    useEffect(() => {
        fetchMaritalStatus();
        retrieveDataFromSession();
        fetchHighestEdu();
        fetchAnnualIncome();
        fetchFieldOfStudy();
        // fetchMatchList();
        //fetchMatchStars();
    }, []);

    const retrieveDataFromSession = async () => {
        try {
            let profileValue = await AsyncStorage.getItem("profile_owner");
            const profileId = await AsyncStorage.getItem("profile_id_new");
            const mobileno = await AsyncStorage.getItem("Mobile_no");
            const birthstar = await AsyncStorage.getItem("birthStarValue");
            const gender = await AsyncStorage.getItem("gender");
            const height = await AsyncStorage.getItem("height");
            const martialstatus = await AsyncStorage.getItem("martial_status");
            // Replace "ownself" with "yourself"
            profileValue = profileValue === "Ownself" ? "yourself" : profileValue;
            // setMobileNo(mobileno);
            // setProfileId(profileId);
            // setProfileOwner(profileValue);
            setBrthStar(birthstar);
            setGender(gender);
            setHeight(height);
            setMaritalStatus(martialstatus);
            console.log("Retrieved Profile Value:", profileValue);
            console.log("Retrieved Profile ID:", profileId);
            console.log("Retrieved Mobile No:", mobileno);
            console.log("Retrieved birthstar:", birthstar);
            console.log("Retrieved gender:", gender);
            console.log("Retrieved height:", height);
            console.log("Retrieved martialstatus:", martialstatus);
        } catch (error) {
            console.error("Error retrieving data from session:", error);
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
            console.error("Error fetching UG Degree:", error);
        }
    };

    useEffect(() => {
        const fetchMatchingStars = async () => {
            const birthstar = await AsyncStorage.getItem("birthStarValue");
            const gender = await AsyncStorage.getItem("gender");
            const birthstarid = await AsyncStorage.getItem("birthStaridValue");
            console.log("birthstar =====>", birthstar);
            console.log("gender =====>", gender);
            console.log("birthstarid =====>", birthstarid);
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Matchstr_Pref/`, {
                    // birth_star_id: "10",
                    // gender: "female",
                    birth_star_id: birthstar,
                    gender: gender,
                    birth_rasi_id: birthstarid
                });

                const matchCountArrays = Object.values(response.data);
                console.log("matchCountArrays =====>", matchCountArrays);
                setMatchStars(matchCountArrays);

                // Initialize `selectedStarIds` excluding stars with 0 poruthams
                const initialSelected = matchCountArrays
                    .flatMap(matchCountArray =>
                        matchCountArray[0].match_count !== 0 // Exclude stars with 0 poruthams
                            ? matchCountArray.map(star => ({
                                id: star.id.toString(),
                                rasi: star.dest_rasi_id.toString(),
                                star: star.dest_star_id.toString(),
                                label: `${star.matching_starname} - ${star.matching_rasiname}`
                            }))
                            : []
                    );
                setSelectedStarIds(initialSelected);

                console.log('Response from server:', matchCountArrays);
            } catch (error) {
                console.error('Error fetching matching star options:', error);
            }
        };
        fetchMatchingStars();
    }, []);

    useEffect(() => {
        const fetchProfessionalPreferences = async () => {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Profes_Pref/`);
                const professionalPreferencesArray = Object.keys(response.data).map((key) => ({
                    label: response.data[key].Profes_name, // Professional name
                    value: response.data[key].Profes_Pref_id.toString(), // Professional ID
                }));
                setProfessionalPreferences(professionalPreferencesArray);
            } catch (error) {
                console.error("Error fetching Professional Preferences:", error);
            }
        };
        fetchProfessionalPreferences();
    }, []);

    const handleCheckboxChange = (updatedIds) => {
        setSelectedStarIds(updatedIds);
        // You now have access to rasi and star information as well
        console.log('Updated Selected Stars:', updatedIds);
    };

    const onSubmit = async (data) => {
        console.log("Data submitted:", data);
        try {
            setSubmitting(true);

            const profileId = await AsyncStorage.getItem("profile_id_new");
            if (!profileId) {
                throw new Error("ProfileId not found in sessionStorage");
            }
            // Extract the `id`, `rasi`, and `star` values from the array
            const starArray = selectedStarIds.map(item => item.id);
            const rasiArray = selectedStarIds.map(item => item.rasi);
            const starRasiArray = selectedStarIds.map(item => `${item.star}-${item.rasi}`);

            // Create a comma-separated string for each array
            const StarString = starArray.join(',');
            const RasiString = rasiArray.join(',');
            const combinedString = starRasiArray.join(',');

            console.log(StarString);
            console.log(combinedString);

            const formattedData = {
                profile_id: profileId,
                pref_age_differences: data.ageDifference,
                pref_height_from: data.heightFrom,
                pref_height_to: data.heightTo,
                pref_marital_status: data.maritalStatus.join(','),
                pref_profession: data.profession.join(','),
                pref_education: data.education.join(','),
                // pref_anual_income: data.annualIncome.join(','),
                pref_anual_income: data.annualIncome,
                pref_chevvai: data.chevvai || "",
                pref_ragukethu: data.rehu || "",
                pref_foreign_intrest: data.foreignInterest,
                pref_porutham_star: StarString, // Star IDs as a comma-separated string
                pref_porutham_star_rasi: combinedString, // Combined star-rasi as a comma-separated string
                status: "1"
            };

            console.log("Post Data:", formattedData);
            const response = await axios.post(`${config.apiUrl}/auth/Partner_pref_registration/`, formattedData);
            console.log("Registration response:", response.data);

            if (response.data.Status === 1) {
                // Set a flag to indicate user came from partner settings
                await AsyncStorage.setItem("from_partner_settings", "true");
                navigation.navigate('MembershipPlan');
            } else {
                console.log("Registration unsuccessful:", response.data);
            }
        } catch (error) {
            console.error("Error submitting data:", error);
        }
        finally {
            setSubmitting(false); // Reset submitting state after API call
        }
    };

    useEffect(() => {
        if (height) {
            if (GenderValue === "Male") {
                setValue("heightTo", height);  // Set heightTo when GenderValue is Male
            } else if (GenderValue === "Female") {
                setValue("heightFrom", height);  // Set heightFrom when GenderValue is Female
            }
        }
    }, [height, GenderValue, setValue]);  // Dependencies include height, GenderValue, and setValue

    useEffect(() => {
        // Fetch session data and synchronize form state
        retrieveDataFromSessionNew();
    }, []);

    const retrieveDataFromSessionNew = async () => {
        try {
            const maritalstatus = await AsyncStorage.getItem("martial_status");
            if (maritalstatus) {
                const maritalValueInt = (maritalstatus); // Parse to integer if stored as a string
                setMaritalStatus(maritalValueInt); // Update state for reference
                setValue("maritalStatus", [maritalValueInt]); // Update form field
            }
        } catch (error) {
            console.error("Error retrieving marital status from session:", error);
        }
    };

    return (
        <ScrollView>
            <SafeAreaView style={styles.container}>
                <Text style={styles.partnerHead}>Partner Preference</Text>
                {/* <Text style={styles.search}>Advanced Search</Text> */}

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
                                        placeholderStyle={styles.placeholderStyle}
                                        selectedTextStyle={styles.selectedTextStyle}
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
                            {/* {errors.ageDifference && <Text style={styles.errorText}>{errors.ageDifference.message}</Text>} */}
                        </View>
                    </View>
                </View>

                {/* Height */}
                <View style={styles.inputContainer}>
                    <Text style={styles.redText}>Height</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.inputFlexContainer}>
                            {/* Height From */}
                            <Controller
                                control={control}
                                name="heightFrom"
                                rules={{ required: 'Height from is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputFlexFirst}>
                                        <TextInput
                                            placeholder="From"
                                            keyboardType="numeric"
                                            value={value}
                                            onChangeText={onChange}
                                        />
                                        {/* {errors.heightFrom && (
                                            <Text style={styles.errorText}>{errors.heightFrom.message}</Text>
                                        )} */}
                                    </View>
                                )}
                            />

                            {/* Height To */}
                            <Controller
                                control={control}
                                name="heightTo"
                                rules={{ required: 'Height to is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputFlex}>
                                        <TextInput
                                            placeholder="To"
                                            keyboardType="numeric"
                                            value={value}
                                            onChangeText={onChange}
                                        />
                                        {/* {errors.heightTo && (
                                            <Text style={styles.errorText}>{errors.heightTo.message}</Text>
                                        )} */}
                                    </View>
                                )}
                            />
                        </View>
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
                                    // Uncheck all
                                    setValue("maritalStatus", []);
                                } else {
                                    // Check all
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
                                                value.includes(status.value) && styles.checkboxChecked,
                                            ]}
                                            onPress={() => {
                                                const newValue = value.includes(status.value)
                                                    ? value.filter((item) => item !== status.value)
                                                    : [...value, status.value];
                                                onChange(newValue);
                                            }}
                                        >
                                            {value.includes(status.value) && (
                                                <Ionicons name="checkmark" size={14} color="white" />
                                            )}
                                        </Pressable>
                                        <Pressable onPress={() => {
                                            const newValue = value.includes(status.value)
                                                ? value.filter((item) => item !== status.value)
                                                : [...value, status.value];
                                            onChange(newValue);
                                        }}>
                                            <Text style={styles.checkboxLabel}>{status.label}</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    />
                    {/* {errors.maritalStatus && <Text style={styles.errorTextCheckBox}>{errors.maritalStatus.message}</Text>} */}
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
                                                value.includes(education.value) && styles.checkboxChecked,
                                            ]}
                                            onPress={async () => {
                                                const newValue = value.includes(education.value)
                                                    ? value.filter((item) => item !== education.value)
                                                    : [...value, education.value];

                                                // Update the education field
                                                onChange(newValue);

                                                // Check if the value includes 1, 2, or 3
                                                if (["1", "2", "3"].some((v) => newValue.includes(v))) {
                                                    await fetchFieldOfStudy(); // Trigger the fetch function
                                                } else {
                                                    setFieldOfStudyOptions([]); // Clear the dropdown options
                                                }
                                            }}
                                        >
                                            {value.includes(education.value) && (
                                                <Ionicons name="checkmark" size={14} color="white" />
                                            )}
                                        </Pressable>
                                        <Pressable
                                            onPress={() => {
                                                const newValue = value.includes(education.value)
                                                    ? value.filter((item) => item !== education.value)
                                                    : [...value, education.value];
                                                onChange(newValue);
                                            }}
                                        >
                                            <Text style={styles.checkboxLabel}>{education.label}</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    />
                </View>

                {/* Field of Study Section */}
                {/* <View style={styles.searchContainer}>
                    <Text style={styles.redText}>Field of Study</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            {["1", "2", "3"].some((v) => control._formValues.education?.includes(v)) ? (
                                <Controller
                                    control={control}
                                    name="fieldOfStudy"
                                    render={({ field: { onChange, value } }) => (
                                        <Dropdown
                                            style={styles.dropdown}
                                            placeholderStyle={styles.placeholderStyle}
                                            selectedTextStyle={styles.selectedTextStyle}
                                            data={fieldOfStudyOptions} // Dynamically loaded options
                                            maxHeight={180}
                                            labelField="label"
                                            valueField="value"
                                            placeholder="Select Field of Study"
                                            value={value}
                                            onChange={(item) => {
                                                onChange(item.value); // Update field value
                                            }}
                                        />
                                    )}
                                />
                            ) : (
                                <Controller
                                    control={control}
                                    name="fieldOfStudyText"
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter Field of Study"
                                            value={value || ""}
                                            onChangeText={onChange}
                                        />
                                    )}
                                />
                            )}
                            {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
                        </View>
                    </View>
                </View> */}


                <View style={styles.searchContainer}>
                    {/* <Text style={styles.redText}>Field of Study</Text> */}
                    {/* Field of Study Section */}
                    <View style={styles.checkContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <Pressable
                                style={[
                                    styles.checkboxBase,
                                    (fieldOfStudySelected?.length === fieldOfStudyOptions.length && fieldOfStudyOptions.length > 0) && styles.checkboxChecked,
                                ]}
                                onPress={() => {
                                    const allValues = fieldOfStudyOptions.map(opt => opt.value);
                                    if (fieldOfStudySelected?.length === fieldOfStudyOptions.length) {
                                        setValue("fieldOfStudy", []);
                                    } else {
                                        setValue("fieldOfStudy", allValues);
                                    }
                                }}
                            >
                                {(fieldOfStudySelected?.length === fieldOfStudyOptions.length && fieldOfStudyOptions.length > 0) && (
                                    <Ionicons name="checkmark" size={14} color="white" />
                                )}
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    const allValues = fieldOfStudyOptions.map(opt => opt.value);
                                    if (fieldOfStudySelected?.length === fieldOfStudyOptions.length) {
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
                                                    value?.includes(field.value) && styles.checkboxChecked,
                                                ]}
                                                onPress={() => {
                                                    const newValue = value?.includes(field.value)
                                                        ? value.filter((item) => item !== field.value) // Remove if already selected
                                                        : [...(value || []), field.value]; // Add if not selected
                                                    onChange(newValue);
                                                }}
                                            >
                                                {value?.includes(field.value) && (
                                                    <Ionicons name="checkmark" size={14} color="white" />
                                                )}
                                            </Pressable>
                                            <Pressable
                                                onPress={() => {
                                                    const newValue = value?.includes(field.value)
                                                        ? value.filter((item) => item !== field.value)
                                                        : [...(value || []), field.value];
                                                    onChange(newValue);
                                                }}
                                            >
                                                <Text style={styles.checkboxLabel}>{field.label}</Text>
                                            </Pressable>
                                        </View>
                                    ))}
                                </View>
                            )}
                        />
                        {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
                    </View>
                </View>







                {/* Profession */}
                <View style={styles.checkContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Pressable
                            style={[
                                styles.checkboxBase,
                                (watch("profession")?.length === professionalPreferences.length && professionalPreferences.length > 0) && styles.checkboxChecked,
                            ]}
                            onPress={() => {
                                const allValues = professionalPreferences.map(opt => opt.value);
                                if (watch("profession")?.length === professionalPreferences.length) {
                                    setValue("profession", []);
                                } else {
                                    setValue("profession", allValues);
                                }
                            }}
                        >
                            {(watch("profession")?.length === professionalPreferences.length && professionalPreferences.length > 0) && (
                                <Ionicons name="checkmark" size={14} color="white" />
                            )}
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                const allValues = professionalPreferences.map(opt => opt.value);
                                if (watch("profession")?.length === professionalPreferences.length) {
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
                        rules={{ required: "Please select at least one profession" }}
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxDivColFlex}>
                                {professionalPreferences.map((profession) => (
                                    <View key={profession.value} style={styles.checkboxContainer}>
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
                                        <Pressable
                                            onPress={() => {
                                                const newValue = value.includes(profession.value)
                                                    ? value.filter((item) => item !== profession.value)
                                                    : [...value, profession.value];
                                                onChange(newValue);
                                            }}
                                        >
                                            <Text style={styles.checkboxLabel}>{profession.label}</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    />
                    {/* {errors.profession && <Text style={styles.errorTextCheckBox}>{errors.profession.message}</Text>} */}
                </View>

                {/* Annual Income */}
                {/* <View style={styles.checkContainer}>
                    <Text style={styles.checkRedText}>Annual Income</Text>
                    <Controller
                        control={control}
                        name="annualIncome"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxDivColFlex}>
                                {annualIncomeOptions.map((income) => (
                                    <View key={income.value} style={styles.checkboxContainer}>
                                        <Pressable
                                            style={[
                                                styles.checkboxBase,
                                                value.includes(income.value) && styles.checkboxChecked,
                                            ]}
                                            onPress={() => {
                                                const newValue = value.includes(income.value)
                                                    ? value.filter((item) => item !== income.value)
                                                    : [...value, income.value];
                                                onChange(newValue);
                                            }}
                                        >
                                            {value.includes(income.value) && (
                                                <Ionicons name="checkmark" size={14} color="white" />
                                            )}
                                        </Pressable>
                                        <Pressable onPress={() => {
                                            const newValue = value.includes(income.value)
                                                ? value.filter((item) => item !== income.value)
                                                : [...value, income.value];
                                            onChange(newValue);
                                        }}>
                                            <Text style={styles.checkboxLabel}>{income.label}</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    />
                    {errors.annualIncome && <Text style={styles.errorTextCheckBox}>{errors.annualIncome.message}</Text>}
                </View> */}


                <View style={styles.searchContainer1}>
                    <Text style={styles.redText1}>Annual Income Min</Text>
                    <View style={styles.formContainer1}>
                        <View style={styles.inputContainer1}>
                            <Controller
                                control={control}
                                name="annualIncome"
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        style={styles.dropdown}
                                        placeholderStyle={styles.placeholderStyle}
                                        selectedTextStyle={styles.selectedTextStyle}
                                        data={annualIncomeOptions} // Use the annualIncomeOptions array
                                        maxHeight={180}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Select min Annual Income"
                                        value={value}
                                        onChange={(item) => {
                                            onChange(item.value);
                                        }}
                                    />
                                )}
                            />
                            {/* {errors.annualIncome && <Text style={styles.errorText}>{errors.annualIncome.message}</Text>} */}
                        </View>
                    </View>
                </View>


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
                                        data={annualIncomeOptions} // Use the annualIncomeOptions array
                                        maxHeight={180}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Select max Annual Income"
                                        value={value}
                                        onChange={(item) => {
                                            onChange(item.value);
                                        }}
                                    />
                                )}
                            />
                            {/* {errors.annualIncome && <Text style={styles.errorText}>{errors.annualIncome.message}</Text>} */}
                        </View>
                    </View>
                </View>



                {/* Native State */}
                {/* <View style={styles.checkContainer}>
                    <Text style={styles.checkRedText}>Native State</Text>
                    <Controller
                        control={control}
                        name="nativeState"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxDivColFlex}>
                                {['TamilNadu & Pondicherry', 'Karnataka'].map((state) => (
                                    <View key={state} style={styles.checkboxContainer}>
                                        <Pressable
                                            style={[
                                                styles.checkboxBase,
                                                value.includes(state) && styles.checkboxChecked,
                                            ]}
                                            onPress={() => {
                                                const newValue = value.includes(state)
                                                    ? value.filter((item) => item !== state)
                                                    : [...value, state];
                                                onChange(newValue);
                                            }}
                                        >
                                            {value.includes(state) && (
                                                <Ionicons name="checkmark" size={14} color="white" />
                                            )}
                                        </Pressable>
                                        <Pressable onPress={() => {
                                            const newValue = value.includes(state)
                                                ? value.filter((item) => item !== state)
                                                : [...value, state];
                                            onChange(newValue);
                                        }}>
                                            <Text style={styles.checkboxLabel}>{state}</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    />
                    {errors.nativeState && <Text style={styles.errorTextCheckBox}>{errors.nativeState.message}</Text>}
                </View> */}

                {/* Dhosam */}
                {/* <View style={styles.checkContainer}>
                    <Text style={styles.checkRedText}>Dhosam</Text>
                    <Controller
                        control={control}
                        name="dhosam"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxDivFlex}>
                                {['Chevvai', 'Rehu', 'None'].map((dhosam) => (
                                    <View key={dhosam} style={styles.checkboxContainer}>
                                        <Pressable
                                            style={[
                                                styles.checkboxBase,
                                                value.includes(dhosam) && styles.checkboxChecked,
                                            ]}
                                            onPress={() => {
                                                const newValue = value.includes(dhosam)
                                                    ? value.filter((item) => item !== dhosam)
                                                    : [...value, dhosam];
                                                onChange(newValue);
                                            }}
                                        >
                                            {value.includes(dhosam) && (
                                                <Ionicons name="checkmark" size={14} color="white" />
                                            )}
                                        </Pressable>
                                        <Pressable onPress={() => {
                                            const newValue = value.includes(dhosam)
                                                ? value.filter((item) => item !== dhosam)
                                                : [...value, dhosam];
                                            onChange(newValue);
                                        }}>
                                            <Text style={styles.checkboxLabel}>{dhosam}</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    />
                    {errors.dhosam && <Text style={styles.errorTextCheckBox}>{errors.dhosam.message}</Text>}
                </View> */}


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
                                        placeholderStyle={styles.placeholderStyle}
                                        selectedTextStyle={styles.selectedTextStyle}
                                        data={[
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
                            {/* {errors.chevvai && <Text style={styles.errorText}>{errors.chevvai.message}</Text>} */}
                        </View>
                    </View>
                </View>

                {/* Rehu Dropdown */}
                <View style={styles.searchContainer}>
                    <Text style={styles.redText}>Rehu</Text>
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Controller
                                control={control}
                                name="rehu"
                                render={({ field: { onChange, value } }) => (
                                    <Dropdown
                                        style={styles.dropdown}
                                        placeholderStyle={styles.placeholderStyle}
                                        selectedTextStyle={styles.selectedTextStyle}
                                        data={[
                                            { label: "Yes", value: "Yes" },
                                            { label: "No", value: "No" },
                                            { label: "Both", value: "Both" }
                                        ]}
                                        maxHeight={180}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Select Rehu"
                                        value={value}
                                        onChange={(item) => {
                                            onChange(item.value);
                                        }}
                                    />
                                )}
                            />
                            {/* {errors.rehu && <Text style={styles.errorText}>{errors.rehu.message}</Text>} */}
                        </View>
                    </View>
                </View>


                {/* <View style={styles.checkContainer}>
                    {matchStars.length > 0 ? (
                        matchStars
                            .sort((a, b) => b[0].match_count - a[0].match_count) // Sort by match_count
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
                                        initialPoruthas={`No of porutham ${matchCountValue}`}
                                        starAndRasi={starAndRasi}
                                        selectedStarIds={selectedStarIds}
                                        onCheckboxChange={handleCheckboxChange}
                                    />
                                );
                            })
                    ) : (
                        <Text>No match stars available</Text>
                    )}
                </View> */}

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
                                        placeholderStyle={styles.placeholderStyle}
                                        selectedTextStyle={styles.selectedTextStyle}
                                        data={foreignInterest}
                                        maxHeight={180}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Select your Foreign Interest"
                                        value={value}
                                        onChange={(item) => {
                                            onChange(item.value);
                                        }}
                                    />
                                )}
                            />
                            {/* {errors.foreignInterest && <Text style={styles.errorText}>{errors.foreignInterest.message}</Text>} */}
                        </View>

                    </View>
                </View>

                {/* <Text style={styles.redText}>Matching Stars</Text> */}

                <View style={styles.checkContainer}>
                    {matchStars.length > 0 ? (
                        matchStars
                            .sort((a, b) => b[0].match_count - a[0].match_count) // Sort by match_count
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
                                        matchCountValue={matchCountValue} // Pass matchCountValue
                                        starAndRasi={starAndRasi}
                                        selectedStarIds={selectedStarIds}
                                        onCheckboxChange={handleCheckboxChange}
                                    />
                                );
                            })
                    ) : (
                        <Text>No match stars available</Text>
                    )}
                </View>



                {/* Foreign Interest */}


                {/* Porutham */}


                {/* Work Location */}
                {/* <View style={styles.inputContainer}>
                    <Text style={styles.redText}>Work Location</Text>
                    <View style={styles.formContainer}>
                        <Controller
                            control={control}
                            name="workLocation"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    style={styles.inputFlex}
                                    placeholder="Work Location"
                                    value={value}
                                    onChangeText={onChange}
                                />
                            )}
                        />
                        {errors.workLocation && <Text style={styles.errorText}>{errors.workLocation.message}</Text>}
                    </View>
                </View> */}

                {/* Profile Photo */}
                {/* <View style={styles.inputContainer}>
                    <Text style={styles.redTextLabel}>Profile Photo</Text>
                    <View style={styles.formContainer}>
                        <Controller
                            control={control}
                            name="profilePhoto"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.checkboxContainer}>
                                    <Pressable
                                        style={[
                                            styles.checkboxBase,
                                            value && styles.checkboxChecked,
                                        ]}
                                        onPress={() => onChange(!value)}
                                    >
                                        {value && (
                                            <Ionicons name="checkmark" size={14} color="white" />
                                        )}
                                    </Pressable>
                                    <Pressable onPress={() => onChange(!value)}>
                                        <Text style={styles.checkboxLabel}>Don't Show Profile Photo</Text>
                                    </Pressable>
                                </View>
                            )}
                        />
                    </View>
                </View> */}

                {/* Find Match Button */}
                <View style={styles.formContainer}>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={handleSubmit((data) => {
                            console.log("Button pressed"); // Log when button is pressed
                            onSubmit(data);
                        })}
                        disabled={submitting} // Disable button when submitting
                    >
                        <LinearGradient
                            colors={["#bd1225ff", "#FF4050"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            useAngle={true}
                            angle={92.08}
                            angleCenter={{ x: 0.5, y: 0.5 }}
                            style={styles.linearGradient}
                        >
                            <View style={styles.loginContainer}>
                                {/* <Text style={styles.login}>Find Match</Text> */}
                                <Text style={styles.login}>{submitting ? "Submitting..." : "Find Match"}</Text>
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

    formContainer: {
        width: "100%",
        paddingHorizontal: 20,
        // flexDirection: "row",
        // alignItems: "center",
    },

    inputContainer: {
        width: "100%",
        marginBottom: 20,
        // marginBottom: 24,
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
        fontFamily: "inter",
    },

    placeholderStyle: {
        fontSize: 14,
    },

    selectedTextStyle: {
        fontSize: 14,
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
        // marginBottom: 15,
        textAlign: "left",
    },

    redText: {
        color: "#535665",
        fontSize: 20,
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
        fontWeight: "700",
        fontFamily: "inter",
        alignSelf: "flex-start",
        // paddingHorizontal: 10,
        marginBottom: 10,
        marginTop: 7
    },

    checkboxDivFlex: {
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
        width: "80%",
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
        backgroundColor: "#146ff4",
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

    btn: {
        width: "100%",
        alignSelf: "center",
        borderRadius: 6,
        // shadowColor: "#EE1E2440",
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.2,
        // shadowRadius: 6,
        // elevation: 5,
        // marginTop: 15,
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
    },

    searchContainer1: {
        width: "100%",
        // marginBottom: 15,
        textAlign: "left",
    },

    redText1: {
        color: "#535665",
        fontSize: 20,
        fontWeight: "700",
        fontFamily: "inter",
        alignSelf: "flex-start",
        paddingHorizontal: 20,
        // paddingHorizontal: 20,
        // marginBottom: 10,
    },


    formContainer1: {
        width: "100%",
        paddingHorizontal: 20,
        // flexDirection: "row",
        // alignItems: "center",
    },

    inputContainer1: {
        width: "100%",
        marginBottom: 20,
        // marginBottom: 24,
    },

});