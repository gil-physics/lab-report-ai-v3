import { useMemo } from 'react';
import { Calculator, TrendingUp, Info } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
// import { cn } from '../../lib/utils'; // Unused
// import { getTheme } from '../../lib/theme'; // Unused

interface AnalysisPanelProps {
    data: any[];
    xColumn: string;
    yColumn: string;
}

export default function AnalysisPanel({ data, xColumn, yColumn }: AnalysisPanelProps) {
    // const theme = getTheme(2); // Unused

    // Calculate Regression Stats
    const stats = useMemo(() => {
        if (!xColumn || !yColumn || data.length === 0) return null;

        const points = data
            .filter(d => d[xColumn] !== undefined && d[yColumn] !== undefined)
            .map(d => [Number(d[xColumn]), Number(d[yColumn])]);

        if (points.length < 2) return null;

        const n = points.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

        for (const [x, y] of points) {
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
            sumYY += y * y;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // R-squared
        // const ssTot = sumYY - (sumY * sumY) / n; // Unused
        // const ssRes = sumYY - slope * sumXY - intercept * sumY; // Unused
        // More robust R2 calculation:
        // SST = sum((y - y_mean)^2)
        // SSR = sum((y_pred - y_mean)^2) or SSE = sum((y - y_pred)^2)
        // R2 = 1 - SSE/SST

        const yMean = sumY / n;
        let sse = 0;
        let sst = 0;

        points.forEach(([x, y]) => {
            const yPred = slope * x + intercept;
            sse += Math.pow(y - yPred, 2);
            sst += Math.pow(y - yMean, 2);
        });

        const rSquared = 1 - (sse / sst);

        // Residuals Stats
        const residuals = points.map(([x, y]) => y - (slope * x + intercept));
        const maxRes = Math.max(...residuals.map(Math.abs));
        // const meanRes = residuals.reduce((a, b) => a + b, 0) / n; // Unused

        return {
            n,
            slope: slope.toFixed(4),
            intercept: intercept.toFixed(4),
            rSquared: rSquared.toFixed(4),
            sse: sse.toFixed(4),
            maxResidual: maxRes.toFixed(4)
        };
    }, [data, xColumn, yColumn]);

    if (!stats) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                <Calculator size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Select valid X and Y columns to see analysis</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <TrendingUp size={16} className="text-violet-500" />
                    Linear Regression Results
                </h3>
                <Popover.Root>
                    <Popover.Trigger asChild>
                        <button className="text-slate-400 hover:text-violet-500 transition-colors">
                            <Info size={14} />
                        </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content className="w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl z-50 leading-relaxed" sideOffset={5}>
                            Parameters estimated using Ordinary Least Squares (OLS) method.
                            <Popover.Arrow className="fill-slate-800" />
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
            </div>

            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Equation */}
                <div className="col-span-2 p-3 bg-violet-50/50 rounded-lg border border-violet-100/50">
                    <div className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-1">Model Equation</div>
                    <div className="font-mono text-lg font-bold text-slate-800">
                        y = <span className="text-violet-600">{stats.slope}</span>x + <span className="text-violet-600">{stats.intercept}</span>
                    </div>
                </div>

                {/* R-Squared */}
                <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">R-Squared</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.rSquared}</div>
                </div>

                {/* Residuals */}
                <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Max Residual</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.maxResidual}</div>
                </div>
            </div>
        </div>
    );
}
