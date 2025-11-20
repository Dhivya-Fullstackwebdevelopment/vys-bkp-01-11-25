import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Button, ActivityIndicator, Alert,
  TouchableOpacity, Image, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView,
  StyleSheet
} from "react-native";
import * as ImagePicker from "react-native-image-picker";
import { useNavigation } from "@react-navigation/native";
import { getMyProfilePersonal, ProfileCompletionFormAPI } from "../../CommonApiCall/CommonApiCall";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";

export const ProfileCompletionForm = () => {
  const [formData, setFormData] = useState({
    photo_upload: null,
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

  useEffect(() => {
    const fetchEmptyFields = async () => {
      try {
        setLoading(true);
        const response = await getMyProfilePersonal();
        const data = response.data;
        console.log("edit response ==>", JSON.stringify(response))
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

  const handleFileChange = (name) => {
    ImagePicker.launchImageLibrary({ mediaType: "photo" }, (response) => {
      console.log("Response = ", response);

      if (!response.didCancel && !response.errorCode && response.assets?.length > 0) {
        const file = response.assets[0];

        setFormData({
          ...formData,
          [name]: {
            uri: file.uri,
            type: file.type || "image/jpeg", // Default to JPEG if type is missing
            name: file.fileName || `upload_${name}.jpg`, // Fallback name if not provided
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
        (typeof value === "string" && value.trim() !== "") || // Check text inputs
        (typeof value === "object" && value?.uri) // Check uploaded images
      );
    });

    if (!isAnyFieldFilled) {
      Toast.show({ type: "error", text1: "Please fill at least one field before submitting.", position: "bottom", visibilityTime: 3000 });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("profile_id", profileId || "");

    // Append text fields if they have values
    Object.keys(formData).forEach((key) => {
      if (formData[key] && typeof formData[key] === "string") {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Append images if they exist
    ["image", "horoscope_file", "Profile_idproof"].forEach((field) => {
      if (formData[field] && formData[field].uri) {
        formDataToSend.append(field, {
          uri: formData[field].uri,
          type: formData[field].type,
          name: formData[field].name,
        });
      }
    });

    console.log("Payload to send ===>", JSON.stringify(formDataToSend));

    try {
      setFormSubmitting(true);

      const response = await ProfileCompletionFormAPI(formDataToSend);

      console.log("Success", "Form submitted successfully", JSON.stringify(response));
      Toast.show({ type: "success", text1: "Profile updated successfully", position: "bottom", visibilityTime: 3000 });
      navigation.navigate("Menu");

    } catch (err) {
      console.error("Error submitting form", err);
      Alert.alert("Error", "Failed to submit the form");
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text style={{ color: "red" }}>{error}</Text>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", paddingBottom: 80 }}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ED1E24" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{"Profile Completion Form"}</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            Profile Completion
          </Text> */}

          {emptyFields.length > 0 ? (
            emptyFields.map((field, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                  {field === "image"
                    ? "Profile Images"
                    : field === "horoscope_file"
                      ? "Upload Horoscope Image"
                      : field === "Profile_idproof"
                        ? "Profile ID Proof"
                        : field === "property_worth"
                          ? "Property Worth"
                          : field === "about_self"
                            ? "About Self"
                            : field === "about_family"
                              ? "About Family"
                              : field === "career_plans"
                                ? "Career Plans"
                                : field === "anual_income"
                                  ? "Annual Income"
                                  : field === "Video_url"
                                    ? "Video URL"
                                    : field === "EmailId"
                                      ? "Email"
                                      : field.replace(/_/g, " ")}
                </Text>

                {field === "image" || field === "horoscope_file" || field === "Profile_idproof" ? (
                  <TouchableOpacity onPress={() => handleFileChange(field)}>
                    <View
                      style={{
                        height: 100,
                        backgroundColor: "#ddd",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: 5,
                        marginBottom: 10,
                      }}
                    >
                      <Text>Upload File</Text>
                    </View>
                    {formData[field] && (
                      <Image
                        source={{ uri: formData[field].uri }}
                        style={{ height: 100, width: 100, borderRadius: 5, marginBottom: 10 }}
                      />
                    )}
                  </TouchableOpacity>
                ) : (
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#ccc",
                      padding: 8,
                      borderRadius: 5,
                      marginBottom: 10,
                    }}
                    onChangeText={(value) => handleInputChange(field, value)}
                    value={formData[field] || ""}
                    placeholder={`Enter ${field.replace(/_/g, " ")}`}
                  />
                )}
              </View>
            ))
          ) : (
            <Text>No fields to complete.</Text>
          )}

          {formSubmitting ? (
            <ActivityIndicator size="large" color="red" />
          ) : (
            <Button title="Submit" onPress={handleSubmit} color="red" />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomTabBarComponent />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  headerContainer: {
    padding: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginLeft: 10,
  },
  headerText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});