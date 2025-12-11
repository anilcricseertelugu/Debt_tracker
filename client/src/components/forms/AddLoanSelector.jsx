import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Building2, User } from 'lucide-react';

const AddLoanSelector = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Select Loan Type</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:border-blue-500 cursor-pointer transition-all hover:shadow-md group" onClick={() => navigate('/add-loan/bank')}>
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                            <Building2 className="w-8 h-8 text-blue-600 group-hover:text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Bank Loan</h3>
                        <p className="text-gray-500">Add a formal loan from a bank or financial institution (Home, Car, Personal).</p>
                    </div>
                </Card>

                <Card className="hover:border-green-500 cursor-pointer transition-all hover:shadow-md group" onClick={() => navigate('/add-loan/hand')}>
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                            <User className="w-8 h-8 text-green-600 group-hover:text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Hand Loan</h3>
                        <p className="text-gray-500">Add an informal loan from friends, family, or private lenders.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AddLoanSelector;
