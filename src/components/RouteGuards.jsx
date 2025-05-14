import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const [isValidating, setIsValidating] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const navigate = useNavigate();
    const { user, setUser } = useUser();

    console.log('PrivateRoute - checking auth. Token exists:', !!token, 'User data exists:', !!userData);
    console.log('PrivateRoute - Context user:', user);
    
    useEffect(() => {
        const validateUser = async () => {
            try {
                if (!token || !userData) {
                    console.error('PrivateRoute - No credentials. Token:', !!token, 'User data:', !!userData);
                    throw new Error('No user credentials found');
                }

                // Parse user data
                const parsedUser = JSON.parse(userData);
                console.log('PrivateRoute - Parsed user data:', parsedUser);
                
                // Accept either id or userId field
                if (!parsedUser || (!parsedUser.id && !parsedUser.userId)) {
                    console.error('PrivateRoute - Invalid user object:', parsedUser);
                    throw new Error('Invalid user data');
                }

                // Update context if needed
                if (!user && setUser) {
                    setUser(parsedUser);
                }

                console.log('PrivateRoute - User authenticated successfully');
                setIsAuthorized(true);
            } catch (error) {
                console.error('User validation failed:', error);
                navigate('/login');
            } finally {
                setIsValidating(false);
            }
        };

        validateUser();
    }, [token, userData, navigate, user, setUser]);

    if (isValidating) {
        return <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2">Validating your access...</p>
        </div>;
    }

    return isAuthorized ? children : <Navigate to="/login" />;
}

export function AdminRoute({ children }) {
    const token = localStorage.getItem('token');
    const adminData = localStorage.getItem('admin');
    const [isValidating, setIsValidating] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const navigate = useNavigate();

    console.log('AdminRoute - checking auth. Token exists:', !!token, 'Admin data exists:', !!adminData);

    useEffect(() => {
        const validateAdmin = async () => {
            try {
                if (!token || !adminData) {
                    console.error('AdminRoute - No credentials. Token:', !!token, 'Admin data:', !!adminData);
                    throw new Error('No admin credentials found');
                }

                // Parse admin data
                const admin = JSON.parse(adminData);
                console.log('AdminRoute - Parsed admin data:', admin);
                
                if (!admin || !admin.id) {
                    console.error('AdminRoute - Invalid admin object:', admin);
                    throw new Error('Invalid admin data');
                }

                console.log('AdminRoute - Admin authenticated successfully');
                setIsAuthorized(true);
            } catch (error) {
                console.error('Admin validation failed:', error);
                
                // Don't clear localStorage here - this is causing the logout issue
                // localStorage.removeItem('token');
                // localStorage.removeItem('admin');
                
                // Just redirect to admin login without clearing data
                navigate('/admin/login');
            } finally {
                setIsValidating(false);
            }
        };

        validateAdmin();
    }, [token, adminData, navigate]);

    if (isValidating) {
        return <div>Validating admin access...</div>;
    }

    return isAuthorized ? children : <Navigate to="/admin/login" />;
} 