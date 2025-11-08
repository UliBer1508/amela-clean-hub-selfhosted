import React from 'react';
import { Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '@/hooks/usePWA';

const PWAStatusBar = () => {
  const { isOnline, isInstalled, updateAvailable } = usePWA();

  // Responsive visibility:
  // - Mobile (< md): Show always when installed OR offline
  // - Desktop (>= md): Show only when installed OR offline
  const shouldShow = isInstalled || !isOnline;

  if (!shouldShow) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {isInstalled && (
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 text-xs"
            >
              <Smartphone className="w-3 h-3" />
              PWA Modus
            </Badge>
          )}

          {updateAvailable && (
            <Badge 
              variant="default"
              className="flex items-center gap-1 text-xs animate-pulse"
            >
              <RefreshCw className="w-3 h-3" />
              Aktualisiere...
            </Badge>
          )}

          <Badge 
            variant={isOnline ? "default" : "destructive"}
            className={`flex items-center gap-1 text-xs ${
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
      </div>
    </div>
  );
};

export default PWAStatusBar;
