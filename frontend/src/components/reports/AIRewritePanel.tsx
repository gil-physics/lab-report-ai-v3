import { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, Wand2, BookOpen, Scissors, FileText, Check } from 'lucide-react';
import { getApiUrl } from '../../lib/api';

interface AIRewritePanelProps {
    isOpen: boolean;
    onClose: () => void;
    selectedText: string;
    onApply: (newText: string) => void;
}

const PRESETS = [
    { key: 'formal', label: '학술적으로', icon: BookOpen, color: 'bg-blue-500' },
    { key: 'concise', label: '간결하게', icon: Scissors, color: 'bg-emerald-500' },
    { key: 'expand', label: '자세히 설명', icon: FileText, color: 'bg-purple-500' },
    { key: 'grammar', label: '문법 교정', icon: Check, color: 'bg-orange-500' },
];

export default function AIRewritePanel({ isOpen, onClose, selectedText, onApply }: AIRewritePanelProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset when panel opens with new text
    useEffect(() => {
        if (isOpen) {
            setResult(null);
            setError(null);
            setPrompt('');
        }
    }, [isOpen, selectedText]);

    const handleRewrite = async (customPrompt?: string, preset?: string) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(getApiUrl('/api/edit/rewrite'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: selectedText,
                    prompt: customPrompt || prompt || null,
                    preset: preset || null
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                setResult(data.rewritten_text);
            } else {
                setError(data.message || 'Rewrite failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = () => {
        if (result) {
            onApply(result);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-800">AI Rewrite</h2>
                            <p className="text-xs text-slate-500">선택한 텍스트를 AI가 수정합니다</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Original Text */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">원본 텍스트</label>
                        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 max-h-24 overflow-y-auto border border-slate-100">
                            {selectedText || '텍스트를 선택해주세요'}
                        </div>
                    </div>

                    {/* Presets */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">빠른 변환</label>
                        <div className="flex gap-2 flex-wrap">
                            {PRESETS.map(({ key, label, icon: Icon, color }) => (
                                <button
                                    key={key}
                                    onClick={() => handleRewrite(undefined, key)}
                                    disabled={isLoading || !selectedText}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${color} text-white shadow-lg`}
                                >
                                    <Icon size={16} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Prompt */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">또는 직접 입력</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="예: 더 쉽게 설명해주세요, 비유를 추가해주세요..."
                                className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 outline-none text-sm transition-colors"
                                onKeyDown={(e) => e.key === 'Enter' && prompt && handleRewrite()}
                            />
                            <button
                                onClick={() => handleRewrite()}
                                disabled={isLoading || !prompt || !selectedText}
                                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                                변환
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">✨ 변환 결과</label>
                            <div className="bg-emerald-50 rounded-xl p-4 text-sm text-slate-700 border-2 border-emerald-200 max-h-48 overflow-y-auto">
                                {result}
                            </div>
                            <button
                                onClick={handleApply}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg"
                            >
                                <Check size={20} />
                                이 텍스트로 교체하기
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
