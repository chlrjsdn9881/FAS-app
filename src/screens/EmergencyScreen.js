import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { COLORS } from '../constants/colors';

// Intermediate screen: user picks action (exit or extinguisher)
export default function EmergencyScreen({ floor, onSelectAction, onChangeFloor }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.emergency} />

      <View style={styles.header}>
        <Text style={styles.alertLabel}>🔥 화재 발생</Text>
        <TouchableOpacity onPress={onChangeFloor} style={styles.floorBadge}>
          <Text style={styles.floorText}>{floor} ▾</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        <Text style={styles.instruction}>대피 또는 소화기를 선택하세요</Text>
        <Text style={styles.sub}>Choose your action</Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.exitButton]}
          onPress={() => onSelectAction('exit')}
          activeOpacity={0.85}
        >
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={styles.actionLabel}>출구 찾기</Text>
          <Text style={styles.actionDesc}>가장 가까운 비상구로 안내합니다</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.extButton]}
          onPress={() => onSelectAction('extinguisher')}
          activeOpacity={0.85}
        >
          <Text style={styles.actionIcon}>🧯</Text>
          <Text style={styles.actionLabel}>소화기 찾기</Text>
          <Text style={styles.actionDesc}>가장 가까운 소화기로 안내합니다</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>⚠️ 엘리베이터 사용 금지 · Do not use elevator</Text>
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
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertLabel: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  floorBadge: {
    backgroundColor: COLORS.emergencyDark,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  floorText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  instruction: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  actionButton: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  exitButton: {
    backgroundColor: COLORS.buttonExit,
  },
  extButton: {
    backgroundColor: COLORS.buttonExtinguisher,
  },
  actionIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  actionLabel: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  actionDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderTopWidth: 1,
    borderTopColor: '#FFE0B2',
  },
  footerText: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '600',
  },
});
