import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios"; // Import axios
import config from "../API/Apiurl";


// Validation schema using zod
const schema = zod.object({
  daughterName: zod.string().min(3, "This field is required"),
  maritalStatus: zod.string().min(1, "Marital status is required"),
  selectedDate: zod.date().nullable().refine((date) => {
    if (date === null) return false;
    const age = calculateAge(date);
    return age >= 18;
  }, {
    message: "Your age should be 18 or above to create a profile."
  }),
  height: zod.string().min(1, "Height is required"),
  complexion: zod.string().min(1, "Complexion is required"),
});

const CalendarIcon = ({ onPress }) => (
  <Pressable
    onPress={onPress}
    style={{ position: "absolute", right: 10, top: 15 }}
  >
    <Ionicons name="calendar" size={18} color="#535665" />
  </Pressable>
);

const calculateAge = (birthDate) => {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  const dayDifference = today.getDate() - birthDate.getDate();
  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    return age - 1;
  }
  return age;
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const BasicDetails = () => {
  const navigation = useNavigation();
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [age, setAge] = useState(null);
  const [MobileNo, setMobileNo] = useState("");
  const [ProfileId, setProfileId] = useState("");
  const [ProfileOwner, setProfileOwner] = useState("");
  const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
  const [heightOptions, setHeightOptions] = useState([]);
  const [complexionOptions, setComplexionOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false); // Add state to track submission


  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      daughterName: "",
      maritalStatus: "",
      height: "",
      complexion: "",
    },
  });

  useEffect(() => {
    retrieveDataFromSession();
    fetchMaritalStatus();
    fetchHeightOptions();
    fetchComplexionOptions();
  }, []);

  const retrieveDataFromSession = async () => {
    try {
      let profileValue = await AsyncStorage.getItem("profile_owner");
      const profileId = await AsyncStorage.getItem("profile_id");
      const mobileno = await AsyncStorage.getItem("Mobile_no");

      // Replace "ownself" with "yourself"
      profileValue = profileValue === "Ownself" ? "yourself" : profileValue;

      setMobileNo(mobileno);
      setProfileId(profileId);
      setProfileOwner(profileValue);

      console.log("Retrieved Profile Value:", profileValue);
      console.log("Retrieved Profile ID:", profileId);
      console.log("Retrieved Mobile No:", mobileno);
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

  const fetchComplexionOptions = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_Complexion/`);
      const complexionArray = Object.keys(response.data).map(key => ({
        label: response.data[key].complexion_description,
        value: response.data[key].complexion_id.toString(),
      }));
      setComplexionOptions(complexionArray);
    } catch (error) {
      console.error("Error fetching complexion options:", error);
    }
  };

  // const handleDateChange = (event, date) => {
  //   if (event.type === "set") {
  //     const currentDate = date || selectedDate;
  //     const calculatedAge = calculateAge(currentDate);
  //     setShowDatepicker(false);
  //     setSelectedDate(currentDate);
  //     setAge(calculatedAge);
  //     setValue("selectedDate", currentDate, { shouldValidate: true });
  //   } else {
  //     setShowDatepicker(false);
  //   }
  // };

  const currentDate = new Date(); // Current date
  const currentYear = currentDate.getFullYear(); // Current year

  // Adjust minDate and maxDate to fit the requirement
  const minDate = new Date(1947, 0, 1); // January 1, 1947
  const maxDate = new Date(currentYear - 19, 11, 31); // December 31 of (currentYear - 18)

  const handleDateChange = (event, date) => {
    if (event.type === "set") {
      const selectedDate = date || currentDate;
      const safeDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        12, // Set hours to 12 (noon)
        0, 0
      );

      const calculatedAge = calculateAge(safeDate);
      setShowDatepicker(false);
      setSelectedDate(safeDate); // Store the safeDate
      setAge(calculatedAge);
      setValue("selectedDate", safeDate, { shouldValidate: true });
    } else {
      setShowDatepicker(false);
    }
  };


  const onSubmit = async (data) => {
    try {
      setSubmitting(true); // Set submitting state to true

      const requestBody = {
        ProfileId: ProfileId,
        Profile_name: data.daughterName,
        Profile_marital_status: data.maritalStatus,
        Profile_dob: formatDate(selectedDate),
        Profile_height: data.height,
        Profile_complexion: data.complexion,
      };

      console.log(requestBody);

      const response = await axios.post(`${config.apiUrl}/auth/Registrationstep2/`, requestBody);
      console.log("Registrationstep2 API Response:", response.data);

      // Assuming response.data.profile_id is the new profile ID received
      const profileIdNew = response.data.profile_id;

      // Store profileIdNew in AsyncStorage as profile_id_new
      await AsyncStorage.setItem("profile_id_new", profileIdNew);
      await AsyncStorage.setItem('martial_status', data.maritalStatus.toString());
      await AsyncStorage.setItem('height', data.height.toString());


      navigation.navigate("ContactInfo");
    } catch (error) {
      console.error("Error calling Registrationstep2 API:", error);
    }
    finally {
      setSubmitting(false); // Reset submitting state after API call
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.basicText}>
          Great! Now some basic details about {ProfileOwner === "yourself" ? "" : "your"} {ProfileOwner}
        </Text>
      </View>

      <View style={styles.formContainer}>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="daughterName"
            render={({ field: { onChange, value } }) => (
              <>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Name`}
                  value={value}
                  onChangeText={onChange}
                />
                {errors.daughterName && <Text style={styles.error}>{errors.daughterName.message}</Text>}
              </>
            )}
          />
        </View>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="maritalStatus"
            render={({ field: { onChange, value } }) => (
              <>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={maritalStatusOptions}
                  maxHeight={180}
                  labelField="label"
                  valueField="value"
                  placeholder="Select  Marital status"
                  value={value}
                  onChange={async (item) => {
                    onChange(item.value); // update form state
                    await AsyncStorage.setItem("martial_status", item.value); // persist to storage
                  }}
                />
                {errors.maritalStatus && <Text style={styles.error}>{errors.maritalStatus.message}</Text>}
              </>
            )}
          />
        </View>

        <View style={styles.inputContainer}>
          <Pressable onPress={() => setShowDatepicker(true)}>
            <TextInput
              placeholder="Date of Birth"
              style={styles.input}
              editable={false}
              value={selectedDate ? formatDate(selectedDate) : ""}
            />
            <CalendarIcon onPress={() => setShowDatepicker(true)} />
          </Pressable>
          <Controller
            control={control}
            name="selectedDate"
            defaultValue={null}
            render={({ field }) => (
              <>
                {errors.selectedDate && <Text style={styles.error}>{errors.selectedDate.message}</Text>}
              </>
            )}
          />
          {selectedDate && age >= 18 && (
            <Text style={styles.age}>Your age: {age}</Text>
          )}
        </View>

        {showDatepicker && (
          <DateTimePicker
            mode="date"
            display="calendar"
            value={selectedDate || maxDate} // Default focus to the current year
            onChange={handleDateChange}
            minimumDate={minDate} // Starting year: currentYear - 18
            maximumDate={maxDate} // Ending year: current year
          />
        )}


        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="height"
            render={({ field: { onChange, value } }) => (
              <>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={heightOptions}
                  maxHeight={180}
                  labelField="label"
                  valueField="value"
                  placeholder="Select  Height"
                  value={value}
                  onChange={(item) => onChange(item.value)}
                />
                {errors.height && <Text style={styles.error}>{errors.height.message}</Text>}
              </>
            )}
          />
        </View>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="complexion"
            render={({ field: { onChange, value } }) => (
              <>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={complexionOptions}
                  maxHeight={180}
                  labelField="label"
                  valueField="value"
                  placeholder="Select  Complexion"
                  value={value}
                  onChange={(item) => onChange(item.value)}
                />
                {errors.complexion && <Text style={styles.error}>{errors.complexion.message}</Text>}
              </>
            )}
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleSubmit(onSubmit)} disabled={submitting} // Disable button when submitting
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
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  inputContainer: {
    width: "100%",
    marginBottom: 24,
    // marginBottom: 10,
  },

  textContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },

  basicText: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 50,
  },

  formContainer: {
    width: "100%",
    paddingHorizontal: 20,
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

  age: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 12,
    // marginTop: -15,
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
});
