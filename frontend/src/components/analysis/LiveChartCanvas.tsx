// import { useRef } from 'react'; // Unused
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Label,
    LineChart,
    Line
} from 'recharts';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LiveChartCanvasProps {
    data: any[];
    chartType: string;
    xColumn: string;
    yColumn: string;
    isLogScale?: boolean;
    theme: string;
}

const THEME_COLORS: Record<string, { bg: string; grid: string; gridOpacity: number; axis: string; data: string; dot: string; glow: string; text: string; border: string }> = {
    scientific: {
        bg: 'bg-white',
        grid: '#e2e8f0', // slate-200
        gridOpacity: 1,
        axis: '#64748b', // slate-500
        data: '#8b5cf6', // violet-500
        dot: '#7c3aed',  // violet-600
        glow: 'none',
        text: 'text-slate-800',
        border: 'border-slate-100'
    },
    modern: {
        bg: 'bg-slate-950',
        grid: '#1e293b', // slate-800
        gridOpacity: 0.5,
        axis: '#475569', // slate-600
        data: '#10b981', // emerald-500
        dot: '#34d399',  // emerald-400
        glow: 'url(#glow-emerald)',
        text: 'text-slate-100',
        border: 'border-slate-800'
    },
    pastel: {
        bg: 'bg-[#f5f2e9]', // darker warm paper/beige
        grid: '#e7e5e4', // stone-200
        gridOpacity: 0.8,
        axis: '#78716c', // stone-500
        data: '#f43f5e', // rose-500
        dot: '#e11d48',  // rose-600
        glow: 'none',
        text: '#44403c', // stone-800
        border: 'border-[#e0dccf]'
    }
};

export default function LiveChartCanvas({
    data,
    chartType,
    xColumn,
    yColumn,
    isLogScale = false,
    theme = 'scientific'
}: LiveChartCanvasProps) {
    const colors = THEME_COLORS[theme] || THEME_COLORS.scientific;

    // Prepare data (filter out nulls for selected columns)
    const validData = data.filter(row =>
        row[xColumn] !== null && row[xColumn] !== '' &&
        row[yColumn] !== null && row[yColumn] !== ''
    ).map(row => ({
        ...row,
        [xColumn]: Number(row[xColumn]), // Ensure numbers for plotting
        [yColumn]: Number(row[yColumn])
    }));

    const renderChart = () => {
        if (!xColumn || !yColumn) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <p>Select X and Y variables to view the graph.</p>
                </div>
            )
        }

        const commonProps = {
            width: "100%",
            height: "100%",
            margin: { top: 20, right: 20, bottom: 40, left: 40 }
        };

        const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                return (
                    <div className={cn(
                        "px-3 py-2 border shadow-xl rounded-lg text-xs leading-5 z-50 animate-in fade-in zoom-in-95",
                        theme === 'modern' ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
                    )}>
                        <p className="font-bold mb-1">{`${xColumn}: ${label}`}</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.dot, filter: colors.glow !== 'none' ? colors.glow : undefined }} />
                            <span className="font-medium">{`${yColumn}: ${payload[0].value}`}</span>
                        </div>
                    </div>
                );
            }
            return null;
        };

        if (chartType === 'line') {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={validData} {...commonProps.margin}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                        <XAxis dataKey={xColumn} type="number" name={xColumn} stroke={colors.axis} tick={{ fontSize: 12 }}>
                            <Label value={xColumn} offset={-10} position="insideBottom" />
                        </XAxis>
                        <YAxis
                            dataKey={yColumn}
                            type="number"
                            name={yColumn}
                            stroke={colors.axis}
                            tick={{ fontSize: 12 }}
                            scale={isLogScale ? 'log' : 'auto'}
                            domain={isLogScale ? ['auto', 'auto'] : ['auto', 'auto']}
                            allowDataOverflow={isLogScale}
                        >
                            <Label value={yColumn} angle={-90} position="insideLeft" />
                        </YAxis>
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: colors.axis }} />
                        <Line
                            type="monotone"
                            dataKey={yColumn}
                            stroke={colors.dot}
                            strokeWidth={3}
                            dot={{ r: 4, fill: colors.dot, filter: colors.glow !== 'none' ? colors.glow : undefined }}
                            activeDot={{ r: 6, fill: colors.dot, filter: colors.glow !== 'none' ? colors.glow : undefined }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            );
        }

        // Default to Scatter
        return (
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart {...commonProps.margin}>
                    <defs>
                        <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="rose-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} strokeOpacity={colors.gridOpacity} vertical={false} />
                    <XAxis dataKey={xColumn} type="number" name={xColumn} stroke={colors.axis} tick={{ fontSize: 11, fill: colors.axis }} axisLine={{ stroke: colors.axis, opacity: 0.3 }} tickLine={false}>
                        <Label value={xColumn} offset={-15} position="insideBottom" style={{ fill: colors.axis, fontWeight: 600, fontSize: 11 }} />
                    </XAxis>
                    <YAxis
                        dataKey={yColumn}
                        type="number"
                        name={yColumn}
                        stroke={colors.axis}
                        tick={{ fontSize: 11, fill: colors.axis }}
                        axisLine={{ stroke: colors.axis, opacity: 0.3 }}
                        tickLine={false}
                        scale={isLogScale ? 'log' : 'auto'}
                        domain={isLogScale ? ['auto', 'auto'] : ['auto', 'auto']}
                        allowDataOverflow={isLogScale}
                    >
                        <Label value={yColumn} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: colors.axis, fontWeight: 600, fontSize: 11 }} />
                    </YAxis>
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: colors.axis, strokeOpacity: 0.5 }} />
                    <Scatter
                        name="Data"
                        data={validData}
                        fill={colors.data}
                        shape={(props: any) => {
                            const { cx, cy, fill } = props;
                            return (
                                <circle
                                    cx={cx} cy={cy} r={4}
                                    fill={fill}
                                    filter={colors.glow !== 'none' ? colors.glow : undefined}
                                    className="transition-all duration-300"
                                />
                            );
                        }}
                    />
                </ScatterChart>
            </ResponsiveContainer>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "w-full h-full rounded-xl shadow-2xl transition-all duration-500 border p-8 flex flex-col relative overflow-hidden group",
                colors.bg,
                colors.border
            )}
        >
            {/* Textureized Overlay for Nature Theme */}
            {theme === 'pastel' && (
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/natural-paper.png")` }} />
            )}

            {/* Scientific Subtle Grid */}
            {theme === 'scientific' && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            )}

            {/* Header */}
            <div className="mb-6 flex items-center justify-between z-10">
                <h3 className={cn("font-bold flex items-center gap-2", theme === 'modern' ? "text-emerald-400" : "text-slate-800")}>
                    Preview Canvas
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 rounded-full text-xs font-bold hover:bg-violet-100 transition-colors shadow-sm active:scale-95 border border-violet-100"
                        title="Regenerate chart styling with AI"
                    >
                        <Sparkles size={14} />
                        <span className="hidden md:inline">Auto-Style</span>
                    </button>
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/50" />
                        <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/50" />
                    </div>
                </div>
            </div>

            {/* Chart Container */}
            <div className="flex-1 min-h-0 z-10">
                {renderChart()}
            </div>
        </motion.div>
    );
}
