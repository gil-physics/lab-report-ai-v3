export const PHYSICS_KEYWORDS: Record<string, string[]> = {
    "mass": ["질량", "mass", "m_", "m(kg)", "weight", "무게", "m(g)"],
    "velocity": ["속도", "velocity", "v_", "v(m/s)", "speed", "vel"],
    "radius": ["반지름", "radius", "r_", "r(m)", "dist_center"],
    "force": ["힘", "force", "F_", "F(N)", "f(n)"],
    "length": ["길이", "length", "L_", "L(m)", "distance", "l(m)"],
    "time": ["시간", "time", "t_", "t(s)", "duration"],
    "acceleration": ["가속도", "acceleration", "a_", "a(m/s²)", "accel", "a(m/s2)"],
    "period": ["주기", "period", "T_", "T(s)", "cycle"],
    "frequency": ["진동수", "frequency", "f_", "f(Hz)", "freq"],
    "wavelength": ["파장", "wavelength", "lambda", "λ"],
    "displacement": ["변위", "displacement", "x_", "x(m)", "delta_x", "Δx"],
    "current": ["전류", "current", "I_", "I(A)", "ampere", "i(a)"],
    "voltage": ["전압", "voltage", "V_", "V(V)", "potential", "v(v)"],
    "resistance": ["저항", "resistance", "R_", "R(Ω)", "ohm", "r(ω)"],
    "charge": ["전하", "charge", "q_", "q(C)", "coulomb"],
    "magnetic_field": ["자기장", "magnetic", "B_", "B(T)", "field"],
    "moment_of_inertia": ["관성모멘트", "inertia", "I_", "moment"],
    "distance": ["거리", "distance", "d_", "d(m)", "dist"],
    "power": ["전력", "power", "P_", "P(W)", "watt"],
    "momentum": ["운동량", "momentum", "p_", "p(kg·m/s)"],
    "angle": ["각도", "angle", "theta", "θ", "deg", "degree"],
    "temperature": ["온도", "temperature", "T_", "temp"]
};

export type VariableType = keyof typeof PHYSICS_KEYWORDS;

export interface Suggestion {
    columnName: string;
    type: VariableType;
    score: number; // 1: Exact, 2: Contains, 0: No match
}

const X_AXIS_PRIORITY: VariableType[] = ['time', 'angle', 'length', 'temperature', 'displacement'];
const Y_AXIS_PRIORITY: VariableType[] = ['velocity', 'force', 'voltage', 'current', 'acceleration', 'resistance', 'power'];

export function suggestColumns(columns: string[]): { x: string; y: string } {
    let candidatesX: { name: string; score: number }[] = [];
    let candidatesY: { name: string; score: number }[] = [];

    columns.forEach(col => {
        const colLower = col.toLowerCase();
        let maxScoreX = 0;
        let maxScoreY = 0;

        for (const [type, keywords] of Object.entries(PHYSICS_KEYWORDS)) {
            const varType = type as VariableType;
            const isXPrio = X_AXIS_PRIORITY.includes(varType);
            const isYPrio = Y_AXIS_PRIORITY.includes(varType);

            for (const kw of keywords) {
                const kwLower = kw.toLowerCase();
                let baseScore = 0;

                if (colLower === kwLower) baseScore = 100;
                else if (colLower.includes(kwLower)) baseScore = 50;

                if (baseScore > 0) {
                    if (isXPrio) maxScoreX = Math.max(maxScoreX, baseScore + (X_AXIS_PRIORITY.indexOf(varType) * -1));
                    if (isYPrio) maxScoreY = Math.max(maxScoreY, baseScore + (Y_AXIS_PRIORITY.indexOf(varType) * -1));

                    // General fallback score for any match
                    if (!isXPrio && !isYPrio) {
                        maxScoreX = Math.max(maxScoreX, baseScore / 2);
                        maxScoreY = Math.max(maxScoreY, baseScore / 2);
                    }
                }
            }
        }

        if (maxScoreX > 0) candidatesX.push({ name: col, score: maxScoreX });
        if (maxScoreY > 0) candidatesY.push({ name: col, score: maxScoreY });
    });

    candidatesX.sort((a, b) => b.score - a.score);
    candidatesY.sort((a, b) => b.score - a.score);

    let x = candidatesX.length > 0 ? candidatesX[0].name : (columns.length > 0 ? columns[0] : '');
    let y = candidatesY.length > 0 ? candidatesY[0].name : (columns.length > 1 ? columns[1] : (columns.length > 0 ? columns[0] : ''));

    // Ensure X and Y are different if possible
    if (x === y && columns.length > 1) {
        if (candidatesY.length > 1) {
            y = candidatesY[1].name;
        } else if (candidatesX.length > 1) {
            x = candidatesX[1].name;
        } else {
            // Fallback: pick the first available column that isn't X
            y = columns.find(c => c !== x) || y;
        }
    }

    return { x, y };
}

/**
 * 📊 Heuristic 1: Table Uniformity Algorithm
 * Analyzes rows to find where a consistent numeric "table body" starts.
 * Usually, metadata at the top has non-uniform types, while data rows are mostly numeric.
 */
export function analyzeTypeUniformity(rows: any[][]): { headerCandidate: number, dataStartCandidate: number } {
    if (rows.length < 2) return { headerCandidate: 0, dataStartCandidate: 1 };

    let bestStart = 0;
    let maxConsistency = 0;

    // Check first 30 rows for a "transition" point
    const scanLimit = Math.min(rows.length, 30);

    for (let i = 1; i < scanLimit; i++) {
        const sampleRows = rows.slice(i, i + 10); // Check next 10 rows for consistency
        if (sampleRows.length === 0) break;

        let numericCols = 0;
        const colCount = rows[i].length;

        for (let c = 0; c < colCount; c++) {
            const isNumeric = sampleRows.every(r => {
                const val = r[c];
                return val !== null && val !== undefined && val !== "" && !isNaN(Number(val));
            });
            if (isNumeric) numericCols++;
        }

        // If we find a row where multiple columns become consistently numeric, mark it
        if (numericCols >= 2 && numericCols > maxConsistency) {
            maxConsistency = numericCols;
            bestStart = i;
        }
    }

    return {
        headerCandidate: Math.max(0, bestStart - 1),
        dataStartCandidate: bestStart
    };
}

/**
 * 🧱 Heuristic 2: Parallel Block Detection
 * Detects if a wide CSV contains multiple independent experiments side-by-side
 * separated by empty columns or repeating header strings.
 */
export function detectParallelBlocks(rows: any[][], headerRowIndex: number): number[][] {
    if (rows.length === 0) return [];
    const header = rows[headerRowIndex];
    if (!header) return [[0, rows[0].length - 1]];

    const blocks: number[][] = [];
    let startIdx = 0;

    for (let i = 0; i < header.length; i++) {
        const isLast = i === header.length - 1;
        const isEmpty = header[i] === null || header[i] === undefined || String(header[i]).trim() === "";

        // If we hit an empty column, it's a potential separator
        if (isEmpty || isLast) {
            const endIdx = isLast && !isEmpty ? i : i - 1;
            if (endIdx >= startIdx) {
                blocks.push([startIdx, endIdx]);
            }
            startIdx = i + 1;
        }
    }

    // Filter out tiny blocks (less than 2 columns)
    return blocks.filter(b => (b[1] - b[0] + 1) >= 2);
}

