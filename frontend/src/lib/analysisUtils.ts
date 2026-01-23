export interface RegressionStats {
    n: number;
    slope: number;
    intercept: number;
    rSquared: number;
    sse: number;
    maxResidual: number;
}

export function calculateRegression(data: any[], xColumn: string, yColumn: string): RegressionStats | null {
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

    const yMean = sumY / n;
    let sse = 0;
    let sst = 0;

    points.forEach(([x, y]) => {
        const yPred = slope * x + intercept;
        sse += Math.pow(y - yPred, 2);
        sst += Math.pow(y - yMean, 2);
    });

    const rSquared = 1 - (sse / sst);

    const residuals = points.map(([x, y]) => y - (slope * x + intercept));
    const maxRes = Math.max(...residuals.map(Math.abs));

    return {
        n,
        slope,
        intercept,
        rSquared,
        sse,
        maxResidual: maxRes
    };
}
