import axios from 'axios';

// Updated to use the deployed backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://quizwhiz-flashcards.uc.r.appspot.com/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // Add timeout of 10 seconds
  withCredentials: false // Set to false as we're using Bearer token
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request: Adding token to request headers');
    } else {
      console.warn('API Request: No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response [${response.status}]: ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Add detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error(`API Error [${error.response.status}]: ${originalRequest?.url}`, {
        data: error.response.data,
        endpoint: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response.status
      });
      
      // Handle specific error cases
      switch (error.response.status) {
        case 403:
          console.warn('Access forbidden. Please check your credentials.');
          break;
        case 401:
          console.warn('Unauthorized. Your session may have expired.');
          break;
        case 404:
          console.warn('Resource not found:', originalRequest?.url);
          break;
        case 409:
          console.warn('Conflict: Resource already exists', originalRequest?.url);
          error.message = 'This email is already registered. Please use another email.';
          break;
        case 500:
          console.error('Server error - the operation could not be completed');
          break;
        default:
          console.error('API Error:', error.response.data);
      }
      
      // Retry logic for server errors (500 range) or network errors
      if (error.response.status >= 500 && !originalRequest._retry && originalRequest?.method === 'GET') {
        originalRequest._retry = true;
        console.log('Retrying request due to server error...');
        try {
          return await axios(originalRequest);
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
    } else if (error.request) {
      // The request was made but no response was received (network error)
      console.error('Network Error: No response received', {
        endpoint: originalRequest?.url,
        method: originalRequest?.method
      });
      
      // Only retry GET requests to avoid duplicate mutations
      if (!originalRequest._retry && originalRequest?.method === 'GET') {
        originalRequest._retry = true;
        console.log('Retrying request due to network error...');
        try {
          return await axios(originalRequest);
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
    } else {
      // Something happened in setting up the request
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;