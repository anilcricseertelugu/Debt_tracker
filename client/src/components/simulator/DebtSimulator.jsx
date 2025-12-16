import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Play, ArrowRight, DollarSign, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import * as api from '../../services/api';

const DebtSimulator = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [extraPayments, setExtraPayments] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        console.log("Premium Simulator Mounted");
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
            // Defensive: Extra Payments
            const res = await api.nextSimulationStage({ extraPayments });
            if (res.data.success) {
                setSession(res.data.data);
                setExtraPayments({});
            }
        } catch (err) {
            console.error("Next Stage Error:", err);
            // Try to show server message if available
            const msg = err.response?.data?.message || err.message;
            alert("Simulation Error: " + msg);
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

    // 1. Start Screen
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

    // 2. Active Stage View
    // Defensive Check
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

    // CALCULATIONS for "What-If"
    const totalExtraPay = Object.values(extraPayments).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const projectedWallet = currentWallet - totalExtraPay;
    const isWalletNegative = projectedWallet < 0;

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
                </div>
            </div>

            {/* Loan Cards Grid */}
            <div className="grid gap-6">
                {loans.length === 0 && (
                    <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <h3 className="text-xl font-bold text-gray-700">Debt Free!</h3>
                        <p className="text-gray-500">You have no active loans in this simulation.</p>
                    </div>
                )}

                {loans.map(loan => {
                    // Hide closed loans
                    if (loan.remainingBalance <= 0) return null;

                    const extra = Number(extraPayments[loan._id] || 0);
                    const projectedBalance = Math.max(0, loan.remainingBalance - extra);

                    // Interest Calculation (Client Side Est.)
                    let interestAmount = 0;
                    if (loan.type === 'Bank') {
                        const r = loan.interestRate || 0;
                        interestAmount = (loan.remainingBalance * r / 100) / 12;
                    } else {
                        interestAmount = loan.monthlyInterest || 0;
                    }

                    return (
                        <Card key={loan._id} className="hover:shadow-md transition-shadow relative overflow-hidden">
                            {/* Interest Ribbon/Badge */}
                            <div className="absolute top-0 right-0 bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wide">
                                Interest: ₹{Math.round(interestAmount).toLocaleString()}
                            </div>

                            <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                                {/* Loan Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${loan.type === 'Bank' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {loan.type}
                                        </span>
                                        <h3 className="font-bold text-lg text-gray-900">{loan.name}</h3>
                                    </div>
                                    <div className="flex gap-8 mt-4 text-sm">
                                        <div>
                                            <span className="block text-gray-400 text-xs uppercase mb-1">Balance</span>
                                            <div className="font-mono font-bold text-lg text-gray-800 flex items-center gap-2">
                                                {extra > 0 ? (
                                                    <>
                                                        <span className="text-gray-400 line-through text-sm">₹{Math.round(loan.remainingBalance).toLocaleString()}</span>
                                                        <span className="text-green-600">₹{Math.round(projectedBalance).toLocaleString()}</span>
                                                    </>
                                                ) : (
                                                    <span>₹{Math.round(loan.remainingBalance).toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400 text-xs uppercase mb-1">{loan.type === 'Bank' ? 'EMI' : 'Int Due'}</span>
                                            <span className="font-medium text-gray-600 text-lg">₹{Number(loan.emi || loan.monthlyInterest).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action: Pay Extra */}
                                <div className="w-full md:w-auto flex flex-col gap-2 min-w-[220px]">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                                        <span>Pay Extra</span>
                                        {extra > 0 && <span className="text-green-600">-{Math.round((extra / loan.remainingBalance) * 100)}%</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                                            <input
                                                type="number"
                                                value={extraPayments[loan._id] || ''}
                                                onChange={(e) => handlePaymentChange(loan._id, e.target.value)}
                                                className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                                                placeholder="0"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handlePaymentChange(loan._id, currentWallet)}
                                            className="px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs font-bold hover:text-blue-600 border"
                                            title="Use Max Wallet"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                    {extra > 0 && (
                                        <div className="text-xs text-right text-gray-400">
                                            Will save ~₹{Math.round(extra * (loan.interestRate / 100)).toLocaleString()} interest/yr
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
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
    );
};

export default DebtSimulator;
