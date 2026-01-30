import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import type { MutableRefObject } from 'react';
import type { AnalysisUnit } from '../../types/analysis';

export const Commands = Extension.create({
    name: 'commands',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

interface CommandItem {
    title: string;
    description: string;
    searchTerms: string[];
    category?: string;
    command: (args: { editor: any; range: any }) => void;
}

export const createSuggestionItems = (unitsRef: MutableRefObject<AnalysisUnit[]>) => {
    return ({ query }: { query: string }) => {
        const units = unitsRef.current;
        const items: CommandItem[] = [];

        // Generate commands for each unit
        units.forEach((unit) => {
            const analysis = unit.backendAnalysis;
            if (!analysis?.best_model) return;

            const { best_model } = analysis;
            const prefix = units.length > 1 ? `${unit.name} - ` : '';
            const categoryLabel = units.length > 1 ? unit.name : undefined;

            // Slope / Gradient
            if (best_model.params && best_model.params[0] !== undefined) {
                const slope = best_model.params[0].toFixed(4);
                items.push({
                    title: `${prefix}Slope`,
                    description: `기울기 삽입 (${slope})`,
                    searchTerms: ['slope', 'gradient', '기울기', unit.name.toLowerCase()],
                    category: categoryLabel,
                    command: ({ editor, range }) => {
                        editor.chain().focus().deleteRange(range).insertContent(slope).run();
                    },
                });
            }

            // Y-Intercept
            if (best_model.params && best_model.params[1] !== undefined) {
                const intercept = best_model.params[1].toFixed(4);
                items.push({
                    title: `${prefix}Y-Intercept`,
                    description: `Y절편 삽입 (${intercept})`,
                    searchTerms: ['intercept', 'y-intercept', '절편', unit.name.toLowerCase()],
                    category: categoryLabel,
                    command: ({ editor, range }) => {
                        editor.chain().focus().deleteRange(range).insertContent(intercept).run();
                    },
                });
            }

            // R-Squared
            if (best_model.r_squared !== undefined) {
                const rSquared = best_model.r_squared.toFixed(4);
                items.push({
                    title: `${prefix}R²`,
                    description: `결정계수 삽입 (${rSquared})`,
                    searchTerms: ['r2', 'r-squared', '결정계수', unit.name.toLowerCase()],
                    category: categoryLabel,
                    command: ({ editor, range }) => {
                        editor.chain().focus().deleteRange(range).insertContent(rSquared).run();
                    },
                });
            }

            // Equation
            if (best_model.equation) {
                items.push({
                    title: `${prefix}Equation`,
                    description: `수식 삽입 (${best_model.equation})`,
                    searchTerms: ['equation', 'formula', '수식', '방정식', unit.name.toLowerCase()],
                    category: categoryLabel,
                    command: ({ editor, range }) => {
                        editor.chain().focus().deleteRange(range).insertContent(best_model.equation).run();
                    },
                });
            }

            // LaTeX Equation
            if (best_model.latex) {
                items.push({
                    title: `${prefix}LaTeX`,
                    description: `LaTeX 수식 삽입`,
                    searchTerms: ['latex', 'tex', 'math', unit.name.toLowerCase()],
                    category: categoryLabel,
                    command: ({ editor, range }) => {
                        editor.chain().focus().deleteRange(range).insertContent(`$${best_model.latex}$`).run();
                    },
                });
            }
        });

        // If no units have analysis yet, show helpful message
        if (items.length === 0) {
            items.push({
                title: 'No Data',
                description: 'Step 2에서 데이터를 먼저 분석해주세요',
                searchTerms: [],
                command: () => { },
            });
        }

        // Filter by query
        return items.filter(item => {
            if (typeof query === 'string' && query.length > 0) {
                const search = query.toLowerCase();
                return (
                    item.title.toLowerCase().includes(search) ||
                    item.description.toLowerCase().includes(search) ||
                    item.searchTerms.some(term => term.includes(search))
                );
            }
            return true;
        });
    };
};
