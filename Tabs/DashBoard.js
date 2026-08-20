import React, { useState, useCallback, useRef, useEffect } from "react";
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
  Animated,
  Easing,
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
  fetchProfileDataCheck,
  logProfileVisit,
  fetchMyProfilePersonal,
} from "../CommonApiCall/CommonApiCall";
import { TopAlignedImage } from "../Components/ReuseImageAlign/TopAlignedImage";
import { Colors } from "../Reusable/Theme";
import Svg, { Path, Circle, Rect, Polyline, Line } from "react-native-svg";
import { PlatinumModalPopup } from "../Components/ReusePopups/PlatinumModalPopup";

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

// ── Shimmer Loader Component ──────────────────────────────────────────────────
const DashboardShimmer = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Title Shimmer */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
        <Animated.View style={[styles.shimmerBar, { opacity, width: 120, height: 22 }]} />
      </View>

      {/* Profile Header Card Shimmer */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.profileHeaderRow}>
          <Animated.View style={[styles.shimmerCircle, { opacity, width: 75, height: 75, borderRadius: 25, marginRight: 12 }]} />
          <View style={{ flex: 1 }}>
            <Animated.View style={[styles.shimmerBar, { opacity, width: "60%", height: 18, marginBottom: 8 }]} />
            <Animated.View style={[styles.shimmerBar, { opacity, width: "40%", height: 14, marginBottom: 8 }]} />
            <Animated.View style={[styles.shimmerBar, { opacity, width: "50%", height: 20, borderRadius: 10 }]} />
          </View>
        </View>
      </View>

      {/* Profile Completion Box Shimmer */}
      <View style={styles.profileCompletion}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Animated.View style={[styles.shimmerCircle, { opacity, width: 56, height: 56, borderRadius: 28, marginRight: 12 }]} />
          <View style={{ flex: 1 }}>
            <Animated.View style={[styles.shimmerBar, { opacity, width: "70%", height: 16, marginBottom: 8 }]} />
            <Animated.View style={[styles.shimmerBar, { opacity, width: "90%", height: 12 }]} />
          </View>
        </View>
        <Animated.View style={[styles.shimmerBar, { opacity, width: "100%", height: 42, borderRadius: 10 }]} />
      </View>

      {/* Summary Title Shimmer */}
      <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
        <Animated.View style={[styles.shimmerBar, { opacity, width: 90, height: 18 }]} />
      </View>

      {/* Summary Cards Grid Shimmer */}
      <View style={styles.summaryGrid}>
        <Animated.View style={[styles.shimmerBar, { opacity, width: "100%", height: 110, borderRadius: 20 }]} />
        <View style={styles.summaryRow}>
          <Animated.View style={[styles.shimmerBar, { opacity, flex: 1, height: 90, borderRadius: 20 }]} />
          <Animated.View style={[styles.shimmerBar, { opacity, flex: 1, height: 90, borderRadius: 20 }]} />
        </View>
      </View>

      {/* Statistics Shimmer */}
      <View style={styles.section}>
        <Animated.View style={[styles.shimmerBar, { opacity, width: 100, height: 18, marginBottom: 10 }]} />
        <View style={styles.statsRow}>
          <Animated.View style={[styles.shimmerBar, { opacity, flex: 1, height: 85, borderRadius: 14 }]} />
          <Animated.View style={[styles.shimmerBar, { opacity, flex: 1, height: 85, borderRadius: 14 }]} />
          <Animated.View style={[styles.shimmerBar, { opacity, flex: 1, height: 85, borderRadius: 14 }]} />
        </View>
      </View>

      {/* Quick Actions Shimmer */}
      <View style={styles.section}>
        <Animated.View style={[styles.shimmerBar, { opacity, width: 120, height: 18, marginBottom: 10 }]} />
        <View style={styles.qaGrid}>
          <Animated.View style={[styles.shimmerBar, { opacity, width: (SCREEN_WIDTH - 28 - 10) / 2 - 0.5, height: 80, borderRadius: 14 }]} />
          <Animated.View style={[styles.shimmerBar, { opacity, width: (SCREEN_WIDTH - 28 - 10) / 2 - 0.5, height: 80, borderRadius: 14 }]} />
        </View>
      </View>
    </ScrollView>
  );
};

export const DashBoard = () => {
  const [profileData, setProfileData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [showPlatinumModal, setShowPlatinumModal] = useState(false);
  const navigation = useNavigation();
  const [personalPackageName, setPersonalPackageName] = useState("");



  const handleInterestProfileClick = async (viewedProfileId) => {
    try {
      const profileCheckResponse = await fetchProfileDataCheck(viewedProfileId);

      if (
        profileCheckResponse?.status === "failure" &&
        profileCheckResponse.message === "Profile visibility restricted"
      ) {
        setShowPlatinumModal(true);
        return;
      }

      if (profileCheckResponse?.status === "failure") {
        Toast.show({
          type: "error",
          text1: profileCheckResponse.message || "Unable to view profile",
          position: "top",
        });
        return;
      }

      const success = await logProfileVisit(viewedProfileId);
      if (success) {
        navigation.navigate("ProfileDetails", { viewedProfileId });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to open profile",
          position: "top",
        });
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "";
      if (msg === "Profile visibility restricted") {
        setShowPlatinumModal(true);
      } else {
        Toast.show({
          type: "error",
          text1: "Something went wrong.",
          position: "top",
        });
      }
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setProfileData([]);

    try {
      // Fetch these first
      const [profiles, dashboard] = await Promise.all([
        fetchProfileInterests(),
        fetchDashboardData(),
      ]);

      setProfileData(profiles || []);
      setDashboardData(dashboard);

      // Get profile ID from dashboard response
      const profileId = dashboard?.profile_details?.profile_id;

      console.log("Profile ID:", profileId);

      // Fetch personal details only when profile ID is available
      if (profileId) {
        const personalProfile = await fetchMyProfilePersonal(profileId);

        console.log("Personal Profile:", personalProfile);

        setPersonalPackageName(
          personalProfile?.data?.package_name || ""
        );
      } else {
        console.log("Profile ID not found");
        setPersonalPackageName("");
      }
    } catch (err) {
      console.log(
        "Error loading dashboard:",
        err?.response?.data || err.message
      );

      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message,
        position: "top",
      });
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
  const planName = personalPackageName || "";

  const memberLabel = planName || null;
  // ── Profile header card ───────────────────────────────────────────────────
  const renderProfileHeader = () => (
    <TouchableOpacity
      style={styles.profileHeaderCard}
      onPress={() => navigation.navigate("MyProfile")}
      activeOpacity={0.88}
    >
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
              <MaterialCommunityIcons
                name="crown"
                size={14}
                color="#FFFFFF"          // ← white icon
                style={{ marginRight: 6 }}
              />
              <Text style={styles.memberBadgeText}>{memberLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProfileCompletion = () => {
    if (completion >= 100) {
      return null;
    }

    return (
      <View style={styles.profileCompletion}>
        <TouchableOpacity
          style={styles.completionBox}
          onPress={() => navigation.navigate("ProfileCompletionForm")}
          activeOpacity={0.85}
        >
          <View style={styles.completionLeft}>
            <CircularProgress
              value={completion}
              valueSuffix="%"
              progressValueColor={Colors.primary}
              progressValueStyle={{
                fontSize: fs(13),
                fontWeight: "700",
              }}
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
            <Text style={styles.completeBtnText}>
              Complete Your Profile →
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // ── Quick Action SVGs ─────────────────────────────────────────────────────────
  const PersonalNotesSvg = ({ size = 24, color }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Path d="M100 60 Q80 60 75 80 L60 420 Q58 445 80 450 L370 490 Q395 492 400 470 L430 130 Q433 108 415 100 Z"
        fill="none" stroke={color} strokeWidth="26" strokeLinejoin="round" />
      <Path d="M100 130 Q70 130 70 155 Q70 180 100 180" fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" />
      <Path d="M95 230 Q65 230 65 255 Q65 280 95 280" fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" />
      <Path d="M90 325 Q60 325 60 350 Q60 375 90 375" fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" />
      <Line x1="160" y1="200" x2="360" y2="220" stroke={color} strokeWidth="20" strokeLinecap="round" />
      <Line x1="155" y1="265" x2="345" y2="282" stroke={color} strokeWidth="20" strokeLinecap="round" />
      <Line x1="150" y1="330" x2="330" y2="345" stroke={color} strokeWidth="20" strokeLinecap="round" />
      <Path d="M340 370 L430 240 L470 265 L380 395 Z" fill="none" stroke={color} strokeWidth="22" strokeLinejoin="round" />
      <Path d="M340 370 L325 410 L365 400 Z" fill="none" stroke={color} strokeWidth="18" strokeLinejoin="round" />
      <Line x1="430" y1="95" x2="445" y2="75" stroke={color} strokeWidth="18" strokeLinecap="round" />
      <Line x1="450" y1="110" x2="470" y2="100" stroke={color} strokeWidth="18" strokeLinecap="round" />
      <Line x1="440" y1="130" x2="460" y2="135" stroke={color} strokeWidth="18" strokeLinecap="round" />
    </Svg>
  );

  const OtherSettingsSvg = ({ size = 24, color }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Line x1="60" y1="160" x2="452" y2="160" stroke={color} strokeWidth="32" strokeLinecap="round" />
      <Circle cx="320" cy="160" r="48" fill="none" stroke={color} strokeWidth="28" />
      <Circle cx="320" cy="160" r="16" fill={color} />
      <Line x1="60" y1="352" x2="452" y2="352" stroke={color} strokeWidth="32" strokeLinecap="round" />
      <Circle cx="175" cy="352" r="48" fill="none" stroke={color} strokeWidth="28" />
      <Circle cx="175" cy="352" r="16" fill={color} />
    </Svg>
  );

  const VysAssistSvg = ({ size = 24, color }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512">
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
      icon: "people-outline",
      iconLib: "Ionicons",
      onPress: () => navigation.navigate("MyVisitors"),
    },
    {
      label: "Photo Request",
      value: dashboardData?.photo_int_count ?? 0,
      icon: "image-plus",
      iconLib: "MaterialCommunity",
      onPress: () => navigation.navigate("PhotoRequest"),
    },
    {
      label: "Gallery",
      value: dashboardData?.gallery_count ?? 0,
      icon: "photo-library",
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
  );

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
            <View style={styles.qaIconBg}>
              {renderQAIcon(a)}
            </View>
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
      label: "Interests sent",
      value: dashboardData?.sent_int_count ?? 0,
      SvgIcon: ProfileSentSvg,
      iconLib: "MaterialIcons",
      color: Colors.dashtext,
      bgColor: Colors.profilecompetionbg,
      onPress: () => navigation.navigate("InterestSent"),
    },
    {
      label: "Mutual Interest",
      value: dashboardData?.mutual_int_count ?? 0,
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
  const receivedProfiles = profileData.filter((p) => p.int_status === 1);

  const renderReceivedInterests = () => {
    if (!receivedProfiles.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Received Interest{" "}
          <Text style={styles.sectionCount}>({receivedProfiles.length})</Text>
        </Text>

        {receivedProfiles.map((profile) => (
          <View key={profile.int_profileid} style={styles.intCard}>

            {/* ── Top row: image + name/age ── */}
            <View style={styles.intTopRow}>

              {/* Tappable image */}
              <TouchableOpacity
                onPress={() => handleInterestProfileClick(profile.int_profileid)}
                activeOpacity={0.85}
              >
                <Image
                  source={getImageSource(profile.int_Profile_img)}
                  style={styles.intThumb}
                />
              </TouchableOpacity>

              <View style={styles.intTopInfo}>
                {/* Tappable name */}
                <TouchableOpacity
                  onPress={() => handleInterestProfileClick(profile.int_profileid)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.intName} numberOfLines={1}>
                    {profile.int_profile_name}
                  </Text>
                </TouchableOpacity>

                {/* Tappable profile ID */}
                <TouchableOpacity
                  onPress={() => handleInterestProfileClick(profile.int_profileid)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.intMeta}>
                    {profile.int_profileid} · {profile.int_profile_age} Yrs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Notes quote block ── */}
            {profile.int_profile_notes ? (
              <View style={styles.intQuoteBox}>
                <Text style={styles.intQuoteText} numberOfLines={4}>
                  "{profile.int_profile_notes}"
                </Text>
              </View>
            ) : null}

            {/* ── Accept / Decline buttons ── */}
            <View style={styles.intActions}>
              <TouchableOpacity
                onPress={() => handleSavePress(profile.int_profileid, "2")}
                style={styles.intAcceptBtn}
                activeOpacity={0.82}
              >
                <MaterialIcons name="check" size={16} color="#fff" />
                <Text style={styles.intAcceptText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSavePress(profile.int_profileid, "3")}
                style={styles.intRejectBtn}
                activeOpacity={0.82}
              >
                <MaterialCommunityIcons name="close" size={16} color={C.primary} />
                <Text style={styles.intRejectText}>Decline</Text>
              </TouchableOpacity>
            </View>

          </View>
        ))}
      </View>
    );
  };

  const renderExistingCards = () => (
    <View style={styles.summaryGrid}>
      {/* Matching Profiles */}
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
          <View style={styles.heroTop}>
            <View style={styles.heroIconBg}>
              <FontAwesome6 name="user-group" size={18} color="#fff" />
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>View All →</Text>
            </View>
          </View>
          <Text style={styles.heroCount}>{dashboardData?.matching_profile_count || 0}</Text>
          <Text style={styles.heroLabel}>Matching Profiles</Text>
          {imageUrls.length > 0 && (
            <View style={styles.heroAvatarRow}>
              {imageUrls.slice(0, 5).map((url, idx) => (
                <Image
                  key={idx}
                  source={{ uri: url }}
                  style={[styles.heroAvatar, { marginLeft: idx === 0 ? 0 : -12, zIndex: 5 - idx }]}
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
          <View style={styles.heroDecorCircle1} />
          <View style={styles.heroDecorCircle2} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Mutual Interest + Wishlist */}
      {/* <View style={styles.summaryRow}>
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
              <MaterialCommunityIcons name="heart-multiple" size={16} color="#fff" />
            </View>
            <Text style={styles.halfCount}>{dashboardData?.mutual_int_count || 0}</Text>
            <Text style={styles.halfLabel}>Mutual Interest</Text>
            <View style={styles.halfDecorCircle} />
          </LinearGradient>
        </TouchableOpacity>

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
              <MaterialCommunityIcons name="bookmark" size={16} color="#fff" />
            </View>
            <Text style={styles.halfCount}>{dashboardData?.wishlist_count || 0}</Text>
            <Text style={styles.halfLabel}>Wishlist</Text>
            <View style={[styles.halfDecorCircle, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
          </LinearGradient>
        </TouchableOpacity>
      </View> */}
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <DashboardShimmer />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Dashboard</Text>

          {renderProfileHeader()}
          {renderProfileCompletion()}
          {/* <Text style={styles.sectionTitle2}>Summary</Text> */}

          {renderExistingCards()}
          {renderStatistics()}
          {renderQuickActions()}
          {renderMyActivity()}
          {renderReceivedInterests()}
        </ScrollView>
      )}
      <PlatinumModalPopup
        visible={showPlatinumModal}
        onClose={() => setShowPlatinumModal(false)}
      />
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
    paddingBottom: 90,
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

  // ── Shimmer Elements ───────────────────────────────────────────────────────
  shimmerBar: {
    backgroundColor: "#E2DBCE",
    borderRadius: 6,
  },
  shimmerCircle: {
    backgroundColor: "#E2DBCE",
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
  },
  profileHeaderId: {
    fontSize: fs(12),
    color: C.sub,
    marginBottom: 5,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.gold,        // ← solid gold fill, not light
    borderRadius: 50,               // ← full pill shape
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: "flex-start",
    // remove borderWidth and borderColor
  },
  memberBadgeText: {
    fontSize: fs(13),               // slightly bigger
    fontWeight: "600",
    color: "#FFFFFF",               // ← white text
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
    alignItems: "flex-start",
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
    alignItems: "flex-start",
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
    fontSize: fs(20),
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

  // ── Received interests ─────────────────────────────────────────────────────
  // ── Received interests ─────────────────────────────────────────────────────
  intCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  intTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  intThumb: {
    width: 72,
    height: 82,
    borderRadius: 10,
    resizeMode: "cover",
    backgroundColor: "#f0e8e8",
    marginRight: 12,
  },
  intTopInfo: {
    flex: 1,
    justifyContent: "center",
  },
  intName: {
    fontSize: fs(16),
    fontWeight: "700",
    color: C.text,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 4,
  },
  intMeta: {
    fontSize: fs(12),
    color: C.sub,
    fontWeight: "500",
  },
  intQuoteBox: {
    backgroundColor: "#FFF5F5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  intQuoteText: {
    fontSize: fs(12),
    color: "#4F515D",
    fontStyle: "italic",
    lineHeight: 18,
  },
  intActions: {
    flexDirection: "row",
    gap: 10,
  },
  intAcceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: C.primary,
    borderRadius: 25,
    paddingVertical: 11,
  },
  intAcceptText: {
    fontSize: fs(13),
    fontWeight: "700",
    color: "#fff",
  },
  intRejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  intRejectText: {
    fontSize: fs(13),
    fontWeight: "700",
    color: C.text,
  },

  // ── Summary redesign ───────────────────────────────────────────────────────
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
    padding: 12,
    minHeight: 100,
    position: "relative",
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  heroIconBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    fontSize: fs(22),
    fontWeight: "800",
    color: "#fff",
    lineHeight: fs(26),
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  heroLabel: {
    fontSize: fs(13),
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginBottom: 6,
  },
  heroAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#fff",
    backgroundColor: "#eee",
  },
  heroAvatarMore: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  heroAvatarLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: fs(10),
    marginLeft: 6,
    fontWeight: "500",
  },
  heroAvatarMoreText: {
    color: "#fff",
    fontSize: fs(9),
    fontWeight: "700",
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
    padding: 10,
    minHeight: 90,
    position: "relative",
    overflow: "hidden",
  },
  halfIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  halfCount: {
    fontSize: fs(19),
    fontWeight: "800",
    color: "#fff",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    lineHeight: fs(22),
  },
  halfLabel: {
    fontSize: fs(12),
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginTop: 1,
    lineHeight: fs(13),
  },
  halfDecorCircle: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: -15,
    right: -15,
  },
});

export default DashBoard;