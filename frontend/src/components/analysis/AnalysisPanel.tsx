import { Calculator, TrendingUp, Info, Loader2 } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import * as Popover from '@radix-ui/react-popover';
import katex from 'katex';
import 'katex/dist/katex.min.css';



export default function AnalysisPanel() {
    const { activeUnit, isAnalyzing } = useAnalysis();
    const stats = activeUnit?.backendAnalysis?.best_model;

    if (isAnalyzing) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed animate-pulse">
                <Loader2 size={32} className="mb-2 opacity-50 animate-spin text-blue-500" />
                <p className="text-sm font-bold">Python 분석 엔진 가동 중...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                <Calculator size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Select valid X and Y columns to see analysis</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-500" />
                    Python 기반 정밀 분석 결과 ({stats.name})
                </h3>
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <button className="text-slate-400 hover:text-violet-500 transition-colors">
                            <Info size={14} />
                        </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content className="w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl z-50 leading-relaxed" sideOffset={5}>
                            Parameters estimated using Ordinary Least Squares (OLS) method.
                            <Popover.Arrow className="fill-slate-800" />
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
            </div>

            <div className="p-5 flex flex-col gap-6">
                {/* Equation Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Model Equation</div>
                    <div
                        className="text-lg font-serif text-slate-800"
                        dangerouslySetInnerHTML={{
                            __html: katex.renderToString(stats.latex, { throwOnError: false, displayMode: true })
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Parameters List */}
                    <div className="md:col-span-2 lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Calculator size={12} className="text-blue-500" />
                            Estimated Parameters
                        </div>
                        <div className="space-y-2">
                            {stats.params.map((val: number, i: number) => {
                                const names = ['a', 'b', 'c', 'd', 'e'];
                                const name = names[i] || `p${i}`;
                                const error = stats.standard_errors?.[i];
                                return (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 border border-slate-100/50">
                                        <span className="font-serif italic text-slate-600 pr-4">{name}</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-mono font-bold text-slate-800">{val.toPrecision(6)}</span>
                                            {error !== undefined && (
                                                <span className="text-[10px] text-slate-400 font-medium">± {error.toPrecision(3)}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col gap-4">
                        <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col justify-center">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">R-Squared (R²)</div>
                            <div className="text-2xl font-black text-emerald-600">{(stats.r_squared * 100).toFixed(2)}%</div>
                            <div className="text-[10px] text-slate-400 mt-1">Correlation Strength</div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col justify-center">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AIC Score</div>
                            <div className="text-2xl font-black text-slate-800">{stats.aic.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400 mt-1">Lower is better</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
