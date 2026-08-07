import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../Reusable/Theme';

const tabs = [
  {
    name: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
    route: 'HomeWithToast',
  },
  {
    name: 'Search',
    activeIcon: 'search',
    inactiveIcon: 'search-outline',
    route: 'Search',
  },
  {
    name: 'DashBoard',
    activeIcon: 'grid',
    inactiveIcon: 'grid-outline',
    route: 'DashBoard',
  },
  {
    name: 'Alerts',
    activeIcon: 'notifications',
    inactiveIcon: 'notifications-outline',
    route: 'Notifications',
  },
  {
    name: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
    route: 'Menu',
  },
];

export const BottomTabBarComponent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const activeRouteName = route.name;

  return (
    <View
      style={[
        barStyles.tabContainer,
        { paddingBottom: Math.max(insets.bottom, 6) },
      ]}
    >
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
            {/* Pill: h-8 (32px) w-16 (64px) rounded-full */}
            <View style={[barStyles.iconPill, isActive && barStyles.activeIconPill]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.inactiveIcon}
                size={18}
                color={
                  isActive
                    ? Colors.onPrimaryContainer ?? "#5c3d00"
                    : Colors.textMuted
                }
              />
            </View>

            {/* Label: text-[11px] font-medium */}
            <Text
              style={[
                barStyles.tabLabel,
                { color: isActive ? Colors.textDark : Colors.textMuted },
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
    backgroundColor: Colors.footerbg ?? '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    paddingTop: 6,          // pt-1.5
    paddingHorizontal: 4,   // px-1
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,   // py-1.5
    gap: 4,               // gap-1
  },
  iconPill: {
    width: 64,            // w-16
    height: 32,           // h-8
    borderRadius: 16,     // rounded-full
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeIconPill: {
    backgroundColor: Colors.primaryContainer ?? '#FDE8E8',  // bg-primary-container
  },
  tabLabel: {
    fontSize: 11,         // text-[11px]
    fontWeight: '500',    // font-medium
  },
});