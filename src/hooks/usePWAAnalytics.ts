import { useEffect } from 'react';

export const usePWAAnalytics = () => {
  useEffect(() => {
    // Track PWA installation
    const handleAppInstalled = () => {
      console.log('✅ PWA wurde installiert');
      // Optional: Send analytics event to your tracking service
      // analytics.track('pwa_installed', { timestamp: Date.now() });
    };

    // Track when app is running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      console.log('📱 App läuft im Standalone-Modus');
      // Optional: Send analytics event
      // analytics.track('pwa_standalone_launch', { timestamp: Date.now() });
    }

    // Listen for installation event
    window.addEventListener('appinstalled', handleAppInstalled);

    // Track beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      console.log('💡 PWA Installation-Prompt verfügbar');
      // Optional: Send analytics event
      // analytics.track('pwa_install_prompt_shown', { timestamp: Date.now() });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  return {
    isInstallable: true, // Can be extended to track actual installability
  };
};
