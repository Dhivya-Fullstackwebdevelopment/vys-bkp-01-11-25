import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import config from '../../API/Apiurl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { Colors } from '../../Reusable/Theme';

export const NotificationsCard = () => {
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const onEndReachedCalledDuringMomentum = useRef(true);

  const clearAllNotificationsAPI = async () => {
    const profileId =
      (await AsyncStorage.getItem("loginuser_profileId")) ||
      (await AsyncStorage.getItem("profile_id_new"));

    try {
      const response = await axios.post(
        `${config.apiUrl}/auth/Clear_notifications/`,
        { profile_id: profileId }
      );

      if (response.data.Status === 1) {
        Toast.show({
          type: "success",
          text1: "All notifications cleared.",
          position: "top",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: response.data.message || "Failed to clear notifications.",
        });
      }
      getNotifications(1, true);
    } catch (error) {
      console.error("Clear All Error:", error);
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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
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
      const response = await axios.post(`${config.apiUrl}/auth/Create_or_retrievechat/`, {
        profile_id: profileId,
        profile_to: fromProfileId,
      });

      if (response.data.status === 1) {
        const room_id_name = response.data.room_id_name;

        const chatListResponse = await axios.post(`${config.apiUrl}/auth/Get_user_chatlist/`, {
          profile_id: profileId,
        });

        if (chatListResponse.data.status === 1) {
          const profileData = chatListResponse.data.data.find(
            (item) => item.room_name_id === room_id_name
          );

          if (profileData) {
            const selectedProfileData = {
              room_name_id: profileData.room_name_id,
              profile_image: profileData.profile_image,
              profile_user_name: profileData.profile_user_name,
              profile_lastvist: profileData.profile_lastvist,
            };

            await AsyncStorage.setItem('selectedProfile', JSON.stringify(selectedProfileData));
            navigation.navigate('Message');
          } else {
            Alert.alert('Error', 'Chat details not found.');
          }
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
      const unread = response?.data?.notifiy_count ?? 0;

      if (shouldRefresh) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }

      setTotalRecords(total);
      setUnreadCount(unread);
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
    }, [])
  );

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
    try {
      const response = await axios.post(
        `${config.apiUrl}/auth/Read_notifications_induvidual/`,
        {
          profile_id: profileId,
          notification_id: notificationId,
        }
      );

      if (response.data.Status === 1) {
        getNotifications(1, true);
      }
    } catch (error) {
      console.error("Read Notification Error:", error);
    }
  };

  // Group notifications by section (Today, Yesterday, This Week, Earlier)
  const groupNotificationsByDate = (items) => {
    const groups = {
      TODAY: [],
      YESTERDAY: [],
      "THIS WEEK": [],
      EARLIER: [],
    };

    const now = new Date();
    const todayStr = now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    items.forEach((item) => {
      const createdDate = item.created_at ? new Date(item.created_at) : null;

      if (!createdDate || isNaN(createdDate.getTime())) {
        groups.EARLIER.push(item);
      } else if (createdDate.toDateString() === todayStr) {
        groups.TODAY.push(item);
      } else if (createdDate.toDateString() === yesterdayStr) {
        groups.YESTERDAY.push(item);
      } else if (createdDate > oneWeekAgo) {
        groups["THIS WEEK"].push(item);
      } else {
        groups.EARLIER.push(item);
      }
    });

    return Object.keys(groups)
      .filter((key) => groups[key].length > 0)
      .map((key) => ({
        sectionTitle: key,
        data: groups[key],
      }));
  };

  // Render Icon according to notification type
  const renderNotificationIcon = (type) => {
    const iconColor = Colors.primaryGradientStart || "#A00014";
    const iconSize = 20;

    switch (type) {
      case "express_interests":
      case "express_interests_accept":
        return <Ionicons name="heart-outline" size={iconSize} color={iconColor} />;
      case "Profile_update":
      case "Profile_views":
        return <Ionicons name="eye-outline" size={iconSize} color={iconColor} />;
      case "Matches":
      case "Porutham":
        return <Ionicons name="sparkles-outline" size={iconSize} color={iconColor} />;
      case "Membership":
      case "Renewal":
        return <FontAwesome5 name="crown" size={16} color={iconColor} />;
      case "Vys_assists":
      case "Call_request":
        return <Ionicons name="notifications-outline" size={iconSize} color={iconColor} />;
      default:
        return <Ionicons name="notifications-outline" size={iconSize} color={iconColor} />;
    }
  };

  const handleNotificationPress = async (item) => {
    if (!item.is_read) {
      await markNotificationRead(item.id);
    }

    if (item.notification_type === "express_interests_accept") {
      handleMessage(item.from_profile_id);
    } else if (
      item.notification_type === "Profile_update" ||
      item.notification_type === "express_interests"
    ) {
      navigation.navigate("ProfileDetails", {
        viewedProfileId: item.from_profile_id,
      });
    } else if (
      item.notification_type === "Call_request" ||
      item.notification_type === "Vys_assists"
    ) {
      // No navigation action
    } else {
      navigation.navigate("MyProfile");
    }
  };

  const renderSection = ({ item: section }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderTitle}>{section.sectionTitle}</Text>
      <View style={styles.cardGroup}>
        {section.data.map((item, index) => {
          const isLast = index === section.data.length - 1;
          const isUnread = item.is_read === false || item.is_read === 0;

          const titleText =
            item.message_titile && item.message_titile.trim() !== ""
              ? item.message_titile
              : item.notify_profile_name
                ? `${item.notify_profile_name}`
                : "Notification";

          const bodyText =
            [item.from_profile_id, item.to_message].filter(Boolean).join(" ") ||
            "You have a new update.";

          return (
            <TouchableOpacity
              key={item.id.toString()}
              activeOpacity={0.7}
              onPress={() => handleNotificationPress(item)}
              style={[styles.notificationRow, !isLast && styles.rowBorder]}
            >
              <View style={styles.iconCircle}>
                {renderNotificationIcon(item.notification_type)}
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.titleText} numberOfLines={1}>
                  {titleText}
                </Text>
                <Text style={styles.bodyText} numberOfLines={2}>
                  {bodyText}
                </Text>
              </View>

              <View style={styles.rightContainer}>
                <Text style={styles.timeText}>
                  {item.time_ago || "Just now"}
                </Text>
                {isUnread && <View style={styles.unreadDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const groupedData = groupNotificationsByDate(notifications);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color={Colors.primary || "#B72024"} />
      </View>
    );
  };

   if (!loading && notifications.length === 0 && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
        <Text style={{ fontSize: 18, color: '#666', fontWeight: '500' }}>
          No notifications found
        </Text>
        {/* <BottomTabBarComponent /> */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.primaryGradientStart || "#A00014"} barStyle="light-content" />

      {/* HEADER BANNER */}
      <LinearGradient
        colors={[
          Colors.primaryGradientStart || "#A00014",
          Colors.primaryGradientEnd || "#4A000A",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBanner}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              Notifications
              {totalRecords > 0 && (
                <Text style={styles.headerCount}> ({totalRecords})</Text>
              )}
            </Text>
          </View>

          {totalRecords > 0 && (
            <TouchableOpacity
              onPress={handleClearNotifications}
              style={styles.clearAllBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* MAIN CONTENT */}
      {!loading && notifications.length === 0 && !refreshing ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="notifications-off-outline" size={32} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            When you get updates, matches, or interests, they will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          renderItem={renderSection}
          keyExtractor={(item) => item.sectionTitle}
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!loading && !isLoadingMore && notifications.length >= totalRecords && notifications.length > 0 && (
        <Text style={styles.endText}>
          You have reached the end of notifications
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.selectedBg || "#FAF6F0",
  },
  headerBanner: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  clearAllBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  clearAllText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted || "#71717A",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    lineSpacing: -1,
  },
  cardGroup: {
    backgroundColor: Colors.cardBackground || "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#F0E8E0",
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.iconContainerBg || "#FFDBD6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textDark || "#1E1E1E",
    marginBottom: 3,
  },
  bodyText: {
    fontSize: 12.5,
    color: Colors.textMuted || "#71717A",
    lineHeight: 17,
  },
  rightContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 65,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted || "#71717A",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary || "#A00014",
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface2 || "#F2E8DA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textDark || "#1E1E1E",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted || "#71717A",
    textAlign: "center",
    lineHeight: 18,
  },
  endText: {
    textAlign: "center",
    color: Colors.textMuted || "#71717A",
    fontSize: 12,
    marginBottom: 20,
  },
  headerCount: {
    fontSize: 14,          // adjust as needed
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
});