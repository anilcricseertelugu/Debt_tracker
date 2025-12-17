import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { addPayment, calculateForeclosure } from '../../services/api';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';

const RecordPaymentForm = () => {
    const navigate = useNavigate();
    const { bankLoans, handLoans, refreshData } = useData();
    const [loading, setLoading] = useState(false);

    const [selectedLoanId, setSelectedLoanId] = useState('');
    const [loanType, setLoanType] = useState('Bank'); // Bank or Hand

    const [formData, setFormData] = useState({
        paymentDate: new Date().toISOString().split('T')[0],
        paymentType: '',
        amountPaid: '',
        notes: ''
    });

    const [foreclosurePreview, setForeclosurePreview] = useState(null);

    // Generate options
    const bankOptions = bankLoans.map(l => ({ value: l.loanId, label: `${l.loanName} (Bank)` }));
    const handOptions = handLoans.map(l => ({ value: l.loanId, label: `${l.lenderName} (Hand)` }));
    const allLoanOptions = [{ value: '', label: '-- Select Loan --' }, ...bankOptions, ...handOptions];

    const currentLoan = [...bankLoans, ...handLoans].find(l => l.loanId === selectedLoanId);

    useEffect(() => {
        if (currentLoan) {
            // Determine type
            const type = bankLoans.find(l => l.loanId === currentLoan.loanId) ? 'Bank' : 'Hand';
            setLoanType(type);

            // Reset payment type when loan changes
            setFormData(prev => ({
                ...prev,
                paymentType: type === 'Bank' ? 'EMI' : (currentLoan.loanType === 'Monthly_Interest' ? 'Interest' : 'Repayment')
            }));
        }
    }, [selectedLoanId, bankLoans, handLoans]);

    // Handle Foreclosure Calculation
    useEffect(() => {
        const calc = async () => {
            if (loanType === 'Bank' && formData.paymentType === 'Foreclosure' && currentLoan) {
                try {
                    const { data } = await calculateForeclosure({
                        loanId: currentLoan.loanId,
                        foreclosureDate: formData.paymentDate
                    });
                    if (data.success) {
                        setForeclosurePreview(data.data);
                        // Auto-fill amount?
                        setFormData(prev => ({ ...prev, amountPaid: data.data.totalForeclosureAmount }));
                    }
                } catch (err) {
                    console.error(err);
                }
            } else {
                setForeclosurePreview(null);
            }
        };
        calc();
    }, [loanType, formData.paymentType, formData.paymentDate, currentLoan]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedLoanId) return;

        setLoading(true);
        try {
            await addPayment({
                loanId: selectedLoanId,
                loanType,
                ...formData,
                amountPaid: parseFloat(formData.amountPaid)
            });
            await refreshData();
            navigate('/');
        } catch (err) {
            alert('Failed to record payment: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Determine Payment Type Options
    let paymentTypeOptions = [];
    if (loanType === 'Bank') {
        paymentTypeOptions = [
            { value: 'EMI', label: 'Monthly EMI' },
            { value: 'Partial', label: 'Partial Prepayment' },
            { value: 'Foreclosure', label: 'Full Foreclosure' }
        ];
    } else if (loanType === 'Hand') {
        if (currentLoan?.loanType === 'Monthly_Interest') {
            paymentTypeOptions = [
                { value: 'Interest', label: 'Monthly Interest Interest' },
                { value: 'Principal', label: 'Principal Repayment' }
            ];
        } else {
            paymentTypeOptions = [{ value: 'Repayment', label: 'Loan Repayment' }];
        }
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader title="Record Payment" subtitle="Log an EMI or repayment" />

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <Select
                        label="Select Loan"
                        value={selectedLoanId}
                        onChange={(e) => setSelectedLoanId(e.target.value)}
                        options={allLoanOptions}
                    />
                    {currentLoan && (
                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 mb-4">
                            <p><span className="font-semibold">Outstanding Balance:</span> ₹{(currentLoan.remainingPrincipal || currentLoan.remainingBalance || 0).toLocaleString()}</p>

                            {/* Derive type check directly to avoid state lag crash */}
                            {bankLoans.some(l => l.loanId === currentLoan.loanId) && (
                                <p><span className="font-semibold">EMI Amount:</span> ₹{(currentLoan.emiAmount || 0).toLocaleString()}</p>
                            )}
                        </div>
                    )}
                </div>

                {selectedLoanId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Payment Date"
                            name="paymentDate"
                            type="date"
                            value={formData.paymentDate}
                            onChange={handleChange}
                            required
                        />

                        <Select
                            label="Payment Type"
                            name="paymentType"
                            value={formData.paymentType}
                            onChange={handleChange}
                            options={paymentTypeOptions}
                        />

                        <div className="col-span-2">
                            <Input
                                label="Amount (₹)"
                                name="amountPaid"
                                type="number"
                                value={formData.amountPaid}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-span-2">
                            <Input
                                label="Notes (Optional)"
                                name="notes"
                                placeholder="e.g. December EMI"
                                value={formData.notes}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                )}

                {foreclosurePreview && (
                    <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                        <h4 className="font-bold mb-2">Foreclosure Summary</h4>
                        <p>Principal: ₹{foreclosurePreview.remainingPrincipal.toLocaleString()}</p>
                        <p>Interest: ₹{foreclosurePreview.accruedInterest.toLocaleString()}</p>
                        <p>Charges: ₹{foreclosurePreview.prepaymentCharge.toLocaleString()}</p>
                        <p className="font-bold border-t border-yellow-200 mt-2 pt-1">Total: ₹{foreclosurePreview.totalForeclosureAmount.toLocaleString()}</p>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-8">
                    <Button type="button" variant="ghost" onClick={() => navigate('/')}>Cancel</Button>
                    <Button type="submit" loading={loading} disabled={!selectedLoanId}>Record Payment</Button>
                </div>
            </form>
        </Card>
    );
};

export default RecordPaymentForm;
