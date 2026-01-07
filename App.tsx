
import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import CloudLayout from './layouts/CloudLayout';
import LocalLayout from './layouts/LocalLayout';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from './components/ui';
import { ArrowRight, ShieldCheck, Wifi, Loader2, ArrowLeft } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { mqttService } from './services/mqttService';

// --- Lazy Load Pages ---
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Devices = React.lazy(() => import('./pages/Devices').then(module => ({ default: module.Devices })));
const DeviceDetail = React.lazy(() => import('./pages/DeviceDetail').then(module => ({ default: module.DeviceDetail })));
const Scenarios = React.lazy(() => import('./pages/Scenarios').then(module => ({ default: module.Scenarios })));
const Billing = React.lazy(() => import('./pages/Billing').then(module => ({ default: module.Billing })));
const Settings = React.lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const LocalHub = React.lazy(() => import('./pages/LocalHub').then(module => ({ default: module.LocalHub })));

// --- Components ---

const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center p-20">
    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
  </div>
);

// --- Landing Page ---
const Landing = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />
      
      <div className="z-10 text-center space-y-8 max-w-2xl px-4">
        <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-400 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
          {t('landing.version')}
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
          AuriHome <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Nexus</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-xl mx-auto">
          {t('landing.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Link to="/cloud">
            <Button size="lg" className="w-48 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-900/20">
              {t('landing.cta.cloud')} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link to="/local">
            <Button size="lg" variant="outline" className="w-48 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30 hover:text-emerald-300">
              {t('landing.cta.local')} <Wifi className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- Auth Mock ---
const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onLogin();
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/50">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-white">{t('auth.signin.title')}</CardTitle>
          <p className="text-center text-slate-400 text-sm">{t('auth.signin.subtitle')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input type="email" placeholder="name@example.com" defaultValue="admin@aurihome.com" className="bg-slate-950 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Input type="password" placeholder="Password" defaultValue="password" className="bg-slate-950 border-slate-700" />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={loading}>
              {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('auth.button.authenticating')}</>
              ) : (
                  t('auth.button.signin')
              )}
            </Button>

            <Link to="/" className="w-full block">
                <Button type="button" variant="ghost" className="w-full border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Mode Selection
                </Button>
            </Link>

            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">{t('auth.secure')}</span>
              </div>
            </div>
            <div className="flex justify-center text-emerald-500 text-sm items-center">
              <ShieldCheck className="w-4 h-4 mr-2" /> {t('auth.encryption')}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Main App ---
export default function App() {
  // Use localStorage initialization function to avoid flash of login screen on refresh
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('sh_auth') === 'true';
  });

  // Init Real MQTT Connection on Mount
  useEffect(() => {
      mqttService.connect();
  }, []);

  const handleLogin = () => {
    localStorage.setItem('sh_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('sh_auth');
    setIsAuthenticated(false);
  };

  return (
    <LanguageProvider>
      <ToastProvider>
        <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Landing />} />
              
              {/* Cloud Routes (Protected) */}
              <Route path="/login" element={isAuthenticated ? <Navigate to="/cloud" /> : <Login onLogin={handleLogin} />} />
              
              <Route path="/cloud" element={isAuthenticated ? <CloudLayout onLogout={handleLogout}><Dashboard /></CloudLayout> : <Navigate to="/login" />} />
              <Route path="/cloud/devices" element={isAuthenticated ? <CloudLayout onLogout={handleLogout}><Devices /></CloudLayout> : <Navigate to="/login" />} />
              <Route path="/cloud/devices/:id" element={isAuthenticated ? <CloudLayout onLogout={handleLogout}><DeviceDetail /></CloudLayout> : <Navigate to="/login" />} />
              <Route path="/cloud/scenarios" element={isAuthenticated ? <CloudLayout onLogout={handleLogout}><Scenarios /></CloudLayout> : <Navigate to="/login" />} />
              <Route path="/cloud/billing" element={isAuthenticated ? <CloudLayout onLogout={handleLogout}><Billing /></CloudLayout> : <Navigate to="/login" />} />
              <Route path="/cloud/settings" element={isAuthenticated ? <CloudLayout onLogout={handleLogout}><Settings /></CloudLayout> : <Navigate to="/login" />} />
              <Route path="/cloud/*" element={<Navigate to="/cloud" />} />

              {/* Local Routes (Open Access) */}
              <Route path="/local" element={<LocalLayout><LocalHub /></LocalLayout>} />
              </Routes>
            </Suspense>
        </Router>
      </ToastProvider>
    </LanguageProvider>
  );
}
