/**
 * TrialBanner — shows a non-intrusive daily reminder during free trial.
 */
import React, { useState } from 'react';
import { usePremium } from '@/lib/PremiumContext';
import { useLanguage } from '@/lib/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrialBanner() {
  const { isTrial, trialDaysLeft } = usePremium();
  const { lang } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (!isTrial || dismissed || trialDaysLeft <= 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mx-4 mb-3"
      >
        <Link to="/premium" className="block">
          <div className="relative bg-gradient-to-r from-yellow-500/20 via-orange-500/15 to-yellow-500/20 border border-yellow-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-yellow-400">
                🔥 {lang === 'ar' ? 'أنت تستخدم النسخة الكاملة (Premium)' : 'You\'re on Full Premium Access'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {lang === 'ar' ? `باقي ${trialDaysLeft} يوم من التجربة المجانية` : `${trialDaysLeft} days left in your free trial`}
              </p>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed(true); }}
              className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
