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
import { useNavigation } from '@react-navigation/native';
import config from '../../API/Apiurl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BottomTabBarComponent } from '../../Navigation/ReuseTabNavigation';

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
            const profileId = await AsyncStorage.getItem("loginuser_profileId");

            try {
              // **TODO: Implement your actual Clear All Notifications API call here**
              // Example API call (replace endpoint as needed):
              // await axios.post(`${config.apiUrl}/auth/Clear_all_notifications/`, { profile_id: profileId });

              // On success, update state and refresh the list
              setNotifications([]);
              setTotalRecords(0);
              setCurrentPage(1);
              setHasMore(false);
              Alert.alert('Success', 'All notifications cleared.');
              // You might want to call getNotifications(1, true) here if you have a separate API for marking all as read/cleared
            } catch (error) {
              console.error('Clear Notifications Error:', error);
              Alert.alert('Error', 'Failed to clear notifications.');
            } finally {
              setLoading(false);
            }
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

  useEffect(() => {
    getNotifications(1, true);
  }, []);

  useEffect(() => {
    // Custom component for the Clear All button
    const ClearAllButton = () => (
      <TouchableOpacity
        // onPress={handleClearNotifications}
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

        {item.notification_type === 'express_interests' || item.notification_type === 'express_interests_accept' ? (
          <TouchableOpacity
            onPress={() => handleMessage(item.from_profile_id)}
            style={{
              marginTop: 8,
              padding: 6,
              borderWidth: 1,
              borderColor: '#E91E63',
              borderRadius: 5,
            }}
          >
            <Text style={{ color: '#E91E63', textAlign: 'center', fontSize: 14 }}>
              Message
            </Text>
          </TouchableOpacity>
        ) : item.notification_type === 'Profile_update' ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileDetails', { viewedProfileId: item.from_profile_id })}
            style={{
              marginTop: 8,
              padding: 6,
              borderWidth: 1,
              borderColor: '#E91E63',
              borderRadius: 5,
            }}
          >
            <Text style={{ color: '#E91E63', textAlign: 'center', fontSize: 14 }}>
              View Profile
            </Text>
          </TouchableOpacity>
        ) : item.notification_type === 'photo_request' ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('MyProfile')}
            style={{
              marginTop: 8,
              padding: 6,
              borderWidth: 1,
              borderColor: '#E91E63',
              borderRadius: 5,
            }}
          >
            <Text style={{ color: '#E91E63', textAlign: 'center', fontSize: 14 }}>
              Update Photo
            </Text>
          </TouchableOpacity>
        ) : null}
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
