import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { REPORT_STAGES, useReportProgress } from '../../lib/reportProgress';
import { cn } from '../../lib/utils';

export default function ReportGenerationStatus() {
    const navigate = useNavigate();
    const { isGeneratingReport, generationStartedAt, generationError } = useAnalysis();
    const { percent, stageIndex, elapsedSeconds } = useReportProgress(generationStartedAt, isGeneratingReport);

    if (!isGeneratingReport && generationError) {
        return (
            <div className="flex flex-col items-center text-center py-16 md:py-24 px-2 gap-4 animate-in fade-in duration-300">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                    <AlertTriangle size={28} />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900">보고서를 생성하지 못했습니다</h3>
                    <p className="text-sm text-slate-600 max-w-md break-keep">{generationError}</p>
                </div>
                <button
                    onClick={() => navigate('/visualize')}
                    className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-black text-white text-sm font-bold transition-all active:scale-95"
                >
                    <ArrowLeft size={16} />
                    그래프 단계로 돌아가 다시 시도
                </button>
            </div>
        );
    }

    if (!isGeneratingReport) return null;

    return (
        <div className="flex flex-col items-center py-12 md:py-20 px-1 gap-6 animate-in fade-in duration-500" role="status" aria-live="polite">
            <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-slate-900">AI가 보고서를 작성하고 있습니다</h3>
                <p className="text-sm text-slate-500">{REPORT_STAGES[stageIndex].label} 중...</p>
            </div>

            <div className="w-full max-w-md space-y-2">
                <div className="flex items-end justify-between">
                    <span className="text-xs font-bold text-slate-400">예상 진행률</span>
                    <span className="text-2xl font-black text-emerald-600 tabular-nums">{percent}%</span>
                </div>
                <div
                    className="h-3 w-full rounded-full bg-slate-100 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] duration-300 ease-out"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <p className="text-xs text-slate-400 text-right tabular-nums">
                    {elapsedSeconds}초 경과 · 보통 20~40초 걸립니다
                </p>
            </div>

            <ol className="w-full max-w-md space-y-2">
                {REPORT_STAGES.map((stage, idx) => {
                    const done = idx < stageIndex;
                    const current = idx === stageIndex;
                    return (
                        <li
                            key={stage.label}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors",
                                done && "border-emerald-100 bg-emerald-50/60 text-emerald-700",
                                current && "border-emerald-300 bg-white text-slate-900 shadow-sm",
                                !done && !current && "border-slate-100 bg-white text-slate-300"
                            )}
                        >
                            <span className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                done && "bg-emerald-500 text-white",
                                current && "bg-emerald-100 text-emerald-600",
                                !done && !current && "bg-slate-100 text-slate-300"
                            )}>
                                {done ? <Check size={14} strokeWidth={3} /> : current ? <Loader2 size={14} className="animate-spin" /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                            </span>
                            {stage.label}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
