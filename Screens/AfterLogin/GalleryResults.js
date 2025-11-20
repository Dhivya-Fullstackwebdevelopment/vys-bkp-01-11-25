// GalleryResults
import React from "react";
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { GalleryCard } from "../../Components/Gallery/GalleryCard";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";

export const GalleryResults = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ED1E24" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{"Gallery"}</Text>
      </View>

      <View style={styles.searchResultsContainer}>
        <GalleryCard />
      </View>
      <BottomTabBarComponent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    paddingBottom: 80,
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
  searchResultsContainer: {
    width: "100%",
    justifyContent: 'flex-start',
  }
});