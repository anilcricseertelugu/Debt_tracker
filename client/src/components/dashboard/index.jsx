import React from 'react';
import SummaryCards from './SummaryCards';
import Analytics from './Analytics';
import LoanList from './LoanList';

const Dashboard = () => {
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-500">Overview of your financial obligations</p>
            </div>

            <SummaryCards />
            <Analytics />
            <LoanList />
        </div>
    );
};

export default Dashboard;
