import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NotificationsCard } from "../Components/Notifications/NotificationsCard";
import { Colors } from "../Reusable/Theme";

export const Notifications = () => {
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <NotificationsCard />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cardBackground || "#FFFFFF",
  },
});