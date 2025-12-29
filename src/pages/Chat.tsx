import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeft, Sparkles, Brain, Zap, BookOpen, Calculator, Route, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { SuggestedQuestions } from '@/components/chat/SuggestedQuestions';
import { useAgenticChat } from '@/hooks/api/useAgenticChat';
import { useLanguageStore } from '@/stores/languageStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

// Animated background with floating orbs
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <motion.div
        className="floating-orb absolute top-20 right-20 w-72 h-72 rounded-full bg-gradient-to-br from-secondary/20 to-primary/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="floating-orb absolute bottom-20 left-20 w-56 h-56 rounded-full bg-gradient-to-tr from-primary/15 to-secondary/20 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// AI Status and Thought indicator
function AIStatusIndicator({ isThinking, thought }: { isThinking: boolean; thought?: string }) {
  const { t } = useTranslation();
  
  return (
    <motion.div className="flex items-center gap-2 text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div
        className={`relative w-2.5 h-2.5 rounded-full ${isThinking ? 'bg-secondary' : 'bg-emerald-500'}`}
        animate={isThinking ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {!isThinking && (
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500"
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>
      <span className={isThinking ? 'text-secondary' : 'text-emerald-500'}>
        {thought || (isThinking ? t('chat.thinking') : t('chat.connected'))}
      </span>
    </motion.div>
  );
}

// Tool Results Display
function ToolResultsPanel({ tools }: { tools: { name: string; result: any }[] }) {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'search_courses': return <BookOpen className="h-3.5 w-3.5" />;
      case 'calculate_gpa': return <Calculator className="h-3.5 w-3.5" />;
      case 'get_prerequisites': return <Route className="h-3.5 w-3.5" />;
      default: return <Zap className="h-3.5 w-3.5" />;
    }
  };

  const getToolLabel = (name: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      search_courses: { ar: 'البحث في المقررات', en: 'Course Search' },
      calculate_gpa: { ar: 'حساب المعدل', en: 'GPA Calculation' },
      get_prerequisites: { ar: 'المتطلبات السابقة', en: 'Prerequisites' },
      analyze_plan: { ar: 'تحليل الخطة', en: 'Plan Analysis' },
    };
    return labels[name]?.[isRTL ? 'ar' : 'en'] || name;
  };

  if (!tools.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 px-4 py-2"
    >
      {tools.map((tool, i) => (
        <Badge key={i} variant="secondary" className="gap-1.5 text-xs">
          {getToolIcon(tool.name)}
          {getToolLabel(tool.name)}
        </Badge>
      ))}
    </motion.div>
  );
}

// Sources Display
function SourcesPanel({ sources }: { sources?: { code: string; name: string; department: string; score: number }[] }) {
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  
  if (!sources?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-2 border-t border-border/30"
    >
      <p className="text-xs text-muted-foreground mb-2">
        {isRTL ? 'المصادر المستخدمة:' : 'Sources used:'}
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.slice(0, 5).map((source, i) => (
          <Badge key={i} variant="outline" className="text-xs gap-1">
            <BookOpen className="h-3 w-3" />
            {source.code} - {source.name}
          </Badge>
        ))}
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRTL = language === 'ar';
  
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'agentic' | 'rag' | 'simple'>('agentic');
  
  const { 
    messages, 
    isLoading, 
    isStreaming,
    currentThought,
    toolResults,
    sendMessage, 
    stopGeneration,
    clearMessages, 
    setInitialMessages 
  } = useAgenticChat();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    
    const loadConversations = async () => {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }
      
      setConversations(data || []);
    };
    
    loadConversations();
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentConversationId) {
      clearMessages();
      return;
    }

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      
      if (data) {
        setInitialMessages(data.map((m) => ({ 
          id: m.id,
          role: m.role as 'user' | 'assistant', 
          content: m.content,
          timestamp: new Date(m.created_at),
        })));
      }
    };
    
    loadMessages();
  }, [currentConversationId, clearMessages, setInitialMessages]);

  // Save message to database
  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      role,
      content,
    });

    if (role === 'user') {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await supabase
        .from('chat_conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, title, updated_at: new Date().toISOString() } : c
        ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      );
    }
  };

  const handleSend = async (input: string) => {
    if (!user) return;

    let convId = currentConversationId;

    if (!convId) {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user.id })
        .select()
        .single();
      
      if (error) {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('chat.createError'),
        });
        return;
      }
      
      convId = data.id;
      setCurrentConversationId(convId);
      setConversations((prev) => [data, ...prev]);
    }

    await saveMessage(convId, 'user', input);
    
    // Send to Agentic AI with mode
    await sendMessage(input, { 
      mode: chatMode,
      conversationId: convId,
    });

    // Save assistant response after streaming completes
    setTimeout(async () => {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant' && lastMessage.content) {
        await saveMessage(convId!, 'assistant', lastMessage.content);
      }
    }, 500);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    clearMessages();
  };

  const handleDeleteConversation = async (id: string) => {
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('chat.deleteError'),
      });
      return;
    }
    
    setConversations((prev) => prev.filter((c) => c.id !== id));
    
    if (currentConversationId === id) {
      handleNewConversation();
    }
  };

  // Get last message sources
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');

  return (
    <MainLayout>
      <div className="relative flex h-[calc(100vh-4rem-4rem)] md:h-[calc(100vh-4rem)]">
        <ParticleBackground />
        
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="hidden overflow-hidden md:block z-10"
            >
              <ChatSidebar
                conversations={conversations}
                currentConversationId={currentConversationId}
                onSelectConversation={setCurrentConversationId}
                onNewConversation={handleNewConversation}
                onDeleteConversation={handleDeleteConversation}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-2 border-b border-border/30 px-4 py-3 glass-morphism"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="hidden h-9 w-9 md:flex hover:bg-secondary/10 rounded-xl"
              >
                {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>
              
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white shadow-glow"
                  animate={{
                    boxShadow: [
                      '0 0 20px hsl(var(--secondary) / 0.3)',
                      '0 0 35px hsl(var(--secondary) / 0.5)',
                      '0 0 20px hsl(var(--secondary) / 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Brain className="h-5 w-5" />
                </motion.div>
                <div>
                  <h2 className="font-semibold text-foreground">{t('chat.title')}</h2>
                  <AIStatusIndicator isThinking={isLoading} thought={currentThought} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Mode Selector */}
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-muted/50">
                {(['agentic', 'rag', 'simple'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={chatMode === mode ? 'secondary' : 'ghost'}
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => setChatMode(mode)}
                  >
                    {mode === 'agentic' ? (isRTL ? 'ذكي' : 'Smart') : 
                     mode === 'rag' ? (isRTL ? 'بحث' : 'Search') : 
                     (isRTL ? 'بسيط' : 'Simple')}
                  </Button>
                ))}
              </div>

              {isStreaming && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopGeneration}
                  className="text-destructive hover:text-destructive gap-1"
                >
                  <StopCircle className="h-4 w-4" />
                  {isRTL ? 'إيقاف' : 'Stop'}
                </Button>
              )}

              <motion.div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-medium"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-3.5 w-3.5 text-secondary" />
                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent font-semibold">
                  {chatMode === 'agentic' ? 'Agentic AI' : chatMode === 'rag' ? 'RAG' : 'Gemini AI'}
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Tool Results */}
          <ToolResultsPanel tools={toolResults} />

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1">
            <div className="relative min-h-full">
              {messages.length === 0 ? (
                <SuggestedQuestions onSelect={handleSend} />
              ) : (
                <div className="mx-auto max-w-3xl py-6 px-4">
                  <AnimatePresence mode="popLayout">
                    {messages.filter(m => m.role !== 'system').map((msg, i) => (
                      <motion.div
                        key={msg.id || i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChatMessage
                          role={msg.role as 'user' | 'assistant'}
                          content={msg.content}
                          isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant' && !msg.content}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <ChatMessage role="assistant" content="" isStreaming />
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Sources */}
          <SourcesPanel sources={lastAssistantMessage?.sources} />

          {/* Input */}
          <div className="glass-morphism border-t border-border/30">
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
