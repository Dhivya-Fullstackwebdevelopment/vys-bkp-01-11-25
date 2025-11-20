import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { fetchSearchProfiles, handleBookmark } from "../CommonApiCall/CommonApiCall";
import config from "../API/Apiurl";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabBarComponent } from "../Navigation/ReuseTabNavigation";
import Toast from "react-native-toast-message";

const MatchingProfileSearch = () => {
  const navigation = useNavigation();
  const [Get_Profes_Pref, setGet_Profes_Pref] = useState([]);
  const [profession, setProfession] = useState("");
  const [selectAge, setSelectAge] = useState("");
  const [states, setStates] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState(new Set());
  const [searchProfileId, setSearchProfileId] = useState("");
  const [showSearchFields, setShowSearchFields] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Professional Preference
  useEffect(() => {
    const fetchProfesPref = async () => {
      try {
        const response = await axios.post(`${config.apiUrl}/auth/Get_Profes_Pref/`);
        setGet_Profes_Pref(Object.values(response.data));
      } catch (error) {
        console.error("Error fetching professions:", error);
      }
    };
    fetchProfesPref();
  }, []);

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.post(`${config.apiUrl}/auth/Get_State_Pref/`);
        setStates(Object.values(response.data));
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };
    fetchStates();
  }, []);

  // Search Profiles
  const searchProfiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!searchProfileId && !profession && !selectAge && !selectedLocation)
        throw new Error("Please select at least one search criteria");

      const result = await fetchSearchProfiles(
        searchProfileId,
        profession,
        selectAge,
        selectedLocation
      );
      console.log("total matching profiles", result)
      if (!result || !result.profiles) throw new Error("No profiles found");

      setProfiles(result.profiles);
      setTotalProfiles(result.total_count);
      const initialBookmarks = new Set(
        result.profiles
          .filter(profile => profile.wish_list === 1)
          .map(profile => profile.profile_id)
      );
      setBookmarkedProfiles(initialBookmarks);
      setShowSearchFields(false);
    } catch (error) {
      setError(error.message || "Error searching profiles");
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear filters
  const clearFilter = () => {
    setProfession("");
    setSelectAge("");
    setSelectedLocation("");
    setSearchProfileId("");
    setProfiles([]);
    setShowSearchFields(true);
  };

  // Bookmark toggle
  const handleSavePress = async (profileId) => {
    const newStatus = bookmarkedProfiles.has(profileId) ? "0" : "1";

    const success = await handleBookmark(profileId, newStatus);

    if (success) {
      const updatedBookmarkedProfiles = new Set(bookmarkedProfiles);

      if (newStatus === "1") {
        updatedBookmarkedProfiles.add(profileId);
        Toast.show({
          type: "success",
          text1: "Saved",
          text2: "Profile has been saved to bookmarks.",
          position: "bottom",
        });
      } else {
        updatedBookmarkedProfiles.delete(profileId);
        Toast.show({
          type: "info",
          text1: "UNsaved",
          text2: "Profile has been removed from bookmarks.",
          position: "bottom",
        });
      }

      setBookmarkedProfiles(updatedBookmarkedProfiles);

      // Update UI immediately for MatchingProfileSearch list
      setProfiles(prevProfiles =>
        prevProfiles.map(profile =>
          profile.profile_id === profileId
            ? { ...profile, profile_wishlist: newStatus === "1" ? 1 : 0 }
            : profile
        )
      );
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update bookmark status.",
        position: "bottom",
      });
    }
  };


  const getImageSource = (image) => {
    if (!image) return { uri: "https://example.com/default.png" };
    if (Array.isArray(image)) return { uri: image[0] };
    return { uri: image };
  };

  const getSelectedProfessionName = () => {
    const selected = Get_Profes_Pref.find(p => p.Profes_Pref_id === profession);
    return selected ? selected.Profes_name : "";
  };

  const getSelectedStateName = () => {
    const selected = states.find(s => s.State_Pref_id === selectedLocation);
    return selected ? selected.State_name : "";
  };

  // Selected filters UI
  const renderSelectedFilters = () => {
    const filters = [];
    if (searchProfileId) filters.push(`Search: ${searchProfileId}`);
    if (profession) filters.push(`Profession: ${getSelectedProfessionName()}`);
    if (selectAge) filters.push(`Age Difference: ${selectAge}`);
    if (selectedLocation) filters.push(`Location: ${getSelectedStateName()}`);

    if (filters.length === 0) return null;

    return (
      <View style={styles.selectedFiltersContainer}>
        <Text style={styles.selectedFiltersTitle}>Selected Filters:</Text>
        <View style={styles.filterTagsContainer}>
          {filters.map((filter, index) => (
            <View key={index} style={styles.filterTag}>
              <Text style={styles.filterTagText}>{filter}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#F4F4F4", paddingBottom: 80 }}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ED1E24" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Matching Profile Search</Text>
      </View>

      {/* Search Fields or Result Header */}
      {showSearchFields ? (
        <>
          {/* Search Input */}
          <View style={[styles.container, { marginTop: 15, height: 45 }]}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or ID..."
              placeholderTextColor="#666"
              value={searchProfileId}
              onChangeText={setSearchProfileId}
            />
          </View>

          {/* Profession */}
          <View style={styles.container}>
            <Picker selectedValue={profession} onValueChange={setProfession} style={styles.picker}>
              <Picker.Item label="Profession" value="" enabled={false} />
              {Get_Profes_Pref.map((p) => (
                <Picker.Item
                  key={p.Profes_Pref_id}
                  label={p.Profes_name}
                  value={p.Profes_Pref_id}
                />
              ))}
            </Picker>
          </View>

          {/* Age Difference */}
          <View style={styles.container}>
            <Picker selectedValue={selectAge} onValueChange={setSelectAge} style={styles.picker}>
              <Picker.Item label="Age Difference" value="" enabled={false} />
              {[...Array(10).keys()].map((num) => (
                <Picker.Item key={num + 1} label={`${num + 1}`} value={`${num + 1}`} />
              ))}
            </Picker>
          </View>

          {/* Location */}
          <View style={styles.container}>
            <Picker
              selectedValue={selectedLocation}
              onValueChange={setSelectedLocation}
              style={styles.picker}
            >
              <Picker.Item label="Location" value="" enabled={false} />
              {states.map((s) => (
                <Picker.Item key={s.State_Pref_id} label={s.State_name} value={s.State_Pref_id} />
              ))}
            </Picker>
          </View>

          {/* Search / Clear */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={searchProfiles} style={styles.button}>
              <LinearGradient colors={["#BD1225", "#FF4050"]} style={styles.linearGradient}>
                <Text style={styles.buttonText}>Search Profiles</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={clearFilter} style={styles.button}>
              <LinearGradient colors={["#BD1225", "#FF4050"]} style={styles.linearGradient}>
                <Text style={styles.buttonText}>Clear Filter</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {renderSelectedFilters()}
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={searchProfiles} style={styles.button}>
              <LinearGradient colors={["#BD1225", "#FF4050"]} style={styles.linearGradient}>
                <Text style={styles.buttonText}>Search Profiles</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={clearFilter} style={styles.button}>
              <LinearGradient colors={["#BD1225", "#FF4050"]} style={styles.linearGradient}>
                <Text style={styles.buttonText}>Clear Filter</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Loading */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6666" />
          <Text style={styles.loadingText}>Searching profiles...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={styles.profileScrollView}>

          {/* 👍 SHOW TOTAL COUNT ONLY ONCE */}
          {profiles.length > 0 && (
            <Text style={styles.totalProfiles}>
              Total Matching Profiles:{" "}
              <Text style={styles.totalProfilesCount}>({totalProfiles})</Text>
            </Text>
          )}

          {/* Profile List */}
          {profiles.length > 0 ? (
            profiles.map((profile) => (
              <View key={profile.profile_id} style={styles.profileDiv}>
                <View style={styles.profileContainer}>
                  <Image
                    source={getImageSource(profile.profile_img)}
                    style={styles.profileImage}
                  />
                  <TouchableOpacity onPress={() => handleSavePress(profile.profile_id)}>
                    <MaterialIcons
                      name={
                        bookmarkedProfiles.has(profile.profile_id)
                          ? "bookmark"
                          : "bookmark-border"
                      }
                      size={20}
                      color="red"
                      style={styles.saveIcon}
                    />
                  </TouchableOpacity>

                  <View style={styles.profileContent}>
                    <Text style={styles.profileName}>
                      {profile.profile_name}{" "}
                      <Text style={styles.profileId}>({profile.profile_id})</Text>
                    </Text>

                    <Text style={styles.profileAge}>
                      {profile.profile_age} Yrs | {profile.height} Cms
                    </Text>

                    <Text style={styles.zodiac}>{profile.star}</Text>
                    <Text style={styles.employed}>{profile.profession}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.loadingText}>No profiles found...</Text>
          )}
        </ScrollView>
      )}

      <BottomTabBarComponent />
    </View>
  );
};

// Styles remain EXACTLY the same as your code
const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    backgroundColor: "white",
  },
  headerContainer: {
    padding: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  picker: {
    height: 55,
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "white",
    fontSize: 14,
  },
  profileScrollView: { width: "100%" },
  profileDiv: { width: "100%", paddingHorizontal: 10 },
  profileContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 8,
    marginVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  profileImage: { width: 100, height: 100, borderRadius: 10 },
  saveIcon: { position: "absolute", left: -25, top: 5 },
  profileContent: { paddingLeft: 10 },
  profileName: { fontSize: 16, fontWeight: "700", color: "#FF6666" },
  profileId: { fontSize: 14, color: "#85878C" },
  profileAge: { fontSize: 14, color: "#4F515D", marginBottom: 5 },
  zodiac: { fontSize: 14, color: "#4F515D", marginBottom: 5 },
  employed: { fontSize: 14, color: "#4F515D" },
  loadingText: { textAlign: "center", marginTop: 20, color: "gray" },
  searchInput: {
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  selectedFiltersContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  selectedFiltersTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  filterTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterTag: {
    backgroundColor: "#FF6666",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterTagText: { color: "white", fontSize: 14 },
  button: { flex: 1, marginHorizontal: 5 },
  linearGradient: {
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { padding: 20, alignItems: "center" },
  errorText: { color: "#FF6666", fontSize: 16, textAlign: "center" },
  totalProfiles: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    marginTop: 10,
  },
  totalProfilesCount: {
    color: "#FF6666",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MatchingProfileSearch;
