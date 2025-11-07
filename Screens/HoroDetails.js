// import React, { useEffect } from "react";
// import {
//     StyleSheet,
//     Text,
//     View,
//     TextInput,
//     Pressable,
//     SafeAreaView,
//     ScrollView,
//     ImageBackground,
//     Image,
//     TouchableOpacity,
// } from "react-native";
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { useState } from "react";
// import { Dropdown } from "react-native-element-dropdown";
// import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useNavigation } from "@react-navigation/native";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import axios from "axios"; // Import axios
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import config from "../API/Apiurl";


// const place = [
//     { label: "Chennai", value: "1" },
//     { label: "Trichy", value: "2" },
//     { label: "Madurai", value: "3" },
//     { label: "Dindigul", value: "4" },
//     { label: "Tirunelveli", value: "5" },
//     { label: "Tuticorin", value: "6" },
//     { label: "Nagercoil", value: "7" },
// ];


// const chevvaiDoshamOptions = [
//     { label: 'Unknown', value: 'unknown' },
//     { label: 'Yes', value: 'yes' },
//     { label: 'No', value: 'no' },
// ];



// const schema = z.object({
//     selectedTime: z.string().optional(),
//     plValue: z.string().min(1, "Place of Birth is required"),
//     stValue: z.string().min(1, "Birth Star is required"),
//     raValue: z.string().min(1, "Rasi is required"),
//     laValue: z.string().optional(),
//     naalikaiValue: z.string().optional(),
//     dasaNameValue: z.string().optional(),
//     horoscopeHintsValue: z.string().optional(),
//     day: z.string().optional(),
//     month: z.string().optional(),
//     year: z.string().optional(),
// });


// export const HoroDetails = () => {
//     const navigation = useNavigation();

//     const { control, handleSubmit, formState: { errors } } = useForm({
//         resolver: zodResolver(schema),
//         defaultValues: {
//             selectedTime: "",
//             plValue: "",
//             stValue: "",
//             raValue: "",
//             laValue: "",
//             didi: "",
//             chdoshamValue: "",
//             sarDoshamValue: "",
//             naalikaiValue: "",
//             dasaNameValue: "",
//             horoscopeHintsValue: "",
//             day: "",
//             month: "",
//             year: "",
//         },
//     });



//     const [dayOptions, setDayOptions] = useState([]);
//     const [monthOptions, setMonthOptions] = useState([]);
//     const [yearOptions, setYearOptions] = useState([]);
//     const [birthStar, setBirthStar] = useState([]);
//     const [birthRasi, setRasiList] = useState([]);
//     const [lagnam, setLagnamOptions] = useState([]);
//     const [dasaList, setDasaList] = useState([]); // State to hold fetched Dasa names
//     const [submitting, setSubmitting] = useState(false); // Add state to track submission


//     useEffect(() => {
//         const fetchDasaNames = async () => {
//             try {
//                 const response = await axios.post(`${config.apiUrl}/auth/Get_Dasa_Name/`);
//                 const formattedDasaList = Object.values(response.data).map((dasa) => ({
//                     label: dasa.dasa_description,
//                     value: dasa.dasa_id.toString(),
//                 }));
//                 setDasaList(formattedDasaList); // Set the formatted list to state
//             } catch (error) {
//                 console.error('Error fetching Dasa names:', error);
//             }
//         };

//         fetchDasaNames(); // Call the function to fetch Dasa names
//     }, []);

//     // Populate day and year options
//     useEffect(() => {
//         // For days: 00 to 30
//         const days = Array.from({ length: 31 }, (_, i) => ({
//           label: i.toString().padStart(2, '0'),
//           value: i.toString().padStart(2, '0'),
//         }));
//         setDayOptions(days);

//         // For months: 00 to 12
//         const months = Array.from({ length: 13 }, (_, i) => ({
//           label: i.toString().padStart(2, '0'),
//           value: i.toString().padStart(2, '0'),
//         }));
//         setMonthOptions(months);


//         const years = Array.from({ length: 30 }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` }));
//         setYearOptions(years);
//         fetchBirthStar();
//         fetchRasiList();
//         fetchLagnamList();
//         retrieveDataFromSession();


//     }, []);




//     const fetchBirthStar = async (countryId = " ") => {
//         try {
//             const response = await axios.post(`${config.apiUrl}/auth/Get_Birth_Star/`, {
//                 state_id: countryId,
//             });
//             const stateData = response.data;

//             // Convert stateData object to array
//             const formattedStarList = Object.keys(stateData).map((key) => ({
//                 label: stateData[key].birth_star,
//                 value: stateData[key].birth_id.toString(),
//             }));

//             setBirthStar(formattedStarList);
//         } catch (error) {
//             console.error("Error fetching Birth Star list:", error);
//         }
//     };



//     const fetchRasiList = async (starId = " ") => {
//         try {
//             const response = await axios.post(`${config.apiUrl}/auth/Get_Rasi/`, {
//                 birth_id: starId,
//             });
//             const stateData = response.data;

//             // Convert stateData object to array
//             const formattedRasiList = Object.keys(stateData).map((key) => ({
//                 label: stateData[key].rasi_name,
//                 value: stateData[key].rasi_id.toString(),
//             }));

//             setRasiList(formattedRasiList);
//         } catch (error) {
//             console.error("Error fetching Rasi list:", error);
//         }
//     };



//     const fetchLagnamList = async () => {
//         try {
//             const response = await axios.post(`${config.apiUrl}/auth/Get_Lagnam_Didi/`);
//             const lagnamArray = Object.keys(response.data).map(key => ({
//                 label: response.data[key].didi_description,
//                 value: response.data[key].didi_id.toString(),
//             }));
//             setLagnamOptions(lagnamArray);
//         } catch (error) {
//             console.error("Error fetching Lagnam :", error);
//         }
//     };


//     // State for time picker
//     const [time, setTime] = useState(new Date());
//     const [showTimePicker, setShowTimePicker] = useState(false);
//     const [selectedTime, setSelectedTime] = useState('');

//     const formattedTime = (time) => {
//         let hours = time.getHours();
//         let minutes = time.getMinutes();
//         let seconds = time.getSeconds();
//         let period = hours >= 12 ? 'PM' : 'AM';
//         hours = hours % 12 || 12; // Convert hours to 12-hour format
//         hours = hours.toString().padStart(2, '0');
//         minutes = minutes.toString().padStart(2, '0');
//         seconds = seconds.toString().padStart(2, '0');
//         return `${hours}:${minutes}:${seconds} ${period}`;
//     };

//     const onTimeChange = (event, selectedTime) => {
//         if (event.type === "set") {
//             const currentTime = selectedTime || time;
//             setShowTimePicker(false);
//             setTime(currentTime);
//             const formatted = formattedTime(currentTime);
//             setSelectedTime(formatted);
//         } else {
//             setShowTimePicker(false);
//         }
//     };

//     const retrieveDataFromSession = async () => {
//         try {
//             let profileValue = await AsyncStorage.getItem("profile_owner");
//             const profileId = await AsyncStorage.getItem("profile_id_new");
//             const mobileno = await AsyncStorage.getItem("Mobile_no");

//             // Replace "ownself" with "yourself"
//             profileValue = profileValue === "Ownself" ? "yourself" : profileValue;

//             // setMobileNo(mobileno);
//             // setProfileId(profileId);
//             // setProfileOwner(profileValue);

//             console.log("Retrieved Profile Value:", profileValue);
//             console.log("Retrieved Profile ID:", profileId);
//             console.log("Retrieved Mobile No:", mobileno);
//         } catch (error) {
//             console.error("Error retrieving data from session:", error);
//         }
//     };



//     const onSubmit = async (data) => {
//         try {
//             setSubmitting(true); // Set submitting state to true

//             // Format the data as expected by the backend
//             const profileId = await AsyncStorage.getItem("profile_id_new");
//             if (!profileId) {
//                 throw new Error("ProfileId not found in sessionStorage");
//             }
//             const dasabalance = `${data.year}-${data.month}-${data.day}`;
//             console.log(data.stValue);
//             await AsyncStorage.setItem('birthStarValue', data.stValue);
//             await AsyncStorage.setItem('birthStaridValue', data.raValue);


//             const formattedData = {
//                 profile_id: profileId,
//                 place_of_birth: data.plValue,
//                 time_of_birth: data.selectedTime,
//                 birthstar_name: data.stValue,
//                 birth_rasi_name: data.raValue,
//                 lagnam_didi: data.laValue,
//                 chevvai_dosham: data.chdoshamValue,
//                 ragu_dosham: data.sarDoshamValue,
//                 nalikai: data.naalikaiValue,
//                 dasa_name: data.dasaNameValue,
//                 dasa_balance: dasabalance,
//                 horoscope_hints: data.horoscopeHintsValue,
//                 didi: data.didi
//             };

//             console.log("Formatted Data:", formattedData);
//             const response = await axios.post(`${config.apiUrl}/auth/Horoscope_registration/`, formattedData);
//             if (response.data.Status === 1) {
//                 await AsyncStorage.setItem("birthstar", data.stValue); // Store stValue in session storage
//                 navigation.navigate("PartnerSettings");
//             } else {
//                 // Handle error or show message to the user
//                 console.error("Error: Response status is not 1", response.data);
//             }
//         } catch (error) {
//             console.error("Error submitting form data:", error);
//         }
//         finally {
//             setSubmitting(false); // Reset submitting state after API call
//           }
//     };


//     return (
//         <ScrollView>
//             <SafeAreaView style={styles.container}>
//                 <Text style={styles.eduHead}>Horoscope Details</Text>
//                 <View style={styles.formContainer}>

//                     <View style={styles.inputContainer}>
//                         <Text style={styles.label}>Time of Birth</Text>
//                         <Controller
//                             control={control}
//                             name="selectedTime"
//                             defaultValue=""
//                             render={({ field: { onChange, value } }) => (
//                                 <>
//                                     <Pressable onPress={() => setShowTimePicker(true)} style={styles.pressable}>
//                                         <TextInput
//                                             style={styles.input}
//                                             placeholder="Time (HH:MM:SS)"
//                                             editable={false}
//                                             value={value}
//                                         />
//                                         <MaterialCommunityIcons style={styles.clock} name="clock-outline" size={18} color="#535665" />
//                                     </Pressable>
//                                     {showTimePicker && (
//                                         <DateTimePicker
//                                             mode="time"
//                                             display="spinner"
//                                             value={time}
//                                             onChange={(event, selectedTime) => {
//                                                 onTimeChange(event, selectedTime);
//                                                 onChange(formattedTime(selectedTime || time));
//                                             }}
//                                         />
//                                     )}
//                                     {errors.selectedTime && <Text style={styles.error}>{errors.selectedTime.message}</Text>}
//                                     <Text>Selected Time: {selectedTime}</Text>

//                                 </>
//                             )}
//                         />
//                     </View>
//                     {/* Place of Birth */}
//                     <View style={styles.inputContainer}>
//                         <Text style={styles.label}>
//                             Place of Birth <Text style={styles.required}>*</Text>
//                         </Text>
//                         <Controller
//                             control={control}
//                             render={({ field }) => (
//                                 <TextInput
//                                     style={styles.input}
//                                     placeholder="Place of Birth"
//                                     onChangeText={field.onChange}
//                                     value={field.value}
//                                 />
//                             )}
//                             name="plValue"
//                             rules={{ required: 'Place of Birth is required' }}
//                             defaultValue=""
//                         />
//                         {errors.plValue && <Text style={styles.error}>{errors.plValue.message}</Text>}

//                     </View>

//                     {/* Birth Star */}
//                     <View style={styles.inputContainer}>
//                         <Text style={styles.label}>Birth Star<Text style={styles.required}>*</Text>
//                         </Text>
//                         <Controller
//                             control={control}
//                             render={({ field: { onChange, value } }) => (
//                                 <Dropdown
//                                     style={styles.dropdown} // Apply dropdown style from your existing styles
//                                     placeholder="Select Birth Star"
//                                     placeholderStyle={styles.placeholderStyle}
//                                     selectedTextStyle={styles.selectedTextStyle}
//                                     iconStyle={styles.iconStyle}
//                                     data={birthStar}
//                                     maxHeight={180}
//                                     labelField="label"
//                                     valueField="value"
//                                     value={value}
//                                     onChange={(item) => {
//                                         onChange(item.value);
//                                         fetchRasiList(item.value);
//                                     }} />
//                             )}
//                             name="stValue"
//                             rules={{ required: 'Birth Star is required' }}
//                             defaultValue="" // Set default value if needed
//                         />
//                         {errors.stValue && <Text style={styles.error}>{errors.stValue.message}</Text>}
//                     </View>

//                     {/* Rasi */}
//                     <View style={styles.inputContainer}>
//                         <Text style={styles.label}>Rasi<Text style={styles.required}>*</Text>
//                         </Text>
//                         <Controller
//                             control={control}
//                             render={({ field: { onChange, value } }) => (
//                                 <Dropdown
//                                     style={styles.dropdown} // Apply dropdown style from your existing styles
//                                     placeholder="Select Rasi"
//                                     placeholderStyle={styles.placeholderStyle}
//                                     selectedTextStyle={styles.selectedTextStyle}
//                                     iconStyle={styles.iconStyle}
//                                     data={birthRasi}
//                                     maxHeight={180}
//                                     labelField="label"
//                                     valueField="value"
//                                     value={value}
//                                     onChange={(item) => onChange(item.value)}
//                                 />
//                             )}
//                             name="raValue"
//                             rules={{ required: 'Rasi is required' }}
//                             defaultValue="" // Set default value if needed
//                         />
//                         {errors.raValue && <Text style={styles.error}>{errors.raValue.message}</Text>}
//                     </View>

//                     {/* Lagnam / Didi */}
//                     <View style={styles.inputContainer}>
//                         <Text style={styles.label}>Lagnam</Text>
//                         <Controller
//                             control={control}
//                             render={({ field: { onChange, value } }) => (
//                                 <Dropdown
//                                     style={styles.dropdown} // Apply dropdown style from your existing styles
//                                     placeholder="Select Lagnam"
//                                     placeholderStyle={styles.placeholderStyle}
//                                     selectedTextStyle={styles.selectedTextStyle}
//                                     iconStyle={styles.iconStyle}
//                                     data={lagnam}
//                                     maxHeight={180}
//                                     labelField="label"
//                                     valueField="value"
//                                     value={value}
//                                     onChange={(item) => onChange(item.value)}
//                                 />
//                             )}
//                             name="laValue"
//                             rules={{ required: 'Lagnam / Didi is required' }}
//                             defaultValue="" // Set default value if needed
//                         />
//                         {errors.laValue && <Text style={styles.error}>{errors.laValue.message}</Text>}
//                     </View>


//                     <View style={styles.inputContainer}>
//                         <Text style={styles.label}>Didi</Text>
//                         <Controller
//                             control={control}
//                             render={({ field }) => (
//                                 <TextInput
//                                     style={styles.input}
//                                     placeholder="Select Didi"
//                                     onChangeText={field.onChange}
//                                     value={field.value}
//                                 />
//                             )}
//                             name="didi"
//                             defaultValue=""
//                         />

//                     </View>

//                     {/* Chevvai Dosham */}
//                     <View style={styles.inputContainer}>
//                         <Text style={styles.label}>Chevvai Dosham</Text>
//                         <Controller
//                             control={control}
//                             render={({ field: { onChange, value } }) => (
//                                 <Dropdown
//                                     style={styles.dropdown} // Apply dropdown style from your existing styles
//                                     placeholder="Select Chevvai Dosham"
//                                     placeholderStyle={styles.placeholderStyle}
//                                     selectedTextStyle={styles.selectedTextStyle}
//                                     iconStyle={styles.iconStyle}
//                                     data={chevvaiDoshamOptions}
//                                     maxHeight={180}
//                                     labelField="label"
//                                     valueField="value"
//                                     value={value}
//                                     onChange={(item) => onChange(item.value)}
//                                 />
//                             )}
//                             name="chdoshamValue"
//                             rules={{ required: 'Chevvai Dosham is required' }}
//                             defaultValue="" // Set default value if needed
//                         />
//                         {errors.chdoshamValue && <Text style={styles.error}>{errors.chdoshamValue.message}</Text>}
//                     </View>

//                     {/* Ragu Dosham */}
//                     <View style={styles.inputContainer}>
//                         <Text style={styles.label}>Ragu/Rahu/kethu Dhosam</Text>
//                         <Controller
//                             control={control}
//                             render={({ field: { onChange, value } }) => (
//                                 <Dropdown
//                                     style={styles.dropdown} // Apply dropdown style from your existing styles
//                                     placeholder="Select Ragu Dosham"
//                                     placeholderStyle={styles.placeholderStyle}
//                                     selectedTextStyle={styles.selectedTextStyle}
//                                     iconStyle={styles.iconStyle}
//                                     data={chevvaiDoshamOptions}
//                                     maxHeight={180}
//                                     labelField="label"
//                                     valueField="value"
//                                     value={value}
//                                     onChange={(item) => onChange(item.value)}
//                                 />
//                             )}
//                             name="sarDoshamValue"
//                             rules={{ required: 'Chevvai Dosham is required' }}
//                             defaultValue="" // Set default value if needed
//                         />
//                         {errors.sarDoshamValue && <Text style={styles.error}>{errors.sarDoshamValue.message}</Text>}
//                     </View>

//                     {/* Naalikai */}
//                     <View style={styles.inputContainer}>
//                         <Text style={styles.label}>Naalikai</Text>
//                         <Controller
//                             control={control}
//                             render={({ field }) => (
//                                 <TextInput
//                                     style={styles.input}
//                                     placeholder="Naalikai"
//                                     onChangeText={field.onChange}
//                                     value={field.value}
//                                 />
//                             )}
//                             name="naalikaiValue"
//                             rules={{ required: 'Naalikai is required' }}
//                             defaultValue=""
//                         />
//                         {errors.naalikaiValue && <Text style={styles.error}>{errors.naalikaiValue.message}</Text>}
//                     </View>

//                     {/* Dasa Name */}
//                     <View style={styles.inputContainer}>
//                         <Text style={styles.label}>Dasa Name</Text>
//                         <Controller
//                             control={control}
//                             name="dasaNameValue"
//                             rules={{ required: 'Dasa Name is required' }}
//                             defaultValue=""
//                             render={({ field: { onChange, value } }) => (
//                                 <Dropdown
//                                     style={styles.dropdown}
//                                     placeholderStyle={styles.placeholderStyle}
//                                     selectedTextStyle={styles.selectedTextStyle}
//                                     data={dasaList} // Use the fetched dasa list
//                                     labelField="label"
//                                     valueField="value"
//                                     placeholder="Select Dasa Name"
//                                     value={value}
//                                     onChange={(item) => onChange(item.value)} // Update selected Dasa
//                                 />
//                             )}
//                         />
//                         {errors.dasaNameValue && <Text style={styles.error}>{errors.dasaNameValue.message}</Text>}
//                     </View>

//                     {/* Dasa Balance */}
//                     <View style={styles.container}>
//                         <View style={styles.inputContainer}>
//                             <Text style={styles.label}>Dasa Balance</Text>
//                             <View style={styles.dropdownFlex}>
//                                 {/* Day Dropdown */}
//                                 <View style={styles.dropdownFit}>
//                                     <Controller
//                                         control={control}
//                                         name="day"
//                                         render={({ field: { onChange, value } }) => (
//                                             <Dropdown
//                                                 style={[styles.dropdown]} // Apply horizontal styling
//                                                 placeholderStyle={styles.placeholderStyle}
//                                                 selectedTextStyle={styles.selectedTextStyle}
//                                                 inputSearchStyle={styles.inputSearchStyle}
//                                                 iconStyle={styles.iconStyle}
//                                                 data={dayOptions}
//                                                 maxHeight={180}
//                                                 labelField="label"
//                                                 valueField="value"
//                                                 placeholder="Day"
//                                                 value={value}
//                                                 onChange={(item) => onChange(item.value)}
//                                             />
//                                         )}
//                                     />
//                                     {errors.day && <Text style={styles.error}>{errors.day.message}</Text>}
//                                 </View>

//                                 {/* Month Dropdown */}
//                                 <View style={styles.dropdownFit}>
//                                     <Controller
//                                         control={control}
//                                         name="month"
//                                         render={({ field: { onChange, value } }) => (
//                                             <Dropdown
//                                                 style={[styles.dropdown]} // Apply horizontal styling
//                                                 placeholderStyle={styles.placeholderStyle}
//                                                 selectedTextStyle={styles.selectedTextStyle}
//                                                 inputSearchStyle={styles.inputSearchStyle}
//                                                 iconStyle={styles.iconStyle}
//                                                 data={monthOptions}
//                                                 maxHeight={180}
//                                                 labelField="label"
//                                                 valueField="value"
//                                                 placeholder="Month"
//                                                 value={value}
//                                                 onChange={(item) => onChange(item.value)}
//                                             />
//                                         )}
//                                     />
//                                     {errors.month && <Text style={styles.error}>{errors.month.message}</Text>}
//                                 </View>

//                                 {/* Year Dropdown */}
//                                 <View style={styles.dropdownFit}>
//                                     <Controller
//                                         control={control}
//                                         name="year"
//                                         render={({ field: { onChange, value } }) => (
//                                             <Dropdown
//                                                 style={[styles.dropdown]} // Apply horizontal styling
//                                                 placeholderStyle={styles.placeholderStyle}
//                                                 selectedTextStyle={styles.selectedTextStyle}
//                                                 inputSearchStyle={styles.inputSearchStyle}
//                                                 iconStyle={styles.iconStyle}
//                                                 data={yearOptions}
//                                                 maxHeight={180}
//                                                 labelField="label"
//                                                 valueField="value"
//                                                 placeholder="Year"
//                                                 value={value}
//                                                 onChange={(item) => onChange(item.value)}
//                                             />
//                                         )}
//                                     />
//                                     {errors.year && <Text style={styles.error}>{errors.year.message}</Text>}
//                                 </View>
//                             </View>
//                             {/* Error messages for each dropdown */}
//                             <View style={styles.errorContainer}>



//                             </View>
//                         </View>
//                     </View>



//                     {/* Horoscope Hints */}
//                     <View style={styles.inputContainer}>
//                         <Text style={styles.label}>Horoscope Hints</Text>
//                         <Controller
//                             control={control}
//                             render={({ field }) => (
//                                 <TextInput
//                                     style={styles.input}
//                                     placeholder="Horoscope Hints"
//                                     onChangeText={field.onChange}
//                                     value={field.value}
//                                 />
//                             )}
//                             name="horoscopeHintsValue"
//                             rules={{ required: 'HoroscopeHint is required' }}
//                             defaultValue=""
//                         />
//                         {errors.horoscopeHintsValue && <Text style={styles.error}>{errors.horoscopeHintsValue.message}</Text>}
//                     </View>

//                     <TouchableOpacity
//                         style={styles.btn}
//                         onPress={handleSubmit(onSubmit)}
//                         disabled={submitting} // Disable button when submitting

//                     >
//                         <LinearGradient
//                             colors={["#BD1225", "#FF4050"]}
//                             start={{ x: 0, y: 0 }}
//                             end={{ x: 1, y: 1 }}
//                             useAngle={true}
//                             angle={92.08}
//                             angleCenter={{ x: 0.5, y: 0.5 }}
//                             style={styles.linearGradient}
//                         >
//                             <View style={styles.loginContainer}>
//                                 {/* <Text style={styles.login}>Next</Text> */}
//                                 <Text style={styles.login}>{submitting ? "Submitting..." : "Register"}</Text>
//                                 <Ionicons name="arrow-forward" size={18} color="white" />
//                             </View>
//                         </LinearGradient>
//                     </TouchableOpacity>
//                 </View>
//             </SafeAreaView>
//         </ScrollView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: "#fff",
//         alignItems: "center",
//         justifyContent: "center",
//     },

//     eduHead: {
//         color: "#535665",
//         // color: "#4F515D",
//         fontFamily: "inter",
//         fontSize: 24,
//         fontWeight: "700",
//         alignSelf: "flex-start",
//         paddingHorizontal: 20,
//         marginVertical: 10,
//     },

//     formContainer: {
//         width: "100%",
//         paddingHorizontal: 20,
//     },

//     label: {
//         color: "#535665",
//         fontSize: 14,
//         fontWeight: "600",
//         // fontFamily: "inter",
//     },

//     redText: {
//         color: "#FF6666",
//         fontSize: 14,
//         fontWeight: "700",
//     },

//     inputContainer: {
//         width: "100%",
//         marginBottom: 20,
//         // marginBottom: 24,
//     },

//     input: {
//         color: "#535665",
//         borderWidth: 1,
//         borderRadius: 4,
//         borderColor: "#D4D5D9",
//         padding: 10,
//         // marginBottom: 10,
//         fontFamily: "inter",
//     },

//     // pressable: {
//     //     flexDirection: 'row',
//     //     alignItems: 'center',
//     //     borderColor: 'gray',
//     //     borderWidth: 1,
//     //     borderRadius: 5,
//     //     padding: 10,
//     //     width: 250,
//     // },

//     // input: {
//     //     flex: 1,
//     //     height: 40,
//     //     borderWidth: 0,
//     //     textAlign: 'left',
//     // },

//     clock: {
//         position: "absolute",
//         right: 10,
//         top: 15,
//     },

//     dropdown: {
//         width: "100%",
//         color: "#535665",
//         borderWidth: 1,
//         borderRadius: 4,
//         borderColor: "#D4D5D9",
//         paddingHorizontal: 10,
//         paddingVertical: 13,
//         // marginBottom: 10,
//         fontFamily: "inter",
//     },

//     dropdownFlex: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "start",
//         // marginBottom: 10,
//         width: "100%",
//     },

//     dropdownFit: {
//         width: "32.33%",
//         // color: "#535665",
//         // borderWidth: 1,
//         // borderRadius: 4,
//         // borderColor: "#D4D5D9",
//         // padding: 8,
//         // marginBottom: 10,
//         fontFamily: "inter",
//     },

//     //   icon: {
//     //     marginRight: 5,
//     //   },

//     placeholderStyle: {
//         fontSize: 14,
//     },

//     selectedTextStyle: {
//         fontSize: 14,
//     },

//     iconStyle: {
//         width: 20,
//         height: 20,
//     },

//     textBoxFlex: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//         marginBottom: 10,
//         width: "100%",
//     },

//     box: {
//         borderWidth: 1,
//         borderColor: "#D4D5D9",
//         backgroundColor: "#fff",
//         alignItems: "center",
//         fontSize: 14,
//         flex: 1,
//         padding: 10,
//     },

//     selectedBox: {
//         // backgroundColor: "#007AFF",
//         backgroundColor: "#FF6666",
//         color: "#fff",
//     },

//     boxText: {
//         fontSize: 16,
//         fontWeight: "500",
//         color: "#535665",
//     },

//     selectedBoxText: {
//         color: "#fff", // Change the color for the selected text
//     },

//     btn: {
//         width: "100%",
//         alignSelf: "center",
//         borderRadius: 6,
//         // shadowColor: "#EE1E2440",
//         // shadowOffset: { width: 0, height: 1 },
//         // shadowOpacity: 0.2,
//         // shadowRadius: 6,
//         // elevation: 5,
//         marginTop: 15,
//         marginBottom: 30,
//     },

//     loginContainer: {
//         flexDirection: "row",
//         alignItems: "center",
//         justifyContent: "center",
//     },

//     login: {
//         textAlign: "center",
//         color: "white",
//         fontWeight: "600",
//         fontSize: 16,
//         letterSpacing: 1,
//         fontFamily: "inter",
//         marginRight: 5,
//     },

//     linearGradient: {
//         borderRadius: 5,
//         justifyContent: "center",
//         padding: 15,
//     },

//     error: {
//         color: "#FF0000",
//         fontSize: 12,
//         fontFamily: "inter",
//     },

//     errorContainer: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//     },
//     required: {
//         color: "red", // Red color for the asterisk
//     },


// });
import React, { useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    SafeAreaView,
    ScrollView,
    ImageBackground,
    Image,
    TouchableOpacity,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from "react";
import { Dropdown } from "react-native-element-dropdown";
import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios"; // Import axios
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";


const place = [
    { label: "Chennai", value: "1" },
    { label: "Trichy", value: "2" },
    { label: "Madurai", value: "3" },
    { label: "Dindigul", value: "4" },
    { label: "Tirunelveli", value: "5" },
    { label: "Tuticorin", value: "6" },
    { label: "Nagercoil", value: "7" },
];


const chevvaiDoshamOptions = [
    { label: 'Unknown', value: 'unknown' },
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
];



const schema = z.object({
    selectedTime: z.string().optional(),
    plValue: z.string().min(1, "Place of Birth is required"),
    stValue: z.string().min(1, "Birth Star is required"),
    raValue: z.string().min(1, "Rasi is required"),
    laValue: z.string().optional(),
    naalikaiValue: z.string().optional(),
    dasaNameValue: z.string().optional(),
    horoscopeHintsValue: z.string().optional(),
    day: z.string().optional(),
    month: z.string().optional(),
    year: z.string().optional(),
});


export const HoroDetails = () => {
    const navigation = useNavigation();

    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            selectedTime: "",
            plValue: "",
            stValue: "",
            raValue: "",
            laValue: "",
            didi: "",
            chdoshamValue: "",
            sarDoshamValue: "",
            naalikaiValue: "",
            dasaNameValue: "",
            horoscopeHintsValue: "",
            day: "",
            month: "",
            year: "",
        },
    });



    const [dayOptions, setDayOptions] = useState([]);
    const [monthOptions, setMonthOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);
    const [birthStar, setBirthStar] = useState([]);
    const [birthRasi, setRasiList] = useState([]);
    const [lagnam, setLagnamOptions] = useState([]);
    const [dasaList, setDasaList] = useState([]); // State to hold fetched Dasa names
    const [submitting, setSubmitting] = useState(false); // Add state to track submission


    useEffect(() => {
        const fetchDasaNames = async () => {
            try {
                const response = await axios.post(`${config.apiUrl}/auth/Get_Dasa_Name/`);
                const formattedDasaList = Object.values(response.data).map((dasa) => ({
                    label: dasa.dasa_description,
                    value: dasa.dasa_id.toString(),
                }));
                setDasaList(formattedDasaList); // Set the formatted list to state
            } catch (error) {
                console.error('Error fetching Dasa names:', error);
            }
        };

        fetchDasaNames(); // Call the function to fetch Dasa names
    }, []);

    // Populate day and year options
    useEffect(() => {
        // For days: 00 to 30
        const days = Array.from({ length: 31 }, (_, i) => ({
            label: i.toString(),
            value: i.toString()
        }));
        setDayOptions([{ label: 'Days', value: '' }, ...days]);

        // For months: 00 to 12
        const months = Array.from({ length: 12 }, (_, i) => ({
            label: i.toString(),
            value: i.toString()
        }));
        setMonthOptions([{ label: 'Months', value: '' }, ...months]);


        const years = Array.from({ length: 30 }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` }));
        setYearOptions([{ label: 'Years', value: '' }, ...years]);
        fetchBirthStar();
        fetchRasiList();
        fetchLagnamList();
        retrieveDataFromSession();
    }, []);




    const fetchBirthStar = async (countryId = " ") => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Birth_Star/`, {
                state_id: countryId,
            });
            const stateData = response.data;

            // Convert stateData object to array
            const formattedStarList = Object.keys(stateData).map((key) => ({
                label: stateData[key].birth_star,
                value: stateData[key].birth_id.toString(),
            }));

            setBirthStar(formattedStarList);
        } catch (error) {
            console.error("Error fetching Birth Star list:", error);
        }
    };



    const fetchRasiList = async (starId = " ") => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Rasi/`, {
                birth_id: starId,
            });
            const stateData = response.data;

            // Convert stateData object to array
            const formattedRasiList = Object.keys(stateData).map((key) => ({
                label: stateData[key].rasi_name,
                value: stateData[key].rasi_id.toString(),
            }));

            setRasiList(formattedRasiList);
        } catch (error) {
            console.error("Error fetching Rasi list:", error);
        }
    };



    const fetchLagnamList = async () => {
        try {
            const response = await axios.post(`${config.apiUrl}/auth/Get_Lagnam_Didi/`);
            const lagnamArray = Object.keys(response.data).map(key => ({
                label: response.data[key].didi_description,
                value: response.data[key].didi_id.toString(),
            }));
            setLagnamOptions(lagnamArray);
        } catch (error) {
            console.error("Error fetching Lagnam :", error);
        }
    };


    // State for time picker
    const [time, setTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState('');

    // <--- FIX: Removed seconds from time format
    const formattedTime = (time) => {
        let hours = time.getHours();
        let minutes = time.getMinutes();
        // let seconds = time.getSeconds(); // Removed seconds
        let period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // Convert hours to 12-hour format
        hours = hours.toString().padStart(2, '0');
        minutes = minutes.toString().padStart(2, '0');
        // seconds = seconds.toString().padStart(2, '0'); // Removed seconds
        return `${hours}:${minutes} ${period}`; // Return format HH:MM PM/AM
    };

    const onTimeChange = (event, selectedTime) => {
        if (event.type === "set") {
            const currentTime = selectedTime || time;
            setShowTimePicker(false);
            setTime(currentTime);
            const formatted = formattedTime(currentTime);
            setSelectedTime(formatted); // This updates the local state for the <Text> display
        } else {
            setShowTimePicker(false);
        }
    };

    const retrieveDataFromSession = async () => {
        try {
            let profileValue = await AsyncStorage.getItem("profile_owner");
            const profileId = await AsyncStorage.getItem("profile_id_new");
            const mobileno = await AsyncStorage.getItem("Mobile_no");

            // Replace "ownself" with "yourself"
            profileValue = profileValue === "Ownself" ? "yourself" : profileValue;

            // setMobileNo(mobileno);
            // setProfileId(profileId);
            // setProfileOwner(profileValue);

            console.log("Retrieved Profile Value:", profileValue);
            console.log("Retrieved Profile ID:", profileId);
            console.log("Retrieved Mobile No:", mobileno);
        } catch (error) {
            console.error("Error retrieving data from session:", error);
        }
    };



    const onSubmit = async (data) => {
        try {
            setSubmitting(true); // Set submitting state to true

            // Format the data as expected by the backend
            const profileId = await AsyncStorage.getItem("profile_id_new");
            if (!profileId) {
                throw new Error("ProfileId not found in sessionStorage");
            }

            // <--- FIX: Format Dasa Balance as "Y Years, M Months, D Days"
            const year = data.year || '0';
            const month = data.month || '0';
            const day = data.day || '0';
            const dasabalance = `${year} Years, ${month} Months, ${day} Days`;

            console.log(data.stValue);
            await AsyncStorage.setItem('birthStarValue', data.stValue);
            await AsyncStorage.setItem('birthStaridValue', data.raValue);


            const formattedData = {
                profile_id: profileId,
                place_of_birth: data.plValue,
                time_of_birth: data.selectedTime, // This is now in HH:MM PM/AM format
                birthstar_name: data.stValue,
                birth_rasi_name: data.raValue,
                lagnam_didi: data.laValue,

                // <--- FIX: Add || "" to prevent sending 'undefined'
                chevvai_dosham: data.chdoshamValue || "",
                ragu_dosham: data.sarDoshamValue || "",
                nalikai: data.naalikaiValue,
                dasa_name: data.dasaNameValue,
                dasa_balance: dasabalance, // <--- Pass the new formatted string
                horoscope_hints: data.horoscopeHintsValue,
                didi: data.didi || "" // <--- FIX: Add || ""
            };

            console.log("Formatted Data:", formattedData);
            const response = await axios.post(`${config.apiUrl}/auth/Horoscope_registration/`, formattedData);
            if (response.data.Status === 1) {
                await AsyncStorage.setItem("birthstar", data.stValue); // Store stValue in session storage
                navigation.navigate("PartnerSettings");
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


    return (
        <ScrollView>
            <SafeAreaView style={styles.container}>
                <Text style={styles.eduHead}>Horoscope Details</Text>
                <View style={styles.formContainer}>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Time of Birth</Text>
                        <Controller
                            control={control}
                            name="selectedTime"
                            defaultValue=""
                            render={({ field: { onChange, value } }) => (
                                <>
                                    <Pressable onPress={() => setShowTimePicker(true)} style={styles.pressable}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Time (HH:MM)" // <--- FIX: Updated placeholder
                                            editable={false}
                                            value={value}
                                        />
                                        <MaterialCommunityIcons style={styles.clock} name="clock-outline" size={18} color="#535665" />
                                    </Pressable>
                                    {showTimePicker && (
                                        <DateTimePicker
                                            mode="time"
                                            display="spinner"
                                            value={time}
                                            onChange={(event, selectedTime) => {
                                                // This updates the local state for the <Text> display
                                                onTimeChange(event, selectedTime);
                                                // This updates the react-hook-form state
                                                onChange(formattedTime(selectedTime || time));
                                            }}
                                        />
                                    )}
                                    {errors.selectedTime && <Text style={styles.error}>{errors.selectedTime.message}</Text>}
                                    {/* This <Text> displays the local state, not the form state */}
                                    <Text>Selected Time: {selectedTime}</Text>

                                </>
                            )}
                        />
                    </View>
                    {/* Place of Birth */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>
                            Place of Birth <Text style={styles.required}>*</Text>
                        </Text>
                        <Controller
                            control={control}
                            render={({ field }) => (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Place of Birth"
                                    onChangeText={field.onChange}
                                    value={field.value}
                                />
                            )}
                            name="plValue"
                            rules={{ required: 'Place of Birth is required' }}
                            defaultValue=""
                        />
                        {errors.plValue && <Text style={styles.error}>{errors.plValue.message}</Text>}

                    </View>

                    {/* Birth Star */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Birth Star<Text style={styles.required}>*</Text>
                        </Text>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Dropdown
                                    style={styles.dropdown} // Apply dropdown style from your existing styles
                                    placeholder="Select Birth Star"
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    iconStyle={styles.iconStyle}
                                    data={birthStar}
                                    maxHeight={180}
                                    labelField="label"
                                    valueField="value"
                                    value={value}
                                    onChange={(item) => {
                                        onChange(item.value);
                                        fetchRasiList(item.value);
                                    }} />
                            )}
                            name="stValue"
                            rules={{ required: 'Birth Star is required' }}
                            defaultValue="" // Set default value if needed
                        />
                        {errors.stValue && <Text style={styles.error}>{errors.stValue.message}</Text>}
                    </View>

                    {/* Rasi */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Rasi<Text style={styles.required}>*</Text>
                        </Text>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Dropdown
                                    style={styles.dropdown} // Apply dropdown style from your existing styles
                                    placeholder="Select Rasi"
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    iconStyle={styles.iconStyle}
                                    data={birthRasi}
                                    maxHeight={180}
                                    labelField="label"
                                    valueField="value"
                                    value={value}
                                    onChange={(item) => onChange(item.value)}
                                />
                            )}
                            name="raValue"
                            rules={{ required: 'Rasi is required' }}
                            defaultValue="" // Set default value if needed
                        />
                        {errors.raValue && <Text style={styles.error}>{errors.raValue.message}</Text>}
                    </View>

                    {/* Lagnam / Didi */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Lagnam</Text>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Dropdown
                                    style={styles.dropdown} // Apply dropdown style from your existing styles
                                    placeholder="Select Lagnam"
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    iconStyle={styles.iconStyle}
                                    data={lagnam}
                                    maxHeight={180}
                                    labelField="label"
                                    valueField="value"
                                    value={value}
                                    onChange={(item) => onChange(item.value)}
                                />
                            )}
                            name="laValue"
                            rules={{ required: 'Lagnam / Didi is required' }}
                            defaultValue="" // Set default value if needed
                        />
                        {errors.laValue && <Text style={styles.error}>{errors.laValue.message}</Text>}
                    </View>


                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Didi</Text>
                        <Controller
                            control={control}
                            render={({ field }) => (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Select Didi"
                                    onChangeText={field.onChange}
                                    value={field.value}
                                />
                            )}
                            name="didi"
                            defaultValue=""
                        />

                    </View>

                    {/* Chevvai Dosham */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Chevvai Dosham</Text>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Dropdown
                                    style={styles.dropdown} // Apply dropdown style from your existing styles
                                    placeholder="Select Chevvai Dosham"
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    iconStyle={styles.iconStyle}
                                    data={chevvaiDoshamOptions}
                                    maxHeight={180}
                                    labelField="label"
                                    valueField="value"
                                    value={value}
                                    onChange={(item) => onChange(item.value)}
                                />
                            )}
                            name="chdoshamValue"
                            rules={{ required: 'Chevvai Dosham is required' }}
                            defaultValue="" // Set default value if needed
                        />
                        {errors.chdoshamValue && <Text style={styles.error}>{errors.chdoshamValue.message}</Text>}
                    </View>

                    {/* Ragu Dosham */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Ragu/Rahu/kethu Dhosam</Text>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Dropdown
                                    style={styles.dropdown} // Apply dropdown style from your existing styles
                                    placeholder="Select Ragu Dosham"
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    iconStyle={styles.iconStyle}
                                    data={chevvaiDoshamOptions}
                                    maxHeight={180}
                                    labelField="label"
                                    valueField="value"
                                    value={value}
                                    onChange={(item) => onChange(item.value)}
                                />
                            )}
                            name="sarDoshamValue"
                            rules={{ required: 'Chevvai Dosham is required' }}
                            defaultValue="" // Set default value if needed
                        />
                        {errors.sarDoshamValue && <Text style={styles.error}>{errors.sarDoshamValue.message}</Text>}
                    </View>

                    {/* Naalikai */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Naalikai</Text>
                        <Controller
                            control={control}
                            render={({ field }) => (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Naalikai"
                                    onChangeText={field.onChange}
                                    value={field.value}
                                />
                            )}
                            name="naalikaiValue"
                            rules={{ required: 'Naalikai is required' }}
                            defaultValue=""
                        />
                        {errors.naalikaiValue && <Text style={styles.error}>{errors.naalikaiValue.message}</Text>}
                    </View>

                    {/* Dasa Name */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Dasa Name</Text>
                        <Controller
                            control={control}
                            name="dasaNameValue"
                            rules={{ required: 'Dasa Name is required' }}
                            defaultValue=""
                            render={({ field: { onChange, value } }) => (
                                <Dropdown
                                    style={styles.dropdown}
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    data={dasaList} // Use the fetched dasa list
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select Dasa Name"
                                    value={value}
                                    onChange={(item) => onChange(item.value)} // Update selected Dasa
                                />
                            )}
                        />
                        {errors.dasaNameValue && <Text style={styles.error}>{errors.dasaNameValue.message}</Text>}
                    </View>

                    {/* Dasa Balance */}
                    <View style={styles.container}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Dasa Balance</Text>
                            <View style={styles.dropdownFlex}>
                                {/* Year Dropdown */}
                                <View style={styles.dropdownFit}>
                                    <Controller
                                        control={control}
                                        name="year"
                                        render={({ field: { onChange, value } }) => (
                                            <Dropdown
                                                style={[styles.dropdown]} // Apply horizontal styling
                                                placeholderStyle={styles.placeholderStyle}
                                                selectedTextStyle={styles.selectedTextStyle}
                                                inputSearchStyle={styles.inputSearchStyle}
                                                iconStyle={styles.iconStyle}
                                                data={yearOptions}
                                                maxHeight={180}
                                                labelField="label"
                                                valueField="value"
                                                placeholder="Year"
                                                value={value}
                                                onChange={(item) => onChange(item.value)}
                                            />
                                        )}
                                    />
                                    {errors.year && <Text style={styles.error}>{errors.year.message}</Text>}
                                </View>
                                {/* Month Dropdown */}
                                <View style={styles.dropdownFit}>
                                    <Controller
                                        control={control}
                                        name="month"
                                        render={({ field: { onChange, value } }) => (
                                            <Dropdown
                                                style={[styles.dropdown]} // Apply horizontal styling
                                                placeholderStyle={styles.placeholderStyle}
                                                selectedTextStyle={styles.selectedTextStyle}
                                                inputSearchStyle={styles.inputSearchStyle}
                                                iconStyle={styles.iconStyle}
                                                data={monthOptions}
                                                maxHeight={180}
                                                labelField="label"
                                                valueField="value"
                                                placeholder="Month"
                                                value={value}
                                                onChange={(item) => onChange(item.value)}
                                            />
                                        )}
                                    />
                                    {errors.month && <Text style={styles.error}>{errors.month.message}</Text>}
                                </View>
                                {/* Day Dropdown */}
                                <View style={styles.dropdownFit}>
                                    <Controller
                                        control={control}
                                        name="day"
                                        render={({ field: { onChange, value } }) => (
                                            <Dropdown
                                                style={[styles.dropdown]} // Apply horizontal styling
                                                placeholderStyle={styles.placeholderStyle}
                                                selectedTextStyle={styles.selectedTextStyle}
                                                inputSearchStyle={styles.inputSearchStyle}
                                                iconStyle={styles.iconStyle}
                                                data={dayOptions}
                                                maxHeight={180}
                                                labelField="label"
                                                valueField="value"
                                                placeholder="Day"
                                                value={value}
                                                onChange={(item) => onChange(item.value)}
                                            />
                                        )}
                                    />
                                    {errors.day && <Text style={styles.error}>{errors.day.message}</Text>}
                                </View>
                            </View>
                            {/* Error messages for each dropdown */}
                            <View style={styles.errorContainer}>



                            </View>
                        </View>
                    </View>



                    {/* Horoscope Hints */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Horoscope Hints</Text>
                        <Controller
                            control={control}
                            render={({ field }) => (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Horoscope Hints"
                                    onChangeText={field.onChange}
                                    value={field.value}
                                />
                            )}
                            name="horoscopeHintsValue"
                            rules={{ required: 'HoroscopeHint is required' }}
                            defaultValue=""
                        />
                        {errors.horoscopeHintsValue && <Text style={styles.error}>{errors.horoscopeHintsValue.message}</Text>}
                    </View>

                    <TouchableOpacity
                        style={styles.btn}
                        onPress={handleSubmit(onSubmit)}
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
                                <Text style={styles.login}>{submitting ? "Submitting..." : "Register"}</Text>
                                <Ionicons name="arrow-forward" size={18} color="white" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </ScrollView>
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
        // color: "#4F515D",
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

    // pressable: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     borderColor: 'gray',
    //     borderWidth: 1,
    //     borderRadius: 5,
    //     padding: 10,
    //     width: 250,
    // },

    // input: {
    //     flex: 1,
    //     height: 40,
    //     borderWidth: 0,
    //     textAlign: 'left',
    // },

    clock: {
        position: "absolute",
        right: 10,
        top: 15,
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

    dropdownFlex: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "start",
        // marginBottom: 10,
        width: "100%",
    },

    dropdownFit: {
        width: "32.33%",
        // color: "#535665",
        // borderWidth: 1,
        // borderRadius: 4,
        // borderColor: "#D4D5D9",
        // padding: 8,
        // marginBottom: 10,
        fontFamily: "inter",
    },

    //   icon: {
    //     marginRight: 5,
    //   },

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
        padding: 10,
    },

    selectedBox: {
        // backgroundColor: "#007AFF",
        backgroundColor: "#FF6666",
        color: "#fff",
    },

    boxText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#535665",
    },

    selectedBoxText: {
        color: "#fff", // Change the color for the selected text
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

    errorContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    required: {
        color: "red", // Red color for the asterisk
    },


});