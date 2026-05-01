import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Send, User as UserIcon, Bot, X, MessageSquare, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Chat = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !isOpen) return;
    
    // Unifying with Checkout logic
    const chatId = [user.uid, 'admin'].sort().join('_');
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => unsubscribe();
  }, [user, isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const chatId = [user.uid, 'admin'].sort().join('_');
    const text = input;
    setInput('');

    await addDoc(collection(db, `chats/${chatId}/messages`), {
      senderId: user.uid,
      content: text,
      createdAt: serverTimestamp(),
      type: 'user'
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-steam-blue text-steam-dark p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-[60] border-4 border-steam-dark"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 100, scale: 0.9, x: 50 }}
            className="fixed bottom-24 right-6 w-[360px] h-[550px] bg-steam-bg border border-steam-card rounded-3xl shadow-2xl z-[60] flex flex-col overflow-hidden"
          >
            <div className="bg-steam-card p-5 flex items-center justify-between border-b border-steam-blue/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-steam-blue rounded-full flex items-center justify-center border-2 border-steam-dark shadow-lg">
                  <Headphones className="w-6 h-6 text-steam-dark" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">{settings.siteName} Chat</h3>
                  <span className="text-[10px] text-green-400 font-black flex items-center gap-1 uppercase">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" /> Atendimento Online
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 flex items-center justify-center bg-steam-dark/50 rounded-full text-steam-accent hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-steam-dark/50 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-steam-card rounded-full mx-auto flex items-center justify-center opacity-20">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white uppercase italic">Bem-vindo ao nosso suporte!</p>
                    <p className="text-[10px] text-steam-accent/50 uppercase font-bold">Como podemos ajudar você hoje?</p>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs relative ${
                    msg.senderId === user?.uid 
                      ? 'bg-steam-blue text-steam-dark rounded-tr-none font-bold shadow-lg' 
                      : 'bg-steam-card text-white rounded-tl-none border border-steam-blue/10 shadow-lg'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <span className="block text-[8px] opacity-40 mt-1 uppercase font-bold text-right">
                      {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Vindo...'}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} className="p-5 bg-steam-bg border-t border-steam-card flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-steam-dark border border-steam-card rounded-2xl px-5 py-3 text-xs focus:outline-none focus:border-steam-blue text-white transition-all shadow-inner"
              />
              <button 
                type="submit" 
                className="bg-steam-blue text-steam-dark w-12 h-12 flex items-center justify-center rounded-2xl hover:scale-105 transition-transform shadow-lg border border-steam-blue/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chat;
