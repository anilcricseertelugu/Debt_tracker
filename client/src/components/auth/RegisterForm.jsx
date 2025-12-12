import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../ui/Card';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const result = await register(formData.username, formData.email, formData.password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <Card className="w-full max-w-md p-8">
                <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">Create Account</h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-text-secondary text-sm font-medium mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-background-main border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-text-secondary text-sm font-medium mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-background-main border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-text-secondary text-sm font-medium mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-background-main border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-text-secondary text-sm font-medium mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full bg-background-main border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-medium py-2 rounded-lg transition-colors mt-2"
                    >
                        Sign Up
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-text-secondary">
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand-primary hover:underline">
                        Login
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default RegisterForm;
