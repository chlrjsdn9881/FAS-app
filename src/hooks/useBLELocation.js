import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, NativeModules } from 'react-native';

// Expo Go에서는 네이티브 BLE 모듈이 없음 → 안전하게 폴백
var BleManager = null;
var State = null;
try {
  if (NativeModules.BleClientManager) {
    var blePlx = require('react-native-ble-plx');
    BleManager = blePlx.BleManager;
    State = blePlx.State;
  }
} catch (e) {}

var BLE_AVAILABLE = !!BleManager;

// ── 비콘 이름 → 노드 ID 매핑 ─────────────────────────────────
// ESP32_Beacon.ino의 DEVICE_NAME과 일치시켜야 함
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

// 우리 비콘만 골라내는 서비스 UUID (ESP32 코드와 동일)
var TARGET_UUID = '12345678-1234-5678-1234-56789abcdef0';

// RSSI 샘플을 N개 모아서 중앙값으로 노이즈 제거
var SAMPLE_COUNT = 5;

var manager = null;

function getManager() {
  if (!BLE_AVAILABLE) return null;
  if (!manager) manager = new BleManager();
  return manager;
}

export default function useBLELocation(enabled) {
  var [nearestNodeId, setNearestNodeId] = useState(null);
  var [bleStatus, setBleStatus]         = useState(BLE_AVAILABLE ? 'idle' : 'unavailable');
  var samplesRef = useRef({});  // { beaconName: [rssi, rssi, ...] }
  var scanRef    = useRef(null);
  var timerRef   = useRef(null);

  // Android 위치 권한 요청
  function requestPermissions() {
    if (Platform.OS !== 'android') return Promise.resolve(true);

    if (Platform.Version >= 31) {
      return PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]).then(function(results) {
        return (
          results['android.permission.BLUETOOTH_SCAN']   === 'granted' &&
          results['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
          results['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
        );
      });
    }

    return PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    ).then(function(r) { return r === 'granted'; });
  }

  // 수집된 RSSI 샘플 → 중앙값 → 가장 강한 비콘 → 노드 ID
  function evaluateSamples() {
    var samples = samplesRef.current;
    var best = null;
    var bestRssi = -Infinity;

    Object.keys(samples).forEach(function(name) {
      var arr = samples[name];
      if (arr.length === 0) return;

      // 중앙값 계산
      var sorted = arr.slice().sort(function(a, b) { return a - b; });
      var mid = Math.floor(sorted.length / 2);
      var median = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

      if (median > bestRssi) {
        bestRssi = median;
        best = name;
      }
    });

    if (best && BEACON_TO_NODE[best]) {
      setNearestNodeId(BEACON_TO_NODE[best]);
    }

    // 샘플 초기화 (다음 주기 대비)
    samplesRef.current = {};
  }

  function startScan(ble) {
    setBleStatus('scanning');
    samplesRef.current = {};

    ble.startDeviceScan(
      [TARGET_UUID],  // 우리 UUID만 필터
      { allowDuplicates: true },
      function(error, device) {
        if (error) {
          setBleStatus('error');
          return;
        }
        if (!device || !device.name) return;
        if (!BEACON_TO_NODE[device.name]) return;

        // RSSI 샘플 적재
        var name = device.name;
        var rssi = device.rssi || -100;
        if (!samplesRef.current[name]) {
          samplesRef.current[name] = [];
        }
        var arr = samplesRef.current[name];
        arr.push(rssi);
        // 최대 SAMPLE_COUNT개 유지
        if (arr.length > SAMPLE_COUNT) arr.shift();
      }
    );

    // 2초마다 샘플 평가
    timerRef.current = setInterval(evaluateSamples, 2000);
  }

  function stopScan(ble) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try { ble.stopDeviceScan(); } catch (e) {}
    setBleStatus('idle');
  }

  useEffect(function() {
    if (!enabled || !BLE_AVAILABLE) return;

    var ble = getManager();
    if (!ble) return;
    var sub = null;
    var active = true;

    requestPermissions().then(function(granted) {
      if (!granted || !active) {
        setBleStatus('error');
        return;
      }

      sub = ble.onStateChange(function(state) {
        if (state === State.PoweredOn && active) {
          startScan(ble);
        } else if (state === State.PoweredOff) {
          setBleStatus('disabled');
        }
      }, true);
    });

    return function() {
      active = false;
      if (sub) sub.remove();
      stopScan(ble);
    };
  }, [enabled]);

  return { nearestNodeId, bleStatus };
}
