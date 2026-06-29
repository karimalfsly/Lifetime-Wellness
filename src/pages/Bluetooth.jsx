import React, { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useWalking } from '../lib/WalkingContext';
import { Button } from '../components/ui/button';
import { Bluetooth, Heart, Watch, Loader2, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BluetoothPage() {
  const { lang } = useLanguage();
  const { heartRate, hrConnected, hrDeviceName, connectHeartRate, disconnectHeartRate } = useWalking();

  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Scan all nearby devices
  const [scanning, setScanning] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const [scanError, setScanError] = useState('');

  const isSupported = typeof navigator !== 'undefined' && !!navigator.bluetooth;

  const handleConnectHR = async () => {
    if (hrConnected) { disconnectHeartRate(); return; }
    setSearching(true);
    setError('');
    try {
      await connectHeartRate();
    } catch (e) {
      setError(e.message || (lang === 'ar' ? 'فشل الاتصال' : 'Connection failed'));
    } finally {
      setSearching(false);
    }
  };

  const scanAllDevices = async () => {
    setScanError('');
    setScanning(true);
    try {
      // إرسال طلب للمتصفح لفتح نافذة النظام وعرض كافة الأجهزة والساعات القريبة دون تصفية مسبقة
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'heart_rate', 
          'battery_service', 
          'device_information', 
          'generic_access',
          'generic_attribute'
        ],
      });

      const newDev = { 
        name: device.name || (lang === 'ar' ? 'جهاز مجهول / ساعة ذكية' : 'Smartwatch / Unknown Device'), 
        id: device.id 
      };

      setNearbyDevices(prev => prev.find(d => d.id === newDev.id) ? prev : [...prev, newDev]);
    } catch (e) {
      if (!e.message?.includes('cancelled')) {
        setScanError(lang === 'ar' ? 'لم يتم العثور على أجهزة أو تم إلغاء الفحص' : 'No device found or scan cancelled');
      }
    }
    setScanning(false);
  };

  const hrZone = heartRate
    ? heartRate < 60 ? { label: lang === 'ar' ? 'راحة' : 'Rest', color: 'text-blue-400', bg: 'bg-blue-400/20' }
    : heartRate < 100 ? { label: lang === 'ar' ? 'طبيعي' : 'Normal', color: 'text-green-400', bg: 'bg-green-400/20' }
    : heartRate < 140 ? { label: lang === 'ar' ? 'نشاط خفيف' : 'Light', color: 'text-yellow-400', bg: 'bg-yellow-400/20' }
    : heartRate < 170 ? { label: lang === 'ar' ? 'نشاط قوي' : 'Cardio', color: 'text-orange-400', bg: 'bg-orange-400/20' }
    : { label: lang === 'ar' ? 'أقصى جهد' : 'Max', color: 'text-red-400', bg: 'bg-red-400/20' }
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/20 via-background to-background px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <Bluetooth className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black">{lang === 'ar' ? '📡 الأجهزة والساعات' : '📡 Devices & Watches'}</h1>
            <p className="text-xs text-muted-foreground">
              {hrConnected
                ? <span className="text-green-400 font-bold">✅ {lang === 'ar' ? 'متصل — يعمل في الخلفية' : 'Connected — running in background'}</span>
                : lang === 'ar' ? 'ربط أي جهاز بلوتوث' : 'Connect any Bluetooth device'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Heart Rate Monitor Card */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 px-4 py-3 border-b border-border">
            <h2 className="text-sm font-black flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              {lang === 'ar' ? 'قياس نبض القلب' : 'Heart Rate Monitor'}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {lang === 'ar' ? 'يبقى متصلاً حتى لو غيّرت الصفحة ✅' : 'Stays connected even if you switch pages ✅'}
            </p>
          </div>

          <div className="p-5 text-center">
            {/* Animated Heart */}
            <div className="relative inline-block mb-4">
              <motion.div
                animate={hrConnected ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center ${hrConnected ? 'bg-red-500/20' : 'bg-muted'}`}
              >
                {hrConnected ? (
                  <Heart className="w-14 h-14 text-red-400 fill-current" />
                ) : (
                  <Watch className="w-14 h-14 text-muted-foreground" />
                )}
              </motion.div>
              {hrConnected && (
                <motion.div
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border-4 border-red-400/30"
                />
              )}
            </div>

            {hrConnected && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                <p className="text-xs text-green-400 font-bold mb-1">✅ {hrDeviceName}</p>
                <div className="text-6xl font-black text-red-400 mb-1">{heartRate || '--'}</div>
                <p className="text-sm text-muted-foreground mb-2">{lang === 'ar' ? 'نبضة/دقيقة' : 'BPM'}</p>
                {hrZone && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${hrZone.bg} ${hrZone.color}`}>
                    {hrZone.label}
                  </span>
                )}
                {/* Live wave */}
                <div className="flex gap-0.5 items-end h-8 justify-center mt-3">
                  {[4,7,5,9,6,8,5,7,4,8,6,9,5].map((h, i) => (
                    <motion.div key={i} className="w-1.5 bg-red-400/70 rounded-full"
                      animate={{ height: [`${h*3}px`, `${h*5}px`, `${h*3}px`] }}
                      transition={{ delay: i * 0.06, repeat: Infinity, duration: 0.8 }} />
                  ))}
                </div>
              </motion.div>
            )}

            {!hrConnected && !searching && (
              <p className="text-sm text-muted-foreground mb-4">
                {lang === 'ar' ? 'اضغط للبحث عن ساعتك الذكية' : 'Press to find your smartwatch'}
              </p>
            )}
            {searching && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-primary">{lang === 'ar' ? 'جارٍ البحث...' : 'Searching...'}</span>
              </div>
            )}
            {error && <p className="text-xs text-destructive mb-3">{error}</p>}
            {!isSupported && (
              <p className="text-xs text-destructive mb-3 bg-destructive/10 rounded-xl p-2">
                {lang === 'ar' ? '⚠️ استخدم Chrome على Android لدعم البلوتوث' : '⚠️ Use Chrome on Android for Bluetooth support'}
              </p>
            )}

            <Button
              className={`w-full h-12 rounded-2xl font-black shadow-lg transition-all ${hrConnected ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-primary hover:bg-primary/90 shadow-primary/30'}`}
              onClick={handleConnectHR}
              disabled={searching || !isSupported}
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bluetooth className="w-4 h-4 mr-2" />}
              {hrConnected ? (lang === 'ar' ? 'قطع الاتصال' : 'Disconnect') : (lang === 'ar' ? 'ربط الساعة / HR Monitor' : 'Connect Watch / HR Monitor')}
            </Button>
          </div>
        </div>

        {/* Scan All Nearby Devices */}
        <div className="bg-card rounded-3xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black">{lang === 'ar' ? '🔍 البحث عن أجهزة قريبة' : '🔍 Scan Nearby Devices'}</h3>
              <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'أي ساعة أو جهاز بلوتوث قريب سيظهر في القائمة' : 'Any nearby smartwatch or Bluetooth device will show up'}</p>
            </div>
            <Button size="sm" variant="outline" onClick={scanAllDevices} disabled={scanning || !isSupported}
              className="rounded-2xl h-9 font-bold">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              {lang === 'ar' ? 'بحث' : 'Scan'}
            </Button>
          </div>
          {scanError && <p className="text-xs text-muted-foreground mb-2">{scanError}</p>}
          <AnimatePresence>
            {nearbyDevices.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 bg-muted rounded-2xl px-3 py-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Bluetooth className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'جاهز للإقران' : 'Ready to pair'}</p>
                </div>
                <Zap className="w-3 h-3 text-green-400 ml-auto" />
              </motion.div>
            ))}
          </AnimatePresence>
          {nearbyDevices.length === 0 && !scanning && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {lang === 'ar' ? 'اضغط بحث للعثور على الأجهزة المجاورة' : 'Press Scan to find nearby devices'}
            </p>
          )}
        </div>

        {/* Supported Devices */}
        <div className="bg-card rounded-3xl p-4 border border-border">
          <h3 className="text-sm font-black mb-3">{lang === 'ar' ? '✅ الأجهزة المدعومة' : '✅ Supported Devices'}</h3>
          <div className="grid grid-cols-2 gap-2">
            {['Apple Watch', 'Samsung Galaxy Watch', 'Garmin', 'Fitbit', 'Xiaomi Mi Band', 'Polar HR', 'Chest Strap HR', 'Any BLE Device'].map((d, i) => (
              <div key={i} className="bg-muted rounded-xl px-3 py-2 flex items-center gap-2">
                <Watch className="w-3 h-3 text-accent flex-shrink-0" />
                <span className="text-xs">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}