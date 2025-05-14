import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useUser } from '../contexts/UserContext';
import { flashcardService } from '../services/flashcardService';
import { reviewService } from '../services/reviewService';
import api from '../services/api';

// Helper function to format a date to a "time ago" format
const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    
    // Convert to seconds, minutes, hours, days
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Format as X time ago
    if (diffDays > 30) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    if (diffDays > 0) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
    if (diffHours > 0) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffMins > 0) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    }
    return 'just now';
};

const UserDashboard = () => {
    // Use the user context initially
    const { user: contextUser, setUser: updateUserContext } = useUser();
    
    // Local state for the user data
    const [user, setLocalUser] = useState(contextUser);
    const [userLoading, setUserLoading] = useState(true);
    
    // Other states remain the same
    const [stats, setStats] = useState({
        totalDecks: 0,
        cardsStudied: 0,
        successRate: 0,
        recentActivity: []
    });
    const [decks, setDecks] = useState([]);
    const [decksLoading, setDecksLoading] = useState(false);
    const [decksError, setDecksError] = useState(null);
    
    // Add loading states for each section
    const [statsLoading, setStatsLoading] = useState(true);
    const [cardsLoading, setCardsLoading] = useState(true);
    const [activityLoading, setActivityLoading] = useState(true);
    
    const fetchedDecksRef = useRef(false);
    const fetchedReviewsRef = useRef(false);
    const fetchedUserDataRef = useRef(false);
    
    // IMPORTANT: Directly fetch user data from API when component mounts
    useEffect(() => {
        const fetchCompleteUserData = async () => {
            // Don't run multiple times
            if (fetchedUserDataRef.current) return;
            
            try {
                setUserLoading(true);
                
                // First, try to get user ID from context or localStorage
                let userId = null;
                
                // Try context user first
                if (contextUser?.id || contextUser?.userId) {
                    userId = contextUser.id || contextUser.userId;
                    console.log("Dashboard - Found user ID from context:", userId);
                } 
                // Then try localStorage
                else {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const userData = JSON.parse(storedUser);
                        userId = userData.id || userData.userId;
                        console.log("Dashboard - Found user ID from localStorage:", userId);
                    }
                }
                
                if (!userId) {
                    console.error("Dashboard - No user ID available, cannot fetch user data");
                    setUserLoading(false);
                    return;
                }
                
                // Make a direct API call to fetch complete user profile
                console.log("Dashboard - Fetching complete user profile for ID:", userId);
                try {
                    // Use direct API call instead of service to ensure fresh data
                    const response = await api.get(`/user/${userId}`);
                    console.log("Dashboard - API response:", response);
                    
                    if (response.data) {
                        const completeUserData = response.data;
                        
                        // Make sure to preserve the token
                        const token = contextUser?.token || 
                            (localStorage.getItem('token') || '');
                            
                        completeUserData.token = token;
                        
                        console.log("Dashboard - Complete user data:", completeUserData);
                        
                        // Update local state
                        setLocalUser(completeUserData);
                        
                        // Update context and localStorage
                        updateUserContext(completeUserData);
                        localStorage.setItem('user', JSON.stringify(completeUserData));
                        
                        // Ensure firstName exists
                        if (!completeUserData.firstName && completeUserData.email) {
                            const enhancedData = {
                                ...completeUserData,
                                firstName: completeUserData.email.split('@')[0]
                            };
                            
                            console.log("Dashboard - Enhanced user data with firstName:", enhancedData);
                            
                            // Update local state, context, and localStorage
                            setLocalUser(enhancedData);
                            updateUserContext(enhancedData);
                            localStorage.setItem('user', JSON.stringify(enhancedData));
                        }
                    }
                } catch (apiError) {
                    console.error("Dashboard - API error fetching user:", apiError);
                    
                    // Fall back to context user
                    setLocalUser(contextUser);
                    
                    // Make sure firstName exists
                    if (contextUser && !contextUser.firstName && contextUser.email) {
                        const enhancedUser = {
                            ...contextUser,
                            firstName: contextUser.email.split('@')[0]
                        };
                        
                        setLocalUser(enhancedUser);
                        updateUserContext(enhancedUser);
                        localStorage.setItem('user', JSON.stringify(enhancedUser));
                    }
                }
            } catch (error) {
                console.error("Dashboard - Error in fetchCompleteUserData:", error);
                setLocalUser(contextUser);
            } finally {
                fetchedUserDataRef.current = true;
                setUserLoading(false);
            }
        };
        
        fetchCompleteUserData();
    }, [contextUser, updateUserContext]);
    
    // Log when the component renders with user data
    useEffect(() => {
        console.log('UserDashboard - Current user data:', user);
    }, [user]);

    // Fetch decks count and update stats - use local user state
    useEffect(() => {
        // Skip if we've already fetched or don't have user data
        if (fetchedDecksRef.current || !user) return;
        
        const fetchUserDecksAndComputeStats = async () => {
            try {
                const userId = user.id || user.userId;
                
                if (!userId) {
                    console.error('UserDashboard - No user ID available in user object:', user);
                    return;
                }
                
                // Set all loading states to true
                setStatsLoading(true);
                setDecksLoading(true);
                setCardsLoading(true);
                
                // Fetch user's decks from API
                console.log('UserDashboard - Fetching decks for user ID:', userId);
                const userDecks = await flashcardService.getDecksByUserId(userId);
                setDecksLoading(false);
                
                // Get all flashcards to count cards studied
                let totalCardsStudied = 0;
                let totalCardsSeen = 0;
                
                // For each deck, fetch flashcards to count studied ones
                for (const deck of userDecks) {
                    try {
                        const flashcards = await flashcardService.getFlashcards(deck.id);
                        totalCardsSeen += flashcards.length;
                        
                        // Count learned cards
                        const learnedCards = flashcards.filter(card => card.learned).length;
                        totalCardsStudied += learnedCards;
                    } catch (error) {
                        console.error(`Failed to fetch flashcards for deck ${deck.id}:`, error);
                    }
                }
                
                setCardsLoading(false);
                
                // Get reviews to calculate success rate
                let successRate = 0;
                try {
                    const reviews = await reviewService.getReviewsByUserId(userId);
                    
                    if (reviews && reviews.length > 0) {
                        // Calculate success rate from reviews
                        const successfulReviews = reviews.filter(review => 
                            review.score >= 0.7 || review.correct > (review.total / 2)
                        ).length;
                        
                        successRate = Math.round((successfulReviews / reviews.length) * 100);
                    } else {
                        // Default success rate if no reviews
                        successRate = totalCardsStudied > 0 ? 
                            Math.round((totalCardsStudied / Math.max(totalCardsSeen, 1)) * 100) : 
                            0;
                    }
                } catch (error) {
                    console.error('Failed to fetch reviews:', error);
                    // Calculate success rate from learned cards as fallback
                    successRate = totalCardsStudied > 0 ? 
                        Math.round((totalCardsStudied / Math.max(totalCardsSeen, 1)) * 100) : 
                        0;
                }
                
                // Update stats with real data
                setStats(prevStats => ({
                    ...prevStats,
                    totalDecks: userDecks.length,
                    cardsStudied: totalCardsStudied,
                    successRate: successRate
                }));
                
                // Save the sorted decks for display
                const sortedDecks = [...userDecks].sort((a, b) => {
                    if (a.createdAt && b.createdAt) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return b.id - a.id;
                });
                
                setDecks(sortedDecks);
                fetchedDecksRef.current = true;
                setStatsLoading(false);
                
            } catch (error) {
                console.error('Failed to fetch user decks and compute stats:', error);
                setDecksLoading(false);
                setCardsLoading(false);
                setStatsLoading(false);
                setDecksError('Failed to load your deck data. Please try again.');
            }
        };

        fetchUserDecksAndComputeStats();
        
    }, [user]); // Use local user state as dependency

    // Fetch user's review history
    useEffect(() => {
        // Skip if we've already fetched or don't have user data
        if (fetchedReviewsRef.current || !user) return;
        
        setActivityLoading(true);
        
        const fetchReviewHistory = async () => {
            try {
                const userId = user.id || user.userId;
                
                if (!userId) {
                    console.warn('Cannot fetch review history: User ID not found');
                    setActivityLoading(false);
                    return;
                }
                
                // Try to get reviews from backend
                let reviewData = [];
                try {
                    reviewData = await reviewService.getReviewsByUserId(userId);
                    console.log('UserDashboard - Fetched review history:', reviewData);
                } catch (error) {
                    console.error('Failed to fetch reviews from API, falling back to local storage');
                    // Fallback to localStorage (already handled in the service)
                    reviewData = [];
                }
                
                // Format review history for display
                const formattedReviews = formatReviewsForDisplay(reviewData);
                
                // Update stats with new review history
                setStats(prevStats => ({
                    ...prevStats,
                    recentActivity: formattedReviews
                }));
                
                fetchedReviewsRef.current = true;
            } catch (error) {
                console.error('Failed to fetch review history:', error);
            } finally {
                setActivityLoading(false);
            }
        };
        
        fetchReviewHistory();
        
    }, [user]); // Only rerun when user changes

    // Helper function to format review history
    const formatReviewsForDisplay = (reviews) => {
        if (!reviews || reviews.length === 0) {
            return [];
        }
        
        // Sort reviews by date (newest first)
        const sortedReviews = [...reviews].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Take most recent 5 reviews
        const recentReviews = sortedReviews.slice(0, 5);
        
        // Format for display
        return recentReviews.map(review => {
            const action = review.type === 'quiz' ? 'Completed quiz for' : 'Studied';
            const timeAgo = formatTimeAgo(review.date);
            return `${action} ${review.deckName || 'a deck'} - ${timeAgo}`;
        });
    };

    // Handle errors and loading states for user data
    if (userLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="w-12 h-12 border-t-4 border-b-4 border-purple-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading your dashboard data...</p>
                </div>
            </div>
        );
    }

    // Show error if no user data is available
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-gray-500">
                        {localStorage.getItem('token') 
                            ? "Having trouble loading your data. Please try refreshing the page." 
                            : "No authentication data found. Please log in again."}
                    </p>
                    {!localStorage.getItem('token') && (
                        <Link to="/login" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Go to Login
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {user.firstName || user.email?.split('@')[0] || 'User'}!
                </h1>
                <p className="text-gray-600 mt-2">Let's continue your learning journey</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-gray-700">Total Decks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="flex items-center justify-center h-8">
                                <div className="w-5 h-5 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">{stats.totalDecks}</div>
                        )}
                        <div className="flex justify-between mt-2">
                            <Link 
                                to="/decks" 
                                className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center"
                            >
                                View all decks
                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </Link>
                            {stats.totalDecks === 0 && !statsLoading && (
                                <Link 
                                    to="/decks/new" 
                                    className="text-sm text-green-600 hover:text-green-700 inline-flex items-center"
                                >
                                    Create first deck
                                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-gray-700">Cards Studied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {cardsLoading ? (
                            <div className="flex items-center justify-center h-8">
                                <div className="w-5 h-5 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">{stats.cardsStudied}</div>
                        )}
                        <div className="flex justify-between items-center mt-2">
                            <Link 
                                to="/progress" 
                                className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center"
                            >
                                View progress
                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </Link>
                            {stats.cardsStudied === 0 && stats.totalDecks > 0 && !cardsLoading && (
                                <Link
                                    to={`/study/${decks[0]?.id}`} 
                                    className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center"
                                >
                                    Start studying
                                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7"></path>
                                    </svg>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-gray-700">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <div className="flex items-center justify-center h-8">
                                <div className="w-5 h-5 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">{stats.successRate}%</div>
                                {stats.cardsStudied > 0 && (
                                    <div className="ml-2">
                                        {stats.successRate >= 80 ? (
                                            <span className="text-sm text-green-600 bg-green-50 rounded-full px-2 py-0.5">Excellent</span>
                                        ) : stats.successRate >= 60 ? (
                                            <span className="text-sm text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">Good</span>
                                        ) : stats.successRate >= 40 ? (
                                            <span className="text-sm text-yellow-600 bg-yellow-50 rounded-full px-2 py-0.5">Average</span>
                                        ) : (
                                            <span className="text-sm text-orange-600 bg-orange-50 rounded-full px-2 py-0.5">Needs work</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <Link 
                            to="/achievements" 
                            className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center mt-2"
                        >
                            View achievements
                            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Decks */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Your Decks</h2>
                        <Link
                            to="/decks/new"
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 shadow-sm hover:shadow transition-all duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Create new deck
                        </Link>
                    </div>
                    
                    {decksLoading ? (
                        <div className="bg-white shadow-sm rounded-lg p-6 flex justify-center">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
                                <p className="mt-2 text-sm text-gray-500">Loading your decks...</p>
                            </div>
                        </div>
                    ) : decksError ? (
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <p className="text-red-500">{decksError}</p>
                        </div>
                    ) : decks.length === 0 ? (
                        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 text-center">
                            <div className="mb-4 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="text-gray-500 mb-4">You don't have any flashcard decks yet</p>
                            <Link
                                to="/decks/new"
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                            >
                                Create your first deck
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {decks.slice(0, 4).map((deck) => (
                                <Card key={deck.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-medium text-gray-800">{deck.title || deck.subject}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500 mb-4">
                                            {deck.description || deck.category || 'General'}
                                        </p>
                                        <div className="flex space-x-2">
                                            <Link
                                                to={`/decks/${deck.id}`}
                                                className="text-xs px-3 py-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                to={`/study/${deck.id}`}
                                                className="text-xs px-3 py-1.5 text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
                                            >
                                                Study
                                            </Link>
                                            <Link
                                                to={`/quiz/${deck.id}`}
                                                className="text-xs px-3 py-1.5 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors"
                                            >
                                                Quiz
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            
                            {decks.length > 4 && (
                                <div className="sm:col-span-2 mt-2 text-center">
                                    <Link
                                        to="/decks"
                                        className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center"
                                    >
                                        View all {decks.length} decks
                                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="pt-6">
                            {activityLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
                                        <p className="mt-2 text-sm text-gray-500">Loading activity...</p>
                                    </div>
                                </div>
                            ) : stats.recentActivity && stats.recentActivity.length > 0 ? (
                                <ul className="space-y-3">
                                    {stats.recentActivity.map((activity, index) => (
                                        <li key={index} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                            <p className="text-sm text-gray-600">{activity}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-gray-500 mb-2">No recent activity</p>
                                    <p className="text-sm text-gray-400">Your study sessions will appear here</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <div className="mt-6">
                        <Card className="bg-gradient-to-tr from-purple-800 via-orange-500 to-yellow-400 text-white overflow-hidden">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-bold mb-2">Quick Study</h3>
                                <p className="text-sm text-white/80 mb-4">Take 5 minutes to review your flashcards and improve your retention.</p>
                                {decksLoading ? (
                                    <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-md text-sm">
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                                            Loading decks...
                                        </div>
                                    </div>
                                ) : decks.length > 0 ? (
                                    <Link
                                        to={`/study/${decks[0]?.id}`}
                                        className="inline-block px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-md text-sm transition-colors"
                                    >
                                        Start a session
                                    </Link>
                                ) : (
                                    <Link
                                        to="/decks/new"
                                        className="inline-block px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-md text-sm transition-colors"
                                    >
                                        Create a deck first
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard; 