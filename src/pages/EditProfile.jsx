import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { userService } from '../services/userService';

const EditProfile = () => {
    const navigate = useNavigate();
    const { user: contextUser, setUser: updateUserContext } = useUser();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const fetchedRef = useRef(false);
    
    useEffect(() => {
        // Prevent multiple fetches
        if (fetchedRef.current) return;
        
        const fetchUserData = async () => {
            try {
                let userId = null;

                // Try to get ID from context first
                if (contextUser?.id || contextUser?.userId) {
                    userId = contextUser.id || contextUser.userId;
                } else {
                    // Then from localStorage
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        userId = parsedUser.id || parsedUser.userId;
                    }
                }

                if (!userId) {
                    throw new Error('No user ID available');
                }

                // Get fresh data from the API
                const userData = await userService.getUserById(userId);
                
                // Initialize form with user data
                setFormData({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    role: userData.role || ''
                });
                
                setError(null);
                fetchedRef.current = true;
            } catch (err) {
                console.error('Error fetching user data for edit:', err);
                setError('Failed to load user data. Please try again.');
                
                // Fallback to context data
                if (contextUser) {
                    setFormData({
                        firstName: contextUser.firstName || '',
                        lastName: contextUser.lastName || '',
                        email: contextUser.email || '',
                        role: contextUser.role || ''
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);
        
        try {
            // Get the current stored user data with all fields
            const storedUserData = JSON.parse(localStorage.getItem('user') || '{}');
            let userId = storedUserData.id || storedUserData.userId || contextUser?.id || contextUser?.userId;
            
            if (!userId) {
                throw new Error('No user ID available for update');
            }
            
            // Extract the authentication token before updating
            const token = storedUserData.token;
            
            // *** IMPORTANT FIX FOR PASSWORD LOSS ISSUE ***
            // Create a focused update payload that ONLY includes the fields we want to change
            // This helps prevent the backend from setting other fields to null or empty values
            const nameUpdateOnly = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                // Keep the original email (but don't change it)
                email: formData.email,
                // Essential flag to tell the backend NOT to update the password
                _preservePassword: true
            };
            
            console.log('Update payload (name-only):', nameUpdateOnly);
            
            // Call the API to update profile but don't assign the result since we're not using it
            await userService.updateUser(userId, nameUpdateOnly);
            
            // Ensure we preserve the token and important fields
            const mergedUser = { 
                ...storedUserData,              // Keep all original data
                firstName: formData.firstName,  // Only update the first name
                lastName: formData.lastName,    // Only update the last name
                token: token,                   // Ensure token is preserved
                id: storedUserData.id,          // Keep the original ID
                userId: storedUserData.userId   // Keep the original userId
            };
            
            // Update local storage and context with merged data
            localStorage.setItem('user', JSON.stringify(mergedUser));
            updateUserContext(mergedUser);
            
            setSuccess(true);
            
            // Navigate back to profile after a delay
            setTimeout(() => {
                navigate('/profile');
            }, 1500);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                    <h1 className="text-2xl font-semibold">Edit Profile</h1>
                    <p className="opacity-80">Update your personal information</p>
                </div>
                
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                            Profile updated successfully!
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email (Read Only)
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Please contact support if you need to update your email.</p>
                        </div>
                        
                        <div className="mb-6">
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                Role (Read Only)
                            </label>
                            <input
                                type="text"
                                id="role"
                                name="role"
                                value={formData.role || "Student"}
                                disabled
                                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Role cannot be changed. Please contact an administrator if you need a role change.</p>
                        </div>
                        
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 flex items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting && (
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfile; 