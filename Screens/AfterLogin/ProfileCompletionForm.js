import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";
import * as ImagePicker from "react-native-image-picker";
import { useNavigation } from "@react-navigation/native";
import {
  getMyProfilePersonal,
  ProfileCompletionFormAPI,
} from "../../CommonApiCall/CommonApiCall";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";
import { Colors, rs } from "../../Reusable/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import config from "../../API/Apiurl";


export const ProfileCompletionForm = () => {
  const [formData, setFormData] = useState({
    photo_upload: null,      // maps to "image" from API
    Profile_idproof: null,
    horoscope_file: null,
    EmailId: "",
    anual_income: "",        // Stores the annual income id directly
    property_worth: "",
    about_self: "",
    about_family: "",
    career_plans: "",
    Video_url: "",
  });

  const [emptyFields, setEmptyFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const navigation = useNavigation();
  const [annualIncomeOptions, setAnnualIncomeOptions] = useState([]);
  const [incomeDropdownVisible, setIncomeDropdownVisible] = useState(false);
  const [incomeLoading, setIncomeLoading] = useState(false);

  // ── Map API field → state key ────────────────────────────────────────
  const getStateKey = (apiField) => {
    if (apiField === "image") return "photo_upload";
    return apiField;
  };

  // Reverse map: state key → API field (for file submission)
  const getApiField = (stateKey) => {
    if (stateKey === "photo_upload") return "image";
    return stateKey;
  };

  useEffect(() => {
    const fetchAnnualIncome = async () => {
      try {
        setIncomeLoading(true);

        const response = await axios.post(
          `${config.apiUrl}/auth/Get_Annual_Income/`
        );

        console.log(
          "Annual Income API ===>",
          JSON.stringify(response.data)
        );

        const options = Object.values(response.data || {}).map((item) => ({
          id: item.income_id,
          description: item.income_description,
        }));

        setAnnualIncomeOptions(options);
      } catch (error) {
        console.error(
          "Annual Income API Error ===>",
          error?.response?.data || error.message
        );

        Toast.show({
          type: "error",
          text1: "Failed to load annual income",
          position: "top",
        });
      } finally {
        setIncomeLoading(false);
      }
    };

    fetchAnnualIncome();
  }, []);

  useEffect(() => {
    const fetchEmptyFields = async () => {
      try {
        setLoading(true);
        const response = await getMyProfilePersonal();
        const data = response.data;
        console.log("edit response ==>", JSON.stringify(response));
        setEmptyFields(data?.empty_fields?.map((field) => field.field) || []);
      } catch (err) {
        setError("Failed to fetch data from the API");
      } finally {
        setLoading(false);
      }
    };
    fetchEmptyFields();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  // ── File upload with mapping ──────────────────────────────────────────
  const handleFileChange = (apiField) => {
    ImagePicker.launchImageLibrary({ mediaType: "photo" }, (response) => {
      if (
        !response.didCancel &&
        !response.errorCode &&
        response.assets?.length > 0
      ) {
        const file = response.assets[0];
        const stateKey = getStateKey(apiField);

        setFormData({
          ...formData,
          [stateKey]: {
            uri: file.uri,
            type: file.type || "image/jpeg",
            name: file.fileName || `upload_${apiField}.jpg`,
          },
        });
      }
    });
  };

  const handleSubmit = async () => {
    const profileId = await AsyncStorage.getItem("loginuser_profileId");

    // File keys in state
    const fileStateKeys = ["photo_upload", "horoscope_file", "Profile_idproof"];

    // 1. Validation check
    const isAnyFieldFilled = Object.keys(formData).some((key) => {
      const value = formData[key];
      if (value === null || value === undefined) return false;

      if (typeof value === "string" || typeof value === "number") {
        return String(value).trim() !== "";
      }

      if (typeof value === "object" && value?.uri) {
        return true;
      }

      return false;
    });

    if (!isAnyFieldFilled) {
      Toast.show({
        type: "error",
        text1: "Please fill at least one field before submitting.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("profile_id", profileId || "");

    // 2. Text/Dropdown fields only (Excluding file fields to avoid [object Object] error)
    Object.keys(formData).forEach((key) => {
      if (!fileStateKeys.includes(key)) {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== "") {
          const apiKey = getApiField(key);
          formDataToSend.append(apiKey, String(value));
        }
      }
    });

    // 3. File fields upload handling with OS uri formatting
    const fileFields = ["image", "horoscope_file", "Profile_idproof"];
    fileFields.forEach((apiField) => {
      const stateKey = getStateKey(apiField);
      const file = formData[stateKey];

      if (file && file.uri) {
        const cleanUri =
          Platform.OS === "android" && !file.uri.startsWith("file://")
            ? `file://${file.uri}`
            : file.uri;

        formDataToSend.append(apiField, {
          uri: cleanUri,
          type: file.type || "image/jpeg",
          name: file.name || `upload_${apiField}.jpg`,
        });
      }
    });

    console.log("Payload to send ===>", formDataToSend);

    try {
      setFormSubmitting(true);
      const response = await ProfileCompletionFormAPI(formDataToSend);
      console.log("Success", response);

      Toast.show({
        type: "success",
        text1: "Profile updated successfully",
        position: "top",
        visibilityTime: 3000,
      });
      navigation.navigate("Menu");
    } catch (err) {
      console.error("Error submitting form", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to submit the form",
        position: "top",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const getFieldLabel = (field) => {
    const map = {
      image: "Profile Images",
      horoscope_file: "Horoscope Image",
      Profile_idproof: "Profile ID Proof",
      property_worth: "Property Worth",
      about_self: "About Myself",
      about_family: "About Family",
      career_plans: "Career Plans",
      anual_income: "Annual Income",
      Video_url: "Video URL",
      EmailId: "Email",
    };
    return map[field] || field.replace(/_/g, " ");
  };

  const renderField = (apiField) => {
    const stateKey = getStateKey(apiField);

    const isFileUpload =
      apiField === "image" ||
      apiField === "horoscope_file" ||
      apiField === "Profile_idproof";

    const value = formData[stateKey] || "";

    // Find the description matching the selected income_id stored in formData.anual_income
    const selectedIncome = annualIncomeOptions.find(
      (opt) => String(opt.id) === String(value)
    );
    const displayIncomeText = selectedIncome
      ? selectedIncome.description
      : "Select annual income";

    return (
      <View style={styles.fieldCard} key={apiField}>
        <Text style={styles.fieldLabel}>
          {getFieldLabel(apiField)}
        </Text>

        {isFileUpload ? (
          <TouchableOpacity
            style={styles.uploadArea}
            onPress={() => handleFileChange(apiField)}
            activeOpacity={0.7}
          >
            {value?.uri ? (
              <Image
                source={{ uri: value.uri }}
                style={styles.uploadPreview}
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={32}
                  color={Colors.primary}
                />
                <Text style={styles.uploadText}>
                  Tap to upload
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : apiField === "anual_income" ? (

          // ==============================
          // ANNUAL INCOME DROPDOWN
          // ==============================
          <>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setIncomeDropdownVisible(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedIncome && styles.dropdownPlaceholder,
                ]}
              >
                {displayIncomeText}
              </Text>

              <Ionicons
                name="chevron-down"
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>

            <Modal
              visible={incomeDropdownVisible}
              transparent
              animationType="fade"
              onRequestClose={() =>
                setIncomeDropdownVisible(false)
              }
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() =>
                  setIncomeDropdownVisible(false)
                }
              >
                <View style={styles.dropdownModal}>
                  <Text style={styles.dropdownModalTitle}>
                    Select Annual Income
                  </Text>

                  {incomeLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                      style={{ paddingVertical: 20 }}
                    />
                  ) : (
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={styles.incomeList}
                    >
                      {annualIncomeOptions.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.incomeOption}
                          onPress={() => {
                            // Stores income_id in formData.anual_income
                            handleInputChange(
                              "anual_income",
                              item.id
                            );

                            setIncomeDropdownVisible(false);
                          }}
                        >
                          <Text style={styles.incomeOptionText}>
                            {item.description}
                          </Text>

                          {String(value) === String(item.id) && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={Colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </TouchableOpacity>
            </Modal>
          </>
        ) : (

          // ==============================
          // NORMAL TEXT INPUT
          // ==============================
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={(text) =>
              handleInputChange(stateKey, text)
            }
            placeholder={`Enter ${getFieldLabel(
              apiField
            ).toLowerCase()}`}
            placeholderTextColor={Colors.textMuted}
            multiline={
              apiField === "about_self" ||
              apiField === "about_family" ||
              apiField === "career_plans"
            }
            numberOfLines={
              apiField === "about_self" ||
                apiField === "about_family" ||
                apiField === "career_plans"
                ? 3
                : 1
            }
            textAlignVertical={
              apiField === "about_self" ||
                apiField === "about_family" ||
                apiField === "career_plans"
                ? "top"
                : "center"
            }
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={[
            Colors.primaryGradientStart || "#A00014",
            Colors.primaryGradientEnd || "#4A000A",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.cardBackground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Profile</Text>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroContainer}>
            <Text style={styles.heroTitle}>
              Your perfect match is waiting.{"\n"}Complete your profile now!
            </Text>
            <Text style={styles.heroSubtitle}>
              Add the missing details to get better suggestions.
            </Text>
          </View>

          {emptyFields.length > 0 ? (
            emptyFields.map((field) => renderField(field))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={48}
                color={Colors.success}
              />
              <Text style={styles.emptyText}>
                All fields are complete! You're all set.
              </Text>
            </View>
          )}

          {emptyFields.length > 0 && (
            <TouchableOpacity
              style={styles.submitWrapper}
              onPress={handleSubmit}
              disabled={formSubmitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                {formSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Submit</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomTabBarComponent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.destructive,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 12,
    paddingBottom: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.cardBackground,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginLeft: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },
  heroContainer: {
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textDark,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: rs(14, 15, 16),
    color: Colors.textMuted,
    lineHeight: 22,
  },
  fieldCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: rs(14, 15, 16),
    fontWeight: "700",
    color: Colors.textDark,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: rs(14, 15, 16),
    color: Colors.textDark,
    backgroundColor: Colors.background,
    minHeight: 44,
  },
  uploadArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.background,
    overflow: "hidden",
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  uploadPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  uploadText: {
    fontSize: rs(13, 14, 15),
    color: Colors.textMuted,
    marginTop: 6,
  },
  uploadPreview: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
    borderRadius: 8,
  },
  submitWrapper: {
    width: "60%",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: rs(16, 17, 18),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: rs(16, 17, 18),
    color: Colors.textDark,
    fontWeight: "500",
    marginTop: 12,
    textAlign: "center",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 44,
    backgroundColor: Colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    flex: 1,
    fontSize: rs(14, 15, 16),
    color: Colors.textDark,
  },
  dropdownPlaceholder: {
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  dropdownModal: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    maxHeight: "75%",
    padding: 16,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textDark,
    marginBottom: 12,
  },
  incomeList: {
    maxHeight: 450,
  },
  incomeOption: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  incomeOptionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textDark,
  },
});