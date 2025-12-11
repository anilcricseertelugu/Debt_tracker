import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, HandCoins } from 'lucide-react';
import { Card } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';

const AddLoanSelector = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    useEffect(() => {
        if (!isAdmin) {
            navigate('/login');
        }
    }, [isAdmin, navigate]);

    if (!isAdmin) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Select Loan Type</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                    className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                    onClick={() => navigate('/add-loan/bank')}
                >
                    <div className="flex flex-col items-center text-center p-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                            <Building2 className="w-8 h-8 text-blue-600 group-hover:text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Bank Loan</h3>
                        <p className="text-gray-500">
                            Add a new loan from a bank or financial institution (EMI based).
                        </p>
                    </div>
                </Card>

                <Card
                    className="cursor-pointer hover:border-green-500 hover:shadow-md transition-all group"
                    onClick={() => navigate('/add-loan/hand')}
                >
                    <div className="flex flex-col items-center text-center p-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                            <HandCoins className="w-8 h-8 text-green-600 group-hover:text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Hand Loan</h3>
                        <p className="text-gray-500">
                            Add a personal loan from friends, family, or private lenders.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AddLoanSelector;
