import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    config => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const { token } = JSON.parse(userInfo);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    error => Promise.reject(error)
);

// Response interceptor for consistent error handling if needed
api.interceptors.response.use(
    respons => respons,
    error => {
        console.error('API Error:', error.response?.data?.message || error.message);
        return Promise.reject(error);
    }
);

// --- Bank Loans ---
export const getBankLoans = (status = 'Active') =>
    api.get(`/loans/bank?status=${status}`);

export const getBankLoan = (loanId) =>
    api.get(`/loans/bank/${loanId}`);

export const addBankLoan = (data) =>
    api.post('/loans/bank', data);

export const updateBankLoan = (loanId, data) =>
    api.put(`/loans/bank/${loanId}`, data);

export const deleteBankLoan = (loanId) =>
    api.delete(`/loans/bank/${loanId}`);

// --- Hand Loans ---
export const getHandLoans = (status = 'Active') =>
    api.get(`/loans/hand?status=${status}`);

export const getHandLoan = (loanId) =>
    api.get(`/loans/hand/${loanId}`);

export const addHandLoan = (data) =>
    api.post('/loans/hand', data);

export const updateHandLoan = (loanId, data) =>
    api.put(`/loans/hand/${loanId}`, data);

export const deleteHandLoan = (loanId) =>
    api.delete(`/loans/hand/${loanId}`);

// --- Payments ---
export const getPayments = (filters = {}) =>
    api.get('/payments', { params: filters });

export const getPaymentsByLoan = (loanId) =>
    api.get(`/payments/loan/${loanId}`);

export const addPayment = (data) =>
    api.post('/payments', data);

// --- Dashboard ---
export const getDashboardSummary = () =>
    api.get('/dashboard/summary');

export const getDashboardAnalytics = () =>
    api.get('/dashboard/analytics');

// --- Calculations ---
export const calculateEMI = (data) =>
    api.post('/calculate/emi', data);

export const calculateForeclosure = (data) =>
    api.post('/calculate/foreclosure', data);

export const getAmortizationSchedule = (loanId) =>
    api.get(`/calculate/amortization/${loanId}`);

// --- Budget ---
export const getIncomes = () => api.get('/budget/income');
export const addIncome = (data) => api.post('/budget/income', data);
export const deleteIncome = (id) => api.delete(`/budget/income/${id}`);

export const getExpenses = () => api.get('/budget/expenses');
export const addExpense = (data) => api.post('/budget/expenses', data);
export const deleteExpense = (id) => api.delete(`/budget/expenses/${id}`);

export const getRecurringExpenses = () => api.get('/budget/recurring');
export const addRecurringExpense = (data) => api.post('/budget/recurring', data);
export const deleteRecurringExpense = (id) => api.delete(`/budget/recurring/${id}`);

export const getBudgetSummary = () => api.get('/budget/summary');

// Simulation API
export const initSimulation = () => api.post('/simulation/init');
export const nextSimulationStage = (data) => api.post('/simulation/next', data);
export const getSimulationSession = () => api.get('/simulation/current');

export default api;
