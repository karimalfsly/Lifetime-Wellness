import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Camera, History, Trophy, Watch, Globe, LogOut, Pencil, Save, X, Star, Zap, MessageCircle, ImagePlus, Loader2, Trash2, AlertTriangle, Crown } from 'lucide-react';
import { usePremium } from '@/lib/PremiumContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile({ profile, user }) {
  const { t, lang, setLang } = useLanguage();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: walkSessions = [] } = useQuery({
    queryKey: ['walkSessions', profile?.user_email],
    queryFn: () => base44.entities.WalkSession.filter({ user_email: profile?.user_email, status: 'completed' }, '-created_date', 10),
    enabled: !!profile?.user_email,
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allProfileLogs', profile?.user_email],
    queryFn: () => base44.entities.DailyLog.filter({ user_email: profile?.user_email }, '-date', 30),
    enabled: !!profile?.user_email,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.update(profile.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); setEditing(false); },
  });

  const handleBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateProfileMutation.mutate({ profile_bg_url: file_url });
    setUploading(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateProfileMutation.mutate({ avatar_url: file_url });
    setUploadingAvatar(false);
  };

  const startEdit = () => {
    setEditData({
      age: profile?.age || '',
      height_cm: profile?.height_cm || '',
      weight_kg: profile?.weight_kg || '',
      daily_step_goal: profile?.daily_step_goal || 5000,
    });
    setEditing(true);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const deleteAccount = async () => {
    setDeletingAccount(true);
    await base44.entities.UserProfile.delete(profile.id);
    base44.auth.logout();
  };

  const levelProgress = (profile?.xp || 0) % 100;
  const totalSteps = allLogs.reduce((s, l) => s + (l.steps || 0), 0);
  const totalCalories = allLogs.reduce((s, l) => s + (l.calories_burned || 0), 0);
  const totalWalks = walkSessions.length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Cover */}
      <div className="relative h-52 overflow-hidden">
        {profile?.profile_bg_url ? (
          <img src={profile.profile_bg_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 via-accent/20 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <label className={`absolute top-12 right-4 bg-card/80 backdrop-blur-md rounded-full p-2.5 cursor-pointer border border-border shadow-lg transition-all hover:bg-card ${uploading ? 'opacity-50' : ''}`}>
          <Camera className="w-4 h-4" />
          <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      <div className="px-4 -mt-16 relative z-10 space-y-4">
        {/* Avatar & Name */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-4">
          {/* Clickable avatar with photo upload */}
          <div className="relative">
            <label className="cursor-pointer block">
              <div className="w-24 h-24 rounded-3xl border-4 border-background shadow-xl overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/40 to-accent/20 flex items-center justify-center text-4xl font-black text-primary">
                    {(user?.full_name || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
            </label>
            {/* Camera overlay */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow pointer-events-none">
              {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" /> : <ImagePlus className="w-3.5 h-3.5 text-primary-foreground" />}
            </div>
          </div>

          <div className="flex-1 pb-1">
            <h1 className="text-xl font-black">{user?.full_name || 'User'}</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                🏆 {t('level')} {profile?.level || 1}
              </span>
              <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">
                ⚡ {profile?.xp || 0} {t('xp')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Level Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold">{t('level')} {profile?.level || 1} → {(profile?.level || 1) + 1}</span>
            </div>
            <span className="text-xs text-muted-foreground">{levelProgress}/100 {t('xp')}</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: lang === 'ar' ? 'إجمالي الخطوات' : 'Total Steps', value: totalSteps.toLocaleString(), emoji: '👣' },
              { label: lang === 'ar' ? 'إجمالي السعرات' : 'Total Cal', value: totalCalories.toLocaleString(), emoji: '🔥' },
              { label: lang === 'ar' ? 'جلسات المشي' : 'Walk Sessions', value: totalWalks, emoji: '🚶' },
            ].map((s, i) => (
              <div key={i} className="bg-muted rounded-2xl p-3 text-center">
                <p className="text-lg">{s.emoji}</p>
                <p className="text-sm font-black">{s.value}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Edit Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {editing ? (
            <div className="bg-card rounded-3xl p-5 border border-primary/20 space-y-4">
              <h3 className="font-bold text-sm">{t('editProfile')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'age', label: t('age'), type: 'number' },
                  { key: 'weight_kg', label: `${t('weight')} (kg)`, type: 'number' },
                  { key: 'height_cm', label: `${t('height')} (cm)`, type: 'number' },
                  { key: 'daily_step_goal', label: t('stepGoal'), type: 'number' },
                ].map(field => (
                  <div key={field.key}>
                    <Label className="text-xs text-muted-foreground">{field.label}</Label>
                    <Input type={field.type} value={editData[field.key]}
                      onChange={e => setEditData({ ...editData, [field.key]: e.target.value })}
                      className="bg-muted border-border mt-1" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-primary h-11 rounded-2xl font-bold"
                  onClick={() => updateProfileMutation.mutate({
                    age: parseInt(editData.age) || profile.age,
                    height_cm: parseInt(editData.height_cm) || profile.height_cm,
                    weight_kg: parseInt(editData.weight_kg) || profile.weight_kg,
                    daily_step_goal: parseInt(editData.daily_step_goal) || profile.daily_step_goal,
                  })}>
                  <Save className="w-4 h-4 mr-1" /> {t('save')}
                </Button>
                <Button variant="outline" className="flex-1 h-11 rounded-2xl" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4 mr-1" /> {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full h-12 rounded-2xl font-semibold border-primary/20" onClick={startEdit}>
              <Pencil className="w-4 h-4 mr-2" /> {t('editProfile')}
            </Button>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
          {[
            { to: '/history', Icon: History, label: t('history'), color: 'text-primary', bg: 'bg-primary/10' },
            { to: '/challenges', Icon: Trophy, label: t('challenges'), color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
            { to: '/bluetooth', Icon: Watch, label: t('connectWatch'), color: 'text-accent', bg: 'bg-accent/10' },
            { to: '/assistant', Icon: MessageCircle, label: lang === 'ar' ? 'المساعد الذكي' : 'AI Assistant', color: 'text-purple-400', bg: 'bg-purple-400/10' },
          ].map(({ to, Icon, label, color, bg }) => (
            <Link key={to} to={to} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3 hover:bg-muted transition-all">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-sm font-semibold">{label}</span>
              <Zap className="w-4 h-4 text-muted-foreground ml-auto" />
            </Link>
          ))}
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">{t('language')}</span>
          </div>
          <div className="flex bg-muted rounded-xl p-0.5 gap-0.5">
            {['en', 'ar'].map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === l ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}>
                {l === 'en' ? 'EN' : 'عربي'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent Walks */}
        {walkSessions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-sm font-bold text-muted-foreground mb-3">{lang === 'ar' ? '🚶 آخر جلسات المشي' : '🚶 Recent Walks'}</h2>
            <div className="space-y-2">
              {walkSessions.slice(0, 5).map(session => (
                <div key={session.id} className="bg-card rounded-2xl p-3 border border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{session.date}</p>
                    <p className="text-xs text-muted-foreground">
                      👣 {(session.steps || 0).toLocaleString()} • {(session.distance_km || 0).toFixed(2)} km • 🔥 {session.calories_burned || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{session.duration_minutes || 0}</p>
                    <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'دقيقة' : 'min'}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Logout */}
        <Button variant="outline" className="w-full h-12 rounded-2xl border-red-500/20 text-red-400 hover:bg-red-500/5 font-semibold"
          onClick={() => base44.auth.logout()}>
          <LogOut className="w-4 h-4 mr-2" /> {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </Button>

        {/* Delete Account */}
        <button onClick={() => setShowDeleteConfirm(true)}
          className="w-full text-xs text-muted-foreground/50 hover:text-destructive transition-colors py-2 flex items-center justify-center gap-1.5">
          <Trash2 className="w-3 h-3" />
          {lang === 'ar' ? 'حذف الحساب' : 'Delete Account'}
        </button>

        <div className="h-4" />
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowDeleteConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 border-t border-border shadow-2xl"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
              <div className="flex flex-col items-center text-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-3xl bg-destructive/15 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="text-lg font-black">{lang === 'ar' ? 'حذف الحساب نهائياً؟' : 'Delete Account?'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lang === 'ar'
                    ? 'سيتم حذف جميع بياناتك بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.'
                    : 'All your data will be permanently deleted. This action cannot be undone.'}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold" onClick={() => setShowDeleteConfirm(false)}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  className="flex-1 h-12 rounded-2xl font-black bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/30"
                  onClick={deleteAccount}
                  disabled={deletingAccount}>
                  {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  {lang === 'ar' ? 'حذف نهائي' : 'Delete Forever'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
