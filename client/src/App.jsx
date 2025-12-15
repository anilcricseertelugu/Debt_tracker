import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/dashboard';
import AddLoanSelector from './components/forms/AddLoanSelector';
import AddBankLoanForm from './components/forms/AddBankLoanForm';
import AddHandLoanForm from './components/forms/AddHandLoanForm';
import EditBankLoanForm from './components/forms/EditBankLoanForm';
import EditHandLoanForm from './components/forms/EditHandLoanForm';
import RecordPaymentForm from './components/forms/RecordPaymentForm';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import BudgetTracker from './components/budget/BudgetTracker';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/" element={<Dashboard />} />

              <Route path="add-loan" element={<AddLoanSelector />} />
              <Route path="add-loan/bank" element={<AddBankLoanForm />} />
              <Route path="add-loan/hand" element={<AddHandLoanForm />} />

              <Route path="edit-loan/bank/:loanId" element={<EditBankLoanForm />} />
              <Route path="edit-loan/hand/:loanId" element={<EditHandLoanForm />} />

              <Route path="pay" element={<RecordPaymentForm />} />
              <Route path="budget-tracker" element={<BudgetTracker />} />
            </Routes>
          </Layout>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
