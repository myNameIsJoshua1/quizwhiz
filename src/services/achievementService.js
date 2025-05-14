import api from './api';

export const achievementService = {
  // Get all achievements for a specific user
  getUserAchievements: async (userId) => {
    try {
      const response = await api.get(`/achievements/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      throw error;
    }
  },

  // Unlock a new achievement
  unlockAchievement: async (userId, title, description) => {
    try {
      const response = await api.post('/achievements/unlock', null, {
        params: {
          userId,
          title,
          description
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  },

  // Save achievements locally as a fallback
  saveAchievementsLocally: (userId, achievement) => {
    try {
      // Get existing achievements
      const existingAchievements = JSON.parse(localStorage.getItem(`achievements-${userId}`) || '[]');
      
      // Check if achievement already exists
      const achievementExists = existingAchievements.some(
        a => a.title === achievement.title
      );
      
      // Only add if it doesn't exist
      if (!achievementExists) {
        const newAchievement = {
          ...achievement,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        };
        
        // Add to beginning to keep newest first
        existingAchievements.unshift(newAchievement);
        
        // Save back to localStorage
        localStorage.setItem(`achievements-${userId}`, JSON.stringify(existingAchievements));
      }
      
      return existingAchievements;
    } catch (error) {
      console.error('Error saving achievements locally:', error);
      return [];
    }
  },
  
  // Get locally stored achievements
  getLocalAchievements: (userId) => {
    try {
      return JSON.parse(localStorage.getItem(`achievements-${userId}`) || '[]');
    } catch (error) {
      console.error('Error getting local achievements:', error);
      return [];
    }
  }
}; 