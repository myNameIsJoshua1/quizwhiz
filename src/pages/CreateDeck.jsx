import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { flashcardService } from '../services/flashcardService';
import { useUser } from '../contexts/UserContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import UserNavbar from '../components/UserNavbar';

// Flashcard structure comment
// { term: string, definition: string }

const CreateDeck = () => {
    const navigate = useNavigate();
    const { user: contextUser } = useUser();
    const [user, setUser] = useState(contextUser);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Initialize deck data with empty flashcards
    const [deckData, setDeckData] = useState({
        title: '',
        description: '',
        category: '',
        flashcards: [
            { term: '', definition: '' },
            { term: '', definition: '' }
        ]
    });

    // Ensure we have user data - fallback to localStorage if needed
    useEffect(() => {
        console.log("CreateDeck - Context user:", contextUser);
        if (!contextUser) {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    console.log('CreateDeck - Loaded user from localStorage:', userData);
                    setUser(userData);
                }
            } catch (err) {
                console.error('Failed to parse user from localStorage:', err);
            }
        } else {
            setUser(contextUser);
        }
    }, [contextUser]);

    // Verify authentication on component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        console.log("CreateDeck - Authentication check:", { 
            hasToken: !!token, 
            hasUserData: !!userData,
            user 
        });
        
        if (!token || !userData) {
            console.error("CreateDeck - Not authenticated, redirecting to login");
            navigate('/login');
        }
    }, [navigate, user]);

    // Handle input change for deck information
    const handleDeckChange = (e) => {
        const { name, value } = e.target;
        setDeckData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle flashcard changes
    const handleFlashcardChange = (index, field, value) => {
        const updatedFlashcards = [...deckData.flashcards];
        updatedFlashcards[index] = {
            ...updatedFlashcards[index],
            [field]: value
        };
        setDeckData(prev => ({
            ...prev,
            flashcards: updatedFlashcards
        }));
    };

    // Add a new empty flashcard
    const addFlashcard = () => {
        setDeckData(prev => ({
            ...prev,
            flashcards: [...prev.flashcards, { term: '', definition: '' }]
        }));
    };

    // Remove a flashcard
    const removeFlashcard = (index) => {
        if (deckData.flashcards.length <= 1) {
            setError('You need at least one flashcard');
            return;
        }

        const updatedFlashcards = deckData.flashcards.filter((_, i) => i !== index);
        setDeckData(prev => ({
            ...prev,
            flashcards: updatedFlashcards
        }));
    };

    // Submit the deck with flashcards
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            // Validate deck data
            if (!deckData.title.trim()) {
                throw new Error('Title is required');
            }

            // Validate flashcards - filter valid ones
            const validFlashcards = deckData.flashcards.filter(card => 
                card.term.trim() && card.definition.trim()
            );

            if (validFlashcards.length === 0) {
                throw new Error('Please create at least one flashcard with both question and answer');
            }

            // Get user ID - try multiple sources
            let userId;
            if (user?.id || user?.userId) {
                userId = user.id || user.userId;
            } else {
                // Fallback to localStorage
                try {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const userData = JSON.parse(storedUser);
                        userId = userData.id || userData.userId;
                    }
                } catch (err) {
                    console.error('Failed to get userId from localStorage:', err);
                }
            }

            if (!userId) {
                throw new Error('You need to be logged in to create a deck');
            }

            console.log('Creating deck for user ID:', userId);
            
            // Add token to request headers for authentication (should be handled by api.js interceptor)
            // Check token is available
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found. Please log in again.');
            }

            // Create the deck with minimum required fields matching your Spring backend
            const deckPayload = {
                title: deckData.title,
                description: deckData.description || "",
                category: deckData.category || "General",
                userId: userId,
                cardCount: validFlashcards.length
            };
            
            console.log('Sending deck payload:', deckPayload);
            
            // Create the deck in the backend
            const newDeck = await flashcardService.createDeck(deckPayload);
            console.log('Created new deck:', newDeck);

            // Create flashcards for the deck
            const flashcardPromises = validFlashcards.map(card => 
                flashcardService.createFlashcard({
                    deckId: newDeck.id,
                    term: card.term,
                    definition: card.definition,
                    learned: false,
                    userId: userId
                })
            );

            await Promise.all(flashcardPromises);
            
            setSuccess('Your flashcard deck has been created successfully!');
            
            // Navigate to the new deck after a short delay
            setTimeout(() => {
                navigate(`/decks/${newDeck.id}`);
            }, 1500);
        } catch (err) {
            console.error('Failed to create deck:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                // Authentication error
                setError('Authentication error. Please log in again.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(err.message || 'Failed to create deck. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <UserNavbar user={user} isLoggedIn={!!user} onLogout={() => {}} />
            
            <div className="max-w-5xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Create New Flashcard Deck</h1>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Deck Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Deck Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={deckData.title}
                                    onChange={handleDeckChange}
                                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter deck title"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={deckData.description}
                                    onChange={handleDeckChange}
                                    rows="3"
                                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Describe what this deck is about"
                                ></textarea>
                            </div>
                            
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={deckData.category}
                                    onChange={handleDeckChange}
                                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select a category</option>
                                    <option value="Language">Language</option>
                                    <option value="Science">Science</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="History">History</option>
                                    <option value="Geography">Geography</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Flashcards Editor Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Flashcards</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {deckData.flashcards.map((flashcard, index) => (
                                <div key={index} className="p-4 border rounded-md bg-white">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-medium">Card {index + 1}</h3>
                                        <button
                                            type="button"
                                            onClick={() => removeFlashcard(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Question
                                            </label>
                                            <input
                                                type="text"
                                                value={flashcard.term}
                                                onChange={(e) => handleFlashcardChange(index, 'term', e.target.value)}
                                                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter question"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Answer
                                            </label>
                                            <textarea
                                                value={flashcard.definition}
                                                onChange={(e) => handleFlashcardChange(index, 'definition', e.target.value)}
                                                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                rows="2"
                                                placeholder="Enter answer"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addFlashcard}
                                className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition"
                            >
                                + Add Another Card
                            </button>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between pt-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 border rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Deck'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateDeck; 