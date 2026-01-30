import { Beaker } from 'lucide-react';
import ProgressStepper from './ProgressStepper';

export default function Header() {
    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-sm">
            <div className="h-full px-8 mx-auto flex items-center justify-between">
                {/* Logo Section */}
                <div className="flex items-center space-x-3 w-64">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                        <Beaker size={24} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
                        PhysLab AI
                    </h1>
                </div>

                {/* Center: Progress Stepper */}
                <div className="flex-1 flex justify-center">
                    <ProgressStepper />
                </div>

                {/* Right Section: User & Settings (Placeholder for now) */}
                <div className="flex items-center justify-end space-x-4 w-64">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-medium text-sm hover:bg-slate-200 transition-colors cursor-pointer">
                        SW
                    </div>
                </div>
            </div>
        </header>
    );
}
