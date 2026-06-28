/**
 * WalkingContext — keeps walking session alive across all pages.
 * Heart-rate from Bluetooth also lives here so it persists globally.
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const WalkingContext = createContext(null);

function haversineDistance(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function WalkingProvider({ children }) {
  // ── session state ──────────────────────────────────────────────
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [duration, setDuration] = useState(0); // seconds
  const [routePoints, setRoutePoints] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [destination, setDestination] = useState(null);

  // ── heart rate state (global, persists even off BT page) ───────
  const [heartRate, setHeartRate] = useState(null);
  const [hrConnected, setHrConnected] = useState(false);
  const [hrDeviceName, setHrDeviceName] = useState('');

  // refs so callbacks stay stable
  const timerRef = useRef(null);
  const sessionIdRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastPosRef = useRef(null);
  const lastStepTimeRef = useRef(0);
  const prevMagnitudeRef = useRef(0);
  const stepBufferRef = useRef([]);
  const hrCharRef = useRef(null);
  const hrDeviceRef = useRef(null);
  const userEmailRef = useRef(null);
  const stepGoalRef = useRef(5000);
  const trackingRef = useRef(false);

  // ── GPS init on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setCurrentPos({ lat: 24.7136, lng: 46.6753 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCurrentPos({ lat: 24.7136, lng: 46.6753 }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── pedometer ──────────────────────────────────────────────────
  const handleMotion = useCallback((event) => {
    if (!trackingRef.current) return;
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
    stepBufferRef.current.push(mag);
    if (stepBufferRef.current.length > 5) stepBufferRef.current.shift();
    const smoothed = stepBufferRef.current.reduce((a, b) => a + b, 0) / stepBufferRef.current.length;
    const now = Date.now();
    const delta = smoothed - prevMagnitudeRef.current;
    prevMagnitudeRef.current = smoothed;
    if (delta > 2.2 && now - lastStepTimeRef.current > 280) {
      lastStepTimeRef.current = now;
      setSteps(s => s + 1);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [handleMotion]);

  // ── start / stop ───────────────────────────────────────────────
  const startWalking = useCallback(async (userEmail, stepGoal) => {
    userEmailRef.current = userEmail;
    stepGoalRef.current = stepGoal || 5000;

    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try { const p = await DeviceMotionEvent.requestPermission(); if (p !== 'granted') return; } catch {}
    }

    setSteps(0); setRoutePoints([]); setDistanceKm(0); setDuration(0);
    lastStepTimeRef.current = 0; prevMagnitudeRef.current = 0; stepBufferRef.current = [];
    trackingRef.current = true;
    setIsTracking(true);

    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);

    watchIdRef.current = navigator.geolocation?.watchPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: new Date().toISOString() };
        setCurrentPos({ lat: p.lat, lng: p.lng });
        if (lastPosRef.current) {
          const dist = haversineDistance(lastPosRef.current, p);
          if (dist > 0.003) {
            setRoutePoints(prev => [...prev, p]);
            setDistanceKm(prev => prev + dist);
            lastPosRef.current = p;
          }
        } else {
          lastPosRef.current = p;
          setRoutePoints([p]);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    // create DB session
    const today = new Date().toISOString().split('T')[0];
    const res = await base44.entities.WalkSession.create({
      user_email: userEmail, date: today, start_time: new Date().toISOString(), status: 'active',
    });
    sessionIdRef.current = res.id;
  }, []);

  const stopWalking = useCallback(async () => {
    trackingRef.current = false;
    setIsTracking(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current) navigator.geolocation?.clearWatch(watchIdRef.current);
    lastPosRef.current = null;

    // capture final values synchronously via a promise
    return new Promise(resolve => {
      setSteps(s => { setDistanceKm(d => { setDuration(dur => {
        const cals = Math.round(s * 0.04);
        // save session
        if (sessionIdRef.current) {
          base44.entities.WalkSession.update(sessionIdRef.current, {
            end_time: new Date().toISOString(), steps: s,
            distance_km: parseFloat(d.toFixed(3)), duration_minutes: Math.round(dur / 60),
            calories_burned: cals, status: 'completed',
          });
        }
        // update daily log
        const today = new Date().toISOString().split('T')[0];
        const email = userEmailRef.current;
        if (email) {
          base44.entities.DailyLog.filter({ user_email: email, date: today }).then(logs => {
            const data = { steps: s, distance_km: parseFloat(d.toFixed(3)), calories_burned: cals, active_minutes: Math.round(dur / 60) };
            if (logs.length > 0) base44.entities.DailyLog.update(logs[0].id, data);
            else base44.entities.DailyLog.create({ user_email: email, date: today, ...data });
          });
        }
        resolve({ steps: s, distanceKm: d, duration: dur, calories: cals });
        return dur;
      }); return d; }); return s; });
    });
  }, []);

  // ── Bluetooth Heart Rate ───────────────────────────────────────
  const connectHeartRate = useCallback(async () => {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }],
      optionalServices: ['heart_rate', 'battery_service'],
    });
    hrDeviceRef.current = device;
    setHrDeviceName(device.name || 'Unknown');

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('heart_rate');
    const char = await service.getCharacteristic('heart_rate_measurement');

    const parseHR = (value) => {
      const flags = value.getUint8(0);
      return (flags & 0x01) ? value.getUint16(1, true) : value.getUint8(1);
    };

    const listener = (e) => setHeartRate(parseHR(e.target.value));
    char.addEventListener('characteristicvaluechanged', listener);
    await char.startNotifications();
    hrCharRef.current = { char, listener };
    setHrConnected(true);

    device.addEventListener('gattserverdisconnected', () => {
      setHrConnected(false);
      setHeartRate(null);
      setHrDeviceName('');
    });
  }, []);

  const disconnectHeartRate = useCallback(async () => {
    if (hrCharRef.current) {
      hrCharRef.current.char.removeEventListener('characteristicvaluechanged', hrCharRef.current.listener);
      await hrCharRef.current.char.stopNotifications().catch(() => {});
    }
    hrDeviceRef.current?.gatt?.disconnect();
    setHrConnected(false);
    setHeartRate(null);
    setHrDeviceName('');
  }, []);

  // cleanup
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current) navigator.geolocation?.clearWatch(watchIdRef.current);
  }, []);

  return (
    <WalkingContext.Provider value={{
      isTracking, steps, distanceKm, duration, routePoints, currentPos, destination,
      setDestination, startWalking, stopWalking,
      heartRate, hrConnected, hrDeviceName, connectHeartRate, disconnectHeartRate,
    }}>
      {children}
    </WalkingContext.Provider>
  );
}

export function useWalking() {
  return useContext(WalkingContext);
}
