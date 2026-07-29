import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const tabs = [
  { name: 'Home', icon: 'home', route: 'HomeWithToast' },
  { name: 'Search', icon: 'search', route: 'Search' },
  { name: 'DashBoard', icon: 'dashboard', route: 'DashBoard' },
  { name: 'Menu', icon: 'menu', route: 'Menu' },
];

export const BottomTabBarComponent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const activeRouteName = route.name;

  return (
    <View style={[barStyles.tabContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((tab) => {
        const isActive =
          activeRouteName === tab.route ||
          (activeRouteName === 'GalleryResults' && tab.route === 'HomeWithToast');

        return (
          <TouchableOpacity
            key={tab.name}
            style={barStyles.tabButton}
            onPress={() => navigation.navigate(tab.route)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={tab.icon}
              size={24}
              color={isActive ? '#ED1E24' : '#535665'}
            />
            <Text
              style={[
                barStyles.tabLabel,
                { color: isActive ? '#ED1E24' : '#535665' },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const barStyles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
});