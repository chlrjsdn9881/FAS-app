import { getOrRefreshToken, login, clearToken } from './auth';

var BASE_URL   = 'http://168.131.224.195:8000';
var TIMEOUT_MS = 5000;

function fetchWithTimeout(url, options) {
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, TIMEOUT_MS);
  return fetch(url, Object.assign({}, options, { signal: controller.signal }))
    .then(function(res) { clearTimeout(timer); return res; })
    .catch(function(e) { clearTimeout(timer); throw e; });
}

// 인증 헤더 포함 fetch — 401 시 토큰 재발급 후 1회 재시도
async function fetchWithAuth(url, options) {
  var token = await getOrRefreshToken();
  var headers = Object.assign({ 'Content-Type': 'application/json' }, (options || {}).headers, {
    'Authorization': 'Bearer ' + token,
  });
  var res = await fetchWithTimeout(url, Object.assign({}, options, { headers: headers }));
  if (res.status === 401) {
    await clearToken();
    var newToken = await login();
    headers['Authorization'] = 'Bearer ' + newToken;
    res = await fetchWithTimeout(url, Object.assign({}, options, { headers: headers }));
  }
  return res;
}

// GET /api/floors/{floor}/map
export function fetchFloorMap(floor) {
  return fetchWithTimeout(BASE_URL + '/api/floors/' + floor + '/map')
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
}

// GET /api/extinguishers
export async function fetchExtinguishers() {
  var res = await fetchWithAuth(BASE_URL + '/api/extinguishers');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// POST /api/emergency/alert — 선택한 층의 모든 구역 소화기 부저/LED 작동
export async function triggerEmergencyAlert(floorName) {
  try {
    // 층 상세 정보로 zone_id 목록 조회
    var res = await fetchWithAuth(BASE_URL + '/api/floors/detail');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var floors = await res.json();
    var floorDetail = floors.find(function(f) { return f.floor_name === floorName; });
    if (!floorDetail || !floorDetail.zones || floorDetail.zones.length === 0) {
      console.warn('[API] no zones found for floor:', floorName);
      return;
    }
    // 해당 층 모든 구역에 알림 전송
    await Promise.all(floorDetail.zones.map(function(zone) {
      return fetchWithAuth(BASE_URL + '/api/emergency/alert', {
        method: 'POST',
        body: JSON.stringify({ zone_id: zone.zone_id, fire_level: 'high' }),
      });
    }));
    console.log('[API] emergency alert triggered for floor:', floorName);
  } catch (e) {
    console.warn('[API] triggerEmergencyAlert failed:', e.message);
  }
}

// POST /api/navigation/route
export function fetchRoute(floor, currentNode, routeType) {
  return fetchWithTimeout(BASE_URL + '/api/navigation/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ floor: floor, current_user_node: currentNode, route_type: routeType }),
  }).then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  });
}

// API 응답 → floorData 형식 변환 (실패 시 fallback 반환)
export function convertApiFloorData(apiData, fallback) {
  try {
    var nodes = {};
    var nodeTypes = {};
    apiData.nodes.forEach(function(n) {
      nodes[n.id] = { x: n.x, y: n.y };
      if (n.type && n.type !== 'normal') nodeTypes[n.id] = n.type;
    });

    var graph = {};
    apiData.edges.forEach(function(e) {
      if (!graph[e.from]) graph[e.from] = {};
      if (!graph[e.to])   graph[e.to]   = {};
      graph[e.from][e.to] = e.weight;
      graph[e.to][e.from] = e.weight;
    });

    if (!apiData.nodes || apiData.nodes.length === 0) return fallback;

    var extIds = (apiData.extinguisherNodeIds && apiData.extinguisherNodeIds.length > 0)
      ? apiData.extinguisherNodeIds
      : apiData.nodes.filter(function(n) { return n.type !== 'exit'; }).map(function(n) { return n.id; });

    return Object.assign({}, fallback, {
      graph:               graph,
      nodeTypes:           nodeTypes,
      exitNodeIds:         (apiData.exitNodeIds && apiData.exitNodeIds.length > 0) ? apiData.exitNodeIds : fallback.exitNodeIds,
      extinguisherNodeIds: extIds,
    });
  } catch (e) {
    console.warn('[API] convertApiFloorData failed, using fallback:', e.message);
    return fallback;
  }
}
