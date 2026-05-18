import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function EmergencyHeader({ floor }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>🔥 화재 발생</Text>
      {floor && <Text style={styles.floor}>{floor} 층</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.emergency,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  floor: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: COLORS.emergencyDark,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
