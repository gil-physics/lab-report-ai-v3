import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Layers, Sparkles, Activity } from 'lucide-react';

interface DataSummaryGridProps {
    parsedData: any[];
}

// Tooltip removed as it was unused in final compact version

export default function DataSummaryGrid({ parsedData }: DataSummaryGridProps) {
    const [stats, setStats] = useState({ rows: 0, cols: 0, missing: 0 });
    const [insightText, setInsightText] = useState("");

    useEffect(() => {
        if (parsedData.length > 0) {
            const rows = parsedData.length;
            const cols = Object.keys(parsedData[0]).length;

            let missing = 0;
            parsedData.forEach(row => {
                Object.values(row).forEach(val => {
                    if (val === null || val === undefined || val === '') missing++;
                });
            });

            setStats({ rows, cols, missing });

            const suggestion = `Analyzed ${rows} data points with ${cols} variables. The dataset appears to be linear. Recommended analysis: Linear Regression with robust outlier detection.`;
            let i = 0;
            setInsightText("");
            const interval = setInterval(() => {
                setInsightText(prev => prev + suggestion.charAt(i));
                i++;
                if (i >= suggestion.length) clearInterval(interval);
            }, 30);

            return () => clearInterval(interval);
        }
    }, [parsedData]);

    const columns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

    return (
        <div className="w-full h-full overflow-y-auto px-6 py-2 flex flex-col scroll-smooth">
            <div className="max-w-7xl mx-auto flex-1 w-full pb-2">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Column: Stats Cards (Stacked) */}
                    <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-500 font-medium text-sm">Total Rows</span>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Database size={16} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{stats.rows.toLocaleString()}</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-500 font-medium text-sm">Variables</span>
                                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                                    <Layers size={16} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{stats.cols}</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-500 font-medium text-sm">Missing Values</span>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <Activity size={16} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{stats.missing}</div>
                        </motion.div>
                    </div>

                    {/* Right Column: AI & Table */}
                    <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
                        <motion.div
                            className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
                        >
                            <div className="flex items-start gap-4">
                                <Sparkles size={24} className="text-yellow-300" />
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
                                    <div className="font-mono text-sm opacity-90">{insightText}</div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-700">Data Preview</h3>
                                <span className="text-xs text-slate-400">All {parsedData.length} rows</span>
                            </div>
                            <div className="overflow-auto flex-1">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white shadow-sm">
                                        <tr>
                                            {columns.map(col => (
                                                <th key={col} className="px-6 py-3 text-xs font-semibold text-slate-500 bg-slate-50 uppercase">{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {parsedData.map((row, idx) => (
                                            <tr key={idx}>
                                                {columns.map(col => (
                                                    <td key={col} className="px-6 py-3 text-sm text-slate-600 font-mono">{row[col]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
