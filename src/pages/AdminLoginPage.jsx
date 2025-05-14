import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import AdminLoginForm from '../components/AdminLoginForm';

const AdminLoginPage = ({ setIsLoggedIn, setAdmin }) => {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if already logged in as admin
        const token = localStorage.getItem('token');
        const adminData = localStorage.getItem('admin');
        if (token && adminData) {
            try {
                const admin = JSON.parse(adminData);
                if (admin && admin.id) {
                    setAdmin(admin);
                    setIsLoggedIn(true);
                    navigate('/admin');
                }
            } catch (error) {
                console.error('Failed to parse admin data:', error);
                // Clear invalid data
                localStorage.removeItem('token');
                localStorage.removeItem('admin');
            }
        }
    }, [navigate, setAdmin, setIsLoggedIn]);

    const handleLogin = async (email, password) => {
        try {
            const response = await userService.loginAdmin(email, password);
            console.log('Admin login response:', response);

            if (!response || !response.admin || !response.token) {
                throw new Error('Invalid admin data received');
            }

            // Store admin data and token
            localStorage.setItem('token', response.token);
            localStorage.setItem('admin', JSON.stringify(response.admin));
            
            // Update application state
            setIsLoggedIn(true);
            setAdmin(response.admin);

            // Clear any existing user data to prevent conflicts
            localStorage.removeItem('user');
            
            // Navigate to admin dashboard
            navigate('/admin');
        } catch (error) {
            console.error('Admin login failed:', error);
            setError(error.message || 'Admin login failed');
            
            // Clear any existing authentication data on error
            localStorage.removeItem('token');
            localStorage.removeItem('admin');
            setIsLoggedIn(false);
            setAdmin(null);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 px-4 py-20">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Admin Login</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <AdminLoginForm onLogin={handleLogin} />
        </div>
    );
};

export default AdminLoginPage;