import { Calculator, TrendingUp, Info, Loader2 } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import * as Popover from '@radix-ui/react-popover';
// import { cn } from '../../lib/utils'; // Unused
// import { getTheme } from '../../lib/theme'; // Unused



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

            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Equation */}
                <div className="col-span-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                    <div className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Recommended Model Equation</div>
                    <div className="font-mono text-base font-bold text-slate-800 break-all bg-white/50 p-2 rounded border border-blue-100/30">
                        {stats.latex}
                    </div>
                </div>

                {/* R-Squared */}
                <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">R-Squared</div>
                    <div className="text-xl font-bold text-slate-800">{stats.r_squared.toFixed(4)}</div>
                </div>

                {/* AIC or count */}
                <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Fit Accuracy (AIC)</div>
                    <div className="text-xl font-bold text-slate-800">{stats.aic.toFixed(2)}</div>
                </div>
            </div>
        </div>
    );
}
