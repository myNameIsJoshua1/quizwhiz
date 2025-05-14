import api from './api';

export const userService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/user/login', { email, password });
      const data = response.data;
      // Extract token from header if it's there
      const token = response.headers?.authorization?.replace('Bearer ', '') || data.token;
      return {
        id: data.id || data.userId,
        userId: data.userId || data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        createdAt: data.createdAt,
        token: token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  loginAdmin: async (email, password) => {
    try {
      const response = await api.post('/admin/login', { email, password });
      const data = response.data;
      
      // Extract token from header if it's there
      const token = response.headers?.authorization?.replace('Bearer ', '') || data.token;
      
      if (!data.admin || !token) {
        throw new Error('Invalid response format from server');
      }

      // Ensure the admin data structure matches what the backend sends
      return {
        admin: {
          id: data.admin.adminId || data.admin.id, // Handle both possible field names
          email: data.admin.email,
          firstName: data.admin.firstName,
          lastName: data.admin.lastName,
          role: 'ADMIN' // Explicitly set role
        },
        token: token
      };
    } catch (error) {
      console.error('Admin login error:', error);
      if (error.response?.status === 401) {
        throw new Error('Invalid admin credentials');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden. Please check your permissions.');
      }
      throw new Error(error.response?.data?.message || 'Failed to login as admin');
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/user/create', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      // Specifically handle the 409 conflict error
      if (error.response && error.response.status === 409) {
        const customError = new Error('This email is already registered. Please use another email.');
        customError.statusCode = 409;
        throw customError;
      }
      throw error;
    }
  },

  getProfile: async (userId) => {
    if (!userId) {
      console.error('Missing userId in getProfile call');
      throw new Error('User ID is required');
    }
    
    try {
      const response = await api.get(`/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      throw error;
    }
  },

  updateProfile: async (userId, userData) => {
    try {
      const response = await api.put(`/user/update/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const response = await api.get('/user/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },

  getUserById: async (userId) => {
    if (!userId) {
      console.error('Missing userId in getUserById call');
      throw new Error('User ID is required');
    }
    
    console.log(`DEBUG: Fetching user profile for ID ${userId}`);
    
    try {
      const response = await api.get(`/user/${userId}`);
      console.log('DEBUG: Raw API response for user profile:', response);
      
      // Make sure we have proper firstName data
      const userData = response.data;
      console.log('DEBUG: Parsed user data:', userData);
      
      // Handle missing firstName
      if (!userData.firstName && userData.email) {
        console.log('DEBUG: No firstName in response, creating from email');
        userData.firstName = userData.email.split('@')[0];
      }
      
      // Force update the localStorage directly
      try {
        const currentUserData = JSON.parse(localStorage.getItem('user')) || {};
        const updatedUserData = { ...currentUserData, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        console.log('DEBUG: Updated localStorage with merged user data:', updatedUserData);
      } catch (e) {
        console.error('Failed to update localStorage:', e);
      }
      
      return userData;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  },

  getUserDecks: async (userId) => {
    if (!userId) {
      console.error('Missing userId in getUserDecks call');
      throw new Error('User ID is required');
    }
    
    try {
      const response = await api.get(`/user/${userId}/decks`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching decks for user ${userId}:`, error);
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      console.log('UpdateUser called with:', userId, userData);
      
      // Create a clean object for the API call
      const apiPayload = { ...userData };
      
      // Handle preservePassword flag if present
      if (apiPayload.preservePassword) {
        // Remove the flag as the backend doesn't need it
        delete apiPayload.preservePassword;
        
        // If we need to maintain the current password, we can set a special flag for the backend
        apiPayload._preservePassword = true;
      }
      
      console.log('Sending update payload:', apiPayload);
      const response = await api.put(`/user/update/${userId}`, apiPayload);
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  },

  loginWithGoogle: async (credential) => {
    try {
      console.log("Sending Google credential token to backend");
      const response = await api.post('/user/google', { credential });
      
      // Extract data and token
      const data = response.data;
      const token = data.token;
      
      if (!token) {
        throw new Error('No authentication token received from server');
      }
      
      return {
        token: token,
        user: data.user || {
          userId: data.user?.userId,
          email: data.user?.email,
          firstName: data.user?.firstName || data.user?.name?.split(' ')[0] || '',
          lastName: data.user?.lastName || (data.user?.name ? data.user.name.split(' ').slice(1).join(' ') : ''),
        }
      };
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  getUserCount: async () => {
    try {
      const response = await api.get('/user/usercount');
      return response.data;
    } catch (error) {
      console.error('Error fetching user count:', error);
      throw error;
    }
  },

  getLeaderboard: async () => {
    try {
      const response = await api.get('/users/leaderboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }
}; 