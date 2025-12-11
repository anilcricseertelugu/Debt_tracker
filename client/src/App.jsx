import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './components/dashboard';
import AddLoanSelector from './components/forms/AddLoanSelector';
import AddBankLoanForm from './components/forms/AddBankLoanForm';
import AddHandLoanForm from './components/forms/AddHandLoanForm';
import EditBankLoanForm from './components/forms/EditBankLoanForm';
import EditHandLoanForm from './components/forms/EditHandLoanForm';
import RecordPaymentForm from './components/forms/RecordPaymentForm';

function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />

            <Route path="add-loan" element={<AddLoanSelector />} />
            <Route path="add-loan/bank" element={<AddBankLoanForm />} />
            <Route path="add-loan/hand" element={<AddHandLoanForm />} />

            <Route path="edit-loan/bank/:loanId" element={<EditBankLoanForm />} />
            <Route path="edit-loan/hand/:loanId" element={<EditHandLoanForm />} />

            <Route path="pay" element={<RecordPaymentForm />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </DataProvider>
    </BrowserRouter>
  );
}

export default App;
