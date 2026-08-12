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

  // ── Quick Action SVGs ─────────────────────────────────────────────────────────
  const PersonalNotesSvg = ({ size = 24, color }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      {/* Notebook body */}
      <Path d="M100 60 Q80 60 75 80 L60 420 Q58 445 80 450 L370 490 Q395 492 400 470 L430 130 Q433 108 415 100 Z"
        fill="none" stroke={color} strokeWidth="26" strokeLinejoin="round" />
      {/* Rings */}
      <Path d="M100 130 Q70 130 70 155 Q70 180 100 180" fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" />
      <Path d="M95 230 Q65 230 65 255 Q65 280 95 280" fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" />
      <Path d="M90 325 Q60 325 60 350 Q60 375 90 375" fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" />
      {/* Lines on page */}
      <Line x1="160" y1="200" x2="360" y2="220" stroke={color} strokeWidth="20" strokeLinecap="round" />
      <Line x1="155" y1="265" x2="345" y2="282" stroke={color} strokeWidth="20" strokeLinecap="round" />
      <Line x1="150" y1="330" x2="330" y2="345" stroke={color} strokeWidth="20" strokeLinecap="round" />
      {/* Pencil */}
      <Path d="M340 370 L430 240 L470 265 L380 395 Z" fill="none" stroke={color} strokeWidth="22" strokeLinejoin="round" />
      <Path d="M340 370 L325 410 L365 400 Z" fill="none" stroke={color} strokeWidth="18" strokeLinejoin="round" />
      {/* Sparkle lines top-right */}
      <Line x1="430" y1="95" x2="445" y2="75" stroke={color} strokeWidth="18" strokeLinecap="round" />
      <Line x1="450" y1="110" x2="470" y2="100" stroke={color} strokeWidth="18" strokeLinecap="round" />
      <Line x1="440" y1="130" x2="460" y2="135" stroke={color} strokeWidth="18" strokeLinecap="round" />
    </Svg>
  );

  const OtherSettingsSvg = ({ size = 24, color }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      {/* Top slider line */}
      <Line x1="60" y1="160" x2="452" y2="160" stroke={color} strokeWidth="32" strokeLinecap="round" />
      {/* Top slider knob */}
      <Circle cx="320" cy="160" r="48" fill="none" stroke={color} strokeWidth="28" />
      <Circle cx="320" cy="160" r="16" fill={color} />
      {/* Bottom slider line */}
      <Line x1="60" y1="352" x2="452" y2="352" stroke={color} strokeWidth="32" strokeLinecap="round" />
      {/* Bottom slider knob */}
      <Circle cx="175" cy="352" r="48" fill="none" stroke={color} strokeWidth="28" />
      <Circle cx="175" cy="352" r="16" fill={color} />
    </Svg>
  );

  const VysAssistSvg = ({ size = 24, color }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      {/* Large center sparkle — filled */}
      <Path
        d="M265 80 C265 80 240 200 170 265 C240 330 265 450 265 450 C265 450 290 330 360 265 C290 200 265 80 265 80 Z"
        fill={color}
      />
      <Path
        d="M60 265 C60 265 190 245 265 265 C190 285 60 265 60 265 Z"
        fill={color}
      />
      <Path
        d="M470 265 C470 265 340 245 265 265 C340 285 470 265 470 265 Z"
        fill={color}
      />
      {/* Small top-left sparkle — filled */}
      <Path
        d="M100 95 C100 95 88 140 60 160 C88 180 100 225 100 225 C100 225 112 180 140 160 C112 140 100 95 100 95 Z"
        fill={color}
      />
      <Path
        d="M30 160 C30 160 75 152 100 160 C75 168 30 160 30 160 Z"
        fill={color}
      />
      <Path
        d="M170 160 C170 160 125 152 100 160 C125 168 170 160 170 160 Z"
        fill={color}
      />
      {/* Small top-right sparkle — filled */}
      <Path
        d="M390 115 C390 115 382 140 365 152 C382 164 390 190 390 190 C390 190 398 164 415 152 C398 140 390 115 390 115 Z"
        fill={color}
      />
      <Path
        d="M340 152 C340 152 368 146 390 152 C368 158 340 152 340 152 Z"
        fill={color}
      />
      <Path
        d="M440 152 C440 152 412 146 390 152 C412 158 440 152 440 152 Z"
        fill={color}
      />
    </Svg>
  );

  const ProfileSentSvg = ({ size = 24, color }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Path
        d="M60 256 L440 80 L310 440 L230 270 Z"
        fill="none"
        stroke={color}
        strokeWidth="30"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Line x1="230" y1="270" x2="440" y2="80" stroke={color} strokeWidth="30" strokeLinecap="round" />
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
      SvgIcon: PersonalNotesSvg,
      onPress: () => navigation.navigate("PersonalNotes"),
    },
    {
      label: "Other Settings",
      SvgIcon: OtherSettingsSvg,
      onPress: () => navigation.navigate("OtherSettings"),
    },
    {
      label: "Vys Assist",
      SvgIcon: VysAssistSvg,
      onPress: () => navigation.navigate("VysassistResults"),
    },
  ];

  const renderQAIcon = (a) => (
    <a.SvgIcon size={20} color={Colors.dashtext} />
  )


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
      SvgIcon: ProfileSentSvg,
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
    const size = 18;
    if (a.SvgIcon) {
      return <a.SvgIcon size={size} color={a.color} />;
    }
    if (a.iconLib === "Ionicons") {
      return <Ionicons name={a.icon} size={size} color={a.color} />;
    }
    return <MaterialIcons name={a.icon} size={size} color={a.color} />;
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
  // const strengthRows = [
  //   { label: "Completeness", value: `${completion}%`, isVerified: false },
  //   {
  //     label: "Photos uploaded",
  //     value: `${imageUrls.length} of 5`,
  //     isVerified: false,
  //   },
  //   { label: "Horoscope", value: "Verified", isVerified: true },
  //   { label: "iD proof", value: "Verified", isVerified: true },
  //   {
  //     label: "Response rate",
  //     value: "92%",
  //     isVerified: false,
  //   },
  // ];

  // const renderProfileStrength = () => (
  //   <View style={styles.section}>
  //     <View style={styles.strengthCard}>
  //       <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Profile strength</Text>
  //       {strengthRows.map((row, i) => (

  //         <View
  //           key={i}
  //           style={[styles.strengthRow, i < strengthRows.length - 1 && styles.strengthDivider]}
  //         >
  //           <Text style={styles.strengthLabel}>{row.label}</Text>
  //           <View style={styles.strengthValueRow}>
  //             {/* {row.isVerified && (
  //               <MaterialIcons name="verified" size={14} color={C.verified} style={{ marginRight: 3 }} />
  //             )} */}
  //             <Text style={[styles.strengthValue]}>
  //               {row.value}
  //             </Text>
  //           </View>
  //         </View>
  //       ))}
  //     </View>
  //   </View>
  // );

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
    <View style={styles.summaryGrid}>
      {/* Matching Profiles — large full-width hero card */}
      <TouchableOpacity
        style={styles.heroCard}
        onPress={() => navigation.navigate("Home")}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#B72024", "#7A0A0E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Top row */}
          <View style={styles.heroTop}>
            <View style={styles.heroIconBg}>
              <FontAwesome6 name="user-group" size={20} color="#fff" />
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>View All →</Text>
            </View>
          </View>

          {/* Count + label */}
          <Text style={styles.heroCount}>
            {dashboardData?.matching_profile_count || 0}
          </Text>
          <Text style={styles.heroLabel}>Matching Profiles</Text>

          {/* Avatar stack */}
          {imageUrls.length > 0 && (
            <View style={styles.heroAvatarRow}>
              {imageUrls.slice(0, 5).map((url, idx) => (
                <Image
                  key={idx}
                  source={{ uri: url }}
                  style={[
                    styles.heroAvatar,
                    { marginLeft: idx === 0 ? 0 : -12, zIndex: 5 - idx },
                  ]}
                />
              ))}
              {imageUrls.length > 5 && (
                <View style={[styles.heroAvatarMore, { marginLeft: -12 }]}>
                  <Text style={styles.heroAvatarMoreText}>+{imageUrls.length - 5}</Text>
                </View>
              )}
              <Text style={styles.heroAvatarLabel}>
                {dashboardData?.matching_profile_count || 0} people matched
              </Text>
            </View>
          )}

          {/* Decorative circle */}
          <View style={styles.heroDecorCircle1} />
          <View style={styles.heroDecorCircle2} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Mutual Interest + Wishlist — side by side */}
      <View style={styles.summaryRow}>
        {/* Mutual Interest */}
        <TouchableOpacity
          style={styles.halfCard}
          onPress={() => navigation.navigate("DashBoardMutualInterest")}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={["#4A1A2E", "#7B2D54"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.halfGradient}
          >
            <View style={styles.halfIconBg}>
              <MaterialCommunityIcons name="heart-multiple" size={18} color="#fff" />
            </View>
            <Text style={styles.halfCount}>
              {dashboardData?.mutual_int_count || 0}
            </Text>
            <Text style={styles.halfLabel}>Mutual{"\n"}Interest</Text>
            <View style={styles.halfDecorCircle} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Wishlist */}
        <TouchableOpacity
          style={styles.halfCard}
          onPress={() => navigation.navigate("DashBoardWishlist")}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={["#C47A1A", "#E2B13C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.halfGradient}
          >
            <View style={styles.halfIconBg}>
              <MaterialCommunityIcons name="bookmark" size={18} color="#fff" />
            </View>
            <Text style={styles.halfCount}>
              {dashboardData?.wishlist_count || 0}
            </Text>
            <Text style={styles.halfLabel}>Wish{"\n"}List</Text>
            <View style={[styles.halfDecorCircle, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* <Text style={styles.pageTitle}>Dashboard</Text> */}

        {/* ── NEW SECTIONS (from screenshot design) ── */}
        {renderProfileHeader()}
        {renderProfileCompletion()}
        {/* ── EXISTING COLOURED SUMMARY CARDS (untouched) ── */}
        <Text style={styles.sectionTitle2}>Summary</Text>
        {renderExistingCards()}
        {renderStatistics()}
        {renderQuickActions()}
        {renderMyActivity()}
        {/* {renderContactViews()} */}
        {/* {renderProfileStrength()} */}
        {renderReceivedInterests()}


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
  // ── Summary redesign ───────────────────────────────────────────────────────
  summaryHeader: {
    paddingHorizontal: 14,
    marginBottom: 10,
    marginTop: 4,
  },
  summarySub: {
    fontSize: fs(11),
    color: C.sub,
    marginTop: 1,
  },
  summaryGrid: {
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },

  // Hero card (Matching Profiles)
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#B72024",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  heroGradient: {
    padding: 20,
    minHeight: 170,
    position: "relative",
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heroIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: fs(11),
    fontWeight: "600",
  },
  heroCount: {
    fontSize: fs(42),
    fontWeight: "800",
    color: "#fff",
    lineHeight: fs(46),
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  heroLabel: {
    fontSize: fs(13),
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginBottom: 14,
  },
  heroAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#eee",
  },
  heroAvatarMore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  heroAvatarMoreText: {
    color: "#fff",
    fontSize: fs(9),
    fontWeight: "700",
  },
  heroAvatarLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: fs(11),
    marginLeft: 8,
    fontWeight: "500",
  },
  heroDecorCircle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -30,
    right: -20,
  },
  heroDecorCircle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: 10,
    right: 60,
  },

  // Half cards (Mutual Interest & Wishlist)
  halfCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  halfGradient: {
    padding: 16,
    minHeight: 140,
    position: "relative",
    overflow: "hidden",
  },
  halfIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  halfCount: {
    fontSize: fs(34),
    fontWeight: "800",
    color: "#fff",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    lineHeight: fs(38),
  },
  halfLabel: {
    fontSize: fs(12),
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginTop: 4,
    lineHeight: fs(17),
  },
  halfDecorCircle: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -20,
    right: -20,
  },
});

export default DashBoard;