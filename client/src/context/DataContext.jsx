import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};

export const DataProvider = ({ children }) => {
    const { user } = useAuth(); // Get user from AuthContext
    const [bankLoans, setBankLoans] = useState([]);
    const [handLoans, setHandLoans] = useState([]);
    const [dashboardSummary, setDashboardSummary] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch critical data
    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const [bankRes, handRes, summaryRes, analyticsRes] = await Promise.all([
                api.getBankLoans('Active'),
                api.getHandLoans('Active'),
                api.getDashboardSummary(),
                api.getDashboardAnalytics()
            ]);

            if (bankRes.data.success) setBankLoans(bankRes.data.data);
            if (handRes.data.success) setHandLoans(handRes.data.data);
            if (summaryRes.data.success) setDashboardSummary(summaryRes.data.data);
            if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);

            setError(null);
        } catch (err) {
            console.error('Failed to load data', err);
            setError('Failed to load data. Please check if backend is running.');
        } finally {
            setLoading(false);
        }
    }, [user]); // Depend on user so it sees the latest token in interceptor (via localStorage which is sync, but good practice to react to auth change)

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const value = {
        bankLoans,
        handLoans,
        dashboardSummary,
        analytics,
        loading,
        error,
        refreshData
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
