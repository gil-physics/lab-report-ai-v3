import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';

export default function FloatingProgressIndicator() {
    const { isGeneratingReport, generationProgress } = useAnalysis();

    return (
        <AnimatePresence>
            {isGeneratingReport && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="flex items-center gap-4 px-6 py-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-100 ring-4 ring-blue-50/50"
                    >
                        <div className="relative">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-amber-400 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">AI Report Generation</span>
                            <span className="text-xs text-slate-500 font-medium">{generationProgress}</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
