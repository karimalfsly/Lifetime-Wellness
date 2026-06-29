import { createClient } from '@base44/sdk';
import { appParams } from '../lib/app-params';
import { isLocalPreview, localPreviewDailyLogs, localPreviewProfile, localPreviewUser } from '../lib/localPreview';

const STORAGE_PREFIX = 'lifetime_wellness_preview_';

function readStore(entityName) {
  const key = `${STORAGE_PREFIX}${entityName}`;
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null');
    if (Array.isArray(stored)) return stored;
  } catch {}

  const seeds = {
    UserProfile: [localPreviewProfile],
    DailyLog: localPreviewDailyLogs,
    WalkSession: [],
    HealthPlan: [],
    MealPlan: [],
    Challenge: [],
    AppNotification: [],
  };
  const value = seeds[entityName] || [];
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function writeStore(entityName, value) {
  localStorage.setItem(`${STORAGE_PREFIX}${entityName}`, JSON.stringify(value));
}

function sortItems(items, sortBy) {
  if (!sortBy) return items;
  const desc = sortBy.startsWith('-');
  const key = desc ? sortBy.slice(1) : sortBy;
  return [...items].sort((a, b) => {
    const av = a[key] ?? '';
    const bv = b[key] ?? '';
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

function matchesFilter(item, filter = {}) {
  return Object.entries(filter).every(([key, value]) => item[key] === value);
}

function localEntity(entityName) {
  return {
    async list(sortBy, limit) {
      const items = sortItems(readStore(entityName), sortBy);
      return typeof limit === 'number' ? items.slice(0, limit) : items;
    },
    async filter(filter, sortBy, limit) {
      const items = sortItems(readStore(entityName).filter(item => matchesFilter(item, filter)), sortBy);
      return typeof limit === 'number' ? items.slice(0, limit) : items;
    },
    async create(data) {
      const item = {
        id: `local_${entityName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        created_date: new Date().toISOString(),
        ...data,
      };
      const items = readStore(entityName);
      writeStore(entityName, [item, ...items]);
      return item;
    },
    async update(id, data) {
      const items = readStore(entityName);
      const next = items.map(item => item.id === id ? { ...item, ...data, updated_date: new Date().toISOString() } : item);
      writeStore(entityName, next);
      return next.find(item => item.id === id) || { id, ...data };
    },
    async delete(id) {
      writeStore(entityName, readStore(entityName).filter(item => item.id !== id));
      return { id };
    },
  };
}

function buildPlanResponse(prompt = '') {
  const dayMatch = prompt.match(/(?:for|لـ)\s+(\d+)/i);
  const count = Math.min(parseInt(dayMatch?.[1] || '7', 10) || 7, 30);
  const exercises = [
    { name: 'Brisk Walk', name_ar: 'مشي سريع', duration_min: 20, sets: 1, reps: 1, type: 'cardio' },
    { name: 'Bodyweight Squats', name_ar: 'سكوات بوزن الجسم', duration_min: 8, sets: 3, reps: 12, type: 'strength' },
    { name: 'Stretching', name_ar: 'تمدد وإطالة', duration_min: 10, sets: 1, reps: 1, type: 'mobility' },
  ];

  return {
    days: Array.from({ length: count }, (_, index) => ({
      day: index + 1,
      exercises: exercises.map(ex => ({ ...ex })),
      step_goal: 5000 + Math.min(index, 10) * 300,
      tips: 'Drink water before walking and keep your pace comfortable.',
      tips_ar: 'اشرب ماء قبل المشي وحافظ على سرعة مريحة.',
      motivation: 'Small steady wins become real fitness.',
      motivation_ar: 'الاستمرار الهادئ يصنع لياقة حقيقية.',
    })),
    ai_messages: Array.from({ length: count }, (_, index) => ({
      day: index + 1,
      message: `Day ${index + 1}: move with confidence and finish your steps.`,
      message_ar: `اليوم ${index + 1}: تحرك بثقة وأنهِ خطواتك.`,
    })),
  };
}

function buildChallengeResponse() {
  return {
    challenges: [
      { title: 'First 3K Steps', title_ar: 'أول 3000 خطوة', description: 'Walk 3,000 steps today.', description_ar: 'امشِ 3000 خطوة اليوم.', type: 'steps', target_value: 3000, reward_xp: 40, days: 1, badge_icon: '👟' },
      { title: 'Hydration Boost', title_ar: 'دفعة ترطيب', description: 'Drink 6 glasses of water.', description_ar: 'اشرب 6 أكواب ماء.', type: 'water', target_value: 6, reward_xp: 30, days: 1, badge_icon: '💧' },
      { title: 'Active Minutes', title_ar: 'دقائق نشاط', description: 'Complete 25 active minutes.', description_ar: 'أكمل 25 دقيقة نشاط.', type: 'exercise', target_value: 25, reward_xp: 50, days: 2, badge_icon: '🔥' },
      { title: 'Consistency Streak', title_ar: 'سلسلة الاستمرار', description: 'Stay active for 3 days.', description_ar: 'كن نشطًا 3 أيام.', type: 'streak', target_value: 3, reward_xp: 80, days: 3, badge_icon: '🏆' },
    ],
  };
}

function buildPredictionResponse() {
  return {
    energy_level: 'medium',
    risk: 'Low movement tomorrow may reduce energy.',
    advice: 'Take a 10 minute walk after your next meal.',
    tomorrow_prediction: 'If you sleep well and walk early, your energy should improve tomorrow.',
  };
}

function buildMealResponse() {
  return {
    meals: [
      {
        type: 'breakfast',
        name: 'Greek yogurt bowl',
        name_ar: 'زبادي يوناني بالفواكه',
        description: 'Yogurt with banana, berries, oats, and a little honey.',
        description_ar: 'زبادي مع موز وتوت وشوفان وقليل من العسل.',
        calories: 360,
        protein_g: 28,
        carbs_g: 48,
        fat_g: 8,
        alternatives: [{ name: 'Eggs with toast', name_ar: 'بيض مع توست', calories: 330 }],
      },
      {
        type: 'lunch',
        name: 'Chicken rice bowl',
        name_ar: 'وعاء دجاج وأرز',
        description: 'Grilled chicken, rice, vegetables, and light sauce.',
        description_ar: 'دجاج مشوي مع أرز وخضار وصوص خفيف.',
        calories: 560,
        protein_g: 42,
        carbs_g: 62,
        fat_g: 14,
        alternatives: [{ name: 'Tuna salad wrap', name_ar: 'راب تونة وسلطة', calories: 430 }],
      },
      {
        type: 'dinner',
        name: 'Salmon and vegetables',
        name_ar: 'سلمون وخضار',
        description: 'Baked salmon with potatoes and steamed vegetables.',
        description_ar: 'سلمون بالفرن مع بطاطس وخضار مطهوة بالبخار.',
        calories: 520,
        protein_g: 38,
        carbs_g: 42,
        fat_g: 20,
        alternatives: [{ name: 'Lentil soup', name_ar: 'شوربة عدس', calories: 390 }],
      },
      {
        type: 'snack',
        name: 'Apple and almonds',
        name_ar: 'تفاح ولوز',
        description: 'A light snack for steady energy.',
        description_ar: 'وجبة خفيفة لطاقة ثابتة.',
        calories: 210,
        protein_g: 6,
        carbs_g: 24,
        fat_g: 11,
        alternatives: [{ name: 'Protein smoothie', name_ar: 'سموذي بروتين', calories: 250 }],
      },
    ],
    total_calories: 1650,
    daily_water_liters: 2.5,
  };
}

function buildTextResponse(prompt = '') {
  const isArabic = /[\u0600-\u06FF]/.test(prompt);
  if (/walking performance|أداء المشي|محلل لياقة/.test(prompt)) {
    return isArabic
      ? 'تحليلك المحلي جاهز: نشاطك جيد، ورفع متوسط خطواتك تدريجيًا سيحسن طاقتك. جرّب 10 دقائق مشي صباحًا و10 دقائق مساءً مع شرب الماء قبل البداية.'
      : 'Local analysis is ready: your activity is moving in the right direction. Add a 10 minute walk in the morning and another in the evening to improve consistency.';
  }
  if (/health analyst|محلل صحي/.test(prompt)) {
    return isArabic
      ? 'إذا زدت نشاطك 30% هذا الأسبوع سترى طاقة أفضل خلال 7 أيام. خلال شهر، ستصبح خطواتك عادة أسهل وأكثر ثباتًا.'
      : 'If you increase activity by 30%, your energy should feel better within 7 days. In 30 days, your steps will feel more automatic and steady.';
  }
  if (/coach|مدرب|مساعد صحي|health coach/.test(prompt)) {
    return isArabic
      ? 'أنا معك. ابدأ بخطوة بسيطة اليوم: امشِ 10 دقائق، اشرب ماء، وحافظ على هدف واقعي. الاستمرارية أهم من المثالية.'
      : 'I am with you. Start simple today: walk 10 minutes, drink water, and keep the goal realistic. Consistency matters more than perfection.';
  }
  return isArabic
    ? 'تم تشغيل الرد المحلي بنجاح. هذه نسخة تجريبية تعمل بدون إنترنت حتى تستطيع تجربة التطبيق بثبات.'
    : 'Local AI fallback is running. This offline preview lets you test the app reliably without internet.';
}

function createLocalBase44Client() {
  return {
    auth: {
      async me() {
        return localPreviewUser;
      },
      logout() {},
      redirectToLogin() {},
    },
    entities: {
      UserProfile: localEntity('UserProfile'),
      DailyLog: localEntity('DailyLog'),
      WalkSession: localEntity('WalkSession'),
      HealthPlan: localEntity('HealthPlan'),
      MealPlan: localEntity('MealPlan'),
      Challenge: localEntity('Challenge'),
      AppNotification: localEntity('AppNotification'),
    },
    integrations: {
      Core: {
        async InvokeLLM(options = {}) {
          const prompt = options.prompt || '';
          if (options.response_json_schema) {
            if (/challenge|تحديات/i.test(prompt)) return buildChallengeResponse();
            if (/meal|meals|وجبات/i.test(prompt)) return buildMealResponse();
            if (/energy_level|توقع صحي|health prediction/i.test(prompt)) return buildPredictionResponse();
            return buildPlanResponse(prompt);
          }
          return buildTextResponse(prompt);
        },
        async UploadFile({ file }) {
          return { file_url: file ? URL.createObjectURL(file) : '' };
        },
      },
    },
    payments: {
      async checkout() {
        alert('Local preview: payments are disabled. Premium is enabled for the owner account.');
      },
    },
  };
}

export const base44 = isLocalPreview
  ? createLocalBase44Client()
  : createClient({
      appId: appParams.appId,
      token: appParams.token,
      env: 'prod',
    });
