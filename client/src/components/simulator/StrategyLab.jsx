import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { calculateStrategies } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Activity, Clock, DollarSign, Calendar, Triangle, Info, Wallet, FileText, AlertTriangle } from 'lucide-react';

/* --- ROBOT STRATEGY CARD --- */
const RobotStrategyCard = ({ title, icon: Icon, data, baselineData, color, recommend }) => {
    // Safety check for data
    if (!data || !baselineData) return null;

    try {
        const { totalInterestPaid, completionDate } = data;
        const baselineInterest = baselineData.totalInterestPaid || 0;
        const saved = baselineInterest - totalInterestPaid;

        // Calculate time saved safely
        const robotDate = new Date(completionDate);
        const baselineDate = new Date(baselineData.completionDate);
        let monthsSaved = 0;

        if (!isNaN(robotDate.getTime()) && !isNaN(baselineDate.getTime())) {
            monthsSaved = Math.max(0, (baselineDate - robotDate) / (1000 * 60 * 60 * 24 * 30));
        }

        return (
            <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col h-full bg-white border border-gray-100 ${recommend ? 'ring-2 ring-emerald-400 bg-emerald-50/20' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-lg ${color} text-white shadow-sm`}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                    </div>
                </div>

                <div className="space-y-4 flex-1">
                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total Interest</span>
                            <div className="text-lg font-bold text-gray-900">₹{totalInterestPaid.toLocaleString()}</div>
                        </div>
                        {saved > 0 && (
                            <Badge variant="success" className="mb-1">
                                Save ₹{saved.toLocaleString()}
                            </Badge>
                        )}
                    </div>

                    <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Debt Free Date</span>
                        <div className="text-sm font-medium text-gray-700 mt-1 flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            {new Date(completionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                    </div>

                    {monthsSaved > 0 ? (
                        <div className="pt-2">
                            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <Clock size={14} />
                                {Math.floor(monthsSaved)} months faster than baseline
                            </div>
                        </div>
                    ) : (
                        <div className="pt-2 text-xs text-gray-400 italic">Same speed as paying minimums</div>
                    )}
                </div>
            </Card>
        );
    } catch (err) {
        console.error("Strategy Card Render Error", err);
        return null;
    }
};

/* --- EXECUTION CONSOLE --- */
const RobotConsole = ({ logs }) => {
    if (!logs || logs.length === 0) return (
        <div className="text-center text-gray-400 text-xs py-12">Robot initializing...</div>
    );

    return (
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs h-[400px] overflow-y-auto custom-scrollbar border border-slate-700 shadow-inner">
            {logs.map((log, i) => (
                <div key={i} className="mb-3 border-b border-slate-800 pb-2 last:border-0">
                    <div className="text-slate-400 mb-1 opacity-70">
                        --- Month {log.month} ---
                    </div>
                    {log.messages.length > 0 ? (
                        <ul className="space-y-1.5">
                            {log.messages.map((msg, j) => (
                                <li key={j} className={`flex items-start gap-2 ${msg.includes('ROBOT ACTION') ? 'text-emerald-400 font-bold' : msg.includes('CRITICAL') ? 'text-red-400' : 'text-slate-300'}`}>
                                    <span className="opacity-50 mt-0.5">{'>'}</span>
                                    <span>{msg}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <span className="text-slate-600 italic pl-4">... Robot checks wallet. No action. ...</span>
                    )}
                </div>
            ))}
        </div>
    );
};

const StrategyLab = () => {
    // useData provides global loading state if needed, but we manage local calculation state
    // const { loading: dataLoading } = useData(); 

    const [results, setResults] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState(null);
    const [selectedView, setSelectedView] = useState('highestPrincipal');

    const runCalculation = async () => {
        setCalculating(true);
        setError(null);
        try {
            console.log("StrategyLab: Starting calculation...");
            const { data } = await calculateStrategies({});
            console.log("StrategyLab: Data received", data);

            if (data.success) {
                setResults(data.data);
            } else {
                setError(data.message || "Calculation failed");
            }
        } catch (err) {
            console.error("StrategyLab Error", err);
            setError("Failed to run simulation. " + (err.response?.data?.message || err.message));
        } finally {
            setCalculating(false);
        }
    };

    useEffect(() => {
        runCalculation();
    }, []);

    const currentStrategyData = results?.strategies?.[selectedView];
    const baselineData = results?.baseline;

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <AlertTriangle size={32} className="mx-auto mb-2" />
                <h3 className="font-bold">Error</h3>
                <p>{error}</p>
                <Button onClick={runCalculation} className="mt-4">Retry</Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-12 mt-4 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
                        <Activity className="text-white" size={24} />
                    </div>
                    Strategy Lab <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">Robot Mode</span>
                </h1>
                <p className="text-sm text-gray-500 mt-2 ml-14 max-w-2xl">
                    The Robot takes your current simulation data and runs parallel futures. It accumulates surplus cash and "snipes" loans based on the selected algorithm.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* --- LEFT: STRATEGY SELECTOR & STATS --- */}
                <div className="lg:col-span-4 space-y-4">
                    {/* BUDGET CARD */}
                    <Card className="p-4 bg-white border-gray-200">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Robot Parameters</h4>
                        {results && results.budgetOverview ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Monthly Surplus</span>
                                    <span className="font-mono font-bold text-emerald-600">
                                        ₹{(results.budgetOverview.income - results.budgetOverview.expenses).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Starting Wallet</span>
                                    <span className="font-mono font-bold text-blue-600">
                                        ₹{results.budgetOverview.initialWallet.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                                    Logic: Strict Foreclosure. No partial payments.
                                </div>
                            </div>
                        ) : (
                            <div className="h-20 flex items-center justify-center text-xs text-gray-400 animate-pulse">
                                Loading Parameters...
                            </div>
                        )}
                    </Card>

                    {/* STRATEGY CARDS */}
                    {results && baselineData && (
                        <div className="space-y-3">
                            <div onClick={() => setSelectedView('highestPrincipal')} className={`cursor-pointer transition-all ${selectedView === 'highestPrincipal' ? 'ring-2 ring-indigo-500 rounded-xl' : 'opacity-80'}`}>
                                <RobotStrategyCard
                                    title="Highest Principal First (Robot)"
                                    icon={Activity}
                                    data={results.strategies.highestPrincipal}
                                    baselineData={baselineData}
                                    color="bg-indigo-600"
                                    recommend={true}
                                />
                            </div>
                            <div onClick={() => setSelectedView('avalanche')} className={`cursor-pointer transition-all ${selectedView === 'avalanche' ? 'ring-2 ring-purple-500 rounded-xl' : 'opacity-80'}`}>
                                <RobotStrategyCard
                                    title="Avalanche (Highest Rate)"
                                    icon={Triangle}
                                    data={results.strategies.avalanche}
                                    baselineData={baselineData}
                                    color="bg-purple-600"
                                />
                            </div>
                            <div onClick={() => setSelectedView('snowball')} className={`cursor-pointer transition-all ${selectedView === 'snowball' ? 'ring-2 ring-cyan-500 rounded-xl' : 'opacity-80'}`}>
                                <RobotStrategyCard
                                    title="Snowball (Smallest First)"
                                    icon={Calendar}
                                    data={results.strategies.snowball}
                                    baselineData={baselineData}
                                    color="bg-cyan-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- RIGHT: EXECUTION CONSOLE --- */}
                <div className="lg:col-span-8">
                    <Card className="h-full bg-slate-950 border-slate-800 text-white p-0 overflow-hidden flex flex-col min-h-[500px]">
                        <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                            <h3 className="font-mono text-sm font-bold text-emerald-400 flex items-center gap-2">
                                <FileText size={16} />
                                ROBOT EXECUTION LOG
                            </h3>
                            <Badge variant="neutral" className="bg-slate-800 text-slate-400 border-slate-700">
                                {selectedView}
                            </Badge>
                        </div>
                        <div className="flex-1 bg-slate-950 p-2">
                            {currentStrategyData ? (
                                <RobotConsole logs={currentStrategyData.executionLog} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 font-mono text-sm">
                                    {calculating ? '[ SYSTEM INITIALIZING... ]' : '[ WAITING FOR DATA ]'}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default StrategyLab;
