import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Activity, RefreshCw, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FITNESS_SCOPE = 'https://www.googleapis.com/auth/fitness.activity.read';
const FITNESS_API = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';

// Helper: get today's start/end in nanoseconds
function getTodayNano() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return {
    startTimeNanos: (start.getTime() * 1e6).toString(),
    endTimeNanos: (end.getTime() * 1e6).toString(),
  };
}

export default function GoogleFitSync({ profile, todayLog, onStepsSynced }) {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('idle'); // idle | connecting | syncing | success | error
  const [steps, setSteps] = useState(null);
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem('gfit_token') || null);
  const [error, setError] = useState('');

  // Check if Google Identity Services is available
  const isSupported = typeof window !== 'undefined' && (
    window.google || document.querySelector('script[src*="accounts.google.com"]')
  );

  // Load Google Identity Services script once
  useEffect(() => {
    if (document.getElementById('gsi-script')) return;
    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Auto-sync if we already have a token
  useEffect(() => {
    if (accessToken) fetchSteps(accessToken);
  }, [accessToken]);

  const connectGoogleFit = () => {
    setStatus('connecting');
    setError('');

    // Use Google OAuth implicit flow via tokenClient
    const initClient = () => {
      if (!window.google?.accounts?.oauth2) {
        setError(lang === 'ar' ? 'فشل تحميل Google — حاول مرة أخرى' : 'Google failed to load — try again');
        setStatus('error');
        return;
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: '1008916840054-b7m1234example.apps.googleusercontent.com', // placeholder — builder must set real client ID
        scope: FITNESS_SCOPE,
        callback: (resp) => {
          if (resp.error) {
            setError(lang === 'ar' ? 'فشل الاتصال بـ Google Fit' : 'Google Fit connection failed');
            setStatus('error');
            return;
          }
          sessionStorage.setItem('gfit_token', resp.access_token);
          setAccessToken(resp.access_token);
          fetchSteps(resp.access_token);
        },
      });
      client.requestAccessToken();
    };

    if (window.google?.accounts?.oauth2) {
      initClient();
    } else {
      // Wait for script to load
      const interval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          initClient();
        }
      }, 300);
      setTimeout(() => clearInterval(interval), 8000);
    }
  };

  const fetchSteps = async (token) => {
    setStatus('syncing');
    const { startTimeNanos, endTimeNanos } = getTodayNano();

    const body = {
      aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeNanos,
      endTimeNanos,
    };

    const res = await fetch(FITNESS_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 401) {
        sessionStorage.removeItem('gfit_token');
        setAccessToken(null);
      }
      setError(lang === 'ar' ? 'فشل جلب البيانات' : 'Failed to fetch data');
      setStatus('error');
      return;
    }

    const data = await res.json();
    let totalSteps = 0;
    data.bucket?.forEach(bucket => {
      bucket.dataset?.forEach(ds => {
        ds.point?.forEach(pt => {
          pt.value?.forEach(v => { totalSteps += v.intVal || 0; });
        });
      });
    });

    setSteps(totalSteps);
    setStatus('success');

    // Save to DailyLog
    if (profile?.user_email && totalSteps > 0) {
      const today = new Date().toISOString().split('T')[0];
      const calories = Math.round(totalSteps * 0.04);
      const distance = parseFloat((totalSteps * 0.0007).toFixed(2));

      if (todayLog?.id) {
        await base44.entities.DailyLog.update(todayLog.id, {
          steps: totalSteps,
          calories_burned: calories,
          distance_km: distance,
        });
      } else {
        await base44.entities.DailyLog.create({
          user_email: profile.user_email,
          date: today,
          steps: totalSteps,
          calories_burned: calories,
          distance_km: distance,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] });
      if (onStepsSynced) onStepsSynced(totalSteps);
    }
  };

  const disconnect = () => {
    sessionStorage.removeItem('gfit_token');
    setAccessToken(null);
    setSteps(null);
    setStatus('idle');
    setError('');
  };

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
          <Activity className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black">{lang === 'ar' ? '🏃 Google Fit' : '🏃 Google Fit'}</h3>
          <p className="text-[10px] text-muted-foreground">
            {lang === 'ar' ? 'مزامنة خطواتك تلقائياً' : 'Auto-sync your steps'}
          </p>
        </div>
        {accessToken && (
          <button onClick={disconnect} className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
            {lang === 'ar' ? 'قطع' : 'Disconnect'}
          </button>
        )}
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Success state */}
          {status === 'success' && steps !== null && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-xs text-green-400 font-bold">{lang === 'ar' ? '✅ تمت المزامنة' : '✅ Synced'}</p>
                  <p className="text-lg font-black">{steps.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">{lang === 'ar' ? 'خطوة اليوم' : 'steps today'}</span></p>
                </div>
              </div>
              <button onClick={() => fetchSteps(accessToken)}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </motion.div>
          )}

          {/* Syncing state */}
          {status === 'syncing' && (
            <motion.div key="syncing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 py-1">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'جارٍ جلب البيانات...' : 'Fetching data...'}</p>
            </motion.div>
          )}

          {/* Connecting state */}
          {status === 'connecting' && (
            <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 py-1">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'جارٍ الاتصال بـ Google...' : 'Connecting to Google...'}</p>
            </motion.div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-destructive font-semibold">{error}</p>
              </div>
              <button onClick={connectGoogleFit}
                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-xl font-bold">
                {lang === 'ar' ? 'إعادة' : 'Retry'}
              </button>
            </motion.div>
          )}

          {/* Idle state */}
          {status === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Smartphone className="w-4 h-4" />
                <span>{lang === 'ar' ? 'اربط Google Fit لجلب خطواتك تلقائياً من هاتفك' : 'Connect Google Fit to auto-sync steps from your phone'}</span>
              </div>
              <button onClick={connectGoogleFit}
                className="w-full h-11 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <img src="https://www.gstatic.com/images/branding/product/1x/gfit_512dp.png" className="w-5 h-5" alt="" onError={e => e.target.style.display='none'} />
                {lang === 'ar' ? 'ربط Google Fit' : 'Connect Google Fit'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
