import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardService } from '../services/flashcardService';
import { useOptimization } from '../components/PerformanceMonitor';
import { startMeasurement, endMeasurement } from '../utils/performance';

const QuizResults = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [deckTitle, setDeckTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Get optimization settings
  const optimizationSettings = useOptimization();

  // Load quiz results
  useEffect(() => {
    // Start performance measurement
    startMeasurement('quiz-results-load');
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Retrieve quiz results from sessionStorage
        const storedResults = sessionStorage.getItem(`quizResult-${deckId}`);
        
        if (!storedResults) {
          setError('Quiz results not found. Please take the quiz again.');
          setLoading(false);
          return;
        }
        
        const quizResults = JSON.parse(storedResults);
        setResults(quizResults);
        
        // Get deck info for title
        if (!quizResults.title) {
          const deckInfo = await flashcardService.getDeck(deckId);
          setDeckTitle(deckInfo.title);
        } else {
          setDeckTitle(quizResults.title);
        }
        
        // Trigger celebration animation for good scores (above 80%)
        if (quizResults.score >= 80) {
          setTimeout(() => setShowCelebration(true), 500);
          setTimeout(() => setShowCelebration(false), 3500);
        }
      } catch (error) {
        console.error('Error loading quiz results:', error);
        setError('Failed to load quiz results.');
      } finally {
        setLoading(false);
        // End performance measurement
        endMeasurement('quiz-results-load');
      }
    };
    
    fetchData();
  }, [deckId]);
  
  // Format time (mm:ss)
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }, []);
  
  // Calculate grade based on score
  const getGrade = useCallback((score) => {
    if (score >= 90) return { letter: 'A', color: 'text-green-600', emoji: '🏆', description: 'Excellent!' };
    if (score >= 80) return { letter: 'B', color: 'text-blue-600', emoji: '🎉', description: 'Great job!' };
    if (score >= 70) return { letter: 'C', color: 'text-yellow-600', emoji: '👍', description: 'Good work!' };
    if (score >= 60) return { letter: 'D', color: 'text-orange-600', emoji: '🤔', description: 'Keep studying' };
    return { letter: 'F', color: 'text-red-600', emoji: '📚', description: 'Need improvement' };
  }, []);
  
  // Helper function to check if answer is correct
  const isAnswerCorrect = useCallback((question) => {
    if (!question.userAnswer) return false;
    
    if (question.questionType === 'identification') {
      return question.userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    } else {
      return question.userAnswer === question.correctAnswer;
    }
  }, []);
  
  // Calculate performance stats
  const stats = useMemo(() => {
    if (!results) return null;
    
    const correctCount = results.correctCount || 0;
    const totalQuestions = results.totalQuestions || 0;
    const incorrectCount = totalQuestions - correctCount;
    
    return {
      percentComplete: Math.round((correctCount + incorrectCount) / totalQuestions * 100),
      timePerQuestion: results.timeSpent / totalQuestions,
      accuracy: (correctCount / totalQuestions) * 100,
      averageScore: results.score || 0
    };
  }, [results]);
  
  // Group questions by correct/incorrect
  const groupedQuestions = useMemo(() => {
    if (!results || !results.questions) return { correct: [], incorrect: [] };
    
    return results.questions.reduce((acc, question) => {
      if (isAnswerCorrect(question)) {
        acc.correct.push(question);
      } else {
        acc.incorrect.push(question);
      }
      return acc;
    }, { correct: [], incorrect: [] });
  }, [results, isAnswerCorrect]);
  
  // Handle tab changes
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);
  
  // Handle retry quiz
  const handleRetryQuiz = useCallback(() => {
    navigate(`/quiz/${deckId}`);
  }, [navigate, deckId]);
  
  // Handle back to deck
  const handleBackToDeck = useCallback(() => {
    navigate(`/decks/${deckId}`);
  }, [navigate, deckId]);
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-purple-600">Loading your results...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button 
            onClick={handleBackToDeck}
            className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white px-6 py-3 rounded shadow-sm hover:shadow-md transition-all duration-200"
          >
            Back to Deck
          </button>
        </div>
      </div>
    );
  }
  
  if (!results) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>No quiz results available. Please take the quiz first.</span>
          </div>
          <button 
            onClick={handleBackToDeck}
            className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white px-6 py-3 rounded shadow-sm hover:shadow-md transition-all duration-200"
          >
            Back to Deck
          </button>
        </div>
      </div>
    );
  }
  
  const grade = getGrade(results.score);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Celebration animation */}
      {showCelebration && optimizationSettings.useAnimations && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="confetti-container">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ['#FFC107', '#FF5722', '#03A9F4', '#4CAF50'][Math.floor(Math.random() * 4)],
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="max-w-3xl mx-auto">
        <div className={`bg-white rounded-xl ${optimizationSettings.useShadowEffects ? 'shadow-xl' : 'border border-gray-200'} overflow-hidden`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-orange-500 text-white p-8">
            <h1 className="text-3xl font-bold mb-2">Quiz Results</h1>
            <p className="text-white/80">{deckTitle}</p>
            
            {/* Animated score display */}
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between">
              <div className="relative flex items-center">
                <div className={`text-7xl font-bold transition-all duration-500 ${optimizationSettings.useAnimations ? 'animate-scale-in' : ''}`}>
                  {results.score}%
                </div>
                <div className={`ml-4 flex flex-col items-start ${optimizationSettings.useAnimations ? 'animate-fade-in' : ''}`}>
                  <div className={`${grade.color} text-3xl font-bold`}>{grade.letter}</div>
                  <div className="text-white mt-1 flex items-center">
                    <span className="text-2xl mr-2">{grade.emoji}</span> 
                    <span>{grade.description}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 md:mt-0 text-center md:text-right">
                <div className="text-white/80 mb-1">Completed</div>
                <div className="text-xl font-semibold">
                  {results.correctCount} of {results.totalQuestions} questions
                </div>
                <div className="text-white/80 mt-2 mb-1">Time Taken</div>
                <div className="text-xl font-semibold">{formatTime(results.timeSpent)}</div>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="px-4 border-b">
            <div className="flex overflow-x-auto -mb-px space-x-8">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => handleTabChange('overview')}
              >
                Overview
              </button>
              
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'incorrect'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => handleTabChange('incorrect')}
              >
                Incorrect ({groupedQuestions.incorrect.length})
              </button>
              
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => handleTabChange('all')}
              >
                All Questions ({results.questions ? results.questions.length : 0})
              </button>
            </div>
          </div>
          
          {/* Content based on active tab */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className={`${optimizationSettings.useAnimations ? 'animate-fade-in' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className={`bg-gray-50 rounded-xl p-6 ${optimizationSettings.useShadowEffects ? 'shadow-md' : 'border border-gray-200'}`}>
                    <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Accuracy</span>
                          <span className="text-sm font-medium text-gray-700">{stats.accuracy.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.accuracy}%` }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Completion</span>
                          <span className="text-sm font-medium text-gray-700">{stats.percentComplete}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.percentComplete}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-500">Time per question</span>
                            <p className="text-lg font-semibold">{formatTime(Math.round(stats.timePerQuestion))}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Score rating</span>
                            <p className="text-lg font-semibold flex items-center">
                              {grade.emoji} <span className={`ml-1 ${grade.color}`}>{grade.letter}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`bg-gray-50 rounded-xl p-6 ${optimizationSettings.useShadowEffects ? 'shadow-md' : 'border border-gray-200'}`}>
                    <h3 className="text-lg font-semibold mb-4">Question Breakdown</h3>
                    
                    <div className="relative pt-1 mb-6">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                            Correct
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-green-600">
                            {results.correctCount}/{results.totalQuestions}
                          </span>
                        </div>
                      </div>
                      <div className="flex h-4 mb-4 overflow-hidden rounded-lg bg-gray-200">
                        <div style={{ width: `${(results.correctCount / results.totalQuestions) * 100}%` }} className="bg-green-500"></div>
                      </div>
                      
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                            Incorrect
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-red-600">
                            {results.totalQuestions - results.correctCount}/{results.totalQuestions}
                          </span>
                        </div>
                      </div>
                      <div className="flex h-4 overflow-hidden rounded-lg bg-gray-200">
                        <div style={{ width: `${((results.totalQuestions - results.correctCount) / results.totalQuestions) * 100}%` }} className="bg-red-500"></div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Areas to focus on:</h4>
                      {groupedQuestions.incorrect.length > 0 ? (
                        <ul className="space-y-1">
                          {groupedQuestions.incorrect.slice(0, 3).map((q, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2 text-red-500">•</span>
                              <span className="line-clamp-1">{q.question}</span>
                            </li>
                          ))}
                          {groupedQuestions.incorrect.length > 3 && (
                            <li className="text-sm text-purple-600 font-medium cursor-pointer" onClick={() => handleTabChange('incorrect')}>
                              View all incorrect answers →
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">Great job! You answered all questions correctly.</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-8">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Date Taken</div>
                    <div className="font-medium">{new Date(results.date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex space-x-4">
                    <button 
                      onClick={handleBackToDeck}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    >
                      Back to Deck
                    </button>
                    <button 
                      onClick={handleRetryQuiz}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white rounded shadow-sm hover:shadow transition-all duration-200"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Incorrect Tab */}
            {activeTab === 'incorrect' && (
              <div className={`${optimizationSettings.useAnimations ? 'animate-fade-in' : ''}`}>
                {groupedQuestions.incorrect.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4">Incorrect Answers</h3>
                    {groupedQuestions.incorrect.map((question, index) => (
                      <div 
                        key={index} 
                        className={`p-6 rounded-xl ${optimizationSettings.useShadowEffects ? 'shadow-sm' : 'border'} border-red-200 bg-red-50`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">Question {index + 1}</span>
                          <span className="text-red-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Incorrect
                          </span>
                        </div>
                        <p className="mt-3 text-gray-800 font-medium">{question.question}</p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/60 p-3 rounded-lg border border-red-200">
                            <div className="text-sm text-gray-500">Your answer:</div>
                            <div className="font-medium text-red-600">
                              {question.userAnswer || '(No answer)'}
                            </div>
                          </div>
                          <div className="bg-white/60 p-3 rounded-lg border border-green-200">
                            <div className="text-sm text-gray-500">Correct answer:</div>
                            <div className="font-medium text-green-600">{question.correctAnswer}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Perfect Score!</h3>
                    <p className="text-gray-600">You answered all questions correctly. Great job!</p>
                  </div>
                )}
              </div>
            )}
            
            {/* All Questions Tab */}
            {activeTab === 'all' && (
              <div className={`${optimizationSettings.useAnimations ? 'animate-fade-in' : ''}`}>
                <h3 className="text-xl font-semibold mb-4">All Questions</h3>
                <div className="space-y-4">
                  {results.questions && results.questions.map((question, index) => {
                    const isCorrect = isAnswerCorrect(question);
                    return (
                      <div 
                        key={index} 
                        className={`p-6 rounded-xl ${optimizationSettings.useShadowEffects ? 'shadow-sm' : 'border'} ${
                          isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">Question {index + 1}</span>
                          <span className={`flex items-center ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <p className="mt-3 text-gray-800 font-medium">{question.question}</p>
                        <div className={`mt-4 ${!isCorrect ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
                          <div className={`bg-white/60 p-3 rounded-lg border ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                            <div className="text-sm text-gray-500">Your answer:</div>
                            <div className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              {question.userAnswer || '(No answer)'}
                            </div>
                          </div>
                          {!isCorrect && (
                            <div className="bg-white/60 p-3 rounded-lg border border-green-200">
                              <div className="text-sm text-gray-500">Correct answer:</div>
                              <div className="font-medium text-green-600">{question.correctAnswer}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom Actions - Only shown for incorrect and all questions tabs */}
          {(activeTab === 'incorrect' || activeTab === 'all') && (
            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <button 
                onClick={handleBackToDeck}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Back to Deck
              </button>
              <button 
                onClick={handleRetryQuiz}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white rounded shadow-sm hover:shadow transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add CSS for confetti animation */}
      <style jsx="true">{`
        .confetti-container {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          opacity: 0;
          animation: confetti-fall 3s ease-in-out forwards;
          transform-origin: center;
        }
        
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            top: -10px;
            transform: translateX(0) rotate(0deg);
          }
          
          100% {
            opacity: 0;
            top: 100%;
            transform: translateX(calc(100px - 200px * var(--random, 0.5))) rotate(720deg);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        
        @keyframes scale-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default QuizResults; 