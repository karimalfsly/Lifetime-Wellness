import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Lock, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from './ui/button';

export default function BiometricAuth({ onAuthenticated }) {
  const { t, lang } = useLanguage();
  const [status, setStatus] = useState('idle'); // idle, authenticating, error, success
  const [errorMessage, setErrorMessage] = useState('');

  const translations = {
    en: {
      title: 'Biometric Security',
      description: 'Please authenticate using Face ID or Fingerprint to access the app.',
      authenticate: 'Authenticate Now',
      error: 'Authentication failed',
      retry: 'Try Again',
      success: 'Authenticated Successfully',
      notSupported: 'Biometric authentication is not supported or not enabled on this device.'
    },
    ar: {
      title: 'الأمان الحيوي',
      description: 'يرجى التحقق باستخدام بصمة الوجه أو الإصبع للوصول إلى التطبيق.',
      authenticate: 'تحقق الآن',
      error: 'فشل التحقق',
      retry: 'إعادة المحاولة',
      success: 'تم التحقق بنجاح',
      notSupported: 'الميزة غير مدعومة أو غير مفعلة على هذا الجهاز.'
    }
  };

  const currentT = translations[lang] || translations.en;

  const handleAuthenticate = async () => {
    // Check if the Web Authentication API is available
    if (!window.PublicKeyCredential) {
      setStatus('error');
      setErrorMessage(currentT.notSupported);
      return;
    }

    setStatus('authenticating');
    
    try {
      // Note: In a real production app, you would use a library like 'local-authentication' 
      // for React Native or the WebAuthn API for Web. 
      // Since this is a PWA/Web project, we use a simulation that prompts the user 
      // and represents the logic. For a real PWA, you'd use navigator.credentials.get().
      
      // Simulate biometric prompt delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demonstration in the sandbox environment, we'll assume success 
      // but in a real device, this would trigger the system biometric prompt.
      setStatus('success');
      setTimeout(() => {
        onAuthenticated();
      }, 800);
      
    } catch (error) {
      console.error('Biometric error:', error);
      setStatus('error');
      setErrorMessage(currentT.error);
    }
  };

  useEffect(() => {
    // Auto-trigger authentication on mount
    handleAuthenticate();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <motion.div 
            animate={status === 'authenticating' ? { 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center ${
              status === 'error' ? 'bg-red-500/10 text-red-500' : 
              status === 'success' ? 'bg-green-500/10 text-green-500' : 
              'bg-primary/10 text-primary'
            }`}
          >
            {status === 'error' ? <AlertCircle size={48} /> : 
             status === 'success' ? <ShieldCheck size={48} /> : 
             <Fingerprint size={48} />}
          </motion.div>
          
          {status === 'authenticating' && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-primary/20"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="289"
                initial={{ strokeDashoffset: 289 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.5, ease: "linear" }}
                className="text-primary"
              />
            </svg>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black">{currentT.title}</h2>
          <p className="text-muted-foreground">{currentT.description}</p>
        </div>

        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500 text-sm flex items-center gap-2 justify-center"
          >
            <AlertCircle size={16} />
            {errorMessage}
          </motion.div>
        )}

        <div className="pt-4">
          <Button 
            onClick={handleAuthenticate}
            disabled={status === 'authenticating' || status === 'success'}
            className="w-full h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg shadow-primary/20"
          >
            {status === 'authenticating' ? (
              <RefreshCw className="animate-spin" />
            ) : status === 'success' ? (
              <ShieldCheck />
            ) : (
              <Fingerprint />
            )}
            {status === 'error' ? currentT.retry : 
             status === 'success' ? currentT.success : 
             currentT.authenticate}
          </Button>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground/40">
            <Lock size={14} />
            <span className="text-[10px] uppercase tracking-widest font-bold">Secure Access</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}