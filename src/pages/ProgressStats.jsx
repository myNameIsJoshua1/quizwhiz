import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressService } from '../services/progressService';
import { flashcardService } from '../services/flashcardService';
import { useUser } from '../contexts/UserContext';

const ProgressStats = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [progressData, setProgressData] = useState([]);
  const [flashcardMap, setFlashcardMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalCards: 0,
    averageScore: 0,
    averageTime: 0,
    excellentCount: 0,
    goodCount: 0,
    fairCount: 0,
    needsImprovementCount: 0
  });

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        navigate('/login');
        return;
      }
    }

    const fetchProgressData = async () => {
      try {
        setLoading(true);
        
        // Attempt to get progress data from backend
        let progressEntries = [];
        try {
          // This endpoint would need to be added to your backend
          const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
          progressEntries = await progressService.getProgressByUserId(userId);
        } catch (error) {
          console.error('Error fetching progress from API:', error);
          // Fall back to local progress data
          const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
          progressEntries = progressService.getLocalProgress(userId);
        }
        
        // Fetch flashcard details to show card questions
        let flashcardDetails = {};
        try {
          // Get all unique flashcard IDs
          const flashcardIds = [...new Set(progressEntries.map(entry => entry.flashCardId))];
          
          // Fetch details for each flashcard
          for (const id of flashcardIds) {
            try {
              const flashcard = await flashcardService.getFlashcard(id);
              if (flashcard) {
                flashcardDetails[id] = flashcard;
              }
            } catch (error) {
              console.warn(`Could not fetch details for flashcard ${id}`);
            }
          }
        } catch (error) {
          console.error('Error fetching flashcard details:', error);
        }
        
        // Calculate stats
        const stats = calculateStats(progressEntries);
        
        setProgressData(progressEntries);
        setFlashcardMap(flashcardDetails);
        setStats(stats);
      } catch (error) {
        console.error('Error fetching progress data:', error);
        setError('Failed to load progress data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProgressData();
  }, [user, navigate]);
  
  // Calculate statistics from progress entries
  const calculateStats = (entries) => {
    if (!entries || entries.length === 0) {
      return {
        totalCards: 0,
        averageScore: 0,
        averageTime: 0,
        excellentCount: 0,
        goodCount: 0,
        fairCount: 0,
        needsImprovementCount: 0
      };
    }
    
    const totalCards = entries.length;
    const totalScore = entries.reduce((sum, entry) => sum + entry.score, 0);
    const averageScore = Math.round(totalScore / totalCards);
    
    const totalTime = entries.reduce((sum, entry) => sum + entry.timeSpent, 0);
    const averageTime = Math.round(totalTime / totalCards);
    
    // Count by score comparison
    const excellentCount = entries.filter(entry => entry.scoreComparison === 'EXCELLENT').length;
    const goodCount = entries.filter(entry => entry.scoreComparison === 'GOOD').length;
    const fairCount = entries.filter(entry => entry.scoreComparison === 'FAIR').length;
    const needsImprovementCount = entries.filter(entry => entry.scoreComparison === 'NEEDS_IMPROVEMENT').length;
    
    return {
      totalCards,
      averageScore,
      averageTime,
      excellentCount,
      goodCount,
      fairCount,
      needsImprovementCount
    };
  };
  
  // Format time in seconds to a readable format
  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds} sec`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
  };
  
  // Get color class based on score comparison
  const getScoreColorClass = (comparison) => {
    switch(comparison) {
      case 'EXCELLENT': return 'text-green-600';
      case 'GOOD': return 'text-blue-600';
      case 'FAIR': return 'text-yellow-600';
      case 'NEEDS_IMPROVEMENT': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  // Get flashcard question text by ID
  const getFlashcardText = (flashcardId) => {
    if (flashcardMap[flashcardId]) {
      return flashcardMap[flashcardId].term || 'Unknown Term';
    }
    return `Card #${flashcardId.substring(0, 6)}...`;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading progress data...</div>
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
      <h1 className="text-2xl font-bold mb-6">Your Learning Progress</h1>
      
      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Overall Progress Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-gray-600 text-sm">Cards Studied</div>
            <div className="text-3xl font-bold">{stats.totalCards}</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded">
            <div className="text-gray-600 text-sm">Average Score</div>
            <div className="text-3xl font-bold">{stats.averageScore}%</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded">
            <div className="text-gray-600 text-sm">Average Time per Card</div>
            <div className="text-3xl font-bold">{formatTime(stats.averageTime)}</div>
          </div>
        </div>
        
        {/* Performance Distribution */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Performance Distribution</h3>
          
          <div className="flex h-4 rounded-full overflow-hidden">
            <div 
              className="bg-green-500" 
              style={{ width: `${(stats.excellentCount / stats.totalCards) * 100}%` }}
              title={`Excellent: ${stats.excellentCount} cards`}
            ></div>
            <div 
              className="bg-blue-500" 
              style={{ width: `${(stats.goodCount / stats.totalCards) * 100}%` }}
              title={`Good: ${stats.goodCount} cards`}
            ></div>
            <div 
              className="bg-yellow-500" 
              style={{ width: `${(stats.fairCount / stats.totalCards) * 100}%` }}
              title={`Fair: ${stats.fairCount} cards`}
            ></div>
            <div 
              className="bg-red-500" 
              style={{ width: `${(stats.needsImprovementCount / stats.totalCards) * 100}%` }}
              title={`Needs Improvement: ${stats.needsImprovementCount} cards`}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs mt-1">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span>Excellent ({stats.excellentCount})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
              <span>Good ({stats.goodCount})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
              <span>Fair ({stats.fairCount})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
              <span>Needs Improvement ({stats.needsImprovementCount})</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Detailed Progress History */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">Detailed Progress History</h2>
        
        {progressData.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No progress data yet. Start studying to track your progress!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 text-left">Flashcard</th>
                  <th className="py-2 px-4 text-left">Score</th>
                  <th className="py-2 px-4 text-left">Time Spent</th>
                  <th className="py-2 px-4 text-left">Rating</th>
                  <th className="py-2 px-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {progressData.slice(0, 20).map((entry, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2 px-4">{getFlashcardText(entry.flashCardId)}</td>
                    <td className="py-2 px-4">{entry.score}%</td>
                    <td className="py-2 px-4">{formatTime(entry.timeSpent)}</td>
                    <td className={`py-2 px-4 ${getScoreColorClass(entry.scoreComparison)}`}>
                      {entry.scoreComparison}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {progressData.length > 20 && (
              <div className="text-center text-sm text-gray-500 mt-2">
                Showing 20 of {progressData.length} entries
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressStats; 