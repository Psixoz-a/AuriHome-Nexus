
import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { db } from '../services/mockDb';
import { Device, EventLog, User, RoomConfig } from '../types';
import { Card, CardContent, CardHeader, CardTitle, cn, Button } from '../components/ui';
import { Cpu, Zap, Activity, Clock, Map, ShieldCheck, Thermometer, DollarSign, Loader2, PenTool, X, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { FloorPlan } from '../components/dashboard/FloorPlan';
import { StatCard } from '../components/dashboard/StatCard';

export const Dashboard = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Map Editing State
  const [isEditingMap, setIsEditingMap] = useState(false);
  const [rooms, setRooms] = useState<RoomConfig[]>([]);

  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      setIsLoading(true);
      const [d, l, u] = await Promise.all([db.getDevices(), db.getLogs(), db.getUser()]);
      setDevices(d);
      setLogs(l);
      setUser(u);
      setRooms(u.settings.floorPlan ? [...u.settings.floorPlan] : []);
      setIsLoading(false);
  };

  const handleSaveMap = async () => {
      if (!user) return;
      toast(t('app.saving'), 'info');
      
      const updatedUser = await db.updateUser({ 
          settings: { ...user.settings, floorPlan: rooms } 
      });
      
      setUser(updatedUser);
      setRooms([...(updatedUser.settings.floorPlan || [])]);
      setIsEditingMap(false);
      toast(t('app.save') + ' success', 'success');
  };

  const handleAddRoom = () => {
      const name = prompt(t('dashboard.map.prompt'), `Room ${rooms.length + 1}`);
      if (!name) return;

      const count = rooms.length;
      const col = count % 3;
      const row = Math.floor(count / 3);
      
      const width = 200;
      const height = 200;
      const gap = 40;
      
      const startX = 50 + (col * (width + gap));
      const startY = 50 + (row * (height + gap));

      // Reset to top if we run out of vertical space significantly, 
      // though map is responsive in simple grid for now.
      const safeX = startX > 800 ? 50 : startX;
      const safeY = startY > 600 ? 50 : startY;

      const newRoom: RoomConfig = {
          id: Math.random().toString(36).substr(2, 9),
          name: name.trim(),
          path: `M ${safeX} ${safeY} L ${safeX + width} ${safeY} L ${safeX + width} ${safeY + height} L ${safeX} ${safeY + height} Z`,
          x: safeX,
          y: safeY,
          labelX: safeX + (width / 2),
          labelY: safeY + (height / 2)
      };
      setRooms(prev => [...prev, newRoom]);
  };

  const handleDeleteRoom = (id: string) => {
      if(confirm(t('app.confirm'))) {
        setRooms(rooms.filter(r => r.id !== id));
      }
  };

  // --- Aggregate Sensor Data ---
  const roomNames = Array.from(new Set(devices.map(d => d.room || 'Unknown')));
  const climateData = roomNames.map(room => {
      const roomDevices = devices.filter(d => d.room === room);
      const sensors = roomDevices.filter(d => d.state.temperature !== undefined);
      const temp = sensors.length ? Math.round(sensors.reduce((acc, curr) => acc + (curr.state.temperature || 0), 0) / sensors.length) : null;
      const humidity = sensors.length ? Math.round(sensors.reduce((acc, curr) => acc + (curr.state.humidity || 0), 0) / sensors.length) : null;
      return { name: room, temp, humidity };
  }).filter(d => d.temp !== null);

  // --- Aggregate Energy Data ---
  const costPerKwh = user?.settings.energyCostPerKwh || 5.0;
  const currency = user?.settings.currencySymbol || '₽';

  const energyDevices = devices.filter(d => (d.state.powerUsage || 0) > 0);
  const totalPowerW = energyDevices.reduce((acc, d) => acc + (d.state.powerUsage || 0), 0);
  const estDailyCost = ((totalPowerW * 24) / 1000) * costPerKwh;

  const energyChartData = energyDevices.map(d => ({
      name: d.name,
      watts: d.state.powerUsage || 0,
      cost: parseFloat((((d.state.powerUsage || 0) * 24 / 1000) * costPerKwh).toFixed(2))
  }));

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-slate-400">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => navigate('/cloud/scenarios')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-900/20 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              {t('dashboard.quick_actions')}
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard loading={isLoading} title={t('stats.total_devices')} value={devices.length} subtext={t('stats.total_devices.sub')} icon={Cpu} trend />
        <StatCard 
            loading={isLoading}
            title={t('stats.current_power')} 
            value={`${totalPowerW} W`} 
            subtext={`${t('stats.est_daily_cost')} ${currency}${estDailyCost.toFixed(2)}`} 
            icon={Zap} 
            trend 
        />
        <StatCard loading={isLoading} title={t('stats.system_load')} value="12%" subtext="Mini PC Optimal" icon={Activity} />
        <StatCard loading={isLoading} title={t('stats.security')} value={t('stats.security.armed')} subtext={t('stats.security.safe')} icon={ShieldCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-8">
        
        {/* Interactive Floor Plan */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <Map className="w-5 h-5 text-indigo-500" /> {t('dashboard.map.title')}
              </h3>
              <div className="flex gap-2">
                  {isEditingMap ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingMap(false)} className="text-slate-400"><X className="w-4 h-4 mr-1"/> {t('dashboard.map.cancel')}</Button>
                        <Button size="sm" onClick={handleSaveMap} className="bg-indigo-600 hover:bg-indigo-500"><Save className="w-4 h-4 mr-1"/> {t('dashboard.map.save')}</Button>
                      </>
                  ) : (
                      <Button size="sm" variant="outline" onClick={() => setIsEditingMap(true)} className="border-slate-700 text-slate-300">
                          <PenTool className="w-4 h-4 mr-2" /> {t('dashboard.map.edit')}
                      </Button>
                  )}
              </div>
           </div>
           
           {isLoading ? (
               <div className="w-full aspect-[16/9] min-h-[300px] bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-center">
                   <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
               </div>
           ) : (
               <FloorPlan 
                   devices={devices} 
                   rooms={rooms}
                   isEditing={isEditingMap} 
                   onRoomAdd={handleAddRoom}
                   onRoomDelete={handleDeleteRoom}
               />
           )}
           
           {/* Charts */}
           <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-slate-800 bg-slate-900/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-orange-400" /> {t('dashboard.climate')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        {isLoading ? (
                             <div className="h-full w-full flex items-center justify-center text-slate-600"><Loader2 className="animate-spin" /></div>
                        ) : climateData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={climateData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                                    <Bar dataKey="temp" name={t('chart.temp')} fill="#fb923c" radius={[4,4,0,0]} barSize={20} />
                                    <Bar dataKey="humidity" name={t('chart.hum')} fill="#38bdf8" radius={[4,4,0,0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">{t('app.empty')}</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-900/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400" /> {t('dashboard.energy')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        {isLoading ? (
                            <div className="h-full w-full flex items-center justify-center text-slate-600"><Loader2 className="animate-spin" /></div>
                        ) : energyChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={energyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#475569" fontSize={10} hide />
                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                                    <Bar dataKey="cost" name={`${t('chart.cost')} (${currency})`} fill="#34d399" radius={[0,4,4,0]} barSize={15} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="h-full flex items-center justify-center text-slate-500 text-sm">{t('app.empty')}</div>
                        )}
                    </CardContent>
                </Card>
           </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <Clock className="w-5 h-5 text-indigo-500" /> {t('dashboard.logs.title')}
            </h3>
            <Card className="border-slate-800 bg-slate-900/50 h-[calc(100%-3rem)] max-h-[600px] overflow-hidden flex flex-col">
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                <div className="relative p-6 space-y-6">
                <div className="absolute left-[35px] top-6 bottom-6 w-px bg-slate-800" />
                {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                         <div key={i} className="flex gap-4 items-center">
                            <div className="w-5 h-5 rounded-full bg-slate-800 animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse" />
                                <div className="h-3 w-1/4 bg-slate-800 rounded animate-pulse" />
                            </div>
                        </div>
                    ))
                ) : logs.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">{t('app.empty')}</div>
                ) : (
                    logs.slice(0, 10).map((log, i) => (
                    <div key={log.id} className="relative flex items-start group">
                        <div className={cn(
                            "relative z-10 w-5 h-5 rounded-full border-2 flex-shrink-0 bg-slate-950 mt-0.5 transition-colors",
                            log.type === 'DEVICE_STATE' ? "border-indigo-500 group-hover:bg-indigo-500" :
                            log.type === 'SYSTEM' ? "border-emerald-500 group-hover:bg-emerald-500" : "border-slate-500"
                        )} />
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">{log.message}</p>
                            <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                )))}
                </div>
            </CardContent>
            </Card>
        </div>

      </div>
    </>
  );
};
