
import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Info, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';
import { Button, cn } from '../components/ui';
import { Notification } from '../types';

export const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: '1', title: 'High Energy Usage', message: 'Kitchen Thermostat exceeded daily limit.', type: 'warning', timestamp: new Date().toISOString(), read: false },
        { id: '2', title: 'Update Installed', message: 'System updated to v2.0.1 successfully.', type: 'success', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
        { id: '3', title: 'Motion Detected', message: 'Motion detected in Backyard while armed.', type: 'critical', timestamp: new Date(Date.now() - 7200000).toISOString(), read: true },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotif = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'critical': return <AlertOctagon className="w-4 h-4 text-red-500" />;
            case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900" />
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-950/50">
                            <h3 className="font-bold text-sm text-slate-200">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300">Mark all read</button>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">No new notifications</div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className={cn("p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors relative group", !n.read ? "bg-indigo-900/10" : "")}>
                                        <div className="flex gap-3">
                                            <div className="mt-0.5">{getIcon(n.type)}</div>
                                            <div>
                                                <h4 className={cn("text-sm font-medium", !n.read ? "text-white" : "text-slate-400")}>{n.title}</h4>
                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                                                <span className="text-[10px] text-slate-600 mt-2 block">{new Date(n.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => deleteNotif(n.id, e)}
                                            className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
