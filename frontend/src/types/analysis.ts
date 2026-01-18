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
    yMin: number | '';
    yMax: number | '';
    useCustomRange: boolean;
}
