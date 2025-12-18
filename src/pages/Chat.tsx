import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeft, Sparkles, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { SuggestedQuestions } from '@/components/chat/SuggestedQuestions';
import { useStreamChat } from '@/hooks/useStreamChat';
import { useLanguageStore } from '@/stores/languageStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

// Animated background particles
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-secondary/30"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      
      {/* Glowing orbs */}
      <motion.div
        className="absolute top-20 right-20 w-64 h-64 rounded-full bg-secondary/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-primary/10 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// AI Status indicator
function AIStatusIndicator({ isThinking }: { isThinking: boolean }) {
  return (
    <motion.div
      className="flex items-center gap-2 text-xs text-muted-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className={`w-2 h-2 rounded-full ${isThinking ? 'bg-secondary' : 'bg-success'}`}
        animate={isThinking ? {
          scale: [1, 1.3, 1],
          opacity: [1, 0.5, 1],
        } : {}}
        transition={{
          duration: 1,
          repeat: Infinity,
        }}
      />
      <span>{isThinking ? 'يفكر...' : 'متصل'}</span>
    </motion.div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  const { messages, isLoading, sendMessage, clearMessages, setInitialMessages } = useStreamChat();

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
        setInitialMessages(data.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })));
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

    // Update conversation title if it's the first user message
    if (role === 'user') {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await supabase
        .from('chat_conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      // Refresh conversations
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

    // Create new conversation if none exists
    if (!convId) {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user.id })
        .select()
        .single();
      
      if (error) {
        toast({
          variant: 'destructive',
          title: t('خطأ', 'Error'),
          description: t('فشل إنشاء المحادثة', 'Failed to create conversation'),
        });
        return;
      }
      
      convId = data.id;
      setCurrentConversationId(convId);
      setConversations((prev) => [data, ...prev]);
    }

    // Save user message
    await saveMessage(convId, 'user', input);
    
    // Send to AI
    await sendMessage(input);

    // Save assistant response after streaming completes
    setTimeout(async () => {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant') {
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
        title: t('خطأ', 'Error'),
        description: t('فشل حذف المحادثة', 'Failed to delete conversation'),
      });
      return;
    }
    
    setConversations((prev) => prev.filter((c) => c.id !== id));
    
    if (currentConversationId === id) {
      handleNewConversation();
    }
  };

  return (
    <MainLayout>
      <div className="relative flex h-[calc(100vh-4rem-4rem)] md:h-[calc(100vh-4rem)]">
        {/* Animated Background */}
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
            className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-3 glass"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="hidden h-8 w-8 md:flex hover:bg-secondary/10"
              >
                {showSidebar ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                <motion.div
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground shadow-glow"
                  animate={{
                    boxShadow: [
                      '0 0 20px hsl(172 66% 40% / 0.3)',
                      '0 0 30px hsl(172 66% 40% / 0.5)',
                      '0 0 20px hsl(172 66% 40% / 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Brain className="h-5 w-5" />
                </motion.div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    {t('المستشار الأكاديمي الذكي', 'AI Academic Advisor')}
                  </h2>
                  <AIStatusIndicator isThinking={isLoading} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.div
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-medium"
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="h-3 w-3" />
                <span>Gemini AI</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1">
            <div className="relative min-h-full">
              {messages.length === 0 ? (
                <SuggestedQuestions onSelect={handleSend} />
              ) : (
                <div className="mx-auto max-w-3xl py-4 px-2">
                  <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChatMessage
                          role={msg.role}
                          content={msg.content}
                          isStreaming={isLoading && i === messages.length - 1 && msg.role === 'assistant' && !msg.content}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <ChatMessage role="assistant" content="" isStreaming />
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    </MainLayout>
  );
}
