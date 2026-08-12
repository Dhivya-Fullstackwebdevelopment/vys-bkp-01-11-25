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
  Platform,
} from "react-native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { handleBookmark, fetchSearchProfiles } from "../CommonApiCall/CommonApiCall";
import config from "../API/Apiurl";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabBarComponent } from "../Navigation/ReuseTabNavigation";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopAlignedImage } from "../Components/ReuseImageAlign/TopAlignedImage";
import { Colors, rs } from "../Reusable/Theme";

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
    if (!image) return { uri: "https://vysyamat.blob.core.windows.net/vysyamala/default_bride.png" };
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

  // ← same "days ago / Active today" logic FilterScreen uses for the footer
  const formatLastActive = (viewed_date) => {
    if (!viewed_date) return null;
    const date = new Date(viewed_date);
    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 0) return null;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Active today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return null;
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

  // ─── LIST CARD — matches FilterScreen.renderProfileCard styling ──────────
  const renderItem = ({ item: profile }) => {
    const isSaved = bookmarkedProfiles.has(profile.profile_id);
    const rawImage = Array.isArray(profile.profile_img)
      ? profile.profile_img[0]
      : profile.profile_img;
    const matchScore = profile.matching_score ?? profile.matchScore ?? 0;
    const lastActive = formatLastActive(profile.viewed_date);

    const degreeProfession =
      [profile.degree, profile.profession]
        .filter((v) => v && v !== "Not mentioned" && v !== "Not working")
        .join(" · ") || profile.profession || "N/A";

    const ageHeightText = `${profile.profile_id || ""} · ${profile.profile_age || ""} yrs · ${profile.height?.height_desc || profile.profile_height?.height_desc || "N/A"
      }`;

    return (
      <TouchableOpacity
        key={profile.profile_id}
        onPress={() => navigation.navigate("ProfileDetails", { viewedProfileId: profile.profile_id })}
        activeOpacity={0.92}
        style={styles.card}
      >
        <View style={styles.cardBody}>
          <View style={styles.imageWrapper}>
            <TopAlignedImage
              uri={getImageSource(rawImage).uri}
              width={rs(110, 120, 130)}
              height={rs(120, 130, 140)}
              blurRadius={profile.photo_protection === 1 ? 15 : 0}
              style={{ borderRadius: 14 }}
            />
            {profile.photo_protection === 1 && (
              <View style={styles.lockOverlay}>
                <MaterialIcons name="lock" size={22} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile.profile_name || "N/A"}
              </Text>
              {profile.verified === 1 && (
                <MaterialIcons
                  name="verified"
                  size={16}
                  color={Colors.primary}
                  style={{ marginLeft: 4 }}
                />
              )}
              {Number(matchScore) > 50 && (
                <View style={styles.matchChip}>
                  <Text style={styles.matchChipText}>{matchScore}% match</Text>
                </View>
              )}
            </View>

            <Text style={styles.subtext}>{ageHeightText}</Text>

            <Text style={styles.professionText} numberOfLines={1}>
              {degreeProfession}
            </Text>

            {(profile.location || profile.city) ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.locationText}>
                  {profile.location || profile.city}
                </Text>
              </View>
            ) : null}

            <View style={styles.tagsRow}>
              {profile.star ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{profile.star}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.lastActiveText}>{lastActive || ""}</Text>
          <View style={styles.btnGroup}>
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                handleSavePress(profile.profile_id);
              }}
              style={[styles.shortlistBtn, isSaved && styles.shortlistBtnSaved]}
            >
              <MaterialIcons
                name={isSaved ? "bookmark" : "bookmark-border"}
                size={16}
                color={isSaved ? Colors.chipActiveText : Colors.textDark}
              />
              <Text
                style={[styles.shortlistBtnText, isSaved && styles.shortlistBtnTextSaved]}
              >
                {isSaved ? "Saved" : "Shortlist"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render footer loading indicator
  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={Colors.primary || "#A00014"} />
          <Text style={styles.loadingMoreText}>Loading more profiles…</Text>
        </View>
      );
    }
    if (!isLoadingMore && currentPage >= totalPages && profiles.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.endMessage}>No more profiles</Text>
        </View>
      );
    }
    return <View style={styles.footerLoader} />;
  };

  return (
    <SafeAreaView style={styles.rootContainer} edges={["top"]}>
      <View style={{ flex: 1, backgroundColor: Colors.selectedBg ?? "#FAF6F0", paddingBottom: 80 }}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.primaryGradientStart || "#A00014", Colors.primaryGradientEnd || "#4A000A"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Matching Profile Search</Text>
            {!showSearchFields && (
              <Text style={styles.headerSubtitle}>
                {totalProfiles} profiles found
              </Text>
            )}
          </View>
        </LinearGradient>

        <View style={styles.bodyPadding}>
          {/* Search Fields or Result Header */}
          {showSearchFields ? (
            <>
              {/* Search Input */}
              <View style={[styles.inputContainer, { marginTop: 15, height: 45 }]}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or ID..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchProfileId}
                  onChangeText={setSearchProfileId}
                />
              </View>

              {/* Profession */}
              <View style={styles.inputContainer}>
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
              <View style={styles.inputContainer}>
                <Picker selectedValue={selectAge} onValueChange={setSelectAge} style={styles.picker}>
                  <Picker.Item label="Age Difference" value="" enabled={false} />
                  {[...Array(10).keys()].map((num) => (
                    <Picker.Item key={num + 1} label={`${num + 1}`} value={`${num + 1}`} />
                  ))}
                </Picker>
              </View>

              {/* Location */}
              <View style={styles.inputContainer}>
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
                <TouchableOpacity
                  onPress={() => searchProfiles(1, true)}
                  style={styles.button}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primary]}
                    style={styles.linearGradient}
                  >
                    <Text style={styles.buttonText}>Search Profiles</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={clearFilter}
                  style={styles.button}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primary]}
                    style={styles.linearGradient}
                  >
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
                  <LinearGradient colors={[Colors.primary, Colors.primary]} style={styles.linearGradient}>
                    <Text style={styles.buttonText}>Search Profiles</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={clearFilter} style={styles.button}>
                  <LinearGradient colors={[Colors.primary, Colors.primary]} style={styles.linearGradient}>
                    <Text style={styles.buttonText}>Clear Filter</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Loading */}
        {isLoading && profiles.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary || "#A00014"} />
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
            keyExtractor={(item) => String(item.profile_id)}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.profileScrollView}
            showsVerticalScrollIndicator={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={true}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  bodyPadding: {
    paddingHorizontal: rs(12, 16, 20),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(12, 16, 20),
    paddingTop: rs(14, 16, 18),
    paddingBottom: rs(14, 16, 18),
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: rs(12, 13, 14),
    color: "rgba(255,255,255,0.80)",
    marginTop: 2,
  },
  inputContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 12,
    backgroundColor: Colors.card || "#FFFFFF",
  },
  picker: {
    height: 55,
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: Colors.card || "#FFFFFF",
    fontSize: 14,
  },
  searchInput: {
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
    color: Colors.textDark,
  },
  profileScrollView: {
    width: "100%",
    paddingHorizontal: rs(12, 14, 16),
    paddingTop: 12,
    paddingBottom: 100,
  },

  // ── List card (matches FilterScreen.styles.card exactly) ──
  card: {
    backgroundColor: Colors.cardBackground || "#FFFFFF",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  cardBody: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  imageWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    alignSelf: "flex-start",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoCol: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  profileName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textDark || "#2D2D2D",
    flexShrink: 1,
    maxWidth: "50%",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
  },
  matchChip: {
    marginLeft: "auto",
    backgroundColor: Colors.secondaryGold || "#D4AF37",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchChipText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
  },
  subtext: {
    fontSize: 13,
    color: Colors.textMuted || "#888888",
    marginTop: 3,
  },
  professionText: {
    fontSize: 13,
    color: Colors.textMuted || "#888888",
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textMuted || "#888888",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 4,
  },
  tag: {
    backgroundColor: Colors.selectedBg || "#E8E0D5",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textMuted || "#888888",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border || "#EEEEEE",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  lastActiveText: {
    fontSize: 12,
    color: Colors.textMuted || "#888888",
  },
  btnGroup: {
    flexDirection: "row",
    gap: 8,
  },
  shortlistBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border || "#CCCCCC",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shortlistBtnSaved: {
    backgroundColor: Colors.chipActiveBg || "#FFE8E8",
    borderColor: "transparent",
  },
  shortlistBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textDark || "#2D2D2D",
  },
  shortlistBtnTextSaved: {
    color: Colors.chipActiveText || "#D32F2F",
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  selectedFiltersContainer: {
    marginTop: 10,
    marginBottom: 4,
    padding: 10,
    backgroundColor: Colors.surface1 || "#F6EFE5",
    borderRadius: 12,
  },
  selectedFiltersTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textDark,
    marginBottom: 8,
  },
  filterTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterTag: {
    backgroundColor: Colors.primary || "#B72024",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterTagText: { color: "#FFFFFF", fontSize: 13 },
  button: { flex: 1, marginHorizontal: 5 },
  linearGradient: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  loadingText: { textAlign: "center", marginTop: 20, color: Colors.textMuted },
  errorContainer: { padding: 20, alignItems: "center" },
  errorText: { color: Colors.destructive || "#EF4444", fontSize: 16, textAlign: "center" },
  totalProfiles: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.textDark || "#333",
  },
  totalProfilesCount: {
    color: Colors.primary || "#B72024",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerLoader: {
    paddingVertical: 20,
    paddingBottom: 40,
    alignItems: "center",
    minHeight: 60,
  },
  loadingMoreText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textMuted || "#71717A",
    fontWeight: "600",
  },
  endMessage: {
    fontSize: 13,
    color: Colors.textMuted || "#71717A",
    fontStyle: "italic",
  },
});

export default MatchingProfileSearch;