import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        const result = await register(formData.username, formData.email, formData.password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <Card className="w-full max-w-md">
                <CardHeader title="Create Account" subtitle="Join to track your debts" />

                <form onSubmit={handleSubmit} className="mt-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />

                    <div className="mt-6">
                        <Button type="submit" loading={loading} className="w-full">
                            Sign Up
                        </Button>
                    </div>
                </form>

                <div className="mt-4 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <span
                        onClick={() => navigate('/login')}
                        className="text-blue-600 hover:underline cursor-pointer font-medium"
                    >
                        Login
                    </span>
                </div>
            </Card>
        </div>
    );
};

export default RegisterForm;
