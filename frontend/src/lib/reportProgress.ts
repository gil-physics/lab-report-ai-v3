import { useEffect, useState } from 'react';

// The server builds the whole report in a single request, so there is no real
// progress to read. Progress is estimated from elapsed time: it rises quickly at
// first, slows down, and stays below 95% until the response actually arrives.
const TYPICAL_SECONDS = 25;
const MAX_ESTIMATE = 95;

export const REPORT_STAGES = [
    { label: '실험 데이터 정리', until: 12 },
    { label: '그래프 생성 및 저장', until: 28 },
    { label: 'AI 고찰 작성', until: 90 },
    { label: '보고서 마무리', until: 100 },
];

export function estimateReportPercent(elapsedSeconds: number): number {
    const percent = 5 + 90 * (1 - Math.exp(-elapsedSeconds / (TYPICAL_SECONDS / 2.5)));
    return Math.min(MAX_ESTIMATE, Math.round(percent));
}

export function useReportProgress(startedAt: number | null, active: boolean) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!active) return;
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(timer);
    }, [active, startedAt]);

    const elapsedSeconds = active && startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
    const percent = active ? estimateReportPercent(elapsedSeconds) : 0;
    const stageIndex = Math.max(0, REPORT_STAGES.findIndex(s => percent < s.until));

    return { percent, stageIndex, elapsedSeconds: Math.floor(elapsedSeconds) };
}
