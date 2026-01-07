
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Switch, Badge, Select } from '../components/ui';
import { User, Lock, Bell, Key, Save, Shield, Globe, Smartphone, CheckCircle, Server, Database, Zap, Bot, Trash2, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/mockDb';
import { useToast } from '../contexts/ToastContext';
import { mqttService } from '../services/mqttService';
import { AIProvider } from '../types';

export const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ id: '', name: '', email: '' });
  
  // Config State
  const [mqttConfig, setMqttConfig] = useState({ url: 'ws://localhost:9001', user: '', pass: '' });
  const [energyConfig, setEnergyConfig] = useState({ cost: '5.50', currency: '₽' });
  const [aiConfig, setAiConfig] = useState({
      provider: AIProvider.GEMINI,
      geminiKey: '',
      openaiKey: '',
      localUrl: 'http://localhost:8000'
  });

  // Security & Remote State
  const [remoteEnabled, setRemoteEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Password Modal State
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    const load = async () => {
        const u = await db.getUser();
        setUser({ id: u.id, name: u.name, email: u.email });
        setEnergyConfig({ 
            cost: u.settings.energyCostPerKwh.toString(), 
            currency: u.settings.currencySymbol 
        });
        
        setAiConfig({
            provider: u.settings.aiProvider,
            geminiKey: u.settings.aiGeminiKey,
            openaiKey: u.settings.aiOpenAIKey,
            localUrl: u.settings.aiLocalUrl
        });

        // Initialize checkboxes from DB
        setRemoteEnabled(u.settings.remoteAccess ?? false);
        setTwoFactorEnabled(u.settings.twoFactorEnabled ?? false);
        
        const mConf = mqttService.getConfig();
        setMqttConfig({ url: mConf.brokerUrl, user: mConf.username, pass: mConf.password });
    };
    load();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await db.updateUser({ name: user.name, email: user.email });
        toast(t('app.save') + ' success', 'success');
    } catch (err) {
        toast('Failed to update profile', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleSaveSystem = async (e: React.FormEvent) => {
      e.preventDefault();
      mqttService.updateConfig(mqttConfig.url, mqttConfig.user, mqttConfig.pass);
      
      await db.updateUser({
          settings: {
              // We retrieve current settings to ensure we don't overwrite unrelated fields if not mapped here
              ...(await db.getUser()).settings,
              mqttBrokerUrl: mqttConfig.url,
              mqttUsername: mqttConfig.user,
              mqttPassword: mqttConfig.pass,
              
              language: language, 
              theme: 'dark',
              
              energyCostPerKwh: parseFloat(energyConfig.cost),
              currencySymbol: energyConfig.currency,

              aiProvider: aiConfig.provider,
              aiGeminiKey: aiConfig.geminiKey,
              aiOpenAIKey: aiConfig.openaiKey,
              aiLocalUrl: aiConfig.localUrl
          } as any
      });

      toast('System configuration updated.', 'info');
  };

  // Immediate Toggle Handlers
  const toggleRemote = async (val: boolean) => {
      setRemoteEnabled(val);
      await db.updateUser({ settings: { ...(await db.getUser()).settings, remoteAccess: val } });
      toast(val ? 'Remote Access Enabled' : 'Remote Access Disabled', val ? 'success' : 'info');
  };

  const toggle2FA = async (val: boolean) => {
      setTwoFactorEnabled(val);
      await db.updateUser({ settings: { ...(await db.getUser()).settings, twoFactorEnabled: val } });
      toast(val ? '2FA Enabled' : '2FA Disabled', val ? 'success' : 'info');
  };

  const handleReset = async () => {
      if(confirm(t('app.confirm'))) {
          toast('Resetting system...', 'warning');
          await db.resetDatabase();
      }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!passForm.current || !passForm.new) {
          toast('All fields are required', 'error');
          return;
      }
      if (passForm.new !== passForm.confirm) {
          toast('New passwords do not match', 'error');
          return;
      }
      if (passForm.new.length < 6) {
          toast('Password is too short', 'warning');
          return;
      }

      setLoading(true);
      
      // Verify Current Password Simulation
      const isValid = await db.verifyPassword(user.id, passForm.current);
      if (!isValid) {
          setLoading(false);
          toast('Incorrect current password', 'error');
          return;
      }

      // Update Password
      await db.changePassword(user.id, passForm.new);
      
      setLoading(false);
      setIsPassModalOpen(false);
      setPassForm({ current: '', new: '', confirm: '' });
      toast('Password changed successfully', 'success');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto relative">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('settings.title')}</h1>
        <p className="text-slate-400">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* System Configuration */}
              <Card className="border-indigo-500/30 bg-indigo-950/10">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5 text-indigo-400" /> {t('settings.system_core')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <form onSubmit={handleSaveSystem} className="space-y-6">
                          
                          {/* AI Provider Section */}
                          <div className="space-y-4">
                              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
                                  <Bot className="w-4 h-4" /> {t('settings.ai.title')}
                              </h4>
                              <div className="grid md:grid-cols-2 gap-4">
                                  <div className="space-y-2 col-span-2">
                                      <label className="text-xs text-slate-400">{t('settings.ai.select')}</label>
                                      <Select 
                                          value={aiConfig.provider}
                                          onChange={v => setAiConfig({...aiConfig, provider: v as AIProvider})}
                                          options={[
                                              { label: 'Google Gemini (Fast & Free Tier)', value: AIProvider.GEMINI },
                                              { label: 'OpenAI GPT-4/3.5 (Paid)', value: AIProvider.OPENAI },
                                              { label: 'Local AI (Ollama/Python)', value: AIProvider.LOCAL }
                                          ]}
                                      />
                                  </div>

                                  {/* Conditional Inputs */}
                                  {aiConfig.provider === AIProvider.GEMINI && (
                                      <div className="space-y-2 col-span-2 animate-in fade-in">
                                          <label className="text-xs text-slate-400">Gemini {t('settings.ai.key')}</label>
                                          <Input type="password" value={aiConfig.geminiKey} onChange={e => setAiConfig({...aiConfig, geminiKey: e.target.value})} placeholder="AIza..." />
                                      </div>
                                  )}

                                  {aiConfig.provider === AIProvider.OPENAI && (
                                      <div className="space-y-2 col-span-2 animate-in fade-in">
                                          <label className="text-xs text-slate-400">OpenAI {t('settings.ai.key')}</label>
                                          <Input type="password" value={aiConfig.openaiKey} onChange={e => setAiConfig({...aiConfig, openaiKey: e.target.value})} placeholder="sk-..." />
                                      </div>
                                  )}

                                  {aiConfig.provider === AIProvider.LOCAL && (
                                      <div className="space-y-2 col-span-2 animate-in fade-in">
                                          <label className="text-xs text-slate-400">{t('settings.ai.url')}</label>
                                          <Input value={aiConfig.localUrl} onChange={e => setAiConfig({...aiConfig, localUrl: e.target.value})} placeholder="http://localhost:11434" className="font-mono" />
                                          <p className="text-[10px] text-slate-500">Must support OpenAI-compatible API or custom internal format.</p>
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* MQTT */}
                          <div className="space-y-4">
                              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2">
                                  {t('settings.mqtt.title')}
                              </h4>
                              <div className="grid md:grid-cols-2 gap-4">
                                  <div className="space-y-2 col-span-2">
                                      <label className="text-xs text-slate-400">{t('settings.mqtt.url')}</label>
                                      <Input value={mqttConfig.url} onChange={e => setMqttConfig({...mqttConfig, url: e.target.value})} placeholder="ws://192.168.1.X:9001" className="font-mono" />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs text-slate-400">Username</label>
                                      <Input value={mqttConfig.user} onChange={e => setMqttConfig({...mqttConfig, user: e.target.value})} />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs text-slate-400">Password</label>
                                      <Input type="password" value={mqttConfig.pass} onChange={e => setMqttConfig({...mqttConfig, pass: e.target.value})} />
                                  </div>
                              </div>
                          </div>
                          
                           {/* Energy */}
                           <div className="space-y-4">
                              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2">
                                  {t('settings.energy.title')}
                              </h4>
                              <div className="grid md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <label className="text-xs text-slate-400">{t('settings.energy.cost')}</label>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        value={energyConfig.cost} 
                                        onChange={e => setEnergyConfig({...energyConfig, cost: e.target.value})} 
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs text-slate-400">Currency Symbol</label>
                                      <Select 
                                        value={energyConfig.currency} 
                                        onChange={v => setEnergyConfig({...energyConfig, currency: v})} 
                                        options={[
                                            {label: 'RUB (₽)', value: '₽'},
                                            {label: 'USD ($)', value: '$'},
                                            {label: 'EUR (€)', value: '€'}
                                        ]} 
                                      />
                                  </div>
                              </div>
                          </div>

                          <div className="flex justify-end pt-4">
                              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500">{t('app.save')}</Button>
                          </div>
                      </form>
                  </CardContent>
              </Card>

              {/* Profile Section */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-indigo-500" /> {t('settings.profile')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-slate-400">Display Name</label>
                        <Input value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-slate-400">Email Address</label>
                        <Input value={user.email} onChange={e => setUser({...user, email: e.target.value})} type="email" />
                      </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading} className="bg-slate-800 hover:bg-slate-700">
                             {loading ? t('app.saving') : t('app.save')}
                        </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
          </div>

          {/* Side Column */}
          <div className="space-y-6">
              {/* Remote Access */}
              <Card className={remoteEnabled ? "border-emerald-500/30 bg-emerald-950/10" : "border-slate-800 bg-slate-900/50"}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <Globe className={remoteEnabled ? "w-5 h-5 text-emerald-500" : "w-5 h-5 text-slate-500"} /> 
                        {t('settings.remote')}
                    </CardTitle>
                    <Switch checked={remoteEnabled} onCheckedChange={toggleRemote} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={remoteEnabled ? "bg-emerald-500/20 p-2 rounded-full" : "bg-slate-800 p-2 rounded-full"}>
                                <Smartphone className={remoteEnabled ? "w-5 h-5 text-emerald-400" : "w-5 h-5 text-slate-500"} />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-200">Tailscale VPN</h4>
                                <p className="text-xs text-slate-500">
                                    {remoteEnabled ? `100.64.0.1 • ${t('settings.remote.active')}` : t('settings.remote.offline')}
                                </p>
                            </div>
                        </div>
                        {remoteEnabled && <Badge variant="success">{t('settings.remote.active')}</Badge>}
                    </div>
                </CardContent>
              </Card>

             {/* Security */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-500" /> {t('settings.security')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-slate-200">{t('settings.security.2fa')}</label>
                            <p className="text-xs text-slate-500">{t('settings.security.2fa_desc')}</p>
                        </div>
                        <Switch checked={twoFactorEnabled} onCheckedChange={toggle2FA} />
                    </div>
                    <Button 
                        variant="outline" 
                        className="w-full justify-between border-slate-700 hover:bg-slate-800"
                        onClick={() => setIsPassModalOpen(true)}
                    >
                        <span>{t('settings.security.change_pass')}</span>
                        <Lock className="w-4 h-4" />
                    </Button>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="border-red-900/30 bg-red-950/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400"><Database className="w-5 h-5" /> {t('settings.data')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-xs text-slate-400">{t('settings.reset.desc')}</p>
                   <Button variant="destructive" onClick={handleReset} className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50">
                       <Trash2 className="w-4 h-4 mr-2" /> {t('settings.reset')}
                   </Button>
                </CardContent>
              </Card>
          </div>
      </div>

      {/* Change Password Modal */}
      {isPassModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-slate-900 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 bg-slate-950/50">
                    <CardTitle className="text-lg">{t('settings.security.change_pass')}</CardTitle>
                    <button onClick={() => setIsPassModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">{t('settings.security.current')}</label>
                            <Input 
                                type="password" 
                                value={passForm.current} 
                                onChange={e => setPassForm({...passForm, current: e.target.value})} 
                                className="bg-slate-950"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">{t('settings.security.new')}</label>
                            <Input 
                                type="password" 
                                value={passForm.new} 
                                onChange={e => setPassForm({...passForm, new: e.target.value})} 
                                className="bg-slate-950"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">{t('settings.security.confirm')}</label>
                            <Input 
                                type="password" 
                                value={passForm.confirm} 
                                onChange={e => setPassForm({...passForm, confirm: e.target.value})} 
                                className="bg-slate-950"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsPassModalOpen(false)} className="flex-1">
                                {t('app.cancel')}
                            </Button>
                            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500" disabled={loading}>
                                {loading ? t('app.saving') : t('app.save')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
};
