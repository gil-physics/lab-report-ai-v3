import React from 'react';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GraphProps {
    xData: number[];
    yData: number[];
    yPredicted?: number[];
    residuals?: number[];
    xLabel?: string;
    yLabel?: string;
}

export function RegressionGraph({ xData, yData, yPredicted, xLabel = 'X', yLabel = 'Y' }: GraphProps) {
    // Combine data for chart
    const data = xData.map((x, i) => ({
        x,
        y: yData[i],
        yPred: yPredicted?.[i],
    }));

    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">회귀 분석 그래프</h3>
            <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        type="number"
                        dataKey="x"
                        name={xLabel}
                        label={{ value: xLabel, position: 'insideBottom', offset: -10 }}
                        stroke="#6b7280"
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name={yLabel}
                        label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
                        stroke="#6b7280"
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />

                    {/* Original data points */}
                    <Scatter
                        name="원본 데이터"
                        data={data}
                        fill="#06b6d4"
                        shape="circle"
                        r={6}
                    />

                    {/* Regression line */}
                    {yPredicted && (
                        <Line
                            type="monotone"
                            dataKey="yPred"
                            data={data}
                            stroke="#f97316"
                            strokeWidth={3}
                            dot={false}
                            name="회귀선"
                        />
                    )}
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ResidualPlot({ xData, residuals, xLabel = 'X' }: GraphProps) {
    if (!residuals) return null;

    const data = xData.map((x, i) => ({
        x,
        residual: residuals[i],
        zero: 0,
    }));

    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">잔차 그래프</h3>
            <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        type="number"
                        dataKey="x"
                        name={xLabel}
                        label={{ value: xLabel, position: 'insideBottom', offset: -10 }}
                        stroke="#6b7280"
                    />
                    <YAxis
                        type="number"
                        dataKey="residual"
                        name="잔차"
                        label={{ value: '잔차 (Residual)', angle: -90, position: 'insideLeft' }}
                        stroke="#6b7280"
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />

                    {/* Zero line */}
                    <Line
                        type="monotone"
                        dataKey="zero"
                        data={data}
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="기준선 (y=0)"
                    />

                    {/* Residual points */}
                    <Scatter
                        name="잔차"
                        data={data}
                        fill="#a855f7"
                        shape="circle"
                        r={5}
                    />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
