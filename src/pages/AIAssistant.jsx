import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '../api/base44Client';
import { useLanguage } from '../lib/LanguageContext';
import { Send, Bot, User, Loader2, Trash2, Mic, MicOff, Volume2, StopCircle, Radio } from 'lucide-react';
import { useOnlineStatus } from '../lib/useOfflineSync';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_QUESTIONS_AR = [
  'ما أفضل تمارين لخسارة الوزن؟',
  'كيف أحسن نومي？',
  'ما الأكل الصحي لليوم؟',
  'كيف أزيد خطواتي اليومية؟',
];
const QUICK_QUESTIONS_EN = [
  'Best exercises for weight loss?',
  'How to improve my sleep?',
  'What to eat healthy today?',
  'How to increase my daily steps?',
];

export default function AIAssistant({ profile }) {
  const { lang } = useLanguage();
  const isOnline = useOnlineStatus();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: lang === 'ar'
        ? '👋 مرحباً! أنا مساعدك الصحي. اكتب أو اضغط 🎙️ للتحدث — أو فعّل وضع المحادثة المباشرة 🔴 للحديث والاستماع تلقائياً!'
        : "👋 Hello! I'm your AI health coach. Type or press 🎙️ to talk — or enable Live Voice Mode 🔴 to talk & listen automatically!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [listening, setListening] = useState(false);
  const [liveMode, setLiveMode] = useState(false); // 🔴 Live voice mode
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const liveModeRef = useRef(false);

  useEffect(() => {
    liveModeRef.current = liveMode;
  }, [liveMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      synthRef.current?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  // --- SPEAK ---
  const doSpeak = useCallback((text, idx, onDone) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    setSpeakingIdx(idx);

    const utt = new SpeechSynthesisUtterance(text);
    utt.volume = 1.0;
    utt.pitch = 1.0;

    const voices = synth.getVoices();

    if (lang === 'ar') {
      utt.lang = 'ar-SA';
      utt.rate = 0.75;
      // prefer Google Arabic, then any Arabic
      const v = voices.find(v => v.lang.startsWith('ar') && v.name.toLowerCase().includes('google')) ||
                voices.find(v => v.lang === 'ar-SA') ||
                voices.find(v => v.lang.startsWith('ar'));
      if (v) utt.voice = v;
    } else {
      utt.lang = 'en-US';
      utt.rate = 0.82;
      const v = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                voices.find(v => v.lang === 'en-US' && v.localService) ||
                voices.find(v => v.lang === 'en-US');
      if (v) utt.voice = v;
    }

    utt.onend = () => { setSpeakingIdx(null); if (onDone) onDone(); };
    utt.onerror = () => { setSpeakingIdx(null); if (onDone) onDone(); };
    synth.speak(utt);
  }, [lang]);

  const speakText = useCallback((text, idx, onDone) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    // If voices already loaded → speak immediately, else wait for voiceschanged
    if (synth.getVoices().length > 0) {
      doSpeak(text, idx, onDone);
    } else {
      synth.onvoiceschanged = () => {
        synth.onvoiceschanged = null;
        doSpeak(text, idx, onDone);
      };
    }
  }, [doSpeak]);

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setSpeakingIdx(null);
  };

  const offlineFallback = useCallback((q) => {
    const isAr = lang === 'ar';
    const responses = isAr ? [
      'مرحباً! لتحسين لياقتك، تأكد من ممارسة 30 دقيقة تمارين يومياً وشرب 2 لتر ماء. الاستمرارية هي السر الحقيقي! 💪',
      'لخسارة الوزن، امشِ 10،000 خطوة يومياً، قلّل السكريات، ونم 7-8 ساعات. التغييرات الصغيرة تصنع نتائج كبيرة! 🔥',
      'لتحسين النوم، تجنّب الشاشات قبل 30 دقيقة من النوم، حافظ على جدول منتظم، واجعل غرفتك باردة. النوم الجيد يحسن كل شيء! 😴',
      'الأكل الصحي: تناول البروتين مع كل وجبة، أكثر من الخضار والفواكه، وقلّل الوجبات المصنّعة. جسمك يستحق الأفضل! 🥗',
    ] : [
      'To improve fitness, aim for 30 minutes of exercise daily and drink 2 liters of water. Consistency is the real secret! 💪',
      'For weight loss: walk 10,000 steps daily, cut sugars, and sleep 7-8 hours. Small changes make big results! 🔥',
      'To improve sleep, avoid screens 30 min before bed, keep a regular schedule, and cool your room. Good sleep improves everything! 😴',
      'Healthy eating: include protein with every meal, more vegetables and fruits, and reduce processed food. Your body deserves the best! 🥗',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, [lang]);

  // --- SEND MESSAGE ---
  const send = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');

    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: q }]);

    const context = lang === 'ar'
      ? `أنت مساعد صحي ذكي محادثاتي. المستخدم: عمره ${profile?.age} سنة، وزنه ${profile?.weight_kg} كيلو، طوله ${profile?.height_cm} سم، هدفه ${profile?.goal}. السؤال: "${q}". أجب بالعربية بشكل مباشر وعملي ومحفز، 2-4 جمل فقط. استخدم إيموجي.`
      : `You are a conversational AI health coach. User: ${profile?.age}y, ${profile?.weight_kg}kg, ${profile?.height_cm}cm, goal: ${profile?.goal}. Question: "${q}". Answer directly in 2-4 sentences. Use emojis.`;

    let res;
    try {
      res = await base44.integrations.Core.InvokeLLM({ prompt: context });
      if (!res || typeof res !== 'string' || res.trim().length < 5) throw new Error('empty');
    } catch {
      res = offlineFallback(q);
    }

    setMessages(prev => {
      const newMsgs = [...prev, { role: 'assistant', text: res }];
      const newIdx = newMsgs.length - 1;
      // Speak the response, then if live mode → listen again
      setTimeout(() => {
        speakText(res, newIdx, () => {
          if (liveModeRef.current) {
            startListeningInternal(true);
          }
        });
      }, 200);
      return newMsgs;
    });

    setLoading(false);
  }, [input, loading, lang, profile, speakText, offlineFallback]);

  // --- LISTEN (internal, for live mode loop) ---
  const startListeningInternal = useCallback((autoSend = false) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const txt = e.results[0][0].transcript;
      setListening(false);
      if (autoSend && liveModeRef.current) {
        send(txt);
      } else {
        setInput(txt);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  }, [lang, send]);

  // Toggle manual mic
  const toggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      startListeningInternal(false);
    }
  };

  // Toggle live voice mode
  const toggleLiveMode = () => {
    if (liveMode) {
      // Turn off
      setLiveMode(false);
      liveModeRef.current = false;
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
      setSpeakingIdx(null);
      setListening(false);
    } else {
      // Turn on → start listening immediately
      setLiveMode(true);
      liveModeRef.current = true;
      startListeningInternal(true);
    }
  };

  const quickQs = lang === 'ar' ? QUICK_QUESTIONS_AR : QUICK_QUESTIONS_EN;
  const initMsg = messages[0]?.text;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/20 via-primary/10 to-background px-4 pt-12 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center border border-accent/30">
                <Bot className="w-6 h-6 text-accent" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
            </div>
            <div>
              <h1 className="text-base font-black">{lang === 'ar' ? '🤖 المساعد الصحي الذكي' : '🤖 AI Health Coach'}</h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${liveMode ? 'bg-red-400' : 'bg-green-400'}`} />
                <p className={`text-[10px] font-semibold ${liveMode ? 'text-red-400' : 'text-green-400'}`}>
                  {liveMode
                    ? (lang === 'ar' ? '🔴 وضع المحادثة المباشرة' : '🔴 Live Voice Mode')
                    : (lang === 'ar' ? 'نشط' : 'Active')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Live mode toggle */}
            <button
              onClick={toggleLiveMode}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black transition-all ${
                liveMode
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse'
                  : 'bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-400'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'مباشر' : 'Live'}
            </button>
            {/* Clear */}
            <button onClick={() => { synthRef.current?.cancel(); setMessages([{ role: 'assistant', text: initMsg }]); setSpeakingIdx(null); setLiveMode(false); }}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Live mode status bar */}
        <AnimatePresence>
          {liveMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 bg-red-500/15 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              {/* Waveform */}
              <div className="flex gap-0.5 items-end h-6">
                {[3,6,4,8,5,7,4,6,3,5].map((h, i) => (
                  <motion.div key={i}
                    className={`w-1 rounded-full ${listening ? 'bg-red-400' : speakingIdx !== null ? 'bg-accent' : 'bg-muted-foreground/40'}`}
                    animate={listening || speakingIdx !== null
                      ? { height: [`${h}px`, `${h * 2.5}px`, `${h}px`] }
                      : { height: '3px' }}
                    transition={{ delay: i * 0.07, repeat: Infinity, duration: 0.6 }}
                  />
                ))}
              </div>
              <p className="text-xs font-bold text-red-400 flex-1">
                {loading
                  ? (lang === 'ar' ? '💭 جارٍ التفكير...' : '💭 Thinking...')
                  : speakingIdx !== null
                  ? (lang === 'ar' ? '🔊 يتكلم...' : '🔊 Speaking...')
                  : listening
                  ? (lang === 'ar' ? '🎙️ يستمع إليك...' : '🎙️ Listening...')
                  : (lang === 'ar' ? '⏳ جاهز...' : '⏳ Ready...')}
              </p>
              <button onClick={toggleLiveMode} className="text-[10px] text-red-400 font-bold border border-red-400/40 rounded-full px-2 py-0.5">
                {lang === 'ar' ? 'إيقاف' : 'Stop'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">{lang === 'ar' ? '💡 اقتراحات سريعة:' : '💡 Quick questions:'}</p>
            <div className="grid grid-cols-2 gap-2">
              {quickQs.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="bg-muted rounded-2xl p-3 text-xs text-start text-foreground/80 hover:bg-primary/10 hover:text-primary transition-all border border-border hover:border-primary/30 font-medium">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              msg.role === 'assistant' ? 'bg-gradient-to-br from-accent/30 to-primary/20' : 'bg-primary/20'
            }`}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-accent" /> : <User className="w-4 h-4 text-primary" />}
            </div>
            <div className="max-w-[80%]">
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-card border border-border text-foreground rounded-tl-sm'
                  : 'bg-primary text-primary-foreground rounded-tr-sm'
              }`}>
                {msg.text}
              </div>
              {/* Speak toggle for assistant */}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => speakingIdx === i ? stopSpeaking() : speakText(msg.text, i)}
                  className={`mt-1 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full transition-all ${
                    speakingIdx === i ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  {speakingIdx === i ? (
                    <><StopCircle className="w-3 h-3" /> {lang === 'ar' ? 'إيقاف' : 'Stop'}
                      <span className="flex gap-0.5 items-end h-3">
                        {[2,4,3,5,3].map((h, j) => (
                          <motion.span key={j} className="w-0.5 bg-primary rounded-full inline-block"
                            animate={{ height: [`${h}px`, `${h*2}px`, `${h}px`] }}
                            transition={{ delay: j*0.1, repeat: Infinity, duration: 0.5 }} />
                        ))}
                      </span>
                    </>
                  ) : (
                    <><Volume2 className="w-3 h-3" /> {lang === 'ar' ? 'استمع' : 'Listen'}</>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex gap-1.5 items-end">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-2 h-2 bg-accent/60 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.6 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="px-4 pb-6 pt-3 border-t border-border bg-card/50 backdrop-blur-sm">
        {listening && !liveMode && (
          <div className="flex items-center justify-center gap-2 mb-2 text-red-400 text-xs font-semibold">
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}
              className="w-2 h-2 bg-red-400 rounded-full" />
            {lang === 'ar' ? 'جارٍ الاستماع...' : 'Listening...'}
          </div>
        )}
        <div className="flex gap-2">
          {/* Mic button */}
          <button
            onClick={toggleMic}
            disabled={liveMode}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 ${
              listening ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {listening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-muted-foreground" />}
          </button>

          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && send()}
            placeholder={liveMode
              ? (lang === 'ar' ? '🔴 وضع صوتي مباشر...' : '🔴 Live voice mode...')
              : (lang === 'ar' ? '💬 اكتب أو تكلم...' : '💬 Type or speak...')}
            disabled={liveMode}
            className="flex-1 bg-muted rounded-2xl px-4 py-3 text-sm outline-none border border-border focus:border-primary/50 transition-all disabled:opacity-50"
          />

          <button
            onClick={() => send()}
            disabled={!input.trim() || loading || liveMode}
            className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center disabled:opacity-40 transition-all hover:bg-primary/90 shadow-lg shadow-primary/30 flex-shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary-foreground" /> : <Send className="w-5 h-5 text-primary-foreground" />}
          </button>
        </div>
      </div>
    </div>
  );
}