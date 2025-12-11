import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { addHandLoan } from '../../services/api';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';

const AddHandLoanForm = () => {
    const navigate = useNavigate();
    const { refreshData } = useData();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        lenderName: '',
        loanType: 'Monthly_Interest', // or Interest_Free
        principalAmount: '',
        monthlyInterestRate: '',
        startDate: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                principalAmount: parseFloat(formData.principalAmount),
            };

            if (formData.loanType === 'Monthly_Interest') {
                payload.monthlyInterestRate = parseFloat(formData.monthlyInterestRate);
            }

            await addHandLoan(payload);
            await refreshData();
            navigate('/');
        } catch (err) {
            alert('Failed to add loan: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader title="Add New Hand Loan" subtitle="Record a loan from friend, family, or private lender" />

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Lender Name"
                        name="lenderName"
                        placeholder="e.g. John Doe"
                        value={formData.lenderName}
                        onChange={handleChange}
                        required
                    />

                    <Select
                        label="Loan Type"
                        name="loanType"
                        value={formData.loanType}
                        onChange={handleChange}
                        options={[
                            { value: 'Monthly_Interest', label: 'Monthly Interest' },
                            { value: 'Interest_Free', label: 'Interest Free' }
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
                        label="Start Date"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                    />

                    {formData.loanType === 'Monthly_Interest' && (
                        <Input
                            label="Monthly Interest Rate (%)"
                            name="monthlyInterestRate"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 2"
                            value={formData.monthlyInterestRate}
                            onChange={handleChange}
                            required
                        />
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <Button type="button" variant="ghost" onClick={() => navigate('/')}>Cancel</Button>
                    <Button type="submit" loading={loading}>Save Loan</Button>
                </div>
            </form>
        </Card>
    );
};

export default AddHandLoanForm;
