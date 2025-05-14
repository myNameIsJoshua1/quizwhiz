import React from 'react';
import AdminNavbar from './AdminNavbar';

const AdminLayout = ({ children, admin, onLogout }) => {
    // Always show the AdminNavbar, even when not logged in
    return (
        <div className="min-h-screen bg-gray-100 w-full m-0 p-0">
            <AdminNavbar admin={admin} onLogout={onLogout} />
            
            {/* Show content only if admin is logged in, otherwise show access denied message */}
            {admin ? (
                <div className="w-full p-4">
                    {children}
                </div>
            ) : (
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <div className="text-xl font-semibold text-red-600">
                        Access denied. Please log in as admin.
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;