
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wifi, Settings, Zap, Mic, Loader2, LogOut, Home, Globe } from 'lucide-react';
import { cn } from '../components/ui';
import { useLanguage } from '../contexts/LanguageContext';
import { voiceService } from '../services/voiceService';
import { useToast } from '../contexts/ToastContext';

interface LocalLayoutProps {
  children: React.ReactNode;
}

const LocalLayout: React.FC<LocalLayoutProps> = ({ children }) => {
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Settings Menu State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const startListening = async () => {
    try {
      await voiceService.startRecording();
      setIsListening(true);
      setAiResponse("Listening...");
    } catch (e) {
      toast("Microphone access denied", "error");
    }
  };

  const stopListening = async () => {
    setIsListening(false);
    setIsProcessing(true);
    setAiResponse("Thinking...");
    
    try {
      await voiceService.stopRecording();
      // Simulation for demo
      setTimeout(() => {
        setIsProcessing(false);
        setAiResponse("Okay, turning on the lights.");
        toast("Command executed", "success");
        setTimeout(() => setAiResponse(null), 3000);
      }, 1500);

    } catch (e) {
      setIsProcessing(false);
      setAiResponse("Error processing command");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Topbar */}
      <header className="fixed top-0 w-full h-16 pt-[env(safe-area-inset-top)] bg-slate-900/80 backdrop-blur-md border-b border-emerald-500/20 z-50 flex items-center justify-between px-6 shadow-lg shadow-emerald-900/5">
        <Link to="/" className="flex items-center group">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
            <Zap className="text-white w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">AuriHome <span className="text-emerald-500">Nexus</span></span>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono tracking-wider">LOCAL AI</span>
        </Link>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center text-xs font-mono text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/10">
            <Wifi className="w-3 h-3 mr-2 animate-pulse" />
            {t('local.system.online')}
          </div>
          
          {/* Settings Dropdown */}
          <div className="relative">
            <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={cn("p-2 rounded-full hover:bg-white/5 transition-colors", isSettingsOpen ? "bg-white/10 text-white" : "text-slate-400")}
            >
                <Settings className="w-5 h-5" />
            </button>

            {isSettingsOpen && (
                <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-2">
                    <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {t('nav.language')}
                    </div>
                    <div className="flex gap-2 px-2 mb-2">
                        <button onClick={() => setLanguage('en')} className={cn("flex-1 py-1.5 text-xs rounded-md border font-medium transition-colors", language === 'en' ? "bg-emerald-600 border-emerald-500 text-white" : "border-slate-700 text-slate-400 hover:text-white")}>English</button>
                        <button onClick={() => setLanguage('ru')} className={cn("flex-1 py-1.5 text-xs rounded-md border font-medium transition-colors", language === 'ru' ? "bg-emerald-600 border-emerald-500 text-white" : "border-slate-700 text-slate-400 hover:text-white")}>Русский</button>
                    </div>
                    
                    <div className="h-px bg-slate-800 my-1" />
                    
                    <button 
                        onClick={() => navigate('/')} 
                        className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Exit to Landing
                    </button>
                </div>
                </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="absolute top-20 right-0 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl -z-10" />
        {children}
      </main>

      {/* Voice Assistant Overlay */}
      {(isListening || isProcessing || aiResponse) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-none">
            <div className="flex flex-col items-center gap-6 pointer-events-auto">
                <div className="relative">
                    <div className={cn("w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all", isProcessing ? "bg-indigo-600" : "bg-emerald-500")}>
                        {isProcessing ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <Mic className="w-10 h-10 text-white" />}
                    </div>
                    {isListening && <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-[ping_2s_ease-out_infinite]" />}
                </div>
                <div className="text-center bg-slate-900/90 p-4 rounded-xl border border-white/10 max-w-sm backdrop-blur">
                   <p className={cn("text-xl font-medium", isProcessing ? "text-indigo-300" : "text-emerald-300")}>
                     {aiResponse || "Listening..."}
                   </p>
                </div>
                {isListening && (
                    <button onClick={stopListening} className="bg-red-500/20 text-red-400 px-6 py-2 rounded-full hover:bg-red-500/30 border border-red-500/30">
                        Stop & Send
                    </button>
                )}
            </div>
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-6 right-6 pb-[env(safe-area-inset-bottom)] flex flex-col gap-4 items-end">
         <button 
            onMouseDown={startListening}
            onTouchStart={startListening}
            onMouseUp={stopListening}
            onTouchEnd={stopListening}
            className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
         >
             <Mic className="w-8 h-8" />
         </button>
      </div>
    </div>
  );
};

export default LocalLayout;
