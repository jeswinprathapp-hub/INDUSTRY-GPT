import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Send, FileText, Bot, User, Sparkles, MessageSquare, Plus, Loader2, Mic, Paperclip, X, AlertCircle, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';

interface Source {
  document_id: string;
  filename: string;
  page: number;
  relevance: number;
  chunk_content: string;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  safety_alert?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function Chat() {
  const { session } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    return localStorage.getItem('industrygpt_active_conv') || null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [documentFilter, setDocumentFilter] = useState<string | null>(null);
  const [language, setLanguage] = useState('English');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialQuestion = location.state?.initialQuestion;

  // Helper to ensure we have a valid auth token
  const getAuthToken = async () => {
    if (session?.access_token) return session.access_token;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  // 1. Fetch conversations list
  const fetchConversations = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch('/api/chat/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data || []);
        return data || [];
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
    return [];
  };

  // 2. Load messages for a given conversation
  const loadConversationMessages = async (convId: string) => {
    try {
      setLoadingHistory(true);
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Select conversation handler
  const handleSelectConversation = (convId: string) => {
    setCurrentConversationId(convId);
    localStorage.setItem('industrygpt_active_conv', convId);
    loadConversationMessages(convId);
  };

  // Start new chat handler
  const handleNewChat = () => {
    setCurrentConversationId(null);
    localStorage.removeItem('industrygpt_active_conv');
    setMessages([]);
    setInput('');
  };

  // Delete conversation handler
  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = await getAuthToken();
      if (!token) return;

      await fetch(`/api/chat/conversations/${convId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setConversations(prev => prev.filter(c => c.id !== convId));
      if (currentConversationId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Document filter param from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docId = params.get('document');
    if (docId) {
      setDocumentFilter(docId);
    }
  }, [location]);

  // Initial load effect
  useEffect(() => {
    async function init() {
      const convList = await fetchConversations();
      
      if (initialQuestion) {
        // Start a fresh chat for the initial question from dashboard
        setCurrentConversationId(null);
        localStorage.removeItem('industrygpt_active_conv');
        setMessages([]);
        handleSend(initialQuestion, null);
        window.history.replaceState({}, document.title);
        return;
      }

      const savedConvId = localStorage.getItem('industrygpt_active_conv');
      if (savedConvId && convList.some((c: any) => c.id === savedConvId)) {
        handleSelectConversation(savedConvId);
      } else if (convList && convList.length > 0) {
        // Automatically open the most recent conversation if none explicitly selected
        handleSelectConversation(convList[0].id);
      } else {
        handleNewChat();
      }
    }

    init();
  }, [session]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (overrideInput?: string, overrideConvId?: string | null) => {
    const questionToAsk = overrideInput || input;
    if (!questionToAsk.trim()) return;
    
    const token = await getAuthToken();
    if (!token) return;

    const convIdToSend = overrideConvId !== undefined ? overrideConvId : currentConversationId;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: questionToAsk.trim() }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          question: questionToAsk.trim(), 
          conversation_id: convIdToSend,
          document_id: documentFilter,
          language: language,
          image_base64: imageBase64
        })
      });
      setImageBase64(null); // Clear image after send
      
      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        sources: data.sources,
        safety_alert: data.safety_alert
      }]);

      if (data.conversation_id) {
        setCurrentConversationId(data.conversation_id);
        localStorage.setItem('industrygpt_active_conv', data.conversation_id);
        fetchConversations();
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error while processing your request. Please ensure the backend is connected."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const prefilledPrompts = [
    "What are the emergency shutdown procedures?",
    "Summarize the maintenance schedule for the compressor.",
    "What is the maximum operating temperature?",
    "What PPE is required for this area?"
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'English' ? 'en-US' : 
                       language === 'Spanish' ? 'es-ES' : 
                       language === 'French' ? 'fr-FR' : 
                       language === 'German' ? 'de-DE' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      
      {/* Real Persistent Conversation Sidebar */}
      <div className="w-64 border-r border-border bg-surface/30 hidden md:flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-medium text-white text-sm">Conversations</h3>
          <button 
            onClick={handleNewChat}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-xs font-medium transition-colors"
            title="Start New Chat"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-text-muted text-xs">
              No previous chats found. Ask a question to start one!
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = currentConversationId === conv.id;
              return (
                <div 
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between group transition-colors ${
                    isActive 
                      ? 'bg-surface border-primary/50 text-white shadow-sm' 
                      : 'border-transparent hover:bg-surface/60 text-text-secondary hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                    <MessageSquare size={15} className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`} />
                    <span className="text-sm truncate">
                      {conv.title || 'Conversation'}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-error text-text-muted transition-opacity"
                    title="Delete Conversation"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Header */}
        <div className="h-14 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
           <div className="flex items-center space-x-3">
             <div className="font-display font-semibold text-white tracking-tight">IndustryGPT</div>
             {documentFilter && (
               <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                 Document Filter Active
               </span>
             )}
           </div>
           <div className="flex items-center text-xs font-medium text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-full">
             <div className="w-1.5 h-1.5 rounded-full bg-success mr-2 animate-pulse" />
             Knowledge Base Connected
           </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-text-secondary text-sm">Loading conversation history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto animate-fade-in">
              <div className="w-16 h-16 bg-surface-secondary border border-border rounded-2xl flex items-center justify-center shadow-lg mb-8">
                <Sparkles className="text-primary w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 font-display text-center">
                Ask your industrial knowledge assistant
              </h2>
              <p className="text-text-secondary text-center mb-12">
                Search manuals, SOPs, maintenance records and technical documents using natural language.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {prefilledPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="p-4 text-left bg-surface hover:bg-surface-hover border border-border hover:border-primary/50 rounded-xl transition-all duration-200 text-sm text-text-primary group"
                  >
                    <span className="group-hover:text-primary transition-colors block mb-1 font-medium">Example Prompt</span>
                    <span className="text-text-secondary">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-surface border border-border ml-4' : 'bg-primary/20 text-primary border border-primary/30 mr-4'
                    }`}>
                      {msg.role === 'user' ? <User size={20} className="text-text-secondary" /> : <Bot size={20} />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`rounded-2xl p-5 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : 'bg-surface border border-border text-text-primary rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <>
                          {msg.safety_alert && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start space-x-3 text-red-400">
                              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              <div className="text-sm">
                                <strong>Safety Notice:</strong> The retrieved documents contain safety-critical warnings (e.g. hazards, toxic materials). Please review the sources carefully before proceeding.
                              </div>
                            </div>
                          )}
                          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-background prose-pre:border prose-pre:border-border">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </>
                      ) : (
                        <div className="text-[15px]">{msg.content}</div>
                      )}
                      
                      {/* Citations block */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-border">
                          <div className="bg-background/50 border border-border rounded-xl overflow-hidden">
                            <div className="bg-surface-secondary/50 px-4 py-2 border-b border-border flex items-center">
                              <FileText size={14} className="mr-2 text-primary" />
                              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Sources</span>
                            </div>
                            <div className="p-2 space-y-1">
                              {msg.sources.map((source, idx) => (
                                <div 
                                  key={idx} 
                                  onClick={() => setSelectedSource(source)}
                                  className="flex items-start p-2 hover:bg-surface rounded-lg cursor-pointer transition-colors group"
                                >
                                  <FileText size={14} className="mt-0.5 mr-3 text-text-muted group-hover:text-primary transition-colors" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-text-secondary group-hover:text-white truncate">
                                      {source.filename}
                                    </div>
                                    <div className="text-xs text-text-muted mt-0.5 font-mono">
                                      Page {source.page || '?'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex max-w-[85%] flex-row">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-primary/20 text-primary border border-primary/30 mr-4">
                      <Bot size={20} />
                    </div>
                    <div className="bg-surface border border-border rounded-2xl rounded-tl-sm p-5 flex items-center space-x-2">
                       <Loader2 className="w-5 h-5 animate-spin text-primary" />
                       <span className="text-text-secondary text-sm">Searching knowledge base...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-background/80 backdrop-blur-md border-t border-border z-10">
          
          {/* Controls Bar */}
          <div className="max-w-4xl mx-auto flex justify-between items-center mb-2 px-1">
            <div className="flex space-x-2">
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-surface border border-border text-xs text-text-secondary rounded-lg px-2 py-1 focus:outline-none focus:border-primary"
              >
                <option value="English">🇬🇧 English</option>
                <option value="Spanish">🇪🇸 Spanish</option>
                <option value="French">🇫🇷 French</option>
                <option value="German">🇩🇪 German</option>
              </select>
            </div>
            
            {imageBase64 && (
              <div className="flex items-center bg-surface border border-border rounded-lg px-2 py-1 space-x-2 text-xs">
                <span className="text-primary truncate max-w-[100px]">Image attached</span>
                <button onClick={() => setImageBase64(null)} className="text-text-muted hover:text-error"><X size={14}/></button>
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto relative flex items-end bg-surface border border-border rounded-2xl shadow-xl focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-text-muted hover:text-primary transition-colors ml-1 mb-1"
              title="Attach Image"
            >
              <Paperclip size={20} />
            </button>
            
            <button 
              onClick={toggleListen}
              className={`p-3 transition-colors mb-1 ${isListening ? 'text-red-500 animate-pulse' : 'text-text-muted hover:text-primary'}`}
              title="Voice Input"
            >
              <Mic size={20} />
            </button>

            <textarea
              className="w-full bg-transparent text-white placeholder-text-muted px-3 py-4 max-h-32 min-h-[56px] focus:outline-none resize-none"
              placeholder={isListening ? "Listening..." : "Ask a question about your documents or upload an image..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
              rows={1}
            />
            <div className="p-2 mb-0.5">
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && !imageBase64) || loading}
                className="p-3 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-md"
              >
                <Send size={20} className={(input.trim() || imageBase64) ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-text-muted mt-3">
            IndustryGPT can make mistakes. Always verify critical safety and operational information against the source documents.
          </p>
        </div>

        {/* Source Preview Overlay */}
        {selectedSource && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
              <div className="flex justify-between items-center p-4 border-b border-border bg-surface-secondary/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{selectedSource.filename}</h3>
                    <p className="text-xs text-text-muted font-mono">Page {selectedSource.page}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSource(null)} className="p-2 text-text-muted hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <p className="text-sm text-text-secondary uppercase tracking-wider font-semibold mb-3">Extracted Content</p>
                <div className="bg-background border border-border rounded-xl p-5 relative">
                  <div className="absolute left-0 top-5 bottom-5 w-1 bg-primary rounded-r-md"></div>
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap pl-3">
                    {selectedSource.chunk_content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
