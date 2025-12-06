import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios"; // Import axios
import config from "../API/Apiurl";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons'; // For icons like `FaCheck
import Toast from "react-native-toast-message";

export const MembershipPlan = ({ navigation, route }) => {

  const [plans, setPlans] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState({ id: null, price: null, name: null });
  console.log("selectedPlan", selectedPlan)
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(route.params?.fromLogin || false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const profile_id = await AsyncStorage.getItem("profile_id_new");
        const formData = new FormData();
        formData.append("profile_id", profile_id);
        console.log("mem profile check ====>", JSON.stringify(formData))
        const response = await axios.post(`${config.apiUrl}/auth/Get_palns/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (response.data.Status === 1) {
          setPlans(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching plans", error);
      }
    };
    fetchPlans();
  }, []);

  const handleCardPress = async (index, planId, planPrice, planName) => {
    setSelectedCard(index);
    setSelectedPlan({ id: planId, price: planPrice, name: planName });
    try {
      await AsyncStorage.setItem('selectedPlanId', planId.toString());
      await AsyncStorage.setItem('selectedPlanPrice', planPrice.toString());
      await AsyncStorage.setItem('selectedPlanName', planName); // Store plan_name
    } catch (error) {
      console.error("Error saving data to AsyncStorage", error);
    }
  };

  // const handleSkipPress = () => {
  //   navigation.navigate('ThankYouReg'); // Navigate to the ThankYouReg screen
  // };
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        setIsLoggedIn(!!token); // Set to true if token exists
      } catch (error) {
        console.error("Error checking login status", error);
        setIsLoggedIn(false); // Set to false if there's an error
      }
    };

    checkLoginStatus();
  }, []);

  const handleSkipPress = async () => {
    if (isLoggedIn) {
      // User came from login - navigate directly
      navigation.navigate('ThankYouReg');
    } else {
      // User is registering - call Free Packages API
      setIsLoading(true);
      try {
        const profile_id = await AsyncStorage.getItem("profile_id_new");
        const response = await axios.post(
          "https://app.vysyamala.com/auth/Free_packages/",
          { profile_id: profile_id },
          { headers: { 'Content-Type': 'application/json' } }
        );

        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Free packages updated successfully",
          position: "bottom",
          visibilityTime: 4000,
        });

        navigation.navigate('ThankYouReg');
      } catch (error) {
        console.error("Error calling Free Packages API", error);
        navigation.navigate('ThankYouReg');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.plan}>Membership Plan</Text>
      <Text style={styles.planText}>
        Upgrade your plan as per your customized requirements, with a paid
        membership, you can seamlessly connect with your prospects and get more
        responses. Here are some key benefits
      </Text>

      {/* <View style={styles.freePlanFlex}>
        <TouchableOpacity onPress={handleSkipPress}>
          <Text style={styles.freeplantext}>Skip For Free Plan</Text>
        </TouchableOpacity>
        <Ionicons name="arrow-forward" size={18} color="red" />
      </View> */}
      <View style={styles.freePlanFlex}>
        <TouchableOpacity onPress={handleSkipPress} disabled={isLoading}>
          <Text style={styles.freeplantext}>
            {isLoading ? "Processing..." : "Skip For Free Plan"}
          </Text>
        </TouchableOpacity>
        <Ionicons name="arrow-forward" size={18} color="red" />
      </View>

      <ScrollView>
        <View style={styles.cardContainer}>
          {Object.keys(plans).map((planName, index) => (
            <View
              key={index}
              style={styles.cardWrapper}
              onPress={() => handleCardPress(index, plans[planName][0].plan_id, plans[planName][0].plan_price, planName)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  selectedCard === index
                    ? ["#bd1225", "#cd1f2f", "#de2b3a", "#ee3645", "#ff4050"]
                    : ["#ffffff", "#ffffff"]
                }
                style={styles.cardStyle}
              >
                <View style={styles.planRateFlex}>
                  <Text
                    style={[
                      styles.planRed,
                      selectedCard === index && { color: "white" },
                    ]}
                  >
                    {planName}
                  </Text>
                  <Text
                    style={[
                      styles.rateRed,
                      selectedCard === index && { color: "white" },
                    ]}
                  >
                    ₹ {plans[planName][0].plan_price}
                    <Text
                      style={[
                        styles.year,
                        selectedCard === index && { color: "white" },
                      ]}
                    >
                      /{plans[planName][0].plan_renewal_cycle}
                    </Text>
                  </Text>
                </View>

                {plans[planName].map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.planInfoFlex}>
                    <Text
                      style={[
                        styles.planInfo,
                        selectedCard === index && { color: "white" },
                      ]}
                    >
                      {feature.feature_name}
                    </Text>
                    <FontAwesome6
                      name="check"
                      size={18}
                      color="#53C840"
                      fontWeight="700"
                    />
                  </View>
                ))}

                {/* <Text
                  style={[
                    styles.benefit,
                    selectedCard === index && {
                      color: "white",
                      textDecorationLine: "underline",
                    },
                  ]}
                >
                  View all benefits
                </Text> */}

                <View style={styles.choosePlanButton}>
                  <Text
                    style={styles.choosePlan}
                    onPress={() => {
                      handleCardPress(index, plans[planName][0].plan_id, plans[planName][0].plan_price, planName);
                      navigation.navigate("PayNow", {
                        planId: plans[planName][0].plan_id,
                        planPrice: plans[planName][0].plan_price,
                        planName: planName
                      });
                    }}
                  >
                    Choose Plan
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}


          <View style={styles.card}>
            <View style={styles.content}>
              <Text style={styles.title}>VYSYAMALA DELIGHT</Text>
              <Text style={styles.validity}>
                <Text style={styles.validityHighlight}>Valid for 12 months</Text>
              </Text>
              <Text style={styles.feature}>
                <FontAwesome name="check" style={styles.icon} />
                Special Matrimonial package for Rich and Affluent
              </Text>
              <Text style={styles.feature}>
                <FontAwesome name="check" style={styles.icon} />
                AI-based matching profile report for 10 matches Special Attention from Founder
              </Text>
              <Text style={styles.feature}>
                <FontAwesome name="check" style={styles.icon} />
                AI-based matching report (10 matches) & support
              </Text>
              <Text style={styles.feature}>
                <FontAwesome name="check" style={styles.icon} />
                Special attention from Founder
              </Text>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                Alert.alert(
                  "Thank You!",
                  "Thanks for choosing Vysyamala Delight, our premium customer support executive will contact you shortly.",
                  [{ text: "OK" }]
                );
              }}
            >
              <Text style={styles.buttonText}>Choose Plan</Text>
            </TouchableOpacity>
          </View>


        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  plan: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "inter",
    color: "#535665",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 10,
  },

  planText: {
    color: "#535665",
    fontFamily: "inter",
    fontSize: 14,
    marginBottom: 20,
    alignSelf: "flex-start",
    paddingHorizontal: 20,
  },

  freePlanFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
  },

  freeplantext: {
    color: "#ED1E24",
    fontFamily: "inter",
    fontSize: 16,
    alignSelf: "flex-start",
    paddingRight: 10,
  },

  cardContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },

  cardWrapper: {
    marginBottom: 20,
  },

  cardStyle: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2, // Elevation for Android
  },

  planRateFlex: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  planRed: {
    color: "#282C3F",
    fontFamily: "inter",
    fontSize: 22,
    fontWeight: "700",
    alignSelf: "flex-start",
    width: 100,
  },

  rateRed: {
    color: "#ED1E24",
    fontFamily: "inter",
    fontSize: 22,
    fontWeight: "700",
    alignSelf: "flex-start",
  },

  year: {
    color: "#282C3F",
    fontSize: 14,
    fontFamily: "inter",
  },

  planInfoFlex: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
  },

  planInfo: {
    color: "#4F515D",
    fontFamily: "inter",
    fontSize: 14,
    fontWeight: "500",
    alignSelf: "flex-start",
    width: "75%",
  },

  benefit: {
    color: "#ED1E24",
    fontFamily: "inter",
    fontSize: 14,
    fontWeight: "500",
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 20,
  },

  choosePlanButton: {
    backgroundColor: "#fdebed",
    paddingVertical: 15,
    borderRadius: 25,
  },

  choosePlan: {
    color: "#ED1E24",
    fontFamily: "inter",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  card: {
    width: '100%',
    // flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    color: '#FF0000', // Replace with your "main" color
    fontWeight: 'bold',
    marginBottom: 8,
  },
  validity: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginBottom: 16,
  },
  validityHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  feature: {
    fontSize: 14,
    color: '#999',
    paddingLeft: 30,
    marginBottom: 16,
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    left: 0,
    top: 4,
    fontSize: 14,
    color: 'green',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    borderRadius: 10,
  },
  button: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFCCE5', // Replace with "light-pink" color
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  buttonText: {
    color: '#FF0000', // Replace with "main" color
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

});
