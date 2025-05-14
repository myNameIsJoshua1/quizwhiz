import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { useUser } from '../contexts/UserContext';
import GoogleLoginButton from '../components/GoogleLoginButton';

const LoginPage = ({ setUser: propsSetUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, setUser: contextSetUser } = useUser();

  // Use the setter from props if available, otherwise use context
  const setUser = propsSetUser || contextSetUser;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log("LoginPage - Already logged in, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await userService.login(email, password);
      if (response && response.token) {
        console.log("LoginPage - Login successful:", response);
        
        // Store user data in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
        
        // Update context
        setUser(response);
        
        // Clear any existing admin data
        localStorage.removeItem('admin');
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        console.error("LoginPage - Invalid server response:", response);
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Clear any partial data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setError(err.response?.data?.message || err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Complete redesign */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-purple-800 via-orange-500 to-yellow-400 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-purple-600/30 backdrop-blur-sm"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-yellow-500/30 backdrop-blur-sm"></div>
        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
          <div className="max-w-md mx-auto px-8 py-12 text-center">
            <h2 className="text-4xl font-extrabold text-white mb-6">
              Unlock Your Learning Potential
            </h2>
            
            <div className="flex justify-center mb-10">
              {/* Modern abstract icon */}
              <div className="w-40 h-40 relative">
                <div className="absolute inset-0 bg-white/20 rounded-xl rotate-12 transform"></div>
                <div className="absolute inset-0 bg-white/30 rounded-xl -rotate-6 transform"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-20 h-20 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="text-3xl font-extrabold text-white mb-4">
              QuizWhiz
            </div>
            
            <p className="text-lg text-white/80 mb-8">
              Accelerate your knowledge with interactive study tools
            </p>
            
            <div className="grid grid-cols-3 gap-3 text-white/80 text-sm">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <div className="font-bold mb-1">Interactive</div>
                <div>Learning</div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <div className="font-bold mb-1">Progress</div>
                <div>Tracking</div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <div className="font-bold mb-1">Personalized</div>
                <div>Quizzes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md space-y-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={() => navigate("/register")}
              className="text-sm font-medium text-purple-600 hover:text-purple-800"
            >
              Create account
            </button>
            <div className="text-2xl font-bold text-gray-800">Sign In</div>
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
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <button
                  type="button"
                  className="text-xs text-purple-600 hover:text-purple-800"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                placeholder="Enter your password"
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
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
                  Logging in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
            
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <div className="flex justify-center items-center mt-3">
              <GoogleLoginButton />
            </div>
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

export default LoginPage;