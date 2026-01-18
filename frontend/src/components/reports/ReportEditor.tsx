import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Edit3, Eye, Printer, RotateCcw, Save, Trash2, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ReportEditorProps {
    markdown: string;
    setMarkdown: (md: string) => void;
    onBack: () => void;
    onPrint: () => void;
    onReset: () => void;
    isPreview: boolean;
    setIsPreview: (v: boolean) => void;
}

// Regex to find Markdown images with base64 data
const IMAGE_REGEX = /!\[(.*?)\]\((data:image\/[a-zA-Z]*;base64,[^)]+)\)/g;
// Regex to find placeholders
const PLACEHOLDER_REGEX = /!\[(.*?)\]\(image:([a-zA-Z0-9_-]+)\)/g;

const ReportEditor: React.FC<ReportEditorProps> = ({
    markdown,
    setMarkdown,
    onBack,
    onPrint,
    onReset,
    isPreview,
    setIsPreview
}) => {
    // Local state for the editor to avoid laggy base64 updates
    const [displayMarkdown, setDisplayMarkdown] = useState('');
    const imageMapRef = useRef<Record<string, string>>({});
    const isInitialLoad = useRef(true);

    // Initial Processing: Convert Base64 to placeholders
    useEffect(() => {
        if (isInitialLoad.current && markdown) {
            const map: Record<string, string> = {};
            let count = 1;

            const shortened = markdown.replace(IMAGE_REGEX, (_match, alt, base64) => {
                const id = `img_${count++}`;
                map[id] = base64;
                return `![${alt}](image:${id})`;
            });

            imageMapRef.current = map;
            setDisplayMarkdown(shortened);
            isInitialLoad.current = false;
        } else if (isInitialLoad.current && !markdown) {
            setDisplayMarkdown('');
            isInitialLoad.current = false;
        }
    }, [markdown]);

    // Expand placeholders back to Base64 for rendering and saving
    const expandedMarkdown = useMemo(() => {
        return displayMarkdown.replace(PLACEHOLDER_REGEX, (_match, alt, id) => {
            const base64 = imageMapRef.current[id];
            return base64 ? `![${alt}](${base64})` : _match;
        });
    }, [displayMarkdown]);

    // Sync with parent (with debounce to prevent lag)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isInitialLoad.current) {
                setMarkdown(expandedMarkdown);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [expandedMarkdown, setMarkdown]);

    const handlePrint = () => {
        // Ensure parent has the latest before printing
        setMarkdown(expandedMarkdown);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Custom Markdown components for scientific report styling
    const MarkdownComponents = {
        h1: ({ ...props }) => <h1 className="text-3xl font-bold border-b-2 border-gray-900 pb-2 mb-6 mt-8 text-center" {...props} />,
        h2: ({ ...props }) => <h2 className="text-2xl font-bold border-b border-gray-400 pb-1 mb-4 mt-8" {...props} />,
        h3: ({ ...props }) => <h3 className="text-xl font-bold mb-3 mt-6" {...props} />,
        table: ({ ...props }) => (
            <div className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse border-2 border-gray-400" {...props} />
            </div>
        ),
        thead: ({ ...props }) => <thead className="bg-gray-50" {...props} />,
        tbody: ({ ...props }) => <tbody {...props} />,
        tr: ({ ...props }) => <tr className="border-b border-gray-300" {...props} />,
        th: ({ ...props }) => <th className="bg-gray-100 border border-gray-400 px-4 py-2 font-bold text-left" {...props} />,
        td: ({ ...props }) => <td className="border border-gray-300 px-4 py-2 text-left" {...props} />,
        p: ({ ...props }) => <p className="mb-4 leading-relaxed text-gray-800" {...props} />,
        img: ({ ...props }) => {
            const { src, alt } = props;
            // Handle scientific notation or custom IDs if needed
            return (
                <span className="flex flex-col items-center my-8 page-break-inside-avoid">
                    <img
                        src={src}
                        alt={alt}
                        className="max-w-full h-auto rounded shadow-sm border border-gray-200"
                        style={{ maxHeight: '400px' }}
                    />
                    {alt && <span className="mt-3 text-sm text-gray-500 font-medium italic block text-center">〈 {alt} 〉</span>}
                </span>
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Editor Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm no-print">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        돌아가기
                    </button>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h2 className="font-bold text-gray-800">보고서 편집기</h2>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
                        <button
                            onClick={() => setIsPreview(false)}
                            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${!isPreview ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            <Edit3 className="w-4 h-4 mr-2" />
                            편집
                        </button>
                        <button
                            onClick={() => setIsPreview(true)}
                            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${isPreview ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            미리보기
                        </button>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="flex items-center bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        인쇄 / PDF 저장
                    </button>

                    <button
                        onClick={onReset}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="초기화"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Markdown Input */}
                {!isPreview && (
                    <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white no-print">
                        <div className="px-6 py-3 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-gray-100">
                            <span className="flex items-center">
                                <ImageIcon className="w-3 h-3 mr-1.5 text-blue-500" />
                                이미지 데이터는 간략한 주소로 표시됨
                            </span>
                            <span>Editor active</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scroll">
                            <textarea
                                className="w-full min-h-full p-4 font-mono text-sm resize-none focus:outline-none leading-relaxed text-gray-800"
                                value={displayMarkdown}
                                onChange={(e) => setDisplayMarkdown(e.target.value)}
                                placeholder="# 보고서 내용을 입력하세요..."
                            />
                        </div>
                    </div>
                )}

                {/* Live Preview / Rendered View */}
                <div className={`flex-1 overflow-y-auto bg-gray-100 flex justify-center custom-scroll ${isPreview ? 'w-full' : 'w-1/2'}`}>
                    <div className="w-full max-w-[21cm] bg-white min-h-[29.7cm] shadow-2xl p-[2cm] scientific-report my-12">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={MarkdownComponents}
                            urlTransform={(value) => value}
                        >
                            {expandedMarkdown}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>

            {/* Print Only Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    html, body { background: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
                    .scientific-report { 
                        box-shadow: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        min-height: 0 !important;
                        display: block !important;
                    }
                    .flex, .flex-1 { display: block !important; overflow: visible !important; }
                    div { overflow: visible !important; }
                    .page-break-inside-avoid { page-break-inside: avoid; }
                    pre, blockquote, table, img { page-break-inside: avoid; }
                }
                .scientific-report h1, .scientific-report h2 { font-family: serif; }
                .scientific-report { color: #1a1a1a; font-family: 'Times New Roman', serif; }
            `}</style>
        </div>
    );
};

export default ReportEditor;
