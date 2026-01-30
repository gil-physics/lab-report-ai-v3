import { useState, useEffect, useMemo } from 'react';
import { X, Sigma, Check } from 'lucide-react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface MathInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (latex: string, isBlock: boolean) => void;
}

const TEMPLATES = [
    { label: '분수', latex: '\\frac{a}{b}', preview: '\\frac{a}{b}' },
    { label: '제곱근', latex: '\\sqrt{x}', preview: '\\sqrt{x}' },
    { label: '지수', latex: 'x^{n}', preview: 'x^{n}' },
    { label: '아래첨자', latex: 'x_{i}', preview: 'x_{i}' },
    { label: '합', latex: '\\sum_{i=1}^{n}', preview: '\\sum_{i=1}^{n}' },
    { label: '적분', latex: '\\int_{a}^{b}', preview: '\\int_{a}^{b}' },
    { label: '극한', latex: '\\lim_{x \\to \\infty}', preview: '\\lim_{x \\to \\infty}' },
    { label: '벡터', latex: '\\vec{v}', preview: '\\vec{v}' },
    { label: '편미분', latex: '\\frac{\\partial y}{\\partial x}', preview: '\\frac{\\partial y}{\\partial x}' },
    { label: '평균', latex: '\\bar{x}', preview: '\\bar{x}' },
    { label: '델타', latex: '\\Delta x', preview: '\\Delta x' },
    { label: '오차', latex: '\\pm', preview: '\\pm' },
];

export default function MathInputModal({ isOpen, onClose, onInsert }: MathInputModalProps) {
    const [latex, setLatex] = useState('');
    const [isBlock, setIsBlock] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setLatex('');
            setError(null);
            setIsBlock(false);
        }
    }, [isOpen]);

    const preview = useMemo(() => {
        if (!latex.trim()) return null;
        try {
            const html = katex.renderToString(latex, {
                throwOnError: true,
                displayMode: isBlock,
            });
            setError(null);
            return html;
        } catch (e: any) {
            setError(e.message || 'Invalid LaTeX');
            return null;
        }
    }, [latex, isBlock]);

    const insertTemplate = (templateLatex: string) => {
        setLatex(prev => prev + templateLatex);
    };

    const handleInsert = () => {
        if (latex.trim() && !error) {
            onInsert(latex, isBlock);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                            <Sigma size={20} />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-800">수식 입력</h2>
                            <p className="text-xs text-slate-500">LaTeX 문법으로 수식을 작성하세요</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Templates */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">템플릿</label>
                        <div className="flex gap-2 flex-wrap">
                            {TEMPLATES.map(({ label, latex: t, preview: p }) => (
                                <button
                                    key={label}
                                    onClick={() => insertTemplate(t)}
                                    className="px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-slate-200"
                                    title={t}
                                >
                                    <span
                                        className="text-xs"
                                        dangerouslySetInnerHTML={{
                                            __html: katex.renderToString(p, { throwOnError: false })
                                        }}
                                    />
                                    <span className="text-slate-400 text-xs">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">LaTeX 수식</label>
                        <textarea
                            value={latex}
                            onChange={(e) => setLatex(e.target.value)}
                            placeholder="예: \frac{1}{2}mv^2 = mgh"
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-mono transition-colors resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Block Mode Toggle */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-slate-600">표시 방식:</label>
                        <button
                            onClick={() => setIsBlock(false)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!isBlock ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                        >
                            인라인 ($...$)
                        </button>
                        <button
                            onClick={() => setIsBlock(true)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isBlock ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                        >
                            블록 ($$...$$)
                        </button>
                    </div>

                    {/* Preview */}
                    <div>
                        <label className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">미리보기</label>
                        <div className={`bg-slate-50 rounded-xl p-4 min-h-[60px] border-2 ${error ? 'border-red-200' : 'border-slate-100'} flex items-center justify-center`}>
                            {error ? (
                                <span className="text-red-500 text-sm">{error}</span>
                            ) : preview ? (
                                <div
                                    dangerouslySetInnerHTML={{ __html: preview }}
                                    className={isBlock ? 'text-center' : ''}
                                />
                            ) : (
                                <span className="text-slate-300 text-sm">수식을 입력하면 미리보기가 표시됩니다</span>
                            )}
                        </div>
                    </div>

                    {/* Insert Button */}
                    <button
                        onClick={handleInsert}
                        disabled={!latex.trim() || !!error}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={20} />
                        수식 삽입
                    </button>
                </div>
            </div>
        </div>
    );
}
