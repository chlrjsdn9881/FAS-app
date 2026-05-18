// Dijkstra's shortest path algorithm (ported from Shortest_Distance.py)
// graph: { '1': { '2': 7.07, ... }, ... }
// start/goal: string node IDs
export function getShortestPath(graph, start, goal) {
  var startKey = String(start);
  var goalKey = String(goal);

  var dist = {};
  var parent = {};
  var visited = {};

  var nodes = Object.keys(graph);
  for (var i = 0; i < nodes.length; i++) {
    dist[nodes[i]] = Infinity;
    parent[nodes[i]] = null;
  }
  dist[startKey] = 0;

  var queue = [[0, startKey]];

  while (queue.length > 0) {
    queue.sort(function(a, b) { return a[0] - b[0]; });
    var item = queue.shift();
    var d = item[0];
    var current = item[1];

    if (visited[current]) continue;
    visited[current] = true;

    if (current === goalKey) {
      var path = [];
      var node = current;
      while (node !== null) {
        path.unshift(node);
        node = parent[node];
      }
      return { path: path, dist: d };
    }

    var neighbors = graph[current] || {};
    var neighborKeys = Object.keys(neighbors);
    for (var j = 0; j < neighborKeys.length; j++) {
      var neighbor = neighborKeys[j];
      var weight = neighbors[neighbor];
      var newDist = d + weight;
      var currentDist = dist[neighbor] !== undefined ? dist[neighbor] : Infinity;
      if (newDist < currentDist) {
        dist[neighbor] = newDist;
        parent[neighbor] = current;
        queue.push([newDist, neighbor]);
      }
    }
  }
  return null;
}

// Finds shortest path from start to the nearest node in goals[]
export function getShortestToAny(graph, start, goals) {
  var best = null;
  for (var i = 0; i < goals.length; i++) {
    var result = getShortestPath(graph, start, goals[i]);
    if (result && (!best || result.dist < best.dist)) {
      best = result;
    }
  }
  return best ? best.path : null;
}
