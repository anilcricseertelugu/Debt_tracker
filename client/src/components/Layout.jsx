import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, PlusCircle, CreditCard, LayoutDashboard } from 'lucide-react';

const Layout = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-8 h-8 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">DebtTracker</h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex items-center gap-1">
                        <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" end />
                        <NavItem to="/add-loan" icon={<PlusCircle size={18} />} label="Add Loan" />
                        <NavItem to="/pay" icon={<CreditCard size={18} />} label="Record Payment" />
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-6">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} Debt Tracker App. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

const NavItem = ({ to, icon, label, end }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${isActive
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
        }
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);

export default Layout;
