import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { userService } from '../../services/userService';

const UserProfile = ({ user: propUser }) => {
    const navigate = useNavigate();
    const { user: contextUser, setUser: updateUserContext } = useUser();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchedRef = useRef(false);

    // Handle initial data loading from API
    useEffect(() => {
        // Prevent multiple fetches in development mode or on re-renders
        if (fetchedRef.current) return;

        const fetchUserProfile = async () => {
            try {
                // Determine user ID from available sources
                let userId = null;
                
                // Try to get ID from props first
                if (propUser?.id || propUser?.userId) {
                    userId = propUser.id || propUser.userId;
                }
                // Then from context
                else if (contextUser?.id || contextUser?.userId) {
                    userId = contextUser.id || contextUser.userId;
                }
                // Finally from localStorage
                else {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        userId = parsedUser.id || parsedUser.userId;
                    }
                }

                if (!userId) {
                    throw new Error('No user ID available');
                }

                console.log('Fetching user profile for userId:', userId);
                
                // Get fresh data from the API
                const userData = await userService.getUserById(userId);
                console.log('Fetched user data:', userData);
                
                // Update local state with fetched data
                setUser(userData);
                
                // UPDATE: Sync the fresh user data with context and localStorage
                // This ensures consistent user data across the app
                if (userData) {
                    console.log('Syncing fetched user data to context:', userData);
                    updateUserContext(userData);
                }
                
                setError(null);
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError('Failed to fetch user profile');
                
                // Fallback to prop/context/localStorage if API fails
                if (propUser) {
                    setUser(propUser);
                } else if (contextUser) {
                    setUser(contextUser);
                } else {
                    try {
                        const storedUser = localStorage.getItem('user');
                        if (storedUser) {
                            setUser(JSON.parse(storedUser));
                        }
                    } catch (e) {
                        console.error('Failed to parse stored user data:', e);
                    }
                }
            } finally {
                setIsLoading(false);
                fetchedRef.current = true;
            }
        };

        fetchUserProfile();
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - intentional to only run once on mount

    const handleChangePassword = () => {
        navigate('/profile/change-password');
    };

    // Edit Profile temporarily disabled due to authentication issues
    const handleEditProfileDisabled = () => {
        alert('Profile editing is temporarily disabled due to maintenance. Please try again later.');
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-xl">Loading user data...</div>
        </div>
    );

    if (error && !user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-xl text-red-500">
                    {error}. Please try again or log in again.
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-xl text-red-500">No user data available. Please log in again.</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                    <h1 className="text-2xl font-semibold">User Profile</h1>
                    <p className="opacity-80">Manage your account information</p>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </div>
                            <div className="ml-4">
                                <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
                                <p className="text-gray-600">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleEditProfileDisabled}
                                className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition duration-200 cursor-not-allowed"
                                title="Profile editing is temporarily disabled"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={handleChangePassword}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-gray-900">{user.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                                <dd className="mt-1 text-gray-900">{user.userId || user.id}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">First Name</dt>
                                <dd className="mt-1 text-gray-900">{user.firstName}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                                <dd className="mt-1 text-gray-900">{user.lastName}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                                <dd className="mt-1 text-gray-900">
                                    {user.createdAt 
                                        ? new Date(user.createdAt).toLocaleDateString() 
                                        : 'Not available'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Role</dt>
                                <dd className="mt-1 text-gray-900">{user.role || 'Student'}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium">Your Learning Stats</h3>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600">{user.totalDecks || 0}</div>
                                <div className="text-sm text-gray-500">Decks Created</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600">{user.cardsStudied || 0}</div>
                                <div className="text-sm text-gray-500">Cards Studied</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-yellow-600">{user.quizScore || 0}%</div>
                                <div className="text-sm text-gray-500">Avg Quiz Score</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile; 