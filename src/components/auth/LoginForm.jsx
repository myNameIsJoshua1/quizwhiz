import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import api from '../../services/api';

export function LoginForm({ setIsLoggedIn, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to handle errors and display appropriate messages
  const handleError = (err) => {
    console.error('Login error:', err);
    
    // Clear any partial authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    
    // Check for specific error types
    if (!err) {
      setError('An unknown error occurred. Please try again.');
      return;
    }
    
    // Handle network errors
    if (!navigator.onLine || err.message === 'Network Error') {
      setError('Cannot connect to server. Please check your internet connection.');
      return;
    }
    
    // Handle specific HTTP status codes
    if (err.response) {
      const status = err.response.status;
      
      switch (status) {
        case 400:
          setError('Invalid login request. Please check your email and password.');
          break;
        case 401:
          setError('Incorrect email or password. Please try again.');
          break;
        case 403:
          setError('Access denied. Your account may be locked or disabled.');
          break;
        case 404:
          setError('Login service not found. Please contact support.');
          break;
        case 429:
          setError('Too many login attempts. Please try again later.');
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          setError('Server error. Please try again later or contact support.');
          break;
        default:
          // Use server message if available, otherwise fallback
          setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
      return;
    }
    
    // For all other errors
    setError(err.message || 'Login failed. Please check your credentials and try again.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate input fields before making API call
    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    
    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    try {
      // First authenticate with email/password
      const response = await userService.login(email, password);
      
      if (response && response.token) {
        // Store basic auth data first
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
        
        try {
          // DIRECT APPROACH: Make a direct API call to get user data
          const userId = response.id || response.userId;
          console.log("Fetching complete user profile with userId:", userId);
          
          if (userId) {
            // Make direct API call instead of using the service
            const profileResponse = await api.get(`/user/${userId}`);
            console.log("Raw API response:", profileResponse);
            
            if (profileResponse.data) {
              const fullUserData = profileResponse.data;
              console.log("Full user profile data:", fullUserData);
              
              // Add token to the complete data
              fullUserData.token = response.token;
              
              // Update localStorage and context with complete data
              console.log("Updating user context with complete data:", fullUserData);
              localStorage.setItem('user', JSON.stringify(fullUserData));
              setUser(fullUserData);
            } else {
              console.warn("API returned empty data for user profile");
              setUser(response);
            }
          } else {
            console.warn("No userId available for profile fetch");
            setUser(response);
          }
        } catch (profileError) {
          console.error("Failed to fetch complete profile:", profileError);
          // Fall back to basic data
          setUser(response);
        }
        
        setIsLoggedIn(true);
        
        // Clear any existing admin data
        localStorage.removeItem('admin');
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError('Invalid server response. Please try again.');
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging in...
          </div>
        ) : 'Log in'}
      </button>
    </form>
  );
} 