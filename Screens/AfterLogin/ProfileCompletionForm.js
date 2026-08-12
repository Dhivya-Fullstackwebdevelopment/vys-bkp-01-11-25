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

export const ProfileCompletionForm = () => {
  const [formData, setFormData] = useState({
    photo_upload: null,      // maps to "image" from API
    Profile_idproof: null,
    horoscope_file: null,
    EmailId: "",
    anual_income: "",
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

  // ── Map API field → state key ────────────────────────────────────────
  const getStateKey = (apiField) => {
    if (apiField === "image") return "photo_upload";
    return apiField; // horoscope_file, Profile_idproof, etc.
  };

  // Reverse map: state key → API field (for file submission)
  const getApiField = (stateKey) => {
    if (stateKey === "photo_upload") return "image";
    return stateKey;
  };

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
      console.log("Response = ", response);

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

    // Check if at least one field is filled
    const isAnyFieldFilled = Object.keys(formData).some((key) => {
      const value = formData[key];
      return (
        (typeof value === "string" && value.trim() !== "") ||
        (typeof value === "object" && value?.uri)
      );
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

    // Text fields
    Object.keys(formData).forEach((key) => {
      const value = formData[key];
      if (typeof value === "string" && value.trim() !== "") {
        // Map state key back to API field name if needed
        const apiKey = getApiField(key);
        formDataToSend.append(apiKey, value);
      }
    });

    // File fields – use original API field names
    const fileFields = ["image", "horoscope_file", "Profile_idproof"];
    fileFields.forEach((apiField) => {
      const stateKey = getStateKey(apiField);
      const file = formData[stateKey];
      if (file && file.uri) {
        formDataToSend.append(apiField, {
          uri: file.uri,
          type: file.type,
          name: file.name,
        });
      }
    });

    console.log("Payload to send ===>", JSON.stringify(formDataToSend));

    try {
      setFormSubmitting(true);
      const response = await ProfileCompletionFormAPI(formDataToSend);
      console.log("Success", "Form submitted successfully", JSON.stringify(response));
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

    return (
      <View style={styles.fieldCard} key={apiField}>
        <Text style={styles.fieldLabel}>{getFieldLabel(apiField)}</Text>

        {isFileUpload ? (
          <TouchableOpacity
            style={styles.uploadArea}
            onPress={() => handleFileChange(apiField)}
            activeOpacity={0.7}
          >
            {value?.uri ? (
              <Image source={{ uri: value.uri }} style={styles.uploadPreview} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={32}
                  color={Colors.primary}
                />
                <Text style={styles.uploadText}>Tap to upload</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={(text) => handleInputChange(stateKey, text)}
            placeholder={`Enter ${getFieldLabel(apiField).toLowerCase()}`}
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
        {/* Gradient Header */}
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
          {/* Hero message */}
          <View style={styles.heroContainer}>
            <Text style={styles.heroTitle}>
              Your perfect match is waiting.{"\n"}Complete your profile now!
            </Text>
            <Text style={styles.heroSubtitle}>
              Add the missing details to get better suggestions.
            </Text>
          </View>

          {/* Fields */}
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

          {/* Submit Button */}
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
                  <Text style={styles.submitText}>Update Profile</Text>
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
    lineSpacing: -1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,   // ✅ Extra bottom spacing to avoid bottom tab overlap
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
    lineSpacing: -1,
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
});