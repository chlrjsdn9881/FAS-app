import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { FLOORS } from '../data/floorData';
import FloorMap from '../components/FloorMap';
import RouteToggle from '../components/RouteToggle';
import { getShortestToAny } from '../utils/pathfinding';
import useBLELocation from '../hooks/useBLELocation';

export default function MapScreen({ floor, initialRoute, onBack }) {
  const [activeRoute, setActiveRoute] = useState(initialRoute);
  const { width, height } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const floorData = FLOORS[floor];

  // BLE로 현재 위치 노드 감지 (image map 층만 활성화)
  const bleEnabled = !!floorData.useImageMap;
  const { nearestNodeId, bleStatus } = useBLELocation(bleEnabled);

  // BLE로 감지된 노드가 있으면 사용, 없으면 기본값
  const currentNodeId = (bleEnabled && nearestNodeId) ? nearestNodeId : floorData.userNodeId;
  const currentLocation = floorData.nodes
    ? (floorData.nodes[currentNodeId] || floorData.userLocation)
    : floorData.userLocation;

  // BLE 노드가 바뀔 때마다 경로 재계산
  const exitRoutePoints = useMemo(() => {
    if (!floorData.useImageMap) return undefined;
    const path = getShortestToAny(floorData.graph, currentNodeId, floorData.exitNodeIds);
    return path ? path.map((id) => floorData.nodes[id]) : [];
  }, [floor, currentNodeId]);

  const extinguisherRoutePoints = useMemo(() => {
    if (!floorData.useImageMap) return undefined;
    const path = getShortestToAny(floorData.graph, currentNodeId, floorData.extinguisherNodeIds);
    return path ? path.map((id) => floorData.nodes[id]) : [];
  }, [floor, currentNodeId]);

  // 여백 없이 전체 너비, 남은 화면 높이 최대 활용
  const mapWidth = width;
  // floor_map.png 비율 3072:4096 = 0.75 (세로가 더 긺)
  const imageRatio = floorData.useImageMap ? (4096 / 3072) : 1;
  const maxMapHeight = height - 200; // header + banner + toggle 제외
  const mapHeight = Math.min(mapWidth * imageRatio, maxMapHeight);

  const routeLabel =
    activeRoute === 'both'
      ? '🗺️ 출구(초록) · 소화기(파랑) 전체 경로'
      : activeRoute === 'exit'
      ? '🚪 출구 경로'
      : '🧯 소화기 경로';

  const bannerColor =
    activeRoute === 'exit' ? COLORS.buttonExit
    : activeRoute === 'extinguisher' ? COLORS.buttonExtinguisher
    : COLORS.emergency;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.emergency} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔥 화재 발생 · {floor}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Route instruction banner */}
      <View style={[styles.routeBanner, { backgroundColor: bannerColor }]}>
        <Text style={styles.routeText}>{routeLabel}</Text>
      </View>

      {/* Map — fade-in + ScrollView 핀치 줌 */}
      <Animated.View style={[styles.mapWrapper, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.mapContent}
          minimumZoomScale={1}
          maximumZoomScale={5}
          bouncesZoom={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <FloorMap
            floorData={floorData}
            activeRoute={activeRoute}
            mapSize={{ width: mapWidth, height: mapHeight }}
            exitRoutePoints={exitRoutePoints}
            extinguisherRoutePoints={extinguisherRoutePoints}
            userLocation={currentLocation}
            bleStatus={bleStatus}
          />
        </ScrollView>
      </Animated.View>

      {/* Route toggle buttons */}
      <RouteToggle activeRoute={activeRoute} onSelect={setActiveRoute} />
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
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 38,
  },
  routeBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  routeText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  mapWrapper: {
    flex: 1,
  },
  mapContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
