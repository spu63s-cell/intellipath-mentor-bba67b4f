import { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguageStore } from '@/stores/languageStore';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const { t } = useLanguageStore();

  const handleSend = () => {
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background/95 p-4 backdrop-blur-lg">
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <div className="relative flex-1">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('اكتب سؤالك هنا...', 'Type your question here...')}
            className="min-h-[52px] max-h-[200px] resize-none rounded-2xl border-border bg-muted/50 pr-4 pl-4 py-3 focus:bg-background transition-colors"
            disabled={isLoading || disabled}
            rows={1}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || disabled}
          className="h-[52px] w-[52px] shrink-0 rounded-2xl"
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5 rtl:scale-x-[-1]" />
          )}
        </Button>
      </div>
    </div>
  );
}
