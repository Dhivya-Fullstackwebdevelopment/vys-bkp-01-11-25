import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
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
  MaterialIcons,
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
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [profileId, setProfileId] = useState("");
  const onEndReachedCalledDuringMomentum = useRef(true);

  useEffect(() => {
    const loadProfileHeader = async () => {
      try {
        const img = await AsyncStorage.getItem("profile_image");
        const id = await AsyncStorage.getItem("loginuser_profileId");

        setProfileImage(img || "");
        setProfileId(id || "");
      } catch (error) {
        console.log("Profile header error:", error);
      }
    };

    loadProfileHeader();
  }, []);

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

  const confirmClearAll = async () => {
    setClearing(true);
    await clearAllNotificationsAPI();
    setClearing(false);
    setClearModalVisible(false);
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
            Toast.show({ type: "error", text1: "Error", text2: "Chat details not found." });
          }
        } else {
          Toast.show({ type: "error", text1: "Error", text2: chatListResponse.data.message || 'Chat list not found' });
        }
      } else {
        Toast.show({ type: "error", text1: "Error", text2: response.data.Message || 'Chat room not created' });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || 'Failed to start chat' });
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
      Toast.show({ type: "error", text1: "Error", text2: "Failed to load notifications" });
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

  useEffect(() => {
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

          {/* LEFT - TITLE */}
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              Notifications
              {totalRecords > 0 && (
                <Text style={styles.headerCount}>
                  {" "}({totalRecords})
                </Text>
              )}
            </Text>
          </View>

          {/* RIGHT - PROFILE + CLEAR ALL */}
          <View style={styles.headerRightSection}>

            {/* Profile Image + ID */}
            <View style={styles.profileHeader}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileHeaderImage}
                />
              ) : (
                <View style={styles.profileIconCircle}>
                  <Ionicons
                    name="person"
                    size={15}
                    color={Colors.primary || "#A00014"}
                  />
                </View>
              )}

              <Text
                style={styles.profileHeaderId}
                numberOfLines={1}
              >
                {profileId || "Profile"}
              </Text>
            </View>

            {/* Clear All */}
            {totalRecords > 0 && (
              <TouchableOpacity
                onPress={() => setClearModalVisible(true)}
                style={styles.clearAllBtn}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="reload-outline"
                  size={14}
                  color="#FFFFFF"
                />

                <Text style={styles.clearAllText}>
                  Clear All
                </Text>
              </TouchableOpacity>
            )}

          </View>

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

      {/* CUSTOM CLEAR ALL MODAL */}
      <Modal
        visible={clearModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setClearModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRing}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="trash-outline" size={26} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.modalTitle}>Clear All Notifications?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to remove all notifications? This action cannot be undone.
            </Text>

            <View style={styles.modalGoldRule} />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setClearModalVisible(false)}
                activeOpacity={0.8}
                disabled={clearing}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={confirmClearAll}
                activeOpacity={0.85}
                disabled={clearing}
              >
                {clearing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Clear All</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    lineSpacing: -1,
  },

  headerCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.75)",
  },
  headerRightSection: {
    minWidth: 105,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 8,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 7,
  },
  profileHeaderImage: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    marginRight: 5,
  },
  profileIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },

  profileHeaderId: {
    maxWidth: 65,
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "right",
  },

  clearAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "transparent",
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderWidth: 0,
    gap: 4,
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

  // MODAL POPUP STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    width: "85%",
    maxWidth: 320,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.iconContainerBg || "rgba(255, 219, 214, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary || "#A00014",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textDark || "#1E1E1E",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    marginBottom: 8,
    textAlign: "center",
  },
  modalBody: {
    fontSize: 13.5,
    color: Colors.textMuted || "#71717A",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 6,
  },
  modalGoldRule: {
    marginTop: 16,
    marginBottom: 20,
    height: 2,
    width: 44,
    borderRadius: 2,
    backgroundColor: Colors.gold || "#E2B13C",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.chipInactiveBg || "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: Colors.textDark || "#1E1E1E",
    fontSize: 14,
    fontWeight: "700",
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary || "#A00014",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});