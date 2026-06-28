import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useLanguage } from '@/lib/LanguageContext';
import NotificationBell from '@/components/notifications/NotificationBell';
import HealthReminders from '@/components/notifications/HealthReminders';
import OfflineBanner from './OfflineBanner';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ArrowRight } from 'lucide-react';

function BackHeader({ isRTL }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  if (location.pathname === '/') return null;

  return (
    <div className="fixed top-0 left-0 z-40 p-3" style={{ paddingTop: `calc(0.75rem + env(safe-area-inset-top))` }}>
      <button
        onClick={() => navigate(-1)}
        className="w-9 h-9 rounded-2xl bg-card/80 backdrop-blur-md border border-border flex items-center justify-center shadow-sm active:scale-95 transition-transform"
      >
        {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function AppLayout() {
  const { isRTL } = useLanguage();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className={`min-h-screen bg-background font-inter ${isRTL ? 'font-tajawal' : 'font-inter'}`}>
      <OfflineBanner />
      <BackHeader isRTL={isRTL} />
      {/* Global notification bell - fixed top right */}
      <div className="fixed z-50" style={{ top: `calc(1rem + env(safe-area-inset-top))`, right: '1rem' }}>
        <NotificationBell user={user} />
      </div>
      <HealthReminders />
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
