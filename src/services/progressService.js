import api from './api';

export const progressService = {
  // Create a new progress entry
  createProgress: async (progressData) => {
    try {
      const response = await api.post('/progress/add', progressData);
      return response.data;
    } catch (error) {
      console.error('Error creating progress entry:', error);
      throw error;
    }
  },

  // Get all progress entries
  getAllProgress: async () => {
    try {
      const response = await api.get('/progress/get');
      return response.data;
    } catch (error) {
      console.error('Error getting all progress entries:', error);
      throw error;
    }
  },

  // Get a progress entry by ID
  getProgressById: async (progressId) => {
    try {
      const response = await api.get(`/progress/get/${progressId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting progress entry ${progressId}:`, error);
      throw error;
    }
  },

  // Get progress entries by flashcard ID
  getProgressByFlashcardId: async (flashcardId) => {
    try {
      const response = await api.get(`/progress/getByFlashcardId/${flashcardId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting progress for flashcard ${flashcardId}:`, error);
      throw error;
    }
  },

  // Update a progress entry
  updateProgress: async (progressId, progressData) => {
    try {
      // Ensure progressId is set in the data
      const data = {
        ...progressData,
        progressId
      };
      const response = await api.put('/progress/update', data);
      return response.data;
    } catch (error) {
      console.error('Error updating progress entry:', error);
      throw error;
    }
  },

  // Delete a progress entry
  deleteProgress: async (progressId) => {
    try {
      const response = await api.delete(`/progress/delete/${progressId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting progress entry ${progressId}:`, error);
      throw error;
    }
  },

  // Track study time for a user
  trackStudyTime: async (userId, minutesSpent) => {
    try {
      const response = await api.post('/progress/trackStudyTime', null, {
        params: {
          userId,
          minutesSpent
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error tracking study time for user ${userId}:`, error);
      throw error;
    }
  },

  // Get score comparison based on score value
  getScoreComparison: (score) => {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 60) return 'FAIR';
    return 'NEEDS_IMPROVEMENT';
  },
  
  // Save progress locally as fallback
  saveProgressLocally: (userId, progressData) => {
    try {
      // Get existing progress data
      const existingProgress = JSON.parse(localStorage.getItem(`progress-${userId}`) || '[]');
      
      // Add new progress entry with timestamp
      const newProgress = {
        ...progressData,
        createdAt: new Date().toISOString()
      };
      
      // Add to beginning to keep newest first
      existingProgress.unshift(newProgress);
      
      // Limit to 100 most recent entries to avoid localStorage overflow
      const limitedProgress = existingProgress.slice(0, 100);
      
      // Save back to localStorage
      localStorage.setItem(`progress-${userId}`, JSON.stringify(limitedProgress));
      
      return newProgress;
    } catch (error) {
      console.error('Error saving progress locally:', error);
      return null;
    }
  },
  
  // Get locally stored progress
  getLocalProgress: (userId) => {
    try {
      return JSON.parse(localStorage.getItem(`progress-${userId}`) || '[]');
    } catch (error) {
      console.error('Error getting local progress:', error);
      return [];
    }
  }
}; 