import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { useUser } from '../contexts/UserContext';
import { googleConfig } from '../firebase';

const GoogleLoginButton = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { setUser } = useUser();

    const handleGoogleCredentialResponse = useCallback(async (response) => {
        setLoading(true);
        
        try {
            console.log("Google auth successful, credential received");
            
            // Extract the credential token from the response
            const credential = response.credential;
            
            // Call backend to verify and create/login user
            console.log("Calling backend /user/google endpoint...");
            const backendResponse = await userService.loginWithGoogle(credential);
            console.log("Backend response:", backendResponse);
            
            if (backendResponse && backendResponse.token) {
                // Store authentication data
                localStorage.setItem('token', backendResponse.token);
                
                // Make sure we have a complete user object with all necessary fields
                const userData = backendResponse.user || {};
                console.log("Initial user data:", userData);

                // Ensure we have userId (backend might return id or userId)
                if (!userData.userId && userData.id) {
                    userData.userId = userData.id;
                }
                
                // Process name data as a backup
                if (!userData.firstName) {
                    // Try to get firstName from name field
                    if (userData.name) {
                        userData.firstName = userData.name.split(' ')[0];
                    }
                    // Try to get firstName from displayName field
                    else if (userData.displayName) {
                        userData.firstName = userData.displayName.split(' ')[0];
                    }
                    // Use email username as fallback
                    else if (userData.email) {
                        userData.firstName = userData.email.split('@')[0];
                    }
                }
                
                // Ensure lastName is set if available
                if (!userData.lastName) {
                    if (userData.name && userData.name.includes(' ')) {
                        userData.lastName = userData.name.split(' ').slice(1).join(' ');
                    } else if (userData.displayName && userData.displayName.includes(' ')) {
                        userData.lastName = userData.displayName.split(' ').slice(1).join(' ');
                    }
                }
                
                // Store temporary user data
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Clear any existing admin data
                localStorage.removeItem('admin');
                
                try {
                    // IMPORTANT: Immediately fetch complete user profile
                    console.log("Fetching complete user profile after Google login...");
                    const userId = userData.id || userData.userId;
                    
                    if (userId) {
                        // Get complete profile data from backend
                        const fullUserData = await userService.getUserById(userId);
                        console.log("Complete user profile fetched:", fullUserData);
                        
                        // Preserve the auth token
                        fullUserData.token = backendResponse.token;
                        
                        // Update localStorage and context with complete data
                        localStorage.setItem('user', JSON.stringify(fullUserData));
                        setUser(fullUserData);
                    } else {
                        // Fall back to basic user data
                        setUser(userData);
                    }
                } catch (profileError) {
                    console.error("Failed to fetch complete profile after Google login:", profileError);
                    // Fall back to basic data
                    setUser(userData);
                }
                
                // Force a slight delay before navigation to ensure context is updated
                setTimeout(() => {
                    console.log("Ready for navigation, final user state:", localStorage.getItem('user'));
                    navigate('/dashboard');
                }, 500);
            } else {
                console.error("No token returned from server after Google login");
                throw new Error('Authentication failed. Please try again.');
            }
        } catch (error) {
            console.error("Google login failed:", error);
            alert(`Login failed: ${error.message || 'Unknown error occurred'}`);
        } finally {
            setLoading(false);
        }
    }, [navigate, setUser]);

    useEffect(() => {
        // Load the Google Identity script
        const loadGoogleScript = () => {
            // Only load if not already loaded
            if (!window.google) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                document.body.appendChild(script);
                
                script.onload = initializeGoogleButton;
            } else {
                initializeGoogleButton();
            }
        };

        const initializeGoogleButton = () => {
            if (window.google && !document.getElementById('google-signin-script')) {
                window.google.accounts.id.initialize({
                    client_id: googleConfig.client_id,
                    callback: handleGoogleCredentialResponse
                });
            }
        };

        loadGoogleScript();
    }, [handleGoogleCredentialResponse]);

    const renderGoogleButton = () => {
        if (window.google) {
            window.google.accounts.id.renderButton(
                document.getElementById('google-signin-button'),
                { 
                    theme: 'outline', 
                    size: 'large', 
                    width: 280,  // Increased width for better visibility
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'center'
                }
            );
        }
    };

    useEffect(() => {
        // Render the Google button once the component is mounted
        const timer = setTimeout(renderGoogleButton, 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex justify-center items-center w-full">
            {loading ? (
                <button
                    type="button"
                    disabled
                    className="w-full max-w-[280px] inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 transition-all duration-200"
                >
                    <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Connecting...</span>
                    </div>
                </button>
            ) : (
                <div id="google-signin-button" className="flex justify-center w-full"></div>
            )}
            
            {/* Fallback button in case Google API fails to load */}
            {!window.google && !loading && (
                <button
                    type="button"
                    onClick={() => alert("Google Sign-In is currently unavailable. Please try again later.")}
                    className="w-full max-w-[280px] mx-auto inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                    <span>Sign in with Google</span>
                </button>
            )}
        </div>
    );
};

export default GoogleLoginButton;
