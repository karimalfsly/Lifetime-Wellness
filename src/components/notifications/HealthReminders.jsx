import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../lib/LanguageContext'; // تم تصحيح المسار بالخروج خطوتين للأعلى
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, Dumbbell, Target, Bell } from 'lucide-react';

const REMINDERS = [
  {
    id: 'water',
    icon: Droplets,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    intervalMs: 30 * 60 * 1000, // every 30 min
    en: '💧 Time to drink water! Stay hydrated for better health.',
    ar: '💧 حان وقت شرب الماء! الترطيب مهم جداً لصحتك.',
  },
  {
    id: 'exercise',
    icon: Dumbbell,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
    intervalMs: 60 * 60 * 1000, // every 60 min
    en: '🏃 Quick stretch break! Stand up and move for 5 minutes.',
    ar: '🏃 وقت التمدد السريع! قم وتحرك لمدة 5 دقائق.',
  },
  {
    id: 'goals',
    icon: Target,
    color: 'text-primary',
    bg: 'bg-primary/20',
    border: 'border-primary/30',
    intervalMs: 90 * 60 * 1000, // every 90 min
    en: '🎯 Check your daily goals! How many steps have you taken today?',
    ar: '🎯 راجع أهدافك اليومية! كم خطوة مشيت اليوم؟',
  },
];

export default function HealthReminders() {
  const { lang } = useLanguage();
  const [current, setCurrent] = useState(null);
  const timersRef = useRef([]);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const showReminder = (reminder) => {
      setCurrent(reminder);
      // Also try browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Lifetime Wellness', {
          body: lang === 'ar' ? reminder.ar : reminder.en,
          icon: '/favicon.ico',
        });
      }
      // Auto dismiss after 8 seconds
      setTimeout(() => setCurrent(r => r?.id === reminder.id ? null : r), 8000);
    };

    // Stagger the reminders so they don't fire all at once
    REMINDERS.forEach((reminder, i) => {
      // First trigger after a short delay (staggered)
      const firstDelay = (i + 1) * 10 * 60 * 1000; // 10min, 20min, 30min after mount
      const t1 = setTimeout(() => showReminder(reminder), firstDelay);
      // Then repeat
      const t2 = setInterval(() => showReminder(reminder), reminder.intervalMs);
      timersRef.current.push(t1, t2);
    });

    return () => timersRef.current.forEach(clearTimeout);
  }, [lang]);

  if (!current) return null;

  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: -80, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -80, scale: 0.9 }}
        className={`fixed top-4 left-4 right-4 z-[999] ${current.bg} border ${current.border} rounded-3xl px-4 py-4 shadow-2xl backdrop-blur-md`}
        style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${current.bg} border ${current.border} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${current.color}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {lang === 'ar' ? 'تذكير صحي' : 'Health Reminder'}
            </p>
            <p className="text-sm font-semibold leading-snug mt-0.5">
              {lang === 'ar' ? current.ar : current.en}
            </p>
          </div>
          <button
            onClick={() => setCurrent(null)}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        {/* Progress bar auto-dismiss */}
        <motion.div
          className={`mt-3 h-1 ${current.color.replace('text-', 'bg-')} rounded-full`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 8, ease: 'linear' }}
        />
      </motion.div>
    </AnimatePresence>
  );
}