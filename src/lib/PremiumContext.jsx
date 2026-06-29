/**
 * PremiumContext — manages free trial (30 days) and premium status.
 * Stored in UserProfile via `premium_status`, `trial_start_date`, `points`.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { differenceInDays, parseISO } from 'date-fns';

const PremiumContext = createContext(null);

export const PREMIUM_FEATURES = {
  ai_coach: 'ai_coach',
  weekly_plan: 'weekly_plan',
  monthly_plan: 'monthly_plan',
  yearly_plan: 'yearly_plan',
  meals: 'meals',
  challenges: 'challenges',
  analytics: 'analytics',
  digital_twin: 'digital_twin',
};

// Owner email always gets free premium
const OWNER_EMAIL = 'karimalfasly@gmail.com';

export function PremiumProvider({ profile, children }) {
  const status = useMemo(() => {
    if (!profile) return { isTrial: false, isPremium: false, trialDaysLeft: 0, isExpired: false, isOwner: false };

    // Owner always has premium
    if (profile.user_email === OWNER_EMAIL) {
      return { isTrial: false, isPremium: true, trialDaysLeft: 999, isExpired: false, isOwner: true };
    }

    const isPremium = profile.premium_status === 'premium';
    if (isPremium) return { isTrial: false, isPremium: true, trialDaysLeft: 0, isExpired: false, isOwner: false };

    // trial start: use created_date if no trial_start_date
    const start = profile.trial_start_date || profile.created_date;
    if (!start) return { isTrial: true, isPremium: false, trialDaysLeft: 30, isExpired: false, isOwner: false };

    const daysPassed = differenceInDays(new Date(), parseISO(start));
    const trialDaysLeft = Math.max(0, 30 - daysPassed);
    const isTrial = trialDaysLeft > 0;
    const isExpired = trialDaysLeft === 0 && !isPremium;

    return { isTrial, isPremium, trialDaysLeft, isExpired, isOwner: false };
  }, [profile]);

  /**
   * Check if a feature is accessible.
   * Free features after trial: steps, daily_plan, basic_stats.
   */
  const canAccess = (feature) => {
    if (status.isPremium || status.isTrial) return true;
    // after trial, these remain free
    const freeFeatures = ['steps', 'daily_plan', 'basic_stats'];
    return freeFeatures.includes(feature);
  };

  const points = profile?.xp || 0;

  return (
    <PremiumContext.Provider value={{ ...status, canAccess, points }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
