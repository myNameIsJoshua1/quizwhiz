import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardService } from '../services/flashcardService';
import { quizService } from '../services/quizService';
import { reviewService } from '../services/reviewService';
import { progressService } from '../services/progressService';
import { achievementService } from '../services/achievementService';
import { useUser } from '../contexts/UserContext';

// Define question type interface
const QUESTION_TYPES = {
  TRUE_FALSE: 'true-false',
  MULTIPLE_CHOICE: 'multiple-choice',
  IDENTIFICATION: 'identification'
};

const QuizMode = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { user: contextUser } = useUser();
  const [user, setUser] = useState(contextUser);
  
  // Quiz state
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Timer state
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef(null);

  // Score tallying state
  const [tallyState, setTallyState] = useState({
    isTallyingScore: false,
    tallyProgress: 0,
    tallyStep: '',
    tallyScore: 0,
    correctTally: 0,
    tallyComplete: false
  });

  // Memoize the question generation function
  const generateQuestions = useCallback((flashcards, questionCount) => {
    // Shuffle flashcards
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    
    // Limit to questionCount
    const selectedFlashcards = shuffled.slice(0, questionCount);
    
    // Generate ONLY identification questions
    return selectedFlashcards.map(card => {
      // Always use identification type as requested
      return {
        id: card.id,
        question: card.term,
        questionType: QUESTION_TYPES.IDENTIFICATION,
        correctAnswer: card.definition
      };
    });
  }, []);

  // Ensure user data is available and setup quiz
  useEffect(() => {
    const fetchDeckAndGenerateQuestions = async () => {
      try {
        setIsLoading(true);
        
        // Validate user first
        if (!contextUser) {
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            } else {
              navigate('/login');
              return;
            }
          } catch (err) {
            console.error('Failed to parse user from localStorage:', err);
            navigate('/login');
            return;
          }
        }
        
        if (!deckId) {
          setError('No deck ID provided');
          return;
        }
        
        // Get deck info
        const deckInfo = await flashcardService.getDeck(deckId);
        setTitle(deckInfo.title);
        
        // Get flashcards
        const flashcards = await flashcardService.getFlashcards(deckId);
        
        if (!flashcards || flashcards.length === 0) {
          setError('This deck has no flashcards. Please add some before taking a quiz.');
          return;
        }
        
        // Set default quiz configuration - only identification questions with no instant evaluation
        const questionCount = Math.min(10, flashcards.length);
        
        // Generate questions
        const quizQuestions = generateQuestions(flashcards, questionCount);
        setQuestions(quizQuestions);
      } catch (error) {
        console.error('Error preparing quiz:', error);
        setError('Failed to load quiz. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDeckAndGenerateQuestions();
    
    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [deckId, navigate, contextUser, generateQuestions]);
  
  // Set up timer only when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !timerRef.current) {
      // Create a timer that updates every second
      timerRef.current = setInterval(() => {
        setTimeSpent(prevTime => prevTime + 1);
      }, 1000);
    }
    
    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [questions.length]);
  
  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Complete the quiz
      handleCompleteQuiz();
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleCloseQuiz = () => {
    // Confirm before closing
    if (Object.keys(answers).length > 0) {
      const confirmed = window.confirm("Are you sure you want to exit the quiz? Your progress will be lost.");
      if (!confirmed) return;
    }
    
    // Clean up timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    navigate(`/decks/${deckId}`);
  };
  
  // Optimize the handleCompleteQuiz function for better performance
  const handleCompleteQuiz = async () => {
    try {
      if (!user || !deckId) return;
      
      // Stop timer
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Start tallying animation
      setTallyState({
        isTallyingScore: true,
        tallyProgress: 10,
        tallyStep: 'Calculating results...',
        tallyScore: 0,
        correctTally: 0,
        tallyComplete: false
      });
      
      // Calculate results
      let correctCount = 0;
      let incorrectCount = 0;
      
      // Track correct and incorrect answers for review
      const correctAnswers = [];
      const incorrectAnswers = [];
      
      // Process answers for each question
      questions.forEach(question => {
        const userAnswer = answers[question.id];
        
        if (!userAnswer) {
          incorrectCount++;
          // Add to incorrect answers
          incorrectAnswers.push({
            flashCardId: question.id,
            question: question.question,
            correctAnswer: question.correctAnswer,
            userAnswer: ''
          });
          return;
        }
        
        if (question.questionType === QUESTION_TYPES.IDENTIFICATION) {
          // For identification, compare lowercase and trim
          if (userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
            correctCount++;
            // Add to correct answers
            correctAnswers.push({
              flashCardId: question.id,
              question: question.question,
              correctAnswer: question.correctAnswer,
              userAnswer: userAnswer
            });
          } else {
            incorrectCount++;
            // Add to incorrect answers
            incorrectAnswers.push({
              flashCardId: question.id,
              question: question.question,
              correctAnswer: question.correctAnswer,
              userAnswer: userAnswer
            });
          }
        } else {
          // For true-false and multiple-choice
          if (userAnswer === question.correctAnswer) {
            correctCount++;
            // Add to correct answers
            correctAnswers.push({
              flashCardId: question.id,
              question: question.question,
              correctAnswer: question.correctAnswer,
              userAnswer: userAnswer
            });
          } else {
            incorrectCount++;
            // Add to incorrect answers
            incorrectAnswers.push({
              flashCardId: question.id,
              question: question.question,
              correctAnswer: question.correctAnswer,
              userAnswer: userAnswer
            });
          }
        }
      });
      
      const score = Math.round((correctCount / questions.length) * 100);
      const userId = user.id || user.userId;
      
      // Update tallying progress
      setTallyState(prev => ({
        ...prev,
        tallyProgress: 30,
        tallyStep: 'Tallying answers...'
      }));
      
      // Animate the score counting up - using requestAnimationFrame for better performance
      let currentTally = 0;
      let currentCorrect = 0;
      
      const animateScore = () => {
        let updated = false;
        
        if (currentTally < score) {
          currentTally = Math.min(currentTally + 2, score);
          updated = true;
        }
        
        if (currentCorrect < correctCount) {
          currentCorrect = Math.min(currentCorrect + 1, correctCount);
          updated = true;
        }
        
        if (updated) {
          setTallyState(prev => ({
            ...prev,
            tallyScore: currentTally,
            correctTally: currentCorrect
          }));
          requestAnimationFrame(animateScore);
        }
      };
      
      requestAnimationFrame(animateScore);
      
      // Create quiz result object
      const quizResult = {
        deckId: deckId,
        userId: userId,
        typeOfQuiz: 'flashcards',
        score: score,
        timeLimit: Math.round(timeSpent / 60), // Convert seconds to minutes
        randomizeQuestions: true,
        difficultyLevel: 'normal'
      };
      
      // Prepare results for sessionStorage
      const quizResultData = {
        deckId: deckId,
        title: title,
        totalQuestions: questions.length,
        correctCount,
        incorrectCount,
        timeSpent,
        score,
        date: new Date().toISOString(),
        questions: questions.map(q => ({
          question: q.question,
          questionType: q.questionType,
          correctAnswer: q.correctAnswer,
          userAnswer: answers[q.id] || ""
        }))
      };
      
      // Store results in sessionStorage first to ensure we don't lose data
      sessionStorage.setItem(`quizResult-${deckId}`, JSON.stringify(quizResultData));
      
      // Update tallying progress
      setTallyState(prev => ({
        ...prev,
        tallyProgress: 50,
        tallyStep: 'Saving quiz results...'
      }));
      
      try {
        // Use Promise.all to run API calls in parallel for better performance
        const apiPromises = [];
        
        // Save quiz result to backend
        apiPromises.push(
          quizService.completeQuiz(
            userId,
            quizResult.deckId, 
            quizResult.score
          )
        );
        
        // Update tallying progress
        setTallyState(prev => ({
          ...prev,
          tallyProgress: 70,
          tallyStep: 'Tracking flashcard progress...'
        }));
        
        // Process flashcard progress promises in batches of 5 to prevent overwhelming the API
        const progressPromises = [];
        
        for (const question of questions) {
          const userAnswer = answers[question.id];
          if (!userAnswer) continue; // Skip unanswered questions
          
          // Calculate individual question score (0 or 100)
          const isCorrect = userAnswer && (
            question.questionType === QUESTION_TYPES.IDENTIFICATION
              ? userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
              : userAnswer === question.correctAnswer
          );
          
          const questionScore = isCorrect ? 100 : 0;
          
          // Prepare progress data for this flashcard
          const progressData = {
            flashCardId: question.id,
            score: questionScore,
            timeSpent: Math.round(timeSpent / questions.length), // Approximate time per question
            scoreComparison: progressService.getScoreComparison(questionScore)
          };
          
          // Queue progress update
          progressPromises.push(
            progressService.createProgress(progressData)
              .catch(err => {
                // Save locally as fallback
                progressService.saveProgressLocally(userId, {
                  flashCardId: question.id,
                  score: questionScore,
                  timeSpent: Math.round(timeSpent / questions.length),
                  scoreComparison: progressService.getScoreComparison(questionScore)
                });
                return null; // Continue with other promises
              })
          );
        }
        
        // Add all progress promises to the main promise array
        apiPromises.push(Promise.allSettled(progressPromises));
        
        // Update tallying progress
        setTallyState(prev => ({
          ...prev,
          tallyProgress: 85,
          tallyStep: 'Updating learning history...'
        }));
        
        // Track overall study time
        apiPromises.push(
          progressService.trackStudyTime(userId, Math.ceil(timeSpent / 60))
            .catch(err => console.error('Error tracking study time:', err))
        );
        
        // Create review promises for incorrect answers
        const reviewPromises = incorrectAnswers.map(incorrectItem => 
          reviewService.createReview({
            flashCardId: incorrectItem.flashCardId,
            reviewCorrectAnswer: incorrectItem.correctAnswer,
            reviewIncorrectAnswer: incorrectItem.userAnswer
          }).catch(err => {
            // Fallback to local storage
            reviewService.saveReviewLocally(userId, {
              flashCardId: incorrectItem.flashCardId,
              questionText: incorrectItem.question,
              reviewCorrectAnswer: incorrectItem.correctAnswer,
              reviewIncorrectAnswer: incorrectItem.userAnswer,
              deckId: deckId,
              deckTitle: title
            });
            return null;
          })
        );
        
        // Create review promises for some correct answers (first 2)
        const correctReviewPromises = correctAnswers.slice(0, 2).map(correctItem =>
          reviewService.createReview({
            flashCardId: correctItem.flashCardId,
            reviewCorrectAnswer: correctItem.correctAnswer,
            reviewIncorrectAnswer: null
          }).catch(() => null) // Silently ignore errors for correct answers
        );
        
        // Add all review promises to the main promise array
        apiPromises.push(Promise.allSettled([...reviewPromises, ...correctReviewPromises]));
        
        // Save overall quiz summary to local review history
        reviewService.saveReviewLocally(userId, {
          type: 'quiz_summary',
          deckId: deckId,
          deckTitle: title,
          score: score,
          correctCount: correctCount,
          totalQuestions: questions.length,
          timeSpent: timeSpent
        });
        
        // Update tallying progress
        setTallyState(prev => ({
          ...prev,
          tallyProgress: 90,
          tallyStep: 'Checking achievements...'
        }));
        
        // Prepare achievement promises
        const achievementPromises = [
          // First Quiz Achievement
          achievementService.unlockAchievement(
            userId,
            'Quiz Taker',
            'Completed your first quiz'
          ),
        ];
        
        // Achievement for perfect score
        if (score === 100) {
          achievementPromises.push(
            achievementService.unlockAchievement(
              userId,
              'Perfect Score',
              'Achieved a perfect score on a quiz'
            )
          );
        }
        
        // Achievement for high score (over 80%)
        if (score >= 80) {
          achievementPromises.push(
            achievementService.unlockAchievement(
              userId,
              'High Achiever',
              'Scored 80% or higher on a quiz'
            )
          );
        }
        
        // Achievement for completing a quiz quickly
        if (timeSpent < 120 && questions.length >= 5) {
          achievementPromises.push(
            achievementService.unlockAchievement(
              userId,
              'Speed Learner',
              'Completed a quiz in record time'
            )
          );
        }
        
        // Add all achievement promises
        apiPromises.push(
          Promise.allSettled(achievementPromises)
            .catch(() => {
              // Save achievements locally as fallback
              achievementService.saveAchievementsLocally(userId, {
                title: 'Quiz Taker',
                description: 'Completed your first quiz'
              });
              
              if (score === 100) {
                achievementService.saveAchievementsLocally(userId, {
                  title: 'Perfect Score',
                  description: 'Achieved a perfect score on a quiz'
                });
              }
              
              if (score >= 80) {
                achievementService.saveAchievementsLocally(userId, {
                  title: 'High Achiever',
                  description: 'Scored 80% or higher on a quiz'
                });
              }
              
              if (timeSpent < 120 && questions.length >= 5) {
                achievementService.saveAchievementsLocally(userId, {
                  title: 'Speed Learner',
                  description: 'Completed a quiz in record time'
                });
              }
            })
        );
        
        // Wait for all API calls to complete
        await Promise.allSettled(apiPromises);
        
      } catch (apiError) {
        console.error('Error saving quiz to backend:', apiError);
        // Save data locally as fallback
        reviewService.saveReviewLocally(userId, {
          type: 'quiz_summary',
          deckId: deckId,
          deckTitle: title,
          score: score,
          correctCount: correctCount,
          totalQuestions: questions.length,
          timeSpent: timeSpent
        });
        
        // Local progress fallbacks are handled in the individual catch blocks above
      }
      
      // Complete the tallying animation
      setTallyState({
        isTallyingScore: true,
        tallyProgress: 100,
        tallyStep: 'All done!',
        tallyScore: score,
        correctTally: correctCount,
        tallyComplete: true
      });
      
      // Allow some time for the user to see the final score before redirecting
      setTimeout(() => {
        // Navigate to results page
        navigate(`/quiz-results/${deckId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error completing quiz:', error);
      setError('Failed to save quiz results. Please try again.');
      setTallyState(prev => ({...prev, isTallyingScore: false}));
    }
  };
  
  // Format time to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-6 w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Preparing Quiz</h2>
          <p className="text-gray-600">Loading questions for {title || 'your deck'}...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
          <button 
            onClick={() => navigate(`/decks/${deckId}`)}
            className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white px-6 py-3 rounded shadow-sm hover:shadow-md transition-all duration-200"
          >
            Back to Deck
          </button>
        </div>
      </div>
    );
  }

  // If tallying scores, show the tallying animation
  if (tallyState.isTallyingScore) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-xl font-bold text-center mb-6">Quiz Complete!</h2>
          
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{tallyState.tallyStep}</span>
              <span className="text-sm font-medium">{tallyState.tallyProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${tallyState.tallyProgress}%` }}
              ></div>
            </div>
          </div>
          
          {tallyState.tallyProgress >= 30 && (
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-blue-600 animate-pulse">
                {tallyState.tallyScore}%
              </div>
              <div className="text-gray-600 mt-2">
                {tallyState.correctTally} of {questions.length} questions correct
              </div>
            </div>
          )}
          
          {tallyState.tallyComplete ? (
            <div className="text-center text-green-600 font-medium">
              Redirecting to results...
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show the quiz
  const currentQuestion = questions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-6 w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Questions Available</h2>
          <p className="text-gray-600 mb-6">There are no questions available for this quiz.</p>
          <button 
            onClick={() => navigate(`/decks/${deckId}`)}
            className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white px-6 py-3 rounded shadow-sm hover:shadow transition-all duration-200"
          >
            Back to Deck
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 overflow-hidden shadow-xl">
        {/* Quiz header */}
        <div className="p-4 flex justify-between items-center bg-gradient-to-r from-purple-600 to-orange-500">
          <h3 className="text-lg font-bold text-white">{title} - Quiz</h3>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
              <span className="font-mono">{formatTime(timeSpent)}</span>
            </div>
            <button
              className="text-white hover:text-gray-200 transition-colors"
              onClick={handleCloseQuiz}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full mb-8">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-orange-500 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          
          {/* Question */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</h4>
              <span className="text-sm font-medium text-purple-600">
                {currentQuestion.questionType === QUESTION_TYPES.IDENTIFICATION ? 'Identification' : 
                 currentQuestion.questionType === QUESTION_TYPES.MULTIPLE_CHOICE ? 'Multiple Choice' : 'True/False'}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{currentQuestion.question}</h3>
            
            {/* Answer input based on question type */}
            {currentQuestion.questionType === QUESTION_TYPES.IDENTIFICATION && (
              <div className="mb-4">
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">Your Answer:</label>
                <textarea
                  id="answer"
                  rows="3"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  placeholder="Type your answer here..."
                />
              </div>
            )}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevQuestion}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentQuestionIndex > 0
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } transition-colors flex items-center`}
              disabled={currentQuestionIndex === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Previous
            </button>
            <button
              onClick={handleNextQuestion}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white rounded-md shadow-sm hover:shadow text-sm font-medium transition-all duration-200 flex items-center"
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </>
              ) : (
                'Finish Quiz'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizMode; 