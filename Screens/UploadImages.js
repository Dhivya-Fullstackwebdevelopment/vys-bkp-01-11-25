import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import * as Progress from "react-native-progress";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../API/Apiurl";
import Toast from "react-native-toast-message";


export const UploadImages = () => {
  const navigation = useNavigation();

  // State declarations for each file type
  const [showPassword, setShowPassword] = useState(false);
  const [checked, setChecked] = useState(false);
  const [daughterImages, setDaughterImages] = useState([]);
  const [horoscopeImages, setHoroscopeImages] = useState([]);
  const [idProofImages, setIdProofImages] = useState([]);
  const [divorceCertificateImages, setDivorceCertificateImages] = useState([]); // New state for divorce certificate
  const [totalSpace] = useState(10); // Assuming 10 MB total space for simplicity
  const [usedSpace, setUsedSpace] = useState(0);
  const [MobileNo, setMobileNo] = useState("");
  const [ProfileId, setProfileId] = useState("");
  const [ProfileOwner, setProfileOwner] = useState("");
  const [martialValue, setMartialStatus] = useState("");
  const [passwordProtection, setPasswordProtection] = useState(0); // Variable for password protection status
  const [submitting, setSubmitting] = useState(false); // Add state to track submission



  // Function to toggle password visibility
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

      // Replace "ownself" with "yourself"
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

  // Function to handle file selection for different types
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

  // Remove a file
  const removeFile = (index, files, setFileState) => {
    const removedFileSize = files[index].fileSize / 1024 / 1024;
    setFileState(files.filter((_, i) => i !== index));
    setUsedSpace((prevUsedSpace) => prevUsedSpace - removedFileSize);
  };

  // const handleCheckboxToggle = () => {
  //   setChecked(!checked);
  // };


  const handleCheckboxToggle = () => {
    setChecked((prevChecked) => {
      const newChecked = !prevChecked;
      setPasswordProtection(newChecked ? 1 : 0); // Set value to 1 if checked, otherwise 0
      return newChecked;
    });
  };

  console.log(passwordProtection);
  // Upload files using fetch
  const uploadFile = async (url, file, fieldName, passwordProtection = null) => {
    try {
      setSubmitting(true); // Set submitting state to true

      const formData = new FormData();
      formData.append(fieldName, {
        uri: file.uri,
        name: file.fileName,
        type: file.type,
      });

      formData.append("profile_id", ProfileId);
      formData.append("mobile_no", MobileNo);

      // Conditionally append passwordProtection for ImageSetUpload API
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
    finally {
      setSubmitting(false); // Reset submitting state after API call
    }
  };

  // Add loading overlay component
  const LoadingOverlay = () => {
    if (!submitting) return null;

    return (
      <View style={[styles.loadingOverlay, StyleSheet.absoluteFill]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4050" />
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


  // Handle "Next" button click to upload images
  const handleNextButtonClick = async () => {
    if (submitting) return; // Prevent multiple submissions

    try {
      setSubmitting(true); // Set submitting state to true

      // Upload daughter images
      if (daughterImages.length > 0) {
        for (const file of daughterImages) {
          await uploadFile(`${config.apiUrl}/auth/ImageSetUpload/`, file, "image_files", passwordProtection);
        }
      }

      // Upload horoscope images
      if (horoscopeImages.length > 0) {
        for (const file of horoscopeImages) {
          await uploadFile(`${config.apiUrl}/auth/Horoscope_upload/`, file, "horoscope_file");
        }
      }

      // Upload ID proof images
      if (idProofImages.length > 0) {
        for (const file of idProofImages) {
          await uploadFile(`${config.apiUrl}/auth/Idproof_upload/`, file, "idproof_file");
        }
      }

      // Upload divorce certificate images if applicable
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
        });
      }
      // Alert.alert("Success", "Images uploaded successfully.");
      navigation.navigate("FamilyDetails");
    } catch (error) {
      console.error("Error uploading images:", error);
      Alert.alert(
        "Error",
        "An error occurred while uploading images. Please try again."
      );
    } finally {
      setSubmitting(false); // Reset submitting state after all operations
    }
  };


  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
        <LoadingOverlay />
        <Text style={styles.uploadHead}>Upload Images</Text>

        <Text style={styles.basicText}>
          {`Upload ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Images / Family Images`}
        </Text>

        <View style={styles.formContainer}>
          <TouchableOpacity
            style={styles.uploadContainer}
            onPress={() => selectFile(setDaughterImages)}
          >
            <Text style={styles.uploadText}>
              Select a file
            </Text>
          </TouchableOpacity>

          <ScrollView style={styles.filesContainer}>
            {daughterImages.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Image source={{ uri: file.uri }} style={styles.fileImage} />
                <View style={styles.fileDetails}>
                  <Text>{file.fileName}</Text>
                  <Text>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
                  <TouchableOpacity
                    onPress={() =>
                      removeFile(index, daughterImages, setDaughterImages)
                    }
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
          />
          <Text style={styles.spaceText}>
            Total Available Space:{" "}
            {(((totalSpace - usedSpace) / totalSpace) * 100).toFixed(0)}%
          </Text>

          {/* <View style={styles.checkboxContainer}>
            <Pressable
              style={[styles.checkboxBase, checked && styles.checkboxChecked]}
              onPress={handleCheckboxToggle}
            >
              {checked && <Ionicons name="checkmark" size={14} color="white" />}
            </Pressable>

            <Pressable onPress={handleCheckboxToggle}>
              <Text style={styles.checkboxLabel}>
                Protect my images with password (only people you share the password can view the images)
              </Text>
            </Pressable>
          </View> */}

          {/* Conditionally render the password field based on the checkbox */}
          {checked && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Enter Password<Text style={styles.redText}>*</Text>
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  secureTextEntry={!showPassword} // Show or hide password
                />
                <Pressable onPress={togglePasswordVisibility} style={styles.passwordIcon}>
                  <AntDesign name={showPassword ? "eye" : "eyeo"} size={18} color="#535665" />
                </Pressable>
              </View>
            </View>
          )}
          {/* )} */}
        </View>

        {/* <Text style={styles.basicText}>Upload Daughter Horoscope Image</Text> */}
        <Text style={styles.basicText}>{`Upload ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Horoscope Image`}</Text>
        <View style={styles.formContainer}>
          <TouchableOpacity
            style={styles.uploadContainer}
            onPress={() => selectFile(setHoroscopeImages)}
          >
            <Text style={styles.uploadText}>
              Select a file
            </Text>
          </TouchableOpacity>

          <ScrollView style={styles.filesContainer}>
            {horoscopeImages.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Image source={{ uri: file.uri }} style={styles.fileImage} />
                <View style={styles.fileDetails}>
                  <Text>{file.fileName}</Text>
                  <Text>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
                  <TouchableOpacity
                    onPress={() =>
                      removeFile(index, horoscopeImages, setHoroscopeImages)
                    }
                  >
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.basicText}>Upload your Videos</Text>
        {/* URL */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Upload video link</Text>
          <TextInput style={styles.input} placeholder="URL" />
          <Text style={styles.label}>
            Note: If video link is not available, you can share the videos to Vysyamala's admin WhatsApp No.9043085524.
          </Text>
        </View>

        {/* <Text style={styles.basicText}>Upload Daughter ID Proof</Text> */}
        <Text style={styles.basicText}>{`Upload ${ProfileOwner === "Ownself" ? "your" : ProfileOwner}  ID Proof`}</Text>
        <View style={styles.formContainer}>
          <TouchableOpacity
            style={styles.uploadContainer}
            onPress={() => selectFile(setIdProofImages)}
          >
            <Text style={styles.uploadText}>
              Select a file
            </Text>
          </TouchableOpacity>

          <ScrollView style={styles.filesContainer}>
            {idProofImages.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Image source={{ uri: file.uri }} style={styles.fileImage} />
                <View style={styles.fileDetails}>
                  <Text>{file.fileName}</Text>
                  <Text>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
                  <TouchableOpacity
                    onPress={() =>
                      removeFile(index, idProofImages, setIdProofImages)
                    }
                  >
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>



        {/* New section for Divorce Certificate */}
        {martialValue === "2" && (
          <>
            <Text style={styles.basicText}>
              {`Upload ${ProfileOwner === "Ownself" ? "your" : ProfileOwner} Divorce Certificate`}
            </Text>
            <View style={styles.formContainer}>
              <TouchableOpacity
                style={styles.uploadContainer}
                onPress={() => selectFile(setDivorceCertificateImages)}
              >
                <Text style={styles.uploadText}>
                  Select a file
                </Text>
              </TouchableOpacity>

              <ScrollView style={styles.filesContainer}>
                {divorceCertificateImages.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    <Image source={{ uri: file.uri }} style={styles.fileImage} />
                    <View style={styles.fileDetails}>
                      <Text>{file.fileName}</Text>
                      <Text>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
                      <TouchableOpacity
                        onPress={() =>
                          removeFile(index, divorceCertificateImages, setDivorceCertificateImages)
                        }
                      >
                        <Text style={styles.removeButton}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* End of Divorce Certificate section */}


        <View style={styles.formContainer}>
          <TouchableOpacity
            style={styles.btn}
            // onPress={() => {
            //   navigation.navigate("FamilyDetails");
            // }}
            onPress={handleNextButtonClick}
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

  uploadHead: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 24,
    fontWeight: "700",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 10,
  },

  basicText: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 16,
    fontWeight: "700",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 10,
    marginBottom: 10,
  },

  formContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },

  label: {
    color: "#535665",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "inter",
  },

  redText: {
    color: "#FF6666",
    fontSize: 14,
    fontWeight: "700",
  },

  input: {
    color: "#535665",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#D4D5D9",
    padding: 10,
    marginBottom: 10,
    fontFamily: "inter",
  },

  passwordIcon: {
    position: "absolute",
    right: 10,
    top: 35,
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

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginVertical: 10,
  },

  checkboxBase: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
    borderWidth: 2,
    borderColor: "#FF6666",
    backgroundColor: "transparent",
    marginRight: 6,
  },

  checkboxChecked: {
    backgroundColor: "#FF6666",
  },

  checkboxLabel: {
    fontSize: 14,
    color: "#535665",
  },

  uploadContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 5,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  uploadText: {
    color: "#888",
  },

  filesContainer: {
    // marginBottom: 20,
  },

  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  fileImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },

  fileDetails: {
    flex: 1,
  },

  removeButton: {
    color: "#FF5666",
    marginTop: 5,
  },

  progressBar: {
    marginBottom: 10,
  },

  spaceText: {
    fontSize: 14,
    color: "#888",
  },

  loadingOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#535665',
    fontSize: 16,
    fontFamily: 'inter',
  },
});
