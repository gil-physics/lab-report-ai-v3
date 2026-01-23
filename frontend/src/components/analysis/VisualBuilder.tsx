import { useState, useEffect } from 'react';
import { useAnalysis } from '../../context/AnalysisContext';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, X } from 'lucide-react';
import ChartControlPanel from './ChartControlPanel';
import LiveChartCanvas from './LiveChartCanvas';
import AnalysisPanel from './AnalysisPanel';
import { cn } from '../../lib/utils';

interface ChartConfig {
    id: string;
    chartType: string;
    xColumn: string;
    yColumn: string;
    isLogScale?: boolean;
    theme?: string;
}

export default function VisualBuilder() {
    const { parsedData } = useAnalysis();

    const [charts, setCharts] = useState<ChartConfig[]>([
        { id: '1', chartType: 'scatter', xColumn: '', yColumn: '', isLogScale: false, theme: 'scientific' }
    ]);
    const [activeChartId, setActiveChartId] = useState('1');

    const activeChart = charts.find(c => c.id === activeChartId) || charts[0];
    const columns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

    useEffect(() => {
        if (columns.length >= 2 && charts.length === 1 && !charts[0].xColumn && !charts[0].yColumn) {
            updateChart(charts[0].id, { xColumn: columns[0], yColumn: columns[1] });
        }
    }, [columns, charts]);

    const addChart = () => {
        const newId = (Math.max(...charts.map(c => parseInt(c.id)), 0) + 1).toString();
        const newChart: ChartConfig = {
            id: newId,
            chartType: 'scatter',
            xColumn: columns[0] || '',
            yColumn: columns[1] || '',
            isLogScale: false,
            theme: 'scientific'
        };
        setCharts([...charts, newChart]);
        setActiveChartId(newId);
    };

    const removeChart = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (charts.length === 1) return;
        const newCharts = charts.filter(c => c.id !== id);
        setCharts(newCharts);
        if (activeChartId === id) {
            setActiveChartId(newCharts[newCharts.length - 1].id);
        }
    };

    const updateChart = (id: string, updates: Partial<ChartConfig>) => {
        setCharts(charts.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-slate-50/30">
            {/* Left Control Panel - Independent Scroll */}
            <aside className="w-full lg:w-[320px] xl:w-[380px] h-1/2 lg:h-full flex-shrink-0 bg-white border-r border-slate-200 shadow-sm z-20 flex flex-col overflow-hidden">
                <Tabs.Root value={activeChartId} onValueChange={setActiveChartId} className="flex flex-col h-full overflow-hidden">
                    <div className="flex items-center px-4 py-3 bg-white border-b border-slate-200 gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
                        <Tabs.List className="flex gap-2">
                            {charts.map(chart => (
                                <Tabs.Trigger
                                    key={chart.id}
                                    value={chart.id}
                                    className={cn(
                                        "group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-transparent select-none whitespace-nowrap",
                                        activeChartId === chart.id
                                            ? "bg-violet-100 text-violet-700 border-violet-200 ring-1 ring-violet-200"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    Graph {chart.id}
                                    {charts.length > 1 && (
                                        <div
                                            onClick={(e) => removeChart(chart.id, e)}
                                            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={10} />
                                        </div>
                                    )}
                                </Tabs.Trigger>
                            ))}
                        </Tabs.List>
                        <button
                            onClick={addChart}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500 border border-transparent hover:border-blue-200 transition-all flex-shrink-0"
                            title="Add new graph"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <ChartControlPanel
                            chartType={activeChart.chartType}
                            setChartType={(v) => updateChart(activeChart.id, { chartType: v })}
                            xColumn={activeChart.xColumn}
                            setXColumn={(v) => updateChart(activeChart.id, { xColumn: v })}
                            yColumn={activeChart.yColumn}
                            setYColumn={(v) => updateChart(activeChart.id, { yColumn: v })}
                            columns={columns}
                            isLogScale={activeChart.isLogScale}
                            setIsLogScale={(v: boolean) => updateChart(activeChart.id, { isLogScale: v })}
                            theme={activeChart.theme || 'scientific'}
                            setTheme={(v) => updateChart(activeChart.id, { theme: v })}
                        />
                    </div>
                </Tabs.Root>
            </aside>

            {/* Right Content Area - Independent Scroll */}
            <main className="flex-1 h-1/2 lg:h-full overflow-y-auto flex flex-col bg-slate-50/50 scroll-smooth">
                <div className="flex-1 p-6 lg:p-10 pb-24">
                    <div className="max-w-6xl mx-auto flex flex-col gap-10">
                        <section className="w-full flex-shrink-0 h-[450px] lg:h-[540px]">
                            <LiveChartCanvas
                                data={parsedData}
                                chartType={activeChart.chartType}
                                xColumn={activeChart.xColumn}
                                yColumn={activeChart.yColumn}
                                isLogScale={activeChart.isLogScale}
                                theme={activeChart.theme || 'scientific'}
                            />
                        </section>

                        <section className="w-full pb-20">
                            <AnalysisPanel
                                data={parsedData}
                                xColumn={activeChart.xColumn}
                                yColumn={activeChart.yColumn}
                            />
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
