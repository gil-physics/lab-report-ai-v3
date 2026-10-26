import { useAnalysis } from '../../context/AnalysisContext';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, Trash2, ArrowLeft, ArrowRight, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import ChartControlPanel from './ChartControlPanel';
import LiveChartCanvas from './LiveChartCanvas';
import AnalysisPanel from './AnalysisPanel';
import TemplateSelectorModal from './TemplateSelectorModal';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

export default function VisualBuilder() {
    const {
        units,
        activeUnitId,
        setActiveUnitId,
        activeUnit,
        activeChart,
        enrichedData,
        addChart,
        removeChart,
        updateChart,
        setActiveChartId,
        updateUnit,
        generatedMarkdown,
        isGeneratingReport
    } = useAnalysis();
    const navigate = useNavigate();
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const hasReport = generatedMarkdown.length > 50;

    // Report actions live in the page itself (not a floating bar) so they are visible on every phone browser
    const handleReportClick = () => {
        if (isGeneratingReport || hasReport) navigate('/report');
        else setIsTemplateModalOpen(true);
    };

    const reportButton = (className?: string) => (
        <button
            onClick={handleReportClick}
            className={cn(
                "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all whitespace-nowrap",
                className
            )}
        >
            {isGeneratingReport ? (
                <>
                    <Loader2 size={16} className="animate-spin" />
                    생성 중 · 진행 보기
                </>
            ) : hasReport ? (
                <>
                    보고서 보기
                    <ArrowRight size={16} />
                </>
            ) : (
                <>
                    <Sparkles size={16} />
                    보고서 생성
                    <ArrowRight size={16} />
                </>
            )}
        </button>
    );

    // 🛡️ Refresh Guard: Redirect to upload if data is lost
    useEffect(() => {
        if (units.length === 0) {
            navigate('/upload', { replace: true });
        }
    }, [units.length, navigate]);

    const columns = activeUnit?.columns || [];

    return (
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-slate-50/30">
            {/* Left Control Panel - Unit & Graph Config */}
            <aside className="order-2 lg:order-none w-full lg:w-[320px] xl:w-[420px] h-1/2 lg:h-full flex-shrink-0 bg-white border-t lg:border-t-0 lg:border-r border-slate-200 shadow-sm z-20 flex flex-col overflow-hidden">
                <Tabs.Root
                    value={activeUnitId || ''}
                    onValueChange={setActiveUnitId}
                    className="flex flex-col h-full overflow-hidden"
                >
                    <div className="flex items-center px-6 py-4 bg-white border-b border-slate-200 gap-3 overflow-x-auto scrollbar-hide flex-shrink-0">
                        <Tabs.List className="flex gap-2">
                            {units.map((unit) => (
                                <Tabs.Trigger
                                    key={unit.id}
                                    value={unit.id}
                                    className={cn(
                                        "group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border-2 select-none whitespace-nowrap uppercase tracking-tight",
                                        activeUnitId === unit.id
                                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                            : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                                    )}
                                >
                                    {unit.name}
                                </Tabs.Trigger>
                            ))}
                        </Tabs.List>
                    </div>

                    {activeUnit ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Variable Management (Small section at top) */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unit Variables</h3>
                                {/* Simple variable summary or link to modal if complex */}
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500">
                                        {activeUnit.derivedVariables.length} Derived Variables
                                    </span>
                                </div>
                            </div>

                            {/* Charts List */}
                            <div className="p-4 border-b border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Charts</h3>
                                    <button
                                        onClick={() => addChart(activeUnit.id)}
                                        className="p-1 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {activeUnit.charts.map(chart => (
                                        <div
                                            key={chart.id}
                                            onClick={() => setActiveChartId(activeUnit.id, chart.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-between cursor-pointer group/chart",
                                                activeUnit.activeChartId === chart.id
                                                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                                                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                            )}
                                        >
                                            <span className="truncate pr-2">{chart.name}</span>
                                            <div className="flex items-center space-x-2">
                                                {activeUnit.activeChartId === chart.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeChart(activeUnit.id, chart.id); }}
                                                    className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500 transition-colors lg:opacity-0 lg:group-hover/chart:opacity-100"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Active Chart Config */}
                            {activeChart ? (
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <ChartControlPanel
                                        chartType={activeChart.chartType}
                                        setChartType={(type: string) => updateChart(activeUnit.id, activeChart.id, { chartType: type as any })}
                                        xColumn={activeChart.xColumn}
                                        setXColumn={(col: string) => updateChart(activeUnit.id, activeChart.id, { xColumn: col })}
                                        yColumn={activeChart.yColumn}
                                        setYColumn={(col: string) => updateChart(activeUnit.id, activeChart.id, { yColumn: col })}
                                        xUnit={activeChart.xUnit || ''}
                                        setXUnit={(unit: string) => updateChart(activeUnit.id, activeChart.id, { xUnit: unit })}
                                        yUnit={activeChart.yUnit || ''}
                                        setYUnit={(unit: string) => updateChart(activeUnit.id, activeChart.id, { yUnit: unit })}
                                        columns={columns}
                                        isLogScale={activeChart.isLogScale}
                                        setIsLogScale={(isLog: boolean) => updateChart(activeUnit.id, activeChart.id, { isLogScale: isLog })}
                                        theme={activeChart.theme}
                                        setTheme={(t: string) => updateChart(activeUnit.id, activeChart.id, { theme: t })}
                                        derivedVariables={activeUnit.derivedVariables}
                                        setDerivedVariables={(dvs: any[]) => updateUnit(activeUnit.id, { derivedVariables: dvs })}
                                        xMin={activeChart.xMin}
                                        setXMin={(v: number | '') => updateChart(activeUnit.id, activeChart.id, { xMin: v })}
                                        xMax={activeChart.xMax}
                                        setXMax={(v: number | '') => updateChart(activeUnit.id, activeChart.id, { xMax: v })}
                                        yMin={activeChart.yMin}
                                        setYMin={(v: number | '') => updateChart(activeUnit.id, activeChart.id, { yMin: v })}
                                        yMax={activeChart.yMax}
                                        setYMax={(v: number | '') => updateChart(activeUnit.id, activeChart.id, { yMax: v })}
                                    />
                                </div>
                            ) : (
                                <div className="p-10 text-center">
                                    <p className="text-xs font-bold text-slate-300 uppercase">그래프를 추가해 주십시오</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
                            <Plus className="w-12 h-12 text-slate-200" />
                            <p className="text-sm font-bold text-slate-400">분석할 유닛을 업로드 페이지에서 먼저 추가해 주십시오.</p>
                        </div>
                    )}
                </Tabs.Root>
            </aside>

            {/* Right Content Area - Dynamic Graph & Analysis */}
            <main className="order-1 lg:order-none flex-1 h-1/2 lg:h-full overflow-y-auto flex flex-col bg-slate-50/50 scroll-smooth">
                {activeUnit ? (
                    <div className="flex-1 p-4 sm:p-6 lg:p-10 pb-10 lg:pb-24">
                        <div className="max-w-6xl mx-auto flex flex-col gap-6 lg:gap-10">
                            {/* Heading for Active Unit + step actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{activeUnit.name}</h2>
                                    <p className="text-slate-500 text-sm font-medium">단위 데이터: {activeUnit.data.length}개 포인트 | 컬럼: {activeUnit.columns.length}개</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate('/upload')}
                                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all whitespace-nowrap"
                                    >
                                        <ArrowLeft size={16} />
                                        이전
                                    </button>
                                    {hasReport && !isGeneratingReport && (
                                        <button
                                            onClick={() => setIsTemplateModalOpen(true)}
                                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-violet-600 bg-white border border-violet-200 hover:bg-violet-50 transition-all whitespace-nowrap"
                                        >
                                            <RefreshCw size={16} />
                                            다시 생성
                                        </button>
                                    )}
                                    {reportButton("flex-1 sm:flex-none")}
                                </div>
                            </div>

                            {activeChart && (
                                <>
                                    <section className="w-full flex-shrink-0 h-[340px] sm:h-[450px] lg:h-[540px]">
                                        <LiveChartCanvas
                                            data={enrichedData}
                                            chartType={activeChart.chartType}
                                            xColumn={activeChart.xColumn}
                                            yColumn={activeChart.yColumn}
                                            isLogScale={activeChart.isLogScale}
                                            theme={activeChart.theme}
                                            xMin={activeChart.xMin}
                                            xMax={activeChart.xMax}
                                            yMin={activeChart.yMin}
                                            yMax={activeChart.yMax}
                                        />
                                    </section>

                                    <section className="w-full">
                                        <AnalysisPanel />
                                    </section>

                                    {/* Next step: report generation, right after the analysis results */}
                                    <section className="w-full mb-4 lg:mb-20 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-black text-slate-800">다음 단계: 보고서 생성</h3>
                                            <p className="text-sm text-slate-500 mt-1 break-keep">그래프와 분석 결과를 바탕으로 AI가 실험 보고서 초안을 작성합니다. 보통 20~40초 걸립니다.</p>
                                        </div>
                                        {reportButton("w-full sm:w-auto shrink-0")}
                                    </section>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl mb-4" />
                            <div className="h-4 w-32 bg-slate-100 rounded-full" />
                        </div>
                    </div>
                )}
            </main>

            <TemplateSelectorModal
                isOpen={isTemplateModalOpen}
                onOpenChange={setIsTemplateModalOpen}
            />
        </div>
    );
}

