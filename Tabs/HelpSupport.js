import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, rs } from "../Reusable/Theme";

export const HelpSupport = () => {
  const navigation = useNavigation();

  const contactItems = [
    {
      icon: <Ionicons name="mail" size={22} color={Colors.primary} />,
      label: "Email Us",
      value: "support@vysyamala.com",
      onPress: () => Linking.openURL("mailto:support@vysyamala.com"),
    },
    {
      icon: <Ionicons name="call" size={22} color={Colors.primary} />,
      label: "Call Us",
      value: "9944851550",
      onPress: () => Linking.openURL("tel:9944851550"),
    },
    {
      icon: <FontAwesome6 name="whatsapp" size={22} color={Colors.primary} />,
      label: "WhatsApp Us",
      value: "9944851550",
      onPress: () => Linking.openURL("whatsapp://send?phone=919944851550"),
    },
  ];

  const faqItems = [
    {
      question: "How do I upgrade my plan?",
      answer: "Go to Menu → Upgrade / Membership Plan to view and purchase available plans.",
    },
    {
      question: "How do I update my profile?",
      answer: "Go to Menu → My Profile to edit your personal, educational, and family details.",
    },
    {
      question: "How do I delete my account?",
      answer: "Go to Menu → Other Settings → Delete Account.",
    },
    {
      question: "How do I protect my photos?",
      answer: "Go to Other Settings → Photo / ID Settings and enable password protection for your images.",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Gradient Header ────────────────────────────────────────── */}
      <LinearGradient
        colors={[Colors.primaryGradientStart || "#A00014", Colors.primaryGradientEnd || "#4A000A"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBanner}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>We're here to help you</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Contact Us ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Us</Text>

          {contactItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.contactItem, index < contactItems.length - 1 && styles.contactItemBorder]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>{item.icon}</View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>{item.label}</Text>
                <Text style={styles.cardValue}>{item.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── FAQs ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>FAQs</Text>

          {faqItems.map((item, index) => (
            <View key={index} style={[styles.faqItem, index < faqItems.length - 1 && styles.faqItemBorder]}>
              <View style={styles.faqHeader}>
                <MaterialIcons
                  name="help-outline"
                  size={18}
                  color={Colors.primary}
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text style={styles.faqQuestion}>{item.question}</Text>
              </View>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        {/* ── Working Hours ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Working Hours</Text>
          <View style={styles.workingHoursRow}>
            <View style={styles.iconBox}>
              <Ionicons name="time" size={22} color={Colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Mon – Sat</Text>
              <Text style={styles.cardValue}>9:00 AM – 6:00 PM</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.selectedBg || "#FBF5ED",
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
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: rs(12, 13, 14),
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  // ── Scroll content ─────────────────────────────────────────────────────
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: rs(12, 16, 20),
    alignItems: "center",
    paddingBottom: 40,
  },
  card: {
    width: "90%",
    backgroundColor: Colors.card || "#FFFFFF",
    borderRadius: 24,
    padding: rs(18, 22, 26),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: rs(12, 16, 20),
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted || "#71717A",
    textTransform: "uppercase",
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  // ── Contact Items ──
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  contactItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#E4E4E7",
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.iconContainerBg || "#FFDBD6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.textMuted || "#71717A",
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textDark || "#1E1E1E",
    marginTop: 2,
  },
  // ── FAQ Items ──
  faqItem: {
    paddingVertical: 12,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#E4E4E7",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textDark || "#1E1E1E",
    flex: 1,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.textMuted || "#71717A",
    lineHeight: 20,
    paddingLeft: 26,
  },
  // ── Working Hours ──
  workingHoursRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  bottomSpacer: {
    height: 20,
  },
});