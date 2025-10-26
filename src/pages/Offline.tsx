import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Offline = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Keine Internetverbindung
            </h1>
            <p className="text-muted-foreground">
              Es konnte keine Verbindung zum Internet hergestellt werden. 
              Bitte überprüfe deine Internetverbindung und versuche es erneut.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Erneut versuchen
            </Button>
            
            <p className="text-sm text-muted-foreground">
              💡 Tipp: Einige Funktionen der App können auch offline genutzt werden, 
              wenn du sie zuvor online besucht hast.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Offline;
