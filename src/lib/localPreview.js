import { appParams } from './app-params';

const isBrowser = typeof window !== 'undefined';
const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

export const isLocalPreview = Boolean(
  isBrowser &&
  !appParams.token &&
  localHosts.has(window.location.hostname) &&
  (import.meta.env.DEV || window.location.port)
);

export const localPreviewUser = {
  id: 'local-preview-user',
  email: 'karimalfasly@gmail.com',
  full_name: 'Karim Alfasly',
};

export const localPreviewProfile = {
  id: 'local-preview-profile',
  user_email: localPreviewUser.email,
  full_name: localPreviewUser.full_name,
  age: 25,
  height_cm: 170,
  weight_kg: 70,
  gender: 'male',
  goal: 'improve_fitness',
  activity_level: 'moderate',
  daily_step_goal: 5000,
  onboarding_done: true,
  language: 'en',
  premium_status: 'premium',
  trial_start_date: new Date().toISOString().split('T')[0],
  level: 3,
  xp: 420,
  streak_days: 4,
  created_date: new Date().toISOString(),
};

export const localPreviewDailyLogs = [
  {
    id: 'local-preview-log-today',
    user_email: localPreviewUser.email,
    date: new Date().toISOString().split('T')[0],
    steps: 2650,
    calories_burned: 184,
    active_minutes: 28,
    heart_rate_avg: 78,
    distance_km: 1.9,
    sleep_hours: 7,
    mood: 'good',
  },
];
