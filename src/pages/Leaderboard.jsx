import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { Trophy, Crown, Medal, Camera, Loader2, ImagePlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { getLevelInfo } from '@/components/dashboard/LevelBadge';

const ADMIN_EMAIL = 'njdj9985@gmail.com';

export default function Leaderboard({ currentUser }) {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const [uploadingBg, setUploadingBg] = useState(false);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const { data: myProfile = null } = useQuery({
    queryKey: ['myProfileLeaderboard', currentUser?.email],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.filter({ user_email: currentUser?.email });
      return res[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => base44.entities.UserProfile.list('-xp', 50),
  });

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['todayLogs_leaderboard'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return base44.entities.DailyLog.filter({ date: today }, '-steps', 50);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserProfile.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaderboard', 'myProfileLeaderboard'] }),
  });

  const handleBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !myProfile) return;
    setUploadingBg(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateProfileMutation.mutateAsync({ id: myProfile.id, data: { leaderboard_bg_url: file_url } });
    setUploadingBg(false);
  };

  const ranked = profiles.map(p => {
    const todayLog = todayLogs.find(l => l.user_email === p.user_email);
    return { ...p, todaySteps: todayLog?.steps || 0 };
  }).sort((a, b) => (b.xp || 0) - (a.xp || 0));

  const getRankIcon = (i) => {
    if (i === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (i === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (i === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-black text-muted-foreground">#{i + 1}</span>;
  };

  const getAvatarDisplay = (p, size = 'md') => {
    const s = size === 'lg' ? 'w-14 h-14 text-2xl' : 'w-10 h-10 text-base';
    if (p.avatar_url) {
      return <img src={p.avatar_url} alt="" className={`${s} rounded-2xl object-cover`} />;
    }
    return (
      <div className={`${s} rounded-2xl flex items-center justify-center font-black`}
        style={{ background: size === 'lg' ? 'rgba(234,179,8,0.2)' : 'hsl(var(--muted))', color: size === 'lg' ? '#facc15' : 'hsl(var(--muted-foreground))' }}>
        {(p.full_name || p.user_email || 'U')[0].toUpperCase()}
      </div>
    );
  };

  // leaderboard bg from admin or top player
  const lbBg = myProfile?.leaderboard_bg_url || ranked[0]?.leaderboard_bg_url;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero with background image */}
      <div className="relative h-44 overflow-hidden">
        {lbBg ? (
          <img src={lbBg} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-yellow-500/30 via-orange-500/20 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Upload bg button (for current user) */}
        <label className={`absolute top-12 right-4 bg-card/80 backdrop-blur-md rounded-full p-2.5 cursor-pointer border border-border shadow-lg hover:bg-card transition-all z-10 ${uploadingBg ? 'opacity-50' : ''}`}>
          {uploadingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" disabled={uploadingBg || !myProfile} />
        </label>

        <div className="absolute bottom-4 left-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/30 backdrop-blur-sm flex items-center justify-center border border-yellow-500/30">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white drop-shadow-lg">
                {lang === 'ar' ? '🏆 المنافسة العالمية' : '🏆 Global Rankings'}
              </h1>
              <p className="text-xs text-white/70">
                {lang === 'ar' ? `${ranked.length} مستخدم في المنافسة` : `${ranked.length} users competing`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {ranked.length >= 3 && (
        <div className="px-4 mb-4 -mt-2">
          <div className="flex items-end justify-center gap-2">
            {/* 2nd */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="flex-1 bg-card rounded-3xl p-3 border border-slate-500/20 text-center pb-4">
              <div className="text-xl mb-2">🥈</div>
              <div className="flex justify-center mb-1.5">{getAvatarDisplay(ranked[1])}</div>
              <p className="text-xs font-black truncate">{ranked[1]?.full_name?.split(' ')[0] || 'User'}</p>
              <p className="text-[10px] text-slate-400 font-bold">{ranked[1]?.xp || 0} XP</p>
              <span className="text-[9px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                {getLevelInfo(ranked[1]?.level || 1).emoji} {lang === 'ar' ? getLevelInfo(ranked[1]?.level || 1).titleAr : getLevelInfo(ranked[1]?.level || 1).titleEn}
              </span>
            </motion.div>

            {/* 1st — taller */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              className="flex-1 bg-gradient-to-b from-yellow-500/25 to-yellow-500/5 rounded-3xl p-3 border-2 border-yellow-500/40 text-center pb-5 shadow-xl shadow-yellow-500/15 -mt-4">
              <div className="text-2xl mb-2">👑</div>
              <div className="flex justify-center mb-1.5">{getAvatarDisplay(ranked[0], 'lg')}</div>
              <p className="text-sm font-black truncate">{ranked[0]?.full_name?.split(' ')[0] || 'User'}</p>
              <p className="text-xs text-yellow-400 font-black">{ranked[0]?.xp || 0} XP</p>
              <span className="text-[9px] bg-yellow-500/25 text-yellow-400 px-2 py-0.5 rounded-full mt-1 inline-block font-bold">
                {getLevelInfo(ranked[0]?.level || 1).emoji} {lang === 'ar' ? getLevelInfo(ranked[0]?.level || 1).titleAr : getLevelInfo(ranked[0]?.level || 1).titleEn}
              </span>
              {ranked[0]?.streak_days > 0 && (
                <p className="text-[9px] text-orange-400 mt-1">🔥 {ranked[0].streak_days} {lang === 'ar' ? 'يوم' : 'days'}</p>
              )}
            </motion.div>

            {/* 3rd */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex-1 bg-card rounded-3xl p-3 border border-amber-600/20 text-center pb-4">
              <div className="text-xl mb-2">🥉</div>
              <div className="flex justify-center mb-1.5">{getAvatarDisplay(ranked[2])}</div>
              <p className="text-xs font-black truncate">{ranked[2]?.full_name?.split(' ')[0] || 'User'}</p>
              <p className="text-[10px] text-amber-500 font-bold">{ranked[2]?.xp || 0} XP</p>
              <span className="text-[9px] bg-amber-600/20 text-amber-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                {getLevelInfo(ranked[2]?.level || 1).emoji} {lang === 'ar' ? getLevelInfo(ranked[2]?.level || 1).titleAr : getLevelInfo(ranked[2]?.level || 1).titleEn}
              </span>
            </motion.div>
          </div>
        </div>
      )}

      {/* Full Rankings */}
      <div className="px-4 space-y-2">
        <h3 className="text-sm font-black text-muted-foreground mb-3">
          {lang === 'ar' ? '📋 جميع اللاعبين' : '📋 All Players'}
        </h3>
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        {ranked.map((p, i) => {
          const levelInfo = getLevelInfo(p.level || 1);
          const isMe = p.user_email === currentUser?.email;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all ${
                isMe ? 'bg-primary/10 border-primary/30 shadow-md shadow-primary/10' : 'bg-card border-border'
              }`}>
              <div className="w-7 flex items-center justify-center flex-shrink-0">
                {getRankIcon(i)}
              </div>
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 ${i === 0 ? 'ring-2 ring-yellow-400' : i === 1 ? 'ring-2 ring-slate-400' : i === 2 ? 'ring-2 ring-amber-600' : ''}`}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-base font-black ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-slate-500/20 text-slate-400' :
                    i === 2 ? 'bg-amber-600/20 text-amber-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {(p.full_name || p.user_email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-black truncate ${isMe ? 'text-primary' : ''}`}>
                  {p.full_name?.split(' ')[0] || (lang === 'ar' ? 'مستخدم' : 'User')}
                  {isMe && <span className="text-[9px] bg-primary/20 text-primary px-1 rounded ml-1">{lang === 'ar' ? 'أنت' : 'You'}</span>}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted">{levelInfo.emoji} {lang === 'ar' ? levelInfo.titleAr : levelInfo.titleEn}</span>
                  {p.streak_days > 0 && <span className="text-[9px] text-orange-400">🔥{p.streak_days}</span>}
                  {p.todaySteps > 0 && <span className="text-[9px] text-primary">👣{p.todaySteps.toLocaleString()}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-black ${isMe ? 'text-primary' : 'text-foreground'}`}>{(p.xp || 0).toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">XP</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
