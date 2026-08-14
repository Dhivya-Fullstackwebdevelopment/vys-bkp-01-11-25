import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import config from "../API/Apiurl";
import { createOrder, verifyPayment, savePlanPackage } from "../CommonApiCall/CommonApiCall";
import Toast from "react-native-toast-message";
import { Colors, rs } from "../Reusable/Theme";

// ── Shimmer Loader for Add-On Packages ────────────────────────────────────
const ShimmerPackageRow = () => {
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
    <Animated.View style={[styles.shimmerRowContainer, { opacity }]}>
      <View style={styles.shimmerCheckFlex}>
        <View style={styles.shimmerCheckbox} />
        <View style={{ flex: 1 }}>
          <View style={styles.shimmerTitleBar} />
          <View style={styles.shimmerSubtitleBar} />
        </View>
      </View>
      <View style={styles.shimmerPriceBar} />
    </Animated.View>
  );
};

export const PayNow = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isAddOnOnly = route.params?.isAddOnOnly || false;
  const isFromLogin = route.params?.isFromLogin || false;

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedState, setCheckedState] = useState({});
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlanName, setSelectedPlanName] = useState("");
  console.log("selectedPlanName", selectedPlanName);
  const [submitting, setSubmitting] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [gpayModalVisible, setGpayModalVisible] = useState(false);

  let RazorpayCheckout;
  try {
    RazorpayCheckout = require("react-native-razorpay").default;
  } catch (e) {
    RazorpayCheckout = null;
  }

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setSubmitting(true);
        const response = await axios.post(
          `${config.apiUrl}/auth/Get_addon_packages/`,
          {},
          { headers: { "Content-Type": "application/json" } }
        );
        setPackages(response.data.data);
        const autoCheckId = route.params?.autoCheckId;
        if (autoCheckId) {
          setCheckedState((prevState) => ({
            ...prevState,
            [autoCheckId]: true,
          }));
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
        setError(error.message);
      } finally {
        setSubmitting(false);
      }
    };
    fetchPackages();
  }, [route.params?.autoCheckId]);

  useEffect(() => {
    const getSelectedPlanDetails = async () => {
      try {
        const { planId: routePlanId, planPrice: routePlanPrice, planName: routePlanName } =
          route.params || {};
        if (routePlanId && routePlanPrice && routePlanName) {
          setSelectedPlanId(routePlanId.toString());
          setSelectedPlanPrice(parseFloat(routePlanPrice));
          setSelectedPlanName(routePlanName);
          await AsyncStorage.setItem("selectedPlanId", routePlanId.toString());
          await AsyncStorage.setItem("selectedPlanPrice", routePlanPrice.toString());
          await AsyncStorage.setItem("selectedPlanName", routePlanName);
        } else {
          const planId = await AsyncStorage.getItem("selectedPlanId");
          const planPrice = await AsyncStorage.getItem("selectedPlanPrice");
          const planName = await AsyncStorage.getItem("selectedPlanName");
          if (planId && planPrice && planName) {
            setSelectedPlanId(planId);
            setSelectedPlanPrice(parseFloat(planPrice));
            setSelectedPlanName(planName);
          }
        }
      } catch (error) {
        console.error("Error retrieving plan details", error);
      }
    };
    getSelectedPlanDetails();
  }, [route.params]);

  useEffect(() => {
    const getSelectedPlanName = async () => {
      try {
        const planName = await AsyncStorage.getItem("selectedPlanName");
        if (planName) setSelectedPlanName(planName);
      } catch (error) {
        console.error("Error retrieving selected plan name:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load selected plan details",
          position: "top",
        });
      }
    };
    getSelectedPlanName();
  }, []);

  const handleCheck = (id, price) => {
    setCheckedState((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const getTotalPrice = () => {
    return packages.reduce((total, pkg) => {
      if (checkedState[pkg.package_id]) return total + pkg.amount;
      return total;
    }, 0);
  };

  useEffect(() => {
    const getSelectedPlanDetails = async () => {
      try {
        const planId = await AsyncStorage.getItem("selectedPlanId");
        const planPrice = await AsyncStorage.getItem("selectedPlanPrice");
        const planName = await AsyncStorage.getItem("selectedPlanName");
        if (planId !== null && planPrice !== null && planName !== null) {
          setSelectedPlanId(planId);
          setSelectedPlanPrice(parseFloat(planPrice));
          setSelectedPlanName(planName);
        }
      } catch (error) {
        console.error("Error retrieving data from AsyncStorage", error);
      }
    };
    getSelectedPlanDetails();
  }, []);

  const finalSelectedPlanPrice = isAddOnOnly ? 0 : selectedPlanPrice;
  const totalPriceNew = getTotalPrice() + finalSelectedPlanPrice;

  const handlePayNow = async () => {
    try {
      setIsPaymentLoading(true);
      const profileId = await AsyncStorage.getItem("profile_id_new");
      const selectedAddons = Object.keys(checkedState).filter((pkgId) => checkedState[pkgId]);
      const packageids = selectedAddons.join(",");
      console.log("all params response ==>", totalPriceNew, profileId, isAddOnOnly ? 0 : selectedPlanId, packageids);
      const orderResponse = await createOrder(totalPriceNew, profileId, isAddOnOnly ? 0 : selectedPlanId, packageids);
      console.log("order response ==>", JSON.stringify(orderResponse));
      if (orderResponse && orderResponse.order && orderResponse.order.id) {
        const order_id = orderResponse.order.id;
        console.log("order_id ==>", order_id);
        await handleRazorpay(totalPriceNew, order_id);
      } else {
        Toast.show({ type: "error", text1: "Error", text2: "Failed to create order. Please try again." });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || "Failed to create order. Please try again." });
      throw error;
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleRazorpay = async (totalPriceNew, order_id) => {
    console.log("Opening Razorpay with amount:", totalPriceNew, "Order ID:", order_id);
    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== "function") {
      setIsPaymentLoading(false);
      Toast.show({ type: "error", text1: "Payment Error", text2: "Razorpay is not available. Please use a development build (not Expo Go)." });
      return;
    }
    try {
      const options = {
        description: "Purchase Credits",
        image: "https://vysyamat.blob.core.windows.net/vysyamala/VysyamalaLogo-i_e8O9Ou.png",
        currency: "INR",
        key: "rzp_live_HYCeDsho3jhHRt",
        amount: Math.round(totalPriceNew * 100),
        order_id: order_id,
        name: "Vysyamala",
        prefill: { name: "User", email: "user@example.com", contact: "1234567890" },
        notes: { address: "Razorpay Corporate Office" },
        theme: { color: Colors.primary },
      };
      console.log("Razorpay options:", JSON.stringify(options));
      const data = await RazorpayCheckout.open(options);
      console.log("Payment success:", data);
      await placePaymentRazorpay(data);
    } catch (error) {
      console.error("Razorpay error:", error);
      setIsPaymentLoading(false);
      const errorCode = error?.code;
      const errorDescription = error?.description || "Something went wrong. Please try again.";
      if (errorCode === 0) {
        Toast.show({ type: "info", text1: "Payment Cancelled", text2: "You have cancelled the payment." });
        Alert.alert("Payment Incomplete", "It looks like your payment was not completed. Please retry, or share your transaction screenshot with us on WhatsApp 9944851550 for assistance.", [{ text: "OK" }]);
      } else if (errorCode === 2) {
        Toast.show({ type: "error", text1: "Network Error", text2: "Please check your internet connection and try again." });
      } else {
        Toast.show({ type: "error", text1: "Payment Failed", text2: errorDescription });
        Alert.alert("Payment Incomplete", "It looks like your payment was not completed. Please retry, or share your transaction screenshot with us on WhatsApp 9944851550 for assistance.", [{ text: "OK" }]);
      }
    }
  };

  const placePaymentRazorpay = async (data) => {
    try {
      setIsPaymentLoading(true);
      const profileId =
        (await AsyncStorage.getItem("loginuser_profileId")) ||
        (await AsyncStorage.getItem("profile_id_new"));
      console.log("========== PAYMENT VERIFY ==========");
      console.log("Profile ID:", profileId);
      console.log("Order ID:", data?.razorpay_order_id);
      console.log("Payment ID:", data?.razorpay_payment_id);
      console.log("Signature:", data?.razorpay_signature);
      const verifyResponse = await verifyPayment(profileId, data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature);
      console.log("Verify Payment Response:", JSON.stringify(verifyResponse, null, 2));
      if (verifyResponse && (verifyResponse.status === "success" || verifyResponse.Status === 1)) {
        Toast.show({ type: "success", text1: "Payment Success", text2: "Payment verified successfully", position: "top" });
        await handleSavePlanPackage();
      } else {
        console.log("Verification Failed Response:", verifyResponse);
        Toast.show({ type: "error", text1: "Verification Failed", text2: verifyResponse?.message || "Payment verification failed" });
      }
    } catch (error) {
      console.log("VERIFY PAYMENT ERROR:", error?.response?.data || error?.message || error);
      Toast.show({ type: "error", text1: "Payment Verification Error", text2: error?.response?.data?.message || error?.message || "Something went wrong" });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleSavePlanPackage = async () => {
    try {
      setIsPaymentLoading(true);
      const profileId = await AsyncStorage.getItem("profile_id_new");
      const selectedAddons = Object.keys(checkedState).filter((pkgId) => checkedState[pkgId]);
      const result = await savePlanPackage(profileId, isAddOnOnly ? 0 : selectedPlanId, selectedAddons, totalPriceNew);
      if (result.success) {
        navigation.navigate("ThankYouReg");
      } else {
        Toast.show({ type: "error", text1: "Error", text2: result.message });
      }
    } catch (error) {
      console.error("Error saving plan package:", error);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to save plan package. Please try again." });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const LoadingOverlay = () => {
    if (!isPaymentLoading) return null;
    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Please wait...</Text>
        </View>
      </View>
    );
  };

  const handleGPaySave = async () => {
    try {
      setIsPaymentLoading(true);
      const profileId = await AsyncStorage.getItem("profile_id_new");
      const selectedAddons = Object.keys(checkedState).filter((pkgId) => checkedState[pkgId]);
      console.log("=== GPay Save Debug Info ===");
      console.log("profileId:", profileId);
      console.log("selectedPlanId:", selectedPlanId);
      console.log("selectedAddons:", selectedAddons);
      console.log("totalPriceNew:", totalPriceNew);
      console.log("gpay_online:", 1);
      console.log("=============================");
      const result = await savePlanPackage(profileId, isAddOnOnly ? 0 : selectedPlanId, selectedAddons, totalPriceNew, 1);
      console.log("Save plan package result:", result);
      if (result.success) {
        Alert.alert(
          "Thank You",
          "Thank you for choosing Vysyamala for your soulmate search. Our customer support team will connect with you shortly. In the meantime, please share your payment screenshot via WhatsApp at 9944851550.",
          [{
            text: "OK",
            onPress: () => {
              Toast.show({ type: "success", text1: "Plans and Packages updated successfully", position: "top", visibilityTime: 2000 });
              setTimeout(() => { navigation.reset({ index: 0, routes: [{ name: "HomeWithToast" }] }); }, 1000);
            },
          }]
        );
      } else {
        Toast.show({ type: "error", text1: "Error", text2: result.message });
      }
    } catch (error) {
      console.error("Error in handleGPaySave:", error);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to save plan package. Please try again." });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleGpaySubmit = () => {
    setGpayModalVisible(false);
    handleGPaySave();
  };

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Gradient Header ──────────────────────────────────────────── */}
        <LinearGradient
          colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.headerBanner}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textLight} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Payment</Text>
            <Text style={styles.headerSubtitle}>Review your plan & complete payment</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Selected Plan card ───────────────────────────────────── */}
          {!isAddOnOnly && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Selected Plan</Text>
              <View style={styles.planRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{selectedPlanName}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("MembershipPlan")}>
                    <Text style={styles.changePlan}>Change Plan</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>₹{selectedPlanPrice.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Add-On Packages card ─────────────────────────────────── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Add-On Packages</Text>

            {submitting ? (
              <>
                <ShimmerPackageRow />
                <ShimmerPackageRow />
                <ShimmerPackageRow />
              </>
            ) : (
              packages.map((pkg) => (
                <View key={pkg.package_id} style={styles.addonRow}>
                  <View style={styles.checkFlex}>
                    <Pressable
                      style={[
                        styles.checkboxBase,
                        checkedState[pkg.package_id] && styles.checkboxChecked,
                      ]}
                      onPress={() => handleCheck(pkg.package_id, pkg.amount)}
                    >
                      {checkedState[pkg.package_id] && (
                        <Ionicons name="checkmark" size={13} color={Colors.textLight} />
                      )}
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text
                        onPress={() => handleCheck(pkg.package_id, pkg.amount)}
                        style={styles.planAddOn}
                      >
                        {pkg.name}
                      </Text>
                      <Text style={styles.members}>{pkg.description}</Text>
                    </View>
                  </View>
                  <Text style={styles.addonPrice}>₹{pkg.amount}.00</Text>
                </View>
              ))
            )}
          </View>

          {/* ── Total card ───────────────────────────────────────────── */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{totalPriceNew.toFixed(2)}</Text>
          </View>

          {/* ── Payment buttons ──────────────────────────────────────── */}
          <View style={styles.paymentButtonsContainer}>
            <TouchableOpacity
              style={styles.btn}
              onPress={handlePayNow}
              disabled={isPaymentLoading || submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primaryGradientStart, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linearGradient}
              >
                <View style={styles.loginContainer}>
                  {isPaymentLoading ? (
                    <ActivityIndicator color={Colors.textLight} size="small" />
                  ) : (
                    <>
                      <Ionicons name="card-outline" size={18} color={Colors.textLight} style={{ marginRight: 6 }} />
                      <Text style={styles.login}>Online Payment</Text>
                    </>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => setGpayModalVisible(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primaryGradientStart, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linearGradient}
              >
                <View style={styles.loginContainer}>
                  <Ionicons name="logo-google" size={16} color={Colors.textLight} style={{ marginRight: 6 }} />
                  <Text style={styles.login}>GPay</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ── GPay Modal ───────────────────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={gpayModalVisible}
        onRequestClose={() => setGpayModalVisible(!gpayModalVisible)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setGpayModalVisible(false)}
            >
              <Ionicons name="close-circle" size={30} color={Colors.primary} />
            </TouchableOpacity>
            <Image
              source={require("../assets/img/gpay.png")}
              style={styles.gpayModalImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.submitGpayButton}
              onPress={handleGpaySubmit}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primaryGradientStart, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linearGradient}
              >
                <Text style={styles.login}>Submit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <LoadingOverlay />
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────
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

  // ── Scroll ───────────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: rs(16, 18, 20),
    paddingTop: rs(16, 18, 20),
    paddingBottom: 40,
  },

  // ── Section card ─────────────────────────────────────────────────────────
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: rs(16, 18, 20),
    marginBottom: rs(14, 16, 18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: rs(12, 14, 16),
  },

  // ── Selected plan row ─────────────────────────────────────────────────────
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planName: {
    color: Colors.textDark,
    fontSize: rs(18, 20, 22),
    fontWeight: "700",
    marginBottom: 6,
  },
  changePlan: {
    color: Colors.primary,
    fontSize: rs(13, 14, 14),
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  priceBadge: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 12,
  },
  priceBadgeText: {
    color: Colors.primary,
    fontSize: rs(15, 16, 17),
    fontWeight: "700",
  },

  // ── Add-on rows ───────────────────────────────────────────────────────────
  addonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: rs(8, 10, 10),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkFlex: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 10,
  },
  planAddOn: {
    color: Colors.textDark,
    fontSize: rs(14, 15, 15),
    fontWeight: "700",
    marginBottom: 3,
  },
  members: {
    color: Colors.textMuted,
    fontSize: rs(11, 12, 12),
    fontWeight: "400",
    lineHeight: 16,
  },
  addonPrice: {
    color: Colors.textMuted,
    fontSize: rs(13, 14, 14),
    fontWeight: "600",
    marginTop: 2,
  },
  checkboxBase: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: "transparent",
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // ── Total card ────────────────────────────────────────────────────────────
  totalCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 16,
    paddingHorizontal: rs(16, 18, 20),
    paddingVertical: rs(14, 16, 18),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: rs(14, 16, 18),
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  totalLabel: {
    color: Colors.onPrimaryContainer,
    fontSize: rs(14, 15, 15),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  totalAmount: {
    color: Colors.primary,
    fontSize: rs(20, 22, 24),
    fontWeight: "700",
  },

  // ── Payment buttons ───────────────────────────────────────────────────────
  paymentButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  linearGradient: {
    borderRadius: 14,
    justifyContent: "center",
    paddingVertical: rs(13, 14, 15),
    paddingHorizontal: 12,
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  login: {
    textAlign: "center",
    color: Colors.textLight,
    fontWeight: "700",
    fontSize: rs(14, 15, 16),
    letterSpacing: 0.3,
  },

  // ── Loading overlay ───────────────────────────────────────────────────────
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingContainer: {
    backgroundColor: Colors.card,
    padding: rs(20, 22, 24),
    borderRadius: 16,
    alignItems: "center",
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textDark,
    fontSize: rs(14, 15, 16),
    fontWeight: "500",
  },

  // ── GPay Modal ────────────────────────────────────────────────────────────
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: rs(28, 32, 35),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    position: "relative",
    width: "85%",
  },
  gpayModalImage: {
    width: 220,
    height: 220,
    marginBottom: rs(16, 18, 20),
  },
  submitGpayButton: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },

  // ── Shimmer ───────────────────────────────────────────────────────────────
  shimmerRowContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: rs(8, 10, 10),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  shimmerCheckFlex: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  shimmerCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: Colors.surface2,
    marginRight: 10,
    marginTop: 2,
  },
  shimmerTitleBar: {
    width: "60%",
    height: 15,
    backgroundColor: Colors.surface2,
    borderRadius: 6,
    marginBottom: 6,
  },
  shimmerSubtitleBar: {
    width: "80%",
    height: 11,
    backgroundColor: Colors.surface2,
    borderRadius: 6,
  },
  shimmerPriceBar: {
    width: 55,
    height: 15,
    backgroundColor: Colors.surface2,
    borderRadius: 6,
    marginLeft: 10,
  },
});