import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone'; // Removed 'FileRejection', 'DropEvent' if not used
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileDown, AlertCircle, FileSpreadsheet, Database } from 'lucide-react'; // Added Database, removed CheckCircle2
import Papa from 'papaparse';
import { useAnalysis } from '../../context/AnalysisContext';

const SmartDropzone: React.FC = () => {
    const { setFile, setParsedData } = useAnalysis();
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsProcessing(true);
        setUploadStatus('idle');

        // Simulate "Analysis" delay for effect
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const text = await file.text();
            Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const data = results.data as any[];
                    if (data && data.length > 0) {
                        setFile(file);
                        setParsedData(data);
                        setUploadStatus('success');
                        // No logic here to check validity deeply, just parsing

                        // Play success sound logic could go here
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
            setErrorMessage(err.message || '파일 업로드 실패');
            setUploadStatus('error');
            setIsProcessing(false);
        }
    }, [setFile, setParsedData]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv']
        },
        maxFiles: 1,
        multiple: false
    });

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div {...getRootProps()} className="outline-none">
                <input {...getInputProps()} />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`
                        relative overflow-hidden rounded-3xl border-3 border-dashed cursor-pointer
                        flex flex-col items-center justify-center p-12 text-center
                        transition-all duration-300
                        ${isDragActive
                            ? 'border-blue-500 bg-blue-50/80 scale-105 shadow-2xl shadow-blue-500/10'
                            : uploadStatus === 'error'
                                ? 'border-red-300 bg-red-50/50 hover:border-red-400'
                                : 'border-slate-200 bg-white/60 hover:border-blue-400 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5'
                        }
                    `}
                >

                    <AnimatePresence mode='wait'>
                        {isProcessing ? (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center"
                            >
                                <div className="relative w-24 h-24 mb-6">
                                    <motion.div
                                        className="absolute inset-0 border-4 border-slate-100 rounded-full"
                                    />
                                    <motion.div
                                        className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                                        <FileDown className="w-8 h-8 animate-bounce" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">데이터 구조 분석 중...</h3>
                                <p className="text-slate-500 mt-2">CSV 파일의 무결성을 확인하고 있습니다.</p>
                            </motion.div>
                        ) : uploadStatus === 'error' ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-red-500"
                            >
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-red-600 mb-1">업로드 실패</h3>
                                <p className="text-red-400 mb-6">{errorMessage}</p>
                                <button className="px-6 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 transition-colors">
                                    다시 시도하기
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="relative z-10"
                            >
                                <div className={`
                                w-24 h-24 rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-lg transition-colors duration-300
                                ${isDragActive ? 'bg-blue-500 text-white rotate-12 scale-110' : 'bg-white text-blue-600'}
                            `}>
                                    <Upload className={`w-10 h-10 ${isDragActive ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
                                </div>

                                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                                    {isDragActive ? "여기에 파일을 놓으세요!" : "실험 데이터 업로드"}
                                </h3>
                                <p className="text-slate-500 text-lg mb-8 max-w-sm mx-auto leading-relaxed">
                                    CSV 파일을 이곳에 드래그하거나<br />
                                    <span className="text-blue-600 font-bold decoration-2 underline-offset-4 hover:underline">클릭하여 선택</span>하세요.
                                </p>

                                <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    <span className="flex items-center bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                                        .CSV Only
                                    </span>
                                    <span className="flex items-center bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                        <Database className="w-3.5 h-3.5 mr-1.5" />
                                        UTF-8 Encoding
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Background Decor */}
                    {!isDragActive && !isProcessing && (
                        <>
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.2] pointer-events-none" />
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />
                        </>
                    )}
                </motion.div>
            </div>

            {/* Empty state nav bar (Back button disabled) */}
            <div className="mt-12">
                {/* NavigationControls will handle its own sticky/static logic */}
                {/* Wait, if SmartDropzone is centered, sticky footer might look weird if content is short. 
                     But the user said "Step 1" is floating. Correcting the parent container is better.
                 */}
            </div>
        </div>
    );
};

export default SmartDropzone;
