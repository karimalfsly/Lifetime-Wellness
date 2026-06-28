import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Footprints, ClipboardList, User, Sparkles, Trophy } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { motion } from 'framer-motion';

const TAB_ROOTS = ['/', '/walking', '/plans', '/leaderboard', '/assistant', '/profile'];

const navItems = [
  { path: '/', icon: Home, key: 'dashboard' },
  { path: '/walking', icon: Footprints, key: 'walking' },
  { path: '/plans', icon: ClipboardList, key: 'plans' },
  { path: '/leaderboard', icon: Trophy, labelAr: 'تنافس', labelEn: 'Rank' },
  { path: '/assistant', icon: Sparkles, labelAr: 'ذكاء', labelEn: 'AI' },
  { path: '/profile', icon: User, key: 'profile' },
];

// Track each tab's last visited path so we can restore it when switching back
const tabHistory = {};
navItems.forEach(item => { tabHistory[item.path] = item.path; });

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  // Determine which tab root is currently active
  const activeTab = TAB_ROOTS.find(root =>
    root === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(root)
  ) || '/';

  const handleNavClick = (item) => {
    const isCurrentTab = activeTab === item.path;

    if (isCurrentTab) {
      // Re-tapping active tab: reset to root and scroll to top
      tabHistory[item.path] = item.path;
      if (location.pathname !== item.path) {
        navigate(item.path, { replace: true });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Save current location under its tab before switching
      tabHistory[activeTab] = location.pathname;
      // Navigate to where we last were in the target tab
      const dest = tabHistory[item.path] || item.path;
      navigate(dest);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border-t border-border shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.path;
          const Icon = item.icon;
          const label = item.key ? t(item.key) : (lang === 'ar' ? item.labelAr : item.labelEn);
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item)}
              className="flex flex-col items-center gap-0.5 relative px-2 py-1 min-w-0 flex-1 outline-none"
            >
              {isActive && (
                <motion.div
                  layoutId="navBg"
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="navDot"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
                />
              )}
              <Icon className={`w-5 h-5 transition-all ${isActive ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
              <span className={`text-[9px] font-semibold transition-all truncate ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
