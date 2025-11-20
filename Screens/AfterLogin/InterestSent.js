import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal
} from "react-native";
import { SuggestedProfiles } from "../../Components/HomeTab/SuggestedProfiles";
import { InterestSentCard } from "../../Components/DashBoardTab/InterestSent/InterestSentCard";
import { getInterestsListCount } from "../../CommonApiCall/CommonApiCall"; // Update import path
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";

export const InterestSent = () => {
  const navigation = useNavigation();
  const [count, setCount] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false); // false = datetime, true = profile_id
  const [isLoading, setIsLoading] = useState(false);
  const sortBy = isEnabled ? "profile_id" : "datetime";
  console.log("interest sent sortBy", sortBy)

  const toggleSwitch = async () => {
    setIsLoading(true);
    try {
      // Simulate the time it takes to fetch/update data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEnabled(previousState => !previousState);
    } catch (error) {
      console.error('Error toggling sort:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const fetchedProfiles = await getInterestsListCount();
        setCount(fetchedProfiles.myint_count || 0);
      } catch (error) {
        console.log("Error fetching wishlist count:", error);
        setCount(0);
      }
    };
    fetchProfiles();
  }, []);
  return (
    // <ScrollView>
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ED1E24" />
        </TouchableOpacity>
        <Text style={styles.headerText}> Interest Sent<Text style={styles.profileId}> ({count})</Text></Text>
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>
          Sort by: {isEnabled ? "Profile ID" : "Date"}
        </Text>
        <Switch
          trackColor={{ false: '#767577', true: '#7f0909ff' }}
          thumbColor={isEnabled ? '#e80909ff' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isEnabled}
          disabled={isLoading}
        />
      </View>

      {/* Loading Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isLoading}
      >
        <View style={styles.loaderContainer}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#ED1E24" />
            <Text style={styles.loaderText}>Updating...</Text>
          </View>
        </View>
      </Modal>

      {/* <View style={styles.contentContainer}>
        <Text style={styles.profileName}>
           Interest Sent
          <Text style={styles.profileId}> ({count})</Text>
        </Text>
      </View> */}

      <View style={styles.cardContainer}>
        <InterestSentCard sortBy={sortBy} />
      </View>
       <BottomTabBarComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    paddingBottom: 80,
    // alignItems: "center",
    // justifyContent: "center",
  },
  headerContainer: {
    padding: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginLeft: 10,
  },
  headerText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  contentContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },

  profileCardContainer: {
    width: "100%",
  },

  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#282C3F",
    fontFamily: "inter",
    // marginBottom: 10,
    paddingTop: 10,
  },

  profileId: {
    fontSize: 14,
    color: "#85878C",
  },

  day: {
    color: "#85878C",
    fontSize: 12,
    fontWeight: "700",
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "600",
    color: "#282C3F",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  cardContainer: {
    width: "100%",
  },
  loaderBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#282C3F",
  },
});
