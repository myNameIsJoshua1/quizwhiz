import api from './api';

export const reviewService = {
  // Create a new review entry
  createReview: async (reviewData) => {
    try {
      const response = await api.post('/review/add', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Get a review by ID
  getReviewById: async (reviewId) => {
    try {
      const response = await api.get(`/review/get/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting review ${reviewId}:`, error);
      throw error;
    }
  },

  // Get all reviews
  getAllReviews: async () => {
    try {
      const response = await api.get('/review/get');
      return response.data;
    } catch (error) {
      console.error('Error getting all reviews:', error);
      throw error;
    }
  },

  // Get reviews by flashcard ID
  getReviewsByFlashcardId: async (flashcardId) => {
    try {
      // This endpoint might need to be added to your backend
      const response = await api.get(`/review/get/flashcard/${flashcardId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting reviews for flashcard ${flashcardId}:`, error);
      throw error;
    }
  },

  // Get reviews by user ID
  getReviewsByUserId: async (userId) => {
    try {
      // This endpoint might need to be added to your backend
      const response = await api.get(`/review/get/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting reviews for user ${userId}:`, error);
      // Fallback to localStorage if backend fails
      return getLocalReviews(userId);
    }
  },

  // Update a review
  updateReview: async (reviewData) => {
    try {
      const response = await api.put('/review/update', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/review/delete/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting review ${reviewId}:`, error);
      throw error;
    }
  },

  // Save review history locally as fallback
  saveReviewLocally: (userId, reviewData) => {
    try {
      // Get existing reviews
      const existingReviews = JSON.parse(localStorage.getItem(`reviews-${userId}`) || '[]');
      
      // Add new review with timestamp
      const newReview = {
        ...reviewData,
        createdAt: new Date().toISOString()
      };
      
      // Add to beginning to keep newest first
      existingReviews.unshift(newReview);
      
      // Limit to 50 most recent reviews to avoid localStorage overflow
      const limitedReviews = existingReviews.slice(0, 50);
      
      // Save back to localStorage
      localStorage.setItem(`reviews-${userId}`, JSON.stringify(limitedReviews));
      
      return newReview;
    } catch (error) {
      console.error('Error saving review locally:', error);
      return null;
    }
  }
};

// Helper function to get locally stored reviews
function getLocalReviews(userId) {
  try {
    return JSON.parse(localStorage.getItem(`reviews-${userId}`) || '[]');
  } catch (error) {
    console.error('Error getting local reviews:', error);
    return [];
  }
} 