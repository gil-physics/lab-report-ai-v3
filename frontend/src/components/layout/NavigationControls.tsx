import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAnalysis } from '../../context/AnalysisContext';
import TemplateSelectorModal from '../analysis/TemplateSelectorModal';

export default function NavigationControls() {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        parsedData,
        generatedMarkdown,
        isGeneratingReport,
    } = useAnalysis();
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    const getCurrentStep = () => {
        const path = location.pathname;
        if (path.includes('visualize')) return 2;
        if (path.includes('report')) return 3;
        return 1;
    };

    const currentStep = getCurrentStep();

    const handleNext = () => {
        if (currentStep === 1) navigate('/visualize');
        else if (currentStep === 2) {
            if (isGeneratingReport || generatedMarkdown.length > 50) {
                navigate('/report');
            } else {
                setIsTemplateModalOpen(true);
            }
        }
    };

    const handleBack = () => {
        if (currentStep === 2) navigate('/upload');
        else if (currentStep === 3) navigate('/visualize');
    };

    const canProceed = () => {
        if (currentStep === 1) return parsedData.length > 0;
        // Add logic for step 2 verification later
        return true;
    };

    if (currentStep === 1 && parsedData.length === 0) return null;

    return (
        <>
            {/* Main Navigation Bar (Centered) */}
            <div className="sticky bottom-6 mx-auto w-full max-w-2xl h-16 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between px-8 z-50 transition-all duration-300 no-print">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={cn(
                        "flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all group",
                        currentStep === 1
                            ? "text-slate-200 cursor-not-allowed"
                            : "text-slate-500 hover:text-slate-900"
                    )}
                >
                    <ArrowLeft size={18} className={cn("mr-2 transition-transform", currentStep !== 1 && "group-hover:-translate-x-1")} />
                    {currentStep === 3 ? "Back to Chart" : "Back"}
                </button>

                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                    <span className="text-[10px] text-slate-400/50 font-bold uppercase tracking-[0.2em] hidden sm:block">Lab Report AI</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={currentStep === 3 ? undefined : handleNext}
                        disabled={currentStep === 3 ? false : !canProceed()}
                        className={cn(
                            "flex items-center px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 group relative",
                            currentStep === 3
                                ? "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                : canProceed()
                                    ? "text-blue-600 border-2 border-transparent hover:border-blue-600 hover:bg-blue-50/50 active:scale-95"
                                    : "text-slate-300 cursor-not-allowed"
                        )}
                    >
                        {currentStep === 3 ? (
                            <>
                                <Save size={18} className="mr-2" />
                                Export Report
                            </>
                        ) : (
                            <>
                                <span className={cn(canProceed() ? "text-blue-600" : "text-slate-300")}>
                                    {isGeneratingReport ? 'Generating...' : (currentStep === 2 && generatedMarkdown.length > 50 ? 'View Report' : 'Next Step')}
                                </span>
                                {!isGeneratingReport && <ArrowRight size={18} className={cn("ml-2 transition-transform", canProceed() && "group-hover:translate-x-1", canProceed() ? "text-blue-600" : "text-slate-300")} />}
                            </>
                        )}
                    </button>
                </div>

                <TemplateSelectorModal
                    isOpen={isTemplateModalOpen}
                    onOpenChange={setIsTemplateModalOpen}
                />
            </div>

            {/* Separate Regenerate Button (Bottom Right) */}
            {currentStep === 2 && generatedMarkdown.length > 50 && (
                <div className="fixed bottom-6 right-8 z-50">
                    <button
                        onClick={() => setIsTemplateModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/90 backdrop-blur text-sm font-bold text-violet-600 border border-violet-100 shadow-xl hover:bg-violet-50 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Sparkles size={16} />
                        Regenerate Report
                    </button>
                </div>
            )}
        </>
    );
}
