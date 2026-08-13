import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { launchImageLibrary } from "react-native-image-picker";
import * as Progress from "react-native-progress";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";
import Toast from "react-native-toast-message";
import { Colors, rs } from "../Reusable/Theme";

export const UploadImages = () => {
  const navigation = useNavigation();

  // ── Existing state ──────────────────────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);
  const [checked, setChecked] = useState(false);
  const [daughterImages, setDaughterImages] = useState([]);
  const [horoscopeImages, setHoroscopeImages] = useState([]);
  const [idProofImages, setIdProofImages] = useState([]);
  const [divorceCertificateImages, setDivorceCertificateImages] = useState([]);
  const [totalSpace] = useState(10);
  const [usedSpace, setUsedSpace] = useState(0);
  const [MobileNo, setMobileNo] = useState("");
  const [ProfileId, setProfileId] = useState("");
  const [ProfileOwner, setProfileOwner] = useState("");
  const [martialValue, setMartialStatus] = useState("");
  const [passwordProtection, setPasswordProtection] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // ── Existing functions ──────────────────────────────────────────────────
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    retrieveDataFromSession();
  }, []);

  const retrieveDataFromSession = async () => {
    try {
      let profileValue = await AsyncStorage.getItem("profile_owner");
      const profileId = await AsyncStorage.getItem("profile_id_new");
      const mobileno = await AsyncStorage.getItem("Mobile_no");
      const martialstatus = await AsyncStorage.getItem("martial_status");

      profileValue = profileValue === "Ownself" ? "yourself" : profileValue;

      setMobileNo(mobileno);
      setProfileId(profileId);
      setProfileOwner(profileValue);
      setMartialStatus(martialstatus);

      console.log("Retrieved Profile Value:", profileValue);
      console.log("Retrieved Profile ID:", profileId);
      console.log("Retrieved Mobile No:", mobileno);
      console.log("Retrieved Martial status:", martialstatus);
    } catch (error) {
      console.error("Error retrieving data from session:", error);
    }
  };

  const selectFile = (setFileState) => {
    launchImageLibrary({ mediaType: "photo", quality: 1 }, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorMessage) {
        console.log("ImagePicker Error: ", response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0];

        const newFile = {
          uri: selectedImage.uri,
          fileName: selectedImage.fileName || "unknown.jpg",
          fileSize: selectedImage.fileSize || 0,
          type: selectedImage.type || "image/jpeg",
        };

        const newFileSizeMB = newFile.fileSize / 1024 / 1024;

        if (usedSpace + newFileSizeMB > totalSpace) {
          Alert.alert("Error", "Not enough space available.");
        } else {
          setFileState((prevFiles) => [...prevFiles, newFile]);
          setUsedSpace((prevUsedSpace) => prevUsedSpace + newFileSizeMB);
        }
      }
    });
  };

  const removeFile = (index, files, setFileState) => {
    const removedFileSize = files[index].fileSize / 1024 / 1024;
    setFileState(files.filter((_, i) => i !== index));
    setUsedSpace((prevUsedSpace) => prevUsedSpace - removedFileSize);
  };

  const handleCheckboxToggle = () => {
    setChecked((prevChecked) => {
      const newChecked = !prevChecked;
      setPasswordProtection(newChecked ? 1 : 0);
      return newChecked;
    });
  };

  const uploadFile = async (url, file, fieldName, passwordProtection = null) => {
    try {
      const formData = new FormData();
      formData.append(fieldName, {
        uri: file.uri,
        name: file.fileName,
        type: file.type,
      });

      formData.append("profile_id", ProfileId);
      formData.append("mobile_no", MobileNo);

      if (passwordProtection !== null) {
        formData.append("photo_protection", passwordProtection);
      }

      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const responseJson = await response.json();
      console.log(`Upload success: ${url}`, responseJson);
    } catch (error) {
      console.error(`Upload failed: ${url}`, error.message);
    }
  };

  const LoadingOverlay = () => {
    if (!submitting) return null;

    return (
      <View style={[styles.loadingOverlay, StyleSheet.absoluteFill]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Uploading images, please wait...</Text>
        </View>
      </View>
    );
  };

  const somethingToUpload =
    daughterImages.length > 0 ||
    horoscopeImages.length > 0 ||
    idProofImages.length > 0 ||
    divorceCertificateImages.length > 0;

  const handleNextButtonClick = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      if (daughterImages.length > 0) {
        for (const file of daughterImages) {
          await uploadFile(`${config.apiUrl}/auth/ImageSetUpload/`, file, "image_files", passwordProtection);
        }
      }

      if (horoscopeImages.length > 0) {
        for (const file of horoscopeImages) {
          await uploadFile(`${config.apiUrl}/auth/Horoscope_upload/`, file, "horoscope_file");
        }
      }

      if (idProofImages.length > 0) {
        for (const file of idProofImages) {
          await uploadFile(`${config.apiUrl}/auth/Idproof_upload/`, file, "idproof_file");
        }
      }

      if (divorceCertificateImages.length > 0) {
        for (const file of divorceCertificateImages) {
          await uploadFile(`${config.apiUrl}/auth/Divorceproof_upload/`, file, "divorcepf_file");
        }
      }

      if (somethingToUpload) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Images uploaded successfully!",
          position: "top",
        });
      }

      navigation.navigate("FamilyDetails");
    } catch (error) {
      console.error("Error uploading images:", error);
      Alert.alert(
        "Error",
        "An error occurred while uploading images. Please try again."
      );
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
          <Text style={styles.headerTitle}>Upload Images</Text>
          <Text style={styles.headerSubtitle}>Add your photos & documents</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <LoadingOverlay />

        <View style={styles.cardContainer}>
          <Text style={styles.basicText}>
            {`Upload ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Images / Family Images`}
          </Text>

          <TouchableOpacity
            style={styles.uploadContainer}
            onPress={() => selectFile(setDaughterImages)}
          >
            <Ionicons name="cloud-upload-outline" size={24} color={Colors.textMuted} style={{ marginBottom: 4 }} />
            <Text style={styles.uploadText}>Select a file</Text>
          </TouchableOpacity>

          <ScrollView style={styles.filesContainer}>
            {daughterImages.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Image source={{ uri: file.uri }} style={styles.fileImage} />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileNameText}>{file.fileName}</Text>
                  <Text style={styles.fileSizeText}>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
                  <TouchableOpacity
                    onPress={() => removeFile(index, daughterImages, setDaughterImages)}
                  >
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <Progress.Bar
            progress={usedSpace / totalSpace}
            width={null}
            style={styles.progressBar}
            color={Colors.primary}
            unfilledColor={Colors.chipInactiveBg}
          />
          <Text style={styles.spaceText}>
            Total Available Space: {(((totalSpace - usedSpace) / totalSpace) * 100).toFixed(0)}%
          </Text>

          {/* ── Password protection checkbox ── */}
          <View style={styles.checkboxContainer}>
            <Pressable
              style={[styles.checkboxBase, checked && styles.checkboxChecked]}
              onPress={handleCheckboxToggle}
            >
              {checked && <Ionicons name="checkmark" size={14} color="white" />}
            </Pressable>
            <Pressable onPress={handleCheckboxToggle} style={styles.checkboxLabelWrapper}>
              <Text style={styles.checkboxLabel}>
                Protect my images with password (only people you share the password can view the images)
              </Text>
            </Pressable>
          </View>

          {checked && (
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Enter Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={togglePasswordVisibility} style={styles.passwordIcon}>
                  <AntDesign name={showPassword ? "eye" : "eyeo"} size={18} color={Colors.textMuted} />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* ── Horoscope ── */}
        <View style={styles.cardContainer}>
          <Text style={styles.basicText}>{`Upload ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Horoscope Image`}</Text>
          <TouchableOpacity
            style={styles.uploadContainer}
            onPress={() => selectFile(setHoroscopeImages)}
          >
            <Ionicons name="cloud-upload-outline" size={24} color={Colors.textMuted} style={{ marginBottom: 4 }} />
            <Text style={styles.uploadText}>Select a file</Text>
          </TouchableOpacity>

          <ScrollView style={styles.filesContainer}>
            {horoscopeImages.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Image source={{ uri: file.uri }} style={styles.fileImage} />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileNameText}>{file.fileName}</Text>
                  <Text style={styles.fileSizeText}>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
                  <TouchableOpacity
                    onPress={() => removeFile(index, horoscopeImages, setHoroscopeImages)}
                  >
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Video Link ── */}
        <View style={styles.cardContainer}>
          <Text style={styles.basicText}>Upload your Videos</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Upload video link</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter video URL"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.helperNote}>
              Note: If video link is not available, you can share the videos to Vysyamala's admin WhatsApp No.9043085524.
            </Text>
          </View>
        </View>

        {/* ── ID Proof ── */}
        <View style={styles.cardContainer}>
          <Text style={styles.basicText}>{`Upload ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} ID Proof`}</Text>
          <TouchableOpacity
            style={styles.uploadContainer}
            onPress={() => selectFile(setIdProofImages)}
          >
            <Ionicons name="cloud-upload-outline" size={24} color={Colors.textMuted} style={{ marginBottom: 4 }} />
            <Text style={styles.uploadText}>Select a file</Text>
          </TouchableOpacity>

          <ScrollView style={styles.filesContainer}>
            {idProofImages.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Image source={{ uri: file.uri }} style={styles.fileImage} />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileNameText}>{file.fileName}</Text>
                  <Text style={styles.fileSizeText}>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
                  <TouchableOpacity
                    onPress={() => removeFile(index, idProofImages, setIdProofImages)}
                  >
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Divorce Certificate ── */}
        {martialValue === "2" && (
          <View style={styles.cardContainer}>
            <Text style={styles.basicText}>{`Upload ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Divorce Certificate`}</Text>
            <TouchableOpacity
              style={styles.uploadContainer}
              onPress={() => selectFile(setDivorceCertificateImages)}
            >
              <Ionicons name="cloud-upload-outline" size={24} color={Colors.textMuted} style={{ marginBottom: 4 }} />
              <Text style={styles.uploadText}>Select a file</Text>
            </TouchableOpacity>

            <ScrollView style={styles.filesContainer}>
              {divorceCertificateImages.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <Image source={{ uri: file.uri }} style={styles.fileImage} />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileNameText}>{file.fileName}</Text>
                    <Text style={styles.fileSizeText}>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
                    <TouchableOpacity
                      onPress={() => removeFile(index, divorceCertificateImages, setDivorceCertificateImages)}
                    >
                      <Text style={styles.removeButton}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Next Button ── */}
        <TouchableOpacity
          style={styles.btn}
          onPress={handleNextButtonClick}
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
              <Text style={styles.buttonText}>{submitting ? "Submitting..." : "Next"}</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.primaryForeground || "#FFFFFF"} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.selectedBg || "#FBF5ED",
  },
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
  basicText: {
    color: Colors.textDark || "#1E1E1E",
    fontSize: rs(16, 17, 18),
    fontWeight: "700",
    marginBottom: rs(10, 12, 14),
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted || "#71717A",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputContainer: {
    width: "100%",
    marginBottom: rs(14, 18, 20),
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
  helperNote: {
    fontSize: 12,
    color: Colors.textMuted || "#71717A",
    marginTop: 4,
    lineHeight: 17,
  },
  uploadContainer: {
    borderWidth: 1.5,
    borderColor: Colors.border || "#E4E4E7",
    borderStyle: "dashed",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: Colors.selectedBg || "#F4F4F5",
  },
  uploadText: {
    color: Colors.textMuted || "#71717A",
    fontSize: 13,
  },
  filesContainer: {
    maxHeight: 140,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.selectedBg || "#F4F4F5",
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    marginBottom: 8,
  },
  fileImage: {
    width: 45,
    height: 45,
    borderRadius: 10,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 13,
    color: Colors.textDark || "#1E1E1E",
  },
  fileSizeText: {
    fontSize: 11,
    color: Colors.textMuted || "#71717A",
  },
  removeButton: {
    color: Colors.destructive || "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
  progressBar: {
    marginBottom: 6,
    borderRadius: 6,
  },
  spaceText: {
    fontSize: 12,
    color: Colors.textMuted || "#71717A",
    textAlign: "right",
  },
  // ── Fixed checkbox container ──
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 10,
    width: "100%",
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
    flexShrink: 0, // prevent checkbox from shrinking
  },
  checkboxChecked: {
    backgroundColor: Colors.primary || "#BD1225",
    borderColor: Colors.primary || "#BD1225",
  },
  checkboxLabelWrapper: {
    flex: 1,
    flexShrink: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.textDark || "#1E1E1E",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 40,
  },
  passwordIcon: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  btn: {
    width: "90%",
    alignSelf: "center",
    borderRadius: 26,
    shadowColor: Colors.primary || "#B72024",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: rs(8, 10, 12),
    marginBottom: 30,
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
  loadingOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: Colors.card || "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textDark || "#1E1E1E",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default UploadImages;