import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';
import { Check, ChevronDown, BarChart2, TrendingUp, ScatterChart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getTheme } from '../../lib/theme';

interface ChartControlPanelProps {
    chartType: string;
    setChartType: (value: string) => void;
    xColumn: string;
    setXColumn: (value: string) => void;
    yColumn: string;
    setYColumn: (value: string) => void;
    columns: string[];
    isLogScale?: boolean;
    setIsLogScale?: (value: boolean) => void;
    theme: string;
    setTheme: (value: string) => void;
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
    columns,
    isLogScale = false,
    setIsLogScale = () => { },
    theme: currentTheme,
    setTheme,
}: ChartControlPanelProps) {
    const theme = getTheme(2); // Always use Violet theme for Step 2

    return (
        <div className="h-full bg-white border-r border-slate-200 p-6 flex flex-col gap-8 overflow-y-auto">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Graph Settings</h2>
                <p className="text-sm text-slate-500">Customize your visualization.</p>
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
                                    {columns.map(col => (
                                        <Select.Item key={col} value={col} className={cn("relative flex items-center h-9 px-8 rounded-md text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 cursor-pointer outline-none select-none")}>
                                            <Select.ItemText>{col}</Select.ItemText>
                                            <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center text-violet-600">
                                                <Check size={14} />
                                            </Select.ItemIndicator>
                                        </Select.Item>
                                    ))}
                                </Select.Viewport>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                </div>

                {/* Y Axis */}
                <div className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Y Axis (Dependent)</span>
                    <Select.Root value={yColumn} onValueChange={setYColumn}>
                        <Select.Trigger className="w-full inline-flex items-center justify-between rounded-lg px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-700">
                            <Select.Value placeholder="Select Variable..." />
                            <Select.Icon><ChevronDown size={14} className="text-slate-400" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content className="overflow-hidden bg-white rounded-lg shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 z-50">
                                <Select.Viewport className="p-1">
                                    {columns.map(col => (
                                        <Select.Item key={col} value={col} className={cn("relative flex items-center h-9 px-8 rounded-md text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 cursor-pointer outline-none select-none")}>
                                            <Select.ItemText>{col}</Select.ItemText>
                                            <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center text-violet-600">
                                                <Check size={14} />
                                            </Select.ItemIndicator>
                                        </Select.Item>
                                    ))}
                                </Select.Viewport>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Visual Tuning */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visual Tuning</label>

                {/* Toggles */}
                <div className="space-y-3">
                    {/* Log Scale Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Log Scale (Y-Axis)</span>
                        <Switch.Root checked={isLogScale} onCheckedChange={setIsLogScale} className={cn("w-10 h-6 rounded-full relative shadow-sm focus:outline-none transition-colors", isLogScale ? "bg-violet-600" : "bg-slate-200")}>
                            <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[18px]" />
                        </Switch.Root>
                    </div>
                </div>

                {/* Theme Preset */}
                <div className="space-y-1.5">
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
