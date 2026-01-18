import { Trash2, FileOutput } from 'lucide-react';
import type { SavedAnalysis } from '../../types/analysis';

interface AnalysisQueueProps {
    savedAnalyses: SavedAnalysis[];
    onRemoveSaved: (id: string) => void;
    onPrepareReport: () => void;
    isPreparingMD: boolean;
}

export default function AnalysisQueue({
    savedAnalyses,
    onRemoveSaved,
    onPrepareReport,
    isPreparingMD
}: AnalysisQueueProps) {
    if (savedAnalyses.length === 0) return null;

    return (
        <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">저장된 분석 대기열</h3>
                    <span className="bg-emerald-100 text-emerald-600 px-2.5 py-0.5 rounded-full text-xs font-black">
                        {savedAnalyses.length}
                    </span>
                </div>
                <button
                    onClick={onPrepareReport}
                    disabled={isPreparingMD}
                    className="btn-secondary flex items-center"
                >
                    {isPreparingMD ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    ) : (
                        <FileOutput className="w-5 h-5 mr-3" />
                    )}
                    보고서 편집 도구 시작
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedAnalyses.map((item) => (
                    <div key={item.id} className="glass-card group p-5 rounded-2xl hover:border-emerald-200 transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">
                                    {item.experimentName}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    {item.xLabel} vs {item.yLabel}
                                </p>
                            </div>
                            <button
                                onClick={() => onRemoveSaved(item.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-full opacity-30"></div>
                            </div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase">Ready</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
