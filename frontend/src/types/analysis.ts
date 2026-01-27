export interface AnalysisResult {
    status: string;
    best_model: {
        name: string;
        model_key: string;
        r_squared: number;
        adj_r_squared: number;
        aic: number;
        equation: string;
        latex: string;
        params: number[];
        standard_errors: number[]; // Corrected to 'params' and 'standard_errors' to match backend
        y_predicted?: number[];
    };
    residuals: number[];
    data_info: {
        original_count: number;
        used_count: number;
        outliers_removed: number;
    };
    recommended_formulas: any[];
    alternative_models?: any[];
}

export interface DerivedVariable {
    name: string;
    formula: string;
}

export interface SavedAnalysis {
    id: string;
    experimentName: string;
    results: AnalysisResult;
    xData: number[];
    yData: number[];
    xLabel: string;
    yLabel: string;
    xMin: number | '';
    xMax: number | '';
    yMax: number | '';
    useCustomRange: boolean;
}

export interface AnalysisChart {
    id: string;
    name: string;
    xColumn: string;
    yColumn: string;
    chartType: 'scatter' | 'line' | 'bar';
    theme: string;
    isLogScale: boolean;
    xMin: number | '';
    xMax: number | '';
    yMin: number | '';
    yMax: number | '';
    xUnit?: string;
    yUnit?: string;
}

export interface AnalysisUnit {
    id: string;
    name: string;
    fileId: string;
    headerRow: number;
    dataStart: number;
    dataEnd: number;
    columnRange: [number, number];
    excludedColumns: string[];
    // Computed cached data
    columns: string[];
    data: any[];
    // Hierarchical children
    charts: AnalysisChart[];
    derivedVariables: DerivedVariable[];
    activeChartId: string | null;
    backendAnalysis?: BackendAnalysis | null;
    rawStrings?: Record<string, string[]>; // Store raw string representations for sig-fig counting
}

export interface BackendAnalysis {
    status: string;
    best_model: {
        name: string;
        model_key: string;
        r_squared: number;
        adj_r_squared: number;
        aic: number;
        params: number[];
        standard_errors: number[];
        equation: string;
        latex: string;
        trendline: { x: number; y: number }[];
    };
    residuals: number[];
    recommended_formulas: any[];
    data_info: {
        original_count: number;
        used_count: number;
        outliers_removed: number;
    };
    plot_url: string;
}

