import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChevronDown, ChevronUp, Trash2, Edit } from 'lucide-react';
import { deleteBankLoan, deleteHandLoan } from '../../services/api';

const BankLoanItem = ({ loan, onDelete, onEdit }) => {
    const [expanded, setExpanded] = useState(false);

    // Progress
    const progress = Math.min(100, Math.round(((loan.principalAmount - loan.remainingPrincipal) / loan.principalAmount) * 100));

    return (
        <Card className="mb-4 transition-all duration-200">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-gray-900">{loan.loanName}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">{loan.bankName}</span>
                    </div>
                    <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                        <p>Outstanding: <span className="font-semibold text-gray-900">₹{loan.remainingPrincipal.toLocaleString()}</span></p>
                        <p>EMI: <span className="font-semibold text-gray-900">₹{loan.emiAmount.toLocaleString()}</span></p>
                    </div>
                    <div className="mt-3 w-full max-w-md bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <div className="ml-4 flex items-center gap-2">
                    <Button variant="ghost" className="p-2 text-gray-500 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onEdit(loan.loanId); }}>
                        <Edit size={18} />
                    </Button>
                    {expanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                </div>
            </div>

            {expanded && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <p className="text-xs text-gray-500">Interest Rate</p>
                            <p className="font-medium">{loan.interestRate}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Start Date</p>
                            <p className="font-medium">{new Date(loan.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Tenure</p>
                            <p className="font-medium">{loan.tenureMonths} Months</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">EMIs Paid</p>
                            <p className="font-medium">{loan.emisPaid}</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(loan.loanId); }}>
                            Close Loan
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};

const HandLoanItem = ({ loan, onDelete, onEdit }) => (
    <Card className="mb-4">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-lg text-gray-900">{loan.lenderName}</h3>
                <p className="text-sm text-gray-500">{loan.loanType.replace('_', ' ')}</p>
                <div className="mt-2">
                    <p className="text-sm">Balance: <span className="font-bold text-gray-900">₹{loan.remainingBalance.toLocaleString()}</span></p>
                </div>
            </div>
            <div className="flex gap-1">
                <Button variant="ghost" className="text-gray-500 hover:text-blue-600 p-2" onClick={() => onEdit(loan.loanId)}>
                    <Edit size={18} />
                </Button>
                <Button variant="ghost" className="text-red-500 hover:text-red-700 p-2" onClick={() => onDelete(loan.loanId)}>
                    <Trash2 size={18} />
                </Button>
            </div>
        </div>
    </Card>
);

const LoanList = () => {
    const navigate = useNavigate();
    const { bankLoans, handLoans, refreshData } = useData();

    const handleDeleteBank = async (id) => {
        if (window.confirm('Are you sure you want to close this loan?')) {
            await deleteBankLoan(id);
            refreshData();
        }
    };

    const handleDeleteHand = async (id) => {
        if (window.confirm('Are you sure you want to close this loan?')) {
            await deleteHandLoan(id);
            refreshData();
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bank Loans Column */}
            <div className="lg:col-span-2">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                    Bank Loans
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{bankLoans.length}</span>
                </h3>
                {bankLoans.length === 0 ? (
                    <div className="text-gray-400 italic">No bank loans active.</div>
                ) : (
                    bankLoans.map(loan => (
                        <BankLoanItem
                            key={loan.loanId}
                            loan={loan}
                            onDelete={handleDeleteBank}
                            onEdit={(id) => navigate(`/edit-loan/bank/${id}`)}
                        />
                    ))
                )}
            </div>

            {/* Hand Loans Column */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                    Hand Loans
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{handLoans.length}</span>
                </h3>
                {handLoans.length === 0 ? (
                    <div className="text-gray-400 italic">No hand loans.</div>
                ) : (
                    handLoans.map(loan => (
                        <HandLoanItem
                            key={loan.loanId}
                            loan={loan}
                            onDelete={handleDeleteHand}
                            onEdit={(id) => navigate(`/edit-loan/hand/${id}`)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default LoanList;
