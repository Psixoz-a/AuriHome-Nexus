
import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, cn } from '../components/ui';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2, Minimize2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { aiService } from '../services/aiService';
import { useLanguage } from '../contexts/LanguageContext';

export const SmartAssistant = () => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'model', text: 'Hello! I am your Home AI. How can I help you today?', timestamp: new Date() }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const reply = await aiService.processCommand(userMsg.text);
            const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: reply, timestamp: new Date() };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Connection to AI failed.', timestamp: new Date(), isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)] z-50 flex items-center justify-center transition-transform hover:scale-105"
            >
                <Sparkles className="w-6 h-6 text-white" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-[350px] md:w-[400px] h-[500px] flex flex-col z-50 shadow-2xl border-indigo-500/20 bg-slate-950/90 backdrop-blur-md animate-in slide-in-from-bottom-10">
            <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between bg-indigo-600/10">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-slate-100">Smart Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded"><Minimize2 className="w-4 h-4 text-slate-400" /></button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                                msg.role === 'user' ? "bg-slate-700 border-slate-600" : "bg-indigo-600 border-indigo-500"
                            )}>
                                {msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Sparkles className="w-4 h-4 text-white" />}
                            </div>
                            <div className={cn(
                                "p-3 rounded-2xl max-w-[80%] text-sm",
                                msg.role === 'user' ? "bg-slate-800 text-slate-200 rounded-tr-none" : "bg-indigo-900/40 text-indigo-100 rounded-tl-none border border-indigo-500/20"
                            )}>
                                {msg.text}
                                <div className="text-[10px] opacity-50 mt-1 text-right">
                                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                                 <Loader2 className="w-4 h-4 text-white animate-spin" />
                             </div>
                             <div className="bg-indigo-900/40 p-3 rounded-2xl rounded-tl-none border border-indigo-500/20 text-sm text-indigo-300">
                                 Thinking...
                             </div>
                         </div>
                    )}
                </div>
                
                <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-slate-900/50 flex gap-2">
                    <Input 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        placeholder="Type a command..." 
                        className="flex-1 bg-slate-950 border-slate-700 focus:ring-indigo-500"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500">
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
