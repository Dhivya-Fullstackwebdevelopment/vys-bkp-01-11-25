// BottomTabBarComponent.js

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const tabs = [
    { name: 'Home', icon: 'home', route: 'HomeWithToast' }, // Map to Stack Route Name if necessary
    { name: 'Search', icon: 'search', route: 'Search' },
    { name: 'DashBoard', icon: 'dashboard', route: 'DashBoard' },
    // Include all tabs you want to show
    { name: 'Menu', icon: 'menu', route: 'Menu' },
];

export const BottomTabBarComponent = () => {
    const navigation = useNavigation();
    const route = useRoute(); // Get current route information

    const activeRouteName = route.name; // This will show 'GalleryResults'

    const handlePress = (targetRoute) => {
        // We use navigate here, but in a real app, you might need a complex 
        // navigation action (like jumpTo or navigate to a stack screen containing the tab)
        navigation.navigate(targetRoute);
    };

    // Determine the 'active' tab based on which main tab the user would likely expect to be active.
    // Since GalleryResults is not a tab, we'll keep the logic simple, 
    // or you can pass the 'source tab' as a parameter via navigation.

    return (
        <View style={barStyles.tabContainer}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.name}
                    style={barStyles.tabButton}
                    onPress={() => handlePress(tab.route)}
                >
                    <MaterialIcons
                        name={tab.icon}
                        size={24}
                        // Apply active color based on the current screen's context
                        color={
                            activeRouteName === tab.route || activeRouteName === 'GalleryResults' && tab.route === 'HomeWithToast'
                                ? '#ed1e24'
                                : '#535665'
                        }
                    />
                    <Text
                        style={[
                            barStyles.tabLabel,
                            { color: activeRouteName === tab.route ? '#ed1e24' : '#535665' }
                        ]}
                    >
                        {tab.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const barStyles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        height: 60, // Standard tab bar height
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 5,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 100,
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabLabel: {
        fontSize: 10,
        marginTop: 2,
        fontWeight: '600',
    }
});