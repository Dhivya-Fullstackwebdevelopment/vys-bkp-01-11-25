import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Platform,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../Reusable/Theme";

export const WebViewPage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // title and url passed via navigation params
  const { url, title } = route.params || {};

  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={Colors.primaryGradientStart || "#A00014"}
        barStyle="light-content"
      />

      {/* ── GRADIENT HEADER — same colors as app header banner ── */}
      <LinearGradient
        colors={[
          Colors.primaryGradientStart || "#A00014",
          Colors.primaryGradientEnd || "#4A000A",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBanner}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [
              styles.headerIconBtn,
              pressed && styles.headerIconBtnPressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || ""}
          </Text>

          {/* Spacer to keep title centred */}
          <View style={styles.headerIconBtn} />
        </View>
      </LinearGradient>

      {/* ── WEB CONTENT ── */}
      <View style={styles.webContainer}>
        <WebView
          source={{ uri: url }}
          style={styles.webView}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />

        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator
              size="large"
              color={Colors.primaryGradientStart || "#A00014"}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // ── HEADER ──────────────────────────────────────────────────────────────
  headerBanner: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 10 : 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  headerIconBtnPressed: {
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "left",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
    marginHorizontal: 8,
  },

  // ── WEBVIEW ──────────────────────────────────────────────────────────────
  webContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
});