import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const UserNavbar = ({ onLogout }) => {
    // Get user data from context
    const { user, setUser } = useUser();
    const isLoggedIn = !!user;
    
    // Add mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // DIRECT FIX: Immediately fix missing firstName 
    useEffect(() => {
        if (user && !user.firstName && user.email) {
            console.log("UserNavbar - User missing firstName, adding it immediately");
            
            // Create an enhanced copy with firstName
            const enhancedUser = {
                ...user,
                firstName: user.email.split('@')[0]
            };
            
            // Update both localStorage and context
            localStorage.setItem('user', JSON.stringify(enhancedUser));
            setUser(enhancedUser);
        }
    }, [user, setUser]);
    
    // Debug: Log user data to see what's available 
    useEffect(() => {
        console.log('UserNavbar - Current user data:', user);
        console.log('UserNavbar - firstName:', user?.firstName);
        console.log('UserNavbar - email:', user?.email);
    }, [user]);
    
    // DIRECT FIX: Force firstName if missing, even in the render method itself
    const forceFirstName = user?.firstName || (user?.email ? user.email.split('@')[0] : null);
    
    // User display name - try different fields with strict firstName priority
    const displayName = forceFirstName
        || (user?.name ? user.name.split(' ')[0] : null)
        || (user?.displayName ? user.displayName.split(' ')[0] : null)
        || (user?.email ? user.email.split('@')[0] : null)
        || 'User';
        
    // Debug: Log the final display name
    useEffect(() => {
        console.log('UserNavbar - Final displayName:', displayName);
    }, [displayName]);
    
    return (
        <nav className="bg-white shadow-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent hover:from-purple-700 hover:to-orange-600 transition-colors">
                                QuizWhiz
                            </Link>
                        </div>
                        
                        {isLoggedIn && (
                            <div className="hidden md:ml-8 md:flex md:space-x-6">
                                <Link
                                    to="/dashboard"
                                    className="text-gray-700 hover:text-purple-600 hover:border-purple-600 border-b-2 border-transparent px-1 py-5 text-sm font-medium transition-colors duration-200"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/decks"
                                    className="text-gray-700 hover:text-purple-600 hover:border-purple-600 border-b-2 border-transparent px-1 py-5 text-sm font-medium transition-colors duration-200"
                                >
                                    My Decks
                                </Link>
                                <Link
                                    to="/achievements"
                                    className="text-gray-700 hover:text-purple-600 hover:border-purple-600 border-b-2 border-transparent px-1 py-5 text-sm font-medium transition-colors duration-200"
                                >
                                    Achievements
                                </Link>
                            </div>
                        )}
                    </div>
                    
                    {/* Desktop menu */}
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        {isLoggedIn ? (
                            <>
                                <div className="relative group">
                                    <button className="flex items-center text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                        <span className="mr-1.5">{displayName}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            onClick={onLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                    
                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-purple-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMobileMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile menu, show/hide based on state */}
            <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
                {isLoggedIn && (
                    <div className="space-y-1 px-2 pb-3 pt-2">
                        <Link
                            to="/dashboard"
                            className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/decks"
                            className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                        >
                            My Decks
                        </Link>
                        <Link
                            to="/achievements"
                            className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                        >
                            Achievements
                        </Link>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                            <Link
                                to="/profile"
                                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                            >
                                Profile
                            </Link>
                            <button
                                onClick={onLogout}
                                className="w-full text-left block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}
                
                {!isLoggedIn && (
                    <div className="space-y-1 px-2 pb-3 pt-2">
                        <Link
                            to="/login"
                            className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600"
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default UserNavbar; 