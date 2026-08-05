import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const isSmall = width < 360;
export const isMedium = width >= 360 && width < 414;
export const isLarge = width >= 414;
export const rs = (small, medium, large) => (isSmall ? small : isMedium ? medium : large);

export const Colors = {
  primary: "#B72024",
  primaryGradientStart: "#A00014",
  primaryGradientEnd: "#4A000A",
  primaryLight: "#FF4050",
  secondaryGold: "#E2B13C",
  goldContainer: "#FCECB6",
  background: "#FAF6F0",
  cardBackground: "#FFFFFF",
  textDark: "#1E1E1E",
  textMuted: "#71717A",
  border: "#E4E4E7",
  chipActiveBg: "#FDE68A",
  chipActiveText: "#78350F",
  chipInactiveBg: "#F4F4F5",
  chipInactiveText: "#71717A",
  iconContainerBg: "#FEE2E2",
  selectedBg: "#F6EFE5",
};

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.selectedBg,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: rs(12, 16, 20),
    marginHorizontal: rs(12, 16, 20),
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    backgroundColor: Colors.secondaryGold,
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
});