import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { getApiUrl } from '../../lib/api';

export default function ReportEditor() {
    const [selectedText, setSelectedText] = useState<string>('');
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        const text = selection?.toString() || '';
        if (text.length > 0) {
            setSelectedText(text);
        }
    };

    const handleAIEdit = async () => {
        if (!prompt.trim()) return;

        setIsProcessing(true);
        try {
            const response = await fetch(getApiUrl('/api/edit/modify'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original_text: selectedText,
                    instruction: prompt,
                    context_before: '',
                    context_after: ''
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Replace selected text with AI result
                alert(`AI 제안:\n\n${data.modified_text}`);
                setShowPromptModal(false);
                setPrompt('');
            }
        } catch (error) {
            alert('AI 편집 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-full p-8">
            <div className="max-w-4xl w-full space-y-6">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-800">AI 보고서 편집기 (간단 버전)</h2>
                    <p className="text-slate-500 mt-2">텍스트를 선택하고 AI로 수정 버튼을 클릭하세요</p>
                </div>

                <div
                    className="border-2 border-slate-200 rounded-xl p-6 min-h-[400px] bg-white"
                    onMouseUp={handleTextSelection}
                >
                    <p className="text-slate-700 leading-relaxed">
                        여기에 보고서 내용이 표시됩니다. 텍스트를 선택하면 AI로 수정할 수 있습니다.
                        <br /><br />
                        예시: "본 실험을 통해 중력가속도를 측정하였다. 결과값은 9.8 m/s²로 나타났다."
                    </p>
                </div>

                {selectedText && (
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => setShowPromptModal(true)}
                            className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg"
                        >
                            <Wand2 size={20} />
                            AI로 수정
                        </button>
                    </div>
                )}

                {showPromptModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                            <h3 className="text-xl font-black text-slate-800 mb-4">AI 수정 지시</h3>

                            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                <p className="text-xs text-slate-500 mb-1">선택한 텍스트:</p>
                                <p className="text-sm text-slate-700">{selectedText}</p>
                            </div>

                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="어떻게 수정할까요? (예: 더 학술적으로 수정, 간결하게 요약)"
                                className="w-full border-2 border-slate-200 rounded-xl p-4 min-h-[100px] mb-4"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPromptModal(false)}
                                    className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleAIEdit}
                                    disabled={isProcessing || !prompt.trim()}
                                    className="flex-1 btn-primary px-4 py-2 rounded-xl font-bold disabled:opacity-50"
                                >
                                    {isProcessing ? '처리 중...' : 'AI 수정 적용'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
