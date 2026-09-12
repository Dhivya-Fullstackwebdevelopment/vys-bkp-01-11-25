import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const vinayagarImage = require("../assets/img/vinayagar.jpg");
const VysyamalaLogo = require("../assets/img/VysyamalaLogo.png");

const WHATSAPP_NUMBER = "9043085524";
const WHATSAPP_BASE = "https://wa.me/919043085524";
const DEADLINE = new Date("2026-09-17T23:59:59+05:30").getTime();

const THEMES = [
  {
    id: "space",
    label: "SPACE",
    name: "Vinveli Vinayagar",
    desc: "Set your Vinayagar among stars, planets and glowing galaxies for a cosmic celebration.",
    icon: "rocket",
    bg: "#241046",
    accent: "#a78bfa",
  },
  {
    id: "water",
    label: "WATER",
    name: "Aqua Vinayagar",
    desc: "Flowing water, gentle waves and shimmering reflections around your decoration.",
    icon: "water",
    bg: "#0e5a73",
    accent: "#67e8f9",
  },
  {
    id: "fire",
    label: "FIRE",
    name: "Agni Vinayagar",
    desc: "Sacred flames, golden sparks and a warm divine glow lighting up your Vinayagar.",
    icon: "fire",
    bg: "#7a1d1d",
    accent: "#fca5a5",
  },
  {
    id: "sports",
    label: "SPORTS",
    name: "Vilayaattu Vinayagar",
    desc: "Stadium lights and playful energy — bring your favourite game into the decoration.",
    icon: "trophy",
    bg: "#0f5132",
    accent: "#6ee7b7",
  },
  {
    id: "music",
    label: "MUSIC",
    name: "Musical Vinayagar",
    desc: "Veena, flute, mridangam and flowing sound waves for a melodious celebration.",
    icon: "music",
    bg: "#4a154b",
    accent: "#e879f9",
  },
];

const RULES = [
  "Choose ONE theme from the five official themes.",
  "Decoration should be created by you and your family members.",
  "Video must be in Portrait Format (9:16).",
  "Video duration must be 60 seconds or less.",
  "Show the decoration process from the beginning to the completed decoration.",
  "Clearly showcase your selected theme-based decoration.",
  "Add suitable audio and creative effects if required.",
];

const STEPS = [
  { no: "01", title: "Choose ONE Theme", icon: "sparkles" },
  { no: "02", title: "Create Your Decoration", icon: "brush" },
  { no: "03", title: "Record Your Video", icon: "videocam" },
  { no: "04", title: "Submit via WhatsApp", icon: "send" },
];

function useCountdown(target) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const t = Math.floor(diff / 1000);
      setParts({
        d: Math.floor(t / 86400),
        h: Math.floor((t % 86400) / 3600),
        m: Math.floor((t % 3600) / 60),
        s: t % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return parts;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function getWhatsAppLink(theme) {
  const msg = theme
    ? `Vysyamala Vinayaga Chaturthi Competition season15\n\nSelected Theme: ${theme.label}\nTheme Name: ${theme.name}\n\nEnter your Description: ${theme.desc}\n\nEnter your Name, Gothram, City and mobile number.`
    : `Vysyamala Vinayaga Chaturthi Competition season15\n\nEnter your Theme Name:\n\nEnter your Description:\n\nEnter your Name, Gothram, City and mobile number.`;
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(msg)}`;
}

export default function VVCC2026Screen({ navigation }) {
  const countdown = useCountdown(DEADLINE);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const scrollRef = useRef(null);
  const chosen = THEMES.find((t) => t.id === selectedTheme);

  const openWhatsApp = () => Linking.openURL(getWhatsAppLink(chosen));

  return (
    <View style={{ flex: 1, backgroundColor: "#faf5ea" }}>
      <StatusBar barStyle="light-content" backgroundColor="#5c1216" />

      {/* ── Sticky Header ── */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#7a1418" />
          </TouchableOpacity>
          <Image source={VysyamalaLogo} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity style={styles.headerCta} onPress={openWhatsApp}>
            <FontAwesome5 name="whatsapp" size={13} color="#fff" />
            <Text style={styles.headerCtaText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={11} color="#ecdcb0" />
            <Text style={styles.heroBadgeText}>EXCLUSIVE FOR ARYA VYSYA COMMUNITY</Text>
          </View>

          <Text style={styles.heroTitle}>
            Vysyamala{"\n"}
            <Text style={styles.heroTitleGold}>Vinayaga Chaturthi{"\n"}</Text>
            Competition
          </Text>

          <Text style={styles.heroSeason}>MEGA SEASON 15</Text>
          <Text style={styles.heroTagline}>Devotion • Creativity • Family • Togetherness</Text>

          <Image source={vinayagarImage} style={styles.heroImage} resizeMode="cover" />

          <View style={styles.heroBtns}>
            <TouchableOpacity
              style={styles.heroBtnGold}
              onPress={() => scrollRef.current?.scrollTo({ y: 520, animated: true })}
            >
              <Text style={styles.heroBtnGoldText}>Explore 5 Themes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroBtnOutline}
              onPress={() => scrollRef.current?.scrollTo({ y: 1100, animated: true })}
            >
              <MaterialIcons name="article" size={14} color="#ecdcb0" />
              <Text style={styles.heroBtnOutlineText}>View Rules</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ONE VINAYAGAR Intro ── */}
        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            ONE VINAYAGAR.{"\n"}
            <Text style={styles.introTitleGold}>FIVE CREATIVE WORLDS.</Text>
          </Text>
          <View style={styles.divider} />
          <Text style={styles.introSub}>
            Choose ONE theme and create your unique Vinayagar Chaturthi decoration with your family.
          </Text>
        </View>

        {/* ── Themes ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHOOSE YOUR THEME</Text>
          <Text style={styles.sectionSub}>
            Select ONE of our five exciting themes and bring your imagination to life.
          </Text>

          {THEMES.map((theme) => {
            const selected = selectedTheme === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                onPress={() => setSelectedTheme(theme.id)}
                activeOpacity={0.85}
                style={[
                  styles.themeCard,
                  { backgroundColor: theme.bg },
                  selected && styles.themeCardSelected,
                ]}
              >
                <View style={[styles.themeIconBox, { borderColor: theme.accent + "66" }]}>
                  <FontAwesome5 name={theme.icon} size={18} color={theme.accent} />
                </View>
                <Text style={styles.themeLabel}>{theme.label}</Text>
                <Text style={styles.themeName}>{theme.name}</Text>
                <Text style={styles.themeDesc}>{theme.desc}</Text>

                <View
                  style={[
                    styles.themeSelectBtn,
                    selected
                      ? { backgroundColor: "#d9b569" }
                      : { borderWidth: 1, borderColor: theme.accent + "66" },
                  ]}
                >
                  {selected && (
                    <Ionicons name="checkmark" size={13} color="#3b0d10" style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.themeSelectText, selected && { color: "#3b0d10" }]}>
                    {selected ? "THEME SELECTED" : "SELECT THIS THEME"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {chosen ? (
            <TouchableOpacity style={styles.submitBtn} onPress={openWhatsApp} activeOpacity={0.85}>
              <FontAwesome5 name="whatsapp" size={16} color="#fff" />
              <Text style={styles.submitBtnText}>Submit with {chosen.name}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.themeHint}>Tap a theme card to select your family's theme.</Text>
          )}
        </View>

        {/* ── How To Participate ── */}
        <View style={[styles.section, { backgroundColor: "#faf5ea" }]}>
          <Text style={styles.sectionTitle}>HOW TO PARTICIPATE</Text>
          <View style={styles.stepsGrid}>
            {STEPS.map((step) => (
              <View key={step.no} style={styles.stepItem}>
                <View style={styles.stepIcon}>
                  <Ionicons name={step.icon} size={22} color="#d9b569" />
                </View>
                <Text style={styles.stepNo}>STEP {step.no}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Rules ── */}
        <View style={[styles.section, { backgroundColor: "#f3e7cf" }]}>
          <Text style={styles.sectionTitle}>RULES & REGULATIONS</Text>
          <View style={styles.rulesCard}>
            {RULES.map((rule, i) => (
              <View
                key={i}
                style={[styles.ruleRow, i === RULES.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={styles.ruleBadge}>
                  <Text style={styles.ruleBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Countdown ── */}
        <View style={[styles.section, { backgroundColor: "#faf5ea" }]}>
          <View style={styles.countdownCard}>
            <Text style={styles.countdownLabel}>LAST DATE OF SUBMISSION</Text>
            <Text style={styles.countdownDate}>17</Text>
            <Text style={styles.countdownMonth}>SEPTEMBER 2026</Text>

            <View style={styles.countdownGrid}>
              {[
                { label: "DAYS", value: countdown.d },
                { label: "HRS", value: countdown.h },
                { label: "MIN", value: countdown.m },
                { label: "SEC", value: countdown.s },
              ].map((u) => (
                <View key={u.label} style={styles.countdownUnit}>
                  <Text style={styles.countdownValue}>{pad(u.value)}</Text>
                  <Text style={styles.countdownUnitLabel}>{u.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.countdownNote}>
              Don't wait until the last day. Create, record and send your entry early!
            </Text>
          </View>
        </View>

        {/* ── Submit Section ── */}
        <View style={[styles.hero, { paddingBottom: 32 }]}>
          <Text style={[styles.sectionTitle, { color: "#fff" }]}>READY TO SHOW YOUR TALENT?</Text>
          <Text style={{ color: "rgba(255,255,255,0.75)", textAlign: "center", marginBottom: 20 }}>
            Send your competition video through WhatsApp along with your details.
          </Text>

          <View style={styles.waBox}>
            <Ionicons name="call-outline" size={18} color="#d9b569" />
            <View style={{ marginLeft: 10 }}>
              <Text style={{ color: "#ecdcb0", fontSize: 10, letterSpacing: 2 }}>WHATSAPP</Text>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                {WHATSAPP_NUMBER}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp} activeOpacity={0.85}>
            <FontAwesome5 name="whatsapp" size={18} color="#0b2e17" />
            <Text style={styles.waBtnText}>SUBMIT YOUR ENTRY</Text>
          </TouchableOpacity>

          <View style={styles.detailsBox}>
            <Text style={{ color: "#ecdcb0", fontWeight: "600", marginBottom: 10, fontSize: 13 }}>
              Please send the following details along with your video:
            </Text>
            <View style={styles.detailsGrid}>
              {["Name", "Mobile Number", "Gothram", "City"].map((d) => (
                <View key={d} style={styles.detailChip}>
                  <Text style={styles.detailChipText}>{d}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={[styles.hero, { paddingTop: 28, paddingBottom: 40 }]}>
          <Image source={VysyamalaLogo} style={{ width: 120, height: 36 }} resizeMode="contain" />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 }}>
            Online Arya Vysya Matrimonial Since 2008
          </Text>
          <View style={styles.footerDivider} />
          <Text style={{ color: "#ecdcb0", fontWeight: "700", fontSize: 13 }}>
            Vysyamala Vinayaga Chaturthi Competition
          </Text>
          <Text style={{ color: "#d9b569", fontWeight: "700", letterSpacing: 3, marginTop: 2 }}>
            MEGA SEASON 15
          </Text>
          <TouchableOpacity onPress={openWhatsApp} style={{ marginTop: 12 }}>
            <Text style={{ color: "rgba(255,255,255,0.8)", textDecorationLine: "underline" }}>
              WhatsApp {WHATSAPP_NUMBER}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontWeight: "700", marginTop: 16 }}>Team Vysyamala</Text>
          <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 2 }}>Lavanya Yathindhar</Text>
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Founder, Vysyamala</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#faf5ea", borderBottomWidth: 1, borderBottomColor: "#e8dcc0" },
  headerInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { padding: 4 },
  logo: { height: 30, width: 110 },
  headerCta: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#7a1418", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  headerCtaText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  hero: { backgroundColor: "#5c1216", padding: 24, alignItems: "center" },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "rgba(217,181,105,0.45)", backgroundColor: "rgba(217,181,105,0.12)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  heroBadgeText: { color: "#ecdcb0", fontSize: 9, fontWeight: "800", letterSpacing: 2 },
  heroTitle: { color: "#fff", fontSize: 32, fontWeight: "800", textAlign: "center", lineHeight: 40 },
  heroTitleGold: { color: "#d9b569" },
  heroSeason: { color: "#d9b569", fontSize: 14, fontWeight: "800", letterSpacing: 4, marginTop: 6 },
  heroTagline: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 6 },
  heroImage: { width: width - 80, height: (width - 80) * 1.1, borderRadius: 20, marginTop: 20, borderWidth: 1, borderColor: "rgba(217,181,105,0.35)" },
  heroBtns: { flexDirection: "row", gap: 10, marginTop: 20, flexWrap: "wrap", justifyContent: "center" },
  heroBtnGold: { backgroundColor: "#d9b569", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 30 },
  heroBtnGoldText: { color: "#3b0d10", fontWeight: "800", fontSize: 13 },
  heroBtnOutline: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "rgba(217,181,105,0.5)", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 30 },
  heroBtnOutlineText: { color: "#ecdcb0", fontWeight: "700", fontSize: 13 },

  intro: { backgroundColor: "#faf5ea", padding: 28, alignItems: "center" },
  introTitle: { fontSize: 22, fontWeight: "800", color: "#7a1418", textAlign: "center", lineHeight: 30 },
  introTitleGold: { color: "#b8873c" },
  divider: { width: 60, height: 2, backgroundColor: "#d9b569", marginVertical: 14 },
  introSub: { color: "rgba(92,20,24,0.7)", textAlign: "center", fontSize: 14, lineHeight: 22 },

  section: { backgroundColor: "#f3e7cf", padding: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#7a1418", textAlign: "center", letterSpacing: 1, marginBottom: 6 },
  sectionSub: { color: "rgba(92,20,24,0.7)", textAlign: "center", fontSize: 13, marginBottom: 18 },

  themeCard: { borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  themeCardSelected: { borderColor: "#d9b569", shadowColor: "#d9b569", shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  themeIconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" },
  themeLabel: { color: "#ecdcb0", fontSize: 10, fontWeight: "800", letterSpacing: 3, marginTop: 12 },
  themeName: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 2 },
  themeDesc: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 20, marginTop: 6 },
  themeSelectBtn: { marginTop: 14, flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  themeSelectText: { color: "#ecdcb0", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },

  submitBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#7a1418", paddingVertical: 14, borderRadius: 30, justifyContent: "center", marginTop: 6 },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  themeHint: { color: "rgba(92,20,24,0.6)", textAlign: "center", fontSize: 13, marginTop: 6 },

  stepsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 14 },
  stepItem: { width: (width - 76) / 2, alignItems: "center" },
  stepIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#7a1418", alignItems: "center", justifyContent: "center" },
  stepNo: { color: "#b8873c", fontSize: 10, fontWeight: "800", letterSpacing: 2, marginTop: 8 },
  stepTitle: { color: "#7a1418", fontSize: 13, fontWeight: "700", textAlign: "center", marginTop: 2 },

  rulesCard: { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#e8dcc0", overflow: "hidden", marginTop: 14 },
  ruleRow: { flexDirection: "row", alignItems: "flex-start", padding: 14, borderBottomWidth: 1, borderBottomColor: "#e8dcc0", gap: 12 },
  ruleBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#d9b569", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  ruleBadgeText: { color: "#3b0d10", fontWeight: "800", fontSize: 13 },
  ruleText: { color: "rgba(58,20,20,0.85)", fontSize: 13, lineHeight: 20, flex: 1 },

  countdownCard: { backgroundColor: "#5c1216", borderRadius: 24, padding: 24, alignItems: "center" },
  countdownLabel: { color: "#ecdcb0", fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  countdownDate: { color: "#d9b569", fontSize: 72, fontWeight: "800", lineHeight: 84 },
  countdownMonth: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 3 },
  countdownGrid: { flexDirection: "row", gap: 8, marginTop: 20 },
  countdownUnit: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(217,181,105,0.3)", alignItems: "center", paddingVertical: 10 },
  countdownValue: { color: "#d9b569", fontSize: 26, fontWeight: "800" },
  countdownUnitLabel: { color: "rgba(255,255,255,0.65)", fontSize: 9, fontWeight: "700", letterSpacing: 1.5, marginTop: 2 },
  countdownNote: { color: "rgba(255,255,255,0.75)", fontSize: 12, textAlign: "center", marginTop: 14, lineHeight: 18 },

  waBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(217,181,105,0.35)", backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, marginBottom: 16 },
  waBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#25D366", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30, width: "100%", justifyContent: "center" },
  waBtnText: { color: "#0b2e17", fontWeight: "800", fontSize: 14, letterSpacing: 1 },
  detailsBox: { backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(217,181,105,0.25)", padding: 16, width: "100%", marginTop: 16 },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  detailChip: { borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, width: (width - 96) / 2 },
  detailChipText: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" },

  footerDivider: { width: "60%", height: 1, backgroundColor: "rgba(217,181,105,0.3)", marginVertical: 16 },
});