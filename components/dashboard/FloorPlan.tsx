
import React from 'react';
import { Device, RoomConfig, DeviceType } from '../../types';
import { cn, Button } from '../ui';
import { Lightbulb, Trash2, Plus, Layers } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface FloorPlanProps {
  devices: Device[];
  rooms: RoomConfig[];
  isEditing: boolean;
  onRoomAdd?: () => void;
  onRoomDelete: (id: string) => void;
}

export const FloorPlan: React.FC<FloorPlanProps> = ({ devices, rooms, isEditing, onRoomAdd, onRoomDelete }) => {
  const { t } = useLanguage();
  
  if (rooms.length === 0 && !isEditing) {
      return (
          <div className="w-full aspect-[16/9] min-h-[300px] bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Layers className="w-10 h-10 opacity-50" />
              <p>{t('dashboard.map.empty')}</p>
          </div>
      );
  }

  const getRoomStatus = (roomName: string) => {
    // Case insensitive match
    const roomDevices = devices.filter(d => d.room?.toLowerCase() === roomName.toLowerCase());
    const isLightOn = roomDevices.some(d => d.type === DeviceType.LIGHT && d.state.power);
    const temp = roomDevices.find(d => d.state.temperature !== undefined)?.state.temperature;
    return { isLightOn, temp, deviceCount: roomDevices.length };
  };

  // SVG Path Helper
  const RoomShape = ({ room }: { room: RoomConfig }) => {
    const status = getRoomStatus(room.name);
    
    return (
      <g className="group cursor-pointer transition-all hover:opacity-90">
        <path 
          d={room.path} 
          fill={status.isLightOn ? "rgba(99, 102, 241, 0.2)" : "rgba(30, 41, 59, 0.4)"} 
          stroke={status.isLightOn ? "#818cf8" : "#475569"} 
          strokeWidth="2"
          className={cn("transition-all duration-500 ease-in-out", isEditing && "hover:fill-red-900/30 hover:stroke-red-500")}
        />
        
        {/* Room Label */}
        <text 
            x={room.labelX} 
            y={room.labelY} 
            textAnchor="middle" 
            className={cn(
                "text-[10px] font-bold uppercase tracking-widest pointer-events-none transition-colors",
                status.isLightOn ? "fill-indigo-300" : "fill-slate-500"
            )}
        >
          {room.name}
        </text>
        
        {/* Icons / Indicators */}
        {!isEditing && (
            <g transform={`translate(${room.labelX}, ${room.labelY + 15})`}>
            {status.isLightOn && (
                <Lightbulb size={14} x={-7} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            )}
            {status.temp && (
                <text x={0} y={status.isLightOn ? 20 : 5} textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">
                    {status.temp}°
                </text>
            )}
            </g>
        )}

        {/* Delete Button (Edit Mode) */}
        {isEditing && (
             <foreignObject x={room.labelX - 12} y={room.labelY + 10} width="24" height="24">
                 <button 
                    onClick={(e) => { e.stopPropagation(); onRoomDelete(room.id); }}
                    className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 shadow-lg text-white"
                 >
                     <Trash2 size={12} />
                 </button>
             </foreignObject>
        )}
      </g>
    );
  };

  return (
    <div className={cn("relative w-full aspect-[16/9] min-h-[300px] bg-slate-950/50 rounded-xl border p-4 overflow-hidden transition-colors", isEditing ? "border-indigo-500/50 bg-indigo-950/5" : "border-slate-800")}>
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.2]" />

       <svg viewBox="0 0 800 500" className="w-full h-full drop-shadow-2xl relative z-10">
          {rooms.map(room => (
              <RoomShape key={room.id} room={room} />
          ))}
       </svg>
       
       <div className="absolute bottom-4 left-4 flex gap-2">
          {!isEditing ? (
              <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-md border border-slate-800 text-xs text-slate-400">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> {onRoomAdd ? t('dashboard.map.live') : 'Live'}
              </div>
          ) : (
             <div className="flex items-center gap-1.5 bg-indigo-900/80 backdrop-blur px-2 py-1 rounded-md border border-indigo-500/30 text-xs text-indigo-300 animate-pulse">
                 {t('dashboard.map.editing')}
              </div>
          )}
       </div>

       {isEditing && onRoomAdd && (
           <div className="absolute top-4 right-4">
               <Button size="sm" onClick={onRoomAdd} className="bg-emerald-600 hover:bg-emerald-500">
                   <Plus className="w-4 h-4 mr-1" /> {t('dashboard.map.add')}
               </Button>
           </div>
       )}
    </div>
  );
};
