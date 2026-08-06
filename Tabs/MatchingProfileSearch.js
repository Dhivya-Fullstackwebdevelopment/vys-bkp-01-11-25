import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { handleBookmark, fetchSearchProfiles } from "../CommonApiCall/CommonApiCall";
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allProfileIds, setAllProfileIds] = useState({});

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

  // Modified Search Profiles with pagination
  const searchProfiles = async (page = 1, isInitialLoad = true) => {
    if ((isLoading && isInitialLoad) || (isLoadingMore && !isInitialLoad)) return;

    if (isInitialLoad) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const perPage = 10;

      // Call COMMON API FUNCTION
      const result = await fetchSearchProfiles(
        searchProfileId || "",
        profession || "",
        selectAge || "",
        selectedLocation || "",
        page,
        perPage
      );

      console.log("🔵 API RESPONSE:", result);

      if (result?.Status === 1 && result?.profiles) {

        if (isInitialLoad) {
          setProfiles(result.profiles);
        } else {
          setProfiles(prev => [...prev, ...result.profiles]);
        }

        // Map profile IDs
        setAllProfileIds(prev => ({
          ...prev,
          ...(result.all_profile_ids || {})
        }));

        setTotalProfiles(result.total_count || 0);
        setTotalPages(Math.ceil((result.total_count || 0) / perPage));
        setCurrentPage(page);

        // Bookmarks
        const newBookmarks = new Set(
          result.profiles.filter(p => p.wish_list === 1).map(p => p.profile_id)
        );

        setBookmarkedProfiles(prev =>
          isInitialLoad ? newBookmarks : new Set([...prev, ...newBookmarks])
        );

        setShowSearchFields(false);
      } else {
        throw new Error(result?.message || "No profiles found");
      }
    } catch (error) {
      console.error("❌ Search error:", error);
      setError(error.message);
      if (isInitialLoad) setProfiles([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Handle end reached for pagination
  const handleEndReached = () => {
    console.log("🔄 End reached. Current page:", currentPage, "Total pages:", totalPages);
    if (!isLoadingMore && currentPage < totalPages) {
      console.log("📥 Loading page:", currentPage + 1);
      searchProfiles(currentPage + 1, false);
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
    setCurrentPage(1);
    setTotalPages(1);
    setAllProfileIds({});
    setError(null);
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
          position: "top",
        });
      } else {
        updatedBookmarkedProfiles.delete(profileId);
        Toast.show({
          type: "info",
          text1: "Unsaved",
          text2: "Profile has been removed from bookmarks.",
          position: "top",
        });
      }

      setBookmarkedProfiles(updatedBookmarkedProfiles);

      setProfiles(prevProfiles =>
        prevProfiles.map(profile =>
          profile.profile_id === profileId
            ? { ...profile, wish_list: newStatus === "1" ? 1 : 0 }
            : profile
        )
      );
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update bookmark status.",
        position: "top",
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

  // Render profile item
  const renderItem = ({ item }) => (
    <View style={styles.profileDiv}>
      <View style={styles.profileContainer}>
        <Image
          source={getImageSource(item.profile_img)}
          style={styles.profileImage}
        />
        <TouchableOpacity onPress={() => handleSavePress(item.profile_id)}>
          <MaterialIcons
            name={
              bookmarkedProfiles.has(item.profile_id)
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
            {item.profile_name}{" "}
            <Text style={styles.profileId}>({item.profile_id})</Text>
          </Text>

          <Text style={styles.profileAge}>
            {item.profile_age} Yrs | {item.height} Cms
          </Text>

          <Text style={styles.zodiac}>{item.star}</Text>
          <Text style={styles.employed}>{item.profession}</Text>
        </View>
      </View>
    </View>
  );

  // Render footer loading indicator
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#FF6666" />
        <Text style={styles.footerText}>Loading more profiles...</Text>
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
            <TouchableOpacity onPress={() => searchProfiles(1, true)} style={styles.button}>
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
            <TouchableOpacity onPress={() => searchProfiles(1, true)} style={styles.button}>
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
      {isLoading && profiles.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6666" />
          <Text style={styles.loadingText}>Searching profiles...</Text>
        </View>
      ) : error && profiles.length === 0 ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          renderItem={renderItem}
          keyExtractor={(item) => item.profile_id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.profileScrollView}
          showsVerticalScrollIndicator={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          ListHeaderComponent={
            profiles.length > 0 ? (
              <Text style={styles.totalProfiles}>
                Total Matching Profiles:{" "}
                <Text style={styles.totalProfilesCount}>({totalProfiles})</Text>
              </Text>
            ) : null
          }
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.loadingText}>No profiles found...</Text>
            ) : null
          }
        />
      )}

      <BottomTabBarComponent />
    </View>
  );
};

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
  profileScrollView: {
    width: "100%",
    paddingBottom: 20,
  },
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
  profileContent: { paddingLeft: 10, flex: 1 },
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
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
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    marginTop: 5,
  },
});

export default MatchingProfileSearch