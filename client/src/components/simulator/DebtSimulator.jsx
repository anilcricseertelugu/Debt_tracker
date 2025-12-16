import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, RefreshCw, Calendar, ArrowRight, Wallet, AlertCircle } from 'lucide-react';
import * as api from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

const DebtSimulator = () => {
    // --- STATE ---
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Simulation Inputs
    const [extraPayments, setExtraPayments] = useState({});
    const [simIncome, setSimIncome] = useState(0);
    const [simExpenses, setSimExpenses] = useState(0);

    // --- EFFECTS ---
    useEffect(() => {
        loadSession();
    }, []);

    // --- ACTIONS ---
    const loadSession = async () => {
        try {
            setLoading(true);
            const res = await api.getSimulationSession();
            if (res.data.success && res.data.data) {
                setSession(res.data.data);
                setSimIncome(res.data.data.monthlyIncome || 0);
                setSimExpenses(res.data.data.monthlyExpenses || 0);
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
                setSimIncome(res.data.data.monthlyIncome || 0);
                setSimExpenses(res.data.data.monthlyExpenses || 0);
            }
        } catch (err) {
            alert("Failed to start: " + (err.response?.data?.message || err.message));
        } finally {
            setProcessing(false);
        }
    };

    const handleNextStage = async () => {
        try {
            setProcessing(true);
            const res = await api.nextSimulationStage({
                extraPayments,
                monthlyIncome: simIncome,
                monthlyExpenses: simExpenses
            });

            if (res.data.success) {
                setSession(res.data.data);
                setExtraPayments({});
                setSimIncome(res.data.data.monthlyIncome);
                setSimExpenses(res.data.data.monthlyExpenses);
            }
        } catch (err) {
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

    // --- RENDER HELPERS ---
    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
    );

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
                <div className="bg-primary-50 p-6 rounded-full">
                    <TrendingUp className="w-12 h-12 text-primary-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-primary-900 tracking-tight">Financial Simulator</h1>
                    <p className="text-gray-500 max-w-md mt-2">
                        Initialize a sandbox session to plan your debt-free journey.
                        Changes here do not affect your actual budget until applied.
                    </p>
                </div>
                <Button size="lg" onClick={handleInit} loading={processing}>
                    <Play className="w-4 h-4 mr-2" /> Start Simulation
                </Button>
            </div>
        );
    }

    if (!session.currentDate) {
        return (
            <div className="p-12 text-center">
                <div className="text-danger-500 mb-4 flex items-center justify-center gap-2">
                    <AlertCircle size={24} /> Session Data Invalid
                </div>
                <Button variant="outline" onClick={handleInit}>Reset Simulation</Button>
            </div>
        );
    }

    // --- DATA PREP ---
    const loans = session.loansSnapshot || [];
    const currentWallet = session.walletBalance || 0;
    const totalExtraPay = Object.values(extraPayments).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const projectedWallet = currentWallet - totalExtraPay;
    const isWalletNegative = projectedWallet < 0;

    const activeLoansEMI = (loans || []).reduce((sum, loan) => {
        if (!loan || loan.remainingBalance <= 0) return sum;
        return sum + (loan.emi || loan.monthlyInterest || 0);
    }, 0);

    const liveMonthlyFreeCash = simIncome - simExpenses - activeLoansEMI;

    const potentialFreedCash = (loans || []).reduce((sum, loan) => {
        if (!loan || loan.remainingBalance <= 0) return sum;
        const extra = Number(extraPayments[loan._id] || 0);
        if (loan.remainingBalance - extra <= 0) {
            return sum + (loan.emi || loan.monthlyInterest || 0);
        }
        return sum;
    }, 0);

    const monthLabel = new Date(session.currentDate).toLocaleDateString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-0">

            {/* --- HEADER GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">

                {/* 1. Status Card */}
                <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Calendar size={100} />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Month</h2>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                            {monthLabel}
                        </h1>
                    </div>
                    <div className="mt-4 flex gap-2 items-center">
                        <Badge variant="neutral">Stage {session.__v || 1}</Badge>
                        <button onClick={handleInit} className="text-xs text-gray-400 hover:text-danger-500 underline decoration-gray-200 underline-offset-2 ml-auto">Reset Session</button>
                    </div>
                </div>

                {/* 2. Wallet / Cash Flow */}
                <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cash in Hand (Rollover)</h2>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl lg:text-3xl font-bold ${isWalletNegative ? 'text-danger-600' : 'text-gray-900'}`}>
                                ₹{projectedWallet.toLocaleString()}
                            </span>
                            {totalExtraPay > 0 && (
                                <span className="text-sm text-gray-400 line-through">₹{currentWallet.toLocaleString()}</span>
                            )}
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between items-center text-xs font-medium text-gray-500">
                        <span>Allocated: <span className="text-emerald-600">₹{totalExtraPay.toLocaleString()}</span></span>
                        <span>Remaining: ₹{projectedWallet.toLocaleString()}</span>
                    </div>
                </div>

                {/* 3. Budget Controls (Editable) */}
                <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-center gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase">Input Budget</span>
                        <span className={`text-xs font-bold ${liveMonthlyFreeCash < 0 ? 'text-danger-600' : 'text-emerald-600'}`}>
                            Free Cash: ₹{Math.round(liveMonthlyFreeCash).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                label="Income"
                                type="number"
                                value={simIncome}
                                onChange={(e) => setSimIncome(Number(e.target.value))}
                                className="text-right mb-0"
                            />
                        </div>
                        <div className="flex-1">
                            <Input
                                label="Expense"
                                type="number"
                                value={simExpenses}
                                onChange={(e) => setSimExpenses(Number(e.target.value))}
                                className="text-right mb-0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DATA TABLE COMPONENT --- */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gray-50/50 gap-2">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Wallet size={18} className="text-gray-400" /> Loan Portfolio
                    </h3>
                    {potentialFreedCash > 0 && (
                        <Badge variant="success" className="animate-pulse">
                            +₹{potentialFreedCash.toLocaleString()} /mo saved next month
                        </Badge>
                    )}
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Loan Name</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Balance</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">EMI / Due</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Interest Cost</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right w-40 whitespace-nowrap">Pay Extra</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loans.map(loan => (
                                <LoanRow
                                    key={loan._id}
                                    loan={loan}
                                    extraPayments={extraPayments}
                                    handlePaymentChange={handlePaymentChange}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARD STACK (STRICT FIELD PARITY) */}
                <div className="md:hidden p-4 space-y-4 bg-gray-50/50">
                    {loans.map(loan => (
                        <LoanCardMobile
                            key={loan._id}
                            loan={loan}
                            extraPayments={extraPayments}
                            handlePaymentChange={handlePaymentChange}
                        />
                    ))}
                </div>

                {/* Empty State */}
                {loans.filter(l => l.remainingBalance > 0).length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                        <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No active loans. You are debt free!</p>
                    </div>
                )}
            </div>

            {/* --- ACTION BAR (Floating on Mobile) --- */}
            <div className="fixed bottom-16 md:bottom-6 right-4 md:right-8 md:static flex justify-end pointer-events-none md:pointer-events-auto">
                <div className="pointer-events-auto shadow-xl md:shadow-none rounded-full md:rounded-lg">
                    <Button
                        size="lg"
                        variant="success"
                        onClick={handleNextStage}
                        loading={processing}
                        className="shadow-emerald-500/30"
                    >
                        Process Month <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- SUB COMPONENTS ---

const LoanRow = ({ loan, extraPayments, handlePaymentChange }) => {
    if (!loan || loan.remainingBalance <= 0) return null;

    const extra = Number(extraPayments[loan._id] || 0);
    const projectedBalance = Math.max(0, loan.remainingBalance - extra);
    const r = (loan.interestRate || 0) / 1200;

    // Interest Logic
    let interestDisplay = <span className="text-gray-300">-</span>;
    if (loan.type === 'Bank') {
        const getInterest = (bal, emi, r) => {
            if (bal <= 0 || emi <= 0 || r <= 0) return 0;
            const num = 1 - (r * bal / emi);
            if (num <= 0) return 0;
            const nper = -Math.log(num) / Math.log(1 + r);
            return Math.max(0, (nper * emi) - bal);
        };
        const currentInterest = getInterest(loan.remainingBalance, loan.emi, r);

        if (extra > 0) {
            const newInterest = projectedBalance <= 0 ? 0 : getInterest(projectedBalance, loan.emi, r);
            interestDisplay = (
                <div className="flex flex-col items-end leading-tight">
                    <span className="text-[10px] text-gray-400 line-through">₹{Math.round(currentInterest).toLocaleString()}</span>
                    <span className="text-xs font-bold text-emerald-600">₹{Math.round(newInterest).toLocaleString()}</span>
                </div>
            );
        } else {
            interestDisplay = <span className="text-xs font-medium text-gray-600">₹{Math.round(currentInterest).toLocaleString()}</span>;
        }
    }

    return (
        <tr className="hover:bg-gray-50/80 transition-colors group">
            <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${loan.type === 'Bank' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                        {loan.type === 'Bank' ? 'B' : 'H'}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900 whitespace-nowrap">{loan.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium">
                            {loan.interestRate > 0 ? `${loan.interestRate}% APR` : '0% Interest'}
                        </div>
                    </div>
                </div>
            </td>

            <td className="px-6 py-3 text-right">
                <div className="text-sm font-bold text-gray-900 whitespace-nowrap">₹{loan.remainingBalance.toLocaleString()}</div>
                {extra > 0 && (
                    <div className="text-[10px] text-emerald-600 font-medium whitespace-nowrap">
                        Will be ₹{projectedBalance.toLocaleString()}
                    </div>
                )}
            </td>

            <td className="px-6 py-3 text-right">
                <div className="text-sm font-medium text-gray-600 whitespace-nowrap">
                    ₹{(loan.emi || loan.monthlyInterest || 0).toLocaleString()}
                </div>
            </td>

            <td className="px-6 py-3 text-right">
                {interestDisplay}
            </td>

            <td className="px-6 py-3 flex justify-end">
                <ForecloseButton
                    loan={loan}
                    extra={extra}
                    handlePaymentChange={handlePaymentChange}
                />
            </td>
        </tr>
    );
};

// STRICT PARITY MOBILE CARD
const LoanCardMobile = ({ loan, extraPayments, handlePaymentChange }) => {
    if (!loan || loan.remainingBalance <= 0) return null;
    const extra = Number(extraPayments[loan._id] || 0);
    const projectedBalance = Math.max(0, loan.remainingBalance - extra);
    const r = (loan.interestRate || 0) / 1200;

    // Same Interest Logic
    let interestDisplay = <span className="text-gray-300">-</span>;
    if (loan.type === 'Bank') {
        const getInterest = (bal, emi, r) => {
            if (bal <= 0 || emi <= 0 || r <= 0) return 0;
            const num = 1 - (r * bal / emi);
            if (num <= 0) return 0;
            const nper = -Math.log(num) / Math.log(1 + r);
            return Math.max(0, (nper * emi) - bal);
        };
        const currentInterest = getInterest(loan.remainingBalance, loan.emi, r);

        if (extra > 0) {
            const newInterest = projectedBalance <= 0 ? 0 : getInterest(projectedBalance, loan.emi, r);
            interestDisplay = (
                <div className="flex flex-col items-end leading-tight">
                    <span className="text-[10px] text-gray-400 line-through">₹{Math.round(currentInterest).toLocaleString()}</span>
                    <span className="font-bold text-emerald-600">₹{Math.round(newInterest).toLocaleString()}</span>
                </div>
            );
        } else {
            interestDisplay = <span className="font-medium text-gray-600">₹{Math.round(currentInterest).toLocaleString()}</span>;
        }
    }

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-sm">
            {/* Field 1: Name (Column 1) */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${loan.type === 'Bank' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                    {loan.type === 'Bank' ? 'B' : 'H'}
                </div>
                <div>
                    <div className="font-bold text-gray-900">{loan.name}</div>
                    <div className="text-xs text-gray-500">
                        {loan.interestRate > 0 ? `${loan.interestRate}% APR` : '0% Interest'}
                    </div>
                </div>
            </div>

            {/* Field 2 & 3: Balance (Col 2) & EMI (Col 3) */}
            <div className="grid grid-cols-2 gap-4 mb-3 border-b border-gray-50 pb-3">
                <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Balance</div>
                    <div className="text-lg font-bold text-gray-900">₹{loan.remainingBalance.toLocaleString()}</div>
                    {extra > 0 && (
                        <div className="text-xs text-emerald-600 font-medium whitespace-nowrap">
                            Will be ₹{projectedBalance.toLocaleString()}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">EMI / Due</div>
                    <div className="font-medium text-gray-700">₹{(loan.emi || loan.monthlyInterest || 0).toLocaleString()}</div>
                </div>
            </div>

            {/* Field 4 & 5: Interest (Col 4) & Pay Extra (Col 5) */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Interest Cost</div>
                    <div className="font-medium text-gray-700">{interestDisplay}</div>
                </div>

                <ForecloseButton
                    loan={loan}
                    extra={extra}
                    handlePaymentChange={handlePaymentChange}
                />
            </div>
        </div>
    );
};

const ForecloseButton = ({ loan, extra, handlePaymentChange }) => {
    return (
        <div className="flex justify-end">
            {extra >= loan.remainingBalance ? (
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePaymentChange(loan._id, 0)}
                    className="text-xs border-dashed"
                    title="Click to remove extra payment"
                >
                    Undo
                </Button>
            ) : (
                <Button
                    size="sm"
                    variant="danger"
                    className="text-xs bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 shadow-none"
                    onClick={() => handlePaymentChange(loan._id, loan.remainingBalance)}
                    title={`Pay full balance of ₹${Math.round(loan.remainingBalance).toLocaleString()}`}
                >
                    Foreclose
                </Button>
            )}
        </div>
    );
};

export default DebtSimulator;
