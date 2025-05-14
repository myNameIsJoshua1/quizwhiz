import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/userService';

// Create context with default values to prevent undefined errors
const UserContext = createContext({
    user: null,
    setUser: () => {}
});

export const useUser = () => {
    return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load user from localStorage and fetch complete profile if needed
    useEffect(() => {
        const fetchCompleteUserProfile = async (basicUserData) => {
            try {
                // Extract user ID
                const userId = basicUserData.id || basicUserData.userId;
                if (!userId) {
                    console.warn('Cannot fetch complete profile: No user ID found');
                    return basicUserData;
                }
                
                console.log('Fetching complete user profile from API for userId:', userId);
                const completeUserData = await userService.getUserById(userId);
                
                // Preserve the auth token from the original data
                completeUserData.token = basicUserData.token;
                
                console.log('Got complete user data:', completeUserData);
                
                // Update localStorage with complete data
                localStorage.setItem('user', JSON.stringify(completeUserData));
                
                return completeUserData;
            } catch (error) {
                console.error('Failed to fetch complete user profile:', error);
                return basicUserData; // Fall back to basic data
            }
        };
        
        const initializeUser = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    
                    // Set initial user state
                    setUser(parsedUser);
                    
                    // Fetch complete profile if we have a token
                    if (localStorage.getItem('token')) {
                        const completeUserData = await fetchCompleteUserProfile(parsedUser);
                        setUser(completeUserData);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error loading user from localStorage:', error);
                setUser(null);
            } finally {
                setIsInitialized(true);
            }
        };
        
        initializeUser();
    }, []);

    // Listen for changes to localStorage (for multi-tab sync)
    useEffect(() => {
        const handleStorage = (event) => {
            if (event.key === 'user') {
                try {
                    if (event.newValue) {
                        setUser(JSON.parse(event.newValue));
                    } else {
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Error parsing user data from storage event:', error);
                }
            }
        };
        
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Helper to update both localStorage and context
    const updateUser = (userData) => {
        try {
            if (userData) {
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
            } else {
                localStorage.removeItem('user');
                setUser(null);
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    // Only render children when initialization is complete
    if (!isInitialized) {
        return <div>Loading...</div>;
    }

    return (
        <UserContext.Provider value={{ user, setUser: updateUser }}>
            {children}
        </UserContext.Provider>
    );
}; 