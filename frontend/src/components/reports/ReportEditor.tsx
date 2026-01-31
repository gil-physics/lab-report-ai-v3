import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Mathematics } from '@tiptap/extension-mathematics';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import Underline from '@tiptap/extension-underline';
import { migrateMathStrings } from '@tiptap/extension-mathematics';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
const ResizableImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: '600',
                renderHTML: attributes => ({
                    width: attributes.width,
                }),
                parseHTML: element => element.getAttribute('width'),
            },
            align: {
                default: 'center',
                renderHTML: attributes => ({
                    align: attributes.align,
                    style: attributes.align === 'center' ? 'display: block; margin: 0 auto;' : '',
                }),
                parseHTML: element => element.getAttribute('align'),
            },
        };
    },
});
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'katex/dist/katex.min.css';
import {
    Sparkles,
    Strikethrough,
    Type,
    RotateCcw,
    Maximize2,
    FileText as FileTextIcon,
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Heading1,
    Heading2,
    List,
    Undo2,
    Redo2,
    Table as TableIcon,
    Quote,
    Trash2,
    Code,
    Loader2,
    Beaker,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Highlighter,
    Sigma,
    Rows,
    Columns
} from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { cn } from '../../lib/utils';
import { Commands, createSuggestionItems } from './commands';
import CommandsList from './CommandsList';
import AIRewritePanel from './AIRewritePanel';
import MathInputModal from './MathInputModal';

interface ToolbarProps {
    editor: any;
    onOpenMathModal: () => void;
}

const Toolbar = ({ editor, onOpenMathModal }: ToolbarProps) => {
    if (!editor) return null;

    const btnClass = (active: boolean) => cn(
        "p-2.5 rounded-xl transition-all hover:bg-slate-100 flex items-center justify-center",
        active ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100" : "text-slate-500 border border-transparent"
    );

    const sectionClass = "flex flex-col gap-1 pb-3 mb-3 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0";

    return (
        <aside className="fixed top-1/2 -translate-y-1/2 right-6 z-50 no-print">
            <div className="flex flex-col p-2 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] w-14">
                {/* History */}
                <div className={sectionClass}>
                    <button onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)} title="Undo (Ctrl+Z)">
                        <Undo2 size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)} title="Redo (Ctrl+Y)">
                        <Redo2 size={18} />
                    </button>
                </div>

                {/* Headings / Structure */}
                <div className={sectionClass}>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="H1">
                        <Heading1 size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="H2">
                        <Heading2 size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Quote">
                        <Quote size={18} />
                    </button>
                </div>

                {/* Basic Formatting */}
                <div className={sectionClass}>
                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold (Ctrl+B)">
                        <Bold size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic (Ctrl+I)">
                        <Italic size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline">
                        <UnderlineIcon size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={btnClass(editor.isActive('highlight'))} title="Highlight">
                        <Highlighter size={18} />
                    </button>
                </div>

                {/* Alignment */}
                <div className={sectionClass}>
                    <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Align Left">
                        <AlignLeft size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Align Center">
                        <AlignCenter size={18} />
                    </button>
                    <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="Align Right">
                        <AlignRight size={18} />
                    </button>
                </div>

                {/* Math / TeX */}
                <div className={sectionClass}>
                    <button onClick={onOpenMathModal} className={btnClass(false)} title="수식 입력 (Ctrl+M)">
                        <Sigma size={18} className="text-blue-600" />
                    </button>
                    <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))} title="Code Block">
                        <Code size={18} />
                    </button>
                </div>

                {/* Lists */}
                <div className={sectionClass}>
                    <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List">
                        <List size={18} />
                    </button>
                </div>

                {/* Tables */}
                <div className={sectionClass}>
                    <button
                        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        className={btnClass(editor.isActive('table'))}
                        title="Insert Table"
                    >
                        <TableIcon size={18} />
                    </button>
                    {editor.isActive('table') && (
                        <>
                            <button onClick={() => editor.chain().focus().addRowAfter().run()} className={btnClass(false)} title="Add Row Below">
                                <Rows size={18} className="text-emerald-500" />
                            </button>
                            <button onClick={() => editor.chain().focus().addColumnAfter().run()} className={btnClass(false)} title="Add Column Right">
                                <Columns size={18} className="text-emerald-500" />
                            </button>
                            <button onClick={() => editor.chain().focus().deleteTable().run()} className={btnClass(false)} title="Delete Table">
                                <Trash2 size={18} className="text-red-400" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default function ReportEditor() {
    const {
        units,
        generatedMarkdown,
        setGeneratedMarkdown,
        resetAnalysis,
        isGeneratingReport,
        generationProgress
    } = useAnalysis();
    const navigate = useNavigate();
    const [isZenMode, setIsZenMode] = useState(true);
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [isMathModalOpen, setIsMathModalOpen] = useState(false);

    // Auto-save to localStorage every 30 seconds
    const STORAGE_KEY = 'lab-report-ai-autosave';
    useEffect(() => {
        // Load saved content on mount
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && !generatedMarkdown) {
            const shouldRestore = window.confirm('저장된 보고서가 있습니다. 복구하시겠습니까?');
            if (shouldRestore) {
                setGeneratedMarkdown(saved);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    useEffect(() => {
        if (!generatedMarkdown) return;
        const timer = setInterval(() => {
            localStorage.setItem(STORAGE_KEY, generatedMarkdown);
        }, 30000); // 30 seconds
        return () => clearInterval(timer);
    }, [generatedMarkdown]);

    // Keyboard shortcut for math modal (Ctrl+M)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                setIsMathModalOpen(true);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Units ref for slash commands
    const unitsRef = useRef(units);
    useEffect(() => {
        unitsRef.current = units;
    }, [units]);

    // 🛡️ Refresh Guard: Redirect ONLY if data is completely lost (e.g. refresh)
    useEffect(() => {
        if (units.length === 0) {
            navigate('/visualize', { replace: true });
        }
    }, [units.length, navigate]);

    const extensions = useMemo(() => [
        StarterKit,
        Markdown.configure({
            html: true, // Preserve <img> tags
        }),
        Mathematics.configure({
            katexOptions: {
                throwOnError: false,
                errorColor: 'transparent',
                strict: false,
            },
        }),
        BubbleMenuExtension,
        Underline,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        ResizableImage,
        Highlight,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        Placeholder.configure({
            placeholder: "Type '/' for commands, or select text for AI tools...",
        }),
        Commands.configure({
            suggestion: {
                items: createSuggestionItems(unitsRef),
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
    ], []); // 🛑 Truly static dependency array to prevent re-registration

    const editor = useEditor({
        extensions,
        content: generatedMarkdown,
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px]',
            },
        },
        onUpdate: ({ editor }) => {
            setGeneratedMarkdown((editor.storage as any).markdown.getMarkdown());
        },
        onCreate: ({ editor }) => {
            migrateMathStrings(editor);
        },
    });

    // Sync context to editor when generatedMarkdown changes
    useEffect(() => {
        if (editor && generatedMarkdown && (editor.storage as any).markdown.getMarkdown() !== generatedMarkdown) {
            editor.commands.setContent(generatedMarkdown);
            migrateMathStrings(editor); // 🚀 Ensure AI-generated math is migrated
        }
    }, [editor, generatedMarkdown]);


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

                    {/* Report Content */}
                    <div className="relative">
                        <Toolbar editor={editor} onOpenMathModal={() => setIsMathModalOpen(true)} />

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
                            <EditorContent editor={editor} className="min-h-[29.7cm]" />
                        )}
                    </div>
                </div>
            </main>

            {/* Bubble Menu for AI Assistance */}
            {editor && (
                <BubbleMenu editor={editor}>
                    <div className="flex items-center gap-1 p-1 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95">
                        <button
                            onClick={() => {
                                const { from, to } = editor.state.selection;
                                const text = editor.state.doc.textBetween(from, to, ' ');
                                if (text) {
                                    setSelectedText(text);
                                    setIsAIPanelOpen(true);
                                }
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

            {/* AI Rewrite Panel */}
            <AIRewritePanel
                isOpen={isAIPanelOpen}
                onClose={() => setIsAIPanelOpen(false)}
                selectedText={selectedText}
                onApply={(newText) => {
                    editor?.chain().focus().insertContent(newText).run();
                }}
            />

            {/* Math Input Modal */}
            <MathInputModal
                isOpen={isMathModalOpen}
                onClose={() => setIsMathModalOpen(false)}
                onInsert={(latex, isBlock) => {
                    // Insert as math node for proper rendering
                    if (isBlock) {
                        editor?.chain().focus()
                            .insertContent([
                                { type: 'paragraph' },
                                { type: 'math', attrs: { latex } },
                                { type: 'paragraph' },
                            ])
                            .run();
                    } else {
                        editor?.chain().focus()
                            .insertContent({ type: 'math', attrs: { latex } })
                            .run();
                    }
                }}
            />


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
                    body { 
                        background: white !important; 
                        padding: 0 !important; 
                        margin: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    main { 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        max-width: 100% !important; 
                        width: 100% !important;
                    }
                    .prose { 
                        max-width: 100% !important; 
                        width: 100% !important;
                        font-size: 11pt !important;
                    }
                    .bg-white { 
                        box-shadow: none !important; 
                        border: none !important; 
                        border-radius: 0 !important;
                        padding: 1cm !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                    }
                    @page {
                        size: A4;
                        margin: 1.5cm;
                    }
                    h1, h2, h3, h4 { page-break-after: avoid; }
                    table, img { page-break-inside: avoid; }
                }
                .prose h1 { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 0.5rem; margin-top: 2rem; }
                .prose h2 { border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; margin-top: 1.5rem; }
                .prose table { border-collapse: collapse; width: 100%; border: 2px solid #e2e8f0; margin-bottom: 1.5rem; }
                .prose th, .prose td { border: 1px solid #e2e8f0; padding: 0.75rem; }
                .prose th { background: #f8fafc; font-weight: 800; color: #475569; }
                
                /* Tiptap Table Selected Cell */
                .prose .selectedCell:after { background: rgba(16, 185, 129, 0.1); }
                .prose .column-resize-handle { background-color: #10b981; }

                /* Mathematics Styling */
                .Mathematics-node { 
                    font-size: 1.1em;
                    padding: 0 4px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                .Mathematics-node:hover { background: #f1f5f9; }
                .katex-display { margin: 1em 0; overflow-x: auto; overflow-y: hidden; }
            `}</style>
        </div>
    );
}

