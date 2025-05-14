import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { useUser } from '../contexts/UserContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Remove confirmPassword from data sent to API
      const { confirmPassword, ...registerData } = formData;
      
      await userService.register(registerData);
      
      // Navigate to login with success message
      navigate('/login', { state: { message: 'Registration successful! Please login with your new account.' } });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Complete redesign */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-purple-800 via-orange-500 to-yellow-400 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-purple-600/30 backdrop-blur-sm"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full bg-yellow-500/30 backdrop-blur-sm"></div>
        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
          <div className="max-w-md mx-auto px-8 py-12 text-center">
            <h2 className="text-4xl font-extrabold text-white mb-6">
              Start Your Learning Adventure
            </h2>
            
            <div className="flex justify-center mb-10">
              {/* Modern abstract icon */}
              <div className="w-40 h-40 relative">
                <div className="absolute inset-0 bg-white/20 rounded-xl rotate-45 transform"></div>
                <div className="absolute inset-0 bg-white/30 rounded-xl rotate-12 transform"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-20 h-20 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="text-3xl font-extrabold text-white mb-4">
              BrainBoost
            </div>
            
            <p className="text-lg text-white/80 mb-8">
              Join thousands of learners expanding their knowledge
            </p>
            
            <div className="flex flex-col space-y-4">
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-left">
                <div className="flex items-center">
                  <div className="bg-purple-500/40 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-white text-sm">Create custom study materials</div>
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-left">
                <div className="flex items-center">
                  <div className="bg-purple-500/40 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-white text-sm">Track your progress over time</div>
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-left">
                <div className="flex items-center">
                  <div className="bg-purple-500/40 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-white text-sm">Challenge yourself with smart quizzes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Registration Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md space-y-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-purple-600 hover:text-purple-800"
            >
              Already have an account?
            </button>
            <div className="text-2xl font-bold text-gray-800">Sign Up</div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                  placeholder="First name"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                placeholder="Email address"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                placeholder="Create a password"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                placeholder="Confirm your password"
              />
            </div>
            
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the <button type="button" className="text-purple-600 hover:text-purple-800 underline">Terms of Service</button> and <button type="button" className="text-purple-600 hover:text-purple-800 underline">Privacy Policy</button>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate("/")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;