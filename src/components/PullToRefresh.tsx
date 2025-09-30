import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ 
  onRefresh, 
  children, 
  disabled = false 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const { toast } = useToast();

  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  useEffect(() => {
    // Show refresh button on PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    setShowRefreshButton(isPWA);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    const touch = e.touches[0];
    setTouchStart(touch.clientY);
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isPulling) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const diff = currentY - touchStart;
    
    // Only allow pull down when at top of page
    const isAtTop = window.scrollY === 0;
    
    if (diff > 0 && isAtTop) {
      e.preventDefault();
      const distance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= PULL_THRESHOLD) {
      await handleRefresh();
    }
    
    setPullDistance(0);
  };

  const handleRefresh = async () => {
    if (disabled || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: "Aktualisiert",
        description: "Daten wurden erfolgreich aktualisiert.",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beim Aktualisieren ist ein Fehler aufgetreten.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  };

  const refreshProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const shouldTrigger = pullDistance >= PULL_THRESHOLD;

  return (
    <div className="relative">
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-primary/90 text-primary-foreground transition-transform duration-200"
          style={{ 
            transform: `translateY(${Math.max(pullDistance - 60, -60)}px)`,
            height: '60px'
          }}
        >
          <div className="flex items-center space-x-2">
            <RefreshCw 
              className={`w-5 h-5 transition-transform duration-200 ${
                shouldTrigger ? 'animate-spin' : ''
              }`}
              style={{
                transform: `rotate(${refreshProgress * 180}deg)`
              }}
            />
            <span className="text-sm font-medium">
              {shouldTrigger ? 'Loslassen zum Aktualisieren' : 'Zum Aktualisieren herunterziehen'}
            </span>
          </div>
        </div>
      )}

      {/* Refresh button for PWA */}
      {showRefreshButton && (
        <div className="fixed top-20 right-4 z-40">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Lädt...' : 'Aktualisieren'}
          </Button>
        </div>
      )}

      {/* Content wrapper */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;