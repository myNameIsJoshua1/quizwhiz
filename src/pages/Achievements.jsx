import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { achievementService } from '../services/achievementService';
import { useUser } from '../contexts/UserContext';

const Achievements = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        navigate('/login');
        return;
      }
    }

    const fetchAchievements = async () => {
      try {
        setLoading(true);
        
        // Attempt to get achievements from backend
        let userAchievements = [];
        try {
          const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
          userAchievements = await achievementService.getUserAchievements(userId);
        } catch (error) {
          console.error('Error fetching achievements from API:', error);
          // Fall back to local achievements data
          const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
          userAchievements = achievementService.getLocalAchievements(userId);
        }
        
        // Sort achievements by unlocked status and date (newest first)
        userAchievements.sort((a, b) => {
          // First sort by unlock status (unlocked first)
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
          
          // If both have same unlock status, sort by date (newest first)
          if (a.unlocked && b.unlocked) {
            return new Date(b.unlockedAt) - new Date(a.unlockedAt);
          }
          
          // If both locked, sort by title
          return a.title.localeCompare(b.title);
        });
        
        setAchievements(userAchievements);
      } catch (error) {
        console.error('Error fetching achievements:', error);
        setError('Failed to load achievements. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAchievements();
  }, [user, navigate]);
  
  // Format date to a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'Not unlocked yet';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today: Show time
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Within a week
      return `${diffDays} days ago`;
    } else {
      // More than a week
      return date.toLocaleDateString();
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading achievements...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto mt-12 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Achievements</h1>
      
      {achievements.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">No Achievements Yet</h2>
          <p className="text-gray-600 mb-4">
            Complete quizzes and study decks to unlock achievements!
          </p>
          <button 
            onClick={() => navigate('/decks')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Browse Decks
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
                achievement.unlocked ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div className={`rounded-full p-2 mr-3 ${
                  achievement.unlocked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {achievement.unlocked ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{achievement.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{achievement.description}</p>
                  <p className={`text-xs ${achievement.unlocked ? 'text-green-600' : 'text-gray-400'}`}>
                    {achievement.unlocked 
                      ? `Unlocked: ${formatDate(achievement.unlockedAt)}` 
                      : 'Locked'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Achievements; 