import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, rs } from "../Reusable/Theme";

export const LoginHeader = () => {
  return (
    <LinearGradient
      colors={[
        Colors.primary || "#9B061B",
        Colors.primaryGradientEnd || "#52000A",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.headerGradient}
    >
      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logoBadgeContainer}>
          <Image
            style={styles.logo}
            source={require("../assets/img/VysyamalaLogo.png")}
            resizeMode="contain"
          />
        </View>

        {/* Text below logo */}
        <Text style={styles.tagline}>
          Arya Vysya Matrimonial since 2008
        </Text>

      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    width: "100%",
    minHeight: 70,           // reduced from 100
    marginLeft: -16,         // bleed left to cover default header padding
    paddingLeft: 16,
    // account for right side too — marginRight alone won't work,
    // so we over-size via minWidth instead
    minWidth: "120%",        // stretch beyond the container's insets
  },

  container: {
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,      // reduced from 12
  },

  logoBadgeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 4,      // slightly tighter
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },

  logo: {
    width: rs(100, 115, 130),   // slightly smaller to match reduced height
    height: rs(28, 32, 36),
  },

  tagline: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: rs(11, 12, 13),
    fontWeight: "600",
    textAlign: "left",
  },
});