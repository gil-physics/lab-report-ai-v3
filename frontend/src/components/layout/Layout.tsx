import { Outlet } from 'react-router-dom';
import Header from './Header';
import FloatingProgressIndicator from './FloatingProgressIndicator';

export default function Layout() {
    return (
        <div className="h-screen h-dvh flex flex-col bg-[#f8fafc] overflow-hidden">
            <Header />

            {/* Step navigation buttons live inside each page (no floating bottom bar) */}
            <main className="flex-1 relative overflow-y-auto">
                <div className="pb-6">
                    <Outlet />
                </div>
            </main>
            <FloatingProgressIndicator />
        </div>
    );
}
