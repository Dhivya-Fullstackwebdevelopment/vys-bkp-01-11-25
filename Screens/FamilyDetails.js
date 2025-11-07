import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios"; // Import axios
import config from "../API/Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tooltip, Icon } from "react-native-elements"; // Install react-native-elements for the Tooltip component if not already installed

const bloodGroupOptions = [
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
];


const bodytype = [
  { label: 'Slim', value: 'Slim' },
  { label: 'Fat', value: 'Fat' },
  { label: 'Normal', value: 'Normal' },
];

const eyewearOptions = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
];



// Zod schema for form validation
export const FamilyDetails = () => {
  const scrollViewRef = useRef(null); // For ScrollView
  const inputRefs = useRef({}); // For input fields


  const schema = z.object({
    fatherName: z.string().min(1, "Father's Name is required"),
    moValue: z.string().optional(),
    foValue: z.string().optional(),
    brotherValue: z.string().optional(),
    sisterValue: z.string().optional(),
    brotherMarriedValue: z.string().optional(),  // Initially optional
    sisterMarriedValue: z.string().optional(),  // Initially optional
    ftValue: z.string().optional(),
    fvValue: z.string().optional(),
    fsValue: z.string().optional(),
    // motherName: z.string().min(1, "Mother's Name is required"),
    motherName: z.string().optional(),
    myhobbies: z.string().optional(),
    AboutMyself: z.string().optional(),
    familyName: z.string().optional(),
    bloodGroup: z.string().optional(),
    bodytype: z.string().optional(),
    eyewear: z.string().optional(),
    weight: z.string().optional(),
    suyaGothram: z.string().min(1, "suyaGothram is required"),
    noOfChildren: z.string().optional(),
    fatherAlive: z.string().optional(),
    motherAlive: z.string().optional(),
    propertyDetails: z.string().optional(),
    propertyWorth: z.string().optional(),
    uncleGothram: z.string().optional(),
    ancestorOrigin: z.string().optional(),
    aboutFamily: z.string().optional(),
  })
  // .refine((data) => {
  //   // Check if brotherValue is greater than or equal to 1, then brotherMarriedValue must be required
  //   if (parseInt(data.brotherValue) >= 1) {
  //     return data.brotherMarriedValue && data.brotherMarriedValue.length > 0;
  //   }
  //   return true;  // If brotherValue < 1, skip validation
  // }, {
  //   path: ["brotherMarriedValue"],  // Specify the path for the error
  //   message: "Brother Married field is required"
  // })
  // .refine((data) => {
  //   // Check if sisterValue is greater than or equal to 1, then sisterMarriedValue must be required
  //   if (parseInt(data.sisterValue) >= 1) {
  //     return data.sisterMarriedValue && data.sisterMarriedValue.length > 0;
  //   }
  //   return true;  // If sisterValue < 1, skip validation
  // }, {
  //   path: ["sisterMarriedValue"],  // Specify the path for the error
  //   message: "Sister Married field is required"
  // });


  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    handleKeyDown
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fatherName: "",
      moValue: "",
      foValue: "",
      brotherValue: "",
      brotherMarriedValue: "",
      sisterValue: "",
      sisterMarriedValue: "",
      ftValue: "",
      fvValue: "",
      fsValue: "",
      motherName: "",
      propertyDetails: "",
      propertyWorth: "",
      suyaGothram: "",
      uncleGothram: "",
      ancestorOrigin: "",
      aboutFamily: "",
      myhobbies: "",
      AboutMyself: "",
      familyName: "",
      bloodGroup: "",
      weight: "",  // Set initial value to an empty string or "0"
      bodytype: "",  // Set initial value to an empty string or "0"
      eyewear: "",  // Set initial value to an empty string or "0"
      noOfChildren: "",
      fatherAlive: "yes",
      motherAlive: "yes",
    },
  });


  const navigation = useNavigation();

  const [showBrotherMarried, setShowBrotherMarried] = useState(false);
  const [showSisterMarried, setShowSisterMarried] = useState(false);
  const [physicallyChallenged, setPhysicallyChallenged] = useState('no');
  const [showPhysicallyChallengedDetails, setShowPhysicallyChallengedDetails] = useState(false);
  const [foOccupationOptions, setFoOccupationOptions] = useState([]);
  const [moOccupationOptions, setMoOccupationOptions] = useState([]);
  const [propertyWorthOptions, setPropertyWorth] = useState([]);
  const [familyTypeOptions, setFamilyType] = useState([]);
  const [familyStatusOptions, setFamilyStatus] = useState([]);
  const [familyValueOptions, setFamilyValues] = useState([]);
  const [MobileNo, setMobileNo] = useState("");
  const [ProfileId, setProfileId] = useState("");
  const [ProfileOwner, setProfileOwner] = useState("");
  const [isTooltipVisible, setTooltipVisible] = useState(false); // Manage Tooltip visibility
  const [submitting, setSubmitting] = useState(false); // Add state to track submission
  const [maritalStatus, setMaritalStatus] = useState(""); // <-- Add state for marital status

  useEffect(() => {
    retrieveDataFromSession();
    fetchParentOccupations();
    fetchPropertyworth();
    fetchFamilyType();
    fetchFamilyStatus();
    fetchFamilyValue();

  }, []);


  const retrieveDataFromSession = async () => {
    try {
      let profileValue = await AsyncStorage.getItem("profile_owner");
      const profileId = await AsyncStorage.getItem("profile_id");
      const mobileno = await AsyncStorage.getItem("Mobile_no");
      const maritalStatusValue = await AsyncStorage.getItem("martial_status"); // <-- Get marital status

      // Replace "ownself" with "yourself"
      profileValue = profileValue === "Ownself" ? "yourself" : profileValue;

      setMobileNo(mobileno);
      setProfileId(profileId);
      setProfileOwner(profileValue);
      setMaritalStatus(maritalStatusValue); // <-- Set marital status

      console.log("Retrieved Profile Value:", profileValue);
      console.log("Retrieved Profile ID:", profileId);
      console.log("Retrieved Mobile No:", mobileno);
      console.log("Retrieved Marital Status:", maritalStatusValue);
    } catch (error) {
      console.error("Error retrieving data from session:", error);
    }
  };

  const fetchParentOccupations = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Parent_Occupation/`);
      const ParentOccupationArray = Object.keys(response.data).map(key => ({
        label: response.data[key].occupation_description,
        value: response.data[key].occupation_id.toString(),
      }));
      setFoOccupationOptions(ParentOccupationArray);
      setMoOccupationOptions(ParentOccupationArray);
    } catch (error) {
      console.error("Error fetching Occupation:", error);
    }
  };

  const fetchPropertyworth = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Property_Worth/`);
      const PropertyWorthArray = Object.keys(response.data).map(key => ({
        label: response.data[key].property_description,
        value: response.data[key].property_id.toString(),
      }));
      setPropertyWorth(PropertyWorthArray);
    } catch (error) {
      console.error("Error fetching Property Worth:", error);
    }
  };

  const fetchFamilyType = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_FamilyType/`);
      const FamilyTypeArray = Object.keys(response.data).map(key => ({
        label: response.data[key].family_description,
        value: response.data[key].family_id.toString(),
      }));
      setFamilyType(FamilyTypeArray);
    } catch (error) {
      console.error("Error fetching Family type:", error);
    }
  };


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


  const fetchFamilyValue = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_FamilyValue/`);
      const FamilyValueArray = Object.keys(response.data).map(key => ({
        label: response.data[key].family_value_name,
        value: response.data[key].family_value_id.toString(),
      }));
      setFamilyValues(FamilyValueArray);
    } catch (error) {
      console.error("Error fetching Family Value:", error);
    }
  };

  const scrollToError = (errorField) => {
    if (errorField && inputRefs.current[errorField]) {
      // Scroll to the specific input field
      inputRefs.current[errorField].focus(); // Focus on the field
      scrollViewRef.current?.scrollTo({
        y: inputRefs.current[errorField].offsetTop - 50, // Adjust offset if needed
        animated: true,
      });
    } else {
      // Scroll to the top of the page
      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    }
  };

  const onError = (errors) => {
    if (errors.fatherName || errors.motherName) {
      // Scroll to the top of the page
      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    } else {
      // Scroll to the first field with an error
      const firstErrorField = Object.keys(errors)[0];
      scrollToError(firstErrorField);
    }
  };

  const fetchExistingFamilyData = async () => {
    try {
      const profileId = await AsyncStorage.getItem("profile_id_new");
      if (!profileId) return;

      const response = await axios.post(`${config.apiUrl}/auth/Get_Family_Details/`, {
        profile_id: profileId
      });

      if (response.data.Status === 1 && response.data.family_details) {
        const familyData = response.data.family_details;
        setExistingFamilyData(familyData);

        // Pre-fill form with existing data
        setValue("fatherName", familyData.father_name || "");
        setValue("foValue", familyData.father_occupation || "");
        setValue("motherName", familyData.mother_name || "");
        setValue("moValue", familyData.mother_occupation || "");
        setValue("familyName", familyData.family_name || "");
        setValue("suyaGothram", familyData.suya_gothram || "");
        setValue("myhobbies", familyData.hobbies || "");
        setValue("AboutMyself", familyData.about_self || "");
        setValue("bloodGroup", familyData.blood_group || "");
        setValue("weight", familyData.weight ? familyData.weight.toString() : "");
        setValue("bodytype", familyData.bodytype || "");
        setValue("eyewear", familyData.eyewear || "");
        setValue("brotherValue", familyData.no_of_brother ? familyData.no_of_brother.toString() : "0");
        setValue("brotherMarriedValue", familyData.no_of_bro_married ? familyData.no_of_bro_married.toString() : "0");
        setValue("sisterValue", familyData.no_of_sister ? familyData.no_of_sister.toString() : "0");
        setValue("sisterMarriedValue", familyData.no_of_sis_married ? familyData.no_of_sis_married.toString() : "0");
        setValue("ftValue", familyData.family_type || "");
        setValue("fvValue", familyData.family_value || "");
        setValue("fsValue", familyData.family_status || "");
        setValue("propertyWorth", familyData.property_worth || "");
        setValue("uncleGothram", familyData.uncle_gothram || "");
        setValue("ancestorOrigin", familyData.ancestor_origin || "");
        setValue("aboutFamily", familyData.about_family || "");
        setValue("noOfChildren", familyData.no_of_children ? familyData.no_of_children.toString() : "");

        // Set father and mother alive status
        setValue("fatherAlive", familyData.father_alive === "no" ? "no" : "yes");
        setValue("motherAlive", familyData.mother_alive === "no" ? "no" : "yes");

        // Set physically challenged
        setPhysicallyChallenged(familyData.Pysically_changed === "yes" ? "yes" : "no");
        setShowPhysicallyChallengedDetails(familyData.Pysically_changed === "yes");
      }
    } catch (error) {
      console.error("Error fetching existing family data:", error);
    }
  };

  const onSubmit = async (data) => {
    console.log("hii");
    try {
      setSubmitting(true); // Set submitting state to true

      // Format the data as expected by the backend
      const profileId = await AsyncStorage.getItem("profile_id_new");
      if (!profileId) {
        throw new Error("ProfileId not found in sessionStorage");
      }
      const formattedData = {
        profile_id: profileId, // Replace with actual profile ID
        father_name: data.fatherName,
        father_occupation: data.foValue,
        mother_name: data.motherName,
        mother_occupation: data.moValue,
        family_name: data.familyName,
        about_self: data.AboutMyself,
        hobbies: data.myhobbies,
        blood_group: data.bloodGroup,
        Pysically_changed: physicallyChallenged,
        no_of_brother: data.brotherValue || 0,
        no_of_bro_married: data.brotherMarriedValue || 0,
        no_of_sister: data.sisterValue || 0,
        no_of_sis_married: data.sisterMarriedValue || 0,
        family_type: data.ftValue,
        family_value: data.fvValue,
        family_status: data.fsValue,
        property_worth: data.propertyWorth,
        ancestor_origin: data.ancestorOrigin,
        uncle_gothram: data.uncleGothram,
        suya_gothram: data.suyaGothram,
        weight: data.weight,
        bodytype: data.bodytype,
        eyewear: data.eyewear,
        // Include other fields as necessary
        no_of_children: data.noOfChildren || "0", // <-- Add no_of_children if present
        father_alive: data.fatherAlive || "yes", // Add father_alive
        mother_alive: data.motherAlive || "yes", // Add mother_alive
        property_details: data.propertyDetails,
        about_family: data.aboutFamily,
      };

      console.log("Formatted Data:", formattedData);


      console.log("Formatted Data:", formattedData);

      const response = await axios.post(`${config.apiUrl}/auth/Family_registration/`, formattedData);

      if (response.data.Status === 1) {
        navigation.navigate("EduDetails");
      } else {
        // Handle error or show message to the user
        console.error("Error: Response status is not 1", response.data);
      }
    } catch (error) {
      console.error("Error submitting form data:", error);
    }
    finally {
      setSubmitting(false); // Reset submitting state after API call
    }
  };

  const brotherValue = watch("brotherValue");
  const sisterValue = watch("sisterValue");

  useEffect(() => {
    console.log("brotherValue changed to:", brotherValue);
    setShowBrotherMarried(parseInt(brotherValue) >= 1);
  }, [brotherValue]);

  useEffect(() => {
    console.log("sisterValue changed to:", sisterValue);
    setShowSisterMarried(parseInt(sisterValue) >= 1);
  }, [sisterValue]);

  const renderOptions = (maxValue) => {
    const options = [];
    for (let i = 0; i <= maxValue; i++) {
      options.push({ value: i.toString(), label: i === 5 ? "5+" : i.toString() });
    }
    return options;
  };


  return (
    <ScrollView ref={scrollViewRef}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.familyHead}>Family Details</Text>
        <View style={styles.formContainer}>
          {/* Father Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Father Name<Text style={styles.redText}>*</Text>
            </Text>
            <Controller
              control={control}
              name="fatherName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  ref={(el) => (inputRefs.current.fatherName = el)}
                  style={styles.input}
                  placeholder=""
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.fatherName && (
              <Text style={styles.error}>{errors.fatherName.message}</Text>
            )}
          </View>

          {/* Father Occupation */}
          {/* <View style={styles.inputContainer}>
            <Text style={styles.label}>Father Occupation</Text>
            <Controller
              control={control}
              name="foValue"
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  data={foOccupationOptions}
                  maxHeight={180}
                  labelField="label"
                  valueField="value"
                  placeholder="Occupation"
                  value={value}
                  onChange={(item) => onChange(item.value)}
                />
              )}
            />
            {errors.foValue && (
              <Text style={styles.error}>{errors.foValue.message}</Text>
            )}
          </View> */}



          <View style={styles.inputContainer}>
            <Text style={styles.label}>Father Occupation</Text>
            <Controller
              control={control}
              name="foValue"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input} // Add your input style here
                  placeholder="Occupation" // Placeholder text
                  value={value}
                  onChangeText={onChange} // Update the occupation value
                />
              )}
            />
            {/* {errors.foValue && (
              <Text style={styles.error}>{errors.foValue.message}</Text>
            )} */}
          </View>

          {/* Mother Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Mother Name<Text style={styles.redText}></Text>
            </Text>
            <Controller
              control={control}
              name="motherName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder=""
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.motherName && (
              <Text style={styles.error}>{errors.motherName.message}</Text>
            )}
          </View>

          {/* Mother Occupation */}
          {/* <View style={styles.inputContainer}>
            <Text style={styles.label}>Mother Occupation</Text>
            <Controller
              control={control}
              name="moValue"
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  data={moOccupationOptions}
                  maxHeight={180}
                  labelField="label"
                  valueField="value"
                  placeholder="Occupation"
                  value={value}
                  onChange={(item) => onChange(item.value)}
                />
              )}
            />
            {errors.moValue && (
              <Text style={styles.error}>{errors.moValue.message}</Text>
            )}
          </View> */}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mother Occupation</Text>
            <Controller
              control={control}
              name="moValue"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input} // Add your input styles here
                  placeholder="Enter occupation"
                  value={value}
                  onChangeText={onChange} // Update the value on text change
                />
              )}
            />
            {/* {errors.moValue && (
              <Text style={styles.error}>{errors.moValue.message}</Text>
            )} */}
          </View>


          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Family Name<Text style={styles.redText}></Text>
            </Text>
            <Controller
              control={control}
              name="familyName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder=""
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {/* {errors.familyName && (
              <Text style={styles.error}>{errors.familyName.message}</Text>
            )} */}
          </View>

          {/* Suya Gothram */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Suya Gothram<Text style={styles.redText}>*</Text>
            </Text>
            <Controller
              control={control}
              name="suyaGothram"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder=""
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.suyaGothram && (
              <Text style={styles.error}>{errors.suyaGothram.message}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>My Hobbies</Text>
            <Controller
              control={control}
              name="myhobbies"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.inputTextarea]} // Add custom styles for text area
                  placeholder="Enter your hobbies..."
                  multiline={true}
                  numberOfLines={4} // Adjust as needed
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {/* {errors.myhobbies && (
              <Text style={styles.error}>{errors.myhobbies.message}</Text>
            )} */}
          </View>



          <View style={styles.inputContainer}>
            <Text style={styles.label}>About Myself</Text>
            <Controller
              control={control}
              name="AboutMyself"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.inputTextarea]} // Add custom styles for text area
                  placeholder="Enter About Yourself..."
                  multiline={true}
                  numberOfLines={4} // Adjust as needed
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {/* {errors.AboutMyself && (
              <Text style={styles.error}>{errors.AboutMyself.message}</Text>
            )} */}
          </View>


          {/* Physically Challenged  */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Physically Challenged ?</Text>
            <View style={styles.radioButtonContainer}>

              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    physicallyChallenged === 'yes' && styles.radioButtonSelected,
                  ]}
                  onPress={() => {
                    setPhysicallyChallenged('yes');
                    setShowPhysicallyChallengedDetails(true);
                  }}
                >
                  {physicallyChallenged === 'yes' && <View style={styles.innerCircle} />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setPhysicallyChallenged('yes');
                    setShowPhysicallyChallengedDetails(true);
                  }}
                >
                  <Text style={styles.radioLabel}>Yes</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    physicallyChallenged === 'no' && styles.radioButtonSelected,
                  ]}
                  onPress={() => {
                    setPhysicallyChallenged('no');
                    setShowPhysicallyChallengedDetails(false);
                  }}
                >
                  {physicallyChallenged === 'no' && <View style={styles.innerCircle} />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setPhysicallyChallenged('no');
                    setShowPhysicallyChallengedDetails(false);
                  }}
                >
                  <Text style={styles.radioLabel}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {showPhysicallyChallengedDetails && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Details</Text>
              <Controller
                control={control}
                name="physicallyChallengedDetails"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Details..."
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {/* {errors.physicallyChallengedDetails && (
                <Text style={styles.error}>{errors.physicallyChallengedDetails.message}</Text>
              )} */}
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Father Alive</Text>
            <Controller
              control={control}
              name="fatherAlive"
              render={({ field: { onChange, value } }) => (
                <View style={styles.radioButtonContainer}>
                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        value === 'yes' && styles.radioButtonSelected,
                      ]}
                      onPress={() => onChange('yes')}
                    >
                      {value === 'yes' && <View style={styles.innerCircle} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onChange('yes')}
                    >
                      <Text style={styles.radioLabel}>Yes</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        value === 'no' && styles.radioButtonSelected,
                      ]}
                      onPress={() => onChange('no')}
                    >
                      {value === 'no' && <View style={styles.innerCircle} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onChange('no')}
                    >
                      <Text style={styles.radioLabel}>No</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mother Alive</Text>
            <Controller
              control={control}
              name="motherAlive"
              render={({ field: { onChange, value } }) => (
                <View style={styles.radioButtonContainer}>
                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        value === 'yes' && styles.radioButtonSelected,
                      ]}
                      onPress={() => onChange('yes')}
                    >
                      {value === 'yes' && <View style={styles.innerCircle} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onChange('yes')}
                    >
                      <Text style={styles.radioLabel}>Yes</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        value === 'no' && styles.radioButtonSelected,
                      ]}
                      onPress={() => onChange('no')}
                    >
                      {value === 'no' && <View style={styles.innerCircle} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onChange('no')}
                    >
                      <Text style={styles.radioLabel}>No</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>

          {/* Weight Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Weight (kg)</Text>
            <Controller
              name="weight"
              control={control}
              rules={{
                validate: (value) => {
                  if (!value) return true; // Allow optional
                  if (String(value).length > 3) return "Weight can only be up to 3 digits";
                  if (Number(value) > 150) return "Weight must be below 150";
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={String(value)}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  maxLength={3}
                  onKeyPress={handleKeyDown}
                />
              )}
            />
            {errors.weight && <Text style={styles.errorText}>{errors.weight.message}</Text>}
          </View>



          <View style={styles.inputContainer}>
            <Text style={styles.label}>Body Type</Text>
            <Controller
              name="bodytype"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  placeholder="Select Body Type"
                  data={bodytype}
                  labelField="label"
                  valueField="value"
                  value={value}
                  onChange={(item) => onChange(item.value)} // Update selected value
                />
              )}
            />
          </View>

          {/* Eye Wear Field with Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Eye Wear</Text>
            <Controller
              name="eyewear"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  placeholder="Select Eye Wear"
                  data={eyewearOptions}
                  labelField="label"
                  valueField="value"
                  value={value}
                  onChange={(item) => onChange(item.value)} // Update selected value
                />
              )}
            />
          </View>



          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Blood Group<Text style={styles.redText}></Text>
            </Text>
            <Controller
              control={control}
              name="bloodGroup"
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  placeholder="Select Blood Group"
                  data={bloodGroupOptions}
                  labelField="label"
                  valueField="value"
                  value={value}
                  onChange={(item) => onChange(item.value)}
                />
              )}
            />
            {/* {errors.bloodGroup && (
              <Text style={styles.error}>{errors.bloodGroup.message}</Text>
            )} */}
          </View>

          {/* No. of Children (conditionally rendered) */}
          {['2', '3', '5'].includes(maritalStatus) && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>No. of Children</Text>
              <Controller
                control={control}
                name="noOfChildren"
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    placeholder="Select No. of Children"
                    data={[
                      { label: '1', value: '1' },
                      { label: '2', value: '2' },
                      { label: '3', value: '3' },
                      { label: '4', value: '4' },
                      { label: '5', value: '5' },
                    ]}
                    labelField="label"
                    valueField="value"
                    value={value}
                    onChange={(item) => onChange(item.value)}
                  />
                )}
              />
            </View>
          )}


          {/* Brother */}
          <View style={styles.inputBoxContainer}>
            <Text style={styles.label}>Brother</Text>
            <Controller
              control={control}
              name="brotherValue"
              render={({ field: { onChange, value } }) => (
                <View style={styles.textBoxFlex}>
                  {[0, 1, 2, 3, 4, 5].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.box,
                        value === val.toString() && styles.selectedBox,
                      ]}
                      onPress={() => onChange(val.toString())}
                    >
                      <Text
                        style={[
                          styles.boxText,
                          value === val.toString() && styles.selectedBoxText,
                        ]}
                      >
                        {val === 5 ? "5+" : val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {/* {errors.brotherValue && (
              <Text style={styles.error}>{errors.brotherValue.message}</Text>
            )} */}
          </View>


          {showBrotherMarried && (
            <View style={styles.inputBoxContainer}>
              <Text style={styles.label}>Brother Married</Text>
              <Controller
                control={control}
                name="brotherMarriedValue"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.textBoxFlex}>
                    {renderOptions(parseInt(brotherValue)).map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.box,
                          value === option.value && styles.selectedBox,
                        ]}
                        onPress={() => onChange(option.value)}
                      >
                        <Text
                          style={[
                            styles.boxText,
                            value === option.value && styles.selectedBoxText,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              {/* {errors.brotherMarriedValue && (
                <Text style={styles.error}>{errors.brotherMarriedValue.message}</Text>
              )} */}
            </View>
          )}

          <View style={styles.inputBoxContainer}>
            <Text style={styles.label}>Sister</Text>
            <Controller
              control={control}
              name="sisterValue"
              render={({ field: { onChange, value } }) => (
                <View style={styles.textBoxFlex}>
                  {[0, 1, 2, 3, 4, 5].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.box,
                        value === val.toString() && styles.selectedBox,
                      ]}
                      onPress={() => onChange(val.toString())}
                    >
                      <Text
                        style={[
                          styles.boxText,
                          value === val.toString() && styles.selectedBoxText,
                        ]}
                      >
                        {val === 5 ? "5+" : val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {/* {errors.sisterValue && (
              <Text style={styles.error}>{errors.sisterValue.message}</Text>
            )} */}
          </View>

          {showSisterMarried && (
            <View style={styles.inputBoxContainer}>
              <Text style={styles.label}>Sister Married</Text>
              <Controller
                control={control}
                name="sisterMarriedValue"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.textBoxFlex}>
                    {renderOptions(parseInt(sisterValue)).map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.box,
                          value === option.value && styles.selectedBox,
                        ]}
                        onPress={() => onChange(option.value)}
                      >
                        <Text
                          style={[
                            styles.boxText,
                            value === option.value && styles.selectedBoxText,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              {/* {errors.sisterMarriedValue && (
                <Text style={styles.error}>{errors.sisterMarriedValue.message}</Text>
              )} */}
            </View>
          )}



          {/* Family Type */}
          {/* <View style={styles.inputBoxContainer}>
            <Text style={styles.label}>Family Type</Text>
            <Controller
              control={control}
              name="ftValue"
              render={({ field: { onChange, value } }) => (
                <View style={styles.textBoxFlex}>
                  {familyTypeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.box,
                        value === option.value && styles.selectedBox,
                      ]}
                      onPress={() => onChange(option.value)}
                    >
                      <Text
                        style={[
                          styles.boxText,
                          value === option.value && styles.selectedBoxText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.ftValue && (
              <Text style={styles.error}>{errors.ftValue.message}</Text>
            )}
          </View> */}


          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Family Type<Text style={styles.redText}></Text>
            </Text>
            <Controller
              control={control}
              name="ftValue"
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  placeholder="Select Family Type"
                  data={familyTypeOptions}
                  labelField="label"
                  valueField="value"
                  value={value}
                  onChange={(item) => onChange(item.value)}
                />
              )}
            />
            {/* {errors.bloodGroup && (
              <Text style={styles.error}>{errors.bloodGroup.message}</Text>
            )} */}
          </View>


          <View style={styles.inputBoxContainer}>
            <Text style={styles.label}>Family Value</Text>
            <Controller
              control={control}
              name="fvValue"
              render={({ field: { onChange, value } }) => (
                <View style={styles.textBoxFlex}>
                  {familyValueOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.box,
                        value === option.value && styles.selectedBox,
                      ]}
                      onPress={() => onChange(option.value)}
                    >
                      <Text
                        style={[
                          styles.boxText,
                          value === option.value && styles.selectedBoxText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {/* {errors.fvValue && (
              <Text style={styles.error}>{errors.fvValue.message}</Text>
            )} */}
          </View>


          {/* Family Status */}
          {/* <View style={styles.inputContainer}>
            <Text style={styles.label}>Family Status</Text>
            <Controller
              control={control}
              name="fsValue"
              render={({ field: { onChange, value } }) => (
                <View style={styles.textBoxFlex}>
                  {familyStatusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.box,
                        value === option.value && styles.selectedBox,
                      ]}
                      onPress={() => onChange(option.value)}
                    >
                      <Text
                        style={[
                          styles.boxText,
                          value === option.value && styles.selectedBoxText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.fsValue && (
              <Text style={styles.error}>{errors.fsValue.message}</Text>
            )}
          </View> */}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Family Status</Text>
            <Controller
              control={control}
              name="fsValue"
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  data={familyStatusOptions}
                  maxHeight={180}
                  labelField="label"
                  valueField="value"
                  placeholder="Family Status"
                  value={value}
                  onChange={(item) => onChange(item.value)}
                />
              )}
            />
            {/* {errors.fsValue && (
              <Text style={styles.error}>{errors.fsValue.message}</Text>
            )} */}
          </View>


          {/* <View style={styles.inputContainer}>
            <View style={styles.labelWrapper}>
              <Text style={styles.label}>Property Details</Text>
              <Tooltip
                popover={
                  <Text>
                    Residential, Commercial, Shopping Complex, Farm House, Shop, Agriculture land, Multistorage building
                  </Text>
                }
                backgroundColor="#333"
                overlayColor="rgba(0, 0, 0, 0.5)"
                width={250}
                height={120} // Increase the height of the tooltip
                placement="top"              >
                <Icon
                  name="info"
                  type="material"
                  size={16}
                  color="#555"
                  style={styles.infoIcon}
                />
              </Tooltip>
            </View>

            <Controller
              control={control}
              name="propertyDetails"
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  placeholder="Select Property Details"
                  data={propertyWorthOptions}
                  labelField="label"
                  valueField="value"
                  value={value}
                  onChange={(item) => onChange(item.value)}
                />

              )}
            />
          </View> */}



          <View style={styles.inputContainer}>
            <View style={styles.labelWrapper}>
              <Text style={styles.label}>Property Details
                {/* Tooltip for the note icon */}

                <Tooltip
                  popover={
                    <Text style={styles.tooltipContent}>
                      Residential, Commercial, Shopping Complex, Farm House, Shop, Agriculture land, Multistorage building
                    </Text>
                  }
                  backgroundColor="#fff"
                  overlayColor="rgba(0, 0, 0, 0.5)"
                  width={250}
                  height={120} // Increase the height of the tooltip
                  placement="bottom"
                >
                  <Icon
                    name="info"
                    type="material"
                    size={16}
                    color="#555"
                    style={styles.infoIcon}
                  />
                </Tooltip>
              </Text>
            </View>

            <Controller
              control={control}
              name="propertyDetails"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input} // Replace with your TextInput styling
                  placeholder="Enter Property Details"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>



          {/* Property Details */}
          <View style={styles.inputContainer}>
            <View style={styles.labelWrapper}>

              <Text style={styles.label}>Property Worth

                <Tooltip style={styles.tooltipContent}
                  popover={
                    <Text style={styles.tooltipContent}>
                      Approx 1c, 5c, 50c, 30L, 80L, etc.,
                    </Text>
                  }
                  backgroundColor="#fff"
                  overlayColor="rgba(0, 0, 0, 0.5)"
                  width={250}
                  height={120} // Increase the height of the tooltip
                  placement="bottom"              >
                  <Icon
                    name="info"
                    type="material"
                    size={16}
                    color="#555"
                    style={styles.infoIcon}
                  />
                </Tooltip>
              </Text>

            </View>


            <Controller
              control={control}
              name="propertyWorth"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder=""
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {/* {errors.propertyDetails && (
              <Text style={styles.error}>{errors.propertyDetails.message}</Text>
            )} */}
          </View>

          {/* Property Worth */}







          {/* Uncle Gothram */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Uncle Gothram</Text>
            <Controller
              control={control}
              name="uncleGothram"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder=""
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {/* {errors.uncleGothram && (
              <Text style={styles.error}>{errors.uncleGothram.message}</Text>
            )} */}
          </View>

          {/* Ancestor Origin */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ancestor Origin</Text>
            <Controller
              control={control}
              name="ancestorOrigin"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder=""
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {/* {errors.ancestorOrigin && (
              <Text style={styles.error}>{errors.ancestorOrigin.message}</Text>
            )} */}
          </View>

          {/* About Family */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>About Family</Text>
            <Controller
              control={control}
              name="aboutFamily"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.inputTextarea]} // Add custom styles for text area
                  placeholder="Enter about your family..."
                  multiline={true}
                  numberOfLines={4} // Adjust as needed
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {/* {errors.aboutFamily && (
              <Text style={styles.error}>{errors.aboutFamily.message}</Text>
            )} */}
          </View>



          {/* Next Button */}
          <TouchableOpacity style={styles.btn} onPress={handleSubmit(onSubmit, onError)} disabled={submitting} // Disable button when submitting
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

  familyHead: {
    color: "#535665",
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
  },

  redText: {
    color: "red",
  },

  inputContainer: {
    width: "100%",
    marginBottom: 20,
    // marginBottom: 24,
  },

  inputBoxContainer: {
    marginBottom: 10,
  },

  input: {
    color: "#535665",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#D4D5D9",
    padding: 10,
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

  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },

  iconStyle: {
    width: 20,
    height: 20,
  },

  textBoxFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 10,
    width: "100%",
  },

  box: {
    borderWidth: 1,
    borderColor: "#D4D5D9",
    backgroundColor: "#fff",
    alignItems: "center",
    fontSize: 14,
    flex: 1,
    padding: 10,
  },

  selectedBox: {
    backgroundColor: "#FF6666",
    color: "#fff",
  },

  boxText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#535665",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    textAlign: "center",
    width: 100,
  },

  selectedBoxText: {
    color: "#FFF",
  },

  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
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

  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  radioText: {
    fontSize: 14,
    color: "#535665",
    marginLeft: 8,
  },

  radioButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "35%",
    marginTop: 8,
  },

  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  radioButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    height: 15,
    width: 15,
    // marginRight: 8,
  },

  radioButtonSelected: {
    backgroundColor: "#FF6666",
    borderColor: "#FF6666",
  },

  radioLabel: {
    fontSize: 14,
    color: "#535665",
    marginLeft: 4, // Adjusted margin to bring closer to the radio button
  },
  labelWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  // label: {
  //   fontSize: 16,
  //   fontWeight: "bold",
  // },
  infoIcon: {
    marginLeft: 8,
  },
  tooltipContent: {
    fontSize: 14,
    color: "#000",
    padding: 8,
  },

});







