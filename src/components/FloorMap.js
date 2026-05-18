import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, Animated } from 'react-native';
import Svg, { Rect, Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants/colors';

const FLOOR_MAP_IMAGE = require('../../assets/floor_map_clean.png');

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedCircle   = Animated.createAnimatedComponent(Circle);

export default function FloorMap({ floorData, activeRoute, mapSize, exitRoutePoints, extinguisherRoutePoints, userLocation, bleStatus }) {
  const { width, height } = mapSize;
  // userLocation prop이 있으면 우선 사용 (BLE 위치), 없으면 floorData 기본값
  const loc = userLocation || floorData.userLocation;

  // 경로 흐름 애니메이션 (dashOffset)
  const dashAnim  = useRef(new Animated.Value(0)).current;
  // 내 위치 링 펄스 애니메이션
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dash = Animated.loop(
      Animated.timing(dashAnim, { toValue: -16, duration: 900, useNativeDriver: false })
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    dash.start();
    pulse.start();
    return () => { dash.stop(); pulse.stop(); };
  }, []);

  // ── 이미지 맵 모드 ──────────────────────────────────────
  if (floorData.useImageMap) {
    const showExit = activeRoute === 'both' || activeRoute === 'exit';
    const showExt  = activeRoute === 'both' || activeRoute === 'extinguisher';
    const exitOpacity = activeRoute === 'extinguisher' ? 0.2 : 1;
    const extOpacity  = activeRoute === 'exit'         ? 0.2 : 1;

    const exitPoints = exitRoutePoints && exitRoutePoints.length > 1
      ? exitRoutePoints.map(function(p) { return p.x + ',' + p.y; }).join(' ') : null;
    const extPoints = extinguisherRoutePoints && extinguisherRoutePoints.length > 1
      ? extinguisherRoutePoints.map(function(p) { return p.x + ',' + p.y; }).join(' ') : null;

    const nodeTypes = floorData.nodeTypes || {};

    const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.75] });

    return (
      <View style={[styles.mapContainer, { width, height }]}>
        <ImageBackground source={FLOOR_MAP_IMAGE} style={{ width, height }} resizeMode="stretch">
          <Svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="none">

            {/* ── 출구 경로 (초록): 글로우 3겹 + 흐르는 선 ── */}
            {showExit && exitPoints && (
              <React.Fragment>
                <Polyline points={exitPoints} fill="none" stroke={COLORS.exitRoute}
                  strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                  opacity={exitOpacity * 0.1} />
                <Polyline points={exitPoints} fill="none" stroke={COLORS.exitRoute}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  opacity={exitOpacity * 0.22} />
                <AnimatedPolyline points={exitPoints} fill="none" stroke={COLORS.exitRoute}
                  strokeWidth="0.85" strokeDasharray="5,3" strokeDashoffset={dashAnim}
                  strokeLinecap="round" strokeLinejoin="round" opacity={exitOpacity} />
              </React.Fragment>
            )}

            {/* ── 소화기 경로 (파랑): 글로우 3겹 + 흐르는 선 ── */}
            {showExt && extPoints && (
              <React.Fragment>
                <Polyline points={extPoints} fill="none" stroke={COLORS.extinguisherRoute}
                  strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                  opacity={extOpacity * 0.1} />
                <Polyline points={extPoints} fill="none" stroke={COLORS.extinguisherRoute}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  opacity={extOpacity * 0.22} />
                <AnimatedPolyline points={extPoints} fill="none" stroke={COLORS.extinguisherRoute}
                  strokeWidth="0.85" strokeDasharray="5,3" strokeDashoffset={dashAnim}
                  strokeLinecap="round" strokeLinejoin="round" opacity={extOpacity} />
              </React.Fragment>
            )}

            {/* ── 노드 ── */}
            {Object.keys(floorData.nodes).map(function(nodeId) {
              var coord = floorData.nodes[nodeId];
              var type  = nodeTypes[nodeId] || 'extinguisher';

              if (type === 'exit') {
                return (
                  <React.Fragment key={'n' + nodeId}>
                    <Circle cx={coord.x} cy={coord.y} r={1.8} fill={COLORS.exitIcon} />
                    <Circle cx={coord.x} cy={coord.y} r={0.7} fill="white" />
                  </React.Fragment>
                );
              }
              if (type === 'corner') {
                return <Circle key={'n' + nodeId} cx={coord.x} cy={coord.y} r={0.7} fill="#444" />;
              }
              // 소화기: 속 빈 링
              return (
                <Circle key={'n' + nodeId} cx={coord.x} cy={coord.y} r={1.3}
                  fill="none" stroke={COLORS.extinguisherIcon} strokeWidth="0.45" />
              );
            })}

            {/* ── 내 위치: 펄스 링 + 솔리드 점 ── */}
            <AnimatedCircle
              cx={loc.x} cy={loc.y}
              r={2.6} fill="none"
              stroke={COLORS.userLocation} strokeWidth="0.55"
              opacity={pulseOpacity}
            />
            <Circle
              cx={loc.x} cy={loc.y}
              r={1.2} fill={COLORS.userLocation}
            />
          </Svg>
        </ImageBackground>

        {/* ── 범례 (다크 컴팩트) ── */}
        <View style={styles.legend}>
          {[
            { color: COLORS.userLocation,      label: '내 위치' },
            { color: COLORS.exitIcon,          label: '비상구'  },
            { color: COLORS.extinguisherIcon,  label: '소화기'  },
          ].map(function(item) {
            return (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // ── SVG 드로잉 모드 (기존 층) ───────────────────────────
  const routeColor  = activeRoute === 'exit' ? COLORS.exitRoute : COLORS.extinguisherRoute;
  const px = function(val) { return (val / 100) * width; };
  const py = function(val) { return (val / 100) * height; };

  const exitPts = floorData.exitRoute
    .map(function(p) { return px(p.x) + ',' + py(p.y); }).join(' ');
  const extPts  = floorData.extinguisherRoute
    .map(function(p) { return px(p.x) + ',' + py(p.y); }).join(' ');

  const showExit = activeRoute === 'both' || activeRoute === 'exit';
  const showExt  = activeRoute === 'both' || activeRoute === 'extinguisher';

  return (
    <View style={[styles.mapContainer, { width, height }]}>
      <Svg width={width} height={height}>
        {floorData.rooms.map(function(room, i) {
          return (
            <React.Fragment key={'room-' + i}>
              <Rect x={px(room.x)} y={py(room.y)} width={px(room.width)} height={py(room.height)}
                fill={COLORS.room} stroke={COLORS.wall} strokeWidth={1.5} />
              <SvgText x={px(room.x + room.width / 2)} y={py(room.y + room.height / 2)}
                textAnchor="middle" alignmentBaseline="middle" fontSize={10} fill={COLORS.textSecondary}>
                {room.label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {floorData.walls.map(function(wall, i) {
          return <Rect key={'wall-' + i} x={px(wall.x)} y={py(wall.y)}
            width={px(wall.width)} height={py(wall.height)} fill={COLORS.wall} />;
        })}

        {/* 출구 경로 */}
        {showExit && floorData.exitRoute.length > 1 && (
          <React.Fragment>
            <Polyline points={exitPts} fill="none" stroke={COLORS.exitRoute}
              strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={0.12} />
            <AnimatedPolyline points={exitPts} fill="none" stroke={COLORS.exitRoute}
              strokeWidth={3} strokeDasharray="10,5" strokeDashoffset={dashAnim}
              strokeLinecap="round" strokeLinejoin="round"
              opacity={activeRoute === 'extinguisher' ? 0.25 : 1} />
          </React.Fragment>
        )}

        {/* 소화기 경로 */}
        {showExt && floorData.extinguisherRoute.length > 1 && (
          <React.Fragment>
            <Polyline points={extPts} fill="none" stroke={COLORS.extinguisherRoute}
              strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={0.12} />
            <AnimatedPolyline points={extPts} fill="none" stroke={COLORS.extinguisherRoute}
              strokeWidth={3} strokeDasharray="10,5" strokeDashoffset={dashAnim}
              strokeLinecap="round" strokeLinejoin="round"
              opacity={activeRoute === 'exit' ? 0.25 : 1} />
          </React.Fragment>
        )}

        {floorData.exits.map(function(exit) {
          return (
            <React.Fragment key={exit.id}>
              <Circle cx={px(exit.x)} cy={py(exit.y)} r={10}
                fill={COLORS.exitIcon} opacity={activeRoute === 'exit' ? 1 : 0.4} />
              <SvgText x={px(exit.x)} y={py(exit.y)} textAnchor="middle"
                alignmentBaseline="middle" fontSize={11} fill={COLORS.white} fontWeight="bold">E</SvgText>
            </React.Fragment>
          );
        })}

        {floorData.extinguishers.map(function(ex) {
          return (
            <React.Fragment key={ex.id}>
              <Rect x={px(ex.x) - 9} y={py(ex.y) - 9} width={18} height={18} rx={4}
                fill={COLORS.extinguisherIcon} opacity={activeRoute === 'extinguisher' ? 1 : 0.4} />
              <SvgText x={px(ex.x)} y={py(ex.y)} textAnchor="middle"
                alignmentBaseline="middle" fontSize={11} fill={COLORS.white} fontWeight="bold">F</SvgText>
            </React.Fragment>
          );
        })}

        <Circle cx={px(floorData.fireLocation.x)} cy={py(floorData.fireLocation.y)}
          r={14} fill={COLORS.fireLocation} opacity={0.85} />
        <SvgText x={px(floorData.fireLocation.x)} y={py(floorData.fireLocation.y)}
          textAnchor="middle" alignmentBaseline="middle" fontSize={14}>🔥</SvgText>

        <AnimatedCircle cx={px(loc.x)} cy={py(loc.y)}
          r={18} fill="none" stroke={COLORS.userLocation} strokeWidth={2}
          opacity={pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] })} />
        <Circle cx={px(loc.x)} cy={py(loc.y)}
          r={12} fill={COLORS.userLocation} />
        <SvgText x={px(loc.x)} y={py(loc.y)}
          textAnchor="middle" alignmentBaseline="middle" fontSize={12}>👤</SvgText>
      </Svg>

      <View style={styles.legend}>
        {[
          { color: COLORS.userLocation,     label: '내 위치'  },
          { color: COLORS.fireLocation,     label: '화재 위치' },
          { color: COLORS.exitIcon,         label: '비상구'   },
          { color: COLORS.extinguisherIcon, label: '소화기'   },
        ].map(function(item) {
          return (
            <View key={item.label} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: COLORS.mapBackground,
    overflow: 'hidden',
  },
  legend: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
