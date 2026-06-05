import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '@/hooks/usePWA';

const PWAStatusBar = () => {
  const { isOnline, updateAvailable } = usePWA();

  // Nur anzeigen wenn offline oder Update verfügbar
  const shouldShow = !isOnline || updateAvailable;

  if (!shouldShow) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {updateAvailable && (
            <Badge
              variant="default"
              className="flex items-center gap-1 text-xs animate-pulse"
            >
              <RefreshCw className="w-3 h-3" />
              Aktualisiere...
            </Badge>
          )}

          {!isOnline && (
            <Badge
              variant="destructive"
              className="flex items-center gap-1 text-xs bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400"
            >
              <WifiOff className="w-3 h-3" />
              Offline
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};


export default PWAStatusBar;
