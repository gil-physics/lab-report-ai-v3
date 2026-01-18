import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';

interface GraphProps {
    xData: number[];
    yData?: number[];
    yPredicted?: number[];
    residuals?: number[];
    xLabel?: string;
    yLabel?: string;
    xRange?: [number | undefined, number | undefined];
    yRange?: [number | undefined, number | undefined];
    slope?: number;
    intercept?: number;
}

export function RegressionGraph({ xData, yData, yPredicted, xLabel = 'X', yLabel = 'Y', xRange, yRange, slope, intercept }: GraphProps) {
    // Combine data for chart
    const data = xData.map((x, i) => {
        let yPred = yPredicted?.[i];
        if (yPred === undefined && slope !== undefined && intercept !== undefined) {
            yPred = slope * x + intercept;
        }
        return {
            x,
            y: yData ? yData[i] : null,
            yPred,
        };
    });

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={450}>
                <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        type="number"
                        dataKey="x"
                        name={xLabel}
                        label={{ value: xLabel, position: 'insideBottom', offset: -25, fontSize: 13, fontWeight: 700, fill: '#94a3b8' }}
                        stroke="#cbd5e1"
                        tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                        domain={[xRange?.[0] ?? 'auto', xRange?.[1] ?? 'auto']}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name={yLabel}
                        label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, fontSize: 13, fontWeight: 700, fill: '#94a3b8' }}
                        stroke="#cbd5e1"
                        tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                        domain={[yRange?.[0] ?? 'auto', yRange?.[1] ?? 'auto']}
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)' }}
                        itemStyle={{ fontSize: 13, fontWeight: 700 }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />

                    {/* Original data points */}
                    <Scatter
                        name="원본 데이터"
                        data={data}
                        fill="#2563eb"
                        shape="circle"
                        r={5}
                        className="drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                    />

                    {/* Regression line */}
                    {yPredicted && (
                        <Line
                            type="monotone"
                            dataKey="yPred"
                            data={data}
                            stroke="#7c3aed"
                            strokeWidth={4}
                            dot={false}
                            name="회귀선"
                            className="drop-shadow-[0_0_10px_rgba(124,58,237,0.3)]"
                        />
                    )}
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ResidualPlot({ xData, residuals, xLabel = 'X', xRange }: GraphProps) {
    if (!residuals) return null;

    const data = xData.map((x, i) => ({
        x,
        residual: residuals[i],
        zero: 0,
    }));

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={350}>
                <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        type="number"
                        dataKey="x"
                        name={xLabel}
                        label={{ value: xLabel, position: 'insideBottom', offset: -25, fontSize: 13, fontWeight: 700, fill: '#94a3b8' }}
                        stroke="#cbd5e1"
                        tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                        domain={[xRange?.[0] ?? 'auto', xRange?.[1] ?? 'auto']}
                    />
                    <YAxis
                        type="number"
                        dataKey="residual"
                        name="잔차"
                        label={{ value: '잔차 (Residual)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 13, fontWeight: 700, fill: '#94a3b8' }}
                        stroke="#cbd5e1"
                        tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)' }}
                        itemStyle={{ fontSize: 13, fontWeight: 700 }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />

                    {/* Zero line */}
                    <Line
                        type="monotone"
                        dataKey="zero"
                        data={data}
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeDasharray="8 8"
                        dot={false}
                        name="기준선 (y=0)"
                    />

                    {/* Residual points */}
                    <Scatter
                        name="잔차"
                        data={data}
                        fill="#ec4899"
                        shape="circle"
                        r={4}
                        className="drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]"
                    />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
