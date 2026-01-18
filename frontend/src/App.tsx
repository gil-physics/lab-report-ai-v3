import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { evaluate } from 'mathjs';
import { BarChart3 } from 'lucide-react';

import Header from './components/layout/Header';
import AnalysisForm from './components/analysis/AnalysisForm';
import AnalysisResults from './components/analysis/AnalysisResults';
import ReportEditor from './components/reports/ReportEditor';
import type { AnalysisResult, DerivedVariable, SavedAnalysis } from './types/analysis';

export default function App() {
  // --- UI State ---
  const [showEditor, setShowEditor] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Data & Analysis State ---
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [experimentName, setExperimentName] = useState('');
  const [derivedVariables, setDerivedVariables] = useState<DerivedVariable[]>([]);

  const [selectedXColumn, setSelectedXColumn] = useState('');
  const [selectedYColumn, setSelectedYColumn] = useState('');
  const [removeOutliers, setRemoveOutliers] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('none');

  const [xData, setXData] = useState<number[]>([]);
  const [yData, setYData] = useState<number[]>([]);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  // --- Graph Range State ---
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [xMin, setXMin] = useState<number | ''>('');
  const [xMax, setXMax] = useState<number | ''>('');
  const [yMin, setYMin] = useState<number | ''>('');
  const [yMax, setYMax] = useState<number | ''>('');

  // --- Report State ---
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [reportMarkdown, setReportMarkdown] = useState('');

  // --- Effects ---
  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('lab-report-draft');
    if (savedDraft) setReportMarkdown(savedDraft);
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (reportMarkdown) localStorage.setItem('lab-report-draft', reportMarkdown);
  }, [reportMarkdown]);

  // Handle derived variables update
  useEffect(() => {
    if (parsedData.length > 0) {
      const originalColumns = Object.keys(parsedData[0]).filter(col => col && col.trim() !== '');
      setColumns([...originalColumns]);
    }
  }, [parsedData]);

  // --- Handlers ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResults(null);
      setError(null);

      try {
        const text = await selectedFile.text();
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        if (parsed.data && parsed.data.length > 0) {
          const data = parsed.data as any[];
          const validData = data.filter(row => row && Object.keys(row).some(key => row[key] != null && row[key] !== ''));
          setParsedData(validData);

          const cols = Object.keys(validData[0]).filter(col => col && col.trim() !== '');
          if (cols.length >= 2) {
            setSelectedXColumn(cols[0]);
            setSelectedYColumn(cols[1]);
          }
        }
      } catch (err) {
        setError('CSV 파일을 읽는 중 오류가 발생했습니다.');
      }
    }
  };

  const getColumnData = (colName: string): number[] => {
    const derivedVar = derivedVariables.find(dv => dv.name === colName);
    if (derivedVar) {
      try {
        const results: number[] = [];
        const originalColumns = Object.keys(parsedData[0]);
        parsedData.forEach(row => {
          const scope: Record<string, number> = {};
          originalColumns.forEach(col => scope[col] = parseFloat(row[col]));
          const res = evaluate(derivedVar.formula, scope);
          if (typeof res === 'number' && !isNaN(res) && isFinite(res)) results.push(res);
        });
        return results;
      } catch (e) {
        console.error('Formula evaluation failed', e);
        return [];
      }
    }
    return parsedData.map(row => parseFloat(row[colName])).filter(v => !isNaN(v));
  };

  const handleAnalyze = async () => {
    if (!file || !parsedData.length) return;
    setIsLoading(true);
    setError(null);

    try {
      const rawX = getColumnData(selectedXColumn);
      const rawY = getColumnData(selectedYColumn);
      const minLen = Math.min(rawX.length, rawY.length);
      const x = rawX.slice(0, minLen);
      const y = rawY.slice(0, minLen);

      setXData(x);
      setYData(y);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { x, y },
          options: { remove_outliers: removeOutliers }
        })
      });

      if (!response.ok) throw new Error('서버 분석 중 오류가 발생했습니다.');
      const data = await response.json();
      if (data.status === 'success') setResults(data);
      else throw new Error(data.message || '분석 실패');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToReport = () => {
    if (!results) return;
    const name = experimentName || prompt('실험 이름을 입력하세요:') || '실험';
    setSavedAnalyses([...savedAnalyses, {
      id: Date.now().toString(),
      experimentName: name,
      results,
      xData,
      yData,
      xLabel: selectedXColumn,
      yLabel: selectedYColumn,
      xMin, xMax, yMin, yMax, useCustomRange
    }]);
    setResults(null); // Clear active to show queue
  };

  const handlePrepareMD = async () => {
    if (savedAnalyses.length === 0) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/prepare-report-md', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate,
          use_ai: useAI,
          items: savedAnalyses.map(item => ({
            experiment_name: item.experimentName,
            x_label: item.xLabel,
            y_label: item.yLabel,
            analysis: item.results.best_model,
            data: {
              x: item.xData,
              y: item.yData,
              residuals: item.results.residuals
            }
          }))
        })
      });
      const data = await response.json();
      setReportMarkdown(data.markdown);
      setShowEditor(true);
    } catch (err) {
      setError('보고서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetEditor = () => {
    if (confirm('보고서를 초기화하시겠습니까?')) {
      setReportMarkdown('');
      localStorage.removeItem('lab-report-draft');
    }
  };

  // --- Render ---
  if (showEditor) {
    return (
      <ReportEditor
        markdown={reportMarkdown}
        setMarkdown={setReportMarkdown}
        onBack={() => setShowEditor(false)}
        onPrint={() => window.print()}
        onReset={handleResetEditor}
        isPreview={isPreviewMode}
        setIsPreview={setIsPreviewMode}
      />
    );
  }

  return (
    <main className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      <Header
        useAI={useAI}
        setUseAI={setUseAI}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
      />

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 h-full overflow-y-auto pr-2 custom-scroll pb-20">
            <AnalysisForm
              file={file}
              fileName={file?.name || ''}
              onFileChange={handleFileChange}
              experimentName={experimentName}
              setExperimentName={setExperimentName}
              derivedVariables={derivedVariables}
              setDerivedVariables={setDerivedVariables}
              xColumn={selectedXColumn}
              setXColumn={setSelectedXColumn}
              yColumn={selectedYColumn}
              setYColumn={setSelectedYColumn}
              columns={columns}
              removeOutliers={removeOutliers}
              setRemoveOutliers={setRemoveOutliers}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              error={error}
            />
          </div>

          <div className="lg:col-span-8 h-full overflow-y-auto pl-2 custom-scroll pb-20">
            <AnalysisResults
              results={results}
              xData={xData}
              yData={yData}
              xColumn={selectedXColumn}
              yColumn={selectedYColumn}
              xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax}
              useCustomRange={useCustomRange}
              setXMin={setXMin} setXMax={setXMax} setYMin={setYMin} setYMax={setYMax}
              setUseCustomRange={setUseCustomRange}
              onAddToReport={handleAddToReport}
              savedAnalyses={savedAnalyses}
              onRemoveSaved={(id) => setSavedAnalyses(savedAnalyses.filter(a => a.id !== id))}
              onPrepareReport={handlePrepareMD}
              isPreparingMD={isLoading}
            />
            {!results && savedAnalyses.length === 0 && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/40 glass-card rounded-3xl border border-white/50 text-slate-400 p-10 text-center">
                <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">표시할 분석 결과가 없습니다.</p>
                <p className="text-sm">데이터를 로드하고 분석을 시작하세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 pb-8 pt-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center justify-center space-y-1">
          <p className="text-sm font-semibold text-slate-400">
            made by <span className="text-blue-600">Seongwu Gil</span>, Yonsei University
          </p>
          <p className="text-[10px] text-slate-300 uppercase tracking-widest">© 2026 Lab Report AI Analysis</p>
        </div>
      </footer>
    </main>
  );
}
