import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Linking,
  Dimensions,
  Platform,
  StatusBar,
  Pressable,
  Animated,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome6,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import CircularProgress from "react-native-circular-progress-indicator";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fetchDashboardData,
  getMyProfilePersonal,
  getMyEducationalDetails,
} from "../CommonApiCall/CommonApiCall";
import Toast from "react-native-toast-message";
import { TopAlignedImage } from "../Components/ReuseImageAlign/TopAlignedImage";
import config from "../API/Apiurl";
import { Colors } from "../Reusable/Theme";
import { SafeAreaView } from "react-native-safe-area-context";

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive helper functions
const wp = (percentage) => {
  return (percentage * screenWidth) / 100;
};

const hp = (percentage) => {
  return (percentage * screenHeight) / 100;
};

const responsiveFontSize = (size) => {
  const scale = screenWidth / 375;
  const newSize = size * scale;
  return Math.max(12, Math.min(newSize, 30));
};

// ── Shimmer Component ────────────────────────────────────────────────────────
const Shimmer = ({ width, height, style, borderRadius }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: "#E8E8E8",
          borderRadius: borderRadius || 0,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: width * 2,
          height: "100%",
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.6)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>
    </View>
  );
};

// ── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

// ── Menu Row Item ────────────────────────────────────────────────────────────
const MenuRowItem = ({ icon, label, onPress, isLast = false }) => (
  <TouchableOpacity
    style={[styles.menuRow, isLast && { borderBottomWidth: 0 }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuLeft}>
      {icon}
      <Text style={styles.menuLabelText}>{label}</Text>
    </View>
    <Ionicons
      name="chevron-forward"
      size={18}
      color={Colors.textMuted || "#71717A"}
    />
  </TouchableOpacity>
);

export const Menu = () => {
  const navigation = useNavigation();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [profileDetails, setProfileDetails] = useState(null);
  const [educationalDetails, setEducationalDetails] = useState(null);
  const [buttonText, setButtonText] = useState("Upgrade");
  const [activePlanId, setActivePlanId] = useState(null);
  const allowedPremiumIds = [1, 2, 3, 10, 11, 13, 14, 15, 16, 17];
  const isPlan16 = activePlanId === 16;

  useEffect(() => {
    const determineButtonType = async () => {
      try {
        const currentPlanId = await AsyncStorage.getItem("current_plan_id");
        const validityDate = await AsyncStorage.getItem("valid_till_date");

        console.log("Current Plan ID:", currentPlanId);
        console.log("Validity Date:", validityDate);

        const allowedPremiumIds = [1, 2, 3, 14, 15, 17, 10, 11, 12, 13];
        const planId = parseInt(currentPlanId || "0", 10);
        setActivePlanId(planId);

        let buttonType = "Upgrade";

        if (allowedPremiumIds.includes(planId)) {
          if (validityDate) {
            const validDate = new Date(validityDate);
            const currentDate = new Date();

            console.log("Valid Date:", validDate);
            console.log("Current Date:", currentDate);
            console.log(
              "Is Valid:",
              validDate.getTime() > currentDate.getTime()
            );

            if (validDate.getTime() > currentDate.getTime()) {
              buttonType = "Add-On";
            } else {
              buttonType = "Renew";
            }
          } else {
            console.log("No validity date found - defaulting to Upgrade");
            buttonType = "Upgrade";
          }
        } else {
          console.log("Plan ID not in allowed premium IDs");
        }

        console.log("Button Type:", buttonType);
        setButtonText(buttonType);
      } catch (error) {
        console.error("Error determining button type:", error);
        setButtonText("Upgrade");
      }
    };

    determineButtonType();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashboard, profileResult] = await Promise.all([
          fetchDashboardData(),
          getMyProfilePersonal(),
        ]);

        console.log("Dashboard response ==>", dashboard);
        console.log("Profile details response ==>", profileResult);

        setDashboardData(dashboard);
        if (profileResult?.data) {
          setProfileDetails(profileResult.data);
        }
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message || "Failed to fetch data.",
          position: "top",
        });
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchProfileData = async () => {
    try {
      const data = await getMyEducationalDetails();
      console.log("data educational details ===>", data);
      setEducationalDetails(data.data);
    } catch (error) {
      console.error("Failed to load profile data", error);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.reset({ index: 0, routes: [{ name: "LoginPage" }] });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleUpgradeClick = () => {
    if (buttonText === "Add-On") {
      navigation.navigate("PayNow", { isAddOnOnly: true });
    } else if (buttonText === "Renew") {
      navigation.navigate("MembershipPlan");
    } else {
      navigation.navigate("MembershipPlan");
    }
  };

  const getImageSource = (image) => {
    const defaultImage =
      "https://vysyamat.blob.core.windows.net/vysyamala/default_groom.png";

    let uri = defaultImage;

    if (Array.isArray(image) && image.length > 0 && typeof image[0] === "string") {
      uri = image[0];
    } else if (typeof image === "string" && image.trim() !== "") {
      uri = image;
    }

    return { uri };
  };

  const handleShare = () => {
    setShareModalVisible(true);
  };

  const handleWhatsAppShareWithImage = async (withImage = false) => {
    const profileName =
      dashboardData?.profile_details?.profile_name || "Not available";
    const profileId =
      dashboardData?.profile_details?.profile_id || "Not available";
    const EncrytedprofileId =
      profileDetails?.encrypted_profile_id || "Not available";
    const age = dashboardData?.profile_details?.age || "Not available";
    const starName =
      dashboardData?.profile_details?.star_name || "Not available";
    const vysyamalaUrl = "vysyamala.com";
    const profession = profileDetails?.prosession;
    const annualIncome = educationalDetails?.personal_ann_inc_name;
    const placeOfStay =
      educationalDetails?.personal_work_district ||
      educationalDetails?.personal_work_city_name;
    const education = educationalDetails?.persoanl_degree_name;
    const companyName = educationalDetails?.personal_company_name;
    const businessName = educationalDetails?.personal_business_name;
    let professionLine = "💼 *Profession:* Not available\n";

    if (profession) {
      if (profession.toLowerCase() === "employed" && companyName) {
        professionLine = `💼 *Profession:* Employed at ${companyName}\n`;
      } else if (profession.toLowerCase() === "business" && businessName) {
        professionLine = `💼 *Profession:* Business at ${businessName}\n`;
      } else if (
        profession.toLowerCase() === "employed/business" &&
        businessName
      ) {
        professionLine = `💼 *Profession:* ${profession}-Employed at ${companyName}, Business at ${businessName}\n`;
      } else if (
        profession.toLowerCase() === "goverment/ psu" &&
        companyName
      ) {
        professionLine = `💼 *Profession:* Government/ PSU at ${companyName}\n`;
      } else {
        professionLine = `💼 *Profession:* ${profession}\n`;
      }
    }

    const shareUrl = withImage
      ? `${config.apiUrl}/auth/profile/${EncrytedprofileId}/`
      : `${config.apiUrl}/auth/profile_view/${EncrytedprofileId}/`;
    const title = "Check out this profile!";

    const message =
      `${title}\n\n` +
      `🆔 *Profile ID:* ${profileId}\n` +
      `👤 *Profile Name:* ${profileName}\n` +
      `🎂 *Age:* ${age} years\n` +
      `✨ *Star Name:* ${starName}\n` +
      `💰 *Annual Income:* ${annualIncome || "Not available"}\n` +
      `🎓 *Education:* ${education || "Not available"}\n` +
      professionLine +
      `📍 *Place of Stay:* ${placeOfStay || "Not available"}\n\n` +
      `🌟 *For More Details:* ${shareUrl}\n` +
      `-------------------------------------------\n` +
      `Click here to register your profile on Vysyamala:\n` +
      `${vysyamalaUrl}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (!supported) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "WhatsApp is not installed",
          position: "bottom",
        });
        return;
      }
      await Linking.openURL(whatsappUrl);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to share on WhatsApp",
        position: "bottom",
      });
    } finally {
      setShareModalVisible(false);
    }
  };

  const completionValue =
    parseInt(dashboardData?.profile_details?.completion_per || "0", 10);

  const handleWhatsAppShareWithoutImage = async () => {
    try {
      const profileName = dashboardData?.profile_details?.profile_name || 'Not available';
      const profileId = dashboardData?.profile_details?.profile_id || 'Not available';
      const age = dashboardData?.profile_details?.age || 'Not available';
      const starName = dashboardData?.profile_details?.star_name || 'Not available';
      const vysyamalaUrl = 'vysyamala.com';
      const profession = profileDetails?.prosession;
      const annualIncome = educationalDetails?.personal_ann_inc_name;
      const placeOfStay = educationalDetails?.personal_work_district || educationalDetails?.personal_work_city_name;
      const education = educationalDetails?.persoanl_degree_name;
      const companyName = educationalDetails?.personal_company_name;
      const businessName = educationalDetails?.personal_business_name;
      let professionLine = '💼 *Profession:* Not available\n';

      if (profession) {
        if (profession.toLowerCase() === 'employed' && companyName) {
          professionLine = `💼 *Profession:* Employed at ${companyName}\n`;
        } else if (profession.toLowerCase() === 'business' && businessName) {
          professionLine = `💼 *Profession:* Business at ${businessName}\n`;
        } else if (profession.toLowerCase() === 'employed/business' && businessName) {
          professionLine = `💼 *Profession:* ${profession}-Employed at ${companyName}, Business at ${businessName}\n`;
        } else if (profession.toLowerCase() === 'goverment/ psu' && companyName) {
          professionLine = `💼 *Profession:* Government/ PSU at ${companyName}\n`;
        } else {
          professionLine = `💼 *Profession:* ${profession}\n`;
        }
      }

      const shareUrlWithoutImage = `${config.apiUrl}/auth/profile_view/${profileId}/`;
      const title = 'Check out this profile!';

      const message =
        `${title}\n\n` +
        `🆔 *Profile ID:* ${profileId}\n` +
        `👤 *Profile Name:* ${profileName}\n` +
        `🎂 *Age:* ${age} years\n` +
        `✨ *Star Name:* ${starName}\n` +
        `💰 *Annual Income:* ${annualIncome || 'Not available'}\n` +
        `🎓 *Education:* ${education || 'Not available'}\n` +
        professionLine +
        `📍 *Place of Stay:* ${placeOfStay || 'Not available'}\n\n` +
        `🌟 *For More Details:* ${shareUrlWithoutImage}\n` +
        `-------------------------------------------\n` +
        `Click here to register your profile on Vysyamala:\n` +
        `${vysyamalaUrl}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;

      const supported = await Linking.canOpenURL(whatsappUrl);
      if (!supported) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'WhatsApp is not installed on your device',
          position: 'top',
        });
        return;
      }

      await Linking.openURL(whatsappUrl);
    } catch (error) {
      console.error('WhatsApp sharing error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to share on WhatsApp. Please try again.',
        position: 'top',
      });
    } finally {
      setShareModalVisible(false);
    }
  };

  const renderShimmer = () => {
    const progressWidth = screenWidth - 32;
    const textWidth = progressWidth * 0.8;

    return (
      <>
        <View style={styles.card}>
          <View style={styles.profileHeaderRow}>
            <Shimmer width={68} height={68} borderRadius={34} style={{ marginRight: 14 }} />
            <View style={styles.profileMetaInfo}>
              <Shimmer width={150} height={18} borderRadius={4} style={{ marginBottom: 6 }} />
              <Shimmer width={120} height={14} borderRadius={4} />
            </View>
            <Shimmer width={40} height={40} borderRadius={20} />
          </View>
        </View>

        <View style={styles.card}>
          <Shimmer width={180} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
          <Shimmer width={progressWidth} height={8} borderRadius={4} style={{ marginBottom: 10 }} />
          <Shimmer width={textWidth} height={16} borderRadius={4} />
        </View>

        <View style={styles.card}>
          <Shimmer width={140} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
          {[1, 2, 3, 4, 5].map((_, i) => (
            <View key={i} style={[styles.detailRow, i === 4 && { borderBottomWidth: 0 }]}>
              <Shimmer width={100} height={16} borderRadius={4} />
              <Shimmer width={120} height={16} borderRadius={4} />
            </View>
          ))}
        </View>

        <View style={styles.menuCardGroup}>
          {[1, 2].map((_, i) => (
            <View key={i} style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <Shimmer width={20} height={20} borderRadius={4} />
                <Shimmer width={120} height={16} borderRadius={4} style={{ marginLeft: 12 }} />
              </View>
              <Shimmer width={20} height={20} borderRadius={4} />
            </View>
          ))}
        </View>

        <View style={styles.menuCardGroup}>
          {[1, 2, 3, 4, 5].map((_, i) => (
            <View key={i} style={[styles.menuRow, i === 4 && { borderBottomWidth: 0 }]}>
              <View style={styles.menuLeft}>
                <Shimmer width={20} height={20} borderRadius={4} />
                <Shimmer width={140} height={16} borderRadius={4} style={{ marginLeft: 12 }} />
              </View>
              <Shimmer width={20} height={20} borderRadius={4} />
            </View>
          ))}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={Colors.primaryGradientStart || "#A00014"}
        barStyle="light-content"
      />

      {/* HEADER BANNER */}
      <LinearGradient
        colors={[
          Colors.primaryGradientStart || "#A00014",
          Colors.primaryGradientEnd || "#4A000A",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBanner}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.cardBackground} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My profile</Text>
            <Text style={styles.headerSubtitle}>
              {profileDetails?.profile_id ||
                dashboardData?.profile_details?.profile_id ||
                "—"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderShimmer()}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* PROFILE SUMMARY CARD */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.profileHeaderRow}
              onPress={() => navigation.navigate("MyProfile")}
              activeOpacity={0.8}
            >
              <View style={styles.avatarRing}>
                <TopAlignedImage
                  uri={
                    Array.isArray(dashboardData?.profile_details?.profile_image)
                      ? dashboardData?.profile_details?.profile_image[0]
                      : dashboardData?.profile_details?.profile_image
                  }
                  width={68}
                  height={68}
                />
              </View>

              <View style={styles.profileMetaInfo}>
                <Text style={styles.profileNameText} numberOfLines={1}>
                  {profileDetails?.personal_profile_name ||
                    dashboardData?.profile_details?.profile_name ||
                    "—"}
                </Text>
                <Text style={styles.membershipSubText}>
                  {profileDetails?.package_name || "Member"}{" "}
                  {profileDetails?.valid_upto
                    ? `· Valid till ${profileDetails.valid_upto}`
                    : ""}
                </Text>
              </View>

              <TouchableOpacity onPress={handleShare} style={styles.editIconCircle}>
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color={Colors.primary || "#A00014"}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* PROFILE COMPLETENESS CARD */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("ProfileCompletionForm")}
            activeOpacity={0.8}
          >
            <Text style={styles.cardSectionHeader}>Profile completeness</Text>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(completionValue, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.completenessSubtext}>
              {completionValue}% complete —{" "}
              {completionValue < 100
                ? "add more details to reach 100%."
                : "your profile is fully complete!"}
            </Text>
          </TouchableOpacity>

          {/* BASIC DETAILS CARD */}
          <View style={styles.card}>
            <Text style={styles.cardSectionHeader}>Basic details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of birth</Text>
              <Text style={styles.detailValue}>
                {profileDetails?.personal_profile_dob || "—"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time of birth</Text>
              <Text style={styles.detailValue}>
                {profileDetails?.personal_time_of_birth || "—"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Place of birth</Text>
              <Text style={styles.detailValue}>
                {profileDetails?.personal_place_of_birth || "—"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gothram</Text>
              <Text style={styles.detailValue}>
                {profileDetails?.gothram || "—"}
              </Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Star / Rasi</Text>
              <Text style={styles.detailValue}>
                {[profileDetails?.star, profileDetails?.rasi]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </Text>
            </View>
          </View>

          {/* ── MY ACCOUNT GROUP ─────────────────────────────────────────── */}
          <SectionHeader title="MY ACCOUNT" />
          <View style={styles.menuCardGroup}>
            <MenuRowItem
              icon={<Ionicons name="grid-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="My Dashboard"
              onPress={() => navigation.navigate("DashBoard")}
            />

            {!isPlan16 && (
              <MenuRowItem
                icon={<MaterialCommunityIcons name="crown-outline" size={22} color={Colors.primary || "#A00014"} />}
                label={`Membership & Plans (${buttonText})`}
                onPress={handleUpgradeClick}
              />
            )}

            <MenuRowItem
              icon={<MaterialCommunityIcons name="bookmark-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="Wishlist"
              onPress={() => navigation.navigate("DashBoardWishlist")}
            />

            <MenuRowItem
              icon={<Ionicons name="settings-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="Other Settings"
              onPress={() => navigation.navigate("OtherSettings")}
              isLast
            />
          </View>

          {/* ── VYSYAMA GROUP ─────────────────────────────────────────────── */}
          <SectionHeader title="VYSYAMALA" />
          <View style={styles.menuCardGroup}>
            <MenuRowItem
              icon={<FontAwesome6 name="heart" size={18} color={Colors.primary || "#A00014"} />}
              label="Santhosha Pendlilu"
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  url: "https://vysyamala.com/HappyStoriesMobile",
                  title: "Santhosha Pendlilu",
                })
              }
            />

            <MenuRowItem
              icon={<Ionicons name="trophy-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="Awards"
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  url: "https://vysyamala.com/AwardsMobile",
                  title: "Awards",
                })
              }
              isLast
            />
          </View>

          {/* ── HELP & INFORMATION GROUP ──────────────────────────────────── */}
          <SectionHeader title="HELP & INFORMATION" />
          <View style={styles.menuCardGroup}>
            <MenuRowItem
              icon={<Ionicons name="help-circle-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="Help & Support"
              onPress={() => navigation.navigate("HelpSupport")}
            />

            <MenuRowItem
              icon={<Ionicons name="information-circle-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="About Us"
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  url: "https://vysyamala.com/AboutUsMobile",
                  title: "About Us",
                })
              }
            />

            <MenuRowItem
              icon={<Ionicons name="document-text-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="Terms & Conditions"
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  url: "https://www.vysyamala.com/TermsandConditions",
                  title: "Terms & Conditions",
                })
              }
              isLast
            />
          </View>

          {/* ── SAFETY & PRIVACY GROUP ────────────────────────────────────── */}
          <SectionHeader title="SAFETY & PRIVACY" />
          <View style={styles.menuCardGroup}>
            <MenuRowItem
              icon={<Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="Privacy Policy"
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  url: "https://www.vysyamala.com/PrivacyPolicy",
                  title: "Privacy Policy",
                })
              }
            />

            <MenuRowItem
              icon={<MaterialCommunityIcons name="shield-account-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="Child Safety"
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  url: "https://www.vysyamala.com/ChildSafety",
                  title: "Child Safety",
                })
              }
            />

            <MenuRowItem
              icon={<MaterialCommunityIcons name="account-group-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="Community Guidelines"
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  url: "https://www.vysyamala.com/CommunityGuidelines",
                  title: "Community Guidelines",
                })
              }
            />

            <MenuRowItem
              icon={<MaterialCommunityIcons name="account-remove-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="Account Deletion Policy"
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  url: "https://www.vysyamala.com/AccountDeletionPolicy",
                  title: "Account Deletion Policy",
                })
              }
              isLast
            />
          </View>

          {/* ── ACCOUNT GROUP ─────────────────────────────────────────────── */}
          <SectionHeader title="ACCOUNT" />
          <View style={styles.menuCardGroup}>
            <MenuRowItem
              icon={<Ionicons name="log-out-outline" size={20} color={Colors.primary || "#A00014"} />}
              label="Log Out"
              onPress={handleLogout}
              isLast
            />
          </View>
        </ScrollView>
      )}

      {/* SHARE MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Profile</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={Colors.textDark || "#1E1E1E"}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalOptionBtn}
              onPress={() => handleWhatsAppShareWithImage(true)}
            >
              <Ionicons
                name="image-outline"
                size={22}
                color={Colors.primary || "#A00014"}
              />
              <Text style={styles.modalOptionText}>Share with Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOptionBtn}
              onPress={() => handleWhatsAppShareWithImage(false)}
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={Colors.primary || "#A00014"}
              />
              <Text
                style={styles.modalOptionText}
                onPress={() => handleWhatsAppShareWithoutImage(false)}
              >
                Share without Image
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.selectedBg || "#F5F0EB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBanner: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 10 : 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
    marginRight: 8,
  },
  headerIconBtnPressed: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },

  // ── SECTION HEADER ────────────────────────────────────────────────────────
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted || "#71717A",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },

  // CARD BASE
  card: {
    backgroundColor: Colors.cardBackground || "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // PROFILE HEADER
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.gold || "#E2B13C",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  profileMetaInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileNameText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textDark || "#1E1E1E",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  membershipSubText: {
    fontSize: 12.5,
    color: Colors.textMuted || "#71717A",
    marginTop: 4,
  },
  editIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.iconContainerBg || "#FFDBD6",
    justifyContent: "center",
    alignItems: "center",
  },

  // COMPLETENESS
  cardSectionHeader: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textDark || "#1E1E1E",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.chipInactiveBg || "#F4F4F5",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.gold || "#E2B13C",
    borderRadius: 4,
  },
  completenessSubtext: {
    fontSize: 12.5,
    color: Colors.textMuted || "#71717A",
    lineHeight: 18,
  },

  // BASIC DETAILS
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#F0E8E0",
  },
  detailLabel: {
    fontSize: 13.5,
    color: Colors.textMuted || "#71717A",
    flex: 1,
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: "600",
    color: Colors.textDark || "#1E1E1E",
    textAlign: "right",
    flex: 1.2,
  },

  // MENU GROUPS
  menuCardGroup: {
    backgroundColor: Colors.cardBackground || "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#F0E8E0",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuLabelText: {
    fontSize: 14.5,
    fontWeight: "600",
    color: Colors.textDark || "#1E1E1E",
    marginLeft: 12,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "85%",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textDark || "#1E1E1E",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  modalOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border || "#E4E4E7",
    borderRadius: 14,
    marginVertical: 6,
    width: "100%",
  },
  modalOptionText: {
    fontSize: 15,
    color: Colors.textDark || "#1E1E1E",
    fontWeight: "500",
    marginLeft: 12,
  },
});