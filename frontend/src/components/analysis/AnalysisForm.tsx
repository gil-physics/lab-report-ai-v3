import { Upload, FileSpreadsheet, Plus, Trash2, AlertCircle, Sparkles, LayoutGrid, Check } from 'lucide-react';
import type { DerivedVariable } from '../../types/analysis';
import { suggestColumns } from '../../lib/physicsKeywords';
import { useMemo } from 'react';

interface AnalysisFormProps {
    fileName: string;
    experimentName: string;
    setExperimentName: (v: string) => void;
    derivedVariables: DerivedVariable[];
    setDerivedVariables: (vars: DerivedVariable[]) => void;
    xColumn: string;
    setXColumn: (v: string) => void;
    yColumn: string;
    setYColumn: (v: string) => void;
    columns: string[];
    removeOutliers: boolean;
    setRemoveOutliers: (v: boolean) => void;
    onAnalyze: () => void;
    isLoading: boolean;
    error: string | null;
}

const AnalysisForm: React.FC<AnalysisFormProps> = ({
    fileName,
    experimentName,
    setExperimentName,
    derivedVariables,
    setDerivedVariables,
    xColumn,
    setXColumn,
    yColumn,
    setYColumn,
    columns,
    removeOutliers,
    setRemoveOutliers,
    onAnalyze,
    isLoading,
    error
}) => {

    const suggestions = useMemo(() => suggestColumns(columns), [columns]);

    const addDerivedVariable = () => {
        setDerivedVariables([...derivedVariables, { name: '', formula: '' }]);
    };

    const updateDerivedVariable = (index: number, field: keyof DerivedVariable, value: string) => {
        const newVars = [...derivedVariables];
        newVars[index][field] = value;
        setDerivedVariables(newVars);
    };

    const removeDerivedVariable = (index: number) => {
        setDerivedVariables(derivedVariables.filter((_, i) => i !== index));
    };

    return (
        <div className="glass-card rounded-3xl overflow-hidden shadow-xl shadow-blue-500/5 border border-white/50">
            <div className="primary-gradient px-8 py-6 flex items-center space-x-4">
                <Upload className="w-6 h-6 text-white" />
                <h2 className="text-white font-black text-xl tracking-tight">데이터 분석 설정</h2>
            </div>

            <div className="p-8 space-y-10">
                {/* 1. Experiment Info Section */}
                <section className="space-y-4">
                    <h3 className="text-slate-900 font-bold flex items-center space-x-3">
                        <span className="primary-gradient text-white w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-md">1</span>
                        <span className="text-lg">실험 정보</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">실험 항목 이름</label>
                            <input
                                type="text"
                                placeholder="예: 자유 낙하 실험"
                                className="premium-input w-full"
                                value={experimentName}
                                onChange={(e) => setExperimentName(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center space-x-3 w-full">
                                <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-medium text-blue-700 truncate">{fileName}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Axis Selection Section (Smart Mapping) */}
                <section className="space-y-4">
                    <h3 className="text-slate-900 font-bold flex items-center space-x-3">
                        <span className="primary-gradient text-white w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-md">2</span>
                        <span className="text-lg">데이터 축 설정</span>
                        <span className="bg-emerald-100 text-emerald-600 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" /> Smart Mapped
                        </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-blue-200 group">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">X축 (일반적으로 시간/각도)</label>
                            <div className="relative">
                                <select
                                    className={`w-full bg-white border ${xColumn === suggestions.x ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-slate-200'} rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 appearance-none`}
                                    value={xColumn}
                                    onChange={(e) => setXColumn(e.target.value)}
                                >
                                    <option value="">축 선택</option>
                                    {columns.map(col => (
                                        <option key={col} value={col}>
                                            {col} {col === suggestions.x ? '(추천 ✨)' : ''}
                                        </option>
                                    ))}
                                    {derivedVariables.map(dv => dv.name && <option key={dv.name} value={dv.name}>{dv.name} (계산됨)</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <LayoutGrid className="w-4 h-4" />
                                </div>
                            </div>
                            {xColumn === suggestions.x && (
                                <p className="text-[10px] text-blue-500 mt-2 font-bold flex items-center">
                                    <Check className="w-3 h-3 mr-1" /> 키워드 분석을 통해 자동으로 선택되었습니다.
                                </p>
                            )}
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-blue-200">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Y축 (일반적으로 측정값)</label>
                            <div className="relative">
                                <select
                                    className={`w-full bg-white border ${yColumn === suggestions.y ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-slate-200'} rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 appearance-none`}
                                    value={yColumn}
                                    onChange={(e) => setYColumn(e.target.value)}
                                >
                                    <option value="">축 선택</option>
                                    {columns.map(col => (
                                        <option key={col} value={col}>
                                            {col} {col === suggestions.y ? '(추천 ✨)' : ''}
                                        </option>
                                    ))}
                                    {derivedVariables.map(dv => dv.name && <option key={dv.name} value={dv.name}>{dv.name} (계산됨)</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <LayoutGrid className="w-4 h-4" />
                                </div>
                            </div>
                            {yColumn === suggestions.y && (
                                <p className="text-[10px] text-blue-500 mt-2 font-bold flex items-center">
                                    <Check className="w-3 h-3 mr-1" /> 키워드 분석을 통해 자동으로 선택되었습니다.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* 3. Derived Variables Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-slate-900 font-bold flex items-center space-x-3">
                            <span className="primary-gradient text-white w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-md">3</span>
                            <span className="text-lg">파생 변수 계산</span>
                        </h3>
                        <button
                            onClick={addDerivedVariable}
                            className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center bg-blue-50 px-4 py-2 rounded-xl transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            수식 추가
                        </button>
                    </div>

                    <div className="space-y-3">
                        {derivedVariables.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm font-medium">단위 변환이나 제곱($x^2$) 등의 파생 변수가 필요한가요?</p>
                            </div>
                        ) : (
                            derivedVariables.map((dv, idx) => (
                                <div key={idx} className="flex items-center space-x-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                                    <div className="flex-1">
                                        <input
                                            placeholder="변수명 (예: t_sq)"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                            value={dv.name}
                                            onChange={(e) => updateDerivedVariable(idx, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="text-slate-400 font-black">=</div>
                                    <div className="flex-[2]">
                                        <input
                                            placeholder="수식 (예: time * time)"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                            value={dv.formula}
                                            onChange={(e) => updateDerivedVariable(idx, 'formula', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeDerivedVariable(idx)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* 4. Analysis Options */}
                <section className="flex items-center space-x-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <label className="flex items-center cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={removeOutliers}
                                onChange={(e) => setRemoveOutliers(e.target.checked)}
                            />
                            <div className={`block w-12 h-7 rounded-full transition-colors ${removeOutliers ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${removeOutliers ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <span className="ml-4 text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">이상치 자동 제거 (전처리)</span>
                    </label>
                </section>

                {/* Execute Button */}
                <button
                    onClick={onAnalyze}
                    disabled={isLoading || !xColumn || !yColumn}
                    className="btn-primary w-full py-5 rounded-2xl text-lg font-black shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center space-x-3">
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>실험 데이터 심층 분석 중...</span>
                        </div>
                    ) : '물리 데이터 분석 시작'}
                </button>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start space-x-4 text-red-600 animate-in fade-in zoom-in-95">
                        <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-bold">{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisForm;
