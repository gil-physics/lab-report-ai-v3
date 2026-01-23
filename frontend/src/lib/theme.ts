export type StepTheme = {
    id: number;
    name: string;
    primary: string;
    light: string;
    ring: string;
    text: string;
};

export const STEP_THEMES: Record<number, StepTheme> = {
    1: {
        id: 1,
        name: 'Analysis',
        primary: 'bg-blue-600',
        light: 'bg-blue-50',
        ring: 'ring-blue-100',
        text: 'text-blue-600',
    },
    2: {
        id: 2,
        name: 'Visualization',
        primary: 'bg-violet-600',
        light: 'bg-violet-50',
        ring: 'ring-violet-100',
        text: 'text-violet-600',
    },
    3: {
        id: 3,
        name: 'Report',
        primary: 'bg-emerald-600',
        light: 'bg-emerald-50',
        ring: 'ring-emerald-100',
        text: 'text-emerald-600',
    },
};

export const getTheme = (step: number) => STEP_THEMES[step] || STEP_THEMES[1];
