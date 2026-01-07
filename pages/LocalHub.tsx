
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Device, DeviceType, User, EventLog } from '../types';
import { Button, cn } from '../components/ui';
import { 
  Lightbulb, 
  Power, 
  Thermometer, 
  Lock, 
  Moon, 
  Sun, 
  ShieldAlert,
  Droplets,
  Zap,
  Activity
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

const QuickAction = ({ label, icon: Icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center p-4 rounded-xl border transition-all active:scale-95",
      "bg-slate-900/50 backdrop-blur border-white/5 hover:bg-white/5",
      "group"
    )}
  >
    <div className={cn("p-3 rounded-full mb-2 transition-colors shadow-lg", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <span className="text-sm font-medium text-slate-300 group-hover:text-white">{label}</span>
  </button>
);

interface DeviceTileProps {
  device: Device;
  onToggle: (id: string) => void;
}

const DeviceTile: React.FC<DeviceTileProps> = ({ device, onToggle }) => {
  const isOn = device.state.power;
  
  // Custom Render for Sensor
  if (device.type === DeviceType.SENSOR) {
      return (
        <div className="relative overflow-hidden rounded-2xl p-6 transition-all duration-200 text-left border bg-slate-900/80 border-slate-800">
             <div className="flex justify-between items-start mb-4">
                 <div className="flex gap-2">
                     <Thermometer className="w-6 h-6 text-orange-400" />
                     <Droplets className="w-6 h-6 text-blue-400" />
                 </div>
                 <Activity className="w-4 h-4 text-slate-600" />
             </div>
             <div>
                <h3 className="font-bold text-lg text-slate-200">{device.name}</h3>
                <div className="flex gap-4 mt-2">
                    <span className="text-2xl font-mono text-orange-300">{device.state.temperature}°</span>
                    <span className="text-2xl font-mono text-blue-300">{device.state.humidity}%</span>
                </div>
                 <p className="text-sm mt-2 text-slate-500">{device.room}</p>
             </div>
        </div>
      );
  }
  
  return (
    <button
      onClick={() => onToggle(device.id)}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-200 text-left border",
        isOn 
          ? "bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-900/50" 
          : "bg-slate-900 border-slate-800 hover:border-slate-700"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        {device.type === DeviceType.LIGHT && <Lightbulb className={cn("w-8 h-8", isOn ? "text-white" : "text-slate-500")} />}
        {device.type === DeviceType.LOCK && <Lock className={cn("w-8 h-8", isOn ? "text-white" : "text-slate-500")} />}
        {device.type === DeviceType.THERMOSTAT && <Thermometer className={cn("w-8 h-8", isOn ? "text-white" : "text-slate-500")} />}
        {device.type === DeviceType.SWITCH && <Zap className={cn("w-8 h-8", isOn ? "text-white" : "text-slate-500")} />}
        {device.type === DeviceType.CAMERA && <Activity className={cn("w-8 h-8", isOn ? "text-white" : "text-slate-500")} />}
        
        <div className={cn("w-3 h-3 rounded-full", isOn ? "bg-white animate-pulse" : "bg-slate-700")} />
      </div>
      
      <div>
        <h3 className={cn("font-bold text-lg leading-tight", isOn ? "text-white" : "text-slate-200")}>
          {device.name}
        </h3>
        <p className={cn("text-sm mt-1", isOn ? "text-emerald-100" : "text-slate-500")}>
          {device.room}
        </p>
      </div>
      
      {/* Background Decor */}
      {isOn && (
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
      )}
    </button>
  );
};

export const LocalHub = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<EventLog[]>([]);
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const [d, u] = await Promise.all([db.getDevices(), db.getUser()]);
      setDevices(d);
      setUser(u);
    };
    init();

    // Poll for real events instead of fake logs
    const interval = setInterval(async () => {
       const recentLogs = await db.getLogs();
       setLogs(recentLogs.slice(0, 50)); // Keep last 50
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (id: string) => {
    const dev = devices.find(d => d.id === id);
    if (!dev) return;
    
    // Optimistic UI
    const newState = !dev.state.power;
    setDevices(prev => prev.map(d => d.id === id ? { ...d, state: { ...d.state, power: newState } } : d));
    
    await db.updateDevice(id, { state: { ...dev.state, power: newState } });
  };

  const runQuickAction = async (actionType: 'ALL_OFF' | 'MORNING' | 'NIGHT' | 'SECURITY') => {
    // Action Log
    await db.createLog({
        type: 'SYSTEM',
        message: `Quick Action Triggered: ${actionType}`
    });

    const updates: Promise<any>[] = [];
    const newDevices = [...devices];

    // Logic for Quick Actions
    switch(actionType) {
        case 'ALL_OFF':
            devices.forEach((d, idx) => {
                if (d.state.power) {
                    newDevices[idx] = { ...d, state: { ...d.state, power: false } };
                    updates.push(db.updateDevice(d.id, { state: { ...d.state, power: false } }));
                }
            });
            break;
        case 'MORNING':
             devices.forEach((d, idx) => {
                // Turn on Lights in Bedroom/Kitchen
                if (d.type === DeviceType.LIGHT && (d.room?.includes('Kitchen') || d.room?.includes('Bed'))) {
                    newDevices[idx] = { ...d, state: { ...d.state, power: true, brightness: 80 } };
                    updates.push(db.updateDevice(d.id, { state: { ...d.state, power: true, brightness: 80 } }));
                }
            });
            break;
        case 'NIGHT':
             devices.forEach((d, idx) => {
                if (d.type === DeviceType.LIGHT) {
                    // Turn off all lights
                    newDevices[idx] = { ...d, state: { ...d.state, power: false } };
                    updates.push(db.updateDevice(d.id, { state: { ...d.state, power: false } }));
                }
                if (d.type === DeviceType.LOCK) {
                    // Lock doors
                    newDevices[idx] = { ...d, state: { ...d.state, locked: true } };
                    updates.push(db.updateDevice(d.id, { state: { ...d.state, locked: true } }));
                }
            });
            break;
    }

    setDevices(newDevices);
    await Promise.all(updates);
    toast(`Quick Action: ${actionType} executed`, 'success');
  };

  // --- Calculations ---
  const activeSensors = devices.filter(d => d.state.temperature !== undefined);
  const avgTemp = activeSensors.length > 0 ? Math.round(activeSensors.reduce((a,b) => a + (b.state.temperature||0),0) / activeSensors.length) : '--';
  
  const currentPower = devices.reduce((a,b) => a + (b.state.powerUsage || 0), 0);
  const cost = user?.settings.energyCostPerKwh || 0;
  const dailyCost = ((currentPower * 24)/1000 * cost).toFixed(2);
  const currency = user?.settings.currencySymbol || '₽';

  return (
    <div className="space-y-10 pb-20">
      
      {/* Climate & Energy Header Chips */}
      <div className="flex flex-wrap gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-full px-5 py-2.5">
              <Thermometer className="text-orange-400 w-5 h-5" />
              <span className="text-slate-200 font-mono font-bold">{avgTemp}°C</span>
              <span className="text-slate-500 text-xs">AVG TEMP</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-full px-5 py-2.5">
              <Zap className="text-yellow-400 w-5 h-5" />
              <span className="text-slate-200 font-mono font-bold">{currentPower}W</span>
              <span className="text-slate-500 text-xs">LIVE LOAD</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-full px-5 py-2.5">
              <span className="text-emerald-400 font-bold">{currency}</span>
              <span className="text-slate-200 font-mono font-bold">{dailyCost}</span>
              <span className="text-slate-500 text-xs">EST. DAILY</span>
          </div>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">{t('local.quick_actions')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction label="Good Morning" icon={Sun} color="bg-orange-500" onClick={() => runQuickAction('MORNING')} />
          <QuickAction label="Good Night" icon={Moon} color="bg-indigo-500" onClick={() => runQuickAction('NIGHT')} />
          <QuickAction label="All Off" icon={Power} color="bg-red-500" onClick={() => runQuickAction('ALL_OFF')} />
          <QuickAction label="Security" icon={ShieldAlert} color="bg-emerald-500" onClick={() => runQuickAction('SECURITY')} />
        </div>
      </section>

      {/* Devices Grid */}
      <section>
        <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">{t('local.controls')}</h2>
        {devices.length === 0 ? (
            <div className="p-10 border border-dashed border-slate-800 rounded-xl text-center text-slate-500">
                No devices synced. Please add devices in the Cloud Console.
            </div>
        ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {devices.map(device => (
                <DeviceTile key={device.id} device={device} onToggle={handleToggle} />
            ))}
            </div>
        )}
      </section>

      {/* Live Logs Console */}
      <section className="bg-black/50 rounded-xl border border-slate-800 p-4 font-mono text-xs h-48 overflow-y-auto">
        <div className="flex items-center text-emerald-500 mb-2 sticky top-0 bg-black/50 backdrop-blur py-1 w-full border-b border-emerald-500/20">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
          LIVE EVENT BUS
        </div>
        <div className="space-y-1 text-slate-400">
          {logs.length === 0 && <div className="text-slate-600 italic">No recent system events...</div>}
          {logs.map((log, i) => (
            <div key={log.id} className="hover:text-white transition-colors border-b border-white/5 pb-0.5 flex gap-2">
                <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={cn(
                    log.type === 'DEVICE_STATE' ? "text-indigo-400" :
                    log.type === 'SCENARIO_TRIGGERED' ? "text-orange-400" : 
                    "text-emerald-400"
                )}>{log.message}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
