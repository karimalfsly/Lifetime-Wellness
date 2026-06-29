import React, { useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { usePremium } from '../lib/PremiumContext';
import { base44 } from '../api/base44Client'; // استيراد العميل لإتمام الدفع
import { motion } from 'framer-motion';
import { Crown, Check, Brain, Calendar, UtensilsCrossed, Trophy, Sparkles, Star } from 'lucide-react';
import { Button } from '../components/ui/button';

const features = [
  { icon: Brain, en: 'AI Coach & Smart Analysis', ar: 'مدرب ذكي وتحليل احترافي', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { icon: Calendar, en: 'Weekly & Monthly Plans', ar: 'خطط أسبوعية وشهرية', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { icon: UtensilsCrossed, en: 'Full Meal System', ar: 'نظام الأكل الكامل', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { icon: Trophy, en: 'Challenges + Levels', ar: 'التحديات والمستويات', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { icon: Sparkles, en: 'Future Health Prediction', ar: 'توقع صحتك المستقبلية', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: Star, en: 'Advanced Analytics', ar: 'تحليلات متقدمة', color: 'text-pink-400', bg: 'bg-pink-400/10' },
];

export default function Premium() {
  const { lang } = useLanguage();
  const { isTrial, trialDaysLeft, isPremium } = usePremium();
  const [selected, setSelected] = useState('yearly');
  const [isLoading, setIsLoading] = useState(false);

  // دالة التعامل مع الدفع وتفعيله عبر بوابة الربط لـ base44
  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      // استدعاء نظام الدفع وتمرير رابط العودة بعد نجاح الدفع
      await base44.payments.checkout({
        plan: selected, // 'yearly' أو 'monthly'
        successUrl: window.location.origin + '/premium?success=true',
        cancelUrl: window.location.href
      });
    } catch (error) {
      console.error('Payment checkout failed:', error);
      setIsLoading(false);
    }
  };

  if (isPremium) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">👑</div>
        <h1 className="text-2xl font-black text-yellow-400 mb-2">{lang === 'ar' ? 'أنت عضو Premium!' : 'You\'re Premium!'}</h1>
        <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'استمتع بكل الميزات الكاملة 🎉' : 'Enjoy all features 🎉'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-background px-4 pt-16 pb-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(45,90%,55%,0.1),_transparent_70%)]" />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-400/30 to-orange-400/20 border border-yellow-400/30 flex items-center justify-center mx-auto mb-4">
          <Crown className="w-10 h-10 text-yellow-400" />
        </motion.div>
        <h1 className="text-2xl font-black mb-1">💎 Lifetime Wellness Premium</h1>
        <p className="text-sm text-muted-foreground">
          {lang === 'ar' ? '🔥 افتح كامل إمكاناتك' : '🔥 Unlock Your Full Potential'}
        </p>
        {isTrial && (
          <div className="mt-3 inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 py-1.5">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            <p className="text-xs font-bold text-yellow-400">
              {lang === 'ar' ? `باقي ${trialDaysLeft} يوم من تجربتك المجانية` : `${trialDaysLeft} days left in your free trial`}
            </p>
          </div>
        )}
      </div>

      <div className="px-4 space-y-4">
        {/* Special Offer */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-500/20 to-orange-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-center">
          <p className="text-sm font-black text-red-400">
            🎁 {lang === 'ar' ? 'عرض خاص — 50% خصم لأول يوم!' : 'Special Offer — 50% OFF for Day 1!'}
          </p>
          <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'العرض ينتهي قريباً' : 'Offer ends soon'}</p>
        </motion.div>

        {/* Features */}
        <div className="space-y-2">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 bg-card rounded-2xl px-4 py-3 border border-border">
              <div className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                <f.icon className={`w-4.5 h-4.5 ${f.color}`} />
              </div>
              <span className="text-sm font-semibold flex-1">{lang === 'ar' ? f.ar : f.en}</span>
              <Check className="w-4 h-4 text-primary" />
            </motion.div>
          ))}
        </div>

        {/* Pricing toggle */}
        <div className="bg-muted rounded-2xl p-1 flex gap-1">
          {[
            { key: 'monthly', labelEn: 'Monthly', labelAr: 'شهري', price: '$4.99', sub: lang === 'ar' ? '/شهر' : '/month' },
            { key: 'yearly', labelEn: 'Yearly 🔥', labelAr: 'سنوي 🔥', price: '$29', sub: lang === 'ar' ? '/سنة — وفّر 51%' : '/year — Save 51%' },
          ].map(plan => (
            <button type="button" key={plan.key} onClick={() => setSelected(plan.key)}
              className={`flex-1 rounded-xl py-3 text-center transition-all ${selected === plan.key ? 'bg-card shadow-sm' : ''}`}>
              <p className="text-[10px] font-semibold text-muted-foreground">{lang === 'ar' ? plan.labelAr : plan.labelEn}</p>
              <p className={`text-xl font-black ${selected === plan.key ? 'text-primary' : ''}`}>{plan.price}</p>
              <p className="text-[9px] text-muted-foreground">{plan.sub}</p>
            </button>
          ))}
        </div>

        {/* CTA */}
        <Button 
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full h-14 bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-black text-base rounded-2xl shadow-xl shadow-yellow-400/30"
        >
          <Crown className="w-5 h-5 mr-2" />
          {isLoading ? (lang === 'ar' ? 'جاري التحميل...' : 'Loading...') : (lang === 'ar' ? '👑 اشترك الآن' : '👑 Subscribe Now')}
        </Button>

        {/* Motivation nudge */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 text-center">
          <p className="text-sm font-bold text-primary">
            😈 {lang === 'ar' ? 'أنت قريب من هدفك… لا توقف الآن!' : "You're close to your goal… don't stop now!"}
          </p>
        </div>

        {/* Free features reminder */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs font-bold text-muted-foreground mb-2">
            ✅ {lang === 'ar' ? 'يبقى مجانياً دائماً:' : 'Always free:'}
          </p>
          {[
            lang === 'ar' ? '👣 عد الخطوات' : '👣 Step counting',
            lang === 'ar' ? '📅 خطة يومية بسيطة' : '📅 Basic daily plan',
            lang === 'ar' ? '📊 عرض التقدم الأساسي' : '📊 Basic progress view',
          ].map((f, i) => (
            <p key={i} className="text-xs text-muted-foreground">{f}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
