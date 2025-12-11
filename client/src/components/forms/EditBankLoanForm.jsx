import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { getBankLoan, updateBankLoan, calculateEMI } from '../../services/api';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';

const EditBankLoanForm = () => {
    const navigate = useNavigate();
    const { loanId } = useParams();
    const { refreshData } = useData();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    const [formData, setFormData] = useState({
        loanName: '',
        bankName: '',
        loanType: 'Fresh',
        principalAmount: '',
        interestRate: '',
        tenureMonths: '',
        startDate: '',
        emisPaid: '0'
    });

    const [preview, setPreview] = useState(null);

    useEffect(() => {
        const fetchLoan = async () => {
            try {
                const { data } = await getBankLoan(loanId);
                if (data.success) {
                    const loan = data.data.loan;
                    setFormData({
                        loanName: loan.loanName,
                        bankName: loan.bankName,
                        loanType: loan.loanType,
                        principalAmount: loan.principalAmount,
                        interestRate: loan.interestRate,
                        tenureMonths: loan.tenureMonths,
                        startDate: loan.startDate ? loan.startDate.split('T')[0] : '',
                        emisPaid: loan.emisPaid
                    });

                    // Set initial preview
                    setPreview({
                        emiAmount: loan.emiAmount,
                        totalInterestPayable: loan.totalInterestPayable
                    });
                }
            } catch (err) {
                alert('Failed to fetch loan details');
                navigate('/');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchLoan();
    }, [loanId, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Reset preview if calculation factors change
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
        setLoading(true);
        try {
            const payload = {
                ...formData,
                principalAmount: parseFloat(formData.principalAmount),
                interestRate: parseFloat(formData.interestRate),
                tenureMonths: parseInt(formData.tenureMonths),
                emisPaid: parseInt(formData.emisPaid || 0)
            };

            await updateBankLoan(loanId, payload);
            await refreshData();
            navigate('/');
        } catch (err) {
            alert('Failed to update loan: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="p-8 text-center text-gray-500">Loading loan details...</div>;

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader title="Edit Bank Loan" subtitle={`Editing ${formData.loanName}`} />

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Loan Name"
                        name="loanName"
                        value={formData.loanName}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Bank Name"
                        name="bankName"
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

                    <Input
                        label="Start Date"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                    />

                    {formData.loanType === 'Ongoing' && (
                        <Input
                            label="EMIs Already Paid"
                            name="emisPaid"
                            type="number"
                            value={formData.emisPaid}
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
                    <Button type="submit" loading={loading}>Update Loan</Button>
                </div>
            </form>
        </Card>
    );
};

export default EditBankLoanForm;
