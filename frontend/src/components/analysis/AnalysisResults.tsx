import { Plus } from 'lucide-react';
import type { AnalysisResult, SavedAnalysis } from '../../types/analysis';
import { RegressionGraph, ResidualPlot } from '../Graphs';
import AnalysisQueue from './AnalysisQueue';

interface AnalysisResultsProps {
    results: AnalysisResult | null;
    xData: number[];
    yData: number[];
    xColumn: string;
    yColumn: string;
    xMin: number | '';
    xMax: number | '';
    yMin: number | '';
    yMax: number | '';
    useCustomRange: boolean;
    setXMin: (val: number | '') => void;
    setXMax: (val: number | '') => void;
    setYMin: (val: number | '') => void;
    setYMax: (val: number | '') => void;
    setUseCustomRange: (val: boolean) => void;
    onAddToReport: () => void;
    savedAnalyses: SavedAnalysis[];
    onRemoveSaved: (id: string) => void;
    onPrepareReport: () => void;
    isPreparingMD: boolean;
}

export default function AnalysisResults({
    results,
    xData,
    yData,
    xColumn,
    yColumn,
    xMin, xMax, yMin, yMax, useCustomRange,
    setXMin, setXMax, setYMin, setYMax, setUseCustomRange,
    onAddToReport,
    savedAnalyses,
    onRemoveSaved,
    onPrepareReport,
    isPreparingMD
}: AnalysisResultsProps) {
    if (!results) {
        return (
            <AnalysisQueue
                savedAnalyses={savedAnalyses}
                onRemoveSaved={onRemoveSaved}
                onPrepareReport={onPrepareReport}
                isPreparingMD={isPreparingMD}
            />
        );
    }

    const { best_model, residuals } = results;

    return (
        <div className="space-y-10">
            {/* Header with Save Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">분석 결과</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                        최적 모델: <span className="text-blue-600">{best_model.name}</span>
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onAddToReport}
                        className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-50 transition-all flex items-center shadow-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        대기열에 추가
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Graphs Column */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="glass-card p-8 rounded-3xl">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                            Regression Analysis
                        </h3>
                        <RegressionGraph
                            xData={xData}
                            yData={yData}
                            xLabel={xColumn}
                            yLabel={yColumn}
                            xRange={useCustomRange ? [xMin === '' ? undefined : xMin, xMax === '' ? undefined : xMax] : undefined}
                            yRange={useCustomRange ? [yMin === '' ? undefined : yMin, yMax === '' ? undefined : yMax] : undefined}
                            slope={best_model.params[0]}
                            intercept={best_model.params[1]}
                            yPredicted={best_model.y_predicted}
                        />
                    </div>
                </div>

                {/* Info Column */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Stats Card */}
                    <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                            <FileText className="w-24 h-24" />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Statistic Summary</h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">R² Score</p>
                                <p className="text-3xl font-black text-blue-600 tracking-tight">
                                    {best_model.r_squared.toFixed(4)}
                                </p>
                            </div>
                            <div className="h-px bg-slate-100"></div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Slope</p>
                                    <p className="text-lg font-bold text-slate-800">{best_model.params[0]?.toExponential(4) ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Intercept</p>
                                    <p className="text-lg font-bold text-slate-800">{best_model.params[1]?.toExponential(4) ?? 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls Card */}
                    <div className="glass-card p-8 rounded-3xl">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Graph Controls</h3>
                        <div className="space-y-6">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={useCustomRange}
                                    onChange={(e) => setUseCustomRange(e.target.checked)}
                                />
                                <div className={`w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center transition-all ${useCustomRange ? 'bg-blue-600 border-blue-600' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {useCustomRange && <Plus className="w-3 h-3 text-white rotate-45" />}
                                </div>
                                <span className="text-sm font-bold text-slate-600">범위 직접 설정</span>
                            </label>

                            {useCustomRange && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">X-Axis</p>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            className="premium-input text-xs py-2 w-full"
                                            value={xMin}
                                            onChange={(e) => setXMin(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            className="premium-input text-xs py-2 w-full"
                                            value={xMax}
                                            onChange={(e) => setXMax(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Y-Axis</p>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            className="premium-input text-xs py-2 w-full"
                                            value={yMin}
                                            onChange={(e) => setYMin(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            className="premium-input text-xs py-2 w-full"
                                            value={yMax}
                                            onChange={(e) => setYMax(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Residuals Section */}
            <div className="glass-card p-8 rounded-3xl">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-3 animate-pulse"></div>
                    Residual Plot
                </h3>
                <div className="h-[350px]">
                    <ResidualPlot
                        xData={xData}
                        residuals={residuals}
                        xLabel={xColumn}
                    />
                </div>
            </div>

            {/* Analysis History Queue */}
            <AnalysisQueue
                savedAnalyses={savedAnalyses}
                onRemoveSaved={onRemoveSaved}
                onPrepareReport={onPrepareReport}
                isPreparingMD={isPreparingMD}
            />
        </div>
    );
}

// Minimal placeholder for Lucide-react if needed in this context
function FileText({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
    );
}
