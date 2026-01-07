
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Device, DeviceType, DeviceStatus } from '../types';
import { Card, CardContent, CardHeader, Button, Badge, Switch, Input, Select, cn } from '../components/ui';
import { Plus, Search, Filter, Lightbulb, Lock, Thermometer, Video, Power, MoreVertical, X, Wifi, Loader2, Smartphone, Home, Droplets, Zap, Trash2, Box, PenTool } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { mqttService } from '../services/mqttService';

const DeviceIcon = ({ type, isOn }: { type: DeviceType, isOn: boolean }) => {
  const colorClass = isOn ? "text-indigo-400" : "text-slate-500";
  switch (type) {
    case DeviceType.LIGHT: return <Lightbulb className={cn("w-6 h-6", isOn ? "text-yellow-400" : "text-slate-600")} />;
    case DeviceType.LOCK: return <Lock className={cn("w-6 h-6", isOn ? "text-red-400" : "text-emerald-400")} />;
    case DeviceType.THERMOSTAT: return <Thermometer className={cn("w-6 h-6", colorClass)} />;
    case DeviceType.CAMERA: return <Video className={cn("w-6 h-6", colorClass)} />;
    case DeviceType.SENSOR: return <Droplets className={cn("w-6 h-6", "text-blue-400")} />;
    case DeviceType.SWITCH: return <Zap className={cn("w-6 h-6", isOn ? "text-orange-400" : "text-slate-600")} />;
    default: return <Power className={cn("w-6 h-6", colorClass)} />;
  }
};

export const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState('');
  const [activeRoom, setActiveRoom] = useState('All');
  const [existingRooms, setExistingRooms] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // New Device Form State
  const [newDevice, setNewDevice] = useState<{
      name: string;
      type: DeviceType;
      room: string;
      topic: string;
  }>({
      name: '',
      type: DeviceType.LIGHT,
      room: 'Living Room',
      topic: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
        setIsLoading(true);
        const [d, u] = await Promise.all([db.getDevices(), db.getUser()]);
        setDevices(d);
        
        // Extract rooms from FloorPlan AND existing devices to suggest in modal
        const mapRooms = u.settings.floorPlan ? u.settings.floorPlan.map(r => r.name) : [];
        const deviceRooms = d.map(dev => dev.room).filter(Boolean) as string[];
        const uniqueRooms = Array.from(new Set([...mapRooms, ...deviceRooms]));
        setExistingRooms(uniqueRooms);

        setIsLoading(false);
  };

  // Filter list for Room Tabs (Apple Home Style)
  const rooms = ['All', ...Array.from(new Set(devices.map(d => d.room || 'Unassigned')))];

  const handleToggle = async (e: React.MouseEvent, id: string, currentState: any) => {
    e.stopPropagation();
    const dev = devices.find(d => d.id === id);
    if (!dev) return;

    const newState = !currentState.power;
    
    // 1. Optimistic UI update
    setDevices(prev => prev.map(d => d.id === id ? { ...d, state: { ...d.state, power: newState } } : d));
    
    // 2. Send Real MQTT Command
    mqttService.setDeviceState(dev, { power: newState });

    // 3. Update DB
    await db.updateDevice(id, { state: { ...currentState, power: newState } });
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.name) return;

    const initialState: any = { power: false };
    
    // Set meaningful defaults based on type
    if (newDevice.type === DeviceType.THERMOSTAT) {
        initialState.temperature = 22;
        initialState.targetTemperature = 24;
        initialState.mode = 'auto';
    } else if (newDevice.type === DeviceType.LIGHT) {
        initialState.brightness = 100;
        initialState.color = '#ffffff';
    } else if (newDevice.type === DeviceType.LOCK) {
        initialState.locked = true;
    } else if (newDevice.type === DeviceType.SENSOR) {
        initialState.temperature = 24;
        initialState.humidity = 45;
    }

    // Ensure room name is clean for matching
    const cleanRoom = newDevice.room.trim();

    const newDev = await db.addDevice({
      userId: 'u1',
      name: newDevice.name,
      type: newDevice.type,
      room: cleanRoom,
      mqttTopic: newDevice.topic || undefined,
      state: initialState
    });
    
    // RECONNECT MQTT to ensure subscription to new topic
    mqttService.connect();

    setDevices(prev => [...prev, newDev]);
    
    // Update local existing rooms if new one was typed
    if (cleanRoom && !existingRooms.includes(cleanRoom)) {
        setExistingRooms(prev => [...prev, cleanRoom]);
    }

    resetModal();
    toast('Device provisioned & subscribed', 'success');
  };

  const handleDeleteDevice = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm(t('app.confirm'))) {
          await db.deleteDevice(id);
          setDevices(prev => prev.filter(d => d.id !== id));
          toast(t('app.delete') + ' success', 'info');
      }
  };

  const resetModal = () => {
    setIsAddModalOpen(false);
    // Suggest first room if available
    const defaultRoom = existingRooms.length > 0 ? existingRooms[0] : 'Living Room';
    setNewDevice({ name: '', type: DeviceType.LIGHT, room: defaultRoom, topic: '' });
  };

  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesRoom = activeRoom === 'All' || d.room === activeRoom;
    return matchesSearch && matchesRoom;
  });

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('devices.title')}</h1>
          <p className="text-slate-400">{t('devices.subtitle')}</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg shadow-indigo-900/20">
          <Plus className="w-4 h-4 mr-2" />
          {t('devices.add')}
        </Button>
      </div>

      {/* Room Tabs (Apple Home Style) */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex space-x-2">
            {isLoading ? (
                // Skeleton Tabs
                Array(4).fill(0).map((_, i) => <div key={i} className="h-9 w-24 bg-slate-800 rounded-full animate-pulse" />)
            ) : (
                rooms.map(room => (
                    <button
                        key={room}
                        onClick={() => setActiveRoom(room)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                            activeRoom === room 
                                ? "bg-white text-slate-950 border-white shadow-md scale-105" 
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:bg-slate-800"
                        )}
                    >
                        {room === 'All' && <Home className="w-3 h-3 inline-block mr-1.5 mb-0.5" />}
                        {room}
                    </button>
                ))
            )}
          </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
             // Skeleton Grid
             Array(6).fill(0).map((_, i) => (
                 <div key={i} className="h-40 rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse p-5">
                     <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-slate-800" />
                             <div className="space-y-2">
                                 <div className="w-24 h-4 bg-slate-800 rounded" />
                                 <div className="w-12 h-3 bg-slate-800 rounded" />
                             </div>
                         </div>
                     </div>
                 </div>
             ))
        ) : filteredDevices.length === 0 ? (
             <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                <Box className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-slate-300">{t('devices.empty')}</h3>
                <p className="text-sm mt-2">{t('devices.empty.sub')}</p>
                <Button variant="outline" className="mt-6 border-slate-700" onClick={() => setIsAddModalOpen(true)}>
                    {t('devices.add')}
                </Button>
             </div>
        ) : (
            filteredDevices.map((device) => (
            <Card 
                key={device.id} 
                className="group hover:border-indigo-500/50 transition-all duration-300 cursor-pointer active:scale-[0.98] border-slate-800/60 bg-slate-900/40 backdrop-blur-sm relative"
                onClick={() => navigate(`/cloud/devices/${device.id}`)}
            >
                <CardContent className="p-5 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-full bg-slate-800 group-hover:bg-indigo-900/30 transition-colors")}>
                        <DeviceIcon type={device.type} isOn={device.state.power || false} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base text-white leading-tight group-hover:text-indigo-400 transition-colors">{device.name}</h3>
                            {device.status === DeviceStatus.OFFLINE && <span className="text-[10px] text-red-500 font-medium">Offline</span>}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         {/* Only show switch for controllable devices */}
                        {(device.type === DeviceType.LIGHT || device.type === DeviceType.SWITCH || device.type === DeviceType.CAMERA) && (
                            <Switch 
                                checked={device.state.power || false} 
                                onCheckedChange={(c) => {}} 
                                onClick={(e: React.MouseEvent) => handleToggle(e, device.id, device.state)}
                                className="scale-75 origin-right"
                            />
                        )}
                        <button 
                            onClick={(e) => handleDeleteDevice(e, device.id)}
                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-950/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/5">
                    <span>{device.room}</span>
                    <span>
                        {device.type === DeviceType.THERMOSTAT ? `${device.state.temperature}°C` : 
                        device.type === DeviceType.LOCK ? (device.state.locked ? 'Locked' : 'Unlocked') : 
                        device.type === DeviceType.SENSOR ? `${device.state.temperature}° | ${device.state.humidity}%` :
                        (device.state.power ? 'On' : 'Off')}
                    </span>
                </div>
                </CardContent>
            </Card>
            ))
        )}
      </div>

      {/* Manual Provisioning Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-slate-900 border-slate-700 animate-in zoom-in-95 duration-200 overflow-hidden shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between bg-slate-950/50 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-indigo-500" />
                        {t('devices.add')}
                    </h2>
                    <button onClick={resetModal} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleAddDevice} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Device Type</label>
                            <Select 
                                value={newDevice.type} 
                                onChange={(v) => setNewDevice({...newDevice, type: v as DeviceType})} 
                                options={Object.values(DeviceType).map(t => ({ label: t, value: t }))}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Device Name</label>
                            <Input 
                                value={newDevice.name} 
                                onChange={e => setNewDevice({...newDevice, name: e.target.value})} 
                                placeholder="e.g. Kitchen Light" 
                                required 
                                className="bg-slate-950"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Room</label>
                            <div className="relative">
                                <Input 
                                    value={newDevice.room} 
                                    onChange={e => setNewDevice({...newDevice, room: e.target.value})} 
                                    placeholder="Select or type..." 
                                    required 
                                    list="room-suggestions"
                                    className="bg-slate-950"
                                />
                                <datalist id="room-suggestions">
                                    {existingRooms.map(r => (
                                        <option key={r} value={r} />
                                    ))}
                                </datalist>
                                <p className="text-[10px] text-slate-500 mt-1">Select from existing rooms to link with Dashboard Map</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">MQTT Topic (Optional)</label>
                            <Input 
                                value={newDevice.topic} 
                                onChange={e => setNewDevice({...newDevice, topic: e.target.value})} 
                                placeholder="e.g. zigbee2mqtt/kitchen_light" 
                                className="font-mono text-xs bg-slate-950"
                            />
                        </div>

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 mt-4 h-12 text-base">
                            Provision Device
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
};
