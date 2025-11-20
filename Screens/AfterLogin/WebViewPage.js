// WebViewPage
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from 'react-native-webview';
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarComponent } from "../../Navigation/ReuseTabNavigation";

export const WebViewPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { url, title } = route.params;
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button and Title */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ED1E24" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {loading && (
        <ActivityIndicator size="large" color="#BD1225" />
      )}
      <WebView
        source={{ uri: url }}
        onLoadEnd={() => setLoading(false)}
        style={{ flex: 1 }}
      />
      <BottomTabBarComponent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    elevation: 3, // Add shadow for Android
  },
  backButton: {
    color: '#BD1225',
    fontSize: 16,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#282C3F',
    marginLeft: 40
  },
});
