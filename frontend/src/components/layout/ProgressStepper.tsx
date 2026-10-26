import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getTheme } from '../../lib/theme';

const steps = [
    { id: 1, name: 'Data Insight', path: '/upload' },
    { id: 2, name: 'Visual Builder', path: '/visualize' },
    { id: 3, name: 'Report Editor', path: '/report' },
];

export default function ProgressStepper() {
    const location = useLocation();
    const navigate = useNavigate();

    const getCurrentStep = () => {
        const path = location.pathname;
        if (path.includes('visualize')) return 2;
        if (path.includes('report')) return 3;
        return 1;
    };

    const currentStep = getCurrentStep();

    return (
        <div className="flex items-center space-x-1 md:space-x-2">
            {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const stepTheme = getTheme(step.id);

                return (
                    <div key={step.id} className="flex items-center">
                        {/* Connector Line */}
                        {index > 0 && (
                            <div
                                className={cn(
                                    "w-3 mx-0.5 md:w-8 md:mx-2 h-0.5 rounded-full transition-colors duration-300",
                                    step.id <= currentStep ? "bg-slate-300" : "bg-slate-100"
                                )}
                            />
                        )}

                        {/* Step Bubble */}
                        <div
                            className={cn(
                                "relative flex items-center px-2 md:px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300 cursor-pointer select-none",
                                isActive
                                    ? cn(stepTheme.light, stepTheme.text, "ring-2 ring-offset-2", stepTheme.ring)
                                    : isCompleted
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "text-slate-400 hover:text-slate-600"
                            )}
                            onClick={() => {
                                if (step.id <= currentStep) {
                                    navigate(step.path);
                                }
                            }}
                        >
                            <div className="flex items-center space-x-1 md:space-x-2">
                                <div className={cn(
                                    "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                                    isActive ? cn(stepTheme.primary, "text-white") :
                                        isCompleted ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                )}>
                                    {isCompleted ? <Check size={12} strokeWidth={3} /> : step.id}
                                </div>
                                <span className={cn(!isActive && "hidden md:inline")}>{step.name}</span>
                            </div>

                            {isActive && (
                                <motion.div
                                    layoutId="stepper-glow"
                                    className={cn("absolute inset-0 rounded-full -z-10 opacity-20", stepTheme.primary)}
                                    transition={{ duration: 0.5 }}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
