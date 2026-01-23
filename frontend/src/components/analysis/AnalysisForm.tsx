// React import removed
import { Upload, FileSpreadsheet, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { DerivedVariable } from '../../types/analysis';

interface AnalysisFormProps {
    file: File | null;
    fileName: string;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    file,
    fileName,
    onFileChange,
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
                <h2 className="text-white font-black text-xl tracking-tight">데이터 입력 및 설정</h2>
            </div>

            <div className="p-8 space-y-10">
                {/* 1. File Upload Section */}
                <section className="space-y-4">
                    <h3 className="text-slate-900 font-bold flex items-center space-x-3">
                        <span className="primary-gradient text-white w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-md">1</span>
                        <span className="text-lg">파일 업로드</span>
                    </h3>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={onFileChange}
                            className="hidden"
                            id="csv-upload"
                        />
                        <label
                            htmlFor="csv-upload"
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all ${file ? 'bg-blue-50/50 border-blue-400/50' : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-white transition-all duration-300 group'}`}
                        >
                            {file ? (
                                <div className="flex items-center space-x-3 text-blue-700">
                                    <FileSpreadsheet className="w-8 h-8" />
                                    <span className="font-medium text-lg">{fileName}</span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                    <span className="text-gray-600 font-medium">CSV 파일을 선택하거나 여기에 끌어다 놓으세요</span>
                                    <span className="text-gray-400 text-sm mt-1">UTF-8 형식의 CSV 파일만 지원됩니다</span>
                                </>
                            )}
                        </label>
                    </div>
                </section>

                {/* 2. Experiment Name Section */}
                <section className="space-y-4">
                    <h3 className="text-slate-900 font-bold flex items-center space-x-3">
                        <span className="primary-gradient text-white w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-md">2</span>
                        <span className="text-lg">실험 정보 설정</span>
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">실험 항목 이름</label>
                        <input
                            type="text"
                            placeholder="예: 금속의 선팽창 계수 측정"
                            className="premium-input w-full"
                            value={experimentName}
                            onChange={(e) => setExperimentName(e.target.value)}
                        />
                    </div>
                </section>

                {/* 3. Derived Variables Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-900 font-bold flex items-center space-x-2">
                            <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                            <span>파생 변수 추가 (선택)</span>
                        </h3>
                        <button
                            onClick={addDerivedVariable}
                            className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center bg-blue-50 px-3 py-1.5 rounded-lg transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            변수 추가
                        </button>
                    </div>

                    <div className="space-y-3">
                        {derivedVariables.length === 0 ? (
                            <p className="text-gray-400 text-sm italic bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                                수식을 통해 기존 열에서 새로운 변수를 계산할 수 있습니다.
                            </p>
                        ) : (
                            derivedVariables.map((dv, idx) => (
                                <div key={idx} className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                                    <div className="flex-1">
                                        <input
                                            placeholder="변수명 (예: T_squared)"
                                            className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                                            value={dv.name}
                                            onChange={(e) => updateDerivedVariable(idx, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="text-gray-400 font-bold">=</div>
                                    <div className="flex-[2]">
                                        <input
                                            placeholder="수식 (예: T * T)"
                                            className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-mono"
                                            value={dv.formula}
                                            onChange={(e) => updateDerivedVariable(idx, 'formula', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeDerivedVariable(idx)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* 4. Axis Selection Section */}
                <section className="space-y-4">
                    <h3 className="text-gray-900 font-bold flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                        <span>분석 축 설정</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">X축 데이터</label>
                            <select
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                value={xColumn}
                                onChange={(e) => setXColumn(e.target.value)}
                            >
                                <option value="">축 선택</option>
                                {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                {derivedVariables.map(dv => dv.name && <option key={dv.name} value={dv.name}>{dv.name} (계산됨)</option>)}
                            </select>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Y축 데이터</label>
                            <select
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                value={yColumn}
                                onChange={(e) => setYColumn(e.target.value)}
                            >
                                <option value="">축 선택</option>
                                {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                {derivedVariables.map(dv => dv.name && <option key={dv.name} value={dv.name}>{dv.name} (계산됨)</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                {/* 5. Analysis Options */}
                <section className="flex items-center space-x-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="flex items-center cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={removeOutliers}
                                onChange={(e) => setRemoveOutliers(e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${removeOutliers ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${removeOutliers ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">이상치 자동 제거</span>
                    </label>
                </section>

                {/* Execute Button */}
                <button
                    onClick={onAnalyze}
                    disabled={isLoading || !file || !xColumn || !yColumn}
                    className="btn-primary w-full"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center space-x-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>데이터 분석 중...</span>
                        </div>
                    ) : '물리 데이터 분석 시작'}
                </button>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 text-red-600 animate-in fade-in zoom-in-95">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisForm;
