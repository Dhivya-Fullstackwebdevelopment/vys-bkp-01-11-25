import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import axios from "axios";
import config from "../API/Apiurl";
import { Picker } from "@react-native-picker/picker";
import { BottomTabBarComponent } from "../Navigation/ReuseTabNavigation";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, rs } from "../Reusable/Theme";

export const UploadWedding = () => {
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginUserProfileId, setLoginUserProfileId] = useState("");

  // Form States
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [through, setThrough] = useState("Vysyamala");
  const [experience, setExperience] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Calendar Picker Control States
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDateValue, setCurrentDateValue] = useState(new Date());

  // Upload Management States
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [localFileName, setLocalFileName] = useState("");

  // Validation Error States
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const getProfileId = async () => {
      const id =
        (await AsyncStorage.getItem("loginuser_profileId")) ||
        (await AsyncStorage.getItem("profile_id_new"));
      if (id) setLoginUserProfileId(id);
    };
    getProfileId();
  }, []);

  // ── Interactive Calendar Event Handlers ─────────────────────────
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowCalendar(false);
    }

    if (selectedDate) {
      setCurrentDateValue(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      setWeddingDate(formattedDate);
      setErrors((p) => ({ ...p, weddingDate: null }));
    }
  };

  // ── Media Selection & Safe Processing Pipeline ──────────────────
  const handlePickPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required 🔒",
          "You need to allow access to your photos to upload a wedding picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const filename = asset.fileName || asset.uri.split("/").pop() || "wedding_photo.jpg";
      const mimeType = asset.mimeType || "image/jpeg";

      setLocalFileName(filename);
      setErrors((prev) => ({ ...prev, photo: null }));
      setIsUploadingImage(true);

      const imageUploadData = new FormData();
      imageUploadData.append("image", {
        uri: Platform.OS === "android" ? asset.uri : asset.uri.replace("file://", ""),
        name: filename,
        type: mimeType,
      });
      imageUploadData.append("profile_id", loginUserProfileId);

      console.log("Uploading Wedding Image directly to Backend API...");

      const imageResponse = await axios.post(
        `${config.apiUrl}/auth/upload-profile-image/`,
        imageUploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );

      console.log("Image Upload API Response Data:", imageResponse.data);
      const isImageUploadSuccess =
        imageResponse.data?.status === 1 || imageResponse.data?.Status === 1;

      if (imageResponse.status === 200 && isImageUploadSuccess) {
        const serverUrl = imageResponse.data?.url || asset.uri;
        setUploadedPhotoUrl(serverUrl);

        Toast.show({
          type: "success",
          text1: "Uploaded Successfully ✓",
          text2: "Your wedding image is verified on the server.",
          position: "bottom",
        });
      } else {
        setLocalFileName("");
        setUploadedPhotoUrl("");
        Toast.show({
          type: "error",
          text1: "Upload Failed",
          text2: imageResponse.data?.message || "Failed to process crop imagery properties.",
          position: "top",
        });
      }
    } catch (err) {
      console.log("Gallery Picker or Upload Failure Context:", err);
      setLocalFileName("");
      setUploadedPhotoUrl("");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to upload photo selection to the server.",
        position: "bottom",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validateForm = () => {
    let valid = true;
    let formErrors = {};

    if (!name.trim()) {
      formErrors.name = "Bride / Groom Name is required";
      valid = false;
    }
    if (!city.trim()) {
      formErrors.city = "City is required";
      valid = false;
    }
    if (!weddingDate.trim()) {
      formErrors.weddingDate = "Wedding Date selection is required";
      valid = false;
    }
    if (!experience.trim()) {
      formErrors.experience = "Please share your experience";
      valid = false;
    }
    if (!uploadedPhotoUrl) {
      formErrors.photo = "Wedding photo upload is mandatory";
      valid = false;
    }
    if (!agreed) {
      formErrors.agreed = "You must agree to display the photo";
      valid = false;
    }

    setErrors(formErrors);
    return valid;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const marriageDetailsPayload = {
        profile_id: loginUserProfileId,
        marriage_date: weddingDate,
        groom_bride_name: name,
        groombridecity: city,
        settled_thru: through,
        marriage_comments: experience,
        marriage_photo_details: agreed ? "Yes" : "No",
        marriage_image_url: uploadedPhotoUrl,
      };

      console.log("Submitting Settlement Details Payload:", marriageDetailsPayload);
      const detailsResponse = await axios.post(
        `${config.apiUrl}/api/marriage-settle-details/create/`,
        marriageDetailsPayload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Settlement Details Response Data:", detailsResponse.data);

      if (detailsResponse.status === 200 || detailsResponse.status === 201) {
        Alert.alert(
          "Wedding Details Submitted! 💍",
          "Thank you for sharing your beautiful success story with us!",
          [
            {
              text: "OK",
              onPress: async () => {
                await AsyncStorage.clear();
                navigation.reset({
                  index: 0,
                  routes: [{ name: "LoginPage" }],
                });
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error("Submission Framework Error Context:", error?.response?.data || error);
      Toast.show({
        type: "error",
        text1: "Unexpected Error",
        text2: error?.response?.data?.message || "An error occurred during submission.",
        position: "top",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Gradient Header ────────────────────────────────────────── */}
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
          <Text style={styles.headerTitle}>Upload Wedding Details</Text>
          <Text style={styles.headerSubtitle}>Share your success story 💍</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* ── Bride / Groom Name ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>
              Bride / Groom Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter name"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors((p) => ({ ...p, name: null }));
              }}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* ── City ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>
              City <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="Enter city"
              placeholderTextColor={Colors.textMuted}
              value={city}
              onChangeText={(text) => {
                setCity(text);
                setErrors((p) => ({ ...p, city: null }));
              }}
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          {/* ── Wedding Date ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>
              Wedding Date <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.dateSelectorButton, errors.weddingDate && styles.inputError]}
              onPress={() => setShowCalendar(true)}
            >
              <Text
                style={[styles.dateSelectorText, !weddingDate && { color: Colors.textMuted }]}
              >
                {weddingDate ? weddingDate : "Select Wedding Date"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            {errors.weddingDate && <Text style={styles.errorText}>{errors.weddingDate}</Text>}

            {showCalendar && (
              <View>
                <DateTimePicker
                  value={currentDateValue}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={styles.iosDoneButton}
                    onPress={() => setShowCalendar(false)}
                  >
                    <Text style={styles.iosDoneButtonText}>Confirm Date Selection</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* ── Marriage Fixed Through ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>
              Marriage Fixed Through <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.pickerBorder}>
              <Picker
                selectedValue={through}
                onValueChange={(itemValue) => setThrough(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Vysyamala" value="Vysyamala" />
                <Picker.Item label="Relative" value="Relative" />
                <Picker.Item label="Friend" value="Friend" />
                <Picker.Item label="Others" value="Others" />
              </Picker>
            </View>
          </View>

          {/* ── Upload Wedding Photo ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>
              Upload Wedding Photo <Text style={styles.requiredStar}>*</Text>
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.uploadButton,
                uploadedPhotoUrl
                  ? styles.uploadSuccessBorder
                  : errors.photo
                  ? styles.inputError
                  : null,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handlePickPhoto}
              disabled={isUploadingImage}
            >
              <View style={styles.uploadRowLeft}>
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 10 }} />
                ) : (
                  <Ionicons
                    name={uploadedPhotoUrl ? "checkmark-circle" : "image-outline"}
                    size={22}
                    color={uploadedPhotoUrl ? Colors.success : Colors.textMuted}
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text
                  style={[
                    styles.uploadButtonText,
                    uploadedPhotoUrl && { color: Colors.success, fontWeight: "600" },
                  ]}
                  numberOfLines={1}
                >
                  {isUploadingImage
                    ? "Uploading Image..."
                    : uploadedPhotoUrl
                    ? "✓ Uploaded successfully"
                    : "Select & Crop Wedding Photo"}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: uploadedPhotoUrl ? "#DCFCE7" : Colors.chipInactiveBg },
                ]}
              >
                <Ionicons
                  name={uploadedPhotoUrl ? "checkmark" : "cloud-upload-outline"}
                  size={16}
                  color={uploadedPhotoUrl ? Colors.success : Colors.textMuted}
                />
              </View>
            </Pressable>
            {errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}
          </View>

          {/* ── Preview Area ── */}
          {uploadedPhotoUrl && !isUploadingImage && (
            <View style={styles.previewBox}>
              <Image source={{ uri: uploadedPhotoUrl }} style={styles.previewImage} />
              <Text style={styles.previewText}>Uploaded File: {localFileName}</Text>
            </View>
          )}

          {/* ── Your Experience ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>
              Your Experience <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.experience && styles.inputError]}
              placeholder="Share your experience"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              value={experience}
              onChangeText={(text) => {
                setExperience(text);
                setErrors((p) => ({ ...p, experience: null }));
              }}
            />
            {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}
          </View>

          {/* ── Checkbox ── */}
          <View style={styles.checkboxContainer}>
            <Pressable
              style={[
                styles.checkboxBase,
                agreed && styles.checkboxChecked,
                errors.agreed && styles.checkboxError,
              ]}
              onPress={() => {
                setAgreed(!agreed);
                setErrors((p) => ({ ...p, agreed: null }));
              }}
            >
              {agreed && <Ionicons name="checkmark" size={14} color="white" />}
            </Pressable>
            <Text style={styles.checkboxLabel}>
              I agree to display the photo in Santhosha Pendlilu section
            </Text>
          </View>
          {errors.agreed && (
            <Text style={[styles.errorText, { marginTop: -5, marginBottom: 15 }]}>
              {errors.agreed}
            </Text>
          )}

          {/* ── Submit Button ── */}
          <TouchableOpacity
            style={styles.btn}
            onPress={onSubmit}
            disabled={isSubmitting || isUploadingImage}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primary || "#FF4050"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.linearGradient}
            >
              <View style={styles.buttonContent}>
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.primaryForeground || "#FFFFFF"} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Submit Details</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={Colors.primaryForeground || "#FFFFFF"}
                    />
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomTabBarComponent />
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
    paddingBottom: 100,
  },
  card: {
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
  inputGroup: {
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerBorder: {
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.selectedBg || "#F4F4F5",
  },
  picker: {
    color: Colors.textDark || "#1E1E1E",
  },
  dateSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    padding: 12,
    backgroundColor: Colors.selectedBg || "#F4F4F5",
  },
  dateSelectorText: {
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
    fontFamily: "inter",
  },
  iosDoneButton: {
    padding: 10,
    backgroundColor: Colors.chipInactiveBg || "#F4F4F5",
    alignItems: "center",
    marginTop: 5,
    borderRadius: 8,
  },
  iosDoneButtonText: {
    color: Colors.primary || "#B72024",
    fontWeight: "700",
    fontSize: 14,
  },
  // ── Upload ──────────────────────────────────────────────────────────────
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    padding: 12,
    backgroundColor: Colors.selectedBg || "#F4F4F5",
  },
  uploadRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  uploadSuccessBorder: {
    borderColor: Colors.success || "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: Colors.textMuted || "#71717A",
    fontSize: 14,
    flex: 1,
  },
  previewBox: {
    alignItems: "center",
    marginBottom: 15,
    marginTop: 5,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.success || "#22C55E",
  },
  previewText: {
    fontSize: 11,
    color: Colors.textMuted || "#666",
    marginTop: 5,
  },
  // ── Checkbox ────────────────────────────────────────────────────────────
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkboxBase: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border || "#E4E4E7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 2,
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary || "#BD1225",
    borderColor: Colors.primary || "#BD1225",
  },
  checkboxError: {
    borderColor: Colors.destructive || "#EF4444",
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
    flex: 1,
    lineHeight: 18,
  },
  // ── Button ──────────────────────────────────────────────────────────────
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