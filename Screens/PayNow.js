import React, { useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import config from "../API/Apiurl";
import { createOrder, verifyPayment, savePlanPackage } from "../CommonApiCall/CommonApiCall";
import RazorpayCheckout from "react-native-razorpay";
import Toast from "react-native-toast-message";

export const PayNow = () => {
  const navigation = useNavigation();
  const route = useRoute(); // Get the route object
  const isAddOnOnly = route.params?.isAddOnOnly || false;
  const isFromLogin = route.params?.isFromLogin || false; // NEW FLAG

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedState, setCheckedState] = useState({});
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlanName, setSelectedPlanName] = useState("");
  console.log("selectedPlanName", selectedPlanName)
  const [submitting, setSubmitting] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [gpayModalVisible, setGpayModalVisible] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setSubmitting(true);

        const response = await axios.post(
          `${config.apiUrl}/auth/Get_addon_packages/`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        setPackages(response.data.data);
      } catch (error) {
        console.error("Error fetching packages:", error);
        setError(error.message);
      } finally {
        setSubmitting(false);
      }
    };

    fetchPackages();
  }, []);

  // useEffect(() => {
  //   const getSelectedPlanDetails = async () => {
  //     try {
  //       const planId = await AsyncStorage.getItem("selectedPlanId");
  //       const planPrice = await AsyncStorage.getItem("selectedPlanPrice");
  //       const planName = await AsyncStorage.getItem("selectedPlanName");

  //       if (planId !== null && planPrice !== null) {
  //         setSelectedPlanId(planId);
  //         setSelectedPlanPrice(parseFloat(planPrice));
  //         setSelectedPlanName(planName);
  //       }
  //     } catch (error) {
  //       console.error("Error retrieving data from AsyncStorage", error);
  //     }
  //   };

  //   getSelectedPlanDetails();
  // }, []);

  useEffect(() => {
    const getSelectedPlanDetails = async () => {
      try {
        // First check if we have route params (these are most recent)
        const { planId: routePlanId, planPrice: routePlanPrice, planName: routePlanName } = route.params || {};

        if (routePlanId && routePlanPrice && routePlanName) {
          // Use route params if available
          setSelectedPlanId(routePlanId.toString());
          setSelectedPlanPrice(parseFloat(routePlanPrice));
          setSelectedPlanName(routePlanName);

          // Also update AsyncStorage for consistency
          await AsyncStorage.setItem("selectedPlanId", routePlanId.toString());
          await AsyncStorage.setItem("selectedPlanPrice", routePlanPrice.toString());
          await AsyncStorage.setItem("selectedPlanName", routePlanName);
        } else {
          // Fall back to AsyncStorage
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

  // Add this with the other useEffect hooks
  useEffect(() => {
    const getSelectedPlanName = async () => {
      try {
        const planName = await AsyncStorage.getItem("selectedPlanName");
        if (planName) {
          setSelectedPlanName(planName);
        }
      } catch (error) {
        console.error("Error retrieving selected plan name:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load selected plan details",
          position: "bottom",
        });
      }
    };

    getSelectedPlanName();
  }, []);

  const handleCheck = (id, price) => {
    setCheckedState((prevState) => {
      const newState = { ...prevState, [id]: !prevState[id] };
      return newState;
    });
  };


  const getTotalPrice = () => {
    return packages.reduce((total, pkg) => {
      if (checkedState[pkg.package_id]) {
        return total + pkg.amount;
      }
      return total;
    }, 0);
  };

  useEffect(() => {
    const getSelectedPlanDetails = async () => {
      try {
        const planId = await AsyncStorage.getItem("selectedPlanId");
        const planPrice = await AsyncStorage.getItem("selectedPlanPrice");
        const planName = await AsyncStorage.getItem("selectedPlanName"); // 💡 Get the name

        if (planId !== null && planPrice !== null && planName !== null) {
          setSelectedPlanId(planId);
          setSelectedPlanPrice(parseFloat(planPrice));
          setSelectedPlanName(planName); // 💡 Set the name state
        }
      } catch (error) {
        console.error("Error retrieving data from AsyncStorage", error);
      }
    };
    getSelectedPlanDetails();
  }, []);
  const finalSelectedPlanPrice = isAddOnOnly ? 0 : selectedPlanPrice;

  // const totalPrice = getTotalPrice();
  // const totalPriceNew = totalPrice + selectedPlanPrice;
  // const totalPriceNew = totalPrice + finalSelectedPlanPrice; // Use the conditional price
  const totalPriceNew = getTotalPrice() + finalSelectedPlanPrice;

  const handlePayNow = async () => {
    // if (totalPriceNew === 0) {
    //   Toast.show({
    //     type: "error",
    //     text1: "Selection Required",
    //     text2: "Please select at least one add-on package",
    //     position: "bottom",
    //     visibilityTime: 3000,
    //   });
    //   return;
    // }

    try {
      setIsPaymentLoading(true);
      const profileId = await AsyncStorage.getItem("profile_id_new");
      const selectedAddons = Object.keys(checkedState).filter(
        (pkgId) => checkedState[pkgId]
      );
      // const amountInPaise = 1;

      const packageids = selectedAddons.join(",");
      console.log(
        "all params response ==>",
        // amountInPaise,
        totalPriceNew,
        profileId,
        isAddOnOnly ? 0 : selectedPlanId,
        packageids
      );
      const orderResponse = await createOrder(
        // amountInPaise,
        totalPriceNew,
        profileId,
        isAddOnOnly ? 0 : selectedPlanId,
        packageids
      );
      console.log("order response ==>", JSON.stringify(orderResponse));
      if (orderResponse && orderResponse.order && orderResponse.order.id) {
        const order_id = orderResponse.order.id;
        console.log("order_id ==>", order_id);
        await handleRazorpay(totalPriceNew, order_id);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to create order. Please try again.",
        });
      }
    } catch (error) {
      // console.error("Error creating order or opening Razorpay:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        // text2: "Failed to create order. Please try again.",
        text2: error.message || "Failed to create order. Please try again."
      });
      throw error;
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // const handleRazorpay = (totalPriceNew, order_id) => {
  //   console.log("order_id ==>", totalPriceNew, order_id);
  //   var options = {
  //     description: "Purchase Credits",
  //     image: 'https://vysyamaladev2025.blob.core.windows.net/vysyamala/VysyamalaLogo-i_e8O9Ou.png',
  //     currency: "INR",
  //     key: "rzp_live_HYCeDsho3jhHRt",
  //     amount: totalPriceNew * 100,
  //     order_id: order_id,
  //     name: "Vysyamala",
  //     prefill: {
  //       name: "User",
  //       email: "user@example.com",
  //       contact: "1234567890",
  //     },
  //     notes: {
  //       address: "Razorpay Corporate Office",
  //     },
  //     theme: {
  //       color: "#3399cc",
  //     },
  //   };
  //   RazorpayCheckout.open(options)
  //     .then((data) => {
  //       console.log("data razorpay ===> ", data);
  //       placePaymentRazorpay(data);
  //     })
  //     .catch((error) => {
  //       console.log("Failed method ===>",(error))
  //       Toast.show({
  //         type: "error",
  //         text1: "Error",
  //         text2: error,
  //       });
  //     });
  // };

  const handleRazorpay = async (totalPriceNew, order_id) => {
    console.log("Opening Razorpay with amount:", totalPriceNew, "Order ID:", order_id);

    // Check if RazorpayCheckout is available
    if (!RazorpayCheckout) {
      console.error("RazorpayCheckout is not available");
      setIsPaymentLoading(false);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Payment gateway not initialized. Please restart the app.",
      });
      return;
    }

    try {
      const options = {
        description: "Purchase Credits",
        image: 'https://vysyamaladev2025.blob.core.windows.net/vysyamala/VysyamalaLogo-i_e8O9Ou.png',
        currency: "INR",
        //key: "rzp_test_bR07kHwjYrmOHm", 
        key: "rzp_live_HYCeDsho3jhHRt", // Make sure this is your correct key
        amount: Math.round(totalPriceNew * 100), // Amount in paise
        order_id: order_id,
        name: "Vysyamala",
        prefill: {
          name: "User",
          email: "user@example.com",
          contact: "1234567890",
        },
        notes: {
          address: "Razorpay Corporate Office",
        },
        theme: {
          color: "#ED1E24",
        },
      };

      console.log("Razorpay options:", JSON.stringify(options));

      const data = await RazorpayCheckout.open(options);
      console.log("Payment success:", data);
      await placePaymentRazorpay(data);

    } catch (error) {
      console.error("Razorpay error:", error);
      setIsPaymentLoading(false);

      // Handle different error types
      if (error.code === 0) {
        // Payment cancelled by user
        Toast.show({
          type: "info",
          text1: "Payment Cancelled",
          text2: "You have cancelled the payment",
        });
        Alert.alert(
          "Payment Incompleted",
          "It looks like your payment was not completed. Please retry, or share your transaction screenshot with us on WhatsApp 9944851550 for assistance.",
          [{ text: "OK" }]
        );
      } else if (error.code === 2) {
        // Network error
        Toast.show({
          type: "error",
          text1: "Network Error",
          text2: "Please check your internet connection and try again",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Payment Failed",
          text2: error.description || "Something went wrong. Please try again.",
        });
        Alert.alert(
          "Payment Incompleted",
          "It looks like your payment was not completed. Please retry, or share your transaction screenshot with us on WhatsApp 9944851550 for assistance.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const placePaymentRazorpay = async (data) => {
    try {
      setIsPaymentLoading(true);
      const profileId = await AsyncStorage.getItem("loginuser_profileId");
      console.log(
        "placePaymentRazorpay razorpay ===> ",
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature
      );
      const verifyResponse = await verifyPayment(
        profileId,
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature
      );
      console.log("verifyResponse ==>", JSON.stringify(verifyResponse));
      if (verifyResponse.status === "success") {
        Toast.show({
          type: "success",
          text1: "Saved",
          text2: "Payment verified successfully!",
          position: "bottom",
        });
        await handleSavePlanPackage();
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Payment verification failed!",
        });
      }
    } catch (error) {
      console.error("Error during payment verification:", error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Error during payment verification. Please try again.",
      });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleSavePlanPackage = async () => {

    try {
      setIsPaymentLoading(true);
      const profileId = await AsyncStorage.getItem("profile_id_new");
      const selectedAddons = Object.keys(checkedState).filter(
        (pkgId) => checkedState[pkgId]
      );

      const result = await savePlanPackage(
        profileId,
        isAddOnOnly ? 0 : selectedPlanId,
        selectedAddons,
        totalPriceNew
      );

      if (result.success) {
        navigation.navigate("ThankYouReg");
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: result.message,
        });
      }
    } catch (error) {
      console.error("Error saving plan package:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save plan package. Please try again.",
      });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // Add loading overlay component
  const LoadingOverlay = () => {
    if (!isPaymentLoading) return null;

    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4050" />
          <Text style={styles.loadingText}>Please wait...</Text>
        </View>
      </View>
    );
  };

  // Add this new function inside your PayNow component
  const handleGPaySave = async () => {
    // if (totalPriceNew === 0) {
    //   Toast.show({
    //     type: "error",
    //     text1: "Selection Required",
    //     text2: "Please select at least one add-on package",
    //     position: "bottom",
    //     visibilityTime: 3000,
    //   });
    // }
    try {
      setIsPaymentLoading(true);
      const profileId = await AsyncStorage.getItem("profile_id_new");
      const selectedAddons = Object.keys(checkedState).filter(
        (pkgId) => checkedState[pkgId]
      );

      console.log("=== GPay Save Debug Info ===");
      console.log("profileId:", profileId);
      console.log("selectedPlanId:", selectedPlanId);
      console.log("selectedAddons:", selectedAddons);
      console.log("totalPriceNew:", totalPriceNew);
      console.log("gpay_online:", 1);
      console.log("=============================");

      // Pass gpay_online = 1 for GPay
      const result = await savePlanPackage(
        profileId,
        isAddOnOnly ? 0 : selectedPlanId,
        selectedAddons,
        totalPriceNew,
        1 // gpay_online parameter
      );

      console.log("Save plan package result:", result);


      if (result.success) {
        // Show success toast
        // Toast.show({
        //   type: "success",
        //   text1: "Plans and Packages updated successfully",
        //   position: "bottom",
        //   visibilityTime: 4000,
        // });

        // Show alert
        Alert.alert(
          "Thank You",
          "Thank you for choosing Vysyamala for your soulmate search. Our customer support team will connect with you shortly. In the meantime, please share your payment screenshot via WhatsApp at 9944851550.",
          [
            {
              text: "OK",
              // 2. This code runs ONLY AFTER the user presses OK
              //    and the alert is dismissed.
              onPress: () => {
                // 3. Now, show the success toast
                Toast.show({
                  type: "success",
                  text1: "Plans and Packages updated successfully",
                  position: "bottom",
                  visibilityTime: 2000,
                });

                // 4. Now, start the 5-second timer to navigate
                setTimeout(() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "HomeWithToast" }],
                  });
                }, 1000); // 5000 milliseconds = 5 seconds
              },
            },
          ]
        );

      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: result.message,
        });
      }
    } catch (error) {
      console.error("Error in handleGPaySave:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save plan package. Please try again.",
      });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // Replace your old handleGpaySubmit with this
  const handleGpaySubmit = () => {
    // if (totalPriceNew === 0) {
    //   Toast.show({
    //     type: "error",
    //     text1: "Selection Required",
    //     text2: "Please select at least one add-on package",
    //     position: "bottom",
    //     visibilityTime: 3000,
    //   });
    // }
    setGpayModalVisible(false); // Close the modal
    handleGPaySave(); // Call the new save function
  };

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <>
      <ScrollView>
        <SafeAreaView style={styles.container}>

          <Text style={styles.selectedPlan}>Selected Plan</Text>

          <View style={styles.planRateFlex}>
            <View>
              {!isAddOnOnly && (
                <>
                  <Text style={styles.plan}>{selectedPlanName}</Text>
                </>)}
              <TouchableOpacity onPress={() => navigation.navigate('MembershipPlan')}>
                <Text style={styles.changePlan}>Change Plan</Text>
              </TouchableOpacity>
            </View>
            {!isAddOnOnly && (
              <>
                <Text style={styles.rateRed}>₹{selectedPlanPrice.toFixed(2)}</Text>
              </>
            )}
          </View>

          <View style={styles.lineContainer}>
            <View style={styles.line}></View>
          </View>

          <Text style={styles.selectedPlan}>Add-On Packages</Text>

          {packages.map((pkg) => (
            <View key={pkg.package_id} style={styles.planRateFlex}>
              <View style={styles.checkFlex}>
                <Pressable
                  style={[
                    styles.checkboxBase,
                    checkedState[pkg.package_id] && styles.checkboxChecked,
                  ]}
                  onPress={() => handleCheck(pkg.package_id, pkg.amount)}
                >
                  {checkedState[pkg.package_id] && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </Pressable>

                <View>
                  <Text
                    onPress={() => handleCheck(pkg.package_id, pkg.amount)}
                    style={styles.planAddOn}
                  >
                    {pkg.name}
                  </Text>
                  <Text style={styles.members}>{pkg.description}</Text>
                </View>
              </View>
              <Text style={styles.rateRed}>₹{pkg.amount}.00</Text>
            </View>
          ))}

          <View style={styles.lineContainer}>
            <View style={styles.line}></View>
          </View>

          <View style={styles.planRateFlex}>
            <View>
              <Text style={styles.rateRed}>Total</Text>
            </View>
            <Text style={styles.plan}>₹{totalPriceNew.toFixed(2)}</Text>
          </View>

          <View style={styles.paymentButtonsContainer}>
            <TouchableOpacity
              style={styles.btn}
              onPress={handlePayNow}
              disabled={isPaymentLoading || submitting}
            >
              <LinearGradient
                colors={["#BD1225", "#FF4050"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                useAngle={true}
                angle={92.08}
                angleCenter={{ x: 0.5, y: 0.5 }}
                style={styles.linearGradient}
              >
                <View style={styles.loginContainer}>
                  {isPaymentLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.login}>
                      {submitting ? "Submitting..." : "Online Payment"}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={styles.btn}
              onPress={() => setGpayModalVisible(true)}
            >

              <Text style={styles.gpayText}>GPay</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={styles.btn}
              onPress={() => setGpayModalVisible(true)}
            >
              <LinearGradient
                colors={["#BD1225", "#FF4050"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                useAngle={true}
                angle={92.08}
                angleCenter={{ x: 0.5, y: 0.5 }}
                style={styles.linearGradient}
              >
                <View style={styles.loginContainer}>
                  <Text style={styles.login}>GPay</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={gpayModalVisible}
        onRequestClose={() => {
          setGpayModalVisible(!gpayModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setGpayModalVisible(false)}
            >
              <Ionicons name="close-circle" size={30} color="#ED1E24" />
            </TouchableOpacity>
            <Image
              source={require('../assets/img/gpay.png')}
              style={styles.gpayModalImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.submitGpayButton}
              onPress={handleGpaySubmit}
            >
              <LinearGradient
                colors={["#BD1225", "#FF4050"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                useAngle={true}
                angle={92.08}
                angleCenter={{ x: 0.5, y: 0.5 }}
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  gpayText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'inter',
    paddingHorizontal: 10,
  },

  selectedPlan: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "inter",
    color: "#202332",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 10,
  },

  selectedPlanType: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "inter",
    color: "#202332",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 10,
  },

  planRateFlex: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  plan: {
    color: "#282C3F",
    fontFamily: "inter",
    fontSize: 26,
    fontWeight: "700",
    alignSelf: "flex-start",
  },

  rateRed: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 14,
    alignItems: "center",
    alignSelf: "flex-start",
  },

  changePlan: {
    color: "#ED1E24",
    fontFamily: "inter",
    fontSize: 14,
    fontWeight: "500",
    alignSelf: "flex-start",
    textDecorationLine: "underline",
    marginTop: 10,
    marginBottom: 20,
  },

  lineContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },

  line: {
    backgroundColor: "#D9D9D9",
    width: "100%",
    height: 1,
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  checkFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  planAddOn: {
    color: "#545454",
    fontFamily: "inter",
    fontSize: 16,
    fontWeight: "700",
    alignSelf: "flex-start",
    marginBottom: 5,
  },

  members: {
    color: "#545454",
    fontFamily: "inter",
    fontSize: 12,
    fontWeight: "500",
    alignSelf: "flex-start",
  },

  checkboxBase: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
    borderWidth: 2,
    borderColor: "#FF6666",
    backgroundColor: "transparent",
    marginRight: 6,
  },

  checkboxChecked: {
    backgroundColor: "#FF6666",
  },

  btn: {
    flex: 1,
    alignSelf: "center",
    borderRadius: 6,
    marginTop: 15,
    marginBottom: 30,
    marginLeft: 10,
  },

  paymentButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  login: {
    textAlign: "center",
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 1,
    fontFamily: "inter",
    marginRight: 5,
  },

  linearGradient: {
    borderRadius: 5,
    justifyContent: "center",
    padding: 15,
  },

  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#202332',
    fontSize: 16,
    fontFamily: 'inter',
  },
  gpayBtn: {
    marginLeft: 10,
    marginTop: -15,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D4D5D9',
    justifyContent: 'center',
    alignItems: 'center',
    height: 58,
  },
  gpayIcon: {
    width: 60,
    height: 40,
    resizeMode: 'contain',
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  gpayModalImage: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  submitGpayButton: {
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
});
