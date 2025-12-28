import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import config from '../../API/Apiurl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BottomTabBarComponent } from '../../Navigation/ReuseTabNavigation';
import Toast from "react-native-toast-message";

export const NotificationsCard = () => {
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const onEndReachedCalledDuringMomentum = useRef(true);

  const clearAllNotificationsAPI = async () => {
    const profileId =
      (await AsyncStorage.getItem("loginuser_profileId")) ||
      (await AsyncStorage.getItem("profile_id_new"));
    console.log("clear all profileId params ", profileId)
    try {
      const response = await axios.post(
        `${config.apiUrl}/auth/Clear_notifications/`,
        {
          profile_id: profileId
        }
      );

      console.log("Clear All API Response:", response.data);

      if (response.data.Status === 1) {
        // Alert.alert("Success", "All notifications cleared.");
        Toast.show({
          type: "success",
          text1: "All notifications cleared.",
          // text2: "Profile has been saved to bookmarks.",
          position: "bottom",
        });
      } else {
        // Alert.alert("Info", response.data.message || "No unread notifications found");
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message,
        });
      }
      getNotifications(1, true);

      // After clearing update UI
      // setNotifications([]);
      // setTotalRecords(0);
      // setHasMore(false);

    } catch (error) {
      console.error("Clear All Error:", error);
      // Alert.alert("Error", "Failed to clear notifications.");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to clear notifications."
      });
    }
  };

  const handleClearNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          onPress: async () => {
            setLoading(true);

            // 🔥 Call API here
            await clearAllNotificationsAPI();

            setLoading(false);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleMessage = async (fromProfileId) => {
    const profileId = await AsyncStorage.getItem("loginuser_profileId");
    try {
      console.log('Starting chat creation with profileId:', profileId, 'and fromProfileId:', fromProfileId);
      const response = await axios.post(`${config.apiUrl}/auth/Create_or_retrievechat/`, {
        profile_id: profileId,
        profile_to: fromProfileId,
      });

      console.log('Create/retrieve chat response:', response.data);
      if (response.data.status === 1) {
        const room_id_name = response.data.room_id_name;
        console.log('Room ID received:', room_id_name);

        const chatListResponse = await axios.post(`${config.apiUrl}/auth/Get_user_chatlist/`, {
          profile_id: profileId,
        });

        console.log('Chat list response:', chatListResponse.data);
        if (chatListResponse.data.status === 1) {
          const profileData = chatListResponse.data.data.find(
            (item) => item.room_name_id === room_id_name
          );

          console.log('Found profile data:', profileData);
          const selectedProfileData = {
            room_name_id: profileData.room_name_id,
            profile_image: profileData.profile_image,
            profile_user_name: profileData.profile_user_name,
            profile_lastvist: profileData.profile_lastvist,
          };

          await AsyncStorage.setItem('selectedProfile', JSON.stringify(selectedProfileData));
          console.log('Navigating to Messages screen');
          navigation.navigate('Message');
        } else {
          Alert.alert('Error', chatListResponse.data.message || 'Chat list not found');
        }
      } else {
        Alert.alert('Error', response.data.Message || 'Chat room not created');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start chat');
    }
  };

  const getNotifications = async (page = 1, shouldRefresh = false) => {
    if ((loading && shouldRefresh) || (isLoadingMore && !shouldRefresh)) return;

    if (shouldRefresh) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    const profileId = await AsyncStorage.getItem("loginuser_profileId");

    try {
      const response = await axios.post(`${config.apiUrl}/auth/Get_notification_list/`, {
        profile_id: profileId,
        per_page: 10,
        page_number: page,
      });
      console.log("Get_notification_list/", response)
      const newNotifications = response?.data?.data ?? [];
      const total = response?.data?.total_records ?? 0;

      if (shouldRefresh) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }

      setTotalRecords(total);
      setCurrentPage(page);
      setHasMore(page * 10 < total);
    } catch (error) {
      console.error('Notification Error:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };


  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      getNotifications(1, true);
      return () => {
      };
    }, [])
  );

  useEffect(() => {
    // Custom component for the Clear All button
    const ClearAllButton = () => (
      <TouchableOpacity
        onPress={handleClearNotifications}
        // Use inline styles to match the desired web button look:
        // className="bg-main text-white text-xs font-semibold px-3 py-1 rounded-md shadow hover:opacity-90"
        style={{
          backgroundColor: '#E91E63', // Main color
          paddingHorizontal: 12, // px-3 (adjusted for RN)
          paddingVertical: 5,   // py-1 (adjusted for RN)
          marginRight: 10,      // Right padding/margin in the header
          borderRadius: 6,      // rounded-md
          // Simulating shadow/elevation for cross-platform consistency
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,
          elevation: 3,
          opacity: loading ? 0.6 : 1, // Simulate hover/disabled state
        }}
        disabled={loading} // Disable the button while API is processing
      >
        <Text
          style={{
            color: 'white',
            fontSize: 12, // text-xs
            fontWeight: '600', // font-semibold
          }}
        >
          Clear All
        </Text>
      </TouchableOpacity>
    );

    navigation.setOptions({
      // Keep the dynamic title
      headerTitle: `Notifications (${totalRecords})`,
      // Add the button to the right side of the header
      headerRight: () => (
        // Only show the button if there are notifications to clear
        totalRecords > 0 ? <ClearAllButton /> : null
      ),
    });
  }, [totalRecords, navigation, loading]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      getNotifications(currentPage + 1, false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    getNotifications(1, true);
  };

  const handleUpdatePhoto = () => {
    navigation.navigate('MyProfile');
  };
  useEffect(() => {
    // Update the header title when totalRecords changes
    navigation.setOptions({
      headerTitle: `Notifications (${totalRecords})`,
    });
  }, [totalRecords, navigation]);

  const markNotificationRead = async (notificationId) => {
    const profileId = await AsyncStorage.getItem("loginuser_profileId");
    console.log("clear all profileId, notification id  params ", profileId, notificationId)
    try {
      const response = await axios.post(
        `${config.apiUrl}/auth/Read_notifications_induvidual/`,
        {
          profile_id: profileId,
          notification_id: notificationId,
        }
      );

      console.log("individual Read Notification Response:", response.data);

      if (response.data.Status === 1) {
        console.log("Notification updated successfully");
        getNotifications(1, true);
      }
    } catch (error) {
      console.error("Read Notification Error:", error);
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#fff0f0',
        padding: 12,
        marginBottom: 10,
        borderRadius: 8,
        elevation: 2,
      }}
    >
      <Image
        source={{ uri: item.profile_image }}
        style={{ width: 60, height: 60, borderRadius: 30, marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.message_titile}</Text>
        <Text style={{ fontSize: 14 }}>{item.from_profile_id} {item.to_message}</Text>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 5 }}>{item.time_ago}</Text>

        {item.notification_type === "express_interests_accept" ? (
          <TouchableOpacity
            onPress={() => handleMessage(item.from_profile_id)}
            style={buttonStyle}
          >
            <Text style={buttonText}>Message</Text>
          </TouchableOpacity>

        ) : item.notification_type === "Profile_update" ||
          item.notification_type === "express_interests" ? (

          <TouchableOpacity
            onPress={async () => {
              await markNotificationRead(item.id);
              navigation.navigate("ProfileDetails", {
                viewedProfileId: item.from_profile_id,
              });
            }}
            style={buttonStyle}
          >
            <Text style={buttonText}>View Profile</Text>
          </TouchableOpacity>

        ) : item.notification_type === "Call_request" ||
          item.notification_type === "Vys_assists" ? (

          null   // ❌ NO BUTTON

        ) : (

          <TouchableOpacity
            onPress={() => navigation.navigate("MyProfile")}
            style={buttonStyle}
          >
            <Text style={buttonText}>Update Photo</Text>
          </TouchableOpacity>
        )}

      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  };

  if (!loading && notifications.length === 0 && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
        <Text style={{ fontSize: 18, color: '#666', fontWeight: '500' }}>
          No notifications found
        </Text>
        <BottomTabBarComponent />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f0f0', paddingBottom: 80 }}>
      {/* <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
          Notifications ({totalRecords})
        </Text>
      </View> */}

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() => {
          if (!onEndReachedCalledDuringMomentum.current && hasMore) {
            handleLoadMore();
            onEndReachedCalledDuringMomentum.current = true;
          }
        }}
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentum.current = false;
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ padding: 16 }}
      />

      {!loading && !isLoadingMore && notifications.length >= totalRecords && notifications.length > 0 && (
        <Text style={{ textAlign: 'center', color: '#999', marginTop: 10, padding: 16 }}>
          You have reached the end of notifications
        </Text>
      )}
      <BottomTabBarComponent />
    </View>
  );
};

const buttonStyle = {
  marginTop: 8,
  padding: 6,
  borderWidth: 1,
  borderColor: '#E91E63',
  borderRadius: 5,
};

const buttonText = {
  color: '#E91E63',
  textAlign: 'center',
  fontSize: 14,
};
