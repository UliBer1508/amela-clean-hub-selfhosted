import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const PWAUpdateNotification = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Listen for SW updates
    const handleSWUpdate = () => {
      toast({
        title: "Update verfügbar",
        description: "Eine neue Version der App ist verfügbar.",
        action: (
          <Button 
            size="sm" 
            onClick={() => window.location.reload()}
            className="ml-2"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Aktualisieren
          </Button>
        ),
        duration: 10000,
      });
    };

    // Listen for offline ready
    const handleOfflineReady = () => {
      toast({
        title: "Offline bereit",
        description: "Die App kann jetzt auch ohne Internetverbindung genutzt werden.",
        duration: 5000,
      });
    };

    // Custom events from service worker
    window.addEventListener('swUpdated', handleSWUpdate);
    window.addEventListener('swOfflineReady', handleOfflineReady);

    return () => {
      window.removeEventListener('swUpdated', handleSWUpdate);
      window.removeEventListener('swOfflineReady', handleOfflineReady);
    };
  }, [toast]);

  return null; // This component doesn't render anything visible
};

export default PWAUpdateNotification;