import React from 'react';
import { useData } from '../../context/DataContext';
import { Link } from 'react-router-dom';
import { DollarSign, Calendar, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';

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
                        <h3 className="text-xl font-bold text-gray-900">Track Income</h3>
                        <p className="text-xs text-gray-500 mt-1">& Expenses</p>
                    </div>
                    <div className="p-3 rounded-full bg-teal-500">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                </Card>
            </Link>
        </div>
    );
};

export default SummaryCards;
