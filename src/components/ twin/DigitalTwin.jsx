import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Brain, TrendingUp, TrendingDown, Zap, RefreshCw, ChevronRight, Activity, Dumbbell, Footprints } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function calcFuture(logs, profile) {
  if (!logs?.length) return null;

  const last7 = logs.slice(0, 7);
  const avgSteps = Math.round(last7.reduce((s, l) => s + (l.steps || 0), 0) / last7.length);
  const avgSleep = +(last7.reduce((s, l) => s + (l.sleep_hours || 7), 0) / last7.length).toFixed(1);
  const avgCal = Math.round(last7.reduce((s, l) => s + (l.calories_burned || 0), 0) / last7.length);
  const goal = profile?.daily_step_goal || 5000;
  const activityRatio = avgSteps / goal;

  // Fitness score 0-100
  const stepScore = Math.min(activityRatio * 40, 40);
  const sleepScore = avgSleep >= 7 && avgSleep <= 9 ? 30 : avgSleep >= 6 ? 20 : 10;
  const calScore = avgCal > 200 ? 30 : avgCal > 100 ? 20 : 10;
  const currentScore = Math.round(stepScore + sleepScore + calScore);

  // 7-day prediction
  const delta7 = activityRatio >= 1 ? +8 : activityRatio >= 0.7 ? +3 : activityRatio >= 0.4 ? -2 : -8;
  // 30-day prediction
  const delta30 = activityRatio >= 1 ? +18 : activityRatio >= 0.7 ? +7 : activityRatio >= 0.4 ? -5 : -15;

  const score7 = Math.max(0, Math.min(100, currentScore + delta7));
  const score30 = Math.max(0, Math.min(100, currentScore + delta30));

  return { avgSteps, avgSleep, avgCal, currentScore, score7, score30, delta7, delta30, activityRatio };
}

const ScoreRing = ({ score, label, size = 80 }) => {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#4ade80' : score >= 45 ? '#facc15' : '#f87171';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={size * 0.08} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
            strokeWidth={size * 0.08} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-sm leading-none" style={{ color }}>{score}</span>
        </div>
      </div>
      <p className="text-[9px] text-muted-foreground text-center font-semibold">{label}</p>
    </div>
  );
};

export default function DigitalTwin({ logs, profile }) {
  const { lang } = useLanguage();
  const [scenario, setScenario] = useState(null); // null | 'active' | 'lazy'
  const [aiPrediction, setAiPrediction] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const data = calcFuture(logs, profile);
  if (!data) return null;

  const { avgSteps, avgSleep, avgCal, currentScore, score7, score30, delta7, delta30, activityRatio } = data;

  const getAIPrediction = async (choice) => {
    setScenario(choice);
    setAiLoading(true);
    setAiPrediction(null);
    const isActive = choice === 'active';
    const prompt = lang === 'ar'
      ? `أنت محلل صحي ذكي. المستخدم متوسط خطواته ${avgSteps} يومياً، نومه ${avgSleep} ساعة، سعراته المحروقة ${avgCal}. قرر ${isActive ? 'يزيد نشاطه 30%' : 'يبقى على نفس مستواه المنخفض'}. اكتب 2 جملة قصيرة جداً تخبره بالنتيجة بعد أسبوع وشهر بشكل شخصي ومثير ومع أرقام حقيقية. لا تكن مملاً.`
      : `You are a health analyst. User avg steps: ${avgSteps}/day, sleep: ${avgSleep}h, calories burned: ${avgCal}. They decided to ${isActive ? 'increase activity by 30%' : 'stay at their current low activity level'}. Write 2 very short exciting sentences about what happens in 7 days and 30 days. Use real numbers. Be exciting, not boring.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiPrediction(res);
    setAiLoading(false);
  };

  const trend7 = delta7 > 0 ? 'up' : delta7 < 0 ? 'down' : 'flat';
  const trend30 = delta30 > 0 ? 'up' : delta30 < 0 ? 'down' : 'flat';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-border bg-card">

      {/* Glowing background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/8 via-transparent to-primary/8 pointer-events-none" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/30 to-primary/20 flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/10">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-black">
                {lang === 'ar' ? '🧬 نسختك الرقمية' : '🧬 Digital Twin AI'}
              </h3>
              <p className="text-[10px] text-purple-400 font-semibold">
                {lang === 'ar' ? 'يتوقع مستقبلك الصحي' : 'Predicts your health future'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-purple-500/10 rounded-full px-2.5 py-1 border border-purple-500/20">
            <Activity className="w-3 h-3 text-purple-400" />
            <span className="text-[9px] text-purple-400 font-black">LIVE</span>
          </div>
        </div>
      </div>

      {/* Score Rings */}
      <div className="relative px-5 pb-4">
        <div className="bg-muted/50 rounded-2xl p-4">
          <p className="text-[10px] text-muted-foreground text-center mb-3 font-semibold">
            {lang === 'ar' ? '📊 مسار لياقتك' : '📊 Your Fitness Trajectory'}
          </p>
          <div className="flex justify-around">
            <ScoreRing score={currentScore} label={lang === 'ar' ? 'الآن' : 'Now'} size={72} />
            <div className="flex items-center">
              {trend7 === 'up'
                ? <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1 }}><ChevronRight className="w-5 h-5 text-green-400" /></motion.div>
                : <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1 }}><ChevronRight className="w-5 h-5 text-red-400 rotate-180" /></motion.div>
              }
            </div>
            <ScoreRing score={score7} label={lang === 'ar' ? 'بعد 7 أيام' : 'In 7 days'} size={72} />
            <div className="flex items-center">
              {trend30 === 'up'
                ? <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}><ChevronRight className="w-5 h-5 text-green-400" /></motion.div>
                : <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}><ChevronRight className="w-5 h-5 text-red-400 rotate-180" /></motion.div>
              }
            </div>
            <ScoreRing score={score30} label={lang === 'ar' ? 'بعد 30 يوم' : 'In 30 days'} size={72} />
          </div>
        </div>

        {/* Predictions Row */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className={`rounded-2xl p-3 border ${delta7 >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              {delta7 >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
              <span className={`text-[10px] font-black ${delta7 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {lang === 'ar' ? '7 أيام' : '7 Days'}
              </span>
            </div>
            <p className={`text-lg font-black ${delta7 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {delta7 >= 0 ? '+' : ''}{delta7}%
            </p>
            <p className="text-[9px] text-muted-foreground">
              {lang === 'ar' ? 'تغير اللياقة' : 'Fitness change'}
            </p>
          </div>
          <div className={`rounded-2xl p-3 border ${delta30 >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              {delta30 >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
              <span className={`text-[10px] font-black ${delta30 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {lang === 'ar' ? '30 يوم' : '30 Days'}
              </span>
            </div>
            <p className={`text-lg font-black ${delta30 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {delta30 >= 0 ? '+' : ''}{delta30}%
            </p>
            <p className="text-[9px] text-muted-foreground">
              {lang === 'ar' ? 'تغير اللياقة' : 'Fitness change'}
            </p>
          </div>
        </div>

        {/* Current stats */}
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {[
            { icon: Footprints, val: avgSteps.toLocaleString(), label: lang === 'ar' ? 'متوسط الخطوات' : 'Avg Steps', color: 'text-primary' },
            { icon: Activity, val: `${avgSleep}h`, label: lang === 'ar' ? 'متوسط النوم' : 'Avg Sleep', color: 'text-indigo-400' },
            { icon: Dumbbell, val: avgCal, label: lang === 'ar' ? 'سعرات/يوم' : 'Cal/day', color: 'text-orange-400' },
          ].map((s, i) => (
            <div key={i} className="bg-muted rounded-2xl p-2.5 text-center">
              <s.icon className={`w-3.5 h-3.5 mx-auto mb-1 ${s.color}`} />
              <p className={`text-xs font-black ${s.color}`}>{s.val}</p>
              <p className="text-[8px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 🎮 Scenario Game */}
        <div className="mt-3">
          <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 rounded-2xl p-3 border border-purple-500/20">
            <p className="text-xs font-black mb-2 text-center">
              🎮 {lang === 'ar' ? 'اختر قرارك — شوف مستقبلك!' : 'Choose your decision — See your future!'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => getAIPrediction('active')}
                className={`rounded-2xl p-3 border-2 transition-all ${scenario === 'active' ? 'border-green-400 bg-green-400/15' : 'border-green-500/30 bg-green-500/10'}`}>
                <p className="text-xl mb-1">🏃</p>
                <p className="text-xs font-black text-green-400">
                  {lang === 'ar' ? 'أتحرك اليوم' : 'I\'ll be active'}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {lang === 'ar' ? 'زيادة 30% نشاط' : '+30% activity'}
                </p>
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => getAIPrediction('lazy')}
                className={`rounded-2xl p-3 border-2 transition-all ${scenario === 'lazy' ? 'border-red-400 bg-red-400/15' : 'border-red-500/30 bg-red-500/10'}`}>
                <p className="text-xl mb-1">🛋️</p>
                <p className="text-xs font-black text-red-400">
                  {lang === 'ar' ? 'أجلس اليوم' : 'I\'ll stay lazy'}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {lang === 'ar' ? 'نفس المستوى' : 'Same level'}
                </p>
              </motion.button>
            </div>

            <AnimatePresence>
              {aiLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex gap-1.5 justify-center mt-3">
                  {[0,1,2,3].map(i => (
                    <motion.div key={i} className="w-2 h-2 bg-purple-400/60 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ delay: i * 0.1, repeat: Infinity, duration: 0.6 }} />
                  ))}
                </motion.div>
              )}
              {aiPrediction && !aiLoading && (
                <motion.div key={scenario} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 p-3 rounded-2xl border ${scenario === 'active' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <p className="text-[10px] font-black mb-1 flex items-center gap-1">
                    <Zap className={`w-3 h-3 ${scenario === 'active' ? 'text-green-400' : 'text-red-400'}`} />
                    {lang === 'ar' ? 'توقع الذكاء الاصطناعي:' : 'AI Prediction:'}
                  </p>
                  <p className="text-xs text-foreground/90 leading-relaxed">{aiPrediction}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
