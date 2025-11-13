import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  ScrollView,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
} from "react-native";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import CircularProgress from "react-native-circular-progress-indicator";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message"; // Make sure this is imported
import { fetchProfileInterests, fetchDashboardData, updateProfileInterest } from '../CommonApiCall/CommonApiCall';


export const DashBoard = () => {
  const [profileData, setProfileData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profiles = await fetchProfileInterests();
        setProfileData(profiles);

        const dashboard = await fetchDashboardData();
        setDashboardData(dashboard);
      } catch (error) {
        setError(error.message);
        // Show error toast message
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

    fetchData();
  }, []);

  // if (loading) {
  //   return <Text>Loading...</Text>;
  // }

  // if (error) {
  //   return <Text>{error}</Text>;
  // }


  const handleSavePress = async (profileId, status) => {
    try {
      setLoading(true); // Disable buttons during API call

      // Call the common API function
      const response = await updateProfileInterest(profileId, status);

      if (response.Status === 1) {
        // Update state: Remove the profile
        setProfileData((prevProfiles) =>
          prevProfiles.filter((profile) => profile.int_profileid !== profileId)
        );

        // Show success toast
        if (status === "2") {
          Toast.show({
            type: "success",
            text1: "Accepted",
            text2: "Interest Accepted.",
            position: "bottom",
          });
        } else if (status === "3") {
          Toast.show({
            type: "error",
            text1: "Rejected",
            text2: "Interest Rejected.",
            position: "bottom",
          });
        }
      } else {
        // Handle unsuccessful response
        console.error("Error updating profile interest:", response.message);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to update profile interest.",
          position: "bottom",
        });
      }
    } catch (error) {
      // Handle API call error
      console.error("Error updating profile interest:", error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again.",
        position: "bottom",
      });
    } finally {
      setLoading(false); // Re-enable buttons
    }
  };


  const formatProfileNotes = (text) => {
    let formattedText = '';
    let whitespaceCount = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Append character to the formatted text
      formattedText += char;

      // Check if the current character is a whitespace
      if (char === ' ' || char.charCodeAt(0) === 0x00A0) {
        whitespaceCount++;
      }

      // Insert newline after exactly 7 whitespaces
      if (whitespaceCount >= 5) {
        formattedText += '\n';
        whitespaceCount = 0; // Reset count after adding newline
      }
    }

    // Log final formatted text
    //console.log('Formatted Text:', formattedText);

    return formattedText;
  };


  const getImageSource = (image) => {
    if (!image) return { uri: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fstock.adobe.com%2Fsearch%2Fimages%3Fk%3Ddefault%2Bimage&psig=AOvVaw28Px6jC5wsx4TWxwOrHJT2&ust=1726388184602000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMCfpqb_wYgDFQAAAAAdAAAAABAE' }; // Fallback image
    if (Array.isArray(image)) {
      return { uri: image[0] }; // Use the first image if it's an array
    }
    return { uri: image }; // Direct URL case
  };

  // Extract image URLs from image_data
  const imageUrls = dashboardData?.image_data
    ? dashboardData.image_data.map(obj => Object.values(obj)[0])
    : [];





  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.dashBoard}>DashBoard</Text>

        {/* red card */}
        <TouchableWithoutFeedback
          onPress={() => {
            navigation.navigate("HomeWithToast");
          }}
        >
          <View style={styles.redCardContainer}>
            <View style={styles.redCard}>
              <FontAwesome6 name="user-group" size={30} color="#fff" />
              <Text style={styles.matching}>Matching Profiles</Text>

              {/* <View style={styles.numbersImgs}>
                <Text style={styles.matchingNumbers}>{dashboardData?.matching_profile_count || 0}</Text>
                <Image
                  style={styles.roundsImgs}
                  source={require("../assets/img/ProfileImgRounds.png")}
                />
              </View> */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 10, marginBottom: 10 }}>
                <Text style={styles.matchingNumbers}>
                  {dashboardData?.matching_profile_count || 0}
                </Text>

                <View style={{ flexDirection: 'row' }}>
                  {imageUrls.slice(0, 4).map((url, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: url }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        borderWidth: 2,
                        borderColor: '#fff',
                        marginLeft: idx === 0 ? 0 : -10, // overlap effect
                        backgroundColor: '#eee',
                      }}
                    />
                  ))}

                  {imageUrls.length > 4 && (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: '#ccc',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginLeft: -10,
                        borderWidth: 2,
                        borderColor: '#fff',
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                        +{imageUrls.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
              </View>


            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* violet card */}
        <TouchableWithoutFeedback
          onPress={() => {
            navigation.navigate("DashBoardMutualInterest");
          }}
        >
          <View style={styles.violetContainer}>
            <View style={styles.violetCard}>
              <View style={styles.textIcons}>
                <Text style={styles.text}>Mutual Interest</Text>
                <MaterialCommunityIcons
                  name="heart-multiple"
                  size={30}
                  color="#fff"
                />
              </View>

              <Text style={styles.Numbers}>{dashboardData?.mutual_int_count || 0}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>


        {/* sandal card */}
        <TouchableWithoutFeedback
          onPress={() => {
            navigation.navigate("DashBoardWishlist");
          }}
        >
          <View style={styles.sandalContainer}>
            <View style={styles.sandalCard}>
              <View style={styles.textIcons}>
                <Text style={styles.text}>Wishlist</Text>
                <MaterialCommunityIcons name="bookmark" size={30} color="#fff" />
              </View>

              <Text style={styles.Numbers}>{dashboardData?.wishlist_count || 0}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>

        <Text style={styles.interest}>
          Received Interest <Text style={styles.interestNumber}>({dashboardData?.received_int_count || 0})</Text>
        </Text>

        {/* profiles horizontal layout  */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {profileData
            .filter((profile) => profile.int_status === 1) // Filter profiles with status 1
            .map((profile) => (
              <View key={profile.int_profileid} style={styles.profileDiv}>
                <View style={styles.profileContainer}>
                  {/* Profile Image */}
                  <Image
                    source={getImageSource(profile.int_Profile_img)}
                    style={styles.profileImage}
                  />

                  <View style={styles.profileContent}>
                    {/* Profile Name and ID */}
                    <Text style={styles.profileName}>
                      {profile.int_profile_name}{" "}
                      <Text style={styles.profileId}>
                        ({profile.int_profileid})
                      </Text>
                    </Text>

                    {/* Profile Age */}
                    <Text style={styles.profileAge}>
                      {profile.int_profile_age} Yrs
                    </Text>

                    {/* Profile Notes */}
                    <Text style={styles.profileText}>
                      {formatProfileNotes(profile.int_profile_notes)}
                    </Text>

                    {/* Action Icons */}
                    <View style={styles.iconFlex}>
                      <TouchableWithoutFeedback onPress={() => handleSavePress(profile.int_profileid, '2')}>
                        <MaterialIcons
                          name="check-circle"
                          size={28}
                          color="#53C840"
                          style={styles.Icon}
                        />
                      </TouchableWithoutFeedback>
                      <TouchableWithoutFeedback onPress={() => handleSavePress(profile.int_profileid, '3')}>
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={28}
                          color="#FF3333"
                          style={styles.Icon}
                        />
                      </TouchableWithoutFeedback>
                    </View>
                  </View>
                </View>
              </View>
            ))}

        </ScrollView>



        {/* cards indicator */}
        <View style={styles.whiteCards}>

          {/* Interest Sent */}
          <TouchableWithoutFeedback
            onPress={() => {
              navigation.navigate("InterestSent");
            }}
          >
            <View style={styles.cardsIndicator}>
              {/* white card */}
              <View style={styles.whiteContainer}>
                <View style={styles.whiteCard}>
                  <View style={styles.blackTextIcons}>
                    <Text style={styles.blackText}>Interest Sent</Text>
                    <MaterialIcons
                      name="present-to-all"
                      size={24}
                      color="#FF3333"
                    />
                  </View>

                  <Text style={styles.blackNumbers}>{dashboardData?.sent_int_count || 0}</Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>

          {/* Viewed profiles */}
          <TouchableWithoutFeedback
            onPress={() => {
              navigation.navigate("ViewedProfiles");
            }}
          >
            <View style={styles.cardsIndicator}>
              {/* white card */}
              <View style={styles.whiteContainer}>
                <View style={styles.whiteCard}>
                  <View style={styles.blackTextIcons}>
                    <Text style={styles.blackText}>Viewed profiles</Text>
                    <MaterialIcons name="preview" size={24} color="#FF3333" />
                  </View>

                  <Text style={styles.blackNumbers}>{dashboardData?.viewed_profile_count || 0}</Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>

          {/* My Visitors */}
          <TouchableWithoutFeedback
            onPress={() => {
              navigation.navigate("MyVisitors");
            }}
          >
            <View style={styles.cardsIndicator}>
              {/* white card */}
              <View style={styles.whiteContainer}>
                <View style={styles.whiteCard}>
                  <View style={styles.blackTextIcons}>
                    <Text style={styles.blackText}>My Visitors</Text>
                    <FontAwesome6 name="users" size={24} color="#FF3333" />
                  </View>

                  <Text style={styles.blackNumbers}>{dashboardData?.myvisitor_count || 0}</Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>


          {/* Gallery */}
          {/* <View style={styles.cardsIndicator}>
            <View style={styles.whiteContainer}>
              <View style={styles.whiteCard}>
                <View style={styles.blackTextIcons}>
                  <Text style={styles.blackText}>Gallery</Text>
                  <MaterialCommunityIcons
                    name="image-multiple"
                    size={24}
                    color="#FF3333"
                  />
                </View>

                <Text style={styles.blackNumbers}>{dashboardData?.gallery_count || 0}</Text>
              </View>
            </View>
          </View> */}

          {/* Photo Request */}
          <TouchableWithoutFeedback
            onPress={() => {
              navigation.navigate("PhotoRequest");
            }}
          >
            <View style={styles.cardsIndicator}>
              <View style={styles.whiteContainer}>
                <View style={styles.whiteCard}>
                  <View style={styles.blackTextIcons}>
                    <Text style={styles.blackText}>Photo Request</Text>
                    <MaterialCommunityIcons
                      name="image-multiple"
                      size={24}
                      color="#FF3333"
                    />
                  </View>

                  <Text style={styles.blackNumbers}>{dashboardData?.photo_int_count || 0}</Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>

          {/* 4 cards */}
          <View style={styles.flexCardsDiv}>

            {/* Personal Notes */}
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("PersonalNotes");
              }}
              style={styles.flexCardsFirst}
            >
              <View>
                <Ionicons
                  name="document-text"
                  size={24}
                  color="#FF3333"
                  style={styles.iconsFour}
                />
                <Text style={styles.blackText}>Personal Notes</Text>
              </View>
            </TouchableOpacity>

            {/* Other Settings */}
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("OtherSettings");
              }} style={styles.flexCards}
            >
              <View>
                <FontAwesome6
                  name="user-gear"
                  size={24}
                  color="#FF3333"
                  style={styles.iconsFour}
                />
                <Text style={styles.blackText}>Other Settings</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.flexCardsDiv}>

            {/* Reported Profiles */}
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("GalleryResults");
              }}
              style={styles.flexCardsFirst}
            >
              <View>
                <MaterialCommunityIcons
                  name="image-multiple"
                  size={24}
                  color="#FF3333"
                  style={styles.iconsFour}
                />
                <Text style={styles.blackText}>Gallery</Text>
              </View>
            </TouchableOpacity>

            {/* Vys Assist */}
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("VysassistResults");
              }} style={styles.flexCards}
            >
              <View>
                <MaterialCommunityIcons
                  name="account-voice"
                  size={24}
                  color="#FF3333"
                  style={styles.iconsFour}
                />
                <Text style={styles.blackText}>Vys Assist</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile */}
          <View style={styles.updateProfileContainer}>
            <TouchableOpacity style={styles.imgIconFlex} onPress={() => {
              navigation.navigate("MyProfile");
            }}>
              <Image
                source={{ uri: dashboardData?.profile_details?.profile_image }}
                style={styles.profileImage}
              />
              {/* <Ionicons
                name="share-social-sharp"
                size={24}
                color="#4F515D"
                style={styles.iconsFour}
              /> */}
            </TouchableOpacity>

            <Text style={styles.profileName}>{dashboardData?.profile_details?.profile_name || " "}</Text>
            <Text style={styles.profileNumber}>{dashboardData?.profile_details?.profile_id || " "}</Text>

            {/* <View style={styles.planFlex}>
              <LinearGradient
                colors={["#D79D32", "#FFB800", "#FDE166"]}
                locations={[0, 0.5, 1]}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={styles.goldLinearGradient}
              >
                <Text style={styles.goldText}>Gold</Text>
              </LinearGradient> */}
            {/* <Text style={styles.date}>
                Valid Upto: {dashboardData?.profile_details?.package_validity || "16-Mar-2025"}
              </Text> */}
            {/* </View> */}

            <View
              // onPress={() => {
              //   if (parseInt(dashboardData?.profile_details?.completion_per, 10) !== 100) {
              //     navigation.navigate("ProfileCompletionForm");
              //   }
              // }}
              disabled={parseInt(dashboardData?.profile_details?.completion_per, 10) === 100} // Disable when 100%
              style={[
                styles.sandalProfileContainer,
                parseInt(dashboardData?.profile_details?.completion_per, 10) === 100 && { opacity: 0.5 } // Dim UI when disabled
              ]}
            >
              {parseInt(dashboardData?.profile_details?.completion_per, 10) === 100 ? (
                // ✅ Show this if profile completion is 100%
                <View style={styles.sandalProfileContainer}>
                  <Text style={styles.profilePercentage}>
                    Your profile is now  {dashboardData?.profile_details?.completion_per || " "} % complete
                  </Text>
                </View>
              ) : (
                // ❌ Show this if profile completion is NOT 100%
                <TouchableOpacity style={styles.sandalProfileContainer}
                  onPress={() => {
                    if (parseInt(dashboardData?.profile_details?.completion_per, 10) !== 100) {
                      navigation.navigate("ProfileCompletionForm");
                    }
                  }}
                >
                  <CircularProgress
                    value={parseInt(dashboardData?.profile_details?.completion_per, 10) || 0}
                    valueSuffix={"%"}
                    radius={35}
                    duration={2000}
                    activeStrokeWidth={8}
                    inActiveStrokeWidth={8}
                    progressValueColor={"#535665"}
                    progressValueStyle={{ fontSize: 14, fontWeight: "500" }}
                    titleFontSize={16}
                    maxValue={100}
                    titleColor={"white"}
                    titleStyle={{ fontWeight: "bold" }}
                    activeStrokeColor={"#2FBD12"}
                    inActiveStrokeColor={"#2FBD12"}
                    inActiveStrokeOpacity={0.2}
                  />
                  <Text style={styles.profilePercentage}>
                    Your profile is now {dashboardData?.profile_details?.completion_per || " "} % complete
                  </Text>
                  <Text style={styles.percentageText}>
                    Complete your profile we will suggest profiles based on your preference
                  </Text>

                  <View style={styles.completeTextFlex}>
                    <Text style={styles.completeText}>Complete Your Profile</Text>
                    <Ionicons name="arrow-forward" size={18} color="#ED1E24" />
                  </View>
                </TouchableOpacity>
              )}
            </View>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    // alignItems: "center",
    justifyContent: "flex-start",
  },

  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 10, // For circular images, optional
    backgroundColor: '#f0f0f0', // Background color in case the image fails to load
  },

  readMore: {
    marginTop: 5,
  },
  readMoreText: {
    color: '#007BFF',
    fontSize: 14,
  },

  dashBoard: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "inter",
    color: "#282C3F",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    marginVertical: 10,
  },

  // bgImgStyle: {
  //   flex: 1,
  //   justifyContent: "center",
  //   alignItems: "center",
  //   resizeMode: "contain",
  //   width: "100%",
  //   // height: "100%",
  // },

  redCardContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  redCard: {
    backgroundColor: "#EF4770",
    // backgroundColor: "#F26D8C",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  matching: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "inter",
    marginVertical: 10,
  },

  matchingNumbers: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "inter",
    // alignSelf: "center",
    // marginVertical: 10,
  },

  numbersImgs: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // alignSelf: "center",
    // marginVertical: 10,
  },

  roundsImgs: {
    width: 100,
    // height: 100,
    resizeMode: "contain",
    // alignSelf: "center",
    // marginVertical: 10,
  },

  violetContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  violetCard: {
    backgroundColor: "#9047EF",
    // backgroundColor: "#A76DF2",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  Numbers: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "inter",
    // alignSelf: "center",
    marginVertical: -10,
  },

  textIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    // alignSelf: "center",
    // marginVertical: 10,
  },

  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "inter",
    // marginVertical: 10,
  },

  sandalContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  sandalCard: {
    backgroundColor: "#EFAC47",
    // backgroundColor: "#F2BD6D",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  interest: {
    fontSize: 16,
    fontWeight: "700",
    color: "#282C3F",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    marginVertical: 20,
  },

  interestNumber: {
    fontSize: 14,
    color: "#85878C",
  },

  profileScrollView: {
    width: "100%",
    // paddingHorizontal: 10,
  },

  profileDiv: {
    // width: "100%",
    paddingHorizontal: 8,
  },

  profileContainer: {
    // flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    borderRadius: 8,
    padding: 8,
    marginBottom: 30,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2, // Elevation for Android
  },

  // saveIcon: {
  //   position: "absolute",
  //   left: -25,
  //   top: 5,
  // },

  profileContent: {
    // paddingLeft: 10,
  },

  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    fontFamily: "inter",
    marginVertical: 10,
  },

  profileId: {
    fontSize: 14,
    color: "#85878C",
  },

  profileAge: {
    fontSize: 14,
    color: "#4F515D",
    marginBottom: 5,
  },

  line: {},

  profileText: {
    fontSize: 14,
    color: "#4F515D",
    marginBottom: 5,
    lineHeight: 20, // Set line height for consistent spacing
  },

  iconFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    // alignSelf: "center",
    marginTop: 10,
  },

  Icon: {
    paddingRight: 20,
  },

  whiteCards: {
    width: "100%",
    paddingHorizontal: 10,
  },

  whiteContainer: {
    // paddingHorizontal: 10,
    marginBottom: 20,
    borderRadius: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2, // Elevation for Android
  },

  whiteCard: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  blackTextIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    // alignSelf: "center",
    // marginVertical: 10,
  },

  blackText: {
    color: "#282C3F",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "inter",
    marginBottom: 20,
  },

  blackNumbers: {
    color: "#282C3F",
    fontSize: 30,
    fontWeight: "700",
    fontFamily: "inter",
    // alignSelf: "center",
    marginVertical: -10,
  },

  flexCardsDiv: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    // alignSelf: "center",
    // marginVertical: 10,
  },

  flexCardsFirst: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 10,
    marginRight: 20,
    borderRadius: 4,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2, // Elevation for Android
    // marginHorizontal: 5, // Add margin between cards
  },

  flexCards: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2, // Elevation for Android
    // marginHorizontal: 5, // Add margin between cards
  },

  iconsFour: {
    marginBottom: 15,
  },

  imgIconFlex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    // alignSelf: "center",
    marginTop: 10,
  },

  updateProfileContainer: {
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 15,
    marginBottom: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2, // Elevation for Android
  },

  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#282C3F",
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 5,
  },

  profileNumber: {
    fontSize: 12,
    fontWeight: "300",
    color: "#535665",
    marginBottom: 10,
    // alignSelf: "flex-start",
  },

  planFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    // alignSelf: "center",
    // marginVertical: 10,
  },

  goldLinearGradient: {
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
    width: 50,
    marginRight: 10,
  },

  goldText: {
    color: "#202332",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "inter",
  },

  date: {
    fontSize: 12,
    fontWeight: "300",
    color: "#535665",
  },

  sandalProfileContainer: {
    backgroundColor: "#FFFDF1",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 10,
    marginTop: 20,
  },

  profilePercentage: {
    color: "#535665",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "inter",
    marginTop: 10,
    marginBottom: 5,
    // alignSelf: "flex-start",
  },

  percentageText: {
    color: "#535665",
    fontSize: 12,
    fontWeight: "300",
    fontFamily: "inter",
    marginBottom: 10,
    // alignSelf: "flex-start",
  },

  completeTextFlex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginVertical: 10,
    // alignSelf: "center",
    // marginVertical: 10,
  },

  completeText: {
    color: "#ED1E24",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "inter",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    // alignSelf: "flex-start",
  },
});
