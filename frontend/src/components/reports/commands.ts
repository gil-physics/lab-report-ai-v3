import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import type { MutableRefObject } from 'react';

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

export const createSuggestionItems = (statsRef: MutableRefObject<any>, plotUrlRef: MutableRefObject<string | null>) => {
    return ({ query }: { query: string }) => {
        const stats = statsRef.current;
        const plotUrl = plotUrlRef.current;
        const items = [
            {
                title: 'Insert Graph',
                description: 'Embed the physics graph from Step 2',
                searchTerms: ['graph', 'chart', 'plot', 'image'],
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .setImage({ src: plotUrl || 'https://placehold.co/600x400/f8fafc/64748b?text=Please+Analyze+Data+First' })
                        .run();
                },
            },
            ...(stats ? [
                // ... (rest same)
                {
                    title: 'Slope',
                    description: `Insert slope value (${stats.slope})`,
                    searchTerms: ['slope', 'gradient', 'm'],
                    command: ({ editor, range }: any) => {
                        editor
                            .chain()
                            .focus()
                            .deleteRange(range)
                            .insertContent(String(stats.slope))
                            .run();
                    },
                },
                {
                    title: 'Y-Intercept',
                    description: `Insert Y-intercept (${stats.intercept})`,
                    searchTerms: ['intercept', 'b', 'y-intercept'],
                    command: ({ editor, range }: any) => {
                        editor
                            .chain()
                            .focus()
                            .deleteRange(range)
                            .insertContent(String(stats.intercept))
                            .run();
                    },
                },
                {
                    title: 'R-Squared',
                    description: `Insert R² value (${stats.rSquared})`,
                    searchTerms: ['r2', 'r-squared', 'accuracy'],
                    command: ({ editor, range }: any) => {
                        editor
                            .chain()
                            .focus()
                            .deleteRange(range)
                            .insertContent(String(stats.rSquared))
                            .run();
                    },
                },
                {
                    title: 'Equation',
                    description: `Insert equation (y = ${stats.slope}x + ${stats.intercept})`,
                    searchTerms: ['equation', 'formula', 'line'],
                    command: ({ editor, range }: any) => {
                        editor
                            .chain()
                            .focus()
                            .deleteRange(range)
                            .insertContent(`y = ${stats.slope}x + ${stats.intercept}`)
                            .run();
                    },
                },
            ] : [])
        ];

        return items.filter(item => {
            if (typeof query === 'string' && query.length > 0) {
                const search = query.toLowerCase();
                return (
                    item.title.toLowerCase().includes(search) ||
                    item.description.toLowerCase().includes(search) ||
                    (item.searchTerms && item.searchTerms.some(term => term.includes(search)))
                );
            }
            return true;
        });
    };
};
