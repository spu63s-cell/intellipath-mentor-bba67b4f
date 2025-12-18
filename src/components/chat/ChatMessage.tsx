import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/languageStore';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const { language } = useLanguageStore();
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message */}
      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-1 rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-none'
            : 'bg-muted text-foreground rounded-tl-none'
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isUser ? (
            <p className="m-0 whitespace-pre-wrap">{content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="my-2 list-disc pr-4 rtl:pl-4 rtl:pr-0">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 list-decimal pr-4 rtl:pl-4 rtl:pr-0">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children }) => (
                  <code className="rounded bg-background/50 px-1 py-0.5 text-sm">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="my-2 overflow-x-auto rounded-lg bg-background/50 p-3">{children}</pre>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
        
        {isStreaming && (
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
