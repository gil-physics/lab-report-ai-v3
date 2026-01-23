import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { AnalysisResult, SavedAnalysis } from '../types/analysis';
import { calculateRegression, type RegressionStats } from '../lib/analysisUtils';

type Step = 'upload' | 'analysis' | 'report';

interface AnalysisContextType {
    activeStep: Step;
    setActiveStep: (step: Step) => void;
    file: File | null;
    setFile: (file: File | null) => void;
    parsedData: any[];
    setParsedData: (data: any[]) => void;
    analysisResult: AnalysisResult | null;
    analysisStats: RegressionStats | null;
    plotUrl: string | null;
    setAnalysisResult: (result: AnalysisResult | null) => void;
    setPlotUrl: (url: string | null) => void;
    savedAnalyses: SavedAnalysis[];
    setSavedAnalyses: (analyses: SavedAnalysis[]) => void;
    generatedMarkdown: string;
    setGeneratedMarkdown: (markdown: string) => void;
    isGeneratingReport: boolean;
    setIsGeneratingReport: (isGenerating: boolean) => void;
    generationProgress: string;
    setGenerationProgress: (progress: string) => void;
    resetAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeStep, setActiveStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [analysisStats, setAnalysisStats] = useState<RegressionStats | null>(null);
    const [plotUrl, setPlotUrl] = useState<string | null>(null);
    const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
    const [generatedMarkdown, setGeneratedMarkdown] = useState<string>('');
    const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
    const [generationProgress, setGenerationProgress] = useState<string>('');

    // Calculate stats whenever parsedData changes
    useEffect(() => {
        if (parsedData.length > 0) {
            const keys = Object.keys(parsedData[0]);
            if (keys.length >= 2) {
                const stats = calculateRegression(parsedData, keys[0], keys[1]);
                setAnalysisStats(stats);
            }
        } else {
            setAnalysisStats(null);
        }
    }, [parsedData]);

    const resetAnalysis = () => {
        setFile(null);
        setParsedData([]);
        setAnalysisResult(null);
        setAnalysisStats(null);
        setPlotUrl(null);
        setSavedAnalyses([]);
        setGeneratedMarkdown('');
        setIsGeneratingReport(false);
        setGenerationProgress('');
        setActiveStep('upload');
    };

    return (
        <AnalysisContext.Provider
            value={{
                activeStep,
                setActiveStep,
                file,
                setFile,
                parsedData,
                setParsedData,
                analysisResult,
                analysisStats,
                plotUrl,
                setAnalysisResult,
                setPlotUrl,
                savedAnalyses,
                setSavedAnalyses,
                generatedMarkdown,
                setGeneratedMarkdown,
                isGeneratingReport,
                setIsGeneratingReport,
                generationProgress,
                setGenerationProgress,
                resetAnalysis,
            }}
        >
            {children}
        </AnalysisContext.Provider>
    );
};

export const useAnalysis = () => {
    const context = useContext(AnalysisContext);
    if (!context) {
        throw new Error('useAnalysis must be used within an AnalysisProvider');
    }
    return context;
};

