import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { BarChart2 } from 'lucide-react';

const ICONS: Record<string, any> = {
    'Insert Graph': BarChart2,
};

export default forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-2 min-w-[280px] overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-[1000]">
            {props.items.length ? (
                <div className="flex flex-col gap-0.5">
                    {props.items.map((item: any, index: number) => {
                        const Icon = ICONS[item.title];
                        return (
                            <button
                                key={index}
                                onClick={() => selectItem(index)}
                                className={`flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all ${index === selectedIndex ? 'bg-slate-100 text-slate-900 border-l-4 border-l-emerald-500 pl-2' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${index === selectedIndex ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {Icon && <Icon size={18} />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold">{item.title}</div>
                                    <div className="text-[10px] opacity-70 font-medium">{item.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="p-3 text-sm text-slate-400 font-medium">No results found</div>
            )}
        </div>
    );
});
