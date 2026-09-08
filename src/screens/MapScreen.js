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
import useExtinguisherStatus from '../hooks/useExtinguisherStatus';
import { fetchFloorMap, convertApiFloorData } from '../services/api';

export default function MapScreen({ floor, initialRoute, onBack }) {
  const [activeRoute, setActiveRoute] = useState(initialRoute);
  const { width, height } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // API에서 받아온 층 데이터 (실패 시 null → FLOORS[floor] 폴백)
  const [apiFloorData, setApiFloorData] = useState(null);

  // 소화기 상태 실시간 (SSE)
  const { statusMap: extinguisherStatus, connected: sseConnected } = useExtinguisherStatus(floor);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  // 층 그래프 API fetch — 이미지 맵 층은 로컬 데이터 사용
  useEffect(() => {
    if (FLOORS[floor] && FLOORS[floor].useImageMap) return;
    fetchFloorMap(floor)
      .then(function(data) {
        setApiFloorData(convertApiFloorData(data, FLOORS[floor]));
        console.log('[API] floor map loaded:', floor);
      })
      .catch(function(e) {
        console.warn('[API] fetchFloorMap failed, using local data:', e.message);
      });
  }, [floor]);

  // API 데이터 우선, 없으면 하드코딩 폴백
  const floorData = apiFloorData || FLOORS[floor];

  // BLE로 현재 위치 노드 감지
  const bleEnabled = !!floorData.useImageMap;
  const { nearestNodeId, userPosition, bleStatus } = useBLELocation(bleEnabled, floorData.nodes);

  const currentNodeId = (bleEnabled && nearestNodeId) ? nearestNodeId : floorData.userNodeId;
  const currentLocation = userPosition ||
    (floorData.nodes ? (floorData.nodes[currentNodeId] || floorData.userLocation) : floorData.userLocation);

  // 정상 소화기만 필터링
  const availableExtinguishers = useMemo(() => {
    return floorData.extinguisherNodeIds.filter(function(id) {
      var status = extinguisherStatus[id];
      return !status || status === 'normal';
    });
  }, [floorData.extinguisherNodeIds, extinguisherStatus]);

  const isAtExtinguisher = availableExtinguishers.includes(String(currentNodeId));

  const exitRoutePoints = useMemo(() => {
    if (!floorData.useImageMap) return undefined;
    const path = getShortestToAny(floorData.graph, currentNodeId, floorData.exitNodeIds);
    return path ? path.map((id) => floorData.nodes[id]) : [];
  }, [floorData, currentNodeId]);

  const extinguisherRoutePoints = useMemo(() => {
    if (!floorData.useImageMap) return undefined;
    // 현재 노드가 소화기면 path=[currentNodeId](길이 1) → FloorMap에서 선 안 그림
    const path = getShortestToAny(floorData.graph, currentNodeId, availableExtinguishers);
    return path ? path.map((id) => floorData.nodes[id]) : [];
  }, [floorData, currentNodeId, availableExtinguishers]);

  const mapWidth = width;
  const imageRatio = floorData.useImageMap
    ? (floorData.imageRatio || (4096 / 3072))
    : (floorData.mapRatio || 1);
  const maxMapHeight = height - 200;
  const mapHeight = Math.min(mapWidth * imageRatio, maxMapHeight);

  const routeLabel =
    activeRoute === 'exit' ? '🚪 출구 경로'
    : activeRoute === 'extinguisher'
      ? (isAtExtinguisher ? '🧯 현재 위치에 소화기 있음' : '🧯 소화기 경로')
    : isAtExtinguisher
      ? '🗺️ 출구(초록) · 현재 위치에 소화기 있음(파랑)'
      : '🗺️ 출구(초록) · 소화기(파랑) 전체 경로';

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
            currentNodeId={currentNodeId}
            extinguisherStatus={extinguisherStatus}
          />
        </ScrollView>

        {/* 지도 왼쪽 상단 오버레이 — ScrollView 밖이라 줌해도 고정 */}
        <View style={[styles.mapOverlay, { backgroundColor: bannerColor }]}>
          <Text style={styles.mapOverlayText}>{routeLabel}</Text>
        </View>
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
  mapOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.emergency,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    maxWidth: '60%',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapOverlayText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
  mapWrapper: {
    flex: 1,
  },
  mapContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
