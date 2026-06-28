import React, { useEffect, useState } from 'react';
import { useOnlineStatus, syncPendingMutations } from '@/lib/useOfflineSync';
import { useLanguage } from '@/lib/LanguageContext';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { lang } = useLanguage();
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // When we come back online, sync pending mutations
  useEffect(() => {
    if (isOnline) {
      setSyncing(true);
      syncPendingMutations()
        .then(count => {
          if (count > 0) {
            setJustSynced(true);
            setTimeout(() => setJustSynced(false), 3000);
          }
        })
        .finally(() => setSyncing(false));
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {(!isOnline || justSynced || syncing) && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold"
          style={{
            paddingTop: `calc(0.5rem + env(safe-area-inset-top))`,
            background: !isOnline
              ? 'hsl(0 72% 55%)'
              : syncing
              ? 'hsl(196 80% 50%)'
              : 'hsl(160 84% 44%)',
          }}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-white" />
              <span className="text-white">
                {lang === 'ar'
                  ? '📴 وضع بدون إنترنت — بياناتك محفوظة محلياً'
                  : '📴 Offline — data saved locally'}
              </span>
            </>
          ) : syncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
              <span className="text-white">
                {lang === 'ar' ? '🔄 جارٍ المزامنة...' : '🔄 Syncing...'}
              </span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-primary-foreground" />
              <span className="text-primary-foreground">
                {lang === 'ar' ? '✅ تمت المزامنة!' : '✅ All synced!'}
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
