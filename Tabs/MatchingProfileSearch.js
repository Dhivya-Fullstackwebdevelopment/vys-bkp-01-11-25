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
  Modal,
  Pressable,
} from "react-native";
import axios from "axios";
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

// ─────────────────────────────────────────────────────────────────────────
// Reusable custom dropdown — tapping the field opens a modal list.
// Purely a UI swap for Picker; onSelect still sets the same state values
// your search logic already reads (profession / selectAge / selectedLocation).
// ─────────────────────────────────────────────────────────────────────────
const DropdownField = ({ icon, iconSet, label, placeholder, value, options, valueKey, labelKey, onSelect }) => {
  const [visible, setVisible] = useState(false);
  const IconComponent = iconSet === "Ionicons" ? Ionicons : MaterialIcons;

  const selectedLabel = (() => {
    if (!value) return placeholder;
    const found = options.find((o) => String(o[valueKey]) === String(value));
    return found ? found[labelKey] : placeholder;
  })();

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.pickerContainer}
        onPress={() => setVisible(true)}
      >
        <IconComponent name={icon} size={18} color={Colors.textMuted} style={styles.fieldIcon} />
        <Text
          style={[
            styles.dropdownValueText,
            !value && styles.dropdownPlaceholderText,
          ]}
          numberOfLines={1}
        >
          {selectedLabel}
        </Text>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={22}
          color={Colors.textMuted}
          style={{ marginRight: 10 }}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => { }}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <MaterialIcons name="close" size={22} color={Colors.textDark} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item, index) => `${item[valueKey]}-${index}`}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                const isSelected = String(item[valueKey]) === String(value);
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      onSelect(item[valueKey]);
                      setVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected,
                      ]}
                    >
                      {item[labelKey]}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Profile card image with an inline loading spinner while it fetches,
// so the card renders instantly and the image fades in once ready.
// ─────────────────────────────────────────────────────────────────────────
const ProfileCardImage = ({ uri, width, height, blurRadius, borderRadius }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <View style={{ width, height, borderRadius, overflow: "hidden", backgroundColor: Colors.surface1 || "#F6EFE5" }}>
      {!imgLoaded && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="small" color={Colors.primary || "#A00014"} />
        </View>
      )}
      <TopAlignedImage
        uri={uri}
        width={width}
        height={height}
        blurRadius={blurRadius}
        style={{ borderRadius, opacity: imgLoaded ? 1 : 0 }}
        onLoadEnd={() => setImgLoaded(true)}
        onError={() => setImgLoaded(true)}
      />
    </View>
  );
};

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

    if (searchProfileId) {
      filters.push(`Search: ${searchProfileId}`);
    }

    if (profession) {
      filters.push(`Profession: ${getSelectedProfessionName()}`);
    }

    if (selectAge) {
      filters.push(`Age Difference: ${selectAge}`);
    }

    if (selectedLocation) {
      filters.push(`Location: ${getSelectedStateName()}`);
    }

    if (filters.length === 0) return null;

    return (
      <View style={styles.selectedFiltersContainer}>
        {/* Title + Filter icon */}
        <View style={styles.selectedFiltersHeader}>
          <Text style={styles.selectedFiltersTitle}>
            Selected Filters:
          </Text>

          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setShowSearchFields(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options-outline"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Selected filters */}
        <View style={styles.filterTagsContainer}>
          {filters.map((filter, index) => (
            <View key={index} style={styles.filterTag}>
              <Text style={styles.filterTagText}>
                {filter}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  // Age difference options built once for the dropdown (label === value === "1".."10")
  const ageOptions = [...Array(10).keys()].map((num) => ({
    id: `${num + 1}`,
    label: `${num + 1}`,
  }));

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
            <ProfileCardImage
              uri={getImageSource(rawImage).uri}
              width={rs(110, 120, 130)}
              height={rs(120, 130, 140)}
              blurRadius={profile.photo_protection === 1 ? 15 : 0}
              borderRadius={14}
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
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Search by Name or ID</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="search"
                    size={18}
                    color={Colors.textMuted}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or ID..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchProfileId}
                    onChangeText={setSearchProfileId}
                  />
                </View>
              </View>

              {/* Profession — tap opens dropdown modal */}
              <DropdownField
                icon="work-outline"
                iconSet="MaterialIcons"
                label="Profession"
                placeholder="Profession"
                value={profession}
                options={Get_Profes_Pref}
                valueKey="Profes_Pref_id"
                labelKey="Profes_name"
                onSelect={setProfession}
              />

              {/* Age Difference — tap opens dropdown modal */}
              <DropdownField
                icon="cake"
                iconSet="MaterialIcons"
                label="Age Difference"
                placeholder="Age Difference"
                value={selectAge}
                options={ageOptions}
                valueKey="id"
                labelKey="label"
                onSelect={setSelectAge}
              />

              {/* Location — tap opens dropdown modal */}
              <DropdownField
                icon="location-outline"
                iconSet="Ionicons"
                label="Location"
                placeholder="Location"
                value={selectedLocation}
                options={states}
                valueKey="State_Pref_id"
                labelKey="State_name"
                onSelect={setSelectedLocation}
              />

              {/* Search / Clear */}
              <View style={styles.buttonContainer}>


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
              </View>
            </>
          ) : (
            <>
              <View>
                {renderSelectedFilters()}
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

  // ── Unified rounded field styling ──────────────────────────────────────
  fieldWrapper: {
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted || "#71717A",
    marginBottom: 6,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldIcon: {
    marginLeft: 14,
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    backgroundColor: Colors.card || "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 16,
    backgroundColor: Colors.card || "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingRight: 14,
    fontSize: 15,
    color: Colors.textDark,
  },

  // ── Custom dropdown field value + modal ──────────────────────────────────
  dropdownValueText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textDark,
  },
  dropdownPlaceholderText: {
    color: Colors.textMuted || "#999999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalSheet: {
    backgroundColor: Colors.card || "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    maxHeight: "60%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#E4E4E7",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textDark,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#F0F0F0",
  },
  modalItemSelected: {
    backgroundColor: Colors.selectedBg || "#FBF5ED",
    borderRadius: 10,
  },
  modalItemText: {
    fontSize: 15,
    color: Colors.textDark,
  },
  modalItemTextSelected: {
    color: Colors.primary,
    fontWeight: "700",
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
    marginTop: 12,
  },
  resultFilterHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    marginTop: 10,
    marginBottom: 12,
  },
  selectedFiltersContainer: {
    width: "100%",
    marginTop: 10,
    marginBottom: 12,
    padding: 16,
    backgroundColor: Colors.surface1 || "#F6EFE5",
    borderRadius: 24,
  },
  selectedFiltersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  selectedFiltersTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textDark,
    marginBottom: 10,
  },

  filterTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedFilterContent: {
    flex: 1,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  filterTag: {
    backgroundColor: Colors.profilecompetionbg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterTagText: { color: "#7C5A16", fontSize: 13 },
  button: { flex: 1, marginHorizontal: 5 },
  linearGradient: {
    paddingVertical: 12,
    borderRadius: 16,
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