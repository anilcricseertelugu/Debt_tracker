import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { addBankLoan, calculateEMI } from '../../services/api';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';

const AddBankLoanForm = () => {
    const navigate = useNavigate();
    const { refreshData } = useData();
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);

    const [formData, setFormData] = useState({
        loanName: '',
        bankName: '',
        loanType: 'Fresh', // Fresh or Ongoing
        principalAmount: '',
        interestRate: '',
        tenureMonths: '',
        startDate: new Date().toISOString().split('T')[0],
        emisPaid: '0'
    });

    const [preview, setPreview] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Reset preview on change? or Debounce calc?
        if (['principalAmount', 'interestRate', 'tenureMonths'].includes(name)) {
            setPreview(null);
        }
    };

    const handleCalculate = async () => {
        if (!formData.principalAmount || !formData.interestRate || !formData.tenureMonths) return;
        setCalculating(true);
        try {
            const { data } = await calculateEMI({
                principalAmount: parseFloat(formData.principalAmount),
                interestRate: parseFloat(formData.interestRate),
                tenureMonths: parseInt(formData.tenureMonths)
            });
            if (data.success) {
                setPreview(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCalculating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting Bank Loan Form...', formData);
        setLoading(true);
        try {
            console.log('Sending API Request...');
            const payload = {
                ...formData,
                principalAmount: parseFloat(formData.principalAmount),
                interestRate: parseFloat(formData.interestRate),
                tenureMonths: parseInt(formData.tenureMonths),
                emisPaid: parseInt(formData.emisPaid || 0)
            };
            console.log('Payload:', payload);

            const response = await addBankLoan(payload);
            console.log('API Response:', response);

            await refreshData();
            console.log('Data refreshed, navigating...');
            navigate('/');
        } catch (err) {
            console.error('Submission Error:', err);
            alert('Failed to add loan: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader title="Add New Bank Loan" subtitle="Enter details for a fresh or existing bank loan" />

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Loan Name"
                        name="loanName"
                        placeholder="e.g. Home Loan"
                        value={formData.loanName}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Bank Name"
                        name="bankName"
                        placeholder="e.g. HDFC"
                        value={formData.bankName}
                        onChange={handleChange}
                        required
                    />

                    <Select
                        label="Loan Status"
                        name="loanType"
                        value={formData.loanType}
                        onChange={handleChange}
                        options={[
                            { value: 'Fresh', label: 'New Loan (Fresh)' },
                            { value: 'Ongoing', label: 'Existing Loan (Ongoing)' }
                        ]}
                    />

                    <Input
                        label="Principal Amount (₹)"
                        name="principalAmount"
                        type="number"
                        value={formData.principalAmount}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Interest Rate (% p.a.)"
                        name="interestRate"
                        type="number"
                        step="0.01"
                        value={formData.interestRate}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Tenure (Months)"
                        name="tenureMonths"
                        type="number"
                        value={formData.tenureMonths}
                        onChange={handleChange}
                        required
                    />

                    {formData.loanType === 'Ongoing' && (
                        <>
                            <Input
                                label="Start Date"
                                name="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="EMIs Already Paid"
                                name="emisPaid"
                                type="number"
                                value={formData.emisPaid}
                                onChange={handleChange}
                                required
                            />
                        </>
                    )}

                    {formData.loanType === 'Fresh' && (
                        <Input
                            label="Start Date"
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />
                    )}
                </div>

                {/* Calculation Preview */}
                <div className="mt-6 mb-6 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                    {preview ? (
                        <div>
                            <p className="text-sm text-blue-800">Monthly EMI</p>
                            <p className="text-2xl font-bold text-blue-700">₹{preview.emiAmount.toLocaleString()}</p>
                            <p className="text-xs text-blue-600 mt-1">Total Interest: ₹{preview.totalInterestPayable.toLocaleString()}</p>
                        </div>
                    ) : (
                        <div className="text-sm text-blue-800">Enter details to calculate EMI</div>
                    )}

                    <Button type="button" variant="secondary" onClick={handleCalculate} loading={calculating} size="sm">
                        Calculate EMI
                    </Button>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <Button type="button" variant="ghost" onClick={() => navigate('/')}>Cancel</Button>
                    <Button type="submit" loading={loading}>Save Loan</Button>
                </div>
            </form>
        </Card>
    );
};

export default AddBankLoanForm;
