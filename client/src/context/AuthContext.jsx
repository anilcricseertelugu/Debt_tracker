import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for token
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const { data } = await api.post('/auth/login', {
                username,
                password
            });

            if (data.success) {
                setUser(data.data);
                localStorage.setItem('userInfo', JSON.stringify(data.data));
                return { success: true };
            }
        } catch (error) {
            console.error('Login Error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Login failed'
            };
        }
    };

    const register = async (username, email, password) => {
        try {
            const { data } = await api.post('/auth/register', {
                username,
                email,
                password
            });

            if (data.success) {
                setUser(data.data);
                localStorage.setItem('userInfo', JSON.stringify(data.data));
                return { success: true };
            }
        } catch (error) {
            console.error('Registration Error:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
    };



    // Attach token to all requests if user is logged in
    useEffect(() => {
        const interceptor = api.interceptors.request.use(
            (config) => {
                if (user && user.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        return () => api.interceptors.request.eject(interceptor);
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isAdmin: user?.role === 'admin' }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
