import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = ({ admin: propAdmin }) => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const fetchedRef = useRef(false);

    // Set admin data from props or localStorage on mount
    useEffect(() => {
        if (fetchedRef.current) return;

        let adminData = propAdmin;
        
        // If no admin from props, try from localStorage
        if (!adminData) {
            const storedAdmin = localStorage.getItem('admin');
            if (storedAdmin) {
                try {
                    adminData = JSON.parse(storedAdmin);
                    console.log('Loaded admin data from localStorage:', adminData);
                } catch (err) {
                    console.error('Failed to parse admin data from localStorage', err);
                }
            }
        }
        
        if (adminData) {
            setAdmin(adminData);
        }
        
        fetchedRef.current = true;
    }, [propAdmin]);

    if (!admin) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl text-red-500">No admin data available. Please log in again.</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 flex justify-center py-20">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
                <h1 className="text-3xl font-bold mb-2 text-center text-blue-700">
                    Welcome, {admin.firstName || 'Admin'}
                </h1>
                <div className="space-y-4 mb-6 text-center">
                    <p><strong>Your ID:</strong> {admin.id}</p>
                    <p><strong>Email:</strong> {admin.email}</p>
                </div>
                <p className="text-center text-gray-600 mb-6">
                    Here's a quick overview of your admin panel.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                    >
                        Manage Users
                    </button>
                    <button
                        onClick={() => navigate('/admin/decks')}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                    >
                        Manage Decks
                    </button>
                    <button
                        onClick={() => navigate('/admin/reports')}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                    >
                        View Reports
                    </button>
                    <button
                        onClick={() => navigate('/admin/profile')}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                    >
                        Admin Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
