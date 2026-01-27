import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';
import { Check, ChevronDown, BarChart2, TrendingUp, ScatterChart, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getTheme } from '../../lib/theme';
import type { DerivedVariable } from '../../types/analysis';

interface ChartControlPanelProps {
    chartType: string;
    setChartType: (value: string) => void;
    xColumn: string;
    setXColumn: (value: string) => void;
    yColumn: string;
    setYColumn: (value: string) => void;
    xUnit: string;
    setXUnit: (value: string) => void;
    yUnit: string;
    setYUnit: (value: string) => void;
    columns: string[];
    isLogScale?: boolean;
    setIsLogScale?: (value: boolean) => void;
    theme: string;
    setTheme: (value: string) => void;
    derivedVariables: DerivedVariable[];
    setDerivedVariables: (vars: DerivedVariable[]) => void;
    xMin: number | '';
    setXMin: (value: number | '') => void;
    xMax: number | '';
    setXMax: (value: number | '') => void;
    yMin: number | '';
    setYMin: (value: number | '') => void;
    yMax: number | '';
    setYMax: (value: number | '') => void;
}

const CHART_TYPES = [
    { id: 'scatter', icon: ScatterChart, label: 'Scatter' },
    { id: 'line', icon: TrendingUp, label: 'Line' },
    { id: 'bar', icon: BarChart2, label: 'Bar' },
];

export default function ChartControlPanel({
    chartType,
    setChartType,
    xColumn,
    setXColumn,
    yColumn,
    setYColumn,
    xUnit,
    setXUnit,
    yUnit,
    setYUnit,
    columns,
    isLogScale = false,
    setIsLogScale = () => { },
    theme: currentTheme,
    setTheme,
    derivedVariables,
    setDerivedVariables,
    xMin,
    setXMin,
    xMax,
    setXMax,
    yMin,
    setYMin,
    yMax,
    setYMax
}: ChartControlPanelProps) {
    const theme = getTheme(2); // Always use Violet theme for Step 2

    const addDerivedVariable = () => {
        setDerivedVariables([...derivedVariables, { name: '', formula: '' }]);
    };

    const updateDerivedVariable = (index: number, field: keyof DerivedVariable, value: string) => {
        const newVars = [...derivedVariables];
        newVars[index][field] = value;
        setDerivedVariables(newVars);
    };

    const removeDerivedVariable = (index: number) => {
        setDerivedVariables(derivedVariables.filter((_, i) => i !== index));
    };

    return (
        <div className="h-full bg-white border-r border-slate-200 p-6 flex flex-col gap-8 overflow-y-auto no-scrollbar">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Graph Settings</h2>
                <p className="text-sm text-slate-500">Customize your visualization.</p>
            </div>

            {/* Derived Variables (NEW) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Derived Variables</label>
                    <button
                        onClick={addDerivedVariable}
                        className="text-violet-600 hover:text-violet-700 p-1 rounded-md hover:bg-violet-50 transition-colors"
                        title="Add derived variable"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <div className="space-y-3">
                    {derivedVariables.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No derived variables added.</p>
                    ) : (
                        derivedVariables.map((dv, idx) => (
                            <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 group animate-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center justify-between">
                                    <input
                                        placeholder="Name (e.g. t2)"
                                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 placeholder:text-slate-300 w-full focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all shadow-sm"
                                        value={dv.name}
                                        onChange={(e) => updateDerivedVariable(idx, 'name', e.target.value)}
                                    />
                                    <button
                                        onClick={() => removeDerivedVariable(idx)}
                                        className="text-slate-300 hover:text-red-500 transition-colors ml-2"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-mono">=</span>
                                    <div className="relative w-full">
                                        <input
                                            placeholder="Formula (e.g. t * t)"
                                            className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-mono w-full focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
                                            value={dv.formula}
                                            onChange={(e) => updateDerivedVariable(idx, 'formula', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Tab') {
                                                    const input = e.currentTarget;
                                                    const value = input.value;
                                                    const selectionStart = input.selectionStart || 0;
                                                    const textBeforeCursor = value.substring(0, selectionStart);
                                                    const words = textBeforeCursor.split(/[\s+\-*/()]+/);
                                                    const lastWord = words[words.length - 1];

                                                    if (lastWord.length > 0) {
                                                        const suggestion = columns.find(col => col.toLowerCase().startsWith(lastWord.toLowerCase()));
                                                        if (suggestion) {
                                                            e.preventDefault();
                                                            const newValue = value.substring(0, selectionStart - lastWord.length) + suggestion + value.substring(selectionStart);
                                                            updateDerivedVariable(idx, 'formula', newValue);
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                        <div className="absolute right-2 top-1.5 flex gap-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] bg-slate-200 text-slate-500 px-1 rounded uppercase font-bold">Tab to Autocomplete</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chart Type Selector */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chart Type</label>
                <div className="grid grid-cols-3 gap-2">
                    {CHART_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = chartType === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => setChartType(type.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-200",
                                    isSelected
                                        ? cn("border-transparent ring-2 ring-offset-1", theme.light, theme.text, theme.ring)
                                        : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <Icon size={20} className="mb-1.5" />
                                <span className="text-[10px] font-semibold">{type.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Data Mapping */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data Mapping</label>

                {/* X Axis */}
                <div className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">X Axis (Independent)</span>
                    <Select.Root value={xColumn} onValueChange={setXColumn}>
                        <Select.Trigger className="w-full inline-flex items-center justify-between rounded-lg px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-700">
                            <Select.Value placeholder="Select Variable..." />
                            <Select.Icon><ChevronDown size={14} className="text-slate-400" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content className="overflow-hidden bg-white rounded-lg shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 z-50">
                                <Select.Viewport className="p-1">
                                    {columns.map(col => {
                                        const isDerived = derivedVariables.some(dv => dv.name === col);
                                        return (
                                            <Select.Item key={col} value={col} className={cn("relative flex items-center h-9 px-8 rounded-md text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 cursor-pointer outline-none select-none")}>
                                                <Select.ItemText>
                                                    <div className="flex items-center gap-2">
                                                        <span>{col}</span>
                                                        {isDerived && (
                                                            <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Calculated</span>
                                                        )}
                                                    </div>
                                                </Select.ItemText>
                                                <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center text-violet-600">
                                                    <Check size={14} />
                                                </Select.ItemIndicator>
                                            </Select.Item>
                                        );
                                    })}
                                </Select.Viewport>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                    <input
                        placeholder="Unit (e.g. s, m, kg)"
                        className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all shadow-sm"
                        value={xUnit}
                        onChange={(e) => setXUnit(e.target.value)}
                    />
                </div>

                {/* Y Axis */}
                <div className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Y Axis (Dependent)</span>
                    <Select.Root value={yColumn} onValueChange={setYColumn}>
                        <Select.Trigger className="w-full inline-flex items-center justify-between rounded-lg px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-700 outline-none">
                            <Select.Value placeholder="Select Variable..." />
                            <Select.Icon><ChevronDown size={14} className="text-slate-400" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content className="overflow-hidden bg-white rounded-lg shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 z-50">
                                <Select.Viewport className="p-1">
                                    {columns.map(col => {
                                        const isDerived = derivedVariables.some(dv => dv.name === col);
                                        return (
                                            <Select.Item key={col} value={col} className={cn("relative flex items-center h-9 px-8 rounded-md text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 cursor-pointer outline-none select-none")}>
                                                <Select.ItemText>
                                                    <div className="flex items-center gap-2">
                                                        <span>{col}</span>
                                                        {isDerived && (
                                                            <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Calculated</span>
                                                        )}
                                                    </div>
                                                </Select.ItemText>
                                                <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center text-violet-600">
                                                    <Check size={14} />
                                                </Select.ItemIndicator>
                                            </Select.Item>
                                        );
                                    })}
                                </Select.Viewport>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                    <input
                        placeholder="Unit (e.g. m/s, N, J)"
                        className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all shadow-sm"
                        value={yUnit}
                        onChange={(e) => setYUnit(e.target.value)}
                    />
                </div>

                {/* Log Scale Switch */}
                <div className="pt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Log Scale (Y-Axis)</span>
                        <Switch.Root checked={isLogScale} onCheckedChange={setIsLogScale} className={cn("w-10 h-6 rounded-full relative shadow-sm focus:outline-none transition-colors", isLogScale ? "bg-violet-600" : "bg-slate-200")}>
                            <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[18px]" />
                        </Switch.Root>
                    </div>
                </div>

                {/* Axis Range Settings (NEW) */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Axis Range Settings (Manual)</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">X Min</span>
                            <input
                                type="number"
                                placeholder="Auto"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all shadow-sm"
                                value={xMin}
                                onChange={(e) => setXMin(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">X Max</span>
                            <input
                                type="number"
                                placeholder="Auto"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all shadow-sm"
                                value={xMax}
                                onChange={(e) => setXMax(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Y Min</span>
                            <input
                                type="number"
                                placeholder="Auto"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all shadow-sm"
                                value={yMin}
                                onChange={(e) => setYMin(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Y Max</span>
                            <input
                                type="number"
                                placeholder="Auto"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all shadow-sm"
                                value={yMax}
                                onChange={(e) => setYMax(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Theme Preset */}
                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                    <span className="text-sm font-medium text-slate-700">Theme Preset</span>
                    <Select.Root value={currentTheme} onValueChange={setTheme}>
                        <Select.Trigger className="w-full inline-flex items-center justify-between rounded-lg px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 hover:bg-slate-100 focus:outline-none data-[placeholder]:text-slate-400 outline-none text-slate-700">
                            <Select.Value />
                            <Select.Icon><ChevronDown size={14} className="text-slate-400" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content className="overflow-hidden bg-white rounded-lg shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 z-50">
                                <Select.Viewport className="p-1">
                                    <Select.Item value="scientific" className={cn("relative flex items-center h-9 px-8 rounded-md text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 cursor-pointer outline-none select-none")}>
                                        <Select.ItemText>Scientific (Default)</Select.ItemText>
                                    </Select.Item>
                                    <Select.Item value="modern" className={cn("relative flex items-center h-9 px-8 rounded-md text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 cursor-pointer outline-none select-none")}>
                                        <Select.ItemText>Modern Dark</Select.ItemText>
                                    </Select.Item>
                                    <Select.Item value="pastel" className={cn("relative flex items-center h-9 px-8 rounded-md text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 cursor-pointer outline-none select-none")}>
                                        <Select.ItemText>Pastel</Select.ItemText>
                                    </Select.Item>
                                </Select.Viewport>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                </div>
            </div>
        </div>
    );
}
