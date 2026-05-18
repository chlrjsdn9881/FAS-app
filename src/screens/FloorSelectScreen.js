import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/colors';

const FLOOR_OPTIONS = ['B1', '1F', '2F', '3F', '4F', '5F'];

export default function FloorSelectScreen({ onSelectFloor }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.emergency} />

      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🔥</Text>
        <Text style={styles.headerTitle}>화재 비상 안내</Text>
        <Text style={styles.headerSub}>Fire Emergency Guide</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.question}>현재 층을 선택하세요</Text>
        <Text style={styles.hint}>Select your current floor</Text>

        <View style={styles.grid}>
          {FLOOR_OPTIONS.map((floor) => (
            <TouchableOpacity
              key={floor}
              style={styles.floorButton}
              onPress={() => onSelectFloor(floor)}
              activeOpacity={0.7}
            >
              <Text style={styles.floorLabel}>{floor}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>침착하게 행동하세요 · Stay calm</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.emergency,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    marginTop: 4,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  floorButton: {
    width: '42%',
    aspectRatio: 1.4,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: COLORS.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floorLabel: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.emergency,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
