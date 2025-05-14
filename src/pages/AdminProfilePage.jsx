import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminProfilePage = () => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Retrieve admin data from localStorage
        const storedAdmin = localStorage.getItem('admin');
        if (storedAdmin) {
            const adminData = JSON.parse(storedAdmin);
            setAdmin(adminData);
        }
        setIsLoading(false);
    }, []);

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-blue-700 text-white p-6">
                    <h1 className="text-2xl font-semibold">Admin Profile</h1>
                    <p className="opacity-80">Manage your account information</p>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {admin.firstName?.charAt(0)}{admin.lastName?.charAt(0)}
                            </div>
                            <div className="ml-4">
                                <h2 className="text-xl font-semibold">{admin.firstName} {admin.lastName}</h2>
                                <p className="text-gray-600">{admin.role || 'Administrator'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-gray-900">{admin.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                <dd className="mt-1 text-gray-900">{admin.phone || 'Not provided'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Role</dt>
                                <dd className="mt-1 text-gray-900">{admin.role || 'Administrator'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Account ID</dt>
                                <dd className="mt-1 text-gray-900">{admin.id}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium">Security</h3>
                        <div className="mt-4">
                            <button
                                onClick={() => navigate('/admin/change-password')}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfilePage;
