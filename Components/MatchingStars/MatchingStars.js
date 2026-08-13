import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../Reusable/Theme'; // adjust path

const MatchingStars = ({ matchCountValue, starAndRasi, selectedStarIds, onCheckboxChange }) => {
  const handleCheckboxChange = (id, checked) => {
    if (checked) {
      const item = starAndRasi.find(item => item.id === id);
      if (item && !selectedStarIds.some(selected => selected.id === id)) {
        const newItem = {
          id: item.id,
          rasi: item.matching_rasiId || '',
          star: item.matching_starId || '',
          label: `${item.matching_starname || ''} - ${item.matching_rasiname || ''}`,
        };
        onCheckboxChange([...selectedStarIds, newItem]);
      }
    } else {
      const updatedSelections = selectedStarIds.filter(selected => selected.id !== id);
      onCheckboxChange(updatedSelections);
    }
  };

  const allSelected =
    starAndRasi.length > 0 &&
    starAndRasi.every(item =>
      selectedStarIds.some(selected => selected.id === item.id)
    );

  const handleSelectAllCheckbox = () => {
    const unselectedItems = starAndRasi.filter(
      item => !selectedStarIds.some(selected => selected.id === item.id)
    );

    if (unselectedItems.length > 0) {
      const newSelections = unselectedItems.map(item => ({
        id: item.id,
        rasi: item.matching_rasiId || '',
        star: item.matching_starId || '',
        label: `${item.matching_starname || ''} - ${item.matching_rasiname || ''}`,
      }));
      const updatedSelections = [...selectedStarIds, ...newSelections];
      onCheckboxChange(updatedSelections);
    } else {
      const filteredSelections = selectedStarIds.filter(
        selected => !starAndRasi.some(item => item.id === selected.id)
      );
      onCheckboxChange(filteredSelections);
    }
  };

  // Render a single checkbox with label
  // Added `isHeader` param to apply different text style
  const renderCheckbox = (id, label, checked, onChange, isHeader = false) => (
    <View key={id} style={styles.checkboxItem}>
      <Pressable
        style={[styles.checkboxBase, checked && styles.checkboxChecked]}
        onPress={() => onChange(id, !checked)}
      >
        {checked && <Ionicons name="checkmark" size={14} color="white" />}
      </Pressable>
      <Pressable onPress={() => onChange(id, !checked)}>
        <Text style={isHeader ? styles.headerLabel : styles.checkboxLabel}>
          {label}
        </Text>
      </Pressable>
    </View>
  );

  const headingLabel =
    matchCountValue === 0
      ? 'Unmatching Stars'
      : matchCountValue === 15
      ? 'Yega Porutham'
      : `Matching Stars (${matchCountValue} Poruthams)`;

  return (
    <View style={styles.container}>
      {/* Group header with select-all */}
      <TouchableOpacity
        style={styles.groupHeader}
        onPress={handleSelectAllCheckbox}
        activeOpacity={0.7}
      >
        {renderCheckbox(
          'selectAll',
          headingLabel,
          allSelected,
          (id, checked) => handleSelectAllCheckbox(),
          true // <- this is the header → applies larger/bold style
        )}
      </TouchableOpacity>

      {/* Individual star checkboxes */}
      {starAndRasi.map(item =>
        renderCheckbox(
          item.id,
          `${item.matching_starname} - ${item.matching_rasiname}`,
          selectedStarIds.some(selected => selected.id === item.id),
          handleCheckboxChange,
          false // regular checkbox
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  groupHeader: {
    marginBottom: 6,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxBase: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E4E4E7',
    backgroundColor: 'transparent',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary || '#BD1225',
    borderColor: Colors.primary || '#BD1225',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#3F3F46',
    flexShrink: 1,
  },
  headerLabel: {
    fontSize: 16,        // slightly larger
    fontWeight: '700',   // bold
    color: '#3F3F46',
    flexShrink: 1,
  },
});

export default MatchingStars;