import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FeaturedProfileCard } from './FeaturedProfiles/FeaturedProfileCard';
import { getFeaturedProfiles } from '../../CommonApiCall/CommonApiCall';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../Reusable/Theme';

const { width } = Dimensions.get('window');

export const FeaturedProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await getFeaturedProfiles();
        const validProfiles = data.filter(
          (profile) =>
            profile && typeof profile.profile_img === 'string' && profile.profile_img
        );
        setProfiles(validProfiles);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        setError('Failed to load profiles');
      }
    };

    fetchProfiles();
  }, []);

  if (!profiles || profiles.length === 0) {
    return null;
  }

  return (
    <LinearGradient
      colors={[
        '#1A0A0A',
        Colors.primaryGradientEnd || '#4A000A',
        Colors.primaryGradientStart || '#A00014',
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.decorativeOverlay}>
        <View style={[styles.glowOrb, { top: -40, right: -20 }]} />
        <View style={[styles.glowOrb, { bottom: -30, left: -10 }]} />
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.headingFlex}>
          <View style={styles.titleRow}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.starBadge}
            >
              <FontAwesome6 name="star" size={14} color="#4A000A" />
            </LinearGradient>

            <View>
              <Text style={styles.matching}>Featured Profiles</Text>
              <View style={styles.countPill}>
                <Text style={styles.matchNumber}>
                  {profiles.length} premium picks
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewAllButton}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('FeaturedOrSuggestProfiles', {
                type: 'featured',
                profiles: profiles,
              })
            }
          >
            <LinearGradient
              colors={['#FFD700', '#E8A317']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.viewAllGradient}
            >
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {profiles.length > 0 ? (
          <View style={styles.cardWrapper}>
            <FeaturedProfileCard profiles={profiles} />
          </View>
        ) : (
          <Text style={styles.errorText}>No featured profiles at the moment</Text>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  decorativeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.05)',
  },
  contentWrapper: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    position: 'relative',
    zIndex: 2,
  },
  headingFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  matching: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.3,
  },
  countPill: {
    alignSelf: 'flex-start',
    marginTop: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  matchNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  viewAllButton: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  viewAllText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardWrapper: {
    paddingHorizontal: 0,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});