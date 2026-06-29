/**
 * PremiumGate — wraps a feature. Shows paywall if not accessible.
 */
import React, { useState } from 'react';
import { usePremium } from '../../lib/PremiumContext';
import { useLanguage } from '../../lib/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Zap, Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

export default function PremiumGate({ feature, children, fallback }) {
  const { canAccess } = usePremium();
  const { lang } = useLanguage();
  const [showPaywall, setShowPaywall] = useState(false);

  if (canAccess(feature)) return children;

  if (fallback) return fallback;

  return (
    <>
      <div className="relative cursor-pointer" onClick={() => setShowPaywall(true)}>
        <div className="pointer-events-none opacity-30 blur-sm select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center">
            <Lock className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-xs font-black text-yellow-400">
            {lang === 'ar' ? '🔒 ميزة Premium' : '🔒 Premium Feature'}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showPaywall && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
              onClick={() => setShowPaywall(false)} />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-card border-t border-yellow-400/20 rounded-t-3xl p-6 shadow-2xl"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
              <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-yellow-400/30 to-orange-400/20 border border-yellow-400/30 flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-8 h-8 text-yellow-400" />
                </div>
                <h2 className="text-xl font-black mb-1">💎 Lifetime Wellness Premium</h2>
                <p className="text-sm text-muted-foreground">
                  {lang === 'ar' ? '🔥 افتح كامل إمكاناتك' : '🔥 Unlock Your Full Potential'}
                </p>
              </div>

              <div className="space-y-2 mb-6">
                {[
                  { icon: '🧠', en: 'AI Coach & Smart Analysis', ar: 'مدرب ذكي وتحليل احترافي' },
                  { icon: '📅', en: 'Weekly & Monthly Plans', ar: 'خطط أسبوعية وشهرية' },
                  { icon: '🥗', en: 'Full Meal System', ar: 'نظام الأكل الكامل' },
                  { icon: '🏆', en: 'Challenges + Levels', ar: 'التحديات والمستويات' },
                  { icon: '🔮', en: 'Future Health AI Prediction', ar: 'توقع صحتك المستقبلية' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-2xl px-4 py-2.5">
                    <span className="text-lg">{f.icon}</span>
                    <span className="text-sm font-medium">{lang === 'ar' ? f.ar : f.en}</span>
                    <Zap className="w-3.5 h-3.5 text-yellow-400 ml-auto" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <Link to="/premium" onClick={() => setShowPaywall(false)}
                  className="flex flex-col items-center justify-center bg-muted rounded-2xl py-3 border border-border">
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'شهري' : 'Monthly'}</p>
                  <p className="text-xl font-black">$4.99</p>
                  <p className="text-[9px] text-muted-foreground">{lang === 'ar' ? '/شهر' : '/month'}</p>
                </Link>
                <Link to="/premium" onClick={() => setShowPaywall(false)}
                  className="flex flex-col items-center justify-center bg-gradient-to-br from-yellow-400/20 to-orange-400/10 rounded-2xl py-3 border border-yellow-400/30">
                  <p className="text-[9px] text-yellow-400 font-bold">{lang === 'ar' ? 'الأوفر 🔥' : 'Best Value 🔥'}</p>
                  <p className="text-xl font-black text-yellow-400">$29</p>
                  <p className="text-[9px] text-muted-foreground">{lang === 'ar' ? '/سنة' : '/year'}</p>
                </Link>
              </div>

              <Link to="/premium" onClick={() => setShowPaywall(false)}>
                <Button className="w-full h-14 bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-black text-base rounded-2xl shadow-xl shadow-yellow-400/30">
                  {lang === 'ar' ? '👑 اشترك الآن' : '👑 Subscribe Now'}
                </Button>
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
