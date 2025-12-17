import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PlusCircle, CreditCard, Wallet, LogOut, Landmark, User, TrendingUp } from 'lucide-react';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();

    // Navigation Config
    const navItems = [
        { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard", end: true },
        { to: "/debt-simulator", icon: <Landmark size={20} />, label: "Simulator" },
        { to: "/strategy", icon: <TrendingUp size={20} />, label: "Strategy" },
        { to: "/budget-tracker", icon: <Wallet size={20} />, label: "Budget" },
        { to: "/add-loan", icon: <PlusCircle size={20} />, label: "Add Loan" },
        { to: "/pay", icon: <CreditCard size={20} />, label: "Pay" },
    ];

    // Auth Actions (Login/Signup when logged out)
    const authItems = [
        { to: "/login", icon: <User size={20} />, label: "Login" },
        { to: "/register", icon: <PlusCircle size={20} />, label: "Sign Up" },
    ];

    const currentNavItems = user ? navItems : authItems;

    return (
        <div className="min-h-screen bg-surface-muted flex flex-col md:flex-row text-primary">

            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-40 transition-all">
                {/* Brand */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                            <Landmark className="text-white w-5 h-5" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-primary">DebtTracker</h1>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {currentNavItems.map(item => (
                        <NavItem key={item.to} {...item} />
                    ))}
                </nav>

                {/* User/Logout */}
                <div className="p-4 border-t border-gray-100">
                    {user ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                    {(user.name || 'U')[0]}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold text-slate-700 truncate">{user.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center justify-center gap-2 w-full px-4 py-2 text-xs font-bold text-danger bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                <LogOut size={14} />
                                Sign Out
                            </button>
                        </div>
                    ) : null}
                </div>
            </aside>


            {/* --- MOBILE HEADER --- */}
            <header className="md:hidden fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 h-14 flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Landmark className="text-white w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg text-primary">DebtTracker</span>
                </div>
                {user && (
                    <button onClick={logout} className="text-slate-400 hover:text-danger">
                        <LogOut size={20} />
                    </button>
                )}
            </header>


            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-64 w-full min-h-screen pt-16 md:pt-4 px-4 md:px-8 pb-24 md:pb-8 overflow-x-hidden">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>


            {/* --- MOBILE BOTTOM NAV --- */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
                <div className="flex justify-around items-center h-16 px-1">
                    {currentNavItems.map(item => (
                        <MobileNavItem key={item.to} {...item} />
                    ))}
                </div>
            </nav>

        </div>
    );
};

const NavItem = ({ to, icon, label, end }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
            }`
        }
    >
        {React.cloneElement(icon, { size: 18 })}
        <span>{label}</span>
    </NavLink>
);

const MobileNavItem = ({ to, icon, label, end }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full gap-1 pt-1 ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
            }`
        }
    >
        {({ isActive }) => (
            <>
                <div className={`p-1 rounded-full transition-colors ${isActive ? 'bg-primary/5' : ''}`}>
                    {React.cloneElement(icon, {
                        size: 20,
                        strokeWidth: isActive ? 2.5 : 2
                    })}
                </div>
                <span className="text-[10px] font-bold">{label}</span>
            </>
        )}
    </NavLink>
);

export default Layout;
