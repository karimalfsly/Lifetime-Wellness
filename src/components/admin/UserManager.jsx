import React, { useState } from 'react';
import { base44 } from '../../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../lib/LanguageContext';
import { usePremium } from '../../lib/PremiumContext';
import { Crown, Search, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserManager() {
  const { isOwner } = usePremium();
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const [actionUserId, setActionUserId] = useState(null);

  const { data: allProfiles = [], isLoading } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 100),
    enabled: isOwner && open,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserProfile.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allProfiles'] }),
  });

  if (!isOwner) return null;

  const filtered = allProfiles.filter(p =>
    p.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    p.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const grantPremium = (profile) => {
    updateMutation.mutate({ id: profile.id, data: { premium_status: 'premium' } });
  };

  const revokePremium = (profile) => {
    updateMutation.mutate({ id: profile.id, data: { premium_status: 'free', trial_start_date: new Date().toISOString().split('T')[0] } });
  };

  const grantCustomTrial = (profile, days) => {
    const start = new Date();
    start.setDate(start.getDate() - (30 - parseInt(days)));
    updateMutation.mutate({
      id: profile.id,
      data: {
        trial_start_date: start.toISOString().split('T')[0],
        premium_status: 'free',
      }
    });
    setActionUserId(null);
    setCustomDays('');
  };

  return (
    <>
      {/* Admin button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-2xl px-4 py-2.5 text-xs font-black w-full"
      >
        <Crown className="w-4 h-4" />
        {lang === 'ar' ? '👑 لوحة تحكم المالك' : '👑 Owner Control Panel'}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border shadow-2xl max-h-[85vh] flex flex-col"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="p-5 border-b border-border flex-shrink-0">
                <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-base font-black">{lang === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</h2>
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-2xl px-3 py-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={lang === 'ar' ? 'بحث بالايميل أو الاسم...' : 'Search by email or name...'}
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-4 space-y-3">
                {isLoading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
                {filtered.map(p => {
                  const isPremium = p.premium_status === 'premium';
                  const isUpdating = updateMutation.isPending && updateMutation.variables?.id === p.id;
                  return (
                    <div key={p.id} className="bg-muted rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold">{p.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{p.user_email}</p>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${
                            isPremium ? 'bg-yellow-500/20 text-yellow-400' : 'bg-muted-foreground/20 text-muted-foreground'
                          }`}>
                            {isPremium ? '⭐ Premium' : '🆓 Free'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {isPremium ? (
                            <button
                              onClick={() => revokePremium(p)}
                              disabled={isUpdating}
                              className="flex items-center gap-1 bg-red-500/20 text-red-400 rounded-xl px-3 py-1.5 text-xs font-bold"
                            >
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                              {lang === 'ar' ? 'سحب' : 'Revoke'}
                            </button>
                          ) : (
                            <button
                              onClick={() => grantPremium(p)}
                              disabled={isUpdating}
                              className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 rounded-xl px-3 py-1.5 text-xs font-bold"
                            >
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              {lang === 'ar' ? 'منح Premium' : 'Grant Premium'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Custom trial days */}
                      {actionUserId === p.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={customDays}
                            onChange={e => setCustomDays(e.target.value)}
                            placeholder={lang === 'ar' ? 'عدد الأيام' : 'Days'}
                            className="flex-1 bg-background rounded-xl px-3 py-1.5 text-sm outline-none border border-border"
                          />
                          <button
                            onClick={() => grantCustomTrial(p, customDays)}
                            disabled={!customDays}
                            className="bg-primary text-primary-foreground rounded-xl px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                          >
                            ✅
                          </button>
                          <button onClick={() => setActionUserId(null)} className="bg-muted rounded-xl px-3 py-1.5 text-xs">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActionUserId(p.id)}
                          className="flex items-center gap-1.5 text-xs text-accent font-bold"
                        >
                          <Calendar className="w-3 h-3" />
                          {lang === 'ar' ? 'إعطاء تجربة مخصصة (X يوم)' : 'Grant custom trial (X days)'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
