import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const AdminNavbar = ({ admin, onLogout }) => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Render different navbar based on admin login status
    if (!admin) {
        return (
            <nav className="bg-blue-700 text-white py-4 px-8 shadow-lg w-full top-0 left-0 right-0 m-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">
                        QuizWhiz Admin
                    </h1>
                    <Link to="/admin/login" className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded transition">
                        Admin Login
                    </Link>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-blue-700 text-white py-4 px-8 shadow-lg w-full top-0 left-0 right-0 m-0">
            <div className="flex items-center justify-between">
                <h1
                    className="text-xl font-semibold cursor-pointer hover:text-blue-200 transition"
                    onClick={() => navigate('/admin')}
                >
                    Admin Panel
                </h1>

                {/* Centered navigation links */}
                <div className="flex gap-6">
                    <button onClick={() => navigate('/admin')} className="hover:text-blue-200 transition">
                        Dashboard
                    </button>
                    <button onClick={() => navigate('/admin/users')} className="hover:text-blue-200 transition">
                        Manage Users
                    </button>
                    <button onClick={() => navigate('/admin/decks')} className="hover:text-blue-200 transition">
                        Manage Decks
                    </button>
                </div>

                {/* Admin Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 hover:text-blue-200 transition focus:outline-none p-2 rounded"
                    >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-md font-bold">
                            {admin.firstName?.charAt(0)}{admin.lastName?.charAt(0)}
                        </div>
                        <p>{admin.firstName || 'Admin'} {admin.lastName || ''}</p>
                        <svg
                            className={`w-4 h-4 transform transition-transform ${
                                isDropdownOpen ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-lg z-50">
                            <button
                                onClick={() => navigate('/admin/profile')}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                                Profile
                            </button>
                            <button
                                onClick={onLogout}
                                className="block w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default AdminNavbar;