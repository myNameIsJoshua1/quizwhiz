import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardService } from '../services/flashcardService';
import { useUser } from '../contexts/UserContext';
import { achievementService } from '../services/achievementService';
import { useOptimization } from '../components/PerformanceMonitor';

const StudyDeck = () => {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const [flashcards, setFlashcards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deckTitle, setDeckTitle] = useState('');
    
    // Get optimization settings
    const optimizationSettings = useOptimization();
    
    // Study state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [cardsLearned, setCardsLearned] = useState(0);

    // Load deck data only once when component mounts
    useEffect(() => {
        const loadData = async () => {
            if (!deckId || deckId === 'null' || deckId === 'undefined') {
                setError('Invalid deck ID. Please go back and try again.');
                setLoading(false);
                return;
            }
            
            try {
                // Use Promise.all to load deck info and flashcards in parallel
                const [deckInfo, cards] = await Promise.all([
                    flashcardService.getDeck(deckId),
                    flashcardService.getFlashcards(deckId)
                ]);
                
                setDeckTitle(deckInfo.title);
                
                // Count already learned cards
                const learnedCount = cards.filter(card => card.learned).length;
                setCardsLearned(learnedCount);
                
                setFlashcards(cards);
            } catch (error) {
                setError('Failed to fetch deck data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [deckId]);

    // Memoize navigation handlers to prevent unnecessary re-renders
    const handleNext = useCallback(() => {
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setFlipped(false);
        } else {
            alert("You've reached the end of this flashcard set.");
        }
    }, [currentIndex, flashcards.length]);

    const handlePrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setFlipped(false);
        } else {
            alert("You're at the beginning of this flashcard set.");
        }
    }, [currentIndex]);

    const toggleFlip = useCallback(() => {
        setFlipped(prev => !prev);
    }, []);

    // Optimize achievement checking
    const checkAndUnlockAchievements = useCallback(async (newCardsLearned, totalCards) => {
        if (!user) return;
        
        const userId = user.id || user.userId;
        
        try {
            // Create an array of achievement promises
            const achievementPromises = [];
            
            // First Study Session Achievement
            achievementPromises.push(
                achievementService.unlockAchievement(
                    userId,
                    'First Steps',
                    'Started your first study session'
                )
            );
            
            // Mark as learned achievement
            if (newCardsLearned === 1) {
                achievementPromises.push(
                    achievementService.unlockAchievement(
                        userId,
                        'Learning Begins',
                        'Marked your first flashcard as learned'
                    )
                );
            }
            
            // 5 Cards Learned achievement
            if (newCardsLearned >= 5) {
                achievementPromises.push(
                    achievementService.unlockAchievement(
                        userId,
                        'Getting Started',
                        'Learned 5 flashcards'
                    )
                );
            }
            
            // Complete a Deck achievement
            if (newCardsLearned === totalCards) {
                achievementPromises.push(
                    achievementService.unlockAchievement(
                        userId,
                        'Deck Master',
                        'Completed an entire flashcard deck'
                    )
                );
            }
            
            // Execute all achievement unlocks in parallel
            await Promise.allSettled(achievementPromises);
            
            // Save achievements locally as fallback
            const localAchievements = [
                {
                    title: 'First Steps',
                    description: 'Started your first study session'
                }
            ];
            
            if (newCardsLearned === 1) {
                localAchievements.push({
                    title: 'Learning Begins',
                    description: 'Marked your first flashcard as learned'
                });
            }
            
            if (newCardsLearned >= 5) {
                localAchievements.push({
                    title: 'Getting Started',
                    description: 'Learned 5 flashcards'
                });
            }
            
            if (newCardsLearned === totalCards) {
                localAchievements.push({
                    title: 'Deck Master',
                    description: 'Completed an entire flashcard deck'
                });
            }
            
            // Save all local achievements at once
            localAchievements.forEach(achievement => {
                achievementService.saveAchievementsLocally(userId, achievement);
            });
            
        } catch (error) {
            // Save achievements locally as fallback
            if (user) {
                const userId = user.id || user.userId;
                
                achievementService.saveAchievementsLocally(userId, {
                    title: 'First Steps',
                    description: 'Started your first study session'
                });
                
                if (newCardsLearned === 1) {
                    achievementService.saveAchievementsLocally(userId, {
                        title: 'Learning Begins',
                        description: 'Marked your first flashcard as learned'
                    });
                }
                
                if (newCardsLearned >= 5) {
                    achievementService.saveAchievementsLocally(userId, {
                        title: 'Getting Started',
                        description: 'Learned 5 flashcards'
                    });
                }
                
                if (newCardsLearned === totalCards) {
                    achievementService.saveAchievementsLocally(userId, {
                        title: 'Deck Master',
                        description: 'Completed an entire flashcard deck'
                    });
                }
            }
        }
    }, [user]);

    const handleMarkLearned = useCallback(async () => {
        const currentCard = flashcards[currentIndex];
        if (!currentCard) return;

        try {
            // Don't count if already learned
            const isNewlyLearned = !currentCard.learned;
            
            await flashcardService.updateFlashcard(currentCard.id, {
                ...currentCard,
                learned: true
            });
            
            // Update the local state
            setFlashcards(prevFlashcards => {
                const updatedFlashcards = [...prevFlashcards];
                updatedFlashcards[currentIndex] = {
                    ...currentCard,
                    learned: true
                };
                return updatedFlashcards;
            });
            
            // Only increment counter if card wasn't already learned
            if (isNewlyLearned) {
                const newCardsLearned = cardsLearned + 1;
                setCardsLearned(newCardsLearned);
                
                // Check for achievements
                checkAndUnlockAchievements(newCardsLearned, flashcards.length);
            }
            
            // Move to next card
            if (currentIndex < flashcards.length - 1) {
                handleNext();
            }
        } catch (error) {
            alert('Failed to mark card as learned');
        }
    }, [currentIndex, flashcards, cardsLearned, checkAndUnlockAchievements, handleNext]);

    const handleClose = useCallback(() => {
        navigate(`/decks/${deckId}`);
    }, [navigate, deckId]);

    // Calculate progress percentage only when cardsLearned or flashcards length changes
    const progressPercentage = useMemo(() => {
        return flashcards.length > 0 ? Math.round((cardsLearned / flashcards.length) * 100) : 0;
    }, [cardsLearned, flashcards.length]);

    // Memoize the current flashcard to prevent unnecessary re-renders
    const currentFlashcard = useMemo(() => {
        return flashcards[currentIndex] || null;
    }, [flashcards, currentIndex]);

    // Determine animation classes based on optimization settings
    const getAnimationClasses = useMemo(() => {
        const baseClass = "absolute w-full h-full backface-hidden";
        
        // If animations are enabled, use the full transition effects
        if (optimizationSettings.useAnimations) {
            return {
                frontSide: `${baseClass} transition-all duration-500 ${flipped ? 'opacity-0 rotate-y-180' : 'opacity-100'}`,
                backSide: `${baseClass} transition-all duration-500 ${flipped ? 'opacity-100' : 'opacity-0 rotate-y-180'}`
            };
        }
        
        // Otherwise use simplified transitions with no rotation animations
        return {
            frontSide: `${baseClass} ${flipped ? 'hidden' : 'block'}`,
            backSide: `${baseClass} ${flipped ? 'block' : 'hidden'}`
        };
    }, [flipped, optimizationSettings.useAnimations]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-xl text-purple-600 animate-pulse">Loading flashcards...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                    <p className="text-gray-600 mb-4">There was a problem loading the study session. Please try again.</p>
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white px-4 py-2 rounded shadow-sm hover:shadow transition-all duration-200"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (flashcards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <div className="mb-6 w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">No Flashcards</h2>
                    <p className="text-gray-600 mb-6">This deck doesn't have any flashcards yet.</p>
                    <button 
                        onClick={handleClose}
                        className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white px-6 py-2 rounded shadow-sm hover:shadow transition-all duration-200"
                    >
                        Back to Deck
                    </button>
                </div>
            </div>
        );
    }

    if (!currentFlashcard) {
        return null; // Avoid rendering errors if currentFlashcard is not available
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden ${optimizationSettings.useShadowEffects ? 'shadow-xl' : 'border border-gray-300'}`}>
                <div className="p-4 flex justify-between items-center bg-gradient-to-r from-purple-600 to-orange-500">
                    <h3 className="text-lg font-bold text-white">{deckTitle} - Study Mode</h3>
                    <button 
                        className="text-white hover:text-gray-200 transition-colors"
                        onClick={handleClose}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                
                {/* Progress indicator */}
                <div className="px-5 pt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress: {cardsLearned}/{flashcards.length} cards learned</span>
                        <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                            className={`bg-green-500 h-1.5 rounded-full ${optimizationSettings.useAnimations ? 'transition-all duration-300' : ''}`}
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
                
                {/* Flashcard */}
                <div className="p-5">
                    <div 
                        className="h-64 w-full cursor-pointer relative rounded-lg overflow-hidden"
                        onClick={toggleFlip}
                    >
                        <div 
                            className={getAnimationClasses.frontSide}
                            style={{
                                backfaceVisibility: "hidden",
                                transform: flipped && optimizationSettings.useAnimations ? "rotateY(180deg)" : "rotateY(0deg)",
                                transformStyle: optimizationSettings.useAnimations ? "preserve-3d" : "flat",
                            }}
                        >
                            <div className={`bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex flex-col items-center justify-center p-6 text-center h-full border border-purple-200 ${optimizationSettings.useShadowEffects ? 'shadow-inner' : ''}`}>
                                <h4 className="text-purple-800 text-xl font-medium mb-4">{currentFlashcard.term}</h4>
                                <div className="mt-auto">
                                    <p className="text-purple-600 text-sm flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                        Click to see answer
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div 
                            className={getAnimationClasses.backSide}
                            style={{
                                backfaceVisibility: "hidden",
                                transform: flipped && optimizationSettings.useAnimations ? "rotateY(0deg)" : "rotateY(-180deg)",
                                transformStyle: optimizationSettings.useAnimations ? "preserve-3d" : "flat"
                            }}
                        >
                            <div className={`bg-gradient-to-br from-orange-100 to-yellow-50 rounded-lg flex flex-col items-center justify-center p-6 text-center h-full border border-orange-200 ${optimizationSettings.useShadowEffects ? 'shadow-inner' : ''}`}>
                                <p className="text-gray-800 text-lg">{currentFlashcard.definition}</p>
                                <div className="mt-auto">
                                    <p className="text-orange-600 text-sm flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                        Click to see question
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Card status */}
                    <div className="flex justify-center mt-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            currentFlashcard.learned 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                            {currentFlashcard.learned ? 'Learned' : 'Learning'}
                        </span>
                    </div>
                    
                    {/* Navigation controls */}
                    <div className="flex justify-between mt-5">
                        <div className="flex items-center">
                            <button 
                                className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200 transition-colors text-purple-700"
                                onClick={handlePrevious}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-gray-700 mx-4 font-medium">{currentIndex + 1} / {flashcards.length}</span>
                            <button 
                                className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200 transition-colors text-purple-700"
                                onClick={handleNext}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        
                        <button 
                            className={`px-4 py-2 rounded-md font-medium ${
                                currentFlashcard.learned
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600 transition-colors'
                            }`}
                            onClick={handleMarkLearned}
                            disabled={currentFlashcard.learned}
                        >
                            {currentFlashcard.learned ? 'Already Learned' : 'Mark as Learned'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudyDeck; 