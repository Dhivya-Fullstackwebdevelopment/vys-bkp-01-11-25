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
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Notifications } from "../Screens/Notifications";
import { Colors } from "../Reusable/Theme";

const Tab = createBottomTabNavigator();

export const TabNavigation = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomeWithToast"
      screenOptions={{
        // tabBarActiveTintColor: "#FF0000", // Color for active tab
        tabBarActiveTintColor: "#ed1e24", // Color for active tab
        tabBarInactiveTintColor: "#535665", // Color for inactive tab
        // tabBarInactiveTintColor: "#85878C", // Color for inactive tab
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
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
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
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
          //   tabBarActiveTintColor: "#FF0000",
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
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
          //   tabBarActiveTintColor: "#FF0000",
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
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
          //   tabBarActiveTintColor: "#FF0000",
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
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
          //   tabBarActiveTintColor: "#FF0000",
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
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
          //   tabBarActiveTintColor: "#FF0000",
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  gradient: {
    width: 30, // Adjust according to your icon size
    height: 30, // Adjust according to your icon size
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15, // Adjust according to your icon size to get a circular gradient
  },
});
