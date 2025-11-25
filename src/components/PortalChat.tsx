import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePortalMessages } from '@/hooks/usePortalMessages';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import chatIcon from '@/assets/chat-icon.png';

interface ChatButtonProps {
  onClick: () => void;
  unreadCount: number;
}

export const ChatButton = ({ onClick, unreadCount }: ChatButtonProps) => (
  <button
    onClick={onClick}
    className="relative w-12 h-12 md:w-14 md:h-14 flex-shrink-0 transition-transform hover:scale-105"
  >
    <img src={chatIcon} alt="Chat" className="w-full h-full object-contain" />
    {unreadCount > 0 && (
      <Badge 
        variant="destructive" 
        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
      >
        {unreadCount}
      </Badge>
    )}
  </button>
);

interface PortalChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const PortalChat = ({ isOpen, onClose }: PortalChatProps) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, unreadCount, sendMessage, markAsRead } = usePortalMessages();

  // Auto-scroll bei neuen Nachrichten
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Nachrichten als gelesen markieren wenn Chat geöffnet wird
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAsRead();
    }
  }, [isOpen, unreadCount, markAsRead]);

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    
    sendMessage(trimmedInput);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFocus = () => {
    // Scroll to bottom when keyboard appears
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 md:top-20 md:right-6 md:inset-auto md:w-96 h-[100dvh] md:h-[500px] bg-background border-0 md:border md:rounded-lg shadow-xl z-[100] flex flex-col">
          {/* Header */}
        <div className="flex items-center justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top))] md:pt-4 border-b bg-primary text-primary-foreground md:rounded-t-lg">
          <div className="flex items-center gap-2">
            <img src={chatIcon} alt="Chat" className="h-5 w-5" />
            <span className="font-semibold">Nachrichten</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-primary-foreground hover:bg-primary/80"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {isLoading ? (
              <div className="text-center text-muted-foreground">Laden...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm">
                Noch keine Nachrichten. Schreibe eine Nachricht an den Admin!
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'provider' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.sender_type === 'provider'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender_type === 'provider' 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {format(new Date(msg.created_at), 'dd.MM. HH:mm', { locale: de })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                placeholder="Nachricht eingeben..."
                className="min-h-[44px] max-h-[100px] resize-none"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim()}
                size="icon"
                className="shrink-0 h-[44px] w-[44px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter zum Senden, Shift+Enter für neue Zeile
            </p>
          </div>
        </div>
  );
};

export default PortalChat;
