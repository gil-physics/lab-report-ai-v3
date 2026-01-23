import { Outlet } from 'react-router-dom';
import Header from './Header';
import NavigationControls from './NavigationControls';
import FloatingProgressIndicator from './FloatingProgressIndicator';

export default function Layout() {
    return (
        <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
            <Header />

            <main className="flex-1 relative overflow-y-auto">
                <div className="pb-24">
                    <Outlet />
                </div>
                <NavigationControls />
            </main>
            <FloatingProgressIndicator />
        </div>
    );
}
