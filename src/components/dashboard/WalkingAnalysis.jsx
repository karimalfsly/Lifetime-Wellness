import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useLanguage } from '../../lib/LanguageContext';
import { TrendingUp, Footprints, Flame, Clock, Target, Loader2, BarChart2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WalkingAnalysis({ profile, dailyLogs }) {
  const { lang } = useLanguage();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const last7 = dailyLogs?.slice(0, 7) || [];
  const avgSteps = last7.length > 0
    ? Math.round(last7.reduce((s, l) => s + (l.steps || 0), 0) / last7.length)
    : 0;
  const totalSteps7 = last7.reduce((s, l) => s + (l.steps || 0), 0);
  const totalCal7 = last7.reduce((s, l) => s + (l.calories_burned || 0), 0);
  const activeDays = last7.filter(l => (l.steps || 0) > 1000).length;
  const goal = profile?.daily_step_goal || 5000;
  const goalHitDays = last7.filter(l => (l.steps || 0) >= goal).length;

  const generateAnalysis = async () => {
    setLoading(true);
    const prompt = lang === 'ar'
      ? `أنت محلل لياقة بدنية خبير. حلل أداء المشي لهذا المستخدم خلال آخر 7 أيام بشكل عميق واحترافي:
- متوسط الخطوات: ${avgSteps.toLocaleString()} خطوة/يوم
- إجمالي الخطوات: ${totalSteps7.toLocaleString()}
- إجمالي السعرات المحروقة: ${totalCal7.toLocaleString()}
- أيام نشطة: ${activeDays}/7
- أيام حقق فيها الهدف (${goal.toLocaleString()} خطوة): ${goalHitDays}/7
- هدف المستخدم: ${profile?.goal || 'improve_fitness'}

قدم تحليلاً شاملاً يشمل: 1) تقييم الأداء بدقة 2) نقاط القوة 3) مناطق التحسين 4) 3 توصيات عملية ومحددة 5) توقع لأداء الأسبوع القادم إذا استمر. كن محدداً وادكر الأرقام الفعلية. 4-5 جمل قصيرة.`
      : `You are an expert fitness analyst. Deeply analyze this user's walking performance over the last 7 days:
- Avg steps: ${avgSteps.toLocaleString()} steps/day
- Total steps: ${totalSteps7.toLocaleString()}
- Total calories burned: ${totalCal7.toLocaleString()}
- Active days: ${activeDays}/7
- Goal achieved days (${goal.toLocaleString()} steps): ${goalHitDays}/7
- User goal: ${profile?.goal || 'improve_fitness'}

Provide a comprehensive analysis: 1) Performance assessment 2) Strengths 3) Improvement areas 4) 3 specific actionable recommendations 5) Next week forecast if trend continues. Be specific, mention actual numbers. 4-5 short sentences.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAnalysis(res);
    setLoading(false);
  };

  // Score out of 100
  const score = Math.min(100, Math.round(
    (avgSteps / goal) * 40 +
    (activeDays / 7) * 30 +
    (goalHitDays / 7) * 30
  ));

  const scoreColor = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = score >= 80 ? 'bg-green-400/10 border-green-400/20' : score >= 50 ? 'bg-yellow-400/10 border-yellow-400/20' : 'bg-red-400/10 border-red-400/20';
  const scoreLabel = score >= 80
    ? (lang === 'ar' ? 'ممتاز 🔥' : 'Excellent 🔥')
    : score >= 50
    ? (lang === 'ar' ? 'جيد 💪' : 'Good 💪')
    : (lang === 'ar' ? 'يحتاج تحسين 📈' : 'Needs Improvement 📈');

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/15 to-primary/10 px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent/20 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-black">{lang === 'ar' ? '📊 تحليل المشي الأسبوعي' : '📊 Weekly Walk Analysis'}</h3>
              <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'مستقل عن جلسات المشي' : 'Independent activity analysis'}</p>
            </div>
          </div>
          <button
            onClick={generateAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 bg-accent/20 text-accent rounded-2xl px-3 py-1.5 text-xs font-bold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {lang === 'ar' ? 'تحليل' : 'Analyze'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Score Ring */}
        <div className={`rounded-2xl border p-4 ${scoreBg} flex items-center gap-4`}>
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="24" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
              <motion.circle
                cx="30" cy="30" r="24"
                fill="none" strokeWidth="6"
                strokeLinecap="round"
                stroke={score >= 80 ? '#4ade80' : score >= 50 ? '#facc15' : '#f87171'}
                strokeDasharray={`${2 * Math.PI * 24}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - score / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-black ${scoreColor}`}>{score}</span>
            </div>
          </div>
          <div>
            <p className={`text-base font-black ${scoreColor}`}>{scoreLabel}</p>
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'نقاط الأداء من 100' : 'Performance score /100'}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Footprints, label: lang === 'ar' ? 'متوسط يومي' : 'Daily Avg', value: avgSteps.toLocaleString(), unit: lang === 'ar' ? 'خطوة' : 'steps', color: 'text-primary', bg: 'bg-primary/10' },
            { icon: Target, label: lang === 'ar' ? 'الهدف حُقق' : 'Goal Hit', value: `${goalHitDays}/7`, unit: lang === 'ar' ? 'أيام' : 'days', color: 'text-green-400', bg: 'bg-green-400/10' },
            { icon: Flame, label: lang === 'ar' ? 'إجمالي السعرات' : 'Total Calories', value: totalCal7.toLocaleString(), unit: lang === 'ar' ? 'سعرة' : 'kcal', color: 'text-orange-400', bg: 'bg-orange-400/10' },
            { icon: Clock, label: lang === 'ar' ? 'أيام نشطة' : 'Active Days', value: `${activeDays}/7`, unit: lang === 'ar' ? 'يوم' : 'days', color: 'text-accent', bg: 'bg-accent/10' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-3 flex items-center gap-2.5`}>
              <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
              <div>
                <p className={`text-sm font-black ${s.color}`}>{s.value} <span className="text-[9px] font-normal text-muted-foreground">{s.unit}</span></p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 7-day bar chart */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">{lang === 'ar' ? 'آخر 7 أيام' : 'Last 7 days'}</p>
          <div className="flex items-end gap-1 h-14">
            {[...last7].reverse().map((log, i) => {
              const pct = Math.min((log.steps || 0) / goal, 1);
              const isGoal = (log.steps || 0) >= goal;
              const dayLabel = new Date(log.date).toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { weekday: 'narrow' });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <motion.div
                    className={`w-full rounded-t-lg ${isGoal ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct * 44, 4)}px` }}
                    transition={{ delay: i * 0.06, duration: 0.5 }}
                  />
                  <span className="text-[8px] text-muted-foreground">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Analysis */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 py-2">
              {[0, 1, 2, 3].map(i => (
                <motion.div key={i} className="w-2 h-2 bg-accent/50 rounded-full"
                  animate={{ y: [0, -6, 0] }} transition={{ delay: i * 0.12, repeat: Infinity, duration: 0.7 }} />
              ))}
            </motion.div>
          )}
          {analysis && !loading && (
            <motion.div
              key={analysis}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-accent/10 border border-accent/20 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <p className="text-xs font-black text-accent">{lang === 'ar' ? 'التحليل الذكي' : 'AI Analysis'}</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{analysis}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!analysis && !loading && (
          <p className="text-xs text-muted-foreground text-center py-1">
            {lang === 'ar' ? '⬆️ اضغط "تحليل" للحصول على تحليل ذكي مفصّل' : '⬆️ Press "Analyze" for detailed AI insights'}
          </p>
        )}
      </div>
    </div>
  );
}
