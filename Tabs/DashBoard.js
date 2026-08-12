import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import CircularProgress from "react-native-circular-progress-indicator";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
  fetchProfileInterests,
  fetchDashboardData,
  updateProfileInterest,
} from "../CommonApiCall/CommonApiCall";
import { TopAlignedImage } from "../Components/ReuseImageAlign/TopAlignedImage";
import { Colors } from "../Reusable/Theme";
import Svg, { Path, Circle, Rect, Polyline, Line } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;
const fs = (size) => (isTablet ? Math.round(size * 0.7) : size);

// ── Brand colours ─────────────────────────────────────────────────────────────
const C = {
  primary: "#A00014",
  primaryLight: "#FFE8EC",
  gold: "#D4A017",
  goldLight: "#FFF8E7",
  bg: "#FAF6F0",
  card: "#FFFFFF",
  border: "#F0E8E0",
  text: "#1A1A1A",
  sub: "#888888",
  verified: "#2ECC71",
};

export const DashBoard = () => {
  const [profileData, setProfileData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const navigation = useNavigation();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setProfileData([]);
    try {
      const [profiles, dashboard] = await Promise.all([
        fetchProfileInterests(),
        fetchDashboardData(),
      ]);
      setProfileData(profiles);
      setDashboardData(dashboard);
    } catch (err) {
      Toast.show({ type: "error", text1: "Error", text2: err.message, position: "top" });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleSavePress = async (profileId, status) => {
    try {
      setLoading(true);
      const response = await updateProfileInterest(profileId, status);
      if (response.Status === 1) {
        setProfileData((prev) => prev.filter((p) => p.int_profileid !== profileId));
        Toast.show({
          type: status === "2" ? "success" : "error",
          text1: status === "2" ? "Accepted" : "Rejected",
          text2: status === "2" ? "Interest Accepted." : "Interest Rejected.",
          position: "top",
        });
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Error", text2: "Something went wrong.", position: "top" });
    } finally {
      setLoading(false);
    }
  };

  const getImageSource = (image) => {
    if (!image) return { uri: "" };
    if (Array.isArray(image)) return { uri: image[0] };
    return { uri: image };
  };

  const formatProfileNotes = (text) => {
    if (!text) return "";
    let out = "", ws = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      out += c;
      if (c === " " || c.charCodeAt(0) === 0x00a0) ws++;
      if (ws >= 5) { out += "\n"; ws = 0; }
    }
    return out;
  };

  const imageUrls = dashboardData?.image_data
    ? dashboardData.image_data.map((obj) => Object.values(obj)[0])
    : [];

  const completion = parseInt(dashboardData?.profile_details?.completion_per, 10) || 0;
  const planName = dashboardData?.profile_details?.package_name || "";
  const isGold = planName.toLowerCase().includes("gold");
  const isPlatinum = planName.toLowerCase().includes("platinum");
  const memberLabel = isPlatinum
    ? "Platinum member"
    : isGold
      ? "Gold member"
      : planName || null;

  // ── Profile header card ───────────────────────────────────────────────────
  const renderProfileHeader = () => (
    <View style={styles.profileHeaderCard}>
      {/* Avatar + name row */}
      <View style={styles.profileHeaderRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={getImageSource(dashboardData?.profile_details?.profile_image)}
            style={styles.avatar}
          />
        </View>
        <View style={styles.profileHeaderInfo}>
          <Text style={styles.profileHeaderName}>
            {dashboardData?.profile_details?.profile_name || "—"}
          </Text>
          <Text style={styles.profileHeaderId}>
            {dashboardData?.profile_details?.profile_id || ""}
          </Text>
          {memberLabel ? (
            <View style={styles.memberBadge}>
              {(isGold || isPlatinum) && (
                <MaterialIcons name="workspace-premium" size={12} color={C.gold} style={{ marginRight: 3 }} />
              )}
              <Text style={styles.memberBadgeText}>{memberLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>

  );

  const renderProfileCompletion = () => (
    <View style={styles.profileCompletion}>
      {/* Profile completion bar */}
      {completion < 100 && (
        <TouchableOpacity
          style={styles.completionBox}
          onPress={() => navigation.navigate("ProfileCompletionForm")}
          activeOpacity={0.85}
        >
          <View style={styles.completionLeft}>
            <CircularProgress
              value={completion}
              progressValueColor={Colors.primary}
              progressValueStyle={{ fontSize: fs(13), fontWeight: "700" }}
              radius={28}
              duration={1500}
              activeStrokeWidth={6}
              inActiveStrokeWidth={6}
              maxValue={100}
              activeStrokeColor={C.primary}
              inActiveStrokeColor={C.primary}
              inActiveStrokeOpacity={0.15}
            />
          </View>
          <View style={styles.completionRight}>
            <Text style={styles.completionTitle}>
              Your profile is {completion}% complete
            </Text>
            <Text style={styles.completionSub}>
              Complete your profile and we will suggest better matches for you.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {completion < 100 && (
        <TouchableOpacity
          style={styles.completeBtn}
          onPress={() => navigation.navigate("ProfileCompletionForm")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.primary, "#B72024"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.completeBtnGradient}
          >
            <Text style={styles.completeBtnText}>Complete Your Profile →</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>

  );

  const VisitorsSvg = ({ size = 24, color = Colors.matchingcirclecolor }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Circle
        cx="130"
        cy="150"
        r="70"
        fill="none"
        stroke={color}
        strokeWidth="28"
      />
      <Path
        d="M55 390 L80 300 Q95 270 130 270 Q165 270 180 300 L205 390"
        fill="none"
        stroke={color}
        strokeWidth="28"
        strokeLinecap="round"
      />
      <Path
        d="M280 95 Q330 55 380 95 Q415 125 390 165"
        fill="none"
        stroke={color}
        strokeWidth="28"
        strokeLinecap="round"
      />
      <Path
        d="M290 205 H390 Q425 205 435 240 L450 290"
        fill="none"
        stroke={color}
        strokeWidth="28"
        strokeLinecap="round"
      />
    </Svg>
  );

  const GallerySvg = ({ size = 24, color = Colors.matchingcirclecolor }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Rect
        x="100"
        y="80"
        width="320"
        height="280"
        rx="25"
        fill="none"
        stroke={color}
        strokeWidth="24"
      />
      <Circle
        cx="160"
        cy="145"
        r="25"
        fill="none"
        stroke={color}
        strokeWidth="20"
      />
      <Polyline
        points="110,330 220,220 275,275 350,175 420,250"
        fill="none"
        stroke={color}
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M85 365 L65 425 Q62 440 80 445 L350 510"
        fill="none"
        stroke={color}
        strokeWidth="24"
        strokeLinecap="round"
      />
    </Svg>
  );

  const PhotoRequestSvg = ({ size = 24, color = Colors.matchingcirclecolor }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Rect
        x="55"
        y="70"
        width="400"
        height="370"
        rx="45"
        fill="none"
        stroke={color}
        strokeWidth="28"
      />
      <Circle
        cx="170"
        cy="170"
        r="38"
        fill="none"
        stroke={color}
        strokeWidth="24"
      />
      <Polyline
        points="75,355 175,250 235,315 325,220 455,350"
        fill="none"
        stroke={color}
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="405"
        y1="55"
        x2="405"
        y2="145"
        stroke={color}
        strokeWidth="24"
        strokeLinecap="round"
      />
      <Line
        x1="360"
        y1="100"
        x2="450"
        y2="100"
        stroke={color}
        strokeWidth="24"
        strokeLinecap="round"
      />
    </Svg>
  );

  // ── Statistics row ────────────────────────────────────────────────────────
  const stats = [
    {
      label: "My visitors",
      value: dashboardData?.myvisitor_count ?? 0,
      icon: "people-outline",        // ✅ Ionicons — two-person group
      iconLib: "Ionicons",
      onPress: () => navigation.navigate("MyVisitors"),
    },
    {
      label: "Photo Request",
      value: dashboardData?.photo_int_count ?? 0,
      icon: "image-plus",            // ✅ MaterialCommunity — photo with plus
      iconLib: "MaterialCommunity",
      onPress: () => navigation.navigate("PhotoRequest"),
    },
    {
      label: "Gallery",
      value: dashboardData?.gallery_count ?? 0,
      icon: "photo-library",         // ✅ MaterialIcons — clean gallery icon
      iconLib: "MaterialIcons",
      onPress: () => navigation.navigate("GalleryResults"),
    },
  ];

  const renderStatIcon = (stat) => {
    const color = Colors.matchingcirclecolor;
    const size = 18;
    if (stat.iconLib === "Ionicons")
      return <Ionicons name={stat.icon} size={size} color={color} />;
    if (stat.iconLib === "MaterialCommunity")
      return <MaterialCommunityIcons name={stat.icon} size={size} color={color} />;
    return <MaterialIcons name={stat.icon} size={size} color={color} />;
  };

  const renderStatistics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Statistics</Text>
      <View style={styles.statsRow}>
        {stats.map((s, i) => (
          <TouchableOpacity key={i} style={styles.statCard} onPress={s.onPress} activeOpacity={0.8}>
            <View style={styles.statIconBg}>
              {renderStatIcon(s)}
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── Quick actions ─────────────────────────────────────────────────────────
  const quickActions = [
    {
      label: "Personal Notes",
      icon: "document-text",
      iconLib: "Ionicons",
      onPress: () => navigation.navigate("PersonalNotes"),
    },
    {
      label: "Other Settings",
      icon: "user-gear",
      iconLib: "FontAwesome6",
      onPress: () => navigation.navigate("OtherSettings"),
    },
    {
      label: "Vys Assist",
      icon: "account-voice",
      iconLib: "MaterialCommunity",
      onPress: () => navigation.navigate("VysassistResults"),
    },
  ];

  const renderQAIcon = (a) => {
    const color = Colors.dashtext;
    const size = 24;
    if (a.iconLib === "Ionicons") return <Ionicons name={a.icon} size={size} color={color} />;
    if (a.iconLib === "FontAwesome6") return <FontAwesome6 name={a.icon} size={size} color={color} />;
    return <MaterialCommunityIcons name={a.icon} size={size} color={color} />;
  };

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick actions</Text>

      <View style={styles.qaGrid}>
        {quickActions.map((a, i) => (
          <TouchableOpacity
            key={i}
            style={styles.qaCard}
            onPress={a.onPress}
            activeOpacity={0.8}
          >
            {/* Icon - Top */}
            <View style={styles.qaIconBg}>
              {renderQAIcon(a)}
            </View>

            {/* Text - Below */}
            <Text style={styles.qaLabel}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── My activity ───────────────────────────────────────────────────────────
  const activities = [
    {
      label: "Profile views this month",
      value: dashboardData?.viewed_profile_count ?? 0,
      icon: "eye-outline",
      iconLib: "Ionicons",
      color: Colors.matchingcirclecolor,
      bgColor: Colors.iconContainerBg,
      onPress: () => navigation.navigate("ViewedProfiles"),
    },
    {
      label: "Profiles sent",
      value: dashboardData?.sent_int_count ?? 0,
      icon: "send",
      iconLib: "MaterialIcons",
      color: Colors.dashtext,
      bgColor: Colors.profilecompetionbg,
      onPress: () => navigation.navigate("InterestSent"),
    },
    {
      label: "Interests received",
      value: dashboardData?.received_int_count ?? 0,
      icon: "heart-outline",
      iconLib: "Ionicons",
      color: Colors.dashtext,
      bgColor: Colors.profilecompetionbg,
      onPress: () => navigation.navigate("DashBoardMutualInterest"),
    },
    {
      label: "Shortlisted profiles",
      value: dashboardData?.wishlist_count ?? 0,
      icon: "bookmark-outline",
      iconLib: "Ionicons",
      color: Colors.matchingcirclecolor,
      bgColor: Colors.iconContainerBg,
      onPress: () => navigation.navigate("DashBoardWishlist"),
    },
  ];

  const renderActivityIcon = (a) => {
    const size = 24;

    if (a.iconLib === "Ionicons") {
      return (
        <Ionicons
          name={a.icon}
          size={size}
          color={a.color}
        />
      );
    }

    return (
      <MaterialIcons
        name={a.icon}
        size={size}
        color={a.color}
      />
    );
  };

  const renderMyActivity = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>My activity</Text>
      <View style={styles.activityGrid}>
        {activities.map((a, i) => (
          <TouchableOpacity key={i} style={styles.activityCard} onPress={a.onPress} activeOpacity={0.8}>
            <View
              style={[
                styles.activityIconBg,
                { backgroundColor: a.bgColor },
              ]}
            >
              {renderActivityIcon(a)}
            </View>
            <Text style={styles.activityValue}>{a.value}</Text>
            <Text style={styles.activityLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── Contact views ─────────────────────────────────────────────────────────
  // const renderContactViews = () => (
  //   <View style={styles.section}>
  //     <Text style={styles.sectionTitle}>Contact views</Text>
  //     <View style={styles.contactCard}>
  //       <View style={styles.contactBarBg}>
  //         <View style={[styles.contactBarFill, { width: "51%" }]} />
  //       </View>
  //       <Text style={styles.contactSub}>
  //         51 of remaining on your {dashboardData?.profile_details?.package_name || "Gold"} plan
  //       </Text>
  //       <TouchableOpacity style={styles.addContactBtn} activeOpacity={0.85}>
  //         <Text style={styles.addContactText}>Add more contact views</Text>
  //       </TouchableOpacity>
  //     </View>
  //   </View>
  // );

  // ── Profile strength ──────────────────────────────────────────────────────
  const strengthRows = [
    { label: "Completeness", value: `${completion}%`, isVerified: false },
    {
      label: "Photos uploaded",
      value: `${imageUrls.length} of 5`,
      isVerified: false,
    },
    { label: "Horoscope", value: "Verified", isVerified: true },
    { label: "iD proof", value: "Verified", isVerified: true },
    // {
    //   label: "Response rate",
    //   value: "92%",
    //   isVerified: false,
    // },
  ];

  const renderProfileStrength = () => (
    <View style={styles.section}>
      <View style={styles.strengthCard}>
        <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Profile strength</Text>
        {strengthRows.map((row, i) => (

          <View
            key={i}
            style={[styles.strengthRow, i < strengthRows.length - 1 && styles.strengthDivider]}
          >
            <Text style={styles.strengthLabel}>{row.label}</Text>
            <View style={styles.strengthValueRow}>
              {/* {row.isVerified && (
                <MaterialIcons name="verified" size={14} color={C.verified} style={{ marginRight: 3 }} />
              )} */}
              <Text style={[styles.strengthValue]}>
                {row.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // ── Received interests (horizontal scroll) ────────────────────────────────
  const receivedProfiles = profileData.filter((p) => p.int_status === 1);

  const renderReceivedInterests = () => {
    if (!receivedProfiles.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Received Interest{" "}
          <Text style={styles.sectionCount}>({receivedProfiles.length})</Text>
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {receivedProfiles.map((profile) => (
            <View key={profile.int_profileid} style={styles.intCard}>
              <Image
                source={getImageSource(profile.int_Profile_img)}
                style={styles.intAvatar}
              />
              <View style={styles.intInfo}>
                <Text style={styles.intName}>
                  {profile.int_profile_name}{" "}
                  <Text style={styles.intId}>({profile.int_profileid})</Text>
                </Text>
                <Text style={styles.intAge}>{profile.int_profile_age} Yrs</Text>
                <Text style={styles.intNotes}>
                  {formatProfileNotes(profile.int_profile_notes)}
                </Text>
                <View style={styles.intActions}>
                  <TouchableWithoutFeedback
                    onPress={() => handleSavePress(profile.int_profileid, "2")}
                  >
                    <MaterialIcons name="check-circle" size={28} color="#53C840" style={{ marginRight: 16 }} />
                  </TouchableWithoutFeedback>
                  <TouchableWithoutFeedback
                    onPress={() => handleSavePress(profile.int_profileid, "3")}
                  >
                    <MaterialCommunityIcons name="close-circle" size={28} color="#FF3333" />
                  </TouchableWithoutFeedback>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ── Existing coloured summary cards (kept exactly as-is) ──────────────────
  const renderExistingCards = () => (
    <>
      {/* red card — Matching Profiles */}
      <TouchableWithoutFeedback onPress={() => navigation.navigate("Home")}>
        <View style={styles.redCardContainer}>
          <View style={styles.redCard}>
            <FontAwesome6 name="user-group" size={30} color="#fff" />
            <Text style={styles.matching}>Matching Profiles</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 10, marginBottom: 10 }}>
              <Text style={styles.matchingNumbers}>
                {dashboardData?.matching_profile_count || 0}
              </Text>
              <View style={{ flexDirection: "row" }}>
                {imageUrls.slice(0, 4).map((url, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: url }}
                    style={{
                      width: 40, height: 40, borderRadius: 20,
                      borderWidth: 2, borderColor: "#fff",
                      marginLeft: idx === 0 ? 0 : -10,
                      backgroundColor: "#eee",
                    }}
                  />
                ))}
                {imageUrls.length > 4 && (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#ccc", justifyContent: "center", alignItems: "center", marginLeft: -10, borderWidth: 2, borderColor: "#fff" }}>
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>+{imageUrls.length - 4}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* violet card — Mutual Interest */}
      <TouchableWithoutFeedback onPress={() => navigation.navigate("DashBoardMutualInterest")}>
        <View style={styles.violetContainer}>
          <View style={styles.violetCard}>
            <View style={styles.textIcons}>
              <Text style={styles.cardText}>Mutual Interest</Text>
              <MaterialCommunityIcons name="heart-multiple" size={30} color="#fff" />
            </View>
            <Text style={styles.cardNumbers}>{dashboardData?.mutual_int_count || 0}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* sandal card — Wishlist */}
      <TouchableWithoutFeedback onPress={() => navigation.navigate("DashBoardWishlist")}>
        <View style={styles.sandalContainer}>
          <View style={styles.sandalCard}>
            <View style={styles.textIcons}>
              <Text style={styles.cardText}>Wishlist</Text>
              <MaterialCommunityIcons name="bookmark" size={30} color="#fff" />
            </View>
            <Text style={styles.cardNumbers}>{dashboardData?.wishlist_count || 0}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* <Text style={styles.pageTitle}>Dashboard</Text> */}

        {/* ── NEW SECTIONS (from screenshot design) ── */}
        {renderProfileHeader()}
        {renderProfileCompletion()}
        {renderStatistics()}
        {renderQuickActions()}
        {renderMyActivity()}
        {/* {renderContactViews()} */}
        {renderProfileStrength()}
        {renderReceivedInterests()}

        {/* ── EXISTING COLOURED SUMMARY CARDS (untouched) ── */}
        <Text style={styles.sectionTitle2}>Summary</Text>
        {renderExistingCards()}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.selectedBg,
  },
  scroll: {
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: fs(18),
    fontWeight: "700",
    color: Colors.dashtext,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },

  // ── Profile header ─────────────────────────────────────────────────────────
  profileHeaderCard: {
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  profileCompletion: {
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: Colors.profilecompetionbg,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  avatarWrapper: {
    width: 75,
    height: 75,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: C.primary + "30",
    marginRight: 12,
    backgroundColor: "#f0e8e8",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  profileHeaderInfo: {
    flex: 1,
  },
  profileHeaderName: {
    fontSize: fs(16),
    fontWeight: "700",
    color: C.text,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 2,
    lineSpacing: -1,
  },
  profileHeaderId: {
    fontSize: fs(12),
    color: C.sub,
    marginBottom: 5,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.goldLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: C.gold + "40",
  },
  memberBadgeText: {
    fontSize: fs(11),
    fontWeight: "700",
    color: C.gold,
  },
  completionBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.profilecompetionbg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  completionLeft: {
    marginRight: 12,
  },
  completionRight: {
    flex: 1,
  },
  completionTitle: {
    fontSize: fs(13),
    fontWeight: "700",
    color: C.text,
    marginBottom: 3,
  },
  completionSub: {
    fontSize: fs(11),
    color: C.sub,
    lineHeight: 16,
  },
  completeBtn: {
    borderRadius: 25,
    overflow: "hidden",
  },
  completeBtnGradient: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  completeBtnText: {
    color: "#fff",
    fontSize: fs(14),
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Section wrapper ────────────────────────────────────────────────────────
  section: {
    marginHorizontal: 14,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: fs(15),
    fontWeight: "700",
    color: C.text,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 10,
    lineSpacing: -1,
  },
  sectionTitle2: {
    fontSize: fs(15),
    fontWeight: "700",
    color: C.text,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    paddingHorizontal: 14,
    marginBottom: 6,
    marginTop: 4,
  },
  sectionCount: {
    fontSize: fs(13),
    color: C.sub,
    fontWeight: "400",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 14,
    alignItems: "left",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  statIconBg: {
    width: 33,
    height: 33,
    borderRadius: 25,
    backgroundColor: Colors.iconContainerBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: fs(20),
    fontWeight: "800",
    color: C.text,
    marginTop: 6,
    marginBottom: 2,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  statLabel: {
    fontSize: fs(10),
    color: C.sub,
    textAlign: "left",
    lineHeight: 13,
  },

  qaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  qaCard: {
    width: (SCREEN_WIDTH - 28 - 10) / 2 - 0.5,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "column",
    alignItems: "left",
    justifyContent: "left",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  qaIconBg: {
    width: 33,
    height: 33,
    borderRadius: 20,
    backgroundColor: Colors.profilecompetionbg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  qaLabel: {
    fontSize: fs(13),
    fontWeight: "600",
    color: C.text,
    textAlign: "left",
  },
  // ── My activity ────────────────────────────────────────────────────────────
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  activityCard: {
    width: (SCREEN_WIDTH - 28 - 10) / 2 - 0.5,
    backgroundColor: C.card,
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  activityIconBg: {
    width: 33,
    height: 33,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    marginTop: 2,
  },
  activityValue: {
    fontSize: fs(22),
    fontWeight: "800",
    color: C.text,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 3,
  },
  activityLabel: {
    fontSize: fs(11),
    color: C.sub,
    lineHeight: 15,
  },

  // ── Contact views ──────────────────────────────────────────────────────────
  contactCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  contactBarBg: {
    height: 6,
    backgroundColor: "#F0E8E0",
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  contactBarFill: {
    height: "100%",
    backgroundColor: C.primary,
    borderRadius: 3,
  },
  contactSub: {
    fontSize: fs(12),
    color: C.sub,
    marginBottom: 12,
  },
  addContactBtn: {
    backgroundColor: C.primaryLight,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  addContactText: {
    fontSize: fs(13),
    fontWeight: "700",
    color: C.primary,
  },

  // ── Profile strength ───────────────────────────────────────────────────────
  strengthCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  strengthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  strengthDivider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  strengthLabel: {
    fontSize: fs(13),
    color: C.sub,
    lineHeight: 15,

  },
  strengthValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  strengthValue: {
    fontSize: fs(13),
    fontWeight: "500",
    color: Colors.textDark,
  },

  // ── Received interests ─────────────────────────────────────────────────────
  intCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    marginRight: 12,
    width: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  intAvatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f0e8e8",
  },
  intInfo: {},
  intName: {
    fontSize: fs(14),
    fontWeight: "700",
    color: C.text,
    marginBottom: 2,
  },
  intId: {
    fontSize: fs(12),
    color: C.sub,
    fontWeight: "400",
  },
  intAge: {
    fontSize: fs(12),
    color: C.sub,
    marginBottom: 4,
  },
  intNotes: {
    fontSize: fs(12),
    color: "#4F515D",
    lineHeight: 17,
    marginBottom: 8,
  },
  intActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  // ── Existing coloured cards (kept exactly as original) ─────────────────────
  redCardContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  redCard: {
    backgroundColor: "#EF4770",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  matching: {
    color: "#fff",
    fontSize: fs(16),
    fontWeight: "700",
    fontFamily: "inter",
    marginVertical: 10,
  },
  matchingNumbers: {
    color: "#fff",
    fontSize: fs(36),
    fontWeight: "700",
    fontFamily: "inter",
  },
  violetContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  violetCard: {
    backgroundColor: "#9047EF",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  sandalContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  sandalCard: {
    backgroundColor: "#EFAC47",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  textIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardText: {
    color: "#fff",
    fontSize: fs(16),
    fontWeight: "700",
    fontFamily: "inter",
  },
  cardNumbers: {
    color: "#fff",
    fontSize: fs(36),
    fontWeight: "700",
    fontFamily: "inter",
    marginVertical: -10,
  },
});

export default DashBoard;