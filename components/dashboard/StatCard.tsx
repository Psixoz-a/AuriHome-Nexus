
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui';
import { ArrowUpRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
  trend?: boolean;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, icon: Icon, trend, loading }) => (
  <Card className="relative overflow-hidden group border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
    {loading ? (
        <div className="p-6 space-y-3">
            <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
            <div className="h-8 w-16 bg-slate-800 rounded animate-pulse" />
            <div className="h-3 w-32 bg-slate-800 rounded animate-pulse" />
        </div>
    ) : (
    <>
        <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-1/3 -translate-y-1/3">
        <Icon size={120} />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <Icon className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <p className="text-xs text-slate-500 mt-1 flex items-center">
            {trend && <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500" />}
            <span className={trend ? "text-emerald-500" : ""}>{subtext}</span>
        </p>
        </CardContent>
    </>
    )}
  </Card>
);
