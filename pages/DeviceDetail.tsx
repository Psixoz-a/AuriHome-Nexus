
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/mockDb';
import { Device, DeviceType } from '../types';
import { Card, CardContent, CardHeader, CardTitle, Button, Switch, cn, Input } from '../components/ui';
import { ArrowLeft, Thermometer, Battery, Signal, Sun, Mic, Video, Phone, Activity, Settings } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

// --- Sub-components for specific controls ---

const LightControl = ({ device, onUpdate }: { device: Device; onUpdate: (s: any) => void }) => {
  const colors = ['#ffffff', '#fca5a5', '#fcd34d', '#4ade80', '#60a5fa', '#818cf8', '#c084fc', '#f472b6'];
  
  return (
    <div className="space-y-8">
       {/* Brightness Slider */}
       <div className="space-y-3">
          <div className="flex justify-between text-sm text-slate-400">
             <span>Brightness</span>
             <span>{device.state.brightness || 100}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            value={device.state.brightness || 100}
            onChange={(e) => onUpdate({ brightness: parseInt(e.target.value) })}
          />
       </div>

       {/* Color Grid */}
       <div className="space-y-3">
          <span className="text-sm text-slate-400">Color</span>
          <div className="flex flex-wrap gap-4">
            {colors.map(color => (
                <button
                    key={color}
                    onClick={() => onUpdate({ color })}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${device.state.color === color ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                />
            ))}
            {/* Custom Color Input */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-700">
                <input 
                    type="color" 
                    value={device.state.color || '#ffffff'}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0"
                />
            </div>
          </div>
       </div>
    </div>
  );
};

const ThermostatControl = ({ device, onUpdate }: { device: Device; onUpdate: (s: any) => void }) => {
    const temp = device.state.temperature || 21;
    
    // Mock History Data
    const data = [
        { t: '12AM', v: 18 }, { t: '4AM', v: 17 }, { t: '8AM', v: 21 }, 
        { t: '12PM', v: 23 }, { t: '4PM', v: 22 }, { t: '8PM', v: 20 }
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-center py-8">
                <div className="relative w-64 h-64 rounded-full border-8 border-slate-800 flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] bg-slate-900">
                    <div className="text-center">
                        <span className="text-6xl font-bold text-white block">{temp}°</span>
                        <span className="text-slate-500 text-sm uppercase tracking-widest">Current</span>
                    </div>
                    {/* Controls */}
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                         <button onClick={() => onUpdate({ temperature: temp - 1 })} className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-2xl text-indigo-400">-</button>
                         <button onClick={() => onUpdate({ temperature: temp + 1 })} className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-2xl text-red-400">+</button>
                    </div>
                    {/* Active Arc (Fake visual) */}
                    <div className="absolute top-0 w-full h-full rounded-full border-8 border-indigo-500 border-b-transparent border-l-transparent rotate-45 opacity-50 pointer-events-none" />
                </div>
            </div>

            <div className="h-40 w-full">
                <p className="text-sm text-slate-400 mb-2">24h History</p>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none'}} />
                        <Area type="monotone" dataKey="v" stroke="#818cf8" fillOpacity={1} fill="url(#colorTemp)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const CameraView = ({ device, onUpdate }: { device: Device; onUpdate: (s: any) => void }) => {
    const [isTalking, setIsTalking] = useState(false);
    const [configMode, setConfigMode] = useState(false);
    const [streamUrl, setStreamUrl] = useState(device.state.streamUrl || '');

    const handleSaveUrl = () => {
        onUpdate({ streamUrl });
        setConfigMode(false);
    };

    return (
        <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl group">
                {/* Live Feed */}
                {device.state.streamUrl ? (
                    <img 
                        src={device.state.streamUrl} 
                        alt="Live Feed"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558036117-15db97365ab5?q=80&w=1000&auto=format&fit=crop"; // Fallback
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 flex-col gap-2">
                        <Video size={40} />
                        <span className="text-sm">No Stream URL Configured</span>
                    </div>
                )}
                
                {/* Overlays */}
                <div className="absolute top-4 left-4 bg-red-600 px-2 py-1 rounded text-xs font-bold text-white flex items-center animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full mr-2" /> LIVE
                </div>
                
                <button 
                    onClick={() => setConfigMode(!configMode)}
                    className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Settings size={16} />
                </button>

                {configMode && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 animate-in fade-in">
                        <div className="w-full max-w-sm space-y-3">
                            <label className="text-white text-sm">Stream URL (MJPEG/Snapshot)</label>
                            <Input 
                                value={streamUrl} 
                                onChange={e => setStreamUrl(e.target.value)} 
                                placeholder="http://192.168.1.X:8080/video" 
                                className="bg-slate-800"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveUrl} className="flex-1 bg-emerald-600 hover:bg-emerald-500">Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setConfigMode(false)}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button 
                    className={cn("h-12 text-lg", isTalking ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600")}
                    onMouseDown={() => setIsTalking(true)}
                    onMouseUp={() => setIsTalking(false)}
                    onTouchStart={() => setIsTalking(true)}
                    onTouchEnd={() => setIsTalking(false)}
                >
                   {isTalking ? <Activity className="mr-2 animate-pulse" /> : <Mic className="mr-2" />}
                   {isTalking ? "TALKING..." : "HOLD TO TALK"}
                </Button>
                <Button variant="outline" className="h-12 text-lg border-slate-700">
                    <Video className="mr-2" /> Playback
                </Button>
            </div>
        </div>
    );
};


// --- Main Page Component ---

export const DeviceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [device, setDevice] = useState<Device | null>(null);

    useEffect(() => {
        if(id) {
            db.getDeviceById(id).then(d => {
                if(d) setDevice(d);
                else navigate('/cloud/devices');
            });
        }
    }, [id, navigate]);

    const updateState = async (newState: any) => {
        if(!device) return;
        const updated = { ...device.state, ...newState };
        // Optimistic UI
        setDevice({ ...device, state: updated });
        await db.updateDevice(device.id, { state: updated });
    };

    if(!device) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/cloud/devices')} className="pl-0 text-slate-400 hover:text-white">
                <ArrowLeft className="mr-2 w-4 h-4" /> Back to Devices
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{device.name}</h1>
                    <div className="flex items-center space-x-4 text-slate-400 text-sm">
                        <span className="bg-slate-800 px-2 py-1 rounded text-xs uppercase tracking-wider text-slate-300">{device.room}</span>
                        <span className="flex items-center"><Signal className="w-3 h-3 mr-1" /> Excellent</span>
                        <span className="flex items-center"><Battery className="w-3 h-3 mr-1" /> 100%</span>
                    </div>
                </div>
                <Switch 
                    checked={device.state.power || false} 
                    onCheckedChange={(c) => updateState({ power: c })}
                />
            </div>

            <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                    <CardTitle>Controls</CardTitle>
                </CardHeader>
                <CardContent>
                    {device.type === DeviceType.LIGHT && <LightControl device={device} onUpdate={updateState} />}
                    {device.type === DeviceType.THERMOSTAT && <ThermostatControl device={device} onUpdate={updateState} />}
                    {device.type === DeviceType.CAMERA && <CameraView device={device} onUpdate={updateState} />}
                    {(device.type !== DeviceType.LIGHT && device.type !== DeviceType.THERMOSTAT && device.type !== DeviceType.CAMERA) && (
                         <div className="text-center py-10 text-slate-500">
                             Simple On/Off Device. Toggle using the switch above.
                         </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
