import { useEffect, useState } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Mathematics } from '@tiptap/extension-mathematics';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import {
    Download,
    Sparkles,
    Strikethrough,
    Type,
    RotateCcw,
    FileDown,
    Maximize2,
    FileText as FileTextIcon,
    Printer
} from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { cn } from '../../lib/utils';
import { Commands, createSuggestionItems } from './commands';
import CommandsList from './CommandsList';
import { Loader2, Beaker } from 'lucide-react';

export default function ReportEditor() {
    const {
        generatedMarkdown,
        setGeneratedMarkdown,
        resetAnalysis,
        isGeneratingReport,
        generationProgress,
        analysisStats,
        plotUrl
    } = useAnalysis();
    const [isZenMode, setIsZenMode] = useState(true);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown,
            Mathematics,
            BubbleMenuExtension,
            Placeholder.configure({
                placeholder: "Type '/' for commands, or select text for AI tools...",
            }),
            Commands.configure({
                suggestion: {
                    items: createSuggestionItems(analysisStats, plotUrl),
                    render: () => {
                        let component: any;
                        let popup: any;

                        return {
                            onStart: (props: any) => {
                                component = new ReactRenderer(CommandsList, {
                                    props,
                                    editor: props.editor,
                                });

                                if (!props.clientRect) {
                                    return;
                                }

                                popup = tippy('body', {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                });
                            },

                            onUpdate(props: any) {
                                component.updateProps(props);

                                if (!props.clientRect) {
                                    return;
                                }

                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },

                            onKeyDown(props: any) {
                                if (props.event.key === 'Escape') {
                                    popup[0].hide();
                                    return true;
                                }
                                return component.ref?.onKeyDown(props);
                            },

                            onExit() {
                                popup[0].destroy();
                                component.destroy();
                            },
                        };
                    },
                },
            }),
        ],
        content: generatedMarkdown,
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px]',
            },
        },
        onUpdate: ({ editor }) => {
            setGeneratedMarkdown((editor.storage as any).markdown.getMarkdown());
        },
    });

    // Sync context to editor on mount if empty
    useEffect(() => {
        if (editor && generatedMarkdown && editor.isEmpty) {
            editor.commands.setContent(generatedMarkdown);
        }
    }, [editor, generatedMarkdown]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadMD = () => {
        const blob = new Blob([generatedMarkdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'physics_report.md';
        a.click();
    };

    if (!editor) return null;

    return (
        <div className={cn(
            "relative h-screen flex flex-col transition-all duration-700 bg-[#f8fafc] overflow-hidden",
            isZenMode ? "items-center" : "items-stretch"
        )}>
            {/* Zen Editor Container */}
            <main className={cn(
                "flex-1 w-full overflow-y-auto pt-20 pb-40 scroll-smooth custom-scroll no-scrollbar",
                isZenMode ? "max-w-4xl" : "max-w-none px-10"
            )}>
                <div className={cn(
                    "bg-white min-h-[29.7cm] shadow-2xl transition-all duration-500 rounded-px p-[2cm] relative mb-20",
                    isZenMode ? "border-x border-slate-100" : "rounded-2xl"
                )}>
                    {/* Header bar within document */}
                    <div className="flex items-center justify-between mb-12 pb-6 border-b border-slate-100 no-print">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                                <FileTextIcon size={18} />
                            </div>
                            <span className="font-bold text-slate-700">Lab Report AI</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={resetAnalysis}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Reset everything"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Tiptap Editor or Loading State */}
                    {(!generatedMarkdown && isGeneratingReport) ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-6 animate-in fade-in duration-1000">
                            <div className="relative">
                                <Beaker className="w-16 h-16 text-emerald-600/20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                </div>
                                <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-emerald-400 animate-pulse" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="font-bold text-slate-900">AI is writing the report...</h3>
                                <p className="text-sm text-slate-500">{generationProgress}</p>
                            </div>
                        </div>
                    ) : (
                        <EditorContent editor={editor} />
                    )}
                </div>
            </main>

            {/* Bubble Menu for AI Assistance */}
            {editor && (
                <BubbleMenu editor={editor}>
                    <div className="flex items-center gap-1 p-1 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95">
                        <button
                            onClick={() => {
                                editor.chain().focus().run();
                                // Mock AI Rewrite: Just italicize and color for now to show feedback
                                editor.chain().focus().toggleItalic().run();
                                // Ideally this would trigger an async AI call 
                            }}
                            className="px-3 py-1.5 flex items-center gap-2 text-xs font-bold hover:bg-emerald-600 rounded-lg transition-colors"
                        >
                            <Sparkles size={14} className="text-emerald-400" />
                            AI Rewrite
                        </button>
                        <div className="w-px h-4 bg-slate-700 mx-1" />
                        <button
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            className="p-1.5 hover:bg-slate-800 rounded-lg"
                        >
                            <Strikethrough size={14} />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className="p-1.5 hover:bg-slate-800 rounded-lg"
                        >
                            <Type size={14} />
                        </button>
                    </div>
                </BubbleMenu>
            )}

            {/* Floating Action Bar (FAB) */}
            <div className="fixed bottom-10 right-10 flex flex-col items-end gap-3 no-print group z-50">
                <div className="flex items-center gap-2 animate-in slide-in-from-right-10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                        onClick={handleDownloadMD}
                        className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-xl hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Download size={20} />
                        <span className="text-sm font-bold pr-2">Markdown</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-xl hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Printer size={20} />
                        <span className="text-sm font-bold pr-2">Print PDF</span>
                    </button>
                </div>

                <button className="w-16 h-16 bg-emerald-600 text-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] flex items-center justify-center hover:bg-emerald-700 hover:scale-110 transition-all active:scale-95 group/main">
                    <FileDown size={28} className="group-hover/main:rotate-12 transition-transform" />
                </button>
            </div>

            {/* Zen Mode Toggle */}
            <div className="fixed bottom-10 left-10 no-print">
                <button
                    onClick={() => setIsZenMode(!isZenMode)}
                    className={cn(
                        "p-3 rounded-2xl transition-all shadow-xl flex items-center gap-2 font-bold text-sm",
                        isZenMode ? "bg-white text-slate-400 border border-slate-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    )}
                >
                    <Maximize2 size={18} />
                    {isZenMode ? 'Zen Mode' : 'Full Screen'}
                </button>
            </div>

            {/* Global Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    main { padding: 0 !important; margin: 0 !important; max-width: none !important; }
                    .prose { max-width: none !important; }
                    .bg-white { box-shadow: none !important; border: none !important; }
                }
                .prose h1 { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 0.5rem; margin-top: 2rem; }
                .prose h2 { border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; margin-top: 1.5rem; }
                .prose table { border-collapse: collapse; width: 100%; border: 2px solid #e2e8f0; }
                .prose th, .prose td { border: 1px solid #e2e8f0; padding: 0.5rem; }
            `}</style>
        </div>
    );
}

