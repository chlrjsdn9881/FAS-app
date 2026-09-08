import { useState, useEffect, useRef } from 'react';
import { getOrRefreshToken, clearToken, login } from '../services/auth';

var BASE_URL = 'http://168.131.224.195:8000';

var EventSource = null;
try {
  EventSource = require('react-native-sse').default;
} catch (e) {
  console.warn('[SSE] react-native-sse not available:', e.message);
}

// 알림 type → 소화기 status 매핑
var ALERT_TYPE_TO_STATUS = {
  'Missing':   'missing',
  'Obstacle':  'obstacle_detected',
  'Fire':      'fire_detected',
  'Humidity':  'humidity_warning',
};

// alerts 배열 → { node_id: status } 맵
function buildStatusMap(alerts, idToNode) {
  var map = {};
  if (!alerts) return map;
  alerts.forEach(function(alert) {
    if (alert.status !== 'active') return;
    var nodeId = idToNode[alert.extinguisher_id];
    if (!nodeId) return;
    var status = ALERT_TYPE_TO_STATUS[alert.type];
    if (status) map[nodeId] = status;
  });
  return map;
}

export default function useExtinguisherStatus(floor) {
  var [statusMap, setStatusMap]   = useState({});
  var [connected, setConnected]   = useState(false);
  var idToNodeRef  = useRef({});   // extinguisher_id → node_id
  var esRef        = useRef(null);
  var activeRef    = useRef(true);
  var retryTimer   = useRef(null);

  useEffect(function() {
    activeRef.current = true;

    async function connect() {
      if (!activeRef.current) return;

      var token;
      try {
        token = await getOrRefreshToken();
      } catch (e) {
        console.warn('[SSE] token error:', e.message);
        scheduleRetry();
        return;
      }

      // 초기 소화기 목록으로 extinguisher_id → node_id 매핑 + 초기 상태 구성
      try {
        var res = await fetch(BASE_URL + '/api/extinguishers', {
          headers: { 'Authorization': 'Bearer ' + token },
        });
        if (res.status === 401) {
          await clearToken();
          token = await login();
          res = await fetch(BASE_URL + '/api/extinguishers', {
            headers: { 'Authorization': 'Bearer ' + token },
          });
        }
        if (res.ok) {
          var list = await res.json();
          var mapping = {};
          var initMap = {};
          list.forEach(function(e) {
            if ((e.floor_name === floor || e.floor_id === floor)) {
              var nodeId = String(e.node_id || e.floor_node_id || '');
              mapping[e.extinguisher_id] = nodeId;
              // 소화기 현재 status로 초기 상태 구성 (SSE 연결 전 즉시 반영)
              if (nodeId && e.status && e.status !== 'normal' && e.status !== 'offline' && e.status !== 'maintenance') {
                initMap[nodeId] = e.status;
              }
            }
          });
          idToNodeRef.current = mapping;
          if (Object.keys(initMap).length > 0) {
            setStatusMap(initMap);
          }
        }
      } catch (e) {
        console.warn('[SSE] extinguisher fetch failed:', e.message);
      }

      if (!activeRef.current) return;

      if (!EventSource) {
        console.warn('[SSE] EventSource not available, no realtime updates');
        return;
      }

      // SSE 연결
      var url = BASE_URL + '/api/events/stream?token=' + encodeURIComponent(token);
      var es  = new EventSource(url);
      esRef.current = es;

      es.addEventListener('open', function() {
        console.log('[SSE] connected');
        setConnected(true);
      });

      // 연결 직후 현재 전체 상태 스냅샷
      es.addEventListener('message', function(e) {
        try {
          var data = JSON.parse(e.data);
          if (data.type === 'snapshot') {
            setStatusMap(buildStatusMap(data.alerts, idToNodeRef.current));
          } else if (data.type === 'alert.created' || data.type === 'alert.updated') {
            var alert = data.alert;
            var nodeId = idToNodeRef.current[alert.extinguisher_id];
            if (nodeId && alert.status === 'active') {
              var status = ALERT_TYPE_TO_STATUS[alert.type];
              if (status) {
                setStatusMap(function(prev) {
                  return Object.assign({}, prev, { [nodeId]: status });
                });
              }
            }
          } else if (data.type === 'alert.resolved') {
            var alert = data.alert;
            var nodeId = idToNodeRef.current[alert.extinguisher_id];
            if (nodeId) {
              setStatusMap(function(prev) {
                var next = Object.assign({}, prev);
                delete next[nodeId];
                return next;
              });
            }
          }
        } catch (err) {}
      });

      es.addEventListener('error', function(e) {
        console.warn('[SSE] error, reconnecting...');
        setConnected(false);
        es.close();
        esRef.current = null;
        if (activeRef.current) scheduleRetry();
      });
    }

    function scheduleRetry() {
      retryTimer.current = setTimeout(function() {
        if (activeRef.current) connect();
      }, 5000);
    }

    connect();

    return function() {
      activeRef.current = false;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      setConnected(false);
    };
  }, [floor]);

  return { statusMap, connected };
}
