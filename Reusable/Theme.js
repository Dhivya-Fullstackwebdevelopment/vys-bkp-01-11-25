import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const isSmall = width < 360;
export const isMedium = width >= 360 && width < 414;
export const isLarge = width >= 414;
export const rs = (small, medium, large) => (isSmall ? small : isMedium ? medium : large);

export const Colors = {
  // Primary — Vysyamala red (oklch(0.505 0.185 26))
  primary: "#B72024",
  primaryForeground: "#FAFAFA",
  primaryContainer: "#E8D5D6",
  onPrimaryContainer: "#3D0A0E",
  matchingcirclecolor: "#64181F",
  
  // Secondary — deep maroon (oklch(0.34 0.108 20))
  secondary: "#4A1A2E",
  secondaryForeground: "#F8F4F2",
  secondaryContainer: "#F2DEAC",
  onSecondaryContainer: "#5D4220",
  
  // Accent — logo gold (oklch(0.76 0.135 85))
  gold: "#E2B13C",
  accent: "#F2DEAC",
  accentForeground: "#5D4220",
  
  // Backgrounds — warm ivory theme
  background: "#FAF6F0",
  foreground: "#1E1E1E",
  surface: "#FAF6F0",
  surface1: "#F6EFE5",
  surface2: "#F2E8DA",
  surface3: "#E8D5CA",
  footerbg: "#F7EFE6",
  
  // Cards
  card: "#FFFFFF",
  cardForeground: "#1E1E1E",
  
  // Text colors
  textDark: "#1E1E1E",
  textMuted: "#71717A",
  textLight: "#FFFFFF",
  
  // Borders and inputs
  border: "#E4E4E7",
  input: "#E4E4E7",
  outline: "#71717A",
  
  // Chips
  chipActiveBg: "#F2DEAC",
  chipActiveText: "#5D4220",
  chipInactiveBg: "#F4F4F5",
  chipInactiveText: "#71717A",
  
  // Containers
  iconContainerBg: "#FFDBD6",
  goldContainer: "#F2DEAC",
  selectedBg: "#FBF5ED",
  snapshotbg: "#F6EFE5",
  // Status colors
  success: "#22C55E",
  warning: "#F59E0B",
  destructive: "#EF4444",
  
  // Legacy color names for compatibility
  primaryGradientStart: "#A00014",
  primaryGradientEnd: "#4A000A",
  primaryLight: "#FF4050",
  secondaryGold: "#E2B13C",
  cardBackground: "#FFFFFF",
};

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface1,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerBanner: {
    paddingHorizontal: rs(12, 16, 20),
    paddingTop: rs(12, 16, 20),
    paddingBottom: rs(16, 20, 24),
  },
  headerTitle: {
    fontSize: rs(18, 20, 22),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: rs(12, 13, 14),
    color: "#FEE2E2",
    marginTop: 2,
  },
  goldChip: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  goldChipText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
  },
  pillTag: {
    backgroundColor: Colors.chipInactiveBg,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginTop: 4,
  },
  pillTagText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  // Design system specific styles
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textDark,
  },
  cardSectionSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusChip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusChipTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  statusChipSub: {
    fontSize: 11,
    opacity: 0.75,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  outlineButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  factCard: {
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    padding: 12,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
  },
  tabPillText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tabPillTextActive: {
    color: Colors.primaryForeground,
  },
});