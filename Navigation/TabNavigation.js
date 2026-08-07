import React from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import "react-native-gesture-handler";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Header } from "../Components/Header";
import { HomeWithToast } from "../Tabs/HomeWithToast";
import { Search } from "../Tabs/Search";
import { DashBoard } from "../Tabs/DashBoard";
import { Message } from "../Tabs/Message";
import { Menu } from "../Tabs/Menu";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Notifications } from "../Screens/Notifications";
import { Colors } from "../Reusable/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  const tabs = [
    { route: "Home", ionIcon: "home", label: "Home" },
    { route: "Search", ionIcon: "search", label: "Search" },
    { route: "DashBoard", ionIcon: "grid", label: "DashBoard" },
    { route: "Alerts", ionIcon: "notifications", label: "Alerts" },
    { route: "Menu", ionIcon: "person", label: "Menu" },
  ];

  return (
    <View
      style={[
        barStyles.tabContainer,
        { paddingBottom: Math.max(insets.bottom, 6) },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tabMeta = tabs.find((t) => t.route === route.name) || {
          ionIcon: "ellipse",
          label: route.name,
        };

        const iconName = isFocused
          ? tabMeta.ionIcon
          : `${tabMeta.ionIcon}-outline`;

        const iconColor = isFocused
          ? Colors.onPrimaryContainer ?? "#5c3d00"
          : Colors.textMuted ?? "#535665";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={barStyles.tabButton}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            {/* Pill: h-8 (32px) w-16 (64px) rounded-full */}
            <View
              style={[
                barStyles.iconPill,
                isFocused && barStyles.activeIconPill,
              ]}
            >
              <Ionicons name={iconName} size={18} color={iconColor} />
            </View>

            {/* Label: text-[11px] font-medium */}
            <Text
              style={[
                barStyles.tabLabel,
                {
                  color: isFocused
                    ? Colors.textDark ?? "#000000"
                    : Colors.textMuted ?? "#535665",
                },
              ]}
            >
              {tabMeta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export const TabNavigation = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomeWithToast"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: "#ed1e24",
        tabBarInactiveTintColor: "#535665",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeWithToast}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <Header name="HomeWithToast" />,
          headerStyle: { backgroundColor: "#fff" },
          headerLeft: null,
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="Search"
        component={Search}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" color={color} size={size} />
          ),
          headerTitle: () => <Header name="HomeWithToast" />,
          headerStyle: { backgroundColor: "#fff" },
          headerLeft: null,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={Notifications}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="notifications" color={color} size={size} />
          ),
          headerTitle: () => <Header name="HomeWithToast" />,
          headerStyle: { backgroundColor: "#fff" },
          headerLeft: null,
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="DashBoard"
        component={DashBoard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" color={color} size={size} />
          ),
          headerTitle: () => <Header name="HomeWithToast" />,
          headerStyle: { backgroundColor: "#fff" },
          headerLeft: null,
          headerShown: true,
        }}
      />
      {/* <Tab.Screen
        name="Message"
        component={Message}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="message" color={color} size={size} />
          ),
          headerTitle: () => <Header name="HomeWithToast" />,
          headerStyle: { backgroundColor: "#fff" },
          headerLeft: null,
          headerShown: true,
        }}
      /> */}
      <Tab.Screen
        name="Menu"
        component={Menu}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="menu" color={color} size={size} />
          ),
          headerTitle: () => <Header name="HomeWithToast" />,
          headerStyle: { backgroundColor: "#fff" },
          headerLeft: null,
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  gradient: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
  },
});

const barStyles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.footerbg ?? "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
    justifyContent: "space-between",
    alignItems: "stretch",
    paddingTop: 6,
    paddingHorizontal: 4,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 4,
  },
  iconPill: {
    width: 64,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  activeIconPill: {
    backgroundColor: Colors.iconContainerBg ?? "#FDE8E8",
    borderRadius: 16,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
});