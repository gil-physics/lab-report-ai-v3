import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronRight, FileText, Beaker, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../../context/AnalysisContext';
import axios from 'axios';
import { getApiUrl } from '../../lib/api';

const CATEGORIES = [
    { id: 'general', name: '기본 템플릿', icon: FileText, description: '가장 표준적인 물리 실험 보고서 양식' },
    { id: 'physics', name: '연세대학교 실험 템플릿', icon: Beaker, description: '연세대학교 일반물리학 실험 표준 양식 기반' },
    { id: 'free', name: '자유 양식', icon: Sparkles, description: 'AI가 데이터만 보고 자유롭게 작성' },
];

const PHYSICS_TOPICS = [
    { id: '자유낙하와_포물체운동', name: '자유낙하와 포물체운동' },
    { id: '관성모멘트와_각운동량_보존', name: '관성모멘트와 각운동량 보존' },
    { id: '원운동과_구심력', name: '원운동과 구심력' },
    { id: '일과_에너지', name: '일과 에너지' },
    { id: '운동량과_충격량', name: '운동량과 충격량' },
    { id: '단순_조화_운동', name: '단순 조화 운동' },
    { id: '물리_진자_비틀림_진자', name: '물리 진자 및 비틀림 진자' },
    { id: '역학적_파동', name: '역학적 파동' },
    { id: '회전_운동', name: '회전 운동' },
    { id: '축전기와_전기용량', name: '축전기와 전기용량' },
    { id: '전자기유도', name: '전자기유도' },
    { id: '자기력', name: '자기력' },
    { id: '자기장', name: '자기장' },
    { id: '회로', name: '회로 실험' },
    { id: '빛의_간섭과_회절', name: '빛의 간섭과 회절' },
    { id: '마이컬슨_간섭계', name: '마이컬슨 간섭계' },
    { id: '전자의_em', name: '전자의 e/m 측정' },
    { id: '밀리컨_기름방울_실험', name: '밀리컨 기름방울 실험' },
    { id: '학습보조', name: '학습 보조용' },
];

// Cloud Run cuts requests at 300s; give up a little earlier with a clear message
const REPORT_TIMEOUT_MS = 180000;

function describeReportError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
            return '응답 시간이 3분을 넘어 중단했습니다. AI 서버가 혼잡할 수 있으니 잠시 후 다시 시도하십시오.';
        }
        if (!error.response) {
            return '서버에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도하십시오.';
        }
        const message = (error.response.data as any)?.message;
        return message ? `서버 오류: ${message}` : `서버 오류가 발생했습니다 (HTTP ${error.response.status}).`;
    }
    return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
}

interface TemplateSelectorModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function TemplateSelectorModal({ isOpen, onOpenChange }: TemplateSelectorModalProps) {
    const {
        units,
        activeUnit,
        activeChart,
        setGeneratedMarkdown,
        setIsGeneratingReport,
        setGenerationProgress,
        setGenerationStartedAt,
        setGenerationError,
        setGenerationWarnings,
        setPlotUrl
    } = useAnalysis();
    const navigate = useNavigate();
    const [step, setStep] = useState<'category' | 'topic'>('category');

    const handleCategorySelect = (id: string) => {
        if (id === 'physics') {
            setStep('topic');
        } else {
            generateReport(id === 'free' ? 'none' : '기본');
        }
    };

    const generateReport = async (templateId: string) => {
        // Prepare for background generation
        setGeneratedMarkdown('');
        setGenerationError(null);
        setGenerationWarnings([]);
        setGenerationStartedAt(Date.now());
        setIsGeneratingReport(true);
        setGenerationProgress('실험 데이터 정리 중...');

        // Immediate UI feedback
        onOpenChange(false);
        navigate('/report'); // Auto-navigate to report page

        try {
            const items: any[] = [];

            // 🔄 Iterate through all units and all charts within them
            units.forEach(unit => {
                // Calculate enriched data for this unit (derived variables)
                const unitData = unit.data;
                const dvs = unit.derivedVariables;
                const enrichedUnitData = unitData.map(row => {
                    const newRow = { ...row };
                    dvs.forEach(dv => {
                        if (!dv.name || !dv.formula) return;
                        try {
                            const keys = Object.keys(row);
                            const values = keys.map(k => row[k]);
                            // 🔍 Check if keys are valid JS identifiers
                            const isValidIdentifier = (s: string) => /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(s);
                            const safeKeys = keys.filter(isValidIdentifier);
                            if (safeKeys.length === keys.length) {
                                const fn = new Function(...keys, `return ${dv.formula}`);
                                const result = fn(...values);
                                newRow[dv.name] = isNaN(result) ? null : result;
                            } else {
                                // Fallback: just skip for now to avoid crash
                                // Ideally we'd use a parser here
                            }
                        } catch (e) { newRow[dv.name] = null; }
                    });
                    return newRow;
                });

                unit.charts.forEach(chart => {
                    const xKey = chart.xColumn;
                    const yKey = chart.yColumn;

                    // Keep x/y aligned: drop a row unless both values are real numbers
                    // (blank cells must not become 0, and x/y must not be filtered separately)
                    const toNumber = (v: any) => (v === null || v === undefined || String(v).trim() === '') ? NaN : Number(v);
                    const pairs = enrichedUnitData
                        .map(d => [toNumber(d[xKey]), toNumber(d[yKey])])
                        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

                    items.push({
                        experiment_name: `${unit.name} - ${chart.name}`,
                        analysis: unit.backendAnalysis || {}, // Last cached analysis for this unit
                        data: {
                            x: pairs.map(p => p[0]),
                            y: pairs.map(p => p[1]),
                        },
                        x_label: xKey,
                        y_label: yKey,
                        x_range: [chart.xMin, chart.xMax],
                        y_range: [chart.yMin, chart.yMax],
                        is_log_scale: chart.isLogScale
                    });
                });
            });

            if (items.length === 0 && activeUnit && activeChart) {
                // Fallback to active if no charts found (shouldn't happen with current logic)
                // ... (simplified fallback logic if needed)
            }

            setGenerationProgress('AI 고찰 작성 중...');
            const response = await axios.post(getApiUrl('/api/prepare-report-md'), {
                template: templateId,
                items: items,
                use_ai: true
            }, { timeout: REPORT_TIMEOUT_MS });

            if (response.data.status !== 'success') {
                throw new Error(response.data.message || '서버가 보고서를 반환하지 않았습니다.');
            }

            // Set the generated markdown directly (it now includes the graph URL)
            setGeneratedMarkdown(response.data.markdown);
            setGenerationWarnings(response.data.ai_warnings || []);

            // Save the plot URL for the editor commands
            if (response.data.plot_url) {
                setPlotUrl(response.data.plot_url);
            }

            setGenerationProgress('보고서 생성 완료');
        } catch (error) {
            console.error('Report generation failed:', error);
            setGenerationError(describeReportError(error));
            setGenerationProgress('');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="flex flex-col h-[min(600px,85vh)]">
                        {/* Header */}
                        <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                {step === 'topic' && (
                                    <button onClick={() => setStep('category')} className="p-2 hover:bg-white rounded-lg transition-colors">
                                        <ArrowLeft size={18} className="text-slate-400" />
                                    </button>
                                )}
                                <div>
                                    <Dialog.Title className="text-lg font-bold text-slate-900">
                                        {step === 'category' ? '보고서 템플릿 선택' : '실험 주제 선택'}
                                    </Dialog.Title>
                                    <Dialog.Description className="text-xs text-slate-500">
                                        {step === 'category' ? '원하시는 보고서의 형식을 선택해 주십시오.' : '진행하신 실험 주제를 선택해 주십시오.'}
                                    </Dialog.Description>
                                </div>
                            </div>
                            <Dialog.Close className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                                <X size={20} />
                            </Dialog.Close>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
                            {step === 'category' ? (
                                <div className="grid gap-4">
                                    {CATEGORIES.map((cat) => {
                                        const Icon = cat.icon;
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat.id)}
                                                className="flex items-center gap-4 md:gap-6 p-4 md:p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left group"
                                            >
                                                <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <Icon size={28} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{cat.name}</h3>
                                                    <p className="text-sm text-slate-500 mt-1">{cat.description}</p>
                                                </div>
                                                <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                                    {PHYSICS_TOPICS.map((topic) => (
                                        <button
                                            key={topic.id}
                                            onClick={() => generateReport(topic.id)}
                                            className="px-4 py-3 rounded-xl border border-slate-200 text-left hover:border-violet-500 hover:bg-violet-50/30 hover:text-violet-700 transition-all text-sm font-medium flex items-center justify-between group"
                                        >
                                            {topic.name}
                                            <Sparkles size={14} className="opacity-0 group-hover:opacity-100 text-violet-400 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
