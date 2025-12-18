import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
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
      <div className="flex h-[calc(100vh-4rem-4rem)] md:h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden overflow-hidden md:block"
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
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="hidden h-8 w-8 md:flex"
            >
              {showSidebar ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
            <h2 className="font-semibold text-foreground">
              {t('المستشار الأكاديمي الذكي', 'AI Academic Advisor')}
            </h2>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1">
            {messages.length === 0 ? (
              <SuggestedQuestions onSelect={handleSend} />
            ) : (
              <div className="mx-auto max-w-3xl py-4">
                {messages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={isLoading && i === messages.length - 1 && msg.role === 'assistant' && !msg.content}
                  />
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <ChatMessage role="assistant" content="" isStreaming />
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    </MainLayout>
  );
}
