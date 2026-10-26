import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAnalysis } from '../../context/AnalysisContext';
import { REPORT_STAGES, useReportProgress } from '../../lib/reportProgress';

export default function FloatingProgressIndicator() {
    const { isGeneratingReport, generationStartedAt } = useAnalysis();
    const location = useLocation();
    const { percent, stageIndex } = useReportProgress(generationStartedAt, isGeneratingReport);

    // The report page shows its own full progress card
    const visible = isGeneratingReport && !location.pathname.includes('report');

    return (
        <AnimatePresence>
            {visible && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4 w-max max-w-[calc(100vw-2rem)] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-100 ring-4 ring-blue-50/50"
                    >
                        <div className="relative">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-amber-400 animate-pulse" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-[180px]">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-bold text-slate-800">AI 보고서 생성 중</span>
                                <span className="text-sm font-black text-blue-600 tabular-nums">{percent}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full bg-blue-500 transition-[width] duration-300 ease-out" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{REPORT_STAGES[stageIndex].label} 중...</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
