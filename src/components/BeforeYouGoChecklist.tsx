import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BeforeYouGoChecklistProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const checklistItems = {
  allgemein: {
    icon: '🔑',
    title: 'ALLGEMEIN',
    items: [
      'Alle Fenster geschlossen?',
      'Heizung/Klimaanlage auf Standardwert?',
      'Alle Lichter aus?',
      'Haustür abgeschlossen?',
    ],
  },
  bad: {
    icon: '🛁',
    title: 'BAD',
    items: [
      'Toilette sauber und trocken?',
      'Spiegel streifenfrei?',
      'Frische Handtücher aufgehängt?',
      'Seife/Shampoo aufgefüllt?',
    ],
  },
  schlafzimmer: {
    icon: '🛏️',
    title: 'SCHLAFZIMMER',
    items: [
      'Betten frisch bezogen?',
      'Kissen aufgeschüttelt?',
      'Nachttische leer und sauber?',
    ],
  },
  kueche: {
    icon: '🍳',
    title: 'KÜCHE',
    items: [
      'Kühlschrank leer und sauber?',
      'Herd und Backofen gereinigt?',
      'Geschirr komplett und sauber?',
      'Mülleimer geleert?',
    ],
  },
  wohnbereich: {
    icon: '🛋️',
    title: 'WOHNBEREICH',
    items: [
      'Kissen und Decken ordentlich?',
      'Fernbedienungen an ihrem Platz?',
      'Boden staubfrei?',
    ],
  },
};

const BeforeYouGoChecklist: React.FC<BeforeYouGoChecklistProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] p-0">
        <DialogHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 p-4 md:p-6 border-b border-emerald-200 dark:border-emerald-800">
          <DialogTitle className="text-xl md:text-2xl font-bold text-center text-emerald-800 dark:text-emerald-200">
            ✨ BEVOR DU GEHST! ✨
          </DialogTitle>
          <p className="text-sm text-center text-emerald-700 dark:text-emerald-300 mt-2">
            Eine kurze Kontrolle für perfekte Sauberkeit - du schaffst das! 💪
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-4 md:p-6">
          <div className="space-y-4 md:space-y-6">
            {Object.entries(checklistItems).map(([key, category]) => (
              <div key={key} className="space-y-2">
                <h3 className="font-semibold text-sm md:text-base text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  {category.title}
                </h3>
                <div className="border-l-2 border-emerald-200 dark:border-emerald-800 pl-3 md:pl-4 space-y-1.5">
                  {category.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs md:text-sm text-foreground"
                    >
                      <span className="text-muted-foreground">☐</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 p-4 md:p-6 border-t border-emerald-200 dark:border-emerald-800">
          <p className="text-sm text-center text-emerald-700 dark:text-emerald-300 mb-4">
            🎉 Super gemacht! Der nächste Gast wird sich freuen!
          </p>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BeforeYouGoChecklist;
