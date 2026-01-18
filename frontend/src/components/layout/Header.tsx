import { FileText } from 'lucide-react';

interface HeaderProps {
    useAI: boolean;
    setUseAI: (value: boolean) => void;
    selectedTemplate: string;
    setSelectedTemplate: (value: string) => void;
}

export default function Header({
    useAI,
    setUseAI,
    selectedTemplate,
    setSelectedTemplate
}: HeaderProps) {
    return (
        <header className="glass-card sticky top-0 z-50 border-b border-white/50 shadow-sm flex-shrink-0">
            <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="primary-gradient p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
                        <FileText className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tighter">
                            Lab Report <span className="text-blue-600">AI</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Inteligent Physics Analysis</p>
                    </div>
                </div>
                <div className="flex items-center space-x-6">
                    {/* Use AI Toggle */}
                    <label className="flex items-center cursor-pointer space-x-3 group">
                        <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Gemini AI</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={useAI}
                                onChange={(e) => setUseAI(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${useAI ? 'primary-gradient' : 'bg-slate-200'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useAI ? 'translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <select
                        className="bg-slate-100/50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all cursor-pointer"
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                    >
                        <option value="none">기본 템플릿</option>
                        <option value="관성모멘트와_각운동량_보존">관성모멘트와 각운동량 보존</option>
                        <option value="단순_조화_운동">단순 조화 운동</option>
                        <option value="마이컬슨_간섭계">마이컬슨 간섭계</option>
                        <option value="물리_진자_비틀림_진자">물리 진자 비틀림 진자</option>
                        <option value="밀리컨_기름방울_실험">밀리컨 기름방울 실험</option>
                        <option value="빛의_간섭과_회절">빛의 간섭과 회절</option>
                        <option value="역학적_파동">역학적 파동</option>
                        <option value="운동량과_충격량">운동량과 충격량</option>
                        <option value="원운동과_구심력">원운동과 구심력</option>
                        <option value="일과_에너지">일과 에너지</option>
                        <option value="일반물리학_실험">일반물리학 실험</option>
                        <option value="자기력">자기력</option>
                        <option value="자기장">자기장</option>
                        <option value="자유낙하와_포물체운동">자유낙하와 포물체운동</option>
                        <option value="전자기유도">전자기유도</option>
                        <option value="전자의_em">전자의 e/m</option>
                        <option value="축전기와_전기용량">축전기와 전기용량</option>
                        <option value="학습보조">학습보조</option>
                        <option value="회로">회로</option>
                        <option value="회전_운동">회전 운동</option>
                    </select>
                </div>
            </div>
        </header>
    );
}
