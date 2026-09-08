import React, { useState, useEffect } from 'react';
import StandbyScreen from './src/screens/StandbyScreen';
import FloorSelectScreen from './src/screens/FloorSelectScreen';
import MapScreen from './src/screens/MapScreen';
import { triggerEmergencyAlert } from './src/services/api';
import { setNotificationHandler, registerPushToken } from './src/services/pushNotification';

setNotificationHandler();

// App navigation: standby → floorSelect → map
export default function App() {
  var [screen, setScreen]               = useState('standby');
  var [selectedFloor, setSelectedFloor] = useState(null);

  useEffect(function() {
    registerPushToken();
  }, []);

  function handleFireDetected() {
    setScreen('floorSelect');
  }

  function handleFloorSelect(floor) {
    setSelectedFloor(floor);
    setScreen('map');
    triggerEmergencyAlert(floor);
  }

  function handleChangeFloor() {
    setScreen('floorSelect');
  }

  if (screen === 'standby') {
    return <StandbyScreen onFireDetected={handleFireDetected} />;
  }

  if (screen === 'floorSelect') {
    return <FloorSelectScreen onSelectFloor={handleFloorSelect} />;
  }

  return (
    <MapScreen
      floor={selectedFloor}
      initialRoute="both"
      onBack={handleChangeFloor}
    />
  );
}
