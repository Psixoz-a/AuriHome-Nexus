
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Smartphone, 
  Workflow, 
  Settings, 
  LogOut, 
  UserCircle,
  Home
} from 'lucide-react';
import { cn, Button } from '../components/ui';
import { useLanguage } from '../contexts/LanguageContext';
import { SmartAssistant } from '../components/SmartAssistant';
import { NotificationCenter } from '../components/NotificationCenter';

interface CloudLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const CloudLayout: React.FC<CloudLayoutProps> = ({ children, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();

  const navItems = [
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/cloud' },
    { label: t('nav.devices'), icon: Smartphone, path: '/cloud/devices' },
    { label: t('nav.scenarios'), icon: Workflow, path: '/cloud/scenarios' },
    { label: t('nav.settings'), icon: Settings, path: '/cloud/settings' },
  ];

  // Mobile Bottom Nav Items (Same as desktop for consistency now that billing is gone)
  const mobileNavItems = navItems;

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans text-slate-200 selection:bg-indigo-500/30">
      
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 flex-col pt-[env(safe-area-inset-top)]",
        )}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-white/10">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">AuriHome <span className="text-indigo-400">Nexus</span></span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                    isActive 
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-4">
            <div className="flex items-center justify-between px-1">
               <span className="text-xs text-slate-500 font-semibold uppercase">{t('nav.language')}</span>
               <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                 <button 
                   onClick={() => setLanguage('en')}
                   className={cn("px-2 py-0.5 text-xs rounded-md transition-all", language === 'en' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white")}
                 >EN</button>
                 <button 
                   onClick={() => setLanguage('ru')}
                   className={cn("px-2 py-0.5 text-xs rounded-md transition-all", language === 'ru' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white")}
                 >RU</button>
               </div>
            </div>

             {/* Exit to Landing / Logout Group */}
             <div className="space-y-1">
                 <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white" onClick={() => navigate('/')}>
                    <Home className="mr-3 h-4 w-4" />
                    Exit to Landing
                </Button>
                <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30" onClick={onLogout}>
                    <LogOut className="mr-3 h-4 w-4" />
                    {t('nav.logout')}
                </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Desktop Header for Notifications */}
        <div className="hidden lg:flex fixed top-0 right-0 z-40 p-4 gap-4">
             <NotificationCenter />
        </div>

        {/* Mobile Header */}
        <header className="lg:hidden h-14 pt-[env(safe-area-inset-top)] flex items-center justify-between px-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center">
             <Workflow className="w-5 h-5 text-indigo-500 mr-2" />
             <span className="font-bold text-lg">AuriHome Nexus</span>
           </div>
           <div className="flex items-center gap-2">
             <NotificationCenter />
             <Button size="icon" variant="ghost" onClick={onLogout}>
                <LogOut className="w-5 h-5 text-slate-400" />
             </Button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8 relative">
          {/* Ambient Background Glow */}
          <div className="absolute top-0 left-0 w-full h-96 bg-indigo-900/10 rounded-full blur-3xl -z-10 translate-y-[-50%]" />
          
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {children}
          </div>
        </div>

        {/* Floating Smart Assistant */}
        <SmartAssistant />

        {/* Mobile Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-white/10 z-50 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-center h-16">
            {mobileNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className="flex flex-col items-center justify-center w-full h-full"
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all",
                    isActive ? "bg-indigo-500/20" : ""
                  )}>
                    <item.icon className={cn(
                      "w-6 h-6 transition-colors",
                      isActive ? "text-indigo-400" : "text-slate-500"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium mt-1 transition-colors",
                    isActive ? "text-indigo-400" : "text-slate-600"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
};

export default CloudLayout;
