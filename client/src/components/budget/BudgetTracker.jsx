import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import * as api from '../../services/api';

const BudgetTracker = () => {
    const [incomes, setIncomes] = useState([]);
    const [recurringExpenses, setRecurringExpenses] = useState([]);
    const [dailyExpenses, setDailyExpenses] = useState([]);
    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpected: 0,
        totalActual: 0,
        projectedSavings: 0,
        netBalance: 0
    });
    const [loading, setLoading] = useState(true);

    // Form states
    const [incomeForm, setIncomeForm] = useState({ source: '', amount: '' });
    const [recurringForm, setRecurringForm] = useState({ category: '', amount: '' });
    const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });

    const fetchData = useCallback(async () => {
        try {
            const [incomeRes, recurringRes, expenseRes, summaryRes] = await Promise.all([
                api.getIncomes(),
                api.getRecurringExpenses(),
                api.getExpenses(),
                api.getBudgetSummary()
            ]);

            if (incomeRes.data.success) setIncomes(incomeRes.data.data);
            if (recurringRes.data.success) setRecurringExpenses(recurringRes.data.data);
            if (expenseRes.data.success) setDailyExpenses(expenseRes.data.data);
            if (expenseRes.data.success) setDailyExpenses(expenseRes.data.data);
            if (summaryRes.data.success) {
                setSummary({
                    ...summaryRes.data.data,
                    netBalance: summaryRes.data.data.balance
                });
            }
        } catch (error) {
            console.error("Failed to fetch budget data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handlers ---

    const handleAddIncome = async (e) => {
        e.preventDefault();
        try {
            await api.addIncome(incomeForm);
            setIncomeForm({ source: '', amount: '' });
            fetchData();
        } catch (error) {
            console.error("Failed to add income", error);
        }
    };

    const handleDeleteIncome = async (id) => {
        if (!window.confirm('Delete this income source?')) return;
        try {
            await api.deleteIncome(id);
            fetchData();
        } catch (error) {
            console.error("Failed to delete income", error);
        }
    };

    const handleAddRecurring = async (e) => {
        e.preventDefault();
        try {
            await api.addRecurringExpense(recurringForm);
            setRecurringForm({ category: '', amount: '' });
            fetchData();
        } catch (error) {
            console.error("Failed to add recurring expense", error);
        }
    };

    const handleDeleteRecurring = async (id) => {
        if (!window.confirm('Delete this recurring expense?')) return;
        try {
            await api.deleteRecurringExpense(id);
            fetchData();
        } catch (error) {
            console.error("Failed to delete recurring expense", error);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await api.addExpense(expenseForm);
            setExpenseForm({ category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error) {
            console.error("Failed to add expense", error);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Delete this expense entry?')) return;
        try {
            await api.deleteExpense(id);
            fetchData();
        } catch (error) {
            console.error("Failed to delete expense", error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Budget Tracker...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Budget Tracker</h1>

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-green-50 border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Total Monthly Income</p>
                            <h3 className="text-2xl font-bold text-green-900">₹{summary.totalIncome.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600">Expected (Bills + Debt)</p>
                            <h3 className="text-2xl font-bold text-purple-900">₹{summary.totalExpected?.toLocaleString() || 0}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Bills: ₹{summary.totalRecurring?.toLocaleString() || 0} | Debt: ₹{summary.totalDebtObligations?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </Card>

                <Card className="bg-indigo-50 border-indigo-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-indigo-600">Projected Savings</p>
                            <h3 className="text-2xl font-bold text-indigo-900">₹{summary.projectedSavings?.toLocaleString() || 0}</h3>
                            <p className="text-xs text-gray-500 mt-1">Income - Expected</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </Card>

                <Card className={`${summary.netBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${summary.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                Current Balance
                            </p>
                            <h3 className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                                ₹{summary.netBalance?.toLocaleString() || 0}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Available Cash Flow</p>
                        </div>
                        <div className={`p-3 rounded-full ${summary.netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                            <DollarSign className={`w-6 h-6 ${summary.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fixed Income Section */}
                <Card>
                    <CardHeader title={
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Fixed Monthly Income
                        </div>
                    } />

                    <form onSubmit={handleAddIncome} className="flex gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Source (e.g. Salary)"
                            className="flex-1 p-2 border rounded"
                            value={incomeForm.source}
                            onChange={e => setIncomeForm({ ...incomeForm, source: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            className="w-32 p-2 border rounded"
                            value={incomeForm.amount}
                            onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                            required
                        />
                        <button type="submit" className="p-2 bg-green-500 text-white rounded hover:bg-green-600">
                            <Plus className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {incomes.map(income => (
                            <div key={income._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium">{income.source}</p>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-green-600">+₹{income.amount}</span>
                                    <button onClick={() => handleDeleteIncome(income._id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {incomes.length === 0 && <p className="text-center text-gray-500 py-4">No fixed income sources added</p>}
                    </div>
                </Card>

                {/* Expected Expenses Section */}
                <Card>
                    <CardHeader title={
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            Expected Monthly Expenses
                        </div>
                    } />

                    <form onSubmit={handleAddRecurring} className="flex gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Category (e.g. Rent)"
                            className="flex-1 p-2 border rounded"
                            value={recurringForm.category}
                            onChange={e => setRecurringForm({ ...recurringForm, category: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            className="w-32 p-2 border rounded"
                            value={recurringForm.amount}
                            onChange={e => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                            required
                        />
                        <button type="submit" className="p-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                            <Plus className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {recurringExpenses.map(expense => (
                            <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium">{expense.category}</p>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-gray-700">₹{expense.amount}</span>
                                    <button onClick={() => handleDeleteRecurring(expense._id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {recurringExpenses.length === 0 && <p className="text-center text-gray-500 py-4">No expected expenses added</p>}
                    </div>
                </Card>

                {/* Debt Obligations Section (Auto-linked) */}
                <Card className="bg-orange-50 border-orange-200">
                    <CardHeader title={
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-orange-500" />
                            Debt Obligations (Auto)
                        </div>
                    } />

                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {summary.debtBreakdown?.bankLoans.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Bank Loans</h4>
                                {summary.debtBreakdown.bankLoans.map((loan, idx) => (
                                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-orange-100 last:border-0">
                                        <span>{loan.name}</span>
                                        <span className="font-medium">₹{loan.amount}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {summary.debtBreakdown?.handLoans.length > 0 && (
                            <div className="mt-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Hand Loans</h4>
                                {summary.debtBreakdown.handLoans.map((loan, idx) => (
                                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-orange-100 last:border-0">
                                        <span>{loan.name}</span>
                                        <span className="font-medium">₹{loan.amount}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(!summary.debtBreakdown?.bankLoans.length && !summary.debtBreakdown?.handLoans.length) && (
                            <p className="text-center text-gray-400 py-4 text-sm">No active debt obligations found.</p>
                        )}

                        <div className="pt-3 border-t border-orange-200 flex justify-between font-bold text-orange-900 mt-2">
                            <span>Total Debt Monthly</span>
                            <span>₹{summary.totalDebtObligations?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                </Card>

                {/* Daily Expenses Log (Full Width or separate row) */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader title={
                            <div className="flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                                Daily Expense Log
                            </div>
                        } />

                        <form onSubmit={handleAddExpense} className="space-y-4 mb-6">
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Category (e.g. Grocery)"
                                    className="flex-1 p-2 border rounded"
                                    value={expenseForm.category}
                                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    className="w-32 p-2 border rounded"
                                    value={expenseForm.amount}
                                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Description (Optional)"
                                    className="flex-1 p-2 border rounded"
                                    value={expenseForm.description}
                                    onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                />
                                <input
                                    type="date"
                                    className="w-auto p-2 border rounded"
                                    value={expenseForm.date}
                                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    required
                                />
                                <button type="submit" className="p-2 bg-red-500 text-white rounded hover:bg-red-600">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </form>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {dailyExpenses.map(expense => (
                                <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{expense.category}</p>
                                        <p className="text-sm text-gray-600">{expense.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-red-600">-₹{expense.amount}</span>
                                        <button onClick={() => handleDeleteExpense(expense._id)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {dailyExpenses.length === 0 && <p className="text-center text-gray-500 py-4">No expense entries yet</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BudgetTracker;
