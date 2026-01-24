import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, AlertCircle, FileSpreadsheet, Database,
    LayoutGrid, Plus, Trash2, ChevronRight,
    Target, Flag, Play, Anchor, MousePointer2, Camera
} from 'lucide-react';
import Papa from 'papaparse';
import { useAnalysis } from '../../context/AnalysisContext';
import { analyzeTypeUniformity, detectParallelBlocks } from '../../lib/physicsKeywords';
import { useNavigate } from 'react-router-dom';

type SelectionMode = 'header' | 'data';

const SmartDropzone: React.FC = () => {
    const navigate = useNavigate();
    const {
        setFile, setRawRows, rawRows, units, addUnit, removeUnit,
        setActiveStep
    } = useAnalysis();

    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

    // --- Initialization ---
    useEffect(() => {
        if (rawRows.length > 0) {
            const { headerCandidate, dataStartCandidate } = analyzeTypeUniformity(rawRows);
            const splits = detectParallelBlocks(rawRows, headerCandidate);

            setHeaderRow(headerCandidate);
            setDataStart(dataStartCandidate);
            setDataEnd(rawRows.length - 1);
            setSuggestedBlocks(splits);

            if (splits.length > 0) {
                setColRange(splits[0] as [number, number]);
            } else {
                setColRange([0, rawRows[0].length - 1]);
            }

            setUnitName(`실험 단위 ${units.length + 1}`);
        }
    }, [rawRows.length]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsProcessing(true);
        setUploadStatus('idle');

        try {
            const text = await file.text();
            Papa.parse(text, {
                header: false,
                dynamicTyping: true,
                skipEmptyLines: false,
                complete: (results) => {
                    const rows = results.data as any[][];
                    if (rows && rows.length > 0) {
                        setFile(file);
                        setRawRows(rows);
                        setUploadStatus('success');
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
    }, [setFile, setRawRows]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
        maxFiles: 1, multiple: false, disabled: uploadStatus === 'success'
    });

    const handleAddUnit = () => {
        // Extract data for this unit
        const headerCells = rawRows[headerRow];
        const dataRows = rawRows.slice(dataStart, dataEnd + 1);
        const colSlice = headerCells.slice(colRange[0], colRange[1] + 1);

        const unitColumns = colSlice.map((h, i) => String(h || `Column_${colRange[0] + i}`));
        const unitData = dataRows.map(row => {
            const rowSlice = row.slice(colRange[0], colRange[1] + 1);
            const obj: any = {};
            unitColumns.forEach((col, i) => {
                obj[col] = rowSlice[i];
            });
            return obj;
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
            charts: [], // Initialize with empty charts
            derivedVariables: [],
            activeChartId: null
        });

        setUnitName(`실험 단위 ${units.length + 2}`);
    };

    const resetWorkspace = () => {
        setUploadStatus('idle');
        setFile(null);
        setRawRows([]);
    };

    const onImageDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        // OCR Logic will go here
        alert("OCR 기능은 현재 준비 중입니다! 이미지가 정상적으로 감지되었습니다.");
    }, []);

    const { getRootProps: getImageProps, getInputProps: getImageInputProps, isDragActive: isImageActive } = useDropzone({
        onDrop: onImageDrop,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
        maxFiles: 1, multiple: false
    });

    if (uploadStatus === 'success' && rawRows.length > 0) {
        return (
            <div className="fixed inset-0 bg-slate-50 flex flex-col z-[100] animate-in fade-in duration-500 overflow-hidden">
                {/* 1. Global Header */}
                <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-20">
                    <div className="flex items-center space-x-4">
                        <div className="bg-blue-600 text-white p-2 rounded-xl">
                            <FileSpreadsheet size={20} />
                        </div>
                        <h1 className="font-black text-slate-800 tracking-tight">지능형 실험단위 추출기</h1>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center space-x-2 text-sm font-bold text-slate-500">
                            <span className="bg-slate-100 px-3 py-1 rounded-lg">Row Slicing</span>
                            <ChevronRight size={14} />
                            <span className="text-blue-600">Unit Definition</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={resetWorkspace}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            파일 다시 올리기
                        </button>
                        <button
                            onClick={() => {
                                if (units.length === 0) {
                                    alert("분석할 실험 단위를 하나 이상 추가해주세요!");
                                    return;
                                }
                                setActiveStep('analysis');
                                navigate('/visualize');
                            }}
                            className={`btn-primary px-8 py-2.5 rounded-xl shadow-lg transition-all font-black flex items-center space-x-2 ${units.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-blue-500/20 active:scale-95'}`}
                        >
                            <span>{units.length}개 유닛 분석 시작</span>
                            <Play size={16} fill="currentColor" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden">
                    {/* 2. Left Side: Interactive Grid (Playground) */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white border-r border-slate-200">
                        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center space-x-2">
                                        <Target className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Slicing Playground</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium">헤더는 클릭해서, 데이터 범위는 드래그해서 선택하세요.</p>
                                </div>
                                <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                                    <button
                                        onClick={() => setSelectionMode('header')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center space-x-1.5 ${selectionMode === 'header' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Database size={12} />
                                        <span>SET HEADER</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectionMode('data')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center space-x-1.5 ${selectionMode === 'data' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <MousePointer2 size={12} />
                                        <span>DRAG DATA</span>
                                    </button>
                                </div>
                            </div>

                            {suggestedBlocks.length > 1 && (
                                <div className="flex items-center space-x-3 py-2 border-t border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Suggested Splits:</span>
                                    <div className="flex items-center space-x-2">
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

                                        return (
                                            <tr
                                                key={idx}
                                                onMouseDown={handleMouseDown}
                                                onMouseEnter={handleMouseEnter}
                                                onMouseUp={handleMouseUp}
                                                className={`group transition-all select-none cursor-pointer relative ${isHeader ? 'bg-blue-600 text-white shadow-xl z-20' : isData ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className={`p-2 border-b border-r border-slate-100 text-center text-[10px] font-bold ${isHeader ? 'text-white' : 'text-slate-300'} relative w-12`}>
                                                    <span className={isHeader || isStart || isEnd ? 'opacity-0' : 'opacity-100'}>{idx + 1}</span>
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        {isHeader && <Database size={12} className="text-white" />}
                                                        {isStart && <Flag size={12} className="text-emerald-600" />}
                                                        {isEnd && <Anchor size={12} className="text-red-600" />}
                                                    </div>
                                                </td>
                                                {row.map((cell, cIdx) => (
                                                    <td
                                                        key={cIdx}
                                                        className={`p-3 border-b border-r border-slate-100 truncate max-w-[200px] text-xs font-mono transition-all ${cIdx < colRange[0] || cIdx > colRange[1] ? 'opacity-20 grayscale scale-[0.98]' : ''} ${isHeader ? 'font-black border-blue-500' : isData ? 'text-slate-700' : 'text-slate-400'}`}
                                                    >
                                                        {cell === null || cell === undefined || String(cell).trim() === "" ? (
                                                            <span className="text-[10px] text-slate-300 font-black opacity-40">X</span>
                                                        ) : (
                                                            String(cell)
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Right Side: Analysis Queue Sidebar */}
                    <div className="w-80 bg-white flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                                <LayoutGrid size={16} className="mr-2 text-blue-500" />
                                Analysis Units ({units.length})
                            </h2>
                        </div>

                        {/* Current Unit Config */}
                        <div className="p-6 space-y-4 bg-slate-50/50">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">New Unit Name</label>
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
                                className="w-full bg-slate-800 hover:bg-black text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center space-x-2"
                            >
                                <Plus size={16} />
                                <span>분석 대상으로 추가</span>
                            </button>
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
                                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">추가된 실험 단위가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

        </div >
    );
};

export default SmartDropzone;


