import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

// Bottom action bar to switch between routes
export default function RouteToggle({ activeRoute, onSelect }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, activeRoute === 'both' && styles.activeBoth]}
        onPress={() => onSelect('both')}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>🗺️</Text>
        <Text style={[styles.label, activeRoute === 'both' && styles.activeLabel]}>
          전체
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, activeRoute === 'exit' && styles.activeExit]}
        onPress={() => onSelect('exit')}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>🚪</Text>
        <Text style={[styles.label, activeRoute === 'exit' && styles.activeLabel]}>
          출구
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, activeRoute === 'extinguisher' && styles.activeExt]}
        onPress={() => onSelect('extinguisher')}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>🧯</Text>
        <Text style={[styles.label, activeRoute === 'extinguisher' && styles.activeLabel]}>
          소화기
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 28,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  activeBoth: {
    backgroundColor: COLORS.emergency,
    borderColor: COLORS.emergency,
  },
  activeExit: {
    backgroundColor: COLORS.buttonExit,
    borderColor: COLORS.buttonExit,
  },
  activeExt: {
    backgroundColor: COLORS.buttonExtinguisher,
    borderColor: COLORS.buttonExtinguisher,
  },
  icon: {
    fontSize: 28,
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  activeLabel: {
    color: COLORS.white,
  },
});
