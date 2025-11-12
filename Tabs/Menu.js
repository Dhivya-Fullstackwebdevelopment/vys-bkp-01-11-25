import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Button,
  Linking,
  Dimensions,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import CircularProgress from "react-native-circular-progress-indicator";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchDashboardData, getMyProfilePersonal, getMyEducationalDetails } from "../CommonApiCall/CommonApiCall";
import Toast from "react-native-toast-message";

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive helper functions
const wp = (percentage) => {
  return (percentage * screenWidth) / 100;
};

const hp = (percentage) => {
  return (percentage * screenHeight) / 100;
};

const responsiveFontSize = (size) => {
  const scale = screenWidth / 375; // Base width (iPhone X)
  const newSize = size * scale;
  return Math.max(12, Math.min(newSize, 30)); // Min 12, Max 30
};

export const Menu = () => {
  const navigation = useNavigation();


  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [profileDetails, setProfileDetails] = useState(null);
  const [educationalDetails, setEducationalDetails] = useState(null);
  const [buttonText, setButtonText] = useState("Upgrade");

  useEffect(() => {
    const determineButtonType = async () => {
      try {
        const currentPlanId = await AsyncStorage.getItem("current_plan_id");
        const validityDate = await AsyncStorage.getItem("valid_till_date");

        console.log("Current Plan ID:", currentPlanId);
        console.log("Validity Date:", validityDate);

        const allowedPremiumIds = [1, 2, 3, 14, 15, 17, 10, 11, 12, 13];
        const planId = parseInt(currentPlanId || "0");

        let buttonType = "Upgrade";

        if (allowedPremiumIds.includes(planId)) {
          if (validityDate) {
            const validDate = new Date(validityDate);
            const currentDate = new Date();

            console.log("Valid Date:", validDate);
            console.log("Current Date:", currentDate);
            console.log("Is Valid:", validDate.getTime() > currentDate.getTime());

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
      setLoading(true); // Start loading when screen is focused
      try {
        // Fetch both dashboard data and profile details in parallel
        const [dashboard, profileResult] = await Promise.all([
          fetchDashboardData(),
          getMyProfilePersonal()
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
          position: "bottom",
        });
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });

    return unsubscribe;
  }, [navigation]); // Runs every time navigation focus changes


  const fetchProfileData = async () => {
    try {
      const data = await getMyEducationalDetails();
      console.log("data educational details ===>", data);
      setEducationalDetails(data.data); // Set the data in the state
    } catch (error) {
      console.error('Failed to load profile data', error);
    }
  };


  useEffect(() => {
    fetchProfileData(); // Call the function when component mounts
  }, []);

  const handleLogout = async () => {
    try {
      // Clear user session data from AsyncStorage
      await AsyncStorage.clear();

      // Navigate to the Login screen
      // navigation.navigate("LoginPage");
      navigation.reset({ index: 0, routes: [{ name: "LoginPage" }] });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };


  const handleUpgradeClick = () => {
    if (buttonText === "Add-On") {
      navigation.navigate('PayNow');
    } else if (buttonText === "Renew") {
      navigation.navigate('MembershipPlan');
    } else {
      navigation.navigate('MembershipPlan');
    }
  };

  // const getImageSource = (image) => {
  //   if (!image)
  //     return {
  //       uri: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%2Fimages%3Fk%3Ddefault%2Bimage&psig=AOvVaw28Px6jC5wsx4TWxwOrHJT2&ust=1726388184602000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMCfpqb_wYgDFQAAAAAdAAAAABAE",
  //     }; // Fallback image
  //   if (Array.isArray(image)) {
  //     return { uri: image[0] }; // Use the first image if it's an array
  //   }
  //   return { uri: image }; // Direct URL case
  // };

  const getImageSource = (image) => {
    const defaultImage =
      "https://vysyamat.blob.core.windows.net/vysyamala/default_groom.png"; // fallback

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

  const handleWhatsAppShareWithImage = async () => {
    try {
      const profileName = dashboardData?.profile_details?.profile_name || 'Not available';
      const profileId = dashboardData?.profile_details?.profile_id || 'Not available';
      const age = dashboardData?.profile_details?.age || 'Not available';
      const starName = dashboardData?.profile_details?.star_name || 'Not available';
      // const baseUrl = 'https://vysyamaladevnew-aehaazdxdzegasfb.westus2-01.azurewebsites.net';
      // const baseUrl = 'https://app.vysyamala.com';
      const vysyamalaUrl = 'vysyamala.com';
      const profession = profileDetails?.prosession;
      const annualIncome = educationalDetails?.personal_ann_inc_name;
      const placeOfStay = educationalDetails?.personal_work_district || educationalDetails?.personal_work_city_name
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

      // Construct the share URL with proper encoding
      // const shareUrl = `${baseUrl}/auth/profile/${encodeURIComponent(profileId)}/`;
      const shareUrl = `https://app.vysyamala.com/auth/profile/${profileId}/`;
      const title = 'Check out this profile!';

      const message =
        // `*Vysyamala Matrimony Profile*\n\n` +
        // `🌟 *Profile Link:* ${shareUrl}\n` +
        `${title}\n\n` +
        `🆔 *Profile ID:* ${profileId}\n` +
        `👤 *Profile Name:* ${profileName}\n` +
        `🎂 *Age:* ${age} years\n` +
        `✨ *Star Name:* ${starName}\n` +
        `💰 *Annual Income:* ${annualIncome || 'Not available'}\n` +
        `🎓 *Education:* ${education || 'Not available'}\n` +
        // `💼 *Profession:* ${profession || 'Not available'}${companyName || businessName ? ` at ${companyName || businessName}` : ''}\n` +4
        professionLine +
        `📍 *Place of Stay:* ${placeOfStay || 'Not available'}\n\n` +
        `🌟 *For More Details:* ${shareUrl}\n` +
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
          position: 'bottom',
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
        position: 'bottom',
      });
    } finally {
      setShareModalVisible(false);
    }
  };

  const handleWhatsAppShareWithoutImage = async () => {
    try {
      const profileName = dashboardData?.profile_details?.profile_name || 'Not available';
      const profileId = dashboardData?.profile_details?.profile_id || 'Not available';
      const age = dashboardData?.profile_details?.age || 'Not available';
      const starName = dashboardData?.profile_details?.star_name || 'Not available';
      // const baseUrl = 'https://vysyamaladevnew-aehaazdxdzegasfb.westus2-01.azurewebsites.net';
      //const baseUrl = 'https://app.vysyamala.com';
      const vysyamalaUrl = 'vysyamala.com';
      const profession = profileDetails?.prosession;
      const annualIncome = educationalDetails?.personal_ann_inc_name;
      const placeOfStay = educationalDetails?.personal_work_district || educationalDetails?.personal_work_city_name
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

      // Construct the share URL with proper encoding
      const shareUrlWithoutImage = `https://app.vysyamala.com/auth/profile_view/${profileId}/`
      const title = 'Check out this profile!';

      const message =
        // `*Vysyamala Matrimony Profile*\n\n` +
        // `🌟 *Profile Link:* ${shareUrl}\n` +
        `${title}\n\n` +
        `🆔 *Profile ID:* ${profileId}\n` +
        `👤 *Profile Name:* ${profileName}\n` +
        `🎂 *Age:* ${age} years\n` +
        `✨ *Star Name:* ${starName}\n` +
        `💰 *Annual Income:* ${annualIncome || 'Not available'}\n` +
        `🎓 *Education:* ${education || 'Not available'}\n` +
        // `💼 *Profession:* ${profession || 'Not available'}${companyName || businessName ? ` at ${companyName || businessName}` : ''}\n` +4
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
          position: 'bottom',
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
        position: 'bottom',
      });
    } finally {
      setShareModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        // Show loading indicator while fetching data
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#BD1225" />
        </View>
      ) : (
        <ScrollView style={styles.menuContainer}>
          <View style={styles.menuContainer}>
            {/* updateProfileContainer */}
            <View style={styles.updateProfileContainer}>
              {/* profile Update */}
              <TouchableOpacity
                onPress={() => navigation.navigate("MyProfile")}
              >
                <View style={styles.imgContentFlex}>
                  <Image
                    source={getImageSource(dashboardData?.image_data)}
                    style={styles.profileImage}
                  />

                  {/* New Share Icon */}
                  <TouchableOpacity onPress={handleShare} style={{ padding: wp(2) }}>
                    <Ionicons name="share-social" size={wp(6)} color="#535665" />
                  </TouchableOpacity>
                </View>
                <View style={styles.profileContent}>
                  <Text style={styles.profileName}>
                    {profileDetails.personal_profile_name || " "}
                  </Text>
                  <Text style={styles.profileNumber}>
                    {profileDetails.profile_id || " "}
                  </Text>

                  {/* Plan flex */}
                  <View style={styles.planFlex}>
                    <LinearGradient
                      colors={
                        profileDetails.package_name === "Platinum"
                          ? ["#E5E4E2", "#C0C0C0", "#FFFFFF"]
                          : profileDetails.package_name === "Gold"
                            ? ["#D79D32", "#FFB800", "#FDE166"]
                            : profileDetails.package_name === "Diamond"
                              ? ["#B9F2FF", "#FFFFFF", "#B9F2FF"]
                              : ["#D79D32", "#FFB800", "#FDE166"]
                      }
                      locations={[0, 0.5, 1]}
                      start={{ x: 1, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[
                        styles.goldLinearGradient,
                        profileDetails.package_name === "Diamond" && styles.diamondText
                      ]}
                    >
                      <Text style={[
                        styles.goldText,
                        profileDetails.package_name === "Diamond" && { color: "#fff" }
                      ]}>
                        {profileDetails.package_name || "Gold"}
                      </Text>
                    </LinearGradient>
                    <Text style={styles.date}>
                      Valid Upto :
                      {profileDetails.valid_upto == ""
                        ? "2024-01-01"
                        : profileDetails.valid_upto}
                    </Text>
                  </View>
                </View>
                {/* </View> */}
              </TouchableOpacity>
              {/* sandalContainer */}

              <TouchableOpacity
                style={styles.sandalProfileContainer}
                onPress={() =>
                  parseInt(
                    dashboardData?.profile_details?.completion_per,
                    10
                  ) !== 100 && navigation.navigate("ProfileCompletionForm")
                }
                disabled={
                  parseInt(
                    dashboardData?.profile_details?.completion_per,
                    10
                  ) === 100
                } // Disable touchable if 100%
              >
                {parseInt(
                  dashboardData?.profile_details?.completion_per,
                  10
                ) === 100 ? (
                  // <View style={styles.sandalContainerFlex}>
                  <View style={styles.percentageContent}>
                    <Text style={styles.profilePercentage}>
                      Your profile is now{" "}
                      {dashboardData?.profile_details?.completion_per || " "} %
                      complete
                    </Text>
                    {/* </View> */}
                  </View>
                ) : (
                  <>
                    <View style={styles.sandalContainerFlex}>
                      <CircularProgress
                        value={
                          parseInt(
                            dashboardData?.profile_details?.completion_per,
                            10
                          ) || 0
                        }
                        valueSuffix={"%"}
                        radius={35}
                        duration={2000}
                        activeStrokeWidth={8}
                        inActiveStrokeWidth={8}
                        progressValueColor={"#535665"}
                        progressValueStyle={{ fontSize: 14, fontWeight: "500" }}
                        titleFontSize={16}
                        maxValue={100}
                        activeStrokeColor={"#2FBD12"}
                        inActiveStrokeColor={"#2FBD12"}
                        inActiveStrokeOpacity={0.2}
                      />

                      <View style={styles.percentageContent}>
                        <Text style={styles.profilePercentage}>
                          Your profile is now{" "}
                          {dashboardData?.profile_details?.completion_per ||
                            " "} % complete
                        </Text>
                        <Text style={styles.percentageText}>
                          Complete your profile we will suggest profiles based
                          on your preference
                        </Text>

                        <View style={styles.completeTextFlex}>
                          <Text style={styles.completeText}>
                            Complete Your Profile{" "}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={wp(4.5)}
                            color="#ED1E24"
                          />
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* hrLine */}
            <View style={styles.hrLine} />

            {/* wishlist menu */}
            <TouchableOpacity
              onPress={() => navigation.navigate("DashBoardWishlist")}
            >
              <View style={styles.menuFlex}>
                <MaterialCommunityIcons
                  name="bookmark"
                  size={wp(6)}
                  color="#535665"
                />
                <Text style={styles.menuText}>Wishlist</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.hrLine1} />

            {/* other settings menu */}
            <TouchableOpacity
              onPress={() => navigation.navigate("OtherSettings")}
            >
              <View style={styles.menuFlex}>
                <FontAwesome6 name="user-gear" size={wp(6)} color="#535665" />
                <Text style={styles.menuText}>Other Settings</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.hrLine1} />

            {/* about is settings menu */}
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  // url: "http://matrimonyapp.rainyseasun.com/AboutUsMobile",
                  url: "https://vysyamala.com/AboutUsMobile",
                  title: "About Us",
                })
              }
            >
              <View style={styles.menuFlex}>
                <Ionicons name="information-circle" size={wp(6)} color="#535665" />
                <Text style={styles.menuText}>About Us</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.hrLine1} />

            {/* Success Stories settings menu */}
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  // url: "http://matrimonyapp.rainyseasun.com/HappyStoriesMobile",
                  url: "https://vysyamala.com/HappyStoriesMobile",
                  title: "Success Stories",
                })
              }
            >
              <View style={styles.menuFlex}>
                <FontAwesome6 name="star" size={wp(6)} color="#535665" />
                <Text style={styles.menuText}>Success Stories</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.hrLine1} />

            {/* Awards settings menu */}
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("WebViewPage", {
                  // url: "http://matrimonyapp.rainyseasun.com/AwardsMobile",
                  url: "https://vysyamala.com/AwardsMobile",
                  title: "Awards",
                })
              }
            >
              <View style={styles.menuFlex}>
                <Ionicons name="trophy" size={wp(6)} color="#535665" />
                <Text style={styles.menuText}>Awards</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.hrLine1} />

            {/* Upgrade menu */}
            {/* <TouchableOpacity
              onPress={() => navigation.navigate("MembershipPlan")}
            >
              <LinearGradient
                colors={["#BD1225", "#FF4050"]} // Gradient colors
                style={styles.button}
              >
                <Text style={styles.textUpgrade}>Upgrade</Text>
              </LinearGradient>
            </TouchableOpacity> */}

            <TouchableOpacity onPress={handleUpgradeClick}>
              <LinearGradient
                colors={['#BD1225', '#FF4050']}
                style={styles.button}
              >
                <Text style={styles.textUpgrade}>{buttonText}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* hrLine */}
            <View style={styles.hrLine} />

            {/* logout menu */}
            <TouchableOpacity onPress={handleLogout}>
              <View style={styles.menuFlex}>
                <MaterialIcons name="logout" size={wp(6)} color="#535665" />
                <Text style={styles.menuText}>Log Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      {/* Modal for sharing */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 15,
              padding: 20,
              width: "80%",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#000" }}>
                Share Profile
              </Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 15,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 10,
                marginVertical: 5,
                width: "100%",
              }}
              onPress={handleWhatsAppShareWithImage}
            >
              <Ionicons name="image" size={24} color="#ED1E24" />
              <Text style={{ marginLeft: 15, fontSize: 16, color: "#000" }}>
                Share with Image
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 15,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 10,
                marginVertical: 5,
                width: "100%",
              }}
              onPress={handleWhatsAppShareWithoutImage}
            >
              <Ionicons name="document-text" size={24} color="#ED1E24" />
              <Text style={{ marginLeft: 15, fontSize: 16, color: "#000" }}>
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
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  menuContainer: {
    width: "100%",
    paddingHorizontal: wp(3),
    marginVertical: hp(1.5),
  },
  imgContentFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  updateProfileContainer: {
    paddingHorizontal: wp(2),
  },
  profileContent: {
    marginTop: hp(1.5),
  },
  profileName: {
    fontSize: responsiveFontSize(16),
    fontWeight: "700",
    color: "#282C3F",
    alignSelf: "flex-start",
    marginBottom: hp(0.8),
  },
  profileNumber: {
    fontSize: responsiveFontSize(12),
    fontWeight: "300",
    color: "#535665",
    marginBottom: hp(1.2),
  },
  planFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    flexWrap: "wrap",
  },
  goldLinearGradient: {
    borderRadius: wp(1.5),
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    minWidth: wp(25),
    marginRight: wp(3),
    marginBottom: hp(0.5),
  },
  goldText: {
    color: "#202332",
    fontSize: responsiveFontSize(14),
    fontWeight: "700",
    fontFamily: "inter",
    textAlign: "center",
  },
  diamondText: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  date: {
    fontSize: responsiveFontSize(13),
    fontWeight: "300",
    color: "#535665",
    flex: 1,
    flexWrap: "wrap",
  },
  sandalProfileContainer: {
    width: "100%",
    backgroundColor: "#FFFBE3",
    borderRadius: wp(2),
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(3),
    marginTop: hp(2.5),
  },
  sandalContainerFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  percentageContent: {
    marginLeft: wp(4),
    flex: 1,
  },
  profilePercentage: {
    color: "#535665",
    fontSize: responsiveFontSize(14),
    fontWeight: "700",
    fontFamily: "inter",
    marginBottom: hp(0.8),
    flexWrap: "wrap",
  },
  percentageText: {
    color: "#535665",
    fontSize: responsiveFontSize(12),
    fontWeight: "300",
    fontFamily: "inter",
    marginBottom: hp(1.2),
    flexWrap: "wrap",
    lineHeight: responsiveFontSize(16),
  },
  completeTextFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginVertical: hp(1.2),
    flexWrap: "wrap",
  },
  completeText: {
    color: "#ED1E24",
    fontSize: responsiveFontSize(12),
    fontWeight: "500",
    fontFamily: "inter",
  },
  hrLine: {
    borderBottomColor: "#D4D5D9",
    borderBottomWidth: 1,
    marginVertical: hp(2.5),
  },
  hrLine1: {
    borderBottomColor: "#D4D5D9",
    borderBottomWidth: 1,
    marginVertical: hp(0.2),
    width: wp(60),
  },
  menuFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginVertical: hp(1.5),
    paddingHorizontal: wp(2),
  },
  menuText: {
    color: "#535665",
    fontSize: responsiveFontSize(15),
    fontWeight: "500",
    fontFamily: "inter",
    marginLeft: wp(3),
  },
  profileImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(2),
    resizeMode: "cover",
  },
  button: {
    borderRadius: wp(1.5),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    alignSelf: "flex-start",
    minWidth: wp(35),
    marginTop: hp(1.5),
  },
  textUpgrade: {
    color: "#ffffff",
    fontSize: responsiveFontSize(16),
    fontWeight: "bold",
    textAlign: "center",
  },
  // Responsive Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(5),
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: wp(4),
    padding: wp(5),
    width: "100%",
    maxWidth: wp(85),
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: hp(2.5),
  },
  modalTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: "bold",
    color: "#000",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp(4),
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: wp(2.5),
    marginVertical: hp(0.8),
    width: "100%",
  },
  modalOptionText: {
    marginLeft: wp(4),
    fontSize: responsiveFontSize(16),
    color: "#000",
  },
  // Legacy styles for backward compatibility
  modalView: {
    margin: wp(5),
    backgroundColor: "white",
    borderRadius: wp(5),
    padding: wp(8),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: hp(2),
    textAlign: "center",
    fontSize: responsiveFontSize(14),
  },
  modalImage: {
    width: wp(25),
    height: wp(25),
    marginBottom: hp(2),
  },
  dottedLine: {
    borderBottomColor: "#535665",
    borderBottomWidth: 2,
    borderStyle: "dotted",
    marginVertical: hp(0.3),
    width: wp(60),
  },
});
