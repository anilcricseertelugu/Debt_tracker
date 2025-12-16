import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Play, ArrowRight, DollarSign, Calendar, TrendingUp, RefreshCw, ArrowLeft } from 'lucide-react';
import * as api from '../../services/api';

const DebtSimulator = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [extraPayments, setExtraPayments] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        console.log("DebtSimulator Component Mounted");
        loadSession();
    }, []);

    const loadSession = async () => {
        try {
            setLoading(true);
            const res = await api.getSimulationSession();
            if (res.data.success && res.data.data) {
                setSession(res.data.data);
            } else {
                setSession(null);
            }
        } catch (err) {
            console.error("Failed to load session", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInit = async () => {
        try {
            setProcessing(true);
            const res = await api.initSimulation();
            if (res.data.success) {
                setSession(res.data.data);
                setExtraPayments({});
            }
        } catch (err) {
            alert("Failed to start: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleNextStage = async () => {
        try {
            setProcessing(true);
            const res = await api.nextSimulationStage({ extraPayments });
            if (res.data.success) {
                setSession(res.data.data);
                setExtraPayments({});
            }
        } catch (err) {
            console.error("Next Stage Error:", err);
            const msg = err.response?.data?.message || err.message;
            alert("Simulation Error: " + msg);
        } finally {
            setProcessing(false);
        }
    };

    const handleReverse = async () => {
        try {
            if (!confirm("Go back to the previous month? Current changes will be lost.")) return;
            setProcessing(true);
            const res = await api.reverseSimulation();
            if (res.data.success) {
                setSession(res.data.data);
                setExtraPayments({});
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            alert("Cannot Reverse: " + msg);
        } finally {
            setProcessing(false);
        }
    };

    const handlePaymentChange = (loanId, amount) => {
        setExtraPayments(prev => ({
            ...prev,
            [loanId]: Number(amount)
        }));
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Simulator...</div>;

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="bg-blue-100 p-6 rounded-full">
                    <TrendingUp className="w-12 h-12 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Start Your Debt Free Journey</h1>
                <p className="text-gray-500 max-w-md text-center">
                    Initialize a new simulation session. We will copy your current live data to a temporary workspace where you can plan your future month-by-month.
                </p>
                <button
                    onClick={handleInit}
                    disabled={processing}
                    className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                    {processing ? 'Initializing...' : (
                        <>
                            <Play className="w-5 h-5" /> Start Simulation
                        </>
                    )}
                </button>
            </div>
        );
    }

    if (!session.currentDate) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">Session Data Invalid</p>
                <button onClick={handleInit} className="text-blue-600 underline">Reset</button>
            </div>
        );
    }

    const monthLabel = new Date(session.currentDate).toLocaleDateString('default', { month: 'long', year: 'numeric' });
    const currentWallet = session.walletBalance || 0;
    const loans = session.loansSnapshot || [];
    const breakdown = session.financialBreakdown || { rollover: 0, monthlySurplus: 0 };

    const totalExtraPay = Object.values(extraPayments).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const projectedWallet = currentWallet - totalExtraPay;
    const isWalletNegative = projectedWallet < 0;

    // SAFE CALCULATION: Helper to avoid reducing empty/null arrays
    const potentialFreedCash = (loans || []).reduce((sum, loan) => {
        if (!loan || loan.remainingBalance <= 0) return sum;
        const extra = Number(extraPayments[loan._id] || 0);
        if (loan.remainingBalance - extra <= 0) {
            return sum + (loan.emi || loan.monthlyInterest || 0);
        }
        return sum;
    }, 0);

    const activeLoansEMI = (loans || []).reduce((sum, loan) => {
        if (!loan || loan.remainingBalance <= 0) return sum;
        return sum + (loan.emi || loan.monthlyInterest || 0);
    }, 0);

    const liveMonthlyFreeCash = (session.monthlyIncome || 0) - (session.monthlyExpenses || 0) - activeLoansEMI;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header / Status Bar */}
            <div className="flex justify-between items-end border-b pb-4">
                <div>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Current Stage</h2>
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-blue-500" />
                        {monthLabel}
                    </h1>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Free Flow Cash Available</div>
                    <div className={`text-3xl font-bold px-4 py-2 rounded-lg border flex items-center gap-2 justify-end ${isWalletNegative ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                        {totalExtraPay > 0 && (
                            <span className="text-xl text-gray-400 line-through decoration-gray-400 mr-2">
                                ₹{currentWallet.toLocaleString()}
                            </span>
                        )}
                        ₹{projectedWallet.toLocaleString()}
                    </div>
                    {/* Breakdown Display */}
                    <div className="text-xs text-gray-500 mt-1 flex justify-end gap-2 font-medium items-center">
                        <span className="text-gray-400">Rollover: ₹{Math.round(breakdown.rollover).toLocaleString()}</span>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center gap-1">
                            <span className="text-blue-600">Monthly Free Cash: ₹{Math.round(liveMonthlyFreeCash).toLocaleString()}</span>
                            {potentialFreedCash > 0 && (
                                <span className="text-emerald-600 bg-emerald-50 px-1 rounded animate-pulse">
                                    (+₹{Math.round(potentialFreedCash).toLocaleString()} Next Month)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Table Layout */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Loan Details</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Interest Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Balance</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Monthly Due</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Pay Extra</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loans.map(loan => {
                                // DEFENSIVE CHECK: Ensure loan is valid
                                if (!loan || !loan._id) return null;
                                if (loan.remainingBalance <= 0) return null;

                                const extra = Number(extraPayments[loan._id] || 0);
                                const projectedBalance = Math.max(0, loan.remainingBalance - extra);
                                const rate = loan.interestRate || 0;

                                let totalSavings = 0;
                                // Safe Interest Calc
                                try {
                                    if (extra > 0 && loan.type === 'Bank' && rate > 0 && loan.emi > 0) {
                                        const r = rate / 1200;
                                        const getInterest = (bal, emi, r) => {
                                            if (bal <= 0) return 0;
                                            const numerator = 1 - (r * bal / emi);
                                            // Handle potential NaN if numerator <= 0
                                            if (numerator <= 0) return 0;
                                            const nper = -Math.log(numerator) / Math.log(1 + r);
                                            const totalPayable = nper * emi;
                                            return Math.max(0, totalPayable - bal);
                                        };
                                        const currentInterest = getInterest(loan.remainingBalance, loan.emi, r);

                                        if (projectedBalance <= 0) {
                                            totalSavings = currentInterest;
                                        } else {
                                            const newInterest = getInterest(projectedBalance, loan.emi, r);
                                            totalSavings = currentInterest - newInterest;
                                        }
                                    }
                                } catch (e) {
                                    console.warn("Savings Calc Error", e);
                                    totalSavings = 0;
                                }

                                return (
                                    <tr key={loan._id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${loan.type === 'Bank' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {(loan.type || 'L')[0]}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-bold text-gray-900">{loan.name || 'Unknown Loan'}</div>
                                                    <div className="text-xs text-gray-500">{loan.type} Loan</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(loan.type === 'Bank' || loan.type === 'Hand') ? (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-700">
                                                    {rate}% p.a.
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">Fixed</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-mono font-bold text-gray-700">
                                                {extra > 0 ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-400 line-through text-xs">₹{Math.round(loan.remainingBalance).toLocaleString()}</span>
                                                        <span className="text-emerald-600">₹{Math.round(projectedBalance).toLocaleString()}</span>
                                                    </div>
                                                ) : (
                                                    <span>₹{Math.round(loan.remainingBalance).toLocaleString()}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ₹{Number(loan.emi || loan.monthlyInterest || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {extra > 0 && loan.type === 'Bank' && (
                                                    <span className="text-[10px] text-emerald-600 font-medium mr-2">
                                                        Save ~₹{Math.round(totalSavings || 0).toLocaleString()} Total
                                                    </span>
                                                )}
                                                {extra > 0 && loan.type === 'Hand' && (
                                                    <span className="text-[10px] text-emerald-600 font-medium mr-2">
                                                        Save ~₹{Math.round(extra * (loan.interestRate || 24) / 1200).toLocaleString()}/mo
                                                    </span>
                                                )}
                                                <div className="relative w-32">
                                                    <span className="absolute left-2 top-1.5 text-gray-400 text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        value={extraPayments[loan._id] || ''}
                                                        onChange={(e) => handlePaymentChange(loan._id, e.target.value)}
                                                        className="w-full pl-5 pr-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-right"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                {extra < loan.remainingBalance && (
                                                    <button
                                                        onClick={() => handlePaymentChange(loan._id, Math.ceil(loan.remainingBalance))}
                                                        className="ml-2 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded border border-red-200 transition-colors whitespace-nowrap"
                                                        title={`Pay full balance of ₹${Math.ceil(loan.remainingBalance)}`}
                                                    >
                                                        Foreclose
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!loans || loans.length === 0) && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500 text-sm">
                                        No active loans. You are debt free!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-20 shadow-lg md:pl-64">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <button
                        onClick={handleInit}
                        className="text-gray-400 hover:text-red-500 text-sm flex items-center gap-1"
                    >
                        <RefreshCw className="w-4 h-4" /> Reset
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={handleReverse}
                            disabled={processing}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <ArrowLeft className="w-5 h-5" /> Previous Month
                        </button>

                        <button
                            onClick={handleNextStage}
                            disabled={processing || isWalletNegative}
                            className={`flex items-center gap-2 px-8 py-3 text-white text-lg font-bold rounded-full shadow-lg transition-all ${isWalletNegative
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200/50'
                                }`}
                        >
                            {processing ? 'Calculating...' : (
                                <>
                                    Next Month <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebtSimulator;
