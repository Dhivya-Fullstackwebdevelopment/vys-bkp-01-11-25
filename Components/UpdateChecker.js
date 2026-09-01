// Components/UpdateChecker.js
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  BackHandler,
} from 'react-native';
import Constants from 'expo-constants';

const PACKAGE_NAME = 'com.vysmala.app'; // your android package
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}`;

// Fetches latest version from Play Store (no package needed)
const fetchLatestVersion = async () => {
  try {
    const res = await fetch(
      `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}&hl=en`,
      { method: 'GET' }
    );
    const html = await res.text();

    // Play Store embeds version in a specific pattern
    const match = html.match(/\[\[\["(\d+\.\d+\.\d+)"\]\]/);
    if (match && match[1]) return match[1];

    return null;
  } catch (e) {
    console.log('Version fetch error:', e);
    return null;
  }
};

const isNewerVersion = (latest, current) => {
  const l = latest.split('.').map(Number);
  const c = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
};

export default function UpdateChecker() {
  const [showModal, setShowModal] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');

  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const check = async () => {
      const latest = await fetchLatestVersion();
      if (latest && isNewerVersion(latest, currentVersion)) {
        setLatestVersion(latest);
        setShowModal(true);
      }
    };

    check();
  }, []);

  // Prevent back button from dismissing on Android
  useEffect(() => {
    if (!showModal) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [showModal]);

  const handleUpdate = () => {
    Linking.openURL(PLAY_STORE_URL);
  };

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>🚀</Text>
          </View>

          <Text style={styles.title}>Update Available!</Text>
          <Text style={styles.subtitle}>
            A new version{' '}
            <Text style={styles.version}>v{latestVersion}</Text> is ready.{'\n'}
            You're on <Text style={styles.version}>v{currentVersion}</Text>.
          </Text>
          <Text style={styles.body}>
            Please update to enjoy the latest features, improvements, and bug fixes.
          </Text>

          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
            <Text style={styles.updateBtnText}>Update Now</Text>
          </TouchableOpacity>

          {/* Remove the button below if you want to FORCE update */}
          <TouchableOpacity
            style={styles.laterBtn}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.laterText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 36 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E1E2D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  version: {
    fontWeight: '700',
    color: '#4F46E5',
  },
  body: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 19,
  },
  updateBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  updateBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  laterBtn: {
    paddingVertical: 10,
  },
  laterText: {
    color: '#999',
    fontSize: 14,
  },
});