import React, { createContext, useContext, useState, type ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { AnalysisResult, SavedAnalysis, AnalysisUnit, AnalysisChart, BackendAnalysis } from '../types/analysis';
import { calculateRegression, type RegressionStats } from '../lib/analysisUtils';
import { suggestColumns } from '../lib/physicsKeywords';
import { v4 as uuidv4 } from 'uuid';

type Step = 'upload' | 'analysis' | 'report';

interface AnalysisContextType {
    activeStep: Step;
    setActiveStep: (step: Step) => void;
    file: File | null;
    setFile: (file: File | null) => void;

    // 🏗️ Multi-Unit Management
    units: AnalysisUnit[];
    setUnits: (units: AnalysisUnit[]) => void;
    addUnit: (unit: Omit<AnalysisUnit, 'id'>) => void;
    removeUnit: (id: string) => void;
    updateUnit: (id: string, updates: Partial<AnalysisUnit>) => void;
    activeUnitId: string | null;
    setActiveUnitId: (id: string | null) => void;

    // 📈 Chart Management (Scoped to active unit)
    addChart: (unitId: string, name?: string) => void;
    removeChart: (unitId: string, chartId: string) => void;
    updateChart: (unitId: string, chartId: string, updates: Partial<AnalysisChart>) => void;
    setActiveChartId: (unitId: string, chartId: string | null) => void;

    // 📊 Workspace Data (Raw & Live Scrubbing)
    rawRows: any[][];
    setRawRows: (rows: any[][]) => void;

    // 🧬 Computed/Active Data (for the currently selected unit & chart)
    activeUnit: AnalysisUnit | null;
    activeChart: AnalysisChart | null;
    enrichedData: any[];
    analysisStats: RegressionStats | null;

    // Report/Persistence
    analysisResult: AnalysisResult | null;
    setAnalysisResult: (result: AnalysisResult | null) => void;
    savedAnalyses: SavedAnalysis[];
    setSavedAnalyses: (analyses: SavedAnalysis[]) => void;
    generatedMarkdown: string;
    setGeneratedMarkdown: (markdown: string) => void;
    isGeneratingReport: boolean;
    setIsGeneratingReport: (isGenerating: boolean) => void;
    generationProgress: string;
    setGenerationProgress: (progress: string) => void;
    plotUrl: string;
    setPlotUrl: (url: string) => void;
    isAnalyzing: boolean;
    resetAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeStep, setActiveStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [rawRows, setRawRows] = useState<any[][]>([]);

    // Units state
    const [units, setUnits] = useState<AnalysisUnit[]>([]);
    const [activeUnitId, setActiveUnitId] = useState<string | null>(null);

    // Results
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
    const [generatedMarkdown, setGeneratedMarkdown] = useState<string>('');
    const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
    const [generationProgress, setGenerationProgress] = useState<string>('');
    const [plotUrl, setPlotUrl] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

    const activeUnit = useMemo(() =>
        units.find(u => u.id === activeUnitId) || null
        , [units, activeUnitId]);

    const addUnit = useCallback((unitBase: Omit<AnalysisUnit, 'id'>) => {
        const newUnit = { ...unitBase, id: uuidv4() };
        setUnits(prev => [...prev, newUnit]);
        if (!activeUnitId) setActiveUnitId(newUnit.id);
    }, [activeUnitId]);

    const removeUnit = useCallback((id: string) => {
        setUnits(prev => prev.filter(u => u.id !== id));
        if (activeUnitId === id) setActiveUnitId(null);
    }, [activeUnitId]);

    const updateUnit = useCallback((id: string, updates: Partial<AnalysisUnit>) => {
        setUnits(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    }, []);

    // 📉 Chart Management
    const addChart = useCallback((unitId: string, name?: string) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        const { x, y } = suggestColumns(unit.columns);
        const chartNum = unit.charts.length + 1;
        const newChart: AnalysisChart = {
            id: uuidv4(),
            name: name || `G${chartNum}: ${y} vs ${x}`,
            xColumn: x,
            yColumn: y,
            chartType: 'scatter',
            theme: 'scientific',
            isLogScale: false,
            xMin: '',
            xMax: '',
            yMin: '',
            yMax: ''
        };

        updateUnit(unitId, {
            charts: [...unit.charts, newChart],
            activeChartId: newChart.id
        });
    }, [units, updateUnit]);

    const removeChart = useCallback((unitId: string, chartId: string) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        const newCharts = unit.charts.filter(c => c.id !== chartId);
        updateUnit(unitId, {
            charts: newCharts,
            activeChartId: unit.activeChartId === chartId ? (newCharts.length > 0 ? newCharts[0].id : null) : unit.activeChartId
        });
    }, [units, updateUnit]);

    const updateChart = useCallback((unitId: string, chartId: string, updates: Partial<AnalysisChart>) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        updateUnit(unitId, {
            charts: unit.charts.map(c => {
                if (c.id !== chartId) return c;
                const newChart = { ...c, ...updates };

                // Dynamic Naming: If X or Y changed and the name matches the "G#: Y vs X" pattern, update it
                const namePattern = /^G\d+: .* vs .*$/;
                if ((updates.xColumn || updates.yColumn) && namePattern.test(c.name)) {
                    const match = c.name.match(/^(G\d+):/);
                    if (match) {
                        newChart.name = `${match[1]}: ${newChart.yColumn} vs ${newChart.xColumn}`;
                    }
                }
                return newChart;
            })
        });
    }, [units, updateUnit]);

    const setActiveChartId = useCallback((unitId: string, chartId: string | null) => {
        updateUnit(unitId, { activeChartId: chartId });
    }, [updateUnit]);

    const activeChart = useMemo(() =>
        activeUnit?.charts.find(c => c.id === activeUnit.activeChartId) || null
        , [activeUnit]);

    // 🧬 Calculate Enriched Data with Derived Variables (for the active unit)
    const enrichedData = useMemo(() => {
        if (!activeUnit) return [];
        const baseData = activeUnit.data;
        const dvs = activeUnit.derivedVariables;
        if (dvs.length === 0) return baseData;

        return baseData.map(row => {
            const newRow = { ...row };
            dvs.forEach(dv => {
                if (!dv.name || !dv.formula) return;
                try {
                    const keys = Object.keys(row);
                    const values = keys.map(k => row[k]);
                    const fn = new Function(...keys, `return ${dv.formula}`);
                    const result = fn(...values);
                    newRow[dv.name] = isNaN(result) ? null : result;
                } catch (e) {
                    newRow[dv.name] = null;
                }
            });
            return newRow;
        });
    }, [activeUnit]);

    // 📈 Analysis Stats
    const analysisStats = useMemo(() => {
        if (enrichedData.length > 0 && activeChart?.xColumn && activeChart?.yColumn) {
            return calculateRegression(enrichedData, activeChart.xColumn, activeChart.yColumn);
        }
        return null;
    }, [enrichedData, activeChart?.xColumn, activeChart?.yColumn]);

    // Auto-create first chart when a unit is selected if it has none
    useEffect(() => {
        if (activeUnit && activeUnit.charts.length === 0 && activeUnit.columns.length >= 2) {
            addChart(activeUnit.id);
        }
    }, [activeUnitId, activeUnit?.charts.length]);

    // 🚀 Backend Analysis Sync (Source of Truth)
    useEffect(() => {
        if (!activeUnit || !activeChart || enrichedData.length < 2) return;

        // Skip if we already have it (basic cache to avoid infinite loops, though data/chart should be different)
        // Actually, we want to re-fetch if x/y changed or data changed.

        const timer = setTimeout(async () => {
            setIsAnalyzing(true);
            try {
                const xData = enrichedData.map(d => d[activeChart.xColumn]);
                const yData = enrichedData.map(d => d[activeChart.yColumn]);

                const response = await fetch('http://localhost:8000/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: { x: xData, y: yData },
                        options: {
                            remove_outliers: false,
                            x_range: [activeChart.xMin, activeChart.xMax],
                            y_range: [activeChart.yMin, activeChart.yMax]
                        }
                    })
                });

                if (response.ok) {
                    const result: BackendAnalysis = await response.json();
                    updateUnit(activeUnit.id, { backendAnalysis: result });
                }
            } catch (error) {
                console.error("Backend analysis failed:", error);
            } finally {
                setIsAnalyzing(false);
            }
        }, 500); // Debounce to avoid spamming the backend

        return () => clearTimeout(timer);
    }, [activeUnitId, activeChart?.xColumn, activeChart?.yColumn, activeChart?.xMin, activeChart?.xMax, activeChart?.yMin, activeChart?.yMax, enrichedData.length]);

    const resetAnalysis = () => {
        setFile(null);
        setRawRows([]);
        setUnits([]);
        setActiveUnitId(null);
        setAnalysisResult(null);
        setSavedAnalyses([]);
        setGeneratedMarkdown('');
        setIsGeneratingReport(false);
        setActiveStep('upload');
    };

    return (
        <AnalysisContext.Provider
            value={{
                activeStep, setActiveStep,
                file, setFile,
                units, setUnits, addUnit, removeUnit, updateUnit,
                activeUnitId, setActiveUnitId,
                addChart, removeChart, updateChart, setActiveChartId,
                rawRows, setRawRows,
                activeUnit,
                activeChart,
                enrichedData,
                analysisStats,
                analysisResult, setAnalysisResult,
                savedAnalyses, setSavedAnalyses,
                generatedMarkdown, setGeneratedMarkdown,
                isGeneratingReport, setIsGeneratingReport,
                generationProgress, setGenerationProgress,
                plotUrl, setPlotUrl,
                isAnalyzing,
                resetAnalysis
            }}
        >
            {children}
        </AnalysisContext.Provider>
    );
};

export const useAnalysis = () => {
    const context = useContext(AnalysisContext);
    if (!context) throw new Error('useAnalysis must be used within an AnalysisProvider');
    return context;
};

