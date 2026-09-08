import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

var BleManager = null;
var State = null;
try {
  var blePlx = require('react-native-ble-plx');
  if (blePlx && blePlx.BleManager) {
    BleManager = blePlx.BleManager;
    State = blePlx.State;
  } else {
    console.log('[BLE] module loaded but BleManager not found:', blePlx);
  }
} catch (e) {
  console.log('[BLE] module load failed:', e.message);
}

var BLE_AVAILABLE = !!BleManager;
console.log('[BLE] BLE_AVAILABLE:', BLE_AVAILABLE);

// ── 비콘 이름 → 노드 ID 매핑 ─────────────────────────────────
var BEACON_TO_NODE = {
  'EXTINGUISHER_01': '2',
  'EXTINGUISHER_02': '3',
  'EXTINGUISHER_03': '6',
  'EXTINGUISHER_04': '7',
  'EXTINGUISHER_05': '8',
  'EXTINGUISHER_06': '9',
  'EXTINGUISHER_07': '10',
  'EXIT_01':         '5',
};

var SAMPLE_COUNT = 5;

// RSSI → 거리(m) 변환 (경험적 경로 손실 모델)
// TX_POWER: 1m 거리에서의 기준 RSSI (ESP32 실측값으로 보정 가능)
var TX_POWER    = -59;
var PATH_LOSS_N = 2.5;  // 실내 경로 손실 지수

function rssiToDistance(rssi) {
  return Math.pow(10, (TX_POWER - rssi) / (10 * PATH_LOSS_N));
}

// 가중 무게중심법: 거리² 역수를 가중치로 사용
function weightedCentroid(beacons) {
  var totalWeight = 0;
  var wx = 0, wy = 0;
  beacons.forEach(function(b) {
    var d = rssiToDistance(b.rssi);
    var w = 1 / (d * d);
    wx += b.x * w;
    wy += b.y * w;
    totalWeight += w;
  });
  return { x: wx / totalWeight, y: wy / totalWeight };
}

// 계산된 좌표에서 가장 가까운 노드 ID 반환
function nearestNodeInMap(pos, nodes) {
  var bestId   = null;
  var bestDist = Infinity;
  Object.keys(nodes).forEach(function(id) {
    var n = nodes[id];
    var d = Math.sqrt(Math.pow(n.x - pos.x, 2) + Math.pow(n.y - pos.y, 2));
    if (d < bestDist) { bestDist = d; bestId = id; }
  });
  return bestId;
}

var manager = null;
function getManager() {
  if (!BLE_AVAILABLE) return null;
  if (!manager) manager = new BleManager();
  return manager;
}

// floorNodes: 현재 층의 nodes 객체 (좌표 조회용)
export default function useBLELocation(enabled, floorNodes) {
  var [nearestNodeId, setNearestNodeId] = useState(null);
  var [userPosition,  setUserPosition]  = useState(null);
  var [bleStatus,     setBleStatus]     = useState(BLE_AVAILABLE ? 'idle' : 'unavailable');
  var samplesRef = useRef({});
  var timerRef   = useRef(null);

  function requestPermissions() {
    if (Platform.OS !== 'android') return Promise.resolve(true);
    if (Platform.Version >= 31) {
      return PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]).then(function(results) {
        return (
          results['android.permission.BLUETOOTH_SCAN']       === 'granted' &&
          results['android.permission.BLUETOOTH_CONNECT']    === 'granted' &&
          results['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
        );
      });
    }
    return PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    ).then(function(r) { return r === 'granted'; });
  }

  function evaluateSamples() {
    var samples = samplesRef.current;

    // 비콘별 중앙값 RSSI 계산 + 좌표 조회
    var activeBeacons = [];
    Object.keys(samples).forEach(function(name) {
      var arr = samples[name];
      if (arr.length === 0) return;
      if (!BEACON_TO_NODE[name]) return;

      var sorted = arr.slice().sort(function(a, b) { return a - b; });
      var mid    = Math.floor(sorted.length / 2);
      var median = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

      var nodeId  = BEACON_TO_NODE[name];
      var nodePos = floorNodes && floorNodes[nodeId];
      if (!nodePos) return;

      activeBeacons.push({ name: name, nodeId: nodeId, x: nodePos.x, y: nodePos.y, rssi: median });
    });

    if (activeBeacons.length >= 3) {
      // ── 삼변측량 (가중 무게중심) ──────────────────────────
      var pos     = weightedCentroid(activeBeacons);
      var nearest = floorNodes ? nearestNodeInMap(pos, floorNodes) : activeBeacons[0].nodeId;
      console.log('[BLE] trilateration:', pos.x.toFixed(1), pos.y.toFixed(1), '→ node', nearest);
      setUserPosition(pos);
      setNearestNodeId(nearest);
    } else if (activeBeacons.length >= 1) {
      // ── 폴백: 가장 강한 비콘 노드로 스냅 ─────────────────
      var best = activeBeacons.reduce(function(a, b) { return a.rssi > b.rssi ? a : b; });
      console.log('[BLE] nearest beacon:', best.name, '→ node', best.nodeId);
      setNearestNodeId(best.nodeId);
      setUserPosition(floorNodes ? floorNodes[best.nodeId] : null);
    }

    samplesRef.current = {};
  }

  function startScan(ble) {
    console.log('[BLE] startScan called');
    setBleStatus('scanning');
    samplesRef.current = {};

    ble.startDeviceScan(
      null,
      { allowDuplicates: true },
      function(error, device) {
        if (error) { setBleStatus('error'); return; }
        if (!device) return;
        var name = device.name || device.localName;
        if (name) console.log('[BLE] found:', name, 'rssi:', device.rssi);
        if (!name || !BEACON_TO_NODE[name]) return;

        var rssi = device.rssi || -100;
        if (!samplesRef.current[name]) samplesRef.current[name] = [];
        var arr = samplesRef.current[name];
        arr.push(rssi);
        if (arr.length > SAMPLE_COUNT) arr.shift();
      }
    );

    timerRef.current = setInterval(evaluateSamples, 2000);
  }

  function stopScan(ble) {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    try { ble.stopDeviceScan(); } catch (e) {}
    setBleStatus('idle');
  }

  useEffect(function() {
    if (!enabled || !BLE_AVAILABLE) return;
    var ble    = getManager();
    if (!ble) return;
    var sub    = null;
    var active = true;

    requestPermissions().then(function(granted) {
      console.log('[BLE] permissions granted:', granted);
      if (!granted || !active) { setBleStatus('error'); return; }
      sub = ble.onStateChange(function(state) {
        console.log('[BLE] state:', state);
        if (state === State.PoweredOn && active) startScan(ble);
        else if (state === State.PoweredOff) setBleStatus('disabled');
      }, true);
    });

    return function() {
      active = false;
      if (sub) sub.remove();
      stopScan(ble);
    };
  }, [enabled]);

  return { nearestNodeId, userPosition, bleStatus };
}
