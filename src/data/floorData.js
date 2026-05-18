// Floor plan data
// SVG floors use 0-100 logical grid; image floors use % coords of the image

export const FLOORS = {
  B1: {
    label: 'B1',
    walls: [
      { x: 0, y: 0, width: 100, height: 2 },
      { x: 0, y: 98, width: 100, height: 2 },
      { x: 0, y: 0, width: 2, height: 100 },
      { x: 98, y: 0, width: 2, height: 100 },
      { x: 40, y: 2, width: 2, height: 45 },
      { x: 40, y: 55, width: 2, height: 43 },
      { x: 70, y: 30, width: 2, height: 68 },
    ],
    rooms: [
      { x: 2, y: 2, width: 38, height: 96, label: '주차구역 A' },
      { x: 42, y: 2, width: 28, height: 96, label: '주차구역 B' },
      { x: 72, y: 30, width: 26, height: 68, label: '기계실' },
    ],
    exits: [
      { id: 'e1', x: 20, y: 0, label: '비상구 1' },
      { id: 'e2', x: 85, y: 0, label: '비상구 2' },
    ],
    extinguishers: [
      { id: 'ex1', x: 15, y: 50, label: '소화기 1' },
      { id: 'ex2', x: 55, y: 20, label: '소화기 2' },
      { id: 'ex3', x: 80, y: 60, label: '소화기 3' },
    ],
    userLocation: { x: 55, y: 70 },
    fireLocation: { x: 75, y: 45 },
    exitRoute: [
      { x: 55, y: 70 }, { x: 55, y: 50 }, { x: 20, y: 50 }, { x: 20, y: 2 },
    ],
    extinguisherRoute: [
      { x: 55, y: 70 }, { x: 55, y: 50 }, { x: 15, y: 50 },
    ],
  },

  '1F': {
    label: '1F',
    walls: [
      { x: 0, y: 0, width: 100, height: 2 },
      { x: 0, y: 98, width: 100, height: 2 },
      { x: 0, y: 0, width: 2, height: 100 },
      { x: 98, y: 0, width: 2, height: 100 },
      { x: 50, y: 2, width: 2, height: 50 },
      { x: 50, y: 60, width: 2, height: 38 },
      { x: 2, y: 60, width: 70, height: 2 },
    ],
    rooms: [
      { x: 2, y: 2, width: 48, height: 58, label: '로비' },
      { x: 52, y: 2, width: 46, height: 58, label: '상점' },
      { x: 2, y: 62, width: 48, height: 36, label: '사무실 A' },
      { x: 52, y: 62, width: 46, height: 36, label: '사무실 B' },
    ],
    exits: [
      { id: 'e1', x: 25, y: 98, label: '정문' },
      { id: 'e2', x: 75, y: 98, label: '후문' },
      { id: 'e3', x: 0, y: 30, label: '비상구' },
    ],
    extinguishers: [
      { id: 'ex1', x: 25, y: 30, label: '소화기 1' },
      { id: 'ex2', x: 75, y: 30, label: '소화기 2' },
      { id: 'ex3', x: 25, y: 80, label: '소화기 3' },
    ],
    userLocation: { x: 75, y: 80 },
    fireLocation: { x: 30, y: 40 },
    exitRoute: [
      { x: 75, y: 80 }, { x: 75, y: 98 },
    ],
    extinguisherRoute: [
      { x: 75, y: 80 }, { x: 75, y: 50 }, { x: 55, y: 50 }, { x: 55, y: 30 }, { x: 75, y: 30 },
    ],
  },

  '2F': {
    label: '2F',
    walls: [
      { x: 0, y: 0, width: 100, height: 2 },
      { x: 0, y: 98, width: 100, height: 2 },
      { x: 0, y: 0, width: 2, height: 100 },
      { x: 98, y: 0, width: 2, height: 100 },
      { x: 2, y: 40, width: 60, height: 2 },
      { x: 62, y: 40, width: 36, height: 2 },
      { x: 30, y: 2, width: 2, height: 38 },
      { x: 70, y: 42, width: 2, height: 56 },
    ],
    rooms: [
      { x: 2, y: 2, width: 28, height: 38, label: '회의실 A' },
      { x: 32, y: 2, width: 66, height: 38, label: '회의실 B' },
      { x: 2, y: 42, width: 68, height: 56, label: '강당' },
      { x: 72, y: 42, width: 26, height: 56, label: '창고' },
    ],
    exits: [
      { id: 'e1', x: 15, y: 0, label: '비상구 1' },
      { id: 'e2', x: 98, y: 65, label: '비상구 2' },
    ],
    extinguishers: [
      { id: 'ex1', x: 15, y: 20, label: '소화기 1' },
      { id: 'ex2', x: 55, y: 20, label: '소화기 2' },
      { id: 'ex3', x: 40, y: 70, label: '소화기 3' },
    ],
    userLocation: { x: 40, y: 70 },
    fireLocation: { x: 80, y: 60 },
    exitRoute: [
      { x: 40, y: 70 }, { x: 40, y: 42 }, { x: 15, y: 42 }, { x: 15, y: 2 },
    ],
    extinguisherRoute: [
      { x: 40, y: 70 }, { x: 40, y: 70 },
    ],
  },

  '3F': {
    label: '3F',
    walls: [
      { x: 0, y: 0, width: 100, height: 2 },
      { x: 0, y: 98, width: 100, height: 2 },
      { x: 0, y: 0, width: 2, height: 100 },
      { x: 98, y: 0, width: 2, height: 100 },
      { x: 2, y: 50, width: 96, height: 2 },
      { x: 35, y: 2, width: 2, height: 48 },
      { x: 65, y: 2, width: 2, height: 48 },
      { x: 50, y: 52, width: 2, height: 46 },
    ],
    rooms: [
      { x: 2, y: 2, width: 33, height: 48, label: '연구실 A' },
      { x: 37, y: 2, width: 28, height: 48, label: '연구실 B' },
      { x: 67, y: 2, width: 31, height: 48, label: '연구실 C' },
      { x: 2, y: 52, width: 48, height: 46, label: '휴게실' },
      { x: 52, y: 52, width: 46, height: 46, label: '서버실' },
    ],
    exits: [
      { id: 'e1', x: 0, y: 25, label: '비상구 1' },
      { id: 'e2', x: 50, y: 98, label: '비상구 2' },
    ],
    extinguishers: [
      { id: 'ex1', x: 18, y: 25, label: '소화기 1' },
      { id: 'ex2', x: 50, y: 25, label: '소화기 2' },
      { id: 'ex3', x: 80, y: 25, label: '소화기 3' },
      { id: 'ex4', x: 25, y: 75, label: '소화기 4' },
    ],
    userLocation: { x: 25, y: 75 },
    fireLocation: { x: 75, y: 70 },
    exitRoute: [
      { x: 25, y: 75 }, { x: 25, y: 52 }, { x: 10, y: 52 }, { x: 10, y: 25 }, { x: 2, y: 25 },
    ],
    extinguisherRoute: [
      { x: 25, y: 75 }, { x: 25, y: 75 },
    ],
  },

  '4F': {
    label: '4F',
    useImageMap: true,
    // Node coords in % of floor_map.png (3072x4096 px)
    nodes: {
      '1':  { x: 23, y: 70 },
      '2':  { x: 34, y: 71 },
      '3':  { x: 49, y: 70 },
      '4':  { x: 72, y: 70 },
      '5':  { x: 82, y: 70 },
      '6':  { x: 74, y: 63 },
      '7':  { x: 78, y: 62 },
      '8':  { x: 78, y: 51 },
      '9':  { x: 76, y: 29 },
      '10': { x: 76, y: 20 },
    },
    // Edge weights in meters
    graph: {
      '1':  { '2': 7.07 },
      '2':  { '1': 7.07, '3': 9.06 },
      '3':  { '2': 9.06, '4': 14.0 },
      '4':  { '3': 14.0, '5': 10.0, '6': 5.39 },
      '5':  { '4': 10.0, '7': 6.32 },
      '6':  { '4': 5.39, '7': 2.24 },
      '7':  { '5': 6.32, '6': 2.24, '8': 9.0 },
      '8':  { '7': 9.0,  '9': 18.03 },
      '9':  { '8': 18.03, '10': 8.0 },
      '10': { '9': 8.0 },
    },
    // Node visual types: 'exit'=green, 'corner'=black, default=extinguisher color
    nodeTypes: {
      '4': 'corner',
      '5': 'exit',
    },
    userNodeId: '1',
    exitNodeIds: ['5'],
    extinguisherNodeIds: ['2', '3', '6', '7', '8', '9', '10'],
    userLocation: { x: 23, y: 70 },
    fireLocation: { x: 55, y: 45 },
  },

  '5F': {
    label: '5F',
    walls: [
      { x: 0, y: 0, width: 100, height: 2 },
      { x: 0, y: 98, width: 100, height: 2 },
      { x: 0, y: 0, width: 2, height: 100 },
      { x: 98, y: 0, width: 2, height: 100 },
      { x: 45, y: 2, width: 2, height: 55 },
      { x: 2, y: 55, width: 43, height: 2 },
      { x: 75, y: 2, width: 2, height: 98 },
    ],
    rooms: [
      { x: 2, y: 2, width: 43, height: 53, label: '강의실 A' },
      { x: 47, y: 2, width: 28, height: 96, label: '복도' },
      { x: 2, y: 57, width: 43, height: 41, label: '강의실 B' },
      { x: 77, y: 2, width: 21, height: 96, label: '강의실 C' },
    ],
    exits: [
      { id: 'e1', x: 60, y: 0, label: '비상구 1' },
      { id: 'e2', x: 60, y: 98, label: '비상구 2' },
    ],
    extinguishers: [
      { id: 'ex1', x: 20, y: 25, label: '소화기 1' },
      { id: 'ex2', x: 60, y: 50, label: '소화기 2' },
      { id: 'ex3', x: 85, y: 50, label: '소화기 3' },
    ],
    userLocation: { x: 20, y: 75 },
    fireLocation: { x: 85, y: 30 },
    exitRoute: [
      { x: 20, y: 75 }, { x: 20, y: 57 }, { x: 60, y: 57 }, { x: 60, y: 98 },
    ],
    extinguisherRoute: [
      { x: 20, y: 75 }, { x: 20, y: 57 }, { x: 60, y: 57 }, { x: 60, y: 50 },
    ],
  },
};
