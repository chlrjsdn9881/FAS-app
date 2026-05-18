import React, { useState } from 'react';
import FloorSelectScreen from './src/screens/FloorSelectScreen';
import MapScreen from './src/screens/MapScreen';

// App navigation state machine: floor-select -> map
export default function App() {
  const [screen, setScreen] = useState('floorSelect');
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [activeRoute, setActiveRoute] = useState('both');

  const handleFloorSelect = (floor) => {
    setSelectedFloor(floor);
    setActiveRoute('both');
    setScreen('map');
  };

  const handleChangeFloor = () => {
    setScreen('floorSelect');
  };

  if (screen === 'floorSelect') {
    return <FloorSelectScreen onSelectFloor={handleFloorSelect} />;
  }

  return (
    <MapScreen
      floor={selectedFloor}
      initialRoute={activeRoute}
      onBack={handleChangeFloor}
    />
  );
}
