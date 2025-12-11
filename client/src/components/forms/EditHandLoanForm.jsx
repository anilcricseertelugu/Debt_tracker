import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { getHandLoan, updateHandLoan } from '../../services/api';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';

const EditHandLoanForm = () => {
    const navigate = useNavigate();
    const { loanId } = useParams();
    const { refreshData } = useData();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [formData, setFormData] = useState({
        lenderName: '',
        loanType: 'Monthly_Interest',
        principalAmount: '',
        monthlyInterestRate: '',
        startDate: ''
    });

    useEffect(() => {
        const fetchLoan = async () => {
            try {
                const { data } = await getHandLoan(loanId);
                if (data.success) {
                    const loan = data.data;
                    setFormData({
                        lenderName: loan.lenderName,
                        loanType: loan.loanType,
                        principalAmount: loan.principalAmount,
                        monthlyInterestRate: loan.monthlyInterestRate || '',
                        startDate: loan.startDate ? loan.startDate.split('T')[0] : ''
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

            await updateHandLoan(loanId, payload);
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
            <CardHeader title="Edit Hand Loan" subtitle={`Editing loan from ${formData.lenderName}`} />

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Lender Name"
                        name="lenderName"
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
                            value={formData.monthlyInterestRate}
                            onChange={handleChange}
                            required
                        />
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <Button type="button" variant="ghost" onClick={() => navigate('/')}>Cancel</Button>
                    <Button type="submit" loading={loading}>Update Loan</Button>
                </div>
            </form>
        </Card>
    );
};

export default EditHandLoanForm;
