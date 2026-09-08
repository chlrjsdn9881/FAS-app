import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

var Audio = null;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.log('[FireAlarm] expo-av load failed:', e.message);
}

// 화재경보 감지 파라미터
var THRESHOLD_DB   = -20;  // 이 값 이상이면 "큰 소리"로 판정
var WINDOW_SIZE    = 10;   // 슬라이딩 윈도우 크기 (200ms × 10 = 2초)
var TRIGGER_COUNT  = 6;    // 윈도우 중 6/10 이상 큰 소리 → 경보 판정
var CHECK_INTERVAL = 200;  // 샘플링 간격 (ms)

export default function useFireAlarmDetection(enabled, onDetected) {
  var [status, setStatus] = useState('idle'); // idle | listening | detected | error
  var recordingRef  = useRef(null);
  var windowRef     = useRef([]);
  var timerRef      = useRef(null);
  var detectedRef   = useRef(false);
  var activeRef     = useRef(false);

  var stopRecording = useCallback(async function() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
      recordingRef.current = null;
    }
  }, []);

  useEffect(function() {
    if (!enabled || !Audio) return;

    activeRef.current   = true;
    detectedRef.current = false;
    windowRef.current   = [];

    async function start() {
      try {
        var perm = await Audio.requestPermissionsAsync();
        if (!perm.granted) {
          setStatus('error');
          return;
        }
        if (!activeRef.current) return;

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        var recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension:   '.m4a',
            outputFormat: 2,  // MPEG_4
            audioEncoder: 3,  // AAC
            sampleRate:   44100,
            numberOfChannels: 1,
            bitRate:      128000,
          },
          ios: {
            extension:       '.m4a',
            outputFormat:    'aac ',
            audioQuality:    127,
            sampleRate:      44100,
            numberOfChannels: 1,
            bitRate:         128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          isMeteringEnabled: true,
        });
        await recording.startAsync();
        recordingRef.current = recording;

        if (!activeRef.current) {
          await recording.stopAndUnloadAsync();
          return;
        }

        setStatus('listening');

        timerRef.current = setInterval(async function() {
          if (!recordingRef.current || detectedRef.current) return;
          try {
            var s = await recordingRef.current.getStatusAsync();
            var db = (s.metering !== null && s.metering !== undefined) ? s.metering : -160;

            var win = windowRef.current;
            win.push(db >= THRESHOLD_DB ? 1 : 0);
            if (win.length > WINDOW_SIZE) win.shift();

            var loudCount = win.reduce(function(a, b) { return a + b; }, 0);
            console.log('[FireAlarm] dB:', db.toFixed(1), 'loud:', loudCount + '/' + win.length);

            if (win.length >= WINDOW_SIZE && loudCount >= TRIGGER_COUNT) {
              detectedRef.current = true;
              setStatus('detected');
              await stopRecording();
              onDetected && onDetected();
            }
          } catch (e) {}
        }, CHECK_INTERVAL);

      } catch (e) {
        console.warn('[FireAlarm] start failed:', e.message);
        setStatus('error');
      }
    }

    start();

    return function() {
      activeRef.current = false;
      stopRecording();
    };
  }, [enabled]);

  return { status, stopRecording };
}
