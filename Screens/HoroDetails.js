import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";
import { Colors, rs } from "../Reusable/Theme";

// ── Custom Modal Dropdown (popup) ──────────────────────────────────────────
const CustomDropdown = ({
  placeholder,
  data = [],
  selectedValue,
  onSelect,
  style,
  labelField = "label",
  valueField = "value",
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedItem = data.find((item) => String(item[valueField]) === String(selectedValue));
  const displayLabel = selectedItem ? selectedItem[labelField] : placeholder;

  return (
    <>
      <TouchableOpacity
        style={[styles.dropdownStyle, style]}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={
            selectedItem
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
              keyExtractor={(item, index) =>
                item[valueField] ? String(item[valueField]) : index.toString()
              }
              renderItem={({ item }) => {
                const isSelected = String(item[valueField]) === String(selectedValue);
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
                      {item[labelField]}
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

// ── Zod schema ──────────────────────────────────────────────────────────────
const chevvaiDoshamOptions = [
  { label: "Unknown", value: "Unknown" },
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

const schema = z.object({
  selectedTime: z.string().optional(),
  plValue: z.string().min(1, "Place of Birth is required"),
  stValue: z.string().min(1, "Birth Star is required"),
  padham: z.string().optional(),
  raValue: z.string().min(1, "Rasi is required"),
  laValue: z.string().optional(),
  didi: z.string().optional(),
  chdoshamValue: z.string().optional(),
  sarDoshamValue: z.string().optional(),
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
      padham: "",
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
  const [dasaList, setDasaList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDasaNames = async () => {
      try {
        const response = await axios.post(`${config.apiUrl}/auth/Get_Dasa_Name/`);
        const formattedDasaList = Object.values(response.data).map((dasa) => ({
          label: dasa.dasa_description,
          value: dasa.dasa_id.toString(),
        }));
        setDasaList(formattedDasaList);
      } catch (error) {
        console.error("Error fetching Dasa names:", error);
      }
    };
    fetchDasaNames();
  }, []);

  useEffect(() => {
    const days = Array.from({ length: 31 }, (_, i) => ({
      label: i.toString(),
      value: i.toString(),
    }));
    setDayOptions([{ label: "Days", value: "" }, ...days]);

    const months = Array.from({ length: 13 }, (_, i) => ({
      label: i.toString(),
      value: i.toString(),
    }));
    setMonthOptions([{ label: "Months", value: "" }, ...months]);

    const years = Array.from({ length: 30 }, (_, i) => ({
      label: `${i}`,
      value: `${i}`,
    }));
    setYearOptions([{ label: "Years", value: "" }, ...years]);

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
      const lagnamArray = Object.keys(response.data).map((key) => ({
        label: response.data[key].didi_description,
        value: response.data[key].didi_id.toString(),
      }));
      setLagnamOptions(lagnamArray);
    } catch (error) {
      console.error("Error fetching Lagnam:", error);
    }
  };

  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");

  const formattedTime = (time) => {
    let hours = time.getHours();
    let minutes = time.getMinutes();
    let period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    hours = hours.toString().padStart(2, "0");
    minutes = minutes.toString().padStart(2, "0");
    return `${hours}:${minutes} ${period}`;
  };

  const onTimeChange = (event, selectedTime) => {
    if (event.type === "set") {
      const currentTime = selectedTime || time;
      setShowTimePicker(false);
      setTime(currentTime);
      const formatted = formattedTime(currentTime);
      setSelectedTime(formatted);
    } else {
      setShowTimePicker(false);
    }
  };

  const retrieveDataFromSession = async () => {
    try {
      let profileValue = await AsyncStorage.getItem("profile_owner");
      const profileId = await AsyncStorage.getItem("profile_id_new");
      const mobileno = await AsyncStorage.getItem("Mobile_no");
      profileValue = profileValue === "Ownself" ? "yourself" : profileValue;
      console.log("Retrieved Profile Value:", profileValue);
      console.log("Retrieved Profile ID:", profileId);
      console.log("Retrieved Mobile No:", mobileno);
    } catch (error) {
      console.error("Error retrieving data from session:", error);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const profileId = await AsyncStorage.getItem("profile_id_new");
      if (!profileId) {
        throw new Error("ProfileId not found in sessionStorage");
      }

      const yearVal = data.year;
      const monthVal = data.month;
      const dayVal = data.day;

      const isAnyFieldSet =
        (yearVal !== null && yearVal !== undefined && yearVal !== "") ||
        (monthVal !== null && monthVal !== undefined && monthVal !== "") ||
        (dayVal !== null && dayVal !== undefined && dayVal !== "");

      let dasabalance = "";
      if (isAnyFieldSet) {
        const finalYear = yearVal || "0";
        const finalMonth = monthVal || "0";
        const finalDay = dayVal || "0";
        dasabalance = `${finalYear} Years, ${finalMonth} Months, ${finalDay} Days`;
      }

      await AsyncStorage.setItem("birthStarValue", data.stValue);
      await AsyncStorage.setItem("birthStaridValue", data.raValue);

      const formattedData = {
        profile_id: profileId,
        place_of_birth: data.plValue,
        time_of_birth: data.selectedTime,
        birthstar_name: data.stValue,
        padham: data.padham ? Number(data.padham) : null,
        birth_rasi_name: data.raValue,
        lagnam_didi: data.laValue || "",
        chevvai_dosaham: data.chdoshamValue || "",
        ragu_dosham: data.sarDoshamValue || "",
        nalikai: data.naalikaiValue,
        dasa_name: data.dasaNameValue,
        dasa_balance: dasabalance,
        horoscope_hints: data.horoscopeHintsValue,
        didi: data.didi || "",
        amsa_kattam: "{Grid 1: empty, Grid 2: empty, Grid 3: empty, Grid 4: empty, Grid 5: empty, Grid 6: empty, Grid 7: empty, Grid 8: empty, Grid 9: empty, Grid 10: empty, Grid 11: empty, Grid 12: empty}",
        rasi_kattam: "{Grid 1: empty, Grid 2: empty, Grid 3: empty, Grid 4: empty, Grid 5: empty, Grid 6: empty, Grid 7: empty, Grid 8: empty, Grid 9: empty, Grid 10: empty, Grid 11: empty, Grid 12: empty}",
      };

      console.log("Formatted Data:", formattedData);
      const response = await axios.post(`${config.apiUrl}/auth/Horoscope_registration/`, formattedData);
      if (response.data.Status === 1) {
        await AsyncStorage.setItem("birthstar", data.stValue);
        navigation.navigate("PartnerSettings");
      } else {
        console.error("Error: Response status is not 1", response.data);
      }
    } catch (error) {
      console.error("Error submitting form data:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Gradient Header ────────────────────────────────────────────── */}
      <LinearGradient
        colors={[Colors.primaryGradientStart || "#A00014", Colors.primaryGradientEnd || "#4A000A"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBanner}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Horoscope Details</Text>
          <Text style={styles.headerSubtitle}>Enter your astrological details</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.cardContainer}>
          {/* ── Time of Birth ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Time of Birth</Text>
            <Controller
              control={control}
              name="selectedTime"
              defaultValue=""
              render={({ field: { onChange, value } }) => (
                <>
                  <Pressable onPress={() => setShowTimePicker(true)} style={styles.pressable}>
                    <TextInput
                      style={styles.input}
                      placeholder="Time (HH:MM)"
                      placeholderTextColor={Colors.textMuted}
                      editable={false}
                      value={value}
                    />
                    <MaterialCommunityIcons style={styles.clock} name="clock-outline" size={18} color={Colors.textMuted} />
                  </Pressable>
                  {showTimePicker && (
                    <DateTimePicker
                      mode="time"
                      display="spinner"
                      value={time}
                      onChange={(event, selectedTime) => {
                        onTimeChange(event, selectedTime);
                        onChange(formattedTime(selectedTime || time));
                      }}
                    />
                  )}
                  {errors.selectedTime && <Text style={styles.errorText}>{errors.selectedTime.message}</Text>}
                  <Text style={styles.selectedTimeDisplay}>Selected Time: {selectedTime}</Text>
                </>
              )}
            />
          </View>

          {/* ── Place of Birth ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Place of Birth <Text style={styles.requiredStar}>*</Text></Text>
            <Controller
              control={control}
              name="plValue"
              rules={{ required: "Place of Birth is required" }}
              defaultValue=""
              render={({ field }) => (
                <TextInput
                  style={[styles.input, errors.plValue && styles.inputError]}
                  placeholder="Place of Birth"
                  placeholderTextColor={Colors.textMuted}
                  onChangeText={field.onChange}
                  value={field.value}
                />
              )}
            />
            {errors.plValue && <Text style={styles.errorText}>{errors.plValue.message}</Text>}
          </View>

          {/* ── Birth Star ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Birth Star <Text style={styles.requiredStar}>*</Text></Text>
            <Controller
              control={control}
              name="stValue"
              rules={{ required: "Birth Star is required" }}
              defaultValue=""
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Birth Star"
                  data={birthStar}
                  selectedValue={value}
                  onSelect={(item) => {
                    onChange(item.value);
                    fetchRasiList(item.value);
                  }}
                />
              )}
            />
            {errors.stValue && <Text style={styles.errorText}>{errors.stValue.message}</Text>}
          </View>

          {/* ── Padham ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Padham</Text>
            <Controller
              control={control}
              name="padham"
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Padham"
                  data={[
                    { label: "1", value: "1" },
                    { label: "2", value: "2" },
                    { label: "3", value: "3" },
                    { label: "4", value: "4" },
                  ]}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
            {errors.padham && <Text style={styles.errorText}>{errors.padham.message}</Text>}
          </View>

          {/* ── Rasi ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Rasi <Text style={styles.requiredStar}>*</Text></Text>
            <Controller
              control={control}
              name="raValue"
              rules={{ required: "Rasi is required" }}
              defaultValue=""
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Rasi"
                  data={birthRasi}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
            {errors.raValue && <Text style={styles.errorText}>{errors.raValue.message}</Text>}
          </View>

          {/* ── Lagnam ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Lagnam</Text>
            <Controller
              control={control}
              name="laValue"
              defaultValue=""
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Lagnam"
                  data={lagnam}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
            {errors.laValue && <Text style={styles.errorText}>{errors.laValue.message}</Text>}
          </View>

          {/* ── Didi ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Didi</Text>
            <Controller
              control={control}
              name="didi"
              defaultValue=""
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Select Didi"
                  placeholderTextColor={Colors.textMuted}
                  onChangeText={field.onChange}
                  value={field.value}
                />
              )}
            />
          </View>

          {/* ── Chevvai Dosham ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Chevvai Dosham</Text>
            <Controller
              control={control}
              name="chdoshamValue"
              defaultValue=""
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Chevvai Dosham"
                  data={chevvaiDoshamOptions}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
            {errors.chdoshamValue && <Text style={styles.errorText}>{errors.chdoshamValue.message}</Text>}
          </View>

          {/* ── Ragu/Rahu/Kethu Dhosam ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Rahu/Ketu Dhosam</Text>
            <Controller
              control={control}
              name="sarDoshamValue"
              defaultValue=""
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Rahu/Ketu Dhosam"
                  data={chevvaiDoshamOptions}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
            {errors.sarDoshamValue && <Text style={styles.errorText}>{errors.sarDoshamValue.message}</Text>}
          </View>

          {/* ── Naalikai ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Naalikai</Text>
            <Controller
              control={control}
              name="naalikaiValue"
              defaultValue=""
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Naalikai"
                  placeholderTextColor={Colors.textMuted}
                  onChangeText={field.onChange}
                  value={field.value}
                />
              )}
            />
            {errors.naalikaiValue && <Text style={styles.errorText}>{errors.naalikaiValue.message}</Text>}
          </View>

          {/* ── Dasa Name ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Dasa Name</Text>
            <Controller
              control={control}
              name="dasaNameValue"
              defaultValue=""
              render={({ field: { onChange, value } }) => (
                <CustomDropdown
                  placeholder="Select Dasa Name"
                  data={dasaList}
                  selectedValue={value}
                  onSelect={(item) => onChange(item.value)}
                />
              )}
            />
            {errors.dasaNameValue && <Text style={styles.errorText}>{errors.dasaNameValue.message}</Text>}
          </View>

          {/* ── Dasa Balance ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Dasa Balance</Text>
            <View style={styles.rowContainer}>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="year"
                  render={({ field: { onChange, value } }) => (
                    <CustomDropdown
                      placeholder="Year"
                      data={yearOptions}
                      selectedValue={value}
                      onSelect={(item) => onChange(item.value)}
                    />
                  )}
                />
                {errors.year && <Text style={styles.errorText}>{errors.year.message}</Text>}
              </View>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="month"
                  render={({ field: { onChange, value } }) => (
                    <CustomDropdown
                      placeholder="Month"
                      data={monthOptions}
                      selectedValue={value}
                      onSelect={(item) => onChange(item.value)}
                    />
                  )}
                />
                {errors.month && <Text style={styles.errorText}>{errors.month.message}</Text>}
              </View>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="day"
                  render={({ field: { onChange, value } }) => (
                    <CustomDropdown
                      placeholder="Day"
                      data={dayOptions}
                      selectedValue={value}
                      onSelect={(item) => onChange(item.value)}
                    />
                  )}
                />
                {errors.day && <Text style={styles.errorText}>{errors.day.message}</Text>}
              </View>
            </View>
          </View>

          {/* ── Horoscope Hints ── */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Horoscope Hints</Text>
            <Controller
              control={control}
              name="horoscopeHintsValue"
              defaultValue=""
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Horoscope Hints"
                  placeholderTextColor={Colors.textMuted}
                  onChangeText={field.onChange}
                  value={field.value}
                />
              )}
            />
            {errors.horoscopeHintsValue && <Text style={styles.errorText}>{errors.horoscopeHintsValue.message}</Text>}
          </View>

          {/* ── Register Button ── */}
          <TouchableOpacity
            style={styles.btn}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primary || "#FF4050"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.linearGradient}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>{submitting ? "Submitting..." : "Register"}</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.primaryForeground || "#FFFFFF"} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.selectedBg || "#FBF5ED",
  },
  // ── Header ──────────────────────────────────────────────────────────────
  headerBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: rs(12, 16, 20),
    paddingBottom: 24,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: rs(12, 13, 14),
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  // ── Scroll content ─────────────────────────────────────────────────────
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: rs(12, 16, 20),
    alignItems: "center",
    paddingBottom: 80,
  },
  cardContainer: {
    width: "90%",
    backgroundColor: Colors.card || "#FFFFFF",
    borderRadius: 24,
    padding: rs(18, 22, 26),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: rs(12, 16, 20),
  },
  inputContainer: {
    width: "100%",
    marginBottom: rs(14, 18, 20),
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted || "#71717A",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  requiredStar: {
    color: Colors.destructive || "#EF4444",
  },
  input: {
    color: Colors.textDark || "#1E1E1E",
    borderWidth: 1,
    borderRadius: 16,
    borderColor: Colors.border || "#E4E4E7",
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    paddingHorizontal: 12,
    paddingVertical: rs(10, 12, 14),
    fontSize: 14,
  },
  inputError: {
    borderColor: Colors.destructive || "#EF4444",
  },
  pressable: {
    position: "relative",
  },
  clock: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  selectedTimeDisplay: {
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
    marginTop: 4,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfField: {
    flex: 1,
    marginRight: 8,
  },
  // ── Custom Dropdown styles ──────────────────────────────────────────────
  dropdownStyle: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    paddingHorizontal: 12,
    paddingVertical: rs(8, 10, 12),
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: Colors.textMuted || "#71717A",
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
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
  // ── Button ──
  btn: {
    width: "100%",
    borderRadius: 26,
    shadowColor: Colors.primary || "#B72024",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: rs(8, 10, 12),
    marginBottom: 10,
  },
  linearGradient: {
    borderRadius: 26,
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    textAlign: "center",
    color: Colors.primaryForeground || "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
    marginRight: 6,
  },
  errorText: {
    color: Colors.destructive || "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
});

export default HoroDetails;