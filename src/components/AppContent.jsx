import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from './ui/toaster';
import UserProfile from './profile/UserProfile';
import { QuizCard } from './quiz/QuizCard';
import { ProgressStats } from './progress/ProgressStats';
import AdminDashboard from '../pages/AdminDashboard';
import AdminLoginPage from '../pages/AdminLoginPage';
import ManageUsers from '../pages/ManageUsers';
import AdminProfilePage from '../pages/AdminProfilePage';
import EditUser from '../pages/EditUser';
import ManageDecks from '../pages/ManageDecks';
import DeckFlashcards from '../pages/DeckFlashcards';
import UserDetails from '../pages/UserDetails';
import UserDashboard from '../pages/UserDashboard';
import AdminLayout from './AdminLayout';
import UserNavbar from './UserNavbar';
import { PrivateRoute, AdminRoute } from './RouteGuards';
import { useUser } from '../contexts/UserContext';
import '../styles/App.css';
import CreateDeck from '../pages/CreateDeck';
import DecksList from '../pages/DecksList';
import EditDeck from '../pages/EditDeck';
import StudyDeck from '../pages/StudyDeck';
import QuizMode from '../pages/QuizMode';
import QuizResults from '../pages/QuizResults';
import Achievements from '../pages/Achievements';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import HomePage from '../pages/HomePage';
import { userService } from '../services/userService';
// EditProfile import temporarily commented out as feature is disabled
// import EditProfile from '../pages/EditProfile';
import ChangePassword from '../pages/ChangePassword';

function AppContent() {
    const location = useLocation();
    const navigate = useNavigate();
    const fetchedRef = useRef(false);
    
    // Get user context properly
    const { user, setUser } = useUser();
    
    // Only use admin state locally - we don't have an admin context
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(!!localStorage.getItem('admin'));
    const [admin, setAdmin] = useState(null);

    // Compute isLoggedIn directly from user
    const isLoggedIn = !!user;

    // IMPORTANT: Direct fix for firstName issues
    useEffect(() => {
        // If we have a user but no firstName, let's fix it
        if (user && !user.firstName && user.email) {
            console.log("AppContent - User missing firstName, fixing...");
            
            // Create a copy with firstName added
            const enhancedUser = { 
                ...user,
                firstName: user.email.split('@')[0] 
            };
            
            console.log("AppContent - Enhanced user data:", enhancedUser);
            
            // Update both context and localStorage
            localStorage.setItem('user', JSON.stringify(enhancedUser));
            setUser(enhancedUser);
            
            // Try to fetch complete profile if possible
            if (user.id || user.userId) {
                const userId = user.id || user.userId;
                
                userService.getUserById(userId)
                    .then(userData => {
                        // Ensure token is preserved
                        userData.token = user.token;
                        
                        console.log("AppContent - Got complete user data:", userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                        setUser(userData);
                    })
                    .catch(err => {
                        console.error("Failed to fetch complete profile:", err);
                    });
            }
        }
    }, [user, setUser]);

    useEffect(() => {
        console.log("AppContent - Current user context:", user);
        console.log("AppContent - isLoggedIn:", isLoggedIn);
    }, [user, isLoggedIn]);

    // Load admin data only once
    useEffect(() => {
        // Prevent multiple effects runs
        if (fetchedRef.current) return;

        // Load admin data if available
        const storedAdmin = localStorage.getItem('admin');
    
        if (storedAdmin) {
            try {
                const parsedAdmin = JSON.parse(storedAdmin);
                if (parsedAdmin) {
                    setAdmin(parsedAdmin);
                    setIsAdminLoggedIn(true);
                }
            } catch (error) {
                console.error('Failed to parse admin data:', error);
                localStorage.removeItem('admin');
            }
        }
        
        fetchedRef.current = true;
    }, []);

    const handleLogout = () => {
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('admin');
        
        // Update context
        setUser(null);
        
        // Update admin state
        setIsAdminLoggedIn(false);
        setAdmin(null);
        
        // Redirect to appropriate login page
        const isAdminPage = location.pathname.startsWith('/admin');
        navigate(isAdminPage ? '/admin/login' : '/login');
    };

    const handleUserLogin = (userData) => {
        // DIRECT FIX: Ensure firstName is set before updating context
        if (userData && !userData.firstName && userData.email) {
            userData.firstName = userData.email.split('@')[0];
            console.log("Login handler - Added firstName from email:", userData.firstName);
        }
        
        // Use the context setter to update user
        setUser(userData);
    };

    // Check if current route is an admin route
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <div className="App">
            {/* Only show navbar for routes that aren't auth pages or admin routes */}
            {!isAdminRoute && !location.pathname.includes('/login') && !location.pathname.includes('/register') && location.pathname !== '/' && (
                <UserNavbar onLogout={handleLogout} />
            )}

            <main className={
                isAdminRoute ? "w-full p-0 m-0" : 
                location.pathname.includes('/login') || location.pathname.includes('/register') || location.pathname === '/' ? "p-0 m-0 w-full" :
                "max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8"
            }>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage setUser={handleUserLogin} />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/admin/login" element={<AdminLoginPage setIsLoggedIn={setIsAdminLoggedIn} setAdmin={setAdmin} />} />

                    {/* Protected User Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <UserDashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute>
                                <UserProfile user={user} />
                            </PrivateRoute>
                        }
                    />
                    {/* Edit Profile route temporarily removed due to authentication issues with password nullification */}
                    <Route
                        path="/profile/change-password"
                        element={
                            <PrivateRoute>
                                <ChangePassword />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/decks"
                        element={
                            <PrivateRoute>
                                <DecksList />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/decks/new"
                        element={
                            <PrivateRoute>
                                <CreateDeck />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/decks/:deckId"
                        element={
                            <PrivateRoute>
                                <DeckFlashcards user={user} />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/decks/:deckId/edit"
                        element={
                            <PrivateRoute>
                                <EditDeck />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/study/:deckId"
                        element={
                            <PrivateRoute>
                                <StudyDeck />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/quiz/:deckId"
                        element={
                            <PrivateRoute>
                                <QuizMode />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/quiz-results/:deckId"
                        element={
                            <PrivateRoute>
                                <QuizResults />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/quiz/:quizId"
                        element={
                            <PrivateRoute>
                                <QuizCard user={user} />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/progress"
                        element={
                            <PrivateRoute>
                                <ProgressStats user={user} />
                            </PrivateRoute>
                        }
                    />
                    
                    <Route
                        path="/achievements"
                        element={
                            <PrivateRoute>
                                <Achievements />
                            </PrivateRoute>
                        }
                    />

                    {/* Protected Admin Routes */}
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminLayout admin={admin} onLogout={handleLogout}>
                                    <AdminDashboard admin={admin} />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <AdminRoute>
                                <AdminLayout admin={admin} onLogout={handleLogout}>
                                    <ManageUsers />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/users/:userId"
                        element={
                            <AdminRoute>
                                <AdminLayout admin={admin} onLogout={handleLogout}>
                                    <UserDetails />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/users/:userId/edit"
                        element={
                            <AdminRoute>
                                <AdminLayout admin={admin} onLogout={handleLogout}>
                                    <EditUser />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/decks"
                        element={
                            <AdminRoute>
                                <AdminLayout admin={admin} onLogout={handleLogout}>
                                    <ManageDecks />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/profile"
                        element={
                            <AdminRoute>
                                <AdminLayout admin={admin} onLogout={handleLogout}>
                                    <AdminProfilePage admin={admin} />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />

                    {/* Redirect to home page instead of login page by default */}
                    <Route
                        path="*"
                        element={
                            isAdminLoggedIn ? <Navigate to="/admin" replace /> : 
                            isLoggedIn ? <Navigate to="/dashboard" replace /> : 
                            <Navigate to="/" replace />
                        }
                    />
                </Routes>
            </main>
            <Toaster />
        </div>
    );
}

export default AppContent; 