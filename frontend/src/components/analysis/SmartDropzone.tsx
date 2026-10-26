import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, AlertCircle, FileSpreadsheet, Database,
    LayoutGrid, Plus, Trash2, ChevronRight,
    Target, Play, MousePointer2, Camera, Pencil, FlaskConical, Check, Lock
} from 'lucide-react';
import Papa from 'papaparse';
import { useAnalysis } from '../../context/AnalysisContext';
import { analyzeTypeUniformity, detectParallelBlocks } from '../../lib/physicsKeywords';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../lib/api';

type SelectionMode = 'header' | 'data' | 'edit';

const SAMPLE_FILE_NAME = 'sample_free_fall.csv';

const isNumericRow = (row: any[]) => {
    const cells = row.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
    return cells.length > 0 && cells.every(c => typeof c === 'number' && Number.isFinite(c));
};

// Default data range: from the first data row down to the last row of that numeric block
// (stops at a blank line or a second table's text header instead of running to the end of the file)
const findNumericBlockEnd = (rows: any[][], start: number) => {
    if (!rows[start] || !isNumericRow(rows[start])) return rows.length - 1;
    let end = start;
    while (end + 1 < rows.length && isNumericRow(rows[end + 1])) end++;
    return end;
};

const SmartDropzone: React.FC = () => {
    const navigate = useNavigate();
    const {
        file, setFile, setRawRows, rawRows, setRawRowsStrings, rawRowsStrings, units, addUnit, removeUnit,
        setActiveStep, setCsvRawData
    } = useAnalysis();

    const [isProcessing, setIsProcessing] = useState(false);
    // Coming back from Step 2 with data still loaded → reopen the range selection screen
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>(() => rawRows.length > 0 ? 'success' : 'idle');
    const [processingMessage, setProcessingMessage] = useState<string>('');
    const [isSample, setIsSample] = useState(() => file?.name === SAMPLE_FILE_NAME);

    // --- Slicing State (Active Selection) ---
    const [headerRow, setHeaderRow] = useState<number>(0);
    const [dataStart, setDataStart] = useState<number>(1);
    const [dataEnd, setDataEnd] = useState<number>(0);
    const [colRange, setColRange] = useState<[number, number]>([0, 0]);
    const [unitName, setUnitName] = useState('');
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('header');
    const [suggestedBlocks, setSuggestedBlocks] = useState<number[][]>([]);

    // --- Drag Interaction State ---
    const [isDragging, setIsDragging] = useState(false);
    const [dragAnchor, setDragAnchor] = useState<number | null>(null);
    const [touchAnchor, setTouchAnchor] = useState<number | null>(null);
    const lastPointerTypeRef = useRef<string>('mouse');

    useEffect(() => {
        setTouchAnchor(null);
    }, [selectionMode]);

    // --- Cell Editing State ---
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
    const [editValue, setEditValue] = useState('');

    // --- Cell Edit Handlers ---
    const handleCellDoubleClick = (rowIdx: number, colIdx: number, currentValue: any) => {
        setEditingCell({ row: rowIdx, col: colIdx });
        setEditValue(String(currentValue ?? ''));
    };

    const handleCellSave = (rowIdx: number, colIdx: number) => {
        const newRows = [...rawRows];
        const newValue = editValue.trim();
        // Try to convert to number if possible
        const numValue = parseFloat(newValue);
        newRows[rowIdx][colIdx] = isNaN(numValue) ? newValue : numValue;
        setRawRows(newRows);

        // Also update rawRowsStrings
        const newStrings = [...rawRowsStrings];
        newStrings[rowIdx][colIdx] = newValue;
        setRawRowsStrings(newStrings);

        setEditingCell(null);
        setEditValue('');
    };

    const handleCellCancel = () => {
        setEditingCell(null);
        setEditValue('');
    };

    // --- Initialization ---
    useEffect(() => {
        if (rawRows.length > 0) {
            const { headerCandidate, dataStartCandidate } = analyzeTypeUniformity(rawRows);
            const splits = detectParallelBlocks(rawRows, headerCandidate);

            setHeaderRow(headerCandidate);
            setDataStart(dataStartCandidate);
            setDataEnd(findNumericBlockEnd(rawRows, dataStartCandidate));
            setSuggestedBlocks(splits);

            if (splits.length > 0) {
                setColRange(splits[0] as [number, number]);
            } else {
                setColRange([0, rawRows[0].length - 1]);
            }

            setUnitName(`실험 단위 ${units.length + 1}`);
        }
    }, [rawRows.length]);

    const loadCsvFile = useCallback(async (file: File) => {
        setIsProcessing(true);
        setUploadStatus('idle');

        try {
            const text = await file.text();

            // First parse: auto-typed for analysis
            Papa.parse(text, {
                header: false,
                dynamicTyping: true,
                skipEmptyLines: false,
                complete: (results) => {
                    const rows = results.data as any[][];
                    if (rows && rows.length > 0) {
                        setFile(file);
                        setRawRows(rows);
                        // Store CSV raw data for AI context (Feature 2)
                        setCsvRawData(text);

                        // Second parse: raw strings for sig-fig tracking
                        Papa.parse(text, {
                            header: false,
                            dynamicTyping: false,
                            skipEmptyLines: false,
                            complete: (rawResults) => {
                                setRawRowsStrings(rawResults.data as any[][]);
                                setUploadStatus('success');
                            }
                        });
                    } else {
                        throw new Error("데이터가 비어있거나 형식이 올바르지 않습니다.");
                    }
                    setIsProcessing(false);
                },
                error: (err: Error) => {
                    throw new Error(err.message);
                }
            });
        } catch (err: any) {
            setUploadStatus('error');
            setIsProcessing(false);
        }
    }, [setFile, setRawRows, setCsvRawData]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        setIsSample(false);
        await loadCsvFile(file);
    }, [loadCsvFile]);

    // 데이터가 없는 사용자를 위한 샘플 CSV (public/samples)
    const loadSampleData = async () => {
        try {
            const res = await fetch(`${import.meta.env.BASE_URL}samples/${SAMPLE_FILE_NAME}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            setIsSample(true);
            await loadCsvFile(new File([blob], SAMPLE_FILE_NAME, { type: 'text/csv' }));
        } catch (err: any) {
            alert(`샘플 데이터를 불러오지 못했습니다: ${err.message}`);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
        maxFiles: 1, multiple: false, disabled: uploadStatus === 'success'
    });

    const onImageDrop = useCallback(async (acceptedFiles: File[]) => {
        const imageFile = acceptedFiles[0];
        if (!imageFile) return;

        setIsSample(false);
        setIsProcessing(true);
        setUploadStatus('idle');

        try {
            // Step 1: OCR 시작
            setProcessingMessage('📸 OCR 텍스트 추출 중...');

            const formData = new FormData();
            formData.append('file', imageFile);

            const response = await fetch(getApiUrl('/api/ocr/upload'), {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('OCR processing failed');
            }

            // Step 2: AI 재배치
            setProcessingMessage('🤖 AI가 데이터 재배치 중...');

            const data = await response.json();

            if (data.status === 'success' && data.csv_data) {
                // Step 3: CSV 파싱
                setProcessingMessage('✅ CSV 변환 완료!');

                // Parse CSV data
                Papa.parse(data.csv_data, {
                    header: false,
                    dynamicTyping: true,
                    skipEmptyLines: false,
                    complete: (results) => {
                        const rows = results.data as any[][];
                        if (rows && rows.length > 0) {
                            setFile(imageFile);
                            setRawRows(rows);
                            setCsvRawData(data.csv_data);

                            // Parse again for raw strings
                            Papa.parse(data.csv_data, {
                                header: false,
                                dynamicTyping: false,
                                skipEmptyLines: false,
                                complete: (rawResults) => {
                                    setRawRowsStrings(rawResults.data as any[][]);
                                    setUploadStatus('success');
                                    setProcessingMessage('');
                                }
                            });
                        } else {
                            throw new Error("데이터가 비어있거나 형식이 올바르지 않습니다.");
                        }
                        setIsProcessing(false);
                    },
                    error: (err: Error) => {
                        throw new Error(err.message);
                    }
                });
            } else {
                throw new Error(data.message || 'OCR failed');
            }
        } catch (err: any) {
            setUploadStatus('error');
            setIsProcessing(false);
            setProcessingMessage('');
            alert(`OCR 오류: ${err.message}`);
        }
    }, [setFile, setRawRows, setCsvRawData]);

    const { getRootProps: getImageProps, getInputProps: getImageInputProps, isDragActive: isImageActive } = useDropzone({
        onDrop: onImageDrop,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
        maxFiles: 1, multiple: false
    });

    const handleAddUnit = () => {
        // Extract data for this unit
        const headerCells = rawRows[headerRow];
        const dataRows = rawRows.slice(dataStart, dataEnd + 1);
        const colSlice = headerCells.slice(colRange[0], colRange[1] + 1);

        // Make column names unique (fix duplicate names)
        const columnCounts = new Map<string, number>();
        const unitColumns = colSlice.map((h, i) => {
            let colName = String(h || `Column_${colRange[0] + i}`);

            // If column name already exists, append number
            if (columnCounts.has(colName)) {
                const count = columnCounts.get(colName)! + 1;
                columnCounts.set(colName, count);
                colName = `${colName}_${count}`;
            } else {
                columnCounts.set(colName, 1);
            }

            return colName;
        });

        const unitData = dataRows.map(row => {
            const rowData: any = {};
            unitColumns.forEach((col, idx) => {
                const val = row[colRange[0] + idx];
                rowData[col] = val;
            });
            return rowData;
        });

        // Also extract raw strings for sig-fig counting
        const rawRowsRange = rawRowsStrings.slice(dataStart, dataEnd + 1);
        const unitRawStrings: Record<string, string[]> = {};
        unitColumns.forEach((col, idx) => {
            unitRawStrings[col] = rawRowsRange.map(row => String(row[colRange[0] + idx] || ''));
        });

        addUnit({
            name: unitName || `실험 단위 ${units.length + 1}`,
            fileId: 'current-file',
            headerRow,
            dataStart,
            dataEnd,
            columnRange: colRange,
            excludedColumns: [],
            columns: unitColumns,
            data: unitData,
            rawStrings: unitRawStrings,
            charts: [], // Initialize with empty charts
            derivedVariables: [],
            activeChartId: null
        });

        setUnitName(`실험 단위 ${units.length + 2}`);
    };

    // At least one analysis unit is required before moving on to Step 2
    const canStart = units.length > 0;
    const startAnalysis = () => {
        if (!canStart) return;
        setActiveStep('analysis');
        navigate('/visualize');
    };

    if (uploadStatus === 'success' && rawRows.length > 0) {
        return (
            <div className="fixed inset-0 bg-slate-50 flex flex-col z-[100] animate-in fade-in duration-500 overflow-hidden">
                {/* 1. Global Header */}
                <header className="min-h-16 bg-white border-b border-slate-200 px-3 md:px-8 py-2 md:py-0 flex flex-wrap items-center justify-between gap-2 shadow-sm z-20">
                    <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
                        <div className="bg-blue-600 text-white p-2 rounded-xl shrink-0">
                            <FileSpreadsheet size={20} />
                        </div>
                        <h1 className="font-black text-slate-800 tracking-tight text-sm md:text-base whitespace-nowrap">분석 범위 선택</h1>
                        {isSample && (
                            <span className="flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 text-xs font-black whitespace-nowrap">
                                <FlaskConical size={14} />
                                <span className="hidden sm:inline">샘플 데이터로 체험 중</span>
                                <span className="sm:hidden">샘플</span>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3 md:space-x-4 ml-auto">
                        <button
                            onClick={resetWorkspace}
                            className="text-sm md:text-base text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap"
                        >
                            파일 다시 올리기
                        </button>
                        <button
                            onClick={startAnalysis}
                            disabled={!canStart}
                            title={canStart ? undefined : '분석 대상을 1개 이상 추가해야 진행할 수 있습니다'}
                            className={`hidden md:flex btn-primary px-8 py-2.5 rounded-xl shadow-lg transition-all font-black items-center space-x-2 whitespace-nowrap ${canStart ? 'shadow-blue-500/20 active:scale-95' : 'opacity-50 grayscale cursor-not-allowed'}`}
                        >
                            {canStart ? (
                                <>
                                    <span>{units.length}개 분석 시작</span>
                                    <Play size={16} fill="currentColor" />
                                </>
                            ) : (
                                <>
                                    <Lock size={16} />
                                    <span>분석 대상을 먼저 추가하십시오</span>
                                </>
                            )}
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
                    {/* 2. Left Side: Interactive Grid (Playground) */}
                    <div className="flex-none h-[65vh] md:h-auto md:flex-1 flex flex-col overflow-hidden bg-white border-b md:border-b-0 md:border-r border-slate-200">
                        <div className="p-3 md:p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200 flex flex-col space-y-3 md:space-y-4">
                            {/* Step Guide: step 3 (add at least one unit) is required before Step 2 */}
                            <ol className="bg-white rounded-2xl border-2 border-blue-100 px-3 py-2.5 md:px-4 md:py-3 shadow-sm flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-bold text-slate-500">
                                <li className="flex items-center gap-1.5 whitespace-nowrap">
                                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                                    헤더 행 지정
                                </li>
                                <li aria-hidden className="text-slate-300"><ChevronRight size={14} /></li>
                                <li className="flex items-center gap-1.5 whitespace-nowrap">
                                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
                                    데이터 범위 지정
                                </li>
                                <li aria-hidden className="text-slate-300"><ChevronRight size={14} /></li>
                                {canStart ? (
                                    <li className="flex items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check size={12} strokeWidth={3} /></span>
                                        분석 대상 {units.length}개 추가됨
                                    </li>
                                ) : (
                                    <li className="flex items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-700">
                                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">3</span>
                                        분석 대상으로 추가
                                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-black">필수</span>
                                    </li>
                                )}
                                <li aria-hidden className="text-slate-300"><ChevronRight size={14} /></li>
                                <li className={`flex items-center gap-1.5 whitespace-nowrap ${canStart ? 'text-blue-600' : 'text-slate-300'}`}>
                                    <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${canStart ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>4</span>
                                    분석 시작
                                </li>
                            </ol>

                            {/* Mobile actions: in the page flow right under the guide (no fixed bar) */}
                            <div className="md:hidden flex items-center gap-2">
                                <button
                                    onClick={handleAddUnit}
                                    className={`flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all ${canStart ? 'bg-slate-800 text-white' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'}`}
                                >
                                    <Plus size={16} />
                                    분석 대상으로 추가
                                </button>
                                <button
                                    onClick={startAnalysis}
                                    disabled={!canStart}
                                    className={`flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1.5 transition-all ${canStart ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                >
                                    {canStart ? (
                                        <>
                                            {units.length}개 분석 시작
                                            <Play size={14} fill="currentColor" />
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={14} />
                                            추가 후 진행 가능
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Mode Selector - Enhanced */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2 shrink-0">
                                        <Target className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm font-black text-slate-600">작업 모드</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">
                                        {selectionMode === 'header' && '헤더 행을 클릭하십시오'}
                                        {selectionMode === 'data' && (touchAnchor !== null
                                            ? <span className="text-emerald-600 font-bold">끝 행을 탭하십시오</span>
                                            : <>
                                                <span className="hidden md:inline">데이터 범위를 드래그하십시오</span>
                                                <span className="md:hidden">시작 행과 끝 행을 차례로 탭하십시오</span>
                                            </>)}
                                        {selectionMode === 'edit' && '수정할 셀을 클릭하십시오'}
                                    </p>
                                </div>
                                <div className="flex w-full md:w-auto bg-white rounded-2xl border-2 border-slate-200 p-1.5 shadow-md">
                                    <button
                                        onClick={() => setSelectionMode('header')}
                                        className={`flex-1 md:flex-none justify-center px-2 md:px-4 py-2 md:py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 md:space-x-2 whitespace-nowrap ${selectionMode === 'header' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Database size={16} />
                                        <span>헤더 선택</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectionMode('data')}
                                        className={`flex-1 md:flex-none justify-center px-2 md:px-4 py-2 md:py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 md:space-x-2 whitespace-nowrap ${selectionMode === 'data' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <MousePointer2 size={16} />
                                        <span>데이터 범위</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectionMode('edit')}
                                        className={`flex-1 md:flex-none justify-center px-2 md:px-4 py-2 md:py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 md:space-x-2 whitespace-nowrap ${selectionMode === 'edit' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Pencil size={16} />
                                        <span>셀 편집</span>
                                    </button>
                                </div>
                            </div>

                            {suggestedBlocks.length > 1 && (
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 py-2 border-t border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Suggested Splits:</span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {suggestedBlocks.map((block, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setColRange(block as [number, number])}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${colRange[0] === block[0] && colRange[1] === block[1] ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200'}`}
                                            >
                                                Trial {idx + 1} (Col {block[0] + 1}~{block[1] + 1})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar relative">
                            <table className="w-full border-separate border-spacing-0">
                                <thead className="sticky top-0 z-10 bg-white">
                                    <tr>
                                        <th className="p-2 border-b border-r border-slate-200 w-12 text-[10px] font-black text-slate-400 uppercase bg-slate-50">#</th>
                                        {rawRows[0].map((_, i) => (
                                            <th key={i} className={`p-3 border-b border-r border-slate-200 text-left text-[10px] font-black text-slate-400 uppercase bg-slate-50 ${i >= colRange[0] && i <= colRange[1] ? 'bg-blue-50/50' : ''}`}>
                                                Col {i + 1}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rawRows.map((row, idx) => {
                                        const isHeader = idx === headerRow;
                                        const isStart = idx === dataStart;
                                        const isEnd = idx === dataEnd;
                                        const isData = idx >= dataStart && idx <= dataEnd;

                                        const handleMouseDown = () => {
                                            // Touch taps also emit compat mouse events; those are handled in handleTap
                                            if (lastPointerTypeRef.current !== 'mouse') return;
                                            if (selectionMode === 'header') {
                                                setHeaderRow(idx);
                                            } else if (selectionMode === 'data') {
                                                setIsDragging(true);
                                                setDragAnchor(idx);
                                                setDataStart(idx);
                                                setDataEnd(idx);
                                            }
                                        };

                                        const handleMouseEnter = () => {
                                            if (isDragging && dragAnchor !== null) {
                                                const start = Math.min(dragAnchor, idx);
                                                const end = Math.max(dragAnchor, idx);
                                                setDataStart(start);
                                                setDataEnd(end);
                                            }
                                        };

                                        const handleMouseUp = () => {
                                            if (isDragging) {
                                                setIsDragging(false);
                                                setDragAnchor(null);
                                            }
                                        };

                                        // Touch: drag would scroll the table, so tap the start row, then the end row
                                        const handleTap = (e: React.PointerEvent) => {
                                            if (e.pointerType === 'mouse') return;
                                            if (selectionMode === 'header') {
                                                setHeaderRow(idx);
                                            } else if (selectionMode === 'data') {
                                                if (touchAnchor === null) {
                                                    setTouchAnchor(idx);
                                                    setDataStart(idx);
                                                    setDataEnd(idx);
                                                } else {
                                                    setDataStart(Math.min(touchAnchor, idx));
                                                    setDataEnd(Math.max(touchAnchor, idx));
                                                    setTouchAnchor(null);
                                                }
                                            }
                                        };

                                        return (
                                            <tr
                                                key={idx}
                                                onPointerDown={(e) => { lastPointerTypeRef.current = e.pointerType; }}
                                                onPointerUp={handleTap}
                                                onMouseDown={handleMouseDown}
                                                onMouseEnter={handleMouseEnter}
                                                onMouseUp={handleMouseUp}
                                                className={`group transition-all select-none cursor-pointer relative 
                                                    ${isHeader ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl z-20' : ''} 
                                                    ${isStart && !isHeader ? 'border-t-4 border-t-emerald-500' : ''} 
                                                    ${isEnd && !isHeader ? 'border-b-4 border-b-red-500' : ''} 
                                                    ${isData && !isHeader ? 'bg-emerald-50/50' : ''} 
                                                    ${!isHeader && !isData ? 'hover:bg-slate-50' : ''}`}
                                            >
                                                {/* Row Number Cell with Labels */}
                                                <td className={`p-2 border-b border-r border-slate-100 text-center text-[10px] font-bold ${isHeader ? 'text-white bg-blue-700' : 'text-slate-300'} relative w-16`}>
                                                    <div className="flex items-center justify-center gap-1">
                                                        {isHeader && (
                                                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-black">HEADER</span>
                                                        )}
                                                        {isStart && !isHeader && (
                                                            <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black">시작</span>
                                                        )}
                                                        {isEnd && !isHeader && !isStart && (
                                                            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black">끝</span>
                                                        )}
                                                        {isEnd && isStart && !isHeader && (
                                                            <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black">유일</span>
                                                        )}
                                                        {!isHeader && !isStart && !isEnd && (
                                                            <span>{idx + 1}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Data Cells - Editable on double-click */}
                                                {row.map((cell, cIdx) => {
                                                    const isEditing = editingCell?.row === idx && editingCell?.col === cIdx;
                                                    const isInColRange = cIdx >= colRange[0] && cIdx <= colRange[1];

                                                    return (
                                                        <td
                                                            key={cIdx}
                                                            className={`p-0 border-b border-r border-slate-100 max-w-[200px] text-xs font-mono transition-all 
                                                                ${!isInColRange ? 'opacity-20 grayscale scale-[0.98]' : ''} 
                                                                ${isHeader ? 'font-black border-blue-500' : isData ? 'text-slate-700' : 'text-slate-400'}
                                                                ${isEditing ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                                                        >
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    autoFocus
                                                                    value={editValue}
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    onBlur={() => handleCellSave(idx, cIdx)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleCellSave(idx, cIdx);
                                                                        } else if (e.key === 'Escape') {
                                                                            handleCellCancel();
                                                                        }
                                                                    }}
                                                                    className="w-full h-full px-3 py-2 bg-blue-50 outline-none font-mono text-xs"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className={`px-3 py-2 truncate transition-colors ${selectionMode === 'edit' ? 'cursor-pointer hover:bg-orange-50 hover:ring-2 hover:ring-orange-300 hover:ring-inset' : 'cursor-default'}`}
                                                                    onClick={(e) => {
                                                                        if (selectionMode === 'edit') {
                                                                            e.stopPropagation();
                                                                            handleCellDoubleClick(idx, cIdx, cell);
                                                                        }
                                                                    }}
                                                                    title={selectionMode === 'edit' ? '클릭하여 수정' : undefined}
                                                                >
                                                                    {cell === null || cell === undefined || String(cell).trim() === "" ? (
                                                                        <span className="text-[10px] text-slate-300 font-black opacity-40">-</span>
                                                                    ) : (
                                                                        String(cell)
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Right Side: Analysis Queue Sidebar */}
                    <div className="w-full md:w-80 shrink-0 bg-white flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                                <LayoutGrid size={16} className="mr-2 text-blue-500" />
                                분석 대상 ({units.length})
                            </h2>
                        </div>

                        {/* Current Unit Config */}
                        <div className="p-6 space-y-4 bg-slate-50/50">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">분석 대상 이름</label>
                                <input
                                    type="text"
                                    value={unitName}
                                    onChange={(e) => setUnitName(e.target.value)}
                                    placeholder="단위 이름 (예: 실험 A)"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleAddUnit}
                                className={`hidden md:flex w-full py-3 rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all items-center justify-center space-x-2 ${canStart ? 'bg-slate-800 hover:bg-black text-white shadow-slate-200' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30 ring-4 ring-amber-200'}`}
                            >
                                <Plus size={16} />
                                <span>분석 대상으로 추가</span>
                            </button>
                            {!canStart && (
                                <p className="hidden md:block text-[11px] font-bold text-amber-700 leading-relaxed">
                                    표에서 범위를 지정한 뒤 이 버튼을 누르십시오. 분석 대상이 1개 이상 있어야 다음 단계로 진행할 수 있습니다.
                                </p>
                            )}
                        </div>

                        {/* Queue List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            <AnimatePresence initial={false}>
                                {units.map((unit) => (
                                    <motion.div
                                        key={unit.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="group bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all hover:border-blue-200"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-black text-slate-800 truncate pr-2">{unit.name}</span>
                                            <button
                                                onClick={() => removeUnit(unit.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-full" />
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400">{unit.data.length} pts</span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 rounded-lg p-1.5 text-center">
                                                <div className="text-[8px] font-black text-slate-400 uppercase">Rows</div>
                                                <div className="text-[10px] font-mono font-bold text-slate-700">{unit.headerRow + 1} ~ {unit.dataEnd + 1}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-1.5 text-center">
                                                <div className="text-[8px] font-black text-slate-400 uppercase">Cols</div>
                                                <div className="text-[10px] font-mono font-bold text-slate-700">{unit.columnRange[0] + 1} ~ {unit.columnRange[1] + 1}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {units.length === 0 && (
                                <div className="h-40 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                    <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
                                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed">아직 추가된 분석 대상이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        );
    }


    return (
        <div className="w-full max-w-5xl mx-auto py-4 md:py-12 flex flex-col items-center">
            <div className="text-center mb-6 md:mb-10">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">데이터 가져오기</h2>
                <p className="text-slate-500 font-medium">샘플 데이터로 먼저 체험하거나, 컴퓨터에 저장된 파일이나 종이 실험지를 업로드하십시오.</p>
            </div>

            {canStart && (
                <div className="w-full mb-6 rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-700">이전에 추가한 분석 대상 {units.length}개가 남아 있습니다.</p>
                    <button
                        onClick={startAnalysis}
                        className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all whitespace-nowrap"
                    >
                        그래프 분석으로 이동
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
                {/* Sample Data (for users without their own data) */}
                <motion.button
                    type="button"
                    onClick={loadSampleData}
                    disabled={isProcessing}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="h-full relative overflow-hidden rounded-[2.5rem] border-2 border-dashed border-amber-300 bg-amber-50/60 hover:border-amber-400 cursor-pointer flex flex-col items-center justify-center p-6 md:p-8 text-center transition-all duration-500 shadow-2xl shadow-transparent hover:shadow-amber-500/10 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="absolute top-5 right-6 px-2 py-0.5 bg-amber-500 text-white rounded-md text-[10px] font-black tracking-wider">SAMPLE</span>
                    <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-amber-500/30">
                        <FlaskConical strokeWidth={2.5} size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">샘플 데이터로 체험</h3>
                    <p className="text-sm text-slate-600 font-medium mb-1">실험 데이터가 없으십니까?</p>
                    <p className="text-sm text-slate-500 font-medium mb-6">자유낙하 샘플로 먼저 테스트해 보십시오.</p>
                    <span className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-black shadow-lg shadow-amber-500/30">
                        <Play size={14} fill="currentColor" />
                        샘플로 체험하기
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium mt-4">{SAMPLE_FILE_NAME}</p>
                </motion.button>

                {/* CSV Upload */}
                <div {...getRootProps()} className="outline-none h-full">
                    <input {...getInputProps()} />
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className={`
                            h-full relative overflow-hidden rounded-[2.5rem] border-3 border-dashed cursor-pointer
                            flex flex-col items-center justify-center p-6 md:p-8 text-center
                            transition-all duration-500 shadow-2xl shadow-transparent hover:shadow-blue-500/10
                            ${isDragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-blue-300'}
                        `}
                    >
                        <AnimatePresence mode='wait'>
                            {isProcessing ? (
                                <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6" />
                                    <h3 className="text-xl font-black text-slate-800">CSV 패턴 분석 중...</h3>
                                </motion.div>
                            ) : (
                                <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-blue-500/30">
                                        <Upload strokeWidth={3} size={28} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2">CSV 파일 업로드</h3>
                                    <p className="text-sm text-slate-400 font-medium mb-8">MBL, 엑셀 등 데이터 파일 기반</p>
                                    <div className="flex justify-center gap-2">
                                        <span className="px-2 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-tight">Smart Split</span>
                                        <span className="px-2 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-tight">CSV Parsing</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* OCR Image Upload */}
                <div {...getImageProps()} className="outline-none h-full">
                    <input {...getImageInputProps()} />
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className={`
                            h-full relative overflow-hidden rounded-[2.5rem] border-3 border-dashed cursor-pointer
                            flex flex-col items-center justify-center p-6 md:p-8 text-center
                            transition-all duration-500 shadow-2xl shadow-transparent hover:shadow-emerald-500/10
                            ${isImageActive ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-emerald-300'}
                        `}
                    >
                        <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                                <Camera strokeWidth={3} size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">실험 사진 업로드 (OCR)</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8">종이에 적힌 수동 측정 데이터 기반</p>

                            {/* Processing Message */}
                            {isProcessing && processingMessage && (
                                <div className="mb-6 py-3 px-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                                    <p className="text-sm text-purple-700 font-bold animate-pulse">
                                        {processingMessage}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-center gap-2">
                                <span className="px-2 py-1 bg-emerald-100 rounded-lg text-[9px] font-black text-emerald-600 uppercase tracking-tight">Vision AI</span>
                                <span className="px-2 py-1 bg-emerald-100 rounded-lg text-[9px] font-black text-emerald-600 uppercase tracking-tight">Auto CSV</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );

    function resetWorkspace() {
        setIsSample(false);
        setUploadStatus('idle');
        setFile(null);
        setRawRows([]);
    }
};

export default SmartDropzone;


