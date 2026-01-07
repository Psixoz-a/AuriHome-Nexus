
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Switch, Input, Select, cn } from '../components/ui';
import { Play, Clock, Trash2, ArrowRight, Zap, Loader2, Plus, GitBranch, AlertCircle, X, Check, Save, Power, Thermometer } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/mockDb';
import { automationService } from '../services/automationService';
import { Scenario, Device, LogicBlock, Condition, Action, DeviceType } from '../types';
import { useToast } from '../contexts/ToastContext';

// --- Logic Builder Components ---

const ConditionCard = ({ condition, onDelete, devices }: { condition: Condition, onDelete: () => void, devices: Device[] }) => {
    const dev = devices.find(d => d.id === condition.deviceId);
    return (
        <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-slate-700 text-sm">
            <span className="text-indigo-400 font-bold px-2">IF</span>
            <div className="bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-800 flex items-center gap-2">
                {dev ? (
                    <>
                        {dev.type === DeviceType.LIGHT && <Zap size={12} className="text-yellow-400"/>}
                        {dev.type === DeviceType.SENSOR && <Thermometer size={12} className="text-blue-400"/>}
                        {dev.name}
                    </>
                ) : 'Unknown Device'}
            </div>
            <span className="text-slate-500 font-mono text-xs uppercase">{condition.operator}</span>
            <div className="bg-slate-900 px-2 py-1 rounded text-emerald-400 border border-slate-800 font-mono">
                {String(condition.value)}
            </div>
            <button onClick={onDelete} className="ml-auto text-slate-500 hover:text-red-400"><X size={14}/></button>
        </div>
    );
};

const ActionCard = ({ action, onDelete, devices }: { action: Action, onDelete: () => void, devices: Device[] }) => {
    const dev = devices.find(d => d.id === action.deviceId);
    return (
        <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-slate-700 text-sm">
             <div className="bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-800">
                {dev?.name || 'Unknown'}
            </div>
            <ArrowRight size={12} className="text-slate-500" />
            <span className="text-emerald-300">
                {JSON.stringify(action.payload).replace(/"/g, '').replace(/,/g, ', ')}
            </span>
            <button onClick={onDelete} className="ml-auto text-slate-500 hover:text-red-400"><X size={14}/></button>
        </div>
    );
};

export const Scenarios = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Partial<Scenario>>({
      name: 'New Logic Flow',
      enabled: true,
      trigger: { type: 'MANUAL' },
      logic: []
  });

  // Temporary State for Adding Items
  const [tempCondition, setTempCondition] = useState<{deviceId: string, operator: string, value: string}>({deviceId: '', operator: 'EQUALS', value: 'true'});
  const [tempAction, setTempAction] = useState<{deviceId: string, key: string, val: string}>({deviceId: '', key: 'power', val: 'true'});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // In production, this fetches from API
    const [sData, dData] = await Promise.all([db.getScenarios(), db.getDevices()]);
    setScenarios(sData); 
    setDevices(dData);
    setLoading(false);
  };

  const handleRun = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setRunningId(id);
      try {
          await automationService.runScenario(id);
          toast('Scenario executed successfully', 'success');
      } catch (err) {
          toast('Execution failed', 'error');
      } finally {
          setTimeout(() => setRunningId(null), 500);
      }
  };

  const handleSave = async () => {
      // Validation
      if (!editingScenario.name) { toast('Name required', 'error'); return; }
      
      try {
          if (editingScenario.id) {
              await db.updateScenario(editingScenario.id, editingScenario);
              toast('Logic updated', 'success');
          } else {
              await db.createScenario(editingScenario as any);
              toast('New logic flow created', 'success');
          }
          setIsEditorOpen(false);
          fetchData();
      } catch (e) {
          toast('Save failed', 'error');
      }
  };

  const addLogicBlock = () => {
      const newBlock: LogicBlock = {
          id: Math.random().toString(36).substr(2, 9),
          conditions: [],
          conditionOperator: 'AND',
          thenActions: [],
          elseActions: []
      };
      setEditingScenario(prev => ({
          ...prev,
          logic: [...(prev.logic || []), newBlock]
      }));
  };

  const addConditionToBlock = (blockIndex: number) => {
      if (!tempCondition.deviceId) return;
      const block = editingScenario.logic![blockIndex];
      const newCond: Condition = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'device_state',
          operator: tempCondition.operator as any,
          deviceId: tempCondition.deviceId,
          value: tempCondition.value === 'true' ? true : tempCondition.value === 'false' ? false : tempCondition.value
      };
      
      const newLogic = [...editingScenario.logic!];
      newLogic[blockIndex] = { ...block, conditions: [...block.conditions, newCond] };
      setEditingScenario({ ...editingScenario, logic: newLogic });
      // Reset
      setTempCondition({...tempCondition, value: 'true'});
  };

  const addActionToBlock = (blockIndex: number, type: 'then' | 'else') => {
       if (!tempAction.deviceId) return;
       const block = editingScenario.logic![blockIndex];
       const payload: any = {};
       
       let val: any = tempAction.val;
       if (val === 'true') val = true;
       else if (val === 'false') val = false;
       else if (!isNaN(Number(val))) val = Number(val);
       
       payload[tempAction.key] = val;

       const newAct: Action = {
           id: Math.random().toString(36).substr(2, 9),
           deviceId: tempAction.deviceId,
           actionType: 'UPDATE_STATE',
           payload
       };

       const newLogic = [...editingScenario.logic!];
       if (type === 'then') {
           newLogic[blockIndex] = { ...block, thenActions: [...block.thenActions, newAct] };
       } else {
           newLogic[blockIndex] = { ...block, elseActions: [...block.elseActions, newAct] };
       }
       setEditingScenario({ ...editingScenario, logic: newLogic });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('scenarios.title')}</h1>
          <p className="text-slate-400">{t('scenarios.subtitle')}</p>
        </div>
        <Button onClick={() => {
            setEditingScenario({ name: 'New Automation', enabled: true, trigger: { type: 'MANUAL' }, logic: [] });
            setIsEditorOpen(true);
        }} className="bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg shadow-indigo-900/20">
             <GitBranch className="w-4 h-4 mr-2" /> {t('scenarios.create')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {scenarios.length === 0 && !loading && (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
                <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-300">{t('scenarios.empty')}</h3>
            </div>
        )}

        {scenarios.map((scenario) => (
            <Card key={scenario.id} className="group border-slate-800 bg-slate-900/40 backdrop-blur hover:border-indigo-500/30 transition-all cursor-pointer" onClick={() => {
                setEditingScenario(scenario);
                setIsEditorOpen(true);
            }}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className={cn("p-3 rounded-xl", scenario.enabled ? "bg-indigo-600/20 text-indigo-400" : "bg-slate-800 text-slate-500")}>
                        <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                        {scenario.trigger?.type === 'MANUAL' && (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className={cn("h-8 border-slate-700 hover:bg-emerald-900/20 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors", runningId === scenario.id && "bg-emerald-500 text-white")}
                                onClick={(e) => handleRun(e, scenario.id)}
                            >
                                {runningId === scenario.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            </Button>
                        )}
                        <div className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
                            {scenario.trigger?.type || 'MANUAL'}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="font-bold text-lg text-white mb-1">{scenario.name}</h3>
                    <p className="text-xs text-slate-500">{(scenario.logic || []).length} logic blocks</p>
                    <div className="mt-4 flex gap-2">
                         <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                             <div className="h-full bg-indigo-500 w-3/4" />
                         </div>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      {/* --- Logic Editor Modal --- */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-10">
            {/* Header */}
            <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setIsEditorOpen(false)}>
                        <X className="text-slate-400" />
                    </Button>
                    <div className="flex flex-col">
                        <input 
                            className="bg-transparent text-white font-bold text-lg focus:outline-none placeholder:text-slate-600"
                            value={editingScenario.name}
                            onChange={e => setEditingScenario({...editingScenario, name: e.target.value})}
                            placeholder="Scenario Name"
                        />
                        <span className="text-xs text-slate-500 flex items-center gap-2">
                            ID: {editingScenario.id || 'NEW'} 
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            {editingScenario.enabled ? 'Active' : 'Disabled'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Select 
                        value={editingScenario.trigger?.type || 'MANUAL'}
                        onChange={(v) => setEditingScenario({...editingScenario, trigger: { ...editingScenario.trigger, type: v as any }})}
                        options={[
                            { label: 'Manual Run (Button)', value: 'MANUAL' },
                            { label: 'Device Event (Auto)', value: 'EVENT' }
                        ]}
                        className="w-40"
                    />
                    <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500">
                        <Save className="w-4 h-4 mr-2" /> {t('app.save')}
                    </Button>
                </div>
            </header>

            {/* Canvas */}
            <main className="flex-1 overflow-y-auto p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-950">
                <div className="max-w-4xl mx-auto space-y-8">
                    
                    {/* Trigger Node */}
                    <div className="flex justify-center">
                        <div className="bg-slate-900 border border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)] rounded-2xl p-6 w-full max-w-md text-center relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                                START
                            </div>
                            <h3 className="text-indigo-300 font-bold text-lg mb-2">{t('logic.trigger')}</h3>
                            <p className="text-slate-400 text-sm">
                                {editingScenario.trigger?.type === 'SCHEDULE' ? 'Runs on a specific time/schedule' : 
                                 editingScenario.trigger?.type === 'EVENT' ? 'Runs when a device changes state' : 
                                 'Runs manually via button tap'}
                            </p>
                            <div className="absolute -bottom-8 left-1/2 w-0.5 h-8 bg-slate-700" />
                        </div>
                    </div>

                    {/* Logic Blocks */}
                    {editingScenario.logic?.map((block, idx) => (
                        <div key={idx} className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                             {/* Connector Line */}
                             {idx > 0 && <div className="absolute -top-8 left-1/2 w-0.5 h-8 bg-slate-700" />}

                             <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                                 {/* Condition Header */}
                                 <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                         <GitBranch className="text-orange-400 w-5 h-5" />
                                         <span className="font-bold text-slate-200">{t('logic.condition')}</span>
                                     </div>
                                     <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-950/50" onClick={() => {
                                         const newLogic = [...editingScenario.logic!];
                                         newLogic.splice(idx, 1);
                                         setEditingScenario({...editingScenario, logic: newLogic});
                                     }}>
                                         <Trash2 size={16} />
                                     </Button>
                                 </div>
                                 
                                 <div className="p-6 grid md:grid-cols-2 gap-8">
                                     {/* IF Section */}
                                     <div className="space-y-4 border-r border-slate-800 pr-8">
                                         <div className="space-y-2">
                                             {block.conditions.map((cond, cIdx) => (
                                                 <ConditionCard key={cIdx} condition={cond} devices={devices} onDelete={() => {
                                                     const newLogic = [...editingScenario.logic!];
                                                     newLogic[idx].conditions.splice(cIdx, 1);
                                                     setEditingScenario({...editingScenario, logic: newLogic});
                                                 }}/>
                                             ))}
                                         </div>
                                         
                                         {/* Add Condition Form */}
                                         <div className="bg-slate-950/50 p-3 rounded border border-slate-800 space-y-2">
                                             <div className="flex gap-2">
                                                 <Select 
                                                    className="flex-1" 
                                                    value={tempCondition.deviceId} 
                                                    onChange={(v) => setTempCondition({...tempCondition, deviceId: v})}
                                                    options={[{label: 'Select Device...', value: ''}, ...devices.map(d => ({label: d.name, value: d.id}))]}
                                                 />
                                                 <Select 
                                                    className="w-24" 
                                                    value={tempCondition.operator} 
                                                    onChange={(v) => setTempCondition({...tempCondition, operator: v})}
                                                    options={[{label: '=', value: 'EQUALS'}, {label: '>', value: 'GREATER'}, {label: '<', value: 'LESS'}]}
                                                 />
                                             </div>
                                             <Input 
                                                value={tempCondition.value}
                                                onChange={(e) => setTempCondition({...tempCondition, value: e.target.value})}
                                                placeholder="Value (e.g. true, 22)"
                                                className="h-8 text-xs font-mono"
                                             />
                                             <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-400" onClick={() => addConditionToBlock(idx)}>
                                                 {t('logic.add_condition')}
                                             </Button>
                                         </div>
                                     </div>

                                     {/* THEN/ELSE Section */}
                                     <div className="space-y-6">
                                         {/* THEN */}
                                         <div>
                                             <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                 <Check size={12} /> {t('logic.then')}
                                             </h4>
                                             <div className="space-y-2 mb-3">
                                                 {block.thenActions.map((act, aIdx) => (
                                                     <ActionCard key={aIdx} action={act} devices={devices} onDelete={() => {
                                                        const newLogic = [...editingScenario.logic!];
                                                        newLogic[idx].thenActions.splice(aIdx, 1);
                                                        setEditingScenario({...editingScenario, logic: newLogic});
                                                     }} />
                                                 ))}
                                             </div>
                                             {/* Add Action Mini Form */}
                                             <div className="flex gap-2 items-center">
                                                 <Select className="flex-1 h-8 text-xs" value={tempAction.deviceId} onChange={(v) => setTempAction({...tempAction, deviceId: v})} options={devices.map(d => ({label: d.name, value: d.id}))} />
                                                 <Select className="w-20 h-8 text-xs" value={tempAction.val} onChange={(v) => setTempAction({...tempAction, val: v})} options={[{label: 'ON', value: 'true'}, {label: 'OFF', value: 'false'}]} />
                                                 <Button size="icon" variant="ghost" className="h-8 w-8 bg-emerald-500/10 text-emerald-500" onClick={() => addActionToBlock(idx, 'then')}><Plus size={14}/></Button>
                                             </div>
                                         </div>

                                         {/* ELSE */}
                                         <div>
                                             <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                 <X size={12} /> {t('logic.else')}
                                             </h4>
                                              <div className="space-y-2 mb-3">
                                                 {block.elseActions.map((act, aIdx) => (
                                                     <ActionCard key={aIdx} action={act} devices={devices} onDelete={() => {
                                                        const newLogic = [...editingScenario.logic!];
                                                        newLogic[idx].elseActions.splice(aIdx, 1);
                                                        setEditingScenario({...editingScenario, logic: newLogic});
                                                     }} />
                                                 ))}
                                             </div>
                                              {/* Reuse Add Action Mini Form Logic */}
                                             <div className="flex gap-2 items-center">
                                                 <Select className="flex-1 h-8 text-xs" value={tempAction.deviceId} onChange={(v) => setTempAction({...tempAction, deviceId: v})} options={devices.map(d => ({label: d.name, value: d.id}))} />
                                                 <Select className="w-20 h-8 text-xs" value={tempAction.val} onChange={(v) => setTempAction({...tempAction, val: v})} options={[{label: 'ON', value: 'true'}, {label: 'OFF', value: 'false'}]} />
                                                 <Button size="icon" variant="ghost" className="h-8 w-8 bg-red-500/10 text-red-500" onClick={() => addActionToBlock(idx, 'else')}><Plus size={14}/></Button>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    ))}

                    {/* Add Logic Block Button */}
                    <div className="flex justify-center pb-20">
                        <Button onClick={addLogicBlock} variant="outline" className="border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-500">
                            <Plus className="mr-2 h-4 w-4" /> Add Logic Block
                        </Button>
                    </div>

                </div>
            </main>
        </div>
      )}
    </div>
  );
};
