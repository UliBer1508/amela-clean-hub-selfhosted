import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PWAStatusIndicator = () => {
  const [isPWA, setIsPWA] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check if app is running as PWA (standalone mode)
    const checkPWAMode = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsPWA(isStandalone || isInWebAppiOS);
    };

    // Check initial PWA status
    checkPWAMode();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkPWAMode();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleDisplayModeChange);
    }

    // Listen for online/offline events
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Don't render anything if not in PWA mode
  if (!isPWA) return null;

  return (
    <div className="fixed top-4 left-4 z-50 flex flex-row gap-2">
      <Badge 
        variant="secondary" 
        className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
      >
        <Smartphone className="w-3 h-3" />
        PWA Modus
      </Badge>
      
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className={`flex items-center gap-1 ${
          isOnline 
            ? "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400" 
            : "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400"
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            Offline
          </>
        )}
      </Badge>
    </div>
  );
};

export default PWAStatusIndicator;