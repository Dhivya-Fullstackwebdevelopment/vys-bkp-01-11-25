import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import config from "../API/Apiurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Colors, rs } from "../Reusable/Theme";

// ── Shimmer Placeholder ────────────────────────────────────────────────────
const ShimmerCard = () => {
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
    <Animated.View style={[styles.shimmerCard, { opacity }]}>
      <View style={styles.shimmerHeader}>
        <View style={styles.shimmerTitle} />
        <View style={styles.shimmerPrice} />
      </View>
      <View style={styles.shimmerLine} />
      <View style={styles.shimmerLine} />
      <View style={styles.shimmerLineShort} />
      <View style={styles.shimmerButton} />
    </Animated.View>
  );
};

export const MembershipPlan = ({ navigation, route }) => {
  const [plans, setPlans] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState({
    id: null,
    price: null,
    name: null,
  });
  console.log("selectedPlan", selectedPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(
    route.params?.fromLogin || false
  );

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoadingPlans(true);
        const profile_id = await AsyncStorage.getItem("profile_id_new");
        const formData = new FormData();
        formData.append("profile_id", profile_id);
        console.log("mem profile check ====>", JSON.stringify(formData));
        const response = await axios.post(
          `${config.apiUrl}/auth/Get_palns/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        if (response.data.Status === 1) {
          setPlans(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching plans", error);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const handleCardPress = async (index, planId, planPrice, planName) => {
    setSelectedCard(index);
    setSelectedPlan({ id: planId, price: planPrice, name: planName });
    try {
      await AsyncStorage.setItem("selectedPlanId", planId.toString());
      await AsyncStorage.setItem("selectedPlanPrice", planPrice.toString());
      await AsyncStorage.setItem("selectedPlanName", planName);
    } catch (error) {
      console.error("Error saving data to AsyncStorage", error);
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        setIsLoggedIn(!!token);
      } catch (error) {
        console.error("Error checking login status", error);
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  }, []);

  const handleSkipPress = async () => {
    if (isLoggedIn) {
      navigation.navigate("ThankYouReg");
    } else {
      setIsLoading(true);
      try {
        const profile_id = await AsyncStorage.getItem("profile_id_new");
        await axios.post(
          `${config.apiUrl}/auth/Free_packages/`,
          { profile_id: profile_id },
          { headers: { "Content-Type": "application/json" } }
        );
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Free packages updated successfully",
          position: "top",
          visibilityTime: 4000,
        });
        navigation.navigate("ThankYouReg");
      } catch (error) {
        console.error("Error calling Free Packages API", error);
        navigation.navigate("ThankYouReg");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Gradient Header ──────────────────────────────────────────────── */}
      <LinearGradient
        colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBanner}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textLight} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Membership Plan</Text>
          <Text style={styles.headerSubtitle}>
            Choose the plan that suits you best
          </Text>
        </View>
      </LinearGradient>

      {/* ── Intro text + skip ────────────────────────────────────────────── */}
      <View style={styles.introContainer}>
        <Text style={styles.planText}>
          Upgrade your plan as per your customized requirements. With a paid
          membership you can seamlessly connect with prospects and get more
          responses.
        </Text>

        <TouchableOpacity
          style={styles.freePlanFlex}
          onPress={handleSkipPress}
          disabled={isLoading}
          activeOpacity={0.75}
        >
          <Text style={styles.freeplantext}>
            {isLoading ? "Processing..." : "Skip — Use Free Plan"}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Plan cards ───────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingPlans ? (
          <>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </>
        ) : (
          Object.keys(plans).map((planName, index) => {
            const isSelected = selectedCard === index;
            return (
              <View key={index} style={styles.cardWrapper}>
                <LinearGradient
                  colors={
                    isSelected
                      ? [Colors.primaryGradientStart, Colors.primary, Colors.primaryLight]
                      : [Colors.card, Colors.card]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.cardStyle,
                    isSelected && styles.cardStyleSelected,
                  ]}
                >
                  {/* Plan name + price row */}
                  <View style={styles.planRateFlex}>
                    <Text
                      style={[
                        styles.planName,
                        isSelected && styles.textOnSelected,
                      ]}
                    >
                      {planName}
                    </Text>
                    <Text
                      style={[
                        styles.rateRed,
                        isSelected && styles.textOnSelected,
                      ]}
                    >
                      ₹ {plans[planName][0].plan_price}
                      <Text
                        style={[
                          styles.renewalCycle,
                          isSelected && styles.textOnSelectedMuted,
                        ]}
                      >
                        /{plans[planName][0].plan_renewal_cycle}
                      </Text>
                    </Text>
                  </View>

                  {/* Divider */}
                  <View
                    style={[
                      styles.divider,
                      isSelected && styles.dividerSelected,
                    ]}
                  />

                  {/* Features */}
                  {plans[planName].map((feature, featureIndex) => (
                    <View key={featureIndex} style={styles.planInfoFlex}>
                      <Text
                        style={[
                          styles.planInfo,
                          isSelected && styles.textOnSelected,
                        ]}
                      >
                        {feature.feature_name}
                      </Text>
                      <FontAwesome6
                        name="check"
                        size={14}
                        color={isSelected ? Colors.textLight : Colors.success}
                        fontWeight="700"
                      />
                    </View>
                  ))}

                  {/* Choose Plan button */}
                  <TouchableOpacity
                    style={[
                      styles.choosePlanButton,
                      isSelected && styles.choosePlanButtonSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      handleCardPress(
                        index,
                        plans[planName][0].plan_id,
                        plans[planName][0].plan_price,
                        planName
                      );
                      navigation.navigate("PayNow", {
                        planId: plans[planName][0].plan_id,
                        planPrice: plans[planName][0].plan_price,
                        planName: planName,
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.choosePlanText,
                        isSelected && styles.choosePlanTextSelected,
                      ]}
                    >
                      Choose Plan
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            );
          })
        )}

        {/* ── Vysyamala Delight card ─────────────────────────────────────── */}
        {!isLoadingPlans && (
          <View style={styles.delightCard}>
            {/* Gold accent bar */}
            <View style={styles.delightAccentBar} />
            <View style={styles.delightContent}>
              <View style={styles.delightBadge}>
                <Text style={styles.delightBadgeText}>PREMIUM</Text>
              </View>
              <Text style={styles.delightTitle}>VYSYAMALA DELIGHT</Text>
              <Text style={styles.delightValidity}>Valid for 12 months</Text>

              {[
                "Special Matrimonial package for Rich and Affluent",
                "AI-based matching profile report for 10 matches",
                "Special attention from Founder",
                "AI-based matching report (10 matches) & support",
              ].map((text, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIconWrap}>
                    <FontAwesome name="check" size={11} color={Colors.card} />
                  </View>
                  <Text style={styles.featureText}>{text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.delightButton}
              activeOpacity={0.85}
              onPress={() => {
                Alert.alert(
                  "Thank You!",
                  "Thanks for choosing Vysyamala Delight, our premium customer support executive will contact you shortly.",
                  [{ text: "OK" }]
                );
              }}
            >
              <LinearGradient
                colors={[Colors.gold, "#c89428"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.delightButtonGradient}
              >
                <Text style={styles.delightButtonText}>Choose Plan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  headerBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: rs(12, 16, 20),
    paddingBottom: 24,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textLight,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: rs(12, 13, 14),
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },

  // ── Intro section ────────────────────────────────────────────────────────
  introContainer: {
    paddingHorizontal: rs(16, 20, 24),
    paddingTop: rs(14, 18, 20),
    paddingBottom: rs(10, 12, 14),
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  planText: {
    color: Colors.textMuted,
    fontSize: rs(13, 14, 14),
    lineHeight: 20,
    marginBottom: rs(10, 12, 14),
  },
  freePlanFlex: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
  },
  freeplantext: {
    color: Colors.primary,
    fontSize: rs(14, 15, 16),
    fontWeight: "600",
  },

  // ── Scroll content ───────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: rs(16, 20, 20),
    paddingTop: rs(16, 20, 24),
    paddingBottom: 40,
  },

  // ── Plan card ────────────────────────────────────────────────────────────
  cardWrapper: {
    marginBottom: rs(14, 18, 20),
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardStyle: {
    paddingHorizontal: rs(16, 18, 20),
    paddingVertical: rs(18, 20, 22),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardStyleSelected: {
    borderColor: Colors.primary,
  },
  planRateFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  planName: {
    color: Colors.textDark,
    fontSize: rs(18, 20, 22),
    fontWeight: "700",
    flex: 1,
  },
  rateRed: {
    color: Colors.primary,
    fontSize: rs(18, 20, 22),
    fontWeight: "700",
  },
  renewalCycle: {
    color: Colors.textMuted,
    fontSize: rs(12, 13, 14),
    fontWeight: "400",
  },
  textOnSelected: {
    color: Colors.textLight,
  },
  textOnSelectedMuted: {
    color: "rgba(255,255,255,0.75)",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: rs(12, 14, 16),
  },
  dividerSelected: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  planInfoFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: rs(8, 10, 10),
  },
  planInfo: {
    color: Colors.textMuted,
    fontSize: rs(13, 14, 14),
    fontWeight: "500",
    width: "85%",
    lineHeight: 20,
  },
  choosePlanButton: {
    marginTop: rs(14, 16, 18),
    backgroundColor: Colors.primaryContainer,
    paddingVertical: rs(12, 13, 14),
    borderRadius: 26,
    alignItems: "center",
  },
  choosePlanButtonSelected: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.5,
    borderColor: Colors.textLight,
  },
  choosePlanText: {
    color: Colors.primary,
    fontSize: rs(14, 15, 16),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  choosePlanTextSelected: {
    color: Colors.textLight,
  },

  // ── Delight card ─────────────────────────────────────────────────────────
  delightCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: rs(14, 18, 20),
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  delightAccentBar: {
    height: 5,
    backgroundColor: Colors.gold,
  },
  delightContent: {
    padding: rs(16, 18, 20),
  },
  delightBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.goldContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  delightBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.accentForeground,
    letterSpacing: 0.8,
  },
  delightTitle: {
    fontSize: rs(18, 20, 22),
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  delightValidity: {
    fontSize: rs(13, 14, 14),
    color: Colors.textMuted,
    fontWeight: "600",
    marginBottom: rs(12, 14, 16),
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: rs(8, 10, 10),
  },
  featureIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: rs(13, 14, 14),
    color: Colors.textMuted,
    lineHeight: 20,
  },
  delightButton: {
    margin: rs(12, 14, 16),
    marginTop: 0,
    borderRadius: 26,
    overflow: "hidden",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  delightButtonGradient: {
    paddingVertical: rs(12, 13, 14),
    alignItems: "center",
    borderRadius: 26,
  },
  delightButtonText: {
    color: Colors.card,
    fontSize: rs(14, 15, 16),
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Shimmer ───────────────────────────────────────────────────────────────
  shimmerCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: rs(14, 16, 18),
    marginBottom: rs(14, 18, 20),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shimmerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  shimmerTitle: {
    width: 110,
    height: 22,
    backgroundColor: Colors.surface2,
    borderRadius: 6,
  },
  shimmerPrice: {
    width: 80,
    height: 22,
    backgroundColor: Colors.surface2,
    borderRadius: 6,
  },
  shimmerLine: {
    width: "100%",
    height: 16,
    backgroundColor: Colors.surface2,
    borderRadius: 6,
    marginBottom: 12,
  },
  shimmerLineShort: {
    width: "65%",
    height: 16,
    backgroundColor: Colors.surface2,
    borderRadius: 6,
    marginBottom: 20,
  },
  shimmerButton: {
    width: "100%",
    height: 45,
    backgroundColor: Colors.surface2,
    borderRadius: 26,
  },
});