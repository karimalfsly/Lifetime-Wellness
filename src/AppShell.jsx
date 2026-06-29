import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { base44 } from './api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageNotFound from './lib/PageNotFound';

import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Walking from './pages/Walking';
import Plans from './pages/Plans';
import Meals from './pages/Meals';
import Profile from './pages/Profile';
import History from './pages/History';
import Challenges from './pages/Challenges';
import BluetoothPage from './pages/Bluetooth';
import AIAssistant from './pages/AIAssistant';
import Leaderboard from './pages/Leaderboard';
import Premium from './pages/Premium';
import AppLayout from './components/layout/AppLayout';
import { WalkingProvider } from './lib/WalkingContext';
import { PremiumProvider } from './lib/PremiumContext';
import BiometricAuth from './components/BiometricAuth';
import { useAuth } from './lib/AuthContext';
import { isLocalPreview, localPreviewProfile, localPreviewUser } from './lib/localPreview';

export default function AppShell() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(isLocalPreview ? localPreviewUser : null);
  const [isBiometricAuthenticated, setIsBiometricAuthenticated] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(() => {
    return localStorage.getItem('biometric_enabled') === 'true';
  });

  useEffect(() => {
    if (isLocalPreview) {
      setUser(localPreviewUser);
      return;
    }
    if (authUser) {
      setUser(authUser);
      return;
    }
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, [authUser]);

  const { data: profiles = [], isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user?.email }),
    enabled: !!user?.email && !isLocalPreview,
  });

  const profile = isLocalPreview ? localPreviewProfile : profiles[0];

  const createProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  if (!user || (!isLocalPreview && profileLoading)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Check Biometric Authentication
  if (isBiometricEnabled && !isBiometricAuthenticated) {
    return <BiometricAuth onAuthenticated={() => setIsBiometricAuthenticated(true)} />;
  }

  // Show onboarding if profile doesn't exist or not completed
  if (!profile || !profile.onboarding_done) {
    return (
      <Onboarding
        user={user}
        onComplete={(data) => {
          const dataWithTrial = { ...data, trial_start_date: new Date().toISOString().split('T')[0] };
          if (profile) {
            base44.entities.UserProfile.update(profile.id, dataWithTrial).then(() => {
              queryClient.invalidateQueries({ queryKey: ['profile'] });
            });
          } else {
            createProfileMutation.mutate(dataWithTrial);
          }
        }}
      />
    );
  }

  return (
    <PremiumProvider profile={profile}>
      <WalkingProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard profile={profile} />} />
            <Route path="/walking" element={<Walking profile={profile} />} />
            <Route path="/plans" element={<Plans profile={profile} />} />
            <Route path="/meals" element={<Meals profile={profile} />} />
            <Route path="/profile" element={<Profile profile={profile} user={user} />} />
            <Route path="/history" element={<History profile={profile} />} />
            <Route path="/challenges" element={<Challenges profile={profile} />} />
            <Route path="/bluetooth" element={<BluetoothPage />} />
            <Route path="/assistant" element={<AIAssistant profile={profile} />} />
            <Route path="/leaderboard" element={<Leaderboard currentUser={user} />} />
            <Route path="/premium" element={<Premium />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </WalkingProvider>
    </PremiumProvider>
  );
}
