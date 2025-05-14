import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardService } from '../services/flashcardService';

const DeckFlashcards = () => {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const [flashcards, setFlashcards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deckTitle, setDeckTitle] = useState('');
    const [deckOwnedByCurrentUser, setDeckOwnedByCurrentUser] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load deck info to get the title
                const deckInfo = await flashcardService.getDeck(deckId);
                setDeckTitle(deckInfo.title);
                
                // Check if the current user owns this deck
                const userData = localStorage.getItem('user');
                if (userData) {
                    const currentUser = JSON.parse(userData);
                    setDeckOwnedByCurrentUser(deckInfo.userId === (currentUser.id || currentUser.userId));
                }
                
                // Load flashcards
                const cards = await flashcardService.getFlashcards(deckId);
                setFlashcards(cards);
            } catch (error) {
                console.error('Error loading deck data:', error);
                setError('Failed to fetch deck data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [deckId]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this flashcard?')) return;

        try {
            await flashcardService.deleteFlashcard(id);
            setFlashcards(flashcards.filter((flashcard) => flashcard.id !== id));
        } catch (error) {
            alert('Failed to delete flashcard');
        }
    };
    
    const handleDeleteDeck = async () => {
        if (!window.confirm(`Are you sure you want to delete the deck "${deckTitle}"? This will also delete all flashcards in this deck.`)) return;

        try {
            await flashcardService.deleteDeck(deckId);
            // Show success message
            alert('Deck deleted successfully');
            // Navigate back to decks list
            navigate('/decks');
        } catch (error) {
            console.error('Failed to delete deck:', error);
            alert('Failed to delete deck');
        }
    };
    
    const toggleLearned = async (id, currentLearnedStatus) => {
        try {
            await flashcardService.updateFlashcard(id, {
                ...flashcards.find(f => f.id === id),
                learned: !currentLearnedStatus
            });
            
            // Update the local state
            setFlashcards(flashcards.map(flashcard => 
                flashcard.id === id 
                    ? { ...flashcard, learned: !currentLearnedStatus } 
                    : flashcard
            ));
        } catch (error) {
            console.error('Failed to update flashcard:', error);
            alert('Failed to update flashcard status');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="text-xl text-purple-600 animate-pulse">Loading flashcards...</div>
        </div>
    );
    
    if (error) return (
        <div className="max-w-lg mx-auto mt-10 rounded-lg p-4 shadow-md bg-white">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
            </div>
            <button 
                onClick={() => navigate('/dashboard')}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white rounded-md shadow-sm transition-all duration-200"
            >
                Return to Dashboard
            </button>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-6xl mx-auto">
            {/* Header with gradient background */}
            <div className="mb-6 bg-gradient-to-tr from-purple-800 via-orange-500 to-yellow-400 rounded-lg p-6 shadow-md">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">{deckTitle || `Deck ${deckId}`}</h1>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => {
                                if (deckId) {
                                    navigate(`/quiz/${deckId}`);
                                } else {
                                    alert('Cannot start quiz: Invalid deck ID');
                                }
                            }}
                            className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-md transition-colors shadow-sm text-sm font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Take Quiz
                        </button>
                        <button
                            onClick={() => {
                                if (deckId) {
                                    navigate(`/study/${deckId}`);
                                } else {
                                    alert('Cannot start study session: Invalid deck ID');
                                }
                            }}
                            className="flex items-center px-4 py-2 bg-white text-purple-700 hover:bg-purple-50 rounded-md shadow-sm transition-colors text-sm font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Study Deck
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button
                        onClick={() => navigate(-1)} // Navigate back to the previous page
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:shadow transition-all duration-200"
                    >
                        <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </span>
                    </button>
                </div>
                
                {deckOwnedByCurrentUser && (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => navigate(`/decks/${deckId}/edit`)}
                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-md transition-colors flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Deck
                        </button>
                        <button
                            onClick={handleDeleteDeck}
                            className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-md transition-colors flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Deck
                        </button>
                    </div>
                )}
            </div>
            
            {flashcards.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg shadow-inner">
                    <div className="max-w-md mx-auto">
                        <div className="mb-6 w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 mb-6">No flashcards found in this deck.</p>
                        <button
                            onClick={() => navigate(`/decks/${deckId}/edit`)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white rounded-md shadow-sm hover:shadow transition-all duration-200"
                        >
                            Create Flashcards
                        </button>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-purple-50 to-orange-50">
                                <th className="border-b border-gray-200 px-6 py-3 text-left text-sm font-semibold text-gray-700">Question</th>
                                <th className="border-b border-gray-200 px-6 py-3 text-left text-sm font-semibold text-gray-700">Answer</th>
                                <th className="border-b border-gray-200 px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                                <th className="border-b border-gray-200 px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {flashcards.map((flashcard) => (
                                <tr key={flashcard.id} className={`hover:bg-gray-50 ${flashcard.learned ? 'bg-green-50/50' : ''}`}>
                                    <td className="px-6 py-4 text-sm text-gray-800">{flashcard.term}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{flashcard.definition}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span 
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                flashcard.learned 
                                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                            }`}
                                        >
                                            {flashcard.learned 
                                                ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                  </svg>
                                                : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                  </svg>
                                            }
                                            {flashcard.learned ? 'Learned' : 'Learning'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button
                                                onClick={() => toggleLearned(flashcard.id, flashcard.learned)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                                                    flashcard.learned 
                                                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200' 
                                                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                                } transition-colors`}
                                            >
                                                {flashcard.learned ? 'Mark as Learning' : 'Mark as Learned'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(flashcard.id)}
                                                className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DeckFlashcards;