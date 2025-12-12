import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { useData } from '../../context/DataContext';
import { Card } from '../ui/Card';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Analytics = () => {
    const { analytics: data } = useData();

    if (!data) return null;

    const pieData = {
        labels: data.debtComposition.labels,
        datasets: [
            {
                data: data.debtComposition.values,
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                borderWidth: 1,
            },
        ],
    };

    const barData = {
        labels: data.principalVsInterest.map(d => d.loanName),
        datasets: [
            {
                label: 'Principal Remaining',
                data: data.principalVsInterest.map(d => d.principal),
                backgroundColor: '#3b82f6',
            },
            {
                label: 'Interest Remaining',
                data: data.principalVsInterest.map(d => d.interest),
                backgroundColor: '#f97316',
            },
        ],
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-8">
            <Card className="h-80 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-4 w-full text-left">Debt Composition</h3>
                <div className="h-64 w-full flex justify-center">
                    <Pie data={pieData} options={{ maintainAspectRatio: false }} />
                </div>
            </Card>

            <Card className="h-80">
                <h3 className="text-lg font-semibold mb-4">Principal vs Interest</h3>
                <div className="h-64 w-full">
                    <Bar
                        data={barData}
                        options={{
                            maintainAspectRatio: false,
                            scales: { x: { stacked: true }, y: { stacked: true } }
                        }}
                    />
                </div>
            </Card>
        </div>
    );
};

export default Analytics;
