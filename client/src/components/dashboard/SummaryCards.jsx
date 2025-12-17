import React from 'react';
import { useData } from '../../context/DataContext';
import { Link } from 'react-router-dom';
import { DollarSign, Calendar, FileText, TrendingUp, AlertCircle, CheckCircle, AlertTriangle, Loader, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { autoPayAll } from '../../services/api';

const MetricCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <Card className="p-6 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </Card>
);

const SummaryCards = () => {
    const { dashboardSummary, loading } = useData();

    if (loading || !dashboardSummary) return <div className="h-24 animate-pulse bg-gray-200 rounded-xl"></div>;

    const { totalOutstanding, totalMonthlyObligation, activeLoans, totalInterestLiability } = dashboardSummary;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
                title="Total Outstanding"
                value={`₹${totalOutstanding.toLocaleString()}`}
                subtitle="Across all loans"
                icon={DollarSign}
                color="bg-blue-500"
            />
            <MetricCard
                title="Monthly Obligations"
                value={`₹${totalMonthlyObligation.toLocaleString()}`}
                subtitle="EMIs + Interest Due"
                icon={Calendar}
                color="bg-purple-500"
            />
            <MetricCard
                title="Active Loans"
                value={activeLoans.total}
                subtitle={`${activeLoans.bank} Bank | ${activeLoans.hand} Hand`}
                icon={FileText}
                color="bg-green-500"
            />
            <MetricCard
                title="Est. Interest Liability"
                value={`₹${totalInterestLiability.toLocaleString()}`}
                subtitle="Remaining to pay"
                icon={TrendingUp}
                color="bg-orange-500"
            />

            <Link to="/budget-tracker">
                <Card className="p-6 flex items-start justify-between cursor-pointer hover:shadow-lg transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Budget Tracker</p>
                        <h3 className="text-xl font-bold text-gray-900">Track Budget</h3>
                        <p className="text-xs text-gray-500 mt-1">Income & Expenses</p>
                    </div>
                    <div className="p-3 rounded-full bg-teal-500">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                </Card>
            </Link>

            <AutoPayCard />
        </div>
    );
};

const AutoPayCard = () => {
    const { refreshData } = useData();
    // Status: 'idle' | 'confirm' | 'processing' | 'success' | 'error'
    const [status, setStatus] = React.useState('idle');
    const [message, setMessage] = React.useState('');

    const handleAutoPay = async (e) => {
        e.stopPropagation();
        setStatus('processing');
        try {
            const res = await autoPayAll();
            if (res.data.success) {
                setStatus('success');
                setMessage(res.data.message); // e.g. "Processed 5 payments"
                await refreshData();
                setTimeout(() => setStatus('idle'), 3000);
            }
        } catch (err) {
            setStatus('error');
            setMessage("Failed");
            console.error(err);
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const handleClick = () => {
        if (status === 'idle') setStatus('confirm');
    };

    const handleCancel = (e) => {
        e.stopPropagation();
        setStatus('idle');
    };

    // Dynamic Styles based on status
    const cardBg = {
        idle: 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100',
        confirm: 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100',
        processing: 'bg-gray-50 border-gray-200',
        success: 'bg-emerald-50 border-emerald-200',
        error: 'bg-red-50 border-red-200',
    }[status];

    return (
        <div
            className={`rounded-xl shadow-sm border p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group ${cardBg} select-none`}
            onClick={handleClick}
        >
            {/* IDLE STATE */}
            {status === 'idle' && (
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-indigo-500 mb-1">Quick Action</p>
                        <h3 className="text-xl font-bold text-gray-900">Auto Pay All</h3>
                        <p className="text-xs text-gray-400 mt-1">Pays Bank EMIs & Hand Interest</p>
                    </div>
                    <div className="p-3 rounded-full bg-indigo-600 shadow-indigo-200 shadow-lg group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                </div>
            )}

            {/* CONFIRM STATE */}
            {status === 'confirm' && (
                <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-200">
                    <p className="font-bold text-indigo-900 mb-3 text-lg">Confirm Auto Pay?</p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={handleCancel}
                            className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAutoPay}
                            className="flex-1 py-2 bg-indigo-600 border border-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-700 text-sm shadow-sm transition-colors"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            )}

            {/* PROCESSING STATE */}
            {status === 'processing' && (
                <div className="flex flex-col items-center justify-center h-full gap-2 animate-in fade-in">
                    <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-sm font-medium text-indigo-700">Processing...</p>
                </div>
            )}

            {/* SUCCESS STATE */}
            {status === 'success' && (
                <div className="flex flex-col items-center justify-center h-full gap-2 animate-in zoom-in duration-300">
                    <div className="p-2 bg-emerald-100 rounded-full">
                        <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-emerald-800">{message || 'Paid!'}</p>
                </div>
            )}

            {/* ERROR STATE */}
            {status === 'error' && (
                <div className="flex flex-col items-center justify-center h-full gap-2 animate-in shake">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <p className="text-sm font-medium text-red-700">Failed</p>
                </div>
            )}
        </div>
    );
};

export default SummaryCards;
