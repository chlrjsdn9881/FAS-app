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
import useFireAlarmDetection from '../hooks/useFireAlarmDetection';

export default function StandbyScreen({ onFireDetected }) {
  var pulseAnim = useRef(new Animated.Value(1)).current;
  var pulseLoop = useRef(null);

  var { status } = useFireAlarmDetection(true, onFireDetected);

  useEffect(function() {
    if (status === 'listening') {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      if (pulseLoop.current) pulseLoop.current.stop();
      pulseAnim.setValue(1);
    }
  }, [status]);

  var statusConfig = {
    idle:      { text: '준비 중...',             sub: null,                         color: COLORS.textSecondary },
    listening: { text: '화재 경보 감지 대기 중',  sub: '경보음이 들리면 자동으로 시작합니다', color: COLORS.textSecondary },
    detected:  { text: '🔥 화재 감지됨!',        sub: null,                         color: COLORS.emergency },
    error:     { text: '마이크 권한이 필요합니다', sub: '앱 설정에서 마이크를 허용해주세요',   color: '#E65100' },
  }[status] || { text: '대기 중', sub: null, color: COLORS.textSecondary };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.body}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.icon}>
            {status === 'detected' ? '🔥' : status === 'error' ? '⚠️' : '🎙️'}
          </Text>
        </Animated.View>

        <Text style={styles.appName}>화재 대피 안내</Text>
        <Text style={[styles.statusText, { color: statusConfig.color }]}>
          {statusConfig.text}
        </Text>
        {statusConfig.sub ? (
          <Text style={styles.subText}>{statusConfig.sub}</Text>
        ) : null}

        {/* 수동 버튼 — 테스트 및 자동감지 실패 시 사용 */}
        <TouchableOpacity
          style={styles.manualButton}
          onPress={onFireDetected}
          activeOpacity={0.8}
        >
          <Text style={styles.manualButtonText}>🔥 화재 발생 (수동)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {status === 'listening'
            ? '🎙️ 마이크 감지 중 · Listening for alarm'
            : '화재 대피 안내 시스템'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  iconWrap: {
    marginBottom: 8,
  },
  icon: {
    fontSize: 80,
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  manualButton: {
    marginTop: 40,
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  manualButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
